'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, type PaginatedResponse } from '@/lib/api';
import type { AuditResult } from '@/lib/types';
import { DocumentViewerDialog } from '@/components/document-viewer';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    Eye,
} from 'lucide-react';

interface HistoryViewerSelection {
    invoiceId: string;
    attachmentId: string;
    attachmentName: string;
}

function HistoryContent() {
    const searchParams = useSearchParams();
    const initialFactura = searchParams.get('factura') || '';

    const [page, setPage] = useState(1);
    const [facNro, setFacNro] = useState(initialFactura);
    const [searchValue, setSearchValue] = useState(initialFactura);
    const [viewingDoc, setViewingDoc] = useState<HistoryViewerSelection | null>(null);
    const pageSize = 20;

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['audit-history', { page, pageSize, facNro }],
        queryFn: () => {
            const params = new URLSearchParams({
                page: String(page),
                pageSize: String(pageSize),
            });
            if (facNro) params.set('facNro', facNro);
            return api.get<PaginatedResponse<AuditResult>>(
                `/audit/documents-history?${params}`
            );
        },
    });

    const items = data?.data?.items || [];
    const total = data?.data?.total || 0;
    const totalPages = data?.data?.totalPages || 1;

    function handleSearch() {
        setFacNro(searchValue);
        setPage(1);
    }

    function statusInfo(status: string): { label: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
        switch (status) {
            case 'C':
                return { label: 'Aprobado', variant: 'default' };
            case 'R':
                return { label: 'Rechazado', variant: 'destructive' };
            case 'P':
                return { label: 'Pendiente', variant: 'outline' };
            default:
                return { label: status || 'Pendiente', variant: 'secondary' };
        }
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por Nro. Factura..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-9"
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={isFetching}>
                            <Search className="w-4 h-4 mr-2" />
                            Buscar
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchValue('');
                                setFacNro('');
                                setPage(1);
                            }}
                        >
                            Limpiar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-36">Factura</TableHead>
                                    <TableHead>Documento</TableHead>
                                    <TableHead className="w-28">Estado</TableHead>
                                    <TableHead>Observación</TableHead>
                                    <TableHead>Auditor</TableHead>
                                    <TableHead className="w-40">Fecha</TableHead>
                                    <TableHead className="w-24 text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading
                                    ? Array.from({ length: 10 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 7 }).map((__, j) => (
                                                <TableCell key={j}>
                                                    <Skeleton className="h-4 w-full" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                    : items.map((item, index) => (
                                        <TableRow key={`${item.AdjuntoID}-${item.DetalleID}-${index}`}>
                                            <TableCell className="font-mono text-xs">
                                                {item.NroFactura}
                                            </TableCell>
                                            <TableCell className="text-xs max-w-48 truncate">
                                                {item.NombreDocumento}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusInfo(item.EstadoSoporte).variant}>
                                                    {statusInfo(item.EstadoSoporte).label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-56 truncate">
                                                {item.ObservacionRechazo || '—'}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {item.UsuarioAuditor}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground tabular-nums">
                                                {item.FechaAuditoria
                                                    ? new Date(item.FechaAuditoria).toLocaleString(
                                                        'es-CO',
                                                        { dateStyle: 'short', timeStyle: 'short' }
                                                    )
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 px-2 text-[11px]"
                                                    disabled={!item.NroFactura || !item.AdjuntoID}
                                                    onClick={() => {
                                                        if (!item.NroFactura || !item.AdjuntoID) {
                                                            return;
                                                        }
                                                        setViewingDoc({
                                                            invoiceId: item.NroFactura,
                                                            attachmentId: item.AdjuntoID,
                                                            attachmentName: item.NombreDocumento || `Adjunto ${item.AdjuntoID}`,
                                                        });
                                                    }}
                                                >
                                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                                    Ver
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                {!isLoading && items.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            No se encontraron resultados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                            {total} registros · Página {page} de {totalPages}
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={page <= 1}
                                onClick={() => setPage(1)}
                            >
                                <ChevronsLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={page >= totalPages}
                                onClick={() => setPage(page + 1)}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={page >= totalPages}
                                onClick={() => setPage(totalPages)}
                            >
                                <ChevronsRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {viewingDoc && (
                <DocumentViewerDialog
                    open={!!viewingDoc}
                    onOpenChange={(open) => {
                        if (!open) {
                            setViewingDoc(null);
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

export default function HistoryPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Cargando...</div>}>
            <HistoryContent />
        </Suspense>
    );
} 
