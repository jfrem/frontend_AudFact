'use client';

import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { API_BASE } from '@/lib/api';

interface DocumentViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  attachmentId: string;
  attachmentName: string;
}

interface ViewerPayload {
  mime: string;
  data: string;
}

function getDataUri(payload: ViewerPayload): string {
  return `data:${payload.mime};base64,${payload.data}`;
}

export function DocumentViewerDialog({
  open,
  onOpenChange,
  invoiceId,
  attachmentId,
  attachmentName,
}: DocumentViewerDialogProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['attachment-preview', invoiceId, attachmentId],
    queryFn: async (): Promise<ViewerPayload> => {
      const res = await fetch(
        `${API_BASE}/dispensation/${encodeURIComponent(invoiceId)}/attachments/download/${encodeURIComponent(attachmentId)}`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!res.ok) {
        let message = `Error HTTP ${res.status}`;
        try {
          const err = await res.json();
          message = err?.message || message;
        } catch {
          // Ignore JSON parse errors and keep the HTTP fallback message.
        }
        throw new Error(message);
      }

      const payload = (await res.json()) as Partial<ViewerPayload>;
      if (!payload.mime || !payload.data) {
        throw new Error('La respuesta del visor no tiene el formato esperado.');
      }

      return { mime: payload.mime, data: payload.data };
    },
    enabled: open && !!invoiceId && !!attachmentId,
    staleTime: 5 * 60 * 1000,
  });

  const dataUri = data ? getDataUri(data) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[96vw] h-[95vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b border-border/50">
          <DialogTitle className="truncate pr-8">{attachmentName}</DialogTitle>
          <p className="text-xs text-muted-foreground">Factura: {invoiceId} · Adjunto: {attachmentId}</p>
        </DialogHeader>

        <div className="h-full p-4 overflow-auto">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-[82vh] w-full" />
            </div>
          )}

          {error && (
            <div className="space-y-3 text-sm">
              <p className="text-destructive">No se pudo cargar el documento.</p>
              <p className="text-muted-foreground">{(error as Error).message}</p>
            </div>
          )}

          {!isLoading && !error && data && (
            <iframe
              src={dataUri}
              title={attachmentName}
              className="w-full h-[84vh] rounded-md border border-border/50"
            />
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
