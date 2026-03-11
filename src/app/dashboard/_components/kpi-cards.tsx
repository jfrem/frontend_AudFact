'use client';

import { useEffect, useRef, useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    FileStack,
    ShieldCheck,
    AlertTriangle,
    Timer,
    FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardsProps {
    total: number;
    processedOk: number;
    findings: number;
    error: number;
    humanReview: number;
    avgProcessingMs: number | null;
    complianceRate: number | null;
    isLoading: boolean;
}

function AnimatedCounter({ value, duration = 600 }: { value: number; duration?: number }) {
    const [displayed, setDisplayed] = useState(0);
    const ref = useRef<number | undefined>(undefined);

    useEffect(() => {
        const start = performance.now();
        const from = 0;

        function step(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayed(Math.round(from + (value - from) * eased));

            if (progress < 1) {
                ref.current = requestAnimationFrame(step);
            }
        }

        ref.current = requestAnimationFrame(step);
        return () => {
            if (ref.current) cancelAnimationFrame(ref.current);
        };
    }, [value, duration]);

    return <>{displayed.toLocaleString('es-CO')}</>;
}

function AnimatedDecimal({ value, suffix = '', duration = 600 }: { value: number; suffix?: string; duration?: number }) {
    const [displayed, setDisplayed] = useState(0);
    const ref = useRef<number | undefined>(undefined);

    useEffect(() => {
        const start = performance.now();

        function step(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayed(value * eased);

            if (progress < 1) {
                ref.current = requestAnimationFrame(step);
            }
        }

        ref.current = requestAnimationFrame(step);
        return () => {
            if (ref.current) cancelAnimationFrame(ref.current);
        };
    }, [value, duration]);

    return <>{displayed.toFixed(1)}{suffix}</>;
}

function ProgressBar({ value, max, colorFrom, colorTo }: { value: number; max: number; colorFrom: string; colorTo: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="flex items-center gap-2.5 mt-3">
            <div className="flex-1 h-[5px] rounded-full bg-muted/40 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
                    }}
                />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground tabular-nums w-8 text-right">
                {pct}%
            </span>
        </div>
    );
}

/** Formato de milisegundos a texto legible: "12.5s" o "1.2m" */
function formatMs(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60_000).toFixed(1)}m`;
}

export function KpiCards({
    total,
    processedOk,
    findings,
    error,
    humanReview,
    avgProcessingMs,
    complianceRate,
    isLoading,
}: KpiCardsProps) {
    const alerts = findings + error + humanReview;

    const kpis = [
        {
            key: 'total',
            label: 'Total Auditados',
            value: total,
            icon: FileStack,
            gradient: 'from-blue-500/20 to-indigo-500/20',
            iconColor: 'text-blue-400',
            glowColor: 'rgba(96, 165, 250, 0.15)',
            barFrom: '#3b82f6',
            barTo: '#6366f1',
            showBar: false,
            renderValue: 'counter' as const,
        },
        {
            key: 'processedOk',
            label: 'Procesadas OK',
            value: processedOk,
            icon: ShieldCheck,
            gradient: 'from-emerald-500/20 to-teal-500/20',
            iconColor: 'text-emerald-400',
            glowColor: 'rgba(52, 211, 153, 0.15)',
            barFrom: '#10b981',
            barTo: '#14b8a6',
            showBar: true,
            renderValue: 'counter' as const,
        },
        {
            key: 'alerts',
            label: 'Alertas',
            value: alerts,
            icon: AlertTriangle,
            gradient: 'from-rose-500/20 to-red-500/20',
            iconColor: 'text-rose-400',
            glowColor: 'rgba(251, 113, 133, 0.15)',
            barFrom: '#f43f5e',
            barTo: '#ef4444',
            showBar: true,
            renderValue: 'counter' as const,
        },
        {
            key: 'avgTime',
            label: 'Tiempo Prom. IA',
            value: avgProcessingMs ?? 0,
            icon: Timer,
            gradient: 'from-amber-500/20 to-orange-500/20',
            iconColor: 'text-amber-400',
            glowColor: 'rgba(251, 191, 36, 0.15)',
            barFrom: '#f59e0b',
            barTo: '#f97316',
            showBar: false,
            renderValue: 'time' as const,
        },
        {
            key: 'compliance',
            label: 'Cumplimiento Doc.',
            value: complianceRate ?? 0,
            icon: FileCheck,
            gradient: 'from-cyan-500/20 to-sky-500/20',
            iconColor: 'text-cyan-400',
            glowColor: 'rgba(34, 211, 238, 0.15)',
            barFrom: '#06b6d4',
            barTo: '#0ea5e9',
            showBar: false,
            renderValue: 'percentage' as const,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {kpis.map((kpi, i) => (
                <Card
                    key={kpi.key}
                    className={cn(
                        'relative overflow-hidden border-border/40 bg-card/90 backdrop-blur-sm',
                        'transition-all duration-300 ease-out',
                        'hover:border-primary/20 hover:-translate-y-0.5',
                        'cursor-default group',
                        'animate-slide-up'
                    )}
                    style={{
                        animationDelay: `${i * 80}ms`,
                        animationFillMode: 'both',
                    }}
                >
                    {/* Gradient overlay on hover */}
                    <div className={cn(
                        'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                        kpi.gradient
                    )} />

                    {/* Glow shadow on hover */}
                    <div
                        className="absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{ boxShadow: `0 4px 24px -4px ${kpi.glowColor}, inset 0 1px 0 0 rgba(255,255,255,0.03)` }}
                    />

                    <CardHeader className="relative flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                            {kpi.label}
                        </CardTitle>
                        <div className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br',
                            'transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg',
                            kpi.gradient
                        )}
                            style={{ boxShadow: `0 0 0 0 ${kpi.glowColor}` }}
                        >
                            <kpi.icon className={cn('w-5 h-5', kpi.iconColor)} />
                        </div>
                    </CardHeader>
                    <CardContent className="relative pt-0">
                        {isLoading ? (
                            <>
                                <Skeleton className="h-9 w-24" />
                                <Skeleton className="h-[5px] w-full mt-3" />
                            </>
                        ) : (
                            <>
                                <p className="text-3xl font-bold tabular-nums tracking-tight">
                                    {kpi.renderValue === 'counter' && (
                                        <AnimatedCounter value={kpi.value} />
                                    )}
                                    {kpi.renderValue === 'time' && (
                                        avgProcessingMs != null ? formatMs(avgProcessingMs) : '—'
                                    )}
                                    {kpi.renderValue === 'percentage' && (
                                        complianceRate != null
                                            ? <AnimatedDecimal value={complianceRate} suffix="%" />
                                            : '—'
                                    )}
                                </p>
                                {kpi.showBar && (
                                    <ProgressBar
                                        value={kpi.value}
                                        max={total}
                                        colorFrom={kpi.barFrom}
                                        colorTo={kpi.barTo}
                                    />
                                )}
                                {kpi.key === 'avgTime' && avgProcessingMs != null && (
                                    <p className="text-[10px] text-muted-foreground mt-2">
                                        Procesamiento Gemini IA
                                    </p>
                                )}
                                {kpi.key === 'compliance' && complianceRate != null && (
                                    <ProgressBar
                                        value={Math.round(complianceRate)}
                                        max={100}
                                        colorFrom={kpi.barFrom}
                                        colorTo={kpi.barTo}
                                    />
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
