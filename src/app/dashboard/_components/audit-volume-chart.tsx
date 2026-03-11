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
import { LineChart } from 'echarts/charts';
import { TooltipComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { TrendingUp } from 'lucide-react';
import type { AuditStatus } from '@/lib/types';

echarts.use([LineChart, TooltipComponent, GridComponent, CanvasRenderer]);

interface Props {
    items: AuditStatus[];
    isLoading: boolean;
}

export function AuditVolumeChart({ items, isLoading }: Props) {
    const chartData = useMemo(() => {
        const byMonth: Record<string, number> = {};
        items.forEach((item) => {
            if (!item.FechaCreacion) {
                const key = 'Sin fecha';
                byMonth[key] = (byMonth[key] || 0) + 1;
                return;
            }
            try {
                const d = new Date(item.FechaCreacion);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                byMonth[key] = (byMonth[key] || 0) + 1;
            } catch {
                byMonth['Sin fecha'] = (byMonth['Sin fecha'] || 0) + 1;
            }
        });

        const sortedKeys = Object.keys(byMonth).sort();
        return {
            labels: sortedKeys.map((k) => {
                if (k === 'Sin fecha') return k;
                const [y, m] = k.split('-');
                const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                return `${monthNames[parseInt(m) - 1]} ${y}`;
            }),
            values: sortedKeys.map((k) => byMonth[k]),
        };
    }, [items]);

    const option = useMemo(
        () => ({
            tooltip: {
                trigger: 'axis' as const,
                backgroundColor: 'rgba(10, 15, 30, 0.95)',
                borderColor: 'rgba(99, 102, 241, 0.25)',
                borderWidth: 1,
                textStyle: { color: '#e2e8f0', fontSize: 12, fontFamily: 'Inter, sans-serif' },
                axisPointer: {
                    type: 'line' as const,
                    lineStyle: { color: 'rgba(99,102,241,0.2)', type: 'dashed' as const },
                },
                padding: [8, 12],
                extraCssText: 'border-radius: 8px; backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0,0,0,0.3);',
            },
            grid: { left: '3%', right: '4%', bottom: '8%', top: '8%', containLabel: true },
            xAxis: {
                type: 'category' as const,
                data: chartData.labels,
                boundaryGap: false,
                axisLabel: { color: '#64748b', fontSize: 11, fontFamily: 'Inter, sans-serif' },
                axisLine: { lineStyle: { color: '#1e293b' } },
                axisTick: { show: false },
            },
            yAxis: {
                type: 'value' as const,
                axisLabel: { color: '#64748b', fontSize: 11, fontFamily: 'Inter, sans-serif' },
                splitLine: { lineStyle: { color: 'rgba(30, 41, 59, 0.5)', type: 'dashed' as const } },
                minInterval: 1,
            },
            series: [
                {
                    name: 'Auditorías',
                    type: 'line',
                    smooth: 0.4,
                    symbol: 'circle',
                    symbolSize: 8,
                    showSymbol: true,
                    lineStyle: {
                        width: 2.5,
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: '#6366f1' },
                            { offset: 1, color: '#818cf8' },
                        ]),
                        shadowBlur: 8,
                        shadowColor: 'rgba(99, 102, 241, 0.25)',
                    },
                    itemStyle: {
                        color: '#818cf8',
                        borderColor: '#6366f1',
                        borderWidth: 2,
                        shadowBlur: 6,
                        shadowColor: 'rgba(99, 102, 241, 0.3)',
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(99, 102, 241, 0.30)' },
                            { offset: 0.5, color: 'rgba(99, 102, 241, 0.08)' },
                            { offset: 1, color: 'rgba(99, 102, 241, 0.0)' },
                        ]),
                    },
                    emphasis: {
                        itemStyle: {
                            color: '#a5b4fc',
                            borderColor: '#6366f1',
                            borderWidth: 3,
                            shadowBlur: 16,
                            shadowColor: 'rgba(99,102,241,0.5)',
                        },
                    },
                    data: chartData.values,
                    animationDuration: 1000,
                    animationEasing: 'cubicOut' as const,
                },
            ],
        }),
        [chartData]
    );

    return (
        <Card className="border-border/40 bg-card/90 backdrop-blur-sm animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Tendencia de Auditorías
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-64 w-full rounded-lg" />
                ) : items.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                        No hay datos de auditorías disponibles
                    </div>
                ) : (
                    <ReactEChartsCore
                        echarts={echarts}
                        option={option}
                        style={{ height: '260px' }}
                        notMerge
                        lazyUpdate
                        theme="dark"
                    />
                )}
            </CardContent>
        </Card>
    );
}
