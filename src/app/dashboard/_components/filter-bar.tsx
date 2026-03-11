'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Client, DashboardFilters } from '@/lib/types';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import { Filter, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterBarProps {
    onFiltersChange: (filters: DashboardFilters) => void;
    isLoading: boolean;
}

export function FilterBar({ onFiltersChange, isLoading }: FilterBarProps) {
    const [facNitSec, setFacNitSec] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    const { data: clientsData, isLoading: clientsLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: () => api.get<Client[]>('/clients'),
        staleTime: 5 * 60 * 1000,
    });

    const clients = clientsData?.data ?? [];

    /* Emitir filtros cuando cambian */
    useEffect(() => {
        const filters: DashboardFilters = {};
        if (facNitSec) filters.facNitSec = Number(facNitSec);
        if (dateFrom) filters.dateFrom = dateFrom;
        if (dateTo) filters.dateTo = dateTo;
        onFiltersChange(filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facNitSec, dateFrom, dateTo]);

    const hasFilters = facNitSec || dateFrom || dateTo;

    function handleReset() {
        setFacNitSec('');
        setDateFrom('');
        setDateTo('');
    }

    return (
        <Card className="border-border/40 bg-card/90 backdrop-blur-sm animate-slide-up" style={{ animationDelay: '60ms', animationFillMode: 'both' }}>
            <CardContent className="py-3 px-4">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Icon */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
                        <Filter className="h-4 w-4 text-primary" />
                    </div>

                    {/* Client dropdown */}
                    <div className="flex flex-col gap-1">
                        <label htmlFor="filter-client" className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            Cliente (EPS)
                        </label>
                        <select
                            id="filter-client"
                            value={facNitSec}
                            onChange={(e) => setFacNitSec(e.target.value)}
                            disabled={clientsLoading || isLoading}
                            className={cn(
                                'h-9 px-3 rounded-lg text-sm bg-muted/30 border border-border/50',
                                'text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40',
                                'transition-all duration-200 min-w-[200px]',
                                'disabled:opacity-50 disabled:cursor-not-allowed'
                            )}
                        >
                            <option value="">Todos los clientes</option>
                            {clients.map((c) => (
                                <option key={c.NitSec} value={c.NitSec}>
                                    {c.NitCom}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date From */}
                    <div className="flex flex-col gap-1">
                        <label htmlFor="filter-from" className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            Desde
                        </label>
                        <input
                            id="filter-from"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            disabled={isLoading}
                            max={dateTo || undefined}
                            className={cn(
                                'h-9 px-3 rounded-lg text-sm bg-muted/30 border border-border/50',
                                'text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40',
                                'transition-all duration-200',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                '[color-scheme:dark]'
                            )}
                        />
                    </div>

                    {/* Date To */}
                    <div className="flex flex-col gap-1">
                        <label htmlFor="filter-to" className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            Hasta
                        </label>
                        <input
                            id="filter-to"
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            disabled={isLoading}
                            min={dateFrom || undefined}
                            className={cn(
                                'h-9 px-3 rounded-lg text-sm bg-muted/30 border border-border/50',
                                'text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40',
                                'transition-all duration-200',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                '[color-scheme:dark]'
                            )}
                        />
                    </div>

                    {/* Reset */}
                    {hasFilters && (
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={isLoading}
                            className={cn(
                                'mt-auto h-9 px-3 rounded-lg text-xs font-medium',
                                'bg-muted/30 border border-border/50 text-muted-foreground',
                                'hover:bg-muted/50 hover:text-foreground',
                                'transition-all duration-200 flex items-center gap-1.5',
                                'disabled:opacity-50'
                            )}
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Limpiar
                        </button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
