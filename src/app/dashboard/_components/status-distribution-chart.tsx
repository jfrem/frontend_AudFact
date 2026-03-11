'use client';

import { useMemo } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { GaugeChart } from 'echarts/charts';
import { GraphicComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

echarts.use([GaugeChart, GraphicComponent, CanvasRenderer]);

interface Props {
    processedOk: number;
    findings: number;
    error: number;
    pending: number;
    humanReview: number;
    unknown: number;
    total: number;
    isLoading: boolean;
}

const statusItems = [
    { key: 'ok', label: 'Procesadas OK', colorFrom: '#10b981', colorTo: '#34d399', textColor: 'text-emerald-400' },
    { key: 'findings', label: 'Hallazgos', colorFrom: '#f43f5e', colorTo: '#fb7185', textColor: 'text-rose-400' },
    { key: 'error', label: 'Error', colorFrom: '#ef4444', colorTo: '#f87171', textColor: 'text-red-400' },
    { key: 'pending', label: 'Pendientes', colorFrom: '#f59e0b', colorTo: '#fbbf24', textColor: 'text-amber-400' },
    { key: 'humanReview', label: 'Rev. Humana', colorFrom: '#d946ef', colorTo: '#e879f9', textColor: 'text-fuchsia-400' },
] as const;

export function StatusDistributionChart({
    processedOk,
    findings,
    error,
    pending,
    humanReview,
    unknown,
    total,
    isLoading,
}: Props) {
    const successRate = total > 0 ? Math.round((processedOk / total) * 100) : 0;

    const gaugeColor =
        successRate >= 75 ? '#34d399'
            : successRate >= 50 ? '#fbbf24'
                : successRate >= 25 ? '#fb923c'
                    : '#ef4444';

    const option = useMemo(
        () => ({
            series: [
                {
                    type: 'gauge',
                    startAngle: 200,
                    endAngle: -20,
                    radius: '85%',
                    center: ['50%', '55%'],
                    min: 0,
                    max: 100,
                    splitNumber: 4,
                    axisLine: {
                        lineStyle: {
                            width: 18,
                            color: [
                                [successRate / 100, gaugeColor],
                                [1, 'rgba(99, 102, 241, 0.06)'],
                            ],
                            shadowBlur: 12,
                            shadowColor: gaugeColor + '30',
                        },
                    },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: { show: false },
                    pointer: { show: false },
                    title: {
                        show: true,
                        offsetCenter: [0, '20%'],
                        fontSize: 12,
                        fontFamily: 'Inter, sans-serif',
                        color: '#64748b',
                    },
                    detail: {
                        fontSize: 34,
                        fontWeight: 'bold',
                        fontFamily: 'Inter, sans-serif',
                        offsetCenter: [0, '-10%'],
                        color: '#f1f5f9',
                        formatter: `${successRate}%`,
                    },
                    data: [
                        {
                            value: successRate,
                            name: `${processedOk} de ${total} exitosas`,
                        },
                    ],
                    animationDuration: 1200,
                    animationEasing: 'cubicOut' as const,
                },
            ],
        }),
        [successRate, processedOk, total, gaugeColor]
    );

    const hasData = total > 0;

    const values: Record<string, number> = {
        ok: processedOk,
        findings,
        error,
        pending,
        humanReview,
    };

    return (
        <Card className="border-border/40 bg-card/90 backdrop-blur-sm animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
                        <Activity className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Salud de Auditoría
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-64 w-full rounded-lg" />
                ) : !hasData ? (
                    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                        No hay datos disponibles
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {/* Gauge */}
                        <ReactEChartsCore
                            echarts={echarts}
                            option={option}
                            style={{ height: '170px' }}
                            notMerge
                            lazyUpdate
                            theme="dark"
                        />

                        {/* Mini status bars with gradient */}
                        <div className="space-y-2.5 mt-1 px-1">
                            {statusItems
                                .filter((item) => (values[item.key] ?? 0) > 0)
                                .map((item) => {
                                    const val = values[item.key] ?? 0;
                                    const pct = total > 0 ? (val / total) * 100 : 0;
                                    return (
                                        <div key={item.key} className="flex items-center gap-2 group/bar">
                                            <span className={cn('text-[11px] w-24 truncate font-medium', item.textColor)}>
                                                {item.label}
                                            </span>
                                            <div className="flex-1 h-[6px] rounded-full bg-muted/25 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                                    style={{
                                                        width: `${pct}%`,
                                                        minWidth: val > 0 ? '4px' : '0px',
                                                        background: `linear-gradient(90deg, ${item.colorFrom}, ${item.colorTo})`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-[11px] font-mono tabular-nums text-muted-foreground w-6 text-right">
                                                {val}
                                            </span>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
