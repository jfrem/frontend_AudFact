'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, type PaginatedResponse } from '@/lib/api';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { AuditStatus } from '@/lib/types';
import { resolveAuditState } from '@/lib/audit-state';
import {
    CheckCircle,
    XCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
    TableIcon,
    ArrowUpDown,
    AlertTriangle,
    Inbox,
    UserCheck,
    HelpCircle,
    Eye,
    ExternalLink,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'processed_ok' | 'findings' | 'error' | 'pending' | 'human_review' | 'unknown';
type SortField = 'FechaCreacion' | 'EstadoDetallado' | 'Severidad';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 20;

/* ── Color tokens consistentes con KPI cards (R-06) ── */
const STATUS_COLORS = {
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    processed_ok: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    findings: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    error: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    human_review: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/20' },
    unknown: { bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-border' },
} as const;

function getStatusInfo(item: AuditStatus) {
    const state = resolveAuditState(item);
    const colors = STATUS_COLORS[state.key];
    switch (state.key) {
        case 'pending':
            return { label: 'Pendiente', icon: Clock, colors, filterKey: 'pending' as const };
        case 'processed_ok':
            return { label: 'Procesada OK', icon: CheckCircle, colors, filterKey: 'processed_ok' as const };
        case 'findings':
            return { label: 'Con Hallazgos', icon: AlertTriangle, colors, filterKey: 'findings' as const };
        case 'error':
            return { label: 'Error', icon: XCircle, colors, filterKey: 'error' as const };
        case 'human_review':
            return { label: 'Revisión humana', icon: UserCheck, colors, filterKey: 'human_review' as const };
        default:
            return { label: 'Desconocido', icon: HelpCircle, colors, filterKey: 'unknown' as const };
    }
}

function severityBadge(s: string | null | undefined) {
    const val = (s || '').toUpperCase();
    if (val.includes('ALTA') || val.includes('CRÍT') || val.includes('HIGH'))
        return { label: s || 'Alta', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    if (val.includes('MEDIA') || val.includes('MED'))
        return { label: s || 'Media', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    if (val.includes('BAJA') || val.includes('LOW'))
        return { label: s || 'Baja', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    return { label: s || 'ninguna', className: 'bg-muted/50 text-muted-foreground border-border' };
}

const filterOptions: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'processed_ok', label: 'Procesada OK' },
    { key: 'findings', label: 'Hallazgos' },
    { key: 'error', label: 'Error' },
    { key: 'pending', label: 'Pendiente' },
    { key: 'human_review', label: 'Rev. Humana' },
    { key: 'unknown', label: 'Desconocido' },
];

export function RecentAuditsTable() {
    const router = useRouter();
    const [filter, setFilter] = useState<StatusFilter>('all');
    const [page, setPage] = useState(1);
    const [sortField, setSortField] = useState<SortField>('FechaCreacion');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    // Server-side pagination — fetch page from API
    const { data: resultsData, isLoading } = useQuery({
        queryKey: ['audit-results-table', page],
        queryFn: () => api.get<PaginatedResponse<AuditStatus>>(`/audit/results?page=${page}&pageSize=${PAGE_SIZE}`),
        placeholderData: (prev) => prev,
    });

    const items = resultsData?.data?.items ?? [];
    const totalFromApi = resultsData?.data?.total ?? 0;
    const totalPages = resultsData?.data?.totalPages ?? 1;

    // Client-side filter (within current page)
    const filtered = useMemo(() => {
        if (filter === 'all') return items;
        return items.filter((item) => {
            const info = getStatusInfo(item);
            return info.filterKey === filter;
        });
    }, [items, filter]);

    // Client-side sort (within current page)
    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            let av: string | number | null;
            let bv: string | number | null;

            if (sortField === 'FechaCreacion') {
                av = a.FechaCreacion || '';
                bv = b.FechaCreacion || '';
            } else if (sortField === 'EstadoDetallado') {
                av = a.EstadoDetallado || '';
                bv = b.EstadoDetallado || '';
            } else {
                av = a.Severidad || '';
                bv = b.Severidad || '';
            }

            const cmp = String(av).localeCompare(String(bv));
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [filtered, sortField, sortDir]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const handleFilterChange = useCallback((key: StatusFilter) => {
        setFilter(key);
    }, []);

    const handleRowClick = useCallback((item: AuditStatus) => {
        router.push(`/audit/history?factura=${item.FacNro || item.FacSec}`);
    }, [router]);

    // Pagination helpers
    const goToPage = useCallback((p: number) => {
        setPage(Math.max(1, Math.min(p, totalPages)));
    }, [totalPages]);

    const rangeStart = (page - 1) * PAGE_SIZE + 1;
    const rangeEnd = Math.min(page * PAGE_SIZE, totalFromApi);

    return (
        <Card className="border-border/40 bg-card/90 backdrop-blur-sm animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-3 pb-4">
                <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
                        <TableIcon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Auditorías Recientes
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {totalFromApi}
                    </Badge>
                </div>

                {/* Filter chips */}
                <div className="flex gap-1.5 flex-wrap">
                    {filterOptions.map((opt) => (
                        <Button
                            key={opt.key}
                            variant={filter === opt.key ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                                'h-7 text-[11px] px-2.5 rounded-full transition-all duration-200 font-medium',
                                filter === opt.key
                                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                                    : 'text-muted-foreground hover:text-foreground hover:border-primary/40'
                            )}
                            onClick={() => handleFilterChange(opt.key)}
                        >
                            {opt.label}
                        </Button>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="px-0">
                {isLoading && items.length === 0 ? (
                    <div className="space-y-3 px-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-lg" />
                        ))}
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
                            <Inbox className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                            No hay auditorías que coincidan
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Prueba cambiando los filtros de búsqueda
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border/30 hover:bg-transparent bg-muted/5">
                                        <TableHead className="text-xs w-[130px]">Factura</TableHead>
                                        <TableHead className="text-xs">NIT</TableHead>
                                        <TableHead
                                            className="text-xs cursor-pointer select-none"
                                            onClick={() => toggleSort('FechaCreacion')}
                                        >
                                            <span className="flex items-center gap-1">
                                                Fecha
                                                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                                            </span>
                                        </TableHead>
                                        <TableHead
                                            className="text-xs cursor-pointer select-none"
                                            onClick={() => toggleSort('EstadoDetallado')}
                                        >
                                            <span className="flex items-center gap-1">
                                                Resultado
                                                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                                            </span>
                                        </TableHead>
                                        <TableHead
                                            className="text-xs cursor-pointer select-none"
                                            onClick={() => toggleSort('Severidad')}
                                        >
                                            <span className="flex items-center gap-1">
                                                Severidad
                                                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                                            </span>
                                        </TableHead>
                                        <TableHead className="text-xs text-right">Docs</TableHead>
                                        <TableHead className="text-xs text-right">Tiempo</TableHead>
                                        <TableHead className="text-xs text-center w-[80px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TooltipProvider delay={200}>
                                        {sorted.map((item, idx) => {
                                            const status = getStatusInfo(item);
                                            const severity = severityBadge(item.Severidad);
                                            const StatusIcon = status.icon;
                                            const durationSec = item.DuracionProcesamientoMs != null
                                                ? (item.DuracionProcesamientoMs / 1000).toFixed(1)
                                                : null;

                                            return (
                                                <TableRow
                                                    key={`${item.FacSec}-${idx}`}
                                                    className={cn(
                                                        'border-border/20 cursor-pointer group',
                                                        'transition-all duration-200 ease-out',
                                                        'hover:bg-primary/[0.04] hover:border-l-2 hover:border-l-primary/50',
                                                    )}
                                                    onClick={() => handleRowClick(item)}
                                                >
                                                    <TableCell className="py-3">
                                                        <span
                                                            className="text-xs font-medium group-hover:text-primary transition-colors duration-200"
                                                            title={`FacSec: ${item.FacSec}`}
                                                        >
                                                            {item.FacNro || item.FacSec || '—'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-3 text-xs text-muted-foreground font-mono">
                                                        {item.FacNitSec || '—'}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-xs text-muted-foreground">
                                                        {item.FechaCreacion
                                                            ? new Date(item.FechaCreacion).toLocaleDateString('es-CO', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                'text-[10px] px-2 py-0.5 gap-1 transition-all duration-200',
                                                                status.colors.bg,
                                                                status.colors.text,
                                                                status.colors.border,
                                                            )}
                                                        >
                                                            <StatusIcon className="h-3 w-3" />
                                                            {status.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn('text-[10px] px-2 py-0.5', severity.className)}
                                                        >
                                                            {severity.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-3 text-right">
                                                        <span className="text-xs font-mono tabular-nums text-muted-foreground">
                                                            {item.DocumentosProcesados ?? '—'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-3 text-right">
                                                        <span className="text-xs font-mono tabular-nums text-muted-foreground">
                                                            {durationSec ? `${durationSec}s` : '—'}
                                                        </span>
                                                    </TableCell>
                                                    {/* Acciones rápidas */}
                                                    <TableCell className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors"
                                                                    onClick={(e) => { e.stopPropagation(); handleRowClick(item); }}
                                                                >
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="text-xs">
                                                                    Ver historial
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        window.open(`/audit/history?factura=${item.FacNro || item.FacSec}`, '_blank');
                                                                    }}
                                                                >
                                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="text-xs">
                                                                    Abrir en nueva pestaña
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TooltipProvider>
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination — server-side */}
                        <div className="flex items-center justify-between px-6 pt-4 border-t border-border/30">
                            <p className="text-xs text-muted-foreground">
                                {totalFromApi > 0
                                    ? `${rangeStart}–${rangeEnd} de ${totalFromApi} registros`
                                    : '0 registros'}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={page <= 1}
                                    onClick={() => goToPage(1)}
                                    title="Primera página"
                                >
                                    <ChevronsLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={page <= 1}
                                    onClick={() => goToPage(page - 1)}
                                    title="Página anterior"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <span className="text-xs text-muted-foreground px-2 tabular-nums">
                                    {page} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={page >= totalPages}
                                    onClick={() => goToPage(page + 1)}
                                    title="Página siguiente"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={page >= totalPages}
                                    onClick={() => goToPage(totalPages)}
                                    title="Última página"
                                >
                                    <ChevronsRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
