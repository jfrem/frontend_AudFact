'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AuditResult {
  response: string;
  severity?: string;
  message: string;
  metrics?: {
    TotalCamposEvaluados: number;
    TotalCoincidentes: number;
    TotalDiscrepancias: number;
  };
}

interface AuditResultSummaryProps {
  result: AuditResult;
}

export function AuditResultSummary({ result }: AuditResultSummaryProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 p-5 rounded-xl bg-card border border-border/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
        {result.severity && result.severity !== 'ninguna' && (
          <Badge variant="destructive" className="absolute top-4 right-4 capitalize">
            Severidad: {result.severity}
          </Badge>
        )}
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground/90">
          {result.response?.toLowerCase() === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          )}
          Resumen General
        </h4>
        <p className="text-sm text-foreground/80 leading-relaxed">{result.message}</p>
      </div>

      {result.metrics && (
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs font-medium text-emerald-600">Coincidencias</span>
            <span className="text-2xl font-bold text-emerald-700">{result.metrics.TotalCoincidentes}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <span className="text-xs font-medium text-rose-600">Discrepancias</span>
            <span className="text-2xl font-bold text-rose-700">{result.metrics.TotalDiscrepancias}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-xs font-medium text-primary">Campos Eval.</span>
            <span className="text-2xl font-bold text-primary">{result.metrics.TotalCamposEvaluados}</span>
          </div>
        </div>
      )}
    </div>
  );
}
