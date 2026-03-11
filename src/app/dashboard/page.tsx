'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type PaginatedResponse } from '@/lib/api';
import type { AuditStatus, AuditResult, DashboardFilters } from '@/lib/types';
import { countAuditStates } from '@/lib/audit-state';
import dynamic from 'next/dynamic';
import { DashboardHeader } from './_components/dashboard-header';
import { KpiCards } from './_components/kpi-cards';
import { FilterBar } from './_components/filter-bar';
import { RecentAuditsTable } from './_components/recent-audits-table';

const AuditVolumeChart = dynamic(
    () => import('./_components/audit-volume-chart').then((mod) => mod.AuditVolumeChart),
    { ssr: false, loading: () => <div className="h-64 w-full bg-muted/20 animate-pulse rounded-lg" /> }
) as React.ComponentType<{ items: AuditStatus[]; isLoading: boolean }>;

const StatusDistributionChart = dynamic(
    () => import('./_components/status-distribution-chart').then((mod) => mod.StatusDistributionChart),
    { ssr: false, loading: () => <div className="h-64 w-full bg-muted/20 animate-pulse rounded-lg" /> }
) as React.ComponentType<{
    processedOk: number;
    findings: number;
    error: number;
    pending: number;
    humanReview: number;
    unknown: number;
    total: number;
    isLoading: boolean;
}>;

/** Construye query string a partir de filtros activos */
function buildFilterParams(filters: DashboardFilters): string {
    const params = new URLSearchParams();
    if (filters.facNitSec) params.set('facNitSec', String(filters.facNitSec));
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    return params.toString();
}

export default function DashboardPage() {
    const [filters, setFilters] = useState<DashboardFilters>({});

    const handleFiltersChange = useCallback((newFilters: DashboardFilters) => {
        setFilters(newFilters);
    }, []);

    const filterString = buildFilterParams(filters);

    // ── Query 1: Audit results (KPIs, gráficos, tabla resumen) ──
    const { data: resultsData, isLoading } = useQuery({
        queryKey: ['audit-results', filterString],
        queryFn: () => {
            const base = '/audit/results?page=1&pageSize=100';
            const qs = filterString ? `&${filterString}` : '';
            return api.get<PaginatedResponse<AuditStatus>>(`${base}${qs}`);
        },
    });

    // ── Query 2: Documents history (cumplimiento documental) ──
    const { data: docsData, isLoading: docsLoading } = useQuery({
        queryKey: ['audit-docs-history', filterString],
        queryFn: () => {
            const params = new URLSearchParams();
            params.set('page', '1');
            params.set('pageSize', '100');
            if (filters.facNitSec) params.set('facNitSec', String(filters.facNitSec));
            return api.get<PaginatedResponse<AuditResult>>(`/audit/documents-history?${params.toString()}`);
        },
    });

    // API response shape: { success, message, data: { items, total, page, pageSize, totalPages, filters } }
    const items = useMemo(() => resultsData?.data?.items ?? [], [resultsData]);
    const totalFromApi = resultsData?.data?.total ?? 0;

    const stateCounts = countAuditStates(items);

    // ── Métrica: Tiempo promedio de procesamiento IA ──
    const avgProcessingMs = useMemo(() => {
        const validTimes = items.filter(
            (i) => i.DuracionProcesamientoMs != null && Number(i.DuracionProcesamientoMs) > 0
        );
        if (validTimes.length === 0) return null;
        const sum = validTimes.reduce((acc, i) => acc + Number(i.DuracionProcesamientoMs), 0);
        return sum / validTimes.length;
    }, [items]);

    // ── Métrica: Tasa de cumplimiento documental ──
    const complianceRate = useMemo(() => {
        const docsItems = docsData?.data?.items ?? [];
        if (docsItems.length === 0) return null;
        const compliant = docsItems.filter((d) => d.EstadoSoporte === 'C').length;
        return Math.round((compliant / docsItems.length) * 1000) / 10;
    }, [docsData]);

    const combinedLoading = isLoading || docsLoading;

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <DashboardHeader
                total={stateCounts.total || totalFromApi}
                processedOk={stateCounts.processedOk}
                isLoading={isLoading}
            />

            {/* Filter Bar */}
            <FilterBar
                onFiltersChange={handleFiltersChange}
                isLoading={combinedLoading}
            />

            {/* KPI Cards */}
            <KpiCards
                total={stateCounts.total || totalFromApi}
                processedOk={stateCounts.processedOk}
                findings={stateCounts.findings}
                error={stateCounts.error}
                humanReview={stateCounts.humanReview}
                avgProcessingMs={avgProcessingMs}
                complianceRate={complianceRate}
                isLoading={combinedLoading}
            />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AuditVolumeChart items={items} isLoading={isLoading} />
                <StatusDistributionChart
                    processedOk={stateCounts.processedOk}
                    findings={stateCounts.findings}
                    error={stateCounts.error}
                    pending={stateCounts.pending}
                    humanReview={stateCounts.humanReview}
                    unknown={stateCounts.unknown}
                    total={stateCounts.total || totalFromApi}
                    isLoading={isLoading}
                />
            </div>

            {/* Recent Audits Table — paginación server-side independiente */}
            <RecentAuditsTable />
        </div>
    );
}
