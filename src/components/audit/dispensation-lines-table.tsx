'use client';

import type { Dispensation } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DispensationLinesTableProps {
  rows: Dispensation[];
}

export function DispensationLinesTable({ rows }: DispensationLinesTableProps) {
  return (
    <div className="overflow-x-auto max-h-[360px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-36">Código</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead className="w-24">Entregada</TableHead>
            <TableHead className="w-24">Prescrita</TableHead>
            <TableHead className="w-32">Lote</TableHead>
            <TableHead className="w-32">Vencimiento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((line, idx) => (
              <TableRow key={`${line.CodigoArticulo || 'sin-codigo'}-${idx}`} className="align-top">
                <TableCell className="font-mono text-xs">{line.CodigoArticulo || '—'}</TableCell>
                <TableCell className="text-xs">
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground/90 leading-tight">{line.NombreArticulo || '—'}</p>
                    {line.CodigoProducto && (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {line.CodigoProducto}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs tabular-nums">{line.CantidadEntregada || '—'}</TableCell>
                <TableCell className="text-xs tabular-nums">{line.CantidadPrescrita || '—'}</TableCell>
                <TableCell className="text-xs font-mono">{line.Lote || '—'}</TableCell>
                <TableCell className="text-xs tabular-nums">{line.FechaVencimiento || '—'}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                No hay líneas de dispensación para mostrar.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
