'use client';

import { useSyncExternalStore } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, CalendarDays } from 'lucide-react';

interface DashboardHeaderProps {
    total: number;
    processedOk: number;
    isLoading: boolean;
}

const subscribe = () => () => { };

function getGreeting(date: Date): string {
    const hour = date.getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
}

function getFormattedDate(date: Date): string {
    return date.toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export function DashboardHeader({ total, processedOk, isLoading }: DashboardHeaderProps) {
    const clientNow = useSyncExternalStore(subscribe, () => new Date(), () => null);
    const mounted = clientNow !== null;
    const greeting = clientNow ? getGreeting(clientNow) : 'Hola';
    const today = clientNow ? getFormattedDate(clientNow) : '';

    return (
        <div className="flex items-center justify-between gap-4 animate-slide-up">
            <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 shadow-lg shadow-primary/5">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">
                        {!mounted ? (
                            <span className="flex items-center gap-2"><Skeleton className="h-6 w-32" />, <span className="text-primary">Auditor</span></span>
                        ) : (
                            <>{greeting}, <span className="text-primary">Auditor</span></>
                        )}
                    </h1>
                    {isLoading ? (
                        <Skeleton className="h-4 w-48 mt-1" />
                    ) : (
                        <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10">
                                <span className="text-foreground font-semibold tabular-nums">{total}</span>
                                <span className="text-muted-foreground text-xs">auditorías</span>
                            </span>
                            <span className="text-muted-foreground/50">·</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/5 border border-emerald-500/10">
                                <span className="text-emerald-400 font-semibold tabular-nums">{processedOk}</span>
                                <span className="text-muted-foreground text-xs">exitosas</span>
                            </span>
                        </p>
                    )}
                </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/80 border border-border/50">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                {!mounted ? (
                    <Skeleton className="h-4 w-32" />
                ) : (
                    <p className="text-xs text-muted-foreground capitalize">{today}</p>
                )}
            </div>
        </div>
    );
}
