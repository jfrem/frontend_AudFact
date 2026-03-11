/**
 * Tipos TypeScript para los modelos del backend PHP de AudFact.
 * Alineados con las columnas reales de SQL Server.
 */

// ── Clientes / EPS ──
export interface Client {
  NitSec: string;
  NitCom: string;
}

// ── Facturas ──
export interface Invoice {
  Dispensa: string;
  FacSec: string;
  NitSec?: string;
}

// ── Adjuntos ──
export interface Attachment {
  id_documento: string;
  nombre_documento: string;
  nombre_alternativo?: string;
  TipoAlmacenamiento: 'BLOB' | 'URL' | 'SIN_DOCUMENTOS';
}

// ── Resultados de Auditoría (endpoint: /audit/documents-history) ──
export interface AuditResult {
  NroFactura: string;
  DispensacionID: string;
  DetalleID: string;
  AdjuntoID: string;
  NombreDocumento: string;
  EstadoSoporte: string;
  ObservacionRechazo: string | null;
  UsuarioAuditor: string;
  FechaAuditoria: string;
  UsuarioRechazo: string | null;
}

// ── Auditoría Status (endpoint: /audit/results → tabla AudDispEst) ──
export interface AuditStatus {
  FacSec: string;
  FacNro: string;
  EstAud: number;                   // BIT: 0=Pendiente, 1=Procesado
  EstadoDetallado: string | null;   // 'success' | 'warning' | 'error' | null
  RequiereRevisionHumana: number;   // BIT: 0/1
  Severidad: string | null;         // texto libre o null
  Hallazgos: string | null;         // JSON string o null
  DetalleError: string | null;
  DocumentosProcesados: number | null;
  DocumentoFallido: string | null;
  DuracionProcesamientoMs: number | null;
  FacNitSec: string;
  FechaCreacion: string;
  FechaActualizacion: string;
}

// ── KPI / Métricas (calculadas en frontend) ──
export interface AuditKpi {
  totalAudited: number;
  totalApproved: number;
  totalRejected: number;
  totalPending: number;
}

// ── Dispensación ──
export interface Dispensation {
  NumeroFactura: string;
  FacSec: string;
  NitSec?: string;
  NITCliente?: string;
  NitCom?: string;
  Cliente?: string;
  IPS?: string;
  IPS_NIT?: string;
  Tipo?: string;
  NumeroAutorizacion?: string;
  NombrePaciente?: string;
  TipoDocumentoPaciente?: string;
  DocumentoPaciente?: string;
  RegimenPaciente?: string;
  Medico?: string;
  TipoDocumentoMedico?: string;
  DocumentoMedico?: string;
  CodigoDiagnostico?: string;
  CodigoArticulo?: string;
  CodigoProducto?: string;
  NombreArticulo?: string;
  CantidadEntregada?: string;
  CantidadPrescrita?: string;
  Lote?: string;
  FechaVencimiento?: string;
  FechaEntrega?: string;
  FechaFormula?: string;
  FechaAutorizacion?: string;
}

// ── Filtros del Dashboard ──
export interface DashboardFilters {
  facNitSec?: number;
  dateFrom?: string;
  dateTo?: string;
}
