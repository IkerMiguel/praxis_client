import type { EstadoRef, PrioridadRef, Ref, Ubicacion } from './api';
import type { Evidencia } from '@/services/evidenceService';

export interface EvidenciaDetalle extends Evidencia {
  usuario_carga?: { id: number; name: string } | null;
}

/** Evento de la línea de tiempo de auditoría (historial). */
export interface EventoHistorial {
  id: string;
  incidencia_id?: string;
  tipo_evento: string;
  categoria: string;
  fecha_hora: string;
  usuario: { id: number; name?: string; nombre?: string } | null;
  rol: string | null;
  estado_anterior: { codigo: string; nombre: string } | null;
  estado_nuevo: { codigo: string; nombre: string } | null;
  motivo: string | null;
  datos: Record<string, unknown> | null;
  evidencias?: { evidencia_id: number; nombre_original?: string; mime_type?: string }[] | null;
}

export interface Aclaracion {
  id: number;
  pregunta: string;
  fecha_solicitud: string;
  fecha_limite_respuesta: string | null;
}

export interface Reapertura {
  permitido: boolean;
  motivo: string | null;
  fecha_limite: string | null;
  reaperturas_restantes: number;
}

/** Ficha de seguimiento del reportante (GET /mis-solicitudes/{id}). */
export interface SolicitudDetalle {
  id: string;
  codigo_ticket: string;
  resumen: string;
  descripcion: string;
  canal_radicacion: string | null;
  estado: EstadoRef & { significado?: string };
  categoria: Ref | null;
  subcategoria: Ref | null;
  prioridad: PrioridadRef | null;
  ubicacion: Ubicacion;
  es_riesgo_inmediato: boolean;
  posible_duplicado: boolean;
  fecha_registro: string;
  fecha_actualizacion: string;
  fecha_cierre: string | null;
  es_creador: boolean;
  es_seguimiento: boolean;
  evidencias: EvidenciaDetalle[];
  aclaracion_pendiente: Aclaracion | null;
  incidencia_principal: { id: string; codigo_ticket: string; resumen?: string; estado?: EstadoRef } | null;
  resultado_cierre: string | Record<string, unknown> | null;
  historial: EventoHistorial[];
  acciones: {
    puede_cancelar: boolean;
    mensaje_cancelacion: string | null;
    puede_responder_aclaracion: boolean;
    puede_confirmar: boolean;
    puede_reabrir: boolean;
    reapertura: Reapertura;
    puede_crear_reporte_basado: boolean;
  };
}
