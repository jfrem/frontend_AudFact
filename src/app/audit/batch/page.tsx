'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
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
    Play,
    CheckCircle2,
    AlertCircle,
    Database,
    Search,
    ChevronDown,
    Hash,
    X,
    Building2,
    CalendarDays,
    Zap,
    Eye,
    Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Attachment, Client, Dispensation } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DocumentViewerDialog } from '@/components/document-viewer';

import { createPortal } from 'react-dom';

// ── Combobox con búsqueda para Clientes ──
interface ClientComboboxProps {
    clients: Client[];
    value: string;
    onChange: (val: string) => void;
}

function ClientCombobox({ clients, value, onChange }: ClientComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [rect, setRect] = useState<DOMRect | null>(null);

    // Actualiza la posición del desplegable
    const updatePosition = useCallback(() => {
        if (open && triggerRef.current) {
            setRect(triggerRef.current.getBoundingClientRect());
        }
    }, [open]);

    useEffect(() => {
        updatePosition();
        if (open) {
            window.addEventListener('resize', updatePosition);
            // Capturamos eventos de scroll en cualquier ancestro
            window.addEventListener('scroll', updatePosition, true);
        }
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open, updatePosition]);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            // Check if click was inside trigger
            if (triggerRef.current && triggerRef.current.contains(e.target as Node)) {
                return;
            }
            // Check if click was inside portal content (by class or logic, but we can just use setOpen(false) since any click outside trigger & portal means close)
            // Wait, standard approach: add an ID to the portal content and check it
            const portalNode = document.getElementById('client-combobox-portal');
            if (portalNode && portalNode.contains(e.target as Node)) {
                return;
            }
            setOpen(false);
        }
        if (open) {
            document.addEventListener('mousedown', handleClick);
        }
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const filtered = useMemo(() => {
        if (!search.trim()) return clients;
        const q = search.toLowerCase();
        return clients.filter(
            (c) =>
                c.NitCom.toLowerCase().includes(q) ||
                c.NitSec.toLowerCase().includes(q)
        );
    }, [clients, search]);

    const selectedLabel = useMemo(() => {
        const found = clients.find((c) => c.NitSec === value);
        return found ? `${found.NitCom} (${found.NitSec})` : '';
    }, [clients, value]);

    const handleSelect = useCallback(
        (nitSec: string) => {
            onChange(nitSec);
            setOpen(false);
            setSearch('');
        },
        [onChange]
    );

    const handleClear = useCallback(() => {
        onChange('');
        setSearch('');
        setOpen(false);
    }, [onChange]);

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger */}
            <button
                ref={triggerRef}
                type="button"
                className={cn(
                    'flex items-center w-full min-h-[40px] px-3 py-2 rounded-md border border-input bg-background text-sm transition-colors',
                    'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    open && 'border-primary ring-2 ring-ring ring-offset-2',
                    !value && 'text-muted-foreground'
                )}
                onClick={() => {
                    setOpen(!open);
                    if (!open) {
                        setTimeout(() => inputRef.current?.focus(), 50);
                    }
                }}
            >
                <Building2 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-left truncate">
                    {value ? selectedLabel : 'Seleccionar EPS / Cliente...'}
                </span>
                {value ? (
                    <X
                        className="ml-1 h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClear();
                        }}
                    />
                ) : (
                    <ChevronDown className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
            </button>

            {/* Dropdown usando Portal */}
            {open && rect && typeof window !== 'undefined' && createPortal(
                <div
                    id="client-combobox-portal"
                    className="fixed z-[99999] mt-1 rounded-md border border-border bg-popover shadow-lg shadow-black/40 animate-in fade-in slide-in-from-top-2 duration-150"
                    style={{
                        top: `${rect.bottom}px`,
                        left: `${rect.left}px`,
                        width: `${Math.max(rect.width, 360)}px`,
                    }}
                >
                    {/* Search input */}
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="Buscar por nombre o NIT..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setOpen(false);
                                    setSearch('');
                                }
                            }}
                        />
                        {search && (
                            <X
                                className="h-3.5 w-3.5 text-muted-foreground cursor-pointer hover:text-foreground"
                                onClick={() => setSearch('')}
                            />
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[240px] overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                No se encontraron resultados
                            </div>
                        ) : (
                            filtered.map((client) => (
                                <button
                                    key={client.NitSec}
                                    type="button"
                                    className={cn(
                                        'flex items-center w-full px-3 py-2.5 text-sm transition-colors',
                                        'hover:bg-accent/50 cursor-pointer text-left',
                                        value === client.NitSec && 'bg-primary/10 text-primary font-medium'
                                    )}
                                    onClick={() => handleSelect(client.NitSec)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate font-medium">{client.NitCom}</p>
                                        <p className="text-xs text-muted-foreground font-mono">
                                            NIT: {client.NitSec}
                                        </p>
                                    </div>
                                    {value === client.NitSec && (
                                        <CheckCircle2 className="ml-2 h-4 w-4 shrink-0 text-primary" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

// ── Tipos para la respuesta real del batch ──
interface BatchResultItem {
    invoice: {
        Dispensa?: string;
        FacSec?: string;
    };
    result: {
        response?: string;
        message?: string;
        data?: { items?: AuditFinding[] };
    };
}

interface BatchAuditResponse {
    items: BatchResultItem[];
    stoppedEarly: boolean;
    totalRequested: number;
    totalProcessed: number;
}

interface AuditFinding {
    item: string;
    detalle: string;
    documento: string;
    severidad: string;
}

interface BatchFindingRow {
    rowId: string;
    invoiceId: string;
    finding: AuditFinding;
}

interface ViewerSelection {
    invoiceId: string;
    attachmentId: string;
    attachmentName: string;
}

function severityRank(severity?: string): number {
    const normalized = (severity || '').trim().toLowerCase();
    if (normalized === 'alta') return 0;
    if (normalized === 'media') return 1;
    if (normalized === 'baja') return 2;
    if (normalized === 'ninguna') return 3;
    return 4;
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

// ── Página ──
export default function AuditBatchPage() {
    const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [limit, setLimit] = useState<number>(10);
    const [viewingDoc, setViewingDoc] = useState<ViewerSelection | null>(null);
    const [resolvingKey, setResolvingKey] = useState<string | null>(null);
    const [viewerError, setViewerError] = useState<string | null>(null);
    const resolvedViewerCache = useRef<Record<string, ViewerSelection | null>>({});

    // 1. Fetch Clients
    const { data: clientsData, isLoading: isLoadingClients } = useQuery({
        queryKey: ['clients'],
        queryFn: () => api.get<Client[]>('/clients'),
    });
    const clients = clientsData?.data || [];

    // 2. Mutation to Run Batch Audit (Calls POST /audit)
    const batchMutation = useMutation({
        mutationFn: (args: { facNitSec: number; date: string; limit: number }) =>
            api.post<BatchAuditResponse>('/audit', args),
    });

    const handleRunBatch = () => {
        if (selectedClient && dateStr && limit > 0) {
            batchMutation.mutate({
                facNitSec: parseInt(selectedClient),
                date: dateStr,
                limit,
            });
        }
    };

    // Calcular resumen de resultados
    const resultSummary = useMemo(() => {
        if (!batchMutation.data?.data) return null;
        const data = batchMutation.data.data;
        const successCount = data.items.filter(
            (it) => it.result?.response !== 'error'
        ).length;
        const failedCount = data.items.filter(
            (it) => it.result?.response === 'error'
        ).length;
        return {
            totalProcessed: data.totalProcessed,
            totalRequested: data.totalRequested,
            success: successCount,
            failed: failedCount,
            stoppedEarly: data.stoppedEarly,
        };
    }, [batchMutation.data]);

    const findingRows = useMemo<BatchFindingRow[]>(() => {
        const items = batchMutation.data?.data?.items || [];
        const rows = items.flatMap((batchItem, batchIndex) => {
            const invoiceId = batchItem.invoice?.Dispensa || batchItem.invoice?.FacSec || '';
            const findings = batchItem.result?.data?.items || [];
            return findings.map((finding, findingIndex) => ({
                rowId: `${invoiceId || 'unknown'}-${batchIndex}-${findingIndex}`,
                invoiceId,
                finding,
            }));
        });
        return rows.sort((a, b) => severityRank(a.finding.severidad) - severityRank(b.finding.severidad));
    }, [batchMutation.data]);

    const resolveAndOpenViewer = async (invoiceId: string, documentLabel: string): Promise<void> => {
        if (!invoiceId || !documentLabel) {
            setViewerError('No se pudo identificar el documento o la factura para abrir el visor.');
            return;
        }

        const cacheKey = `${invoiceId}::${normalizeText(documentLabel)}`;
        const cached = resolvedViewerCache.current[cacheKey];
        if (cached) {
            setViewerError(null);
            setViewingDoc(cached);
            return;
        }
        if (cached === null) {
            setViewerError('No se encontró un adjunto asociado para el origen indicado.');
            return;
        }

        setResolvingKey(cacheKey);
        setViewerError(null);
        try {
            const dispRes = await api.get<Dispensation[]>(`/dispensation/${invoiceId}`);
            const dispensation = dispRes.data?.[0];
            if (!dispensation?.NitSec) {
                resolvedViewerCache.current[cacheKey] = null;
                setViewerError('No se pudo obtener el NIT de la factura para resolver adjuntos.');
                return;
            }

            const attachRes = await api.get<Attachment[]>(
                `/dispensation/${invoiceId}/attachments/${dispensation.NitSec}`
            );
            const matched = findAttachmentForDocumentLabel(documentLabel, attachRes.data || []);
            if (!matched?.id_documento) {
                resolvedViewerCache.current[cacheKey] = null;
                setViewerError('No se encontró un adjunto asociado para el origen indicado.');
                return;
            }

            const selection: ViewerSelection = {
                invoiceId,
                attachmentId: matched.id_documento,
                attachmentName: matched.nombre_documento || documentLabel,
            };
            resolvedViewerCache.current[cacheKey] = selection;
            setViewingDoc(selection);
        } catch (error) {
            setViewerError(error instanceof Error ? error.message : 'No se pudo abrir el documento.');
        } finally {
            setResolvingKey(null);
        }
    };

    const canExecute = !!selectedClient && !!dateStr && limit > 0 && limit <= 100;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Configuration Section */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-md">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        <div>
                            <CardTitle>Auditoría Masiva (Lotes)</CardTitle>
                            <CardDescription>
                                Ejecuta la auditoría con IA para un volumen alto de dispensaciones.
                                Selecciona cliente, fecha y cantidad de facturas a procesar.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* ... omitted for brevity in thought, but need whole block for tool */}
                        {/* 1) Cliente con buscador */}
                        <div className="space-y-2 md:col-span-1">
                            <label className="text-sm font-medium flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                EPS / Cliente
                            </label>
                            {isLoadingClients ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                <ClientCombobox
                                    clients={clients}
                                    value={selectedClient}
                                    onChange={setSelectedClient}
                                />
                            )}
                        </div>

                        {/* 2) Fecha */}
                        <div className="space-y-2">
                            <label htmlFor="batch-date" className="text-sm font-medium flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                                Fecha del Lote
                            </label>
                            <Input
                                id="batch-date"
                                type="date"
                                value={dateStr}
                                onChange={(e) => setDateStr(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* 3) Límite de facturas */}
                        <div className="space-y-2">
                            <label htmlFor="batch-limit" className="text-sm font-medium flex items-center gap-1.5">
                                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                                Facturas a procesar
                            </label>
                            <Input
                                id="batch-limit"
                                type="number"
                                min={1}
                                max={100}
                                value={limit}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value);
                                    if (!isNaN(v)) setLimit(Math.min(100, Math.max(1, v)));
                                }}
                                className="w-full font-mono"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Máximo 100 facturas por lote
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Execution Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Summary */}
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Database className="w-5 h-5 text-muted-foreground" />
                            Resumen de Ejecución
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="p-6 bg-muted/30 rounded-lg border border-border/50 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Cliente:</span>
                                <span className="font-medium truncate max-w-[180px]">
                                    {selectedClient
                                        ? clients.find((c) => c.NitSec === selectedClient)?.NitCom || selectedClient
                                        : '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Fecha:</span>
                                <span className="font-medium font-mono">{dateStr || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Facturas:</span>
                                <Badge variant="secondary" className="font-mono">
                                    {limit}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Control */}
                <Card className={cn(
                    'border-border/50 bg-card/60 backdrop-blur-sm transition-all',
                    canExecute && 'border-primary/20 bg-primary/5 shadow-lg shadow-primary/5'
                )}>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Play className="w-5 h-5" />
                            Control de Ejecución
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            El proceso invocará a Gemini IA para auditar cada factura. Puede tardar
                            varios minutos dependiendo del volumen seleccionado.
                        </p>
                        {!canExecute && (
                            <div className="text-xs text-amber-400 flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Completa todos los campos para habilitar la ejecución
                            </div>
                        )}
                        <Button
                            className="w-full gap-2"
                            size="lg"
                            disabled={!canExecute || batchMutation.isPending}
                            onClick={handleRunBatch}
                        >
                            {batchMutation.isPending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                    Procesando Lote...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 fill-current" />
                                    Iniciar Auditoría ({limit} facturas)
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Error de mutación */}
            {batchMutation.isError && (
                <Card className="border-rose-500/30 bg-rose-500/5">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-rose-500">Error al ejecutar la auditoría</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {batchMutation.error?.message || 'Error desconocido'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Results */}
            {batchMutation.isSuccess && resultSummary && (
                <Card className="border-emerald-500/30 bg-card/60 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            Resultados del Lote
                            {resultSummary.stoppedEarly && (
                                <Badge variant="secondary" className="text-amber-400 text-[10px] ml-2">
                                    Detenido por tiempo
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                                <p className="text-2xl font-bold tabular-nums">{resultSummary.totalProcessed}</p>
                                <p className="text-xs text-muted-foreground">
                                    Procesadas de {resultSummary.totalRequested}
                                </p>
                            </div>
                            <div className="p-4 bg-emerald-500/10 rounded-lg text-center">
                                <p className="text-2xl font-bold tabular-nums text-emerald-500">{resultSummary.success}</p>
                                <p className="text-xs text-emerald-500/80">Exitosos</p>
                            </div>
                            <div className="p-4 bg-rose-500/10 rounded-lg text-center">
                                <p className="text-2xl font-bold tabular-nums text-rose-500">{resultSummary.failed}</p>
                                <p className="text-xs text-rose-500/80">Fallidos</p>
                            </div>
                        </div>

                        {/* Detalle de errores */}
                        {batchMutation.data.data.items.some((it) => it.result?.response === 'error') && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold flex items-center gap-2 text-rose-500">
                                    <AlertCircle className="w-4 h-4" /> Detalle de Errores
                                </h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-40">Factura</TableHead>
                                            <TableHead>Error</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {batchMutation.data.data.items
                                            .filter((it) => it.result?.response === 'error')
                                            .map((err, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-mono text-xs">
                                                        {err.invoice?.Dispensa || err.invoice?.FacSec || '—'}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {err.result?.message || 'Error desconocido'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {findingRows.length > 0 && (
                            <div className="space-y-2 mt-6">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Hallazgos con origen documental
                                </h4>
                                {viewerError && (
                                    <p className="text-xs text-amber-400">{viewerError}</p>
                                )}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-40">Factura</TableHead>
                                            <TableHead>Hallazgo</TableHead>
                                            <TableHead className="w-72">Origen</TableHead>
                                            <TableHead className="w-28 text-right">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {findingRows.map((row) => {
                                            const currentKey = `${row.invoiceId}::${normalizeText(row.finding.documento || '')}`;
                                            const isResolvingRow = resolvingKey === currentKey;
                                            return (
                                                <TableRow key={row.rowId}>
                                                    <TableCell className="font-mono text-xs">
                                                        {row.invoiceId || '—'}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {row.finding.item || '—'}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {row.finding.documento || '—'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 px-2 text-[11px]"
                                                            disabled={!row.invoiceId || !row.finding.documento || !!resolvingKey}
                                                            onClick={() => resolveAndOpenViewer(row.invoiceId, row.finding.documento)}
                                                        >
                                                            {isResolvingRow ? (
                                                                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                                            ) : (
                                                                <Eye className="w-3.5 h-3.5 mr-1" />
                                                            )}
                                                            Ver
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {viewingDoc && (
                <DocumentViewerDialog
                    open={!!viewingDoc}
                    onOpenChange={(open) => {
                        if (!open) {
                            setViewingDoc(null);
                            setViewerError(null);
                            setResolvingKey(null);
                        }
                    }}
                    invoiceId={viewingDoc.invoiceId}
                    attachmentId={viewingDoc.attachmentId}
                    attachmentName={viewingDoc.attachmentName}
                />
            )}
        </div>
    );
}
