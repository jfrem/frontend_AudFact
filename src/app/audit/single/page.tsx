'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Dispensation, Attachment } from '@/lib/types';
import { DocumentViewerDialog } from '@/components/document-viewer';
import { DispensationLinesTable } from '@/components/audit/dispensation-lines-table';
import { AuditResultSummary } from '@/components/audit/audit-result-summary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Search, Play, FileText, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

export interface AuditResponse {
    response: string;       // 'success', 'warning', 'error'
    severity?: string;      // 'ninguna', 'baja', 'media', 'alta'
    message: string;        // Resumen técnico objetivo
    data: {
        items: Array<{
            item: string;
            detalle: string;
            documento: string;
            severidad: string;
        }>;
    };
    _errorOrigin?: string;  // 'business', 'gemini'
    metrics?: {
        TotalCamposEvaluados: number;
        TotalCoincidentes: number;
        TotalDiscrepancias: number;
    };
}

interface SelectedDocument {
    id: string;
    name: string;
}

function normalizeText(value: string): string {
    return value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function findAttachmentForDocumentLabel(
    documentLabel: string,
    docs: Attachment[]
): Attachment | null {
    const normalizedLabel = normalizeText(documentLabel);
    if (!normalizedLabel) {
        return null;
    }

    const exactOrContainsMatch = docs.find((doc) => {
        const docName = normalizeText(doc.nombre_documento || '');
        const altName = normalizeText(doc.nombre_alternativo || '');
        return (
            docName.includes(normalizedLabel) ||
            normalizedLabel.includes(docName) ||
            (altName !== '' && (altName.includes(normalizedLabel) || normalizedLabel.includes(altName)))
        );
    });

    return exactOrContainsMatch || null;
}

function AuditSingleContent() {
    const searchParams = useSearchParams();
    const initialFactura = searchParams.get('factura') || '';

    const [disDetNro, setDisDetNro] = useState(initialFactura);
    const [activeSearch, setActiveSearch] = useState(initialFactura);
    const [auditResult, setAuditResult] = useState<AuditResponse | null>(null);
    const [viewingDoc, setViewingDoc] = useState<SelectedDocument | null>(null);
    const [showFullDetails, setShowFullDetails] = useState(false);

    // 1. Fetch Dispensation details
    const { data: dispData, isLoading: isLoadingDisp } = useQuery({
        queryKey: ['dispensation', activeSearch],
        queryFn: () =>
            api.get<Dispensation[]>(`/dispensation/${activeSearch}`),
        enabled: !!activeSearch,
    });

    const dispensations = dispData?.data || [];
    const dispensation = dispensations[0];

    // 2. Fetch Attachments if Dispensation exists
    const { data: attachData, isLoading: isLoadingAttach } = useQuery({
        queryKey: ['attachments', dispensation?.FacSec],
        queryFn: () =>
            api.get<Attachment[]>(
                `/dispensation/${dispensation?.NumeroFactura}/attachments/${dispensation?.NitSec}`
            ),
        enabled: !!dispensation?.FacSec && !!dispensation?.NitSec,
    });

    const attachments = attachData?.data || [];

    // 3. Mutation to Run Audit
    const auditMutation = useMutation({
        mutationFn: (id: string) =>
            api.post<AuditResponse>('/audit/single', {
                DisDetNro: id
            }),
        onSuccess: (res) => {
            const resultData = res.data;
            // Si el error originó antes de correr el modelo de IA (ej: validaciones de negocio o pipeline nulo)
            if (resultData?._errorOrigin === 'business' || resultData?._errorOrigin === 'pipeline' || (resultData?.response === 'error' && !resultData?._errorOrigin && (!resultData?.data?.items || resultData?.data?.items.length === 0))) {
                toast.error(resultData.message || 'Error en la ejecución de auditoría', {
                    description: resultData._errorOrigin ? `Origen reportado: ${resultData._errorOrigin}` : undefined
                });
                setAuditResult(null);
            }
            // Si la data del modelo de Gemini existe o _errorOrigin es 'gemini' (IA ejecutada con hallazgos críticos)
            else if (resultData) {
                setAuditResult(resultData as AuditResponse);

                // Dispara un toast informando que terminó
                if (resultData.response === 'success') {
                    toast.success('Auditoría ejecutada', { description: 'Revisión finalizada sin discrepancias críticas.' });
                } else if (resultData.response === 'error') {
                    toast.warning('Auditoría completada', { description: 'Se encontraron discrepancias en los documentos analizados.' });
                } else {
                    toast.info('Auditoría completada', { description: 'Revisa el modal para mayor detalle.' });
                }
            }
        },
        onError: (err: unknown) => {
            const message = err instanceof Error ? err.message : 'No se pudo establecer conexión con el motor de auditoría';
            toast.error('Error de conexión', {
                description: message,
            });
            setAuditResult(null);
        }
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (disDetNro.trim()) {
            setActiveSearch(disDetNro.trim());
            setAuditResult(null);
            setShowFullDetails(false);
        }
    };

    const handleRunAudit = () => {
        if (dispensation?.NumeroFactura) {
            auditMutation.mutate(dispensation.NumeroFactura);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Search Section */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4">
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Auditoría Individual</CardTitle>
                        <CardDescription>
                            Busca una dispensación por su ID (ej. D02260101795) para auditar sus documentos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-3 w-full">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="ID de Dispensación (ej. D02260101795)..."
                                    value={disDetNro}
                                    onChange={(e) => setDisDetNro(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button type="submit" disabled={isLoadingDisp}>
                                Buscar
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Ejecución IA</CardTitle>
                        <CardDescription>
                            Acción principal y KPIs operativos de la factura cargada.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button
                            className="w-full gap-2"
                            size="lg"
                            disabled={!dispensation || attachments.length === 0 || auditMutation.isPending}
                            onClick={handleRunAudit}
                        >
                            {auditMutation.isPending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                    Analizando...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 fill-current" />
                                    Auditar Factura
                                </>
                            )}
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-md border border-border/40 bg-background/70 p-2">
                                <p className="text-[11px] text-muted-foreground">Soportes</p>
                                <p className="text-sm font-semibold">{attachments.length}</p>
                            </div>
                            <div className="rounded-md border border-border/40 bg-background/70 p-2">
                                <p className="text-[11px] text-muted-foreground">Líneas</p>
                                <p className="text-sm font-semibold">{dispensations.length}</p>
                            </div>
                        </div>
                        {attachments.length === 0 && dispensation && !isLoadingAttach && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                No hay documentos para analizar.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Results Section */}
            {activeSearch && (
                <div className="grid grid-cols-1 gap-6 items-start">
                    {/* Main Content (Dispensation Info & Documents) */}
                    <div className="space-y-6">
                        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Detalles de la Factura</CardTitle>
                                <CardDescription>
                                    Resumen ejecutivo para validar rápidamente el contexto antes de ejecutar auditoría.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingDisp ? (
                                    <Skeleton className="h-24 w-full" />
                                ) : dispensation ? (
                                    <div className="space-y-4 text-sm">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                            <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2">
                                                <p className="text-muted-foreground text-xs">ID Interno</p>
                                                <p className="font-medium font-mono text-xs">{dispensation.FacSec}</p>
                                            </div>
                                            <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2">
                                                <p className="text-muted-foreground text-xs">Nro. Factura</p>
                                                <p className="font-medium">{dispensation.NumeroFactura || '-'}</p>
                                            </div>
                                            <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2">
                                                <p className="text-muted-foreground text-xs">NIT Cliente</p>
                                                <p className="font-medium">{dispensation.NitSec || '-'}</p>
                                            </div>
                                            <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2">
                                                <p className="text-muted-foreground text-xs">Líneas de dispensación</p>
                                                <p className="font-medium">{dispensations.length}</p>
                                            </div>
                                        </div>

                                        <div className="rounded-lg border border-border/40 bg-background/60 p-3">
                                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Resumen de contexto</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                <p><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{dispensation.Cliente || '—'}</span></p>
                                                <p><span className="text-muted-foreground">Paciente:</span> <span className="font-medium">{dispensation.NombrePaciente || '—'}</span></p>
                                                <p><span className="text-muted-foreground">IPS:</span> <span className="font-medium">{dispensation.IPS || '—'}</span></p>
                                                <p><span className="text-muted-foreground">Diagnóstico:</span> <span className="font-medium">{dispensation.CodigoDiagnostico || '—'}</span></p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="mt-3 h-7 text-[11px]"
                                                onClick={() => setShowFullDetails((prev) => !prev)}
                                            >
                                                {showFullDetails ? 'Ocultar detalle completo' : 'Ver detalle completo'}
                                            </Button>
                                        </div>

                                        {showFullDetails && (
                                            <>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                                    <div className="rounded-lg border border-border/40 bg-background/60 p-3">
                                                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Administrativo</p>
                                                        <div className="space-y-1.5 text-xs">
                                                            <p><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{dispensation.Cliente || '—'}</span></p>
                                                            <p><span className="text-muted-foreground">IPS:</span> <span className="font-medium">{dispensation.IPS || '—'}</span></p>
                                                            <p><span className="text-muted-foreground">IPS NIT:</span> <span className="font-medium">{dispensation.IPS_NIT || '—'}</span></p>
                                                            <p><span className="text-muted-foreground">Tipo servicio:</span> <span className="font-medium">{dispensation.Tipo || '—'}</span></p>
                                                            <p><span className="text-muted-foreground">Autorización:</span> <span className="font-medium">{dispensation.NumeroAutorizacion || '—'}</span></p>
                                                        </div>
                                                    </div>

                                                    <div className="rounded-lg border border-border/40 bg-background/60 p-3">
                                                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Paciente</p>
                                                        <div className="space-y-1.5 text-xs">
                                                            <p><span className="text-muted-foreground">Nombre:</span> <span className="font-medium">{dispensation.NombrePaciente || '—'}</span></p>
                                                            <p>
                                                                <span className="text-muted-foreground">Documento:</span>{' '}
                                                                <span className="font-medium">
                                                                    {dispensation.TipoDocumentoPaciente || '—'} {dispensation.DocumentoPaciente || ''}
                                                                </span>
                                                            </p>
                                                            <p><span className="text-muted-foreground">Régimen:</span> <span className="font-medium">{dispensation.RegimenPaciente || '—'}</span></p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                                    <div className="rounded-lg border border-border/40 bg-background/60 p-3">
                                                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Médico y diagnóstico</p>
                                                        <div className="space-y-1.5 text-xs">
                                                            <p><span className="text-muted-foreground">Médico:</span> <span className="font-medium">{dispensation.Medico || '—'}</span></p>
                                                            <p>
                                                                <span className="text-muted-foreground">Documento:</span>{' '}
                                                                <span className="font-medium">
                                                                    {dispensation.TipoDocumentoMedico || '—'} {dispensation.DocumentoMedico || ''}
                                                                </span>
                                                            </p>
                                                            <p><span className="text-muted-foreground">Diagnóstico:</span> <span className="font-medium">{dispensation.CodigoDiagnostico || '—'}</span></p>
                                                        </div>
                                                    </div>

                                                    <div className="rounded-lg border border-border/40 bg-background/60 p-3">
                                                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Fechas</p>
                                                        <div className="space-y-1.5 text-xs">
                                                            <p><span className="text-muted-foreground">Entrega:</span> <span className="font-medium">{dispensation.FechaEntrega || '—'}</span></p>
                                                            <p><span className="text-muted-foreground">Fórmula:</span> <span className="font-medium">{dispensation.FechaFormula || '—'}</span></p>
                                                            <p><span className="text-muted-foreground">Autorización:</span> <span className="font-medium">{dispensation.FechaAutorizacion || '—'}</span></p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">No se encontró la factura {activeSearch}</p>
                                )}
                            </CardContent>
                        </Card>

                        {dispensation && (
                            <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <CardTitle className="text-lg">Respuesta endpoint /dispensation</CardTitle>
                                    <Badge variant="outline">{dispensations.length} líneas</Badge>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <DispensationLinesTable rows={dispensations} />
                                </CardContent>
                            </Card>
                        )}

                        {dispensation && (
                            <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <CardTitle className="text-lg">Soportes Documentales</CardTitle>
                                    <Badge variant="outline">{attachments.length} archivos</Badge>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Documento</TableHead>
                                                <TableHead>Tipo</TableHead>
                                                <TableHead className="w-24 text-right">Acción</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoadingAttach ? (
                                                Array.from({ length: 3 }).map((_, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                        <TableCell><Skeleton className="h-7 w-14 ml-auto" /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : attachments.length > 0 ? (
                                                attachments.map((doc) => (
                                                    <TableRow key={doc.id_documento}>
                                                        <TableCell className="font-medium flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                                            <span className="truncate max-w-[250px]" title={doc.nombre_documento}>
                                                                {doc.nombre_documento}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary" className="text-[10px]">
                                                                {doc.TipoAlmacenamiento}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 px-2 text-[11px]"
                                                                onClick={() => {
                                                                    setViewingDoc({
                                                                        id: doc.id_documento,
                                                                        name: doc.nombre_documento,
                                                                    });
                                                                }}
                                                            >
                                                                <Eye className="w-3.5 h-3.5 mr-1" />
                                                                Ver
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                                                        No se encontraron soportes asociados.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                </div>
            )}

            {/* Audit Result Modal */}
            <Dialog open={!!auditResult} onOpenChange={(open) => {
                if (!open) {
                    setAuditResult(null);
                    setViewingDoc(null);
                }
            }}>
                <DialogContent className="w-full max-w-6xl sm:max-w-6xl max-h-[92vh] overflow-y-auto bg-background/95 backdrop-blur-md border-border/50 shadow-2xl">
                    <DialogHeader className="pb-4 border-b border-border/40">
                        <DialogTitle className="flex items-center gap-2 text-2xl font-semibold">
                            {auditResult?.response?.toLowerCase() === 'success' ? (
                                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                            ) : (
                                <AlertCircle className="w-7 h-7 text-rose-500" />
                            )}
                            Resultado de Auditoría Inteligente
                        </DialogTitle>
                    </DialogHeader>

                    {
                        auditResult && (
                            <div className="space-y-8 mt-2">
                                <AuditResultSummary result={auditResult} />

                                {/* Document Details (Items Grid) */}
                                {auditResult.data?.items && auditResult.data.items.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-foreground/90">Hallazgos y Discrepancias Detectadas</h4>
                                            <Badge variant="outline" className="text-xs">{auditResult.data.items.length} items</Badge>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {auditResult.data.items.map((item, idx) => {
                                                const matchedAttachment = findAttachmentForDocumentLabel(item.documento, attachments);
                                                const canOpenViewer = !!matchedAttachment && !!dispensation?.NumeroFactura;
                                                return (
                                                    <Card key={idx} className="border-border/60 bg-card/40 backdrop-blur-sm hover:bg-card/80 hover:shadow-md transition-all">
                                                        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-muted/40 border-b border-border/50">
                                                            <p className="text-sm font-medium truncate pr-4 text-foreground/90">{item.item}</p>
                                                            <Badge variant={item.severidad.toLowerCase() === 'baja' ? 'secondary' : 'destructive'} className="text-[10px] capitalize shrink-0">
                                                                {item.severidad}
                                                            </Badge>
                                                        </CardHeader>
                                                        <CardContent className="p-4 flex flex-col justify-between h-[calc(100%-45px)]">
                                                            <p className="text-sm text-foreground/80 leading-relaxed mb-4">{item.detalle}</p>
                                                            <div className="text-xs mt-auto flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50 border border-border/30">
                                                                <span className="flex items-center gap-1.5 min-w-0">
                                                                    <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                                    <span className="text-muted-foreground truncate">
                                                                        Origen: <strong className="font-semibold text-foreground/70">{item.documento}</strong>
                                                                    </span>
                                                                </span>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 px-2 text-[11px] shrink-0"
                                                                    title={canOpenViewer ? 'Abrir soporte' : 'No se encontró un adjunto asociado al origen'}
                                                                    disabled={!canOpenViewer}
                                                                    onClick={() => {
                                                                        if (!canOpenViewer || !matchedAttachment) {
                                                                            return;
                                                                        }
                                                                        setViewingDoc({
                                                                            id: matchedAttachment.id_documento,
                                                                            name: matchedAttachment.nombre_documento,
                                                                        });
                                                                    }}
                                                                >
                                                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                                                    Ver
                                                                </Button>
                                                            </div>
                                                            {!canOpenViewer && (
                                                                <p className="text-[11px] text-amber-400 mt-2">
                                                                    No se encontró coincidencia exacta entre el origen reportado y los adjuntos disponibles.
                                                                </p>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    }
                </DialogContent>
            </Dialog>

            {dispensation?.NumeroFactura && viewingDoc && (
                <DocumentViewerDialog
                    open={!!viewingDoc}
                    onOpenChange={(open) => {
                        if (!open) {
                            setViewingDoc(null);
                        }
                    }}
                    invoiceId={dispensation.NumeroFactura}
                    attachmentId={viewingDoc.id}
                    attachmentName={viewingDoc.name}
                />
            )}
        </div>
    );
}

export default function AuditSinglePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Cargando...</div>}>
            <AuditSingleContent />
        </Suspense>
    );
}
