import type { AuditStatus } from '@/lib/types';

export type AuditUiStateKey =
  | 'pending'
  | 'processed_ok'
  | 'findings'
  | 'error'
  | 'human_review'
  | 'unknown';

export interface AuditUiState {
  key: AuditUiStateKey;
  label: string;
}

/**
 * Mapeo canónico backend -> UI para estados de auditoría.
 * Prioridad:
 * 1) EstAud=0 => Pendiente
 * 2) RequiereRevisionHumana=1 => Requiere revisión humana
 * 3) EstadoDetallado=success => Procesada OK
 * 4) EstadoDetallado=warning => Con hallazgos
 * 5) EstadoDetallado=error => Error
 * 6) fallback => Desconocido
 */
export function resolveAuditState(item: AuditStatus): AuditUiState {
  const isProcessed = Number(item.EstAud) === 1;
  const requiresHumanReview = Number(item.RequiereRevisionHumana) === 1;
  const detailed = (item.EstadoDetallado || '').toLowerCase().trim();

  // Si no está procesado, verificar si tiene un estado detallado (datos históricos)
  if (!isProcessed) {
    // Si tiene un EstadoDetallado válido, fue procesado pero guardado con el bug anterior
    if (detailed && detailed !== '' && ['success', 'warning', 'error', 'human_review'].includes(detailed)) {
      // Continuar evaluación normal en vez de retornar "Pendiente"
    } else {
      return { key: 'pending', label: 'Pendiente' };
    }
  }

  if (requiresHumanReview) {
    return { key: 'human_review', label: 'Revisión humana' };
  }

  if (detailed === 'success') {
    return { key: 'processed_ok', label: 'Procesada OK' };
  }

  if (detailed === 'warning') {
    return { key: 'findings', label: 'Con hallazgos' };
  }

  if (detailed === 'error') {
    return { key: 'error', label: 'Error' };
  }

  return { key: 'unknown', label: 'Desconocido' };
}

export interface AuditStateCounts {
  total: number;
  pending: number;
  processedOk: number;
  findings: number;
  error: number;
  humanReview: number;
  unknown: number;
}

export function countAuditStates(items: AuditStatus[]): AuditStateCounts {
  const counts: AuditStateCounts = {
    total: items.length,
    pending: 0,
    processedOk: 0,
    findings: 0,
    error: 0,
    humanReview: 0,
    unknown: 0,
  };

  for (const item of items) {
    const state = resolveAuditState(item).key;
    if (state === 'pending') counts.pending += 1;
    else if (state === 'processed_ok') counts.processedOk += 1;
    else if (state === 'findings') counts.findings += 1;
    else if (state === 'error') counts.error += 1;
    else if (state === 'human_review') counts.humanReview += 1;
    else counts.unknown += 1;
  }

  return counts;
}
