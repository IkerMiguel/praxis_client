import type { IncidenciaResumen, PrioridadRef, Ref, Ubicacion, EstadoRef } from './api';
import type { EvidenciaDetalle } from './incident';

export type Nivel3 = 'ALTO' | 'MEDIO' | 'BAJO';
export type Urgencia = 'ALTA' | 'MEDIA' | 'BAJA';

export interface SlaInfo {
  estado: string;
  color: string;
  porcentaje_consumido: number | null;
  minutos_restantes: number | null;
  horas_retraso: number | null;
  fecha_limite: string | null;
}

/** Fila de la consola con tiempo de atención y semáforo SLA. */
export interface ConsolaFila extends IncidenciaResumen {
  tiempo_atencion?: { horas: number; en_curso: boolean; texto: string };
  sla?: SlaInfo | null;
}

interface Persona {
  id: number;
  name: string;
  email?: string;
}

/** EN_INSPECCION → REGISTRADO (espera decisión) → APROBADO o DEVUELTO. */
export type EstadoDiagnostico = 'EN_INSPECCION' | 'REGISTRADO' | 'DEVUELTO' | 'APROBADO';

export interface Diagnostico {
  id: number;
  fecha_inicio_inspeccion: string | null;
  fecha_fin_diagnostico: string | null;
  /** true daño confirmado, false descartado en inspección, null aún sin concluir. */
  incidencia_confirmada: boolean | null;
  hallazgos: string | null;
  descripcion_problema: string | null;
  alcance: string | null;
  intervencion_propuesta: string | null;
  justificacion_no_confirmada: string | null;
  requiere_recursos: boolean;
  requiere_autorizacion: boolean;
  estado: EstadoDiagnostico;
  observaciones_devolucion: string | null;
  fecha_revision: string | null;
  created_at: string;
  tecnico?: Persona;
}

export interface DetalleRecurso {
  id: number;
  recurso_nombre: string;
  cantidad: number;
  unidad: string;
  costo_estimado: number | null;
  disponible: boolean;
}

export interface SolicitudRecursos {
  id: number;
  estado_solicitud: string;
  decision_requerida: string;
  requiere_autorizacion: boolean;
  es_emergencia: boolean;
  resultado_dictamen: string | null;
  justificacion_dictamen: string | null;
  costo_total_estimado: number | null;
  detalles: DetalleRecurso[];
  seguimientos?: { id: number; comentario_seguimiento: string; created_at: string; usuario?: Persona }[];
  recursos_disponibles?: boolean | null;
  fecha_dictamen?: string | null;
  solicitante?: Persona;
  fecha_solicitud?: string;
  created_at?: string;
  incidencia?: { id: string; codigo_ticket: string; resumen: string; estado: EstadoRef; prioridad?: PrioridadRef | null };
}

export interface PlanIntervencion {
  id: number;
  fecha_programada: string;
  hora_inicio: string;
  hora_fin: string;
  cuadrilla: string | null;
  observaciones: string | null;
  estado_plan: 'VIGENTE' | 'EJECUTADO' | 'REEMPLAZADO' | string;
  reprogramaciones?: { id: number; motivo?: string; created_at?: string }[];
  created_at: string;
}

export interface Actividad {
  id: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  actividades_realizadas: string;
  tiempo_invertido_minutos: number;
  dificultades_observaciones: string | null;
  materiales?: { id: number; nombre: string; cantidad: number; unidad: string }[] | null;
  created_at?: string;
  tecnico_ejecutor?: Persona;
}

export interface Suspension {
  id: number;
  causal: string;
  motivo_detallado: string;
  condiciones_reanudacion: string;
  estado_origen: string;
  fecha_suspension: string;
  observacion_reanudacion: string | null;
  estado_destino: string | null;
  fecha_reanudacion: string | null;
}

export interface Verificacion {
  id: number;
  resultado_conforme: boolean;
  criterios_evaluados: { criterio: string; cumple: boolean }[] | null;
  observaciones: string | null;
  motivo_rechazo: string | null;
  correccion_requerida: string | null;
  created_at: string;
  verificador?: Persona;
}

/** Ficha operativa (GET /incidencias/{id}). */
export interface IncidenciaOperativa {
  id: string;
  codigo_ticket: string;
  resumen: string;
  descripcion: string;
  canal_radicacion: string | null;
  estado: EstadoRef & { significado?: string };
  categoria: (Ref & { codigo: string }) | null;
  subcategoria: Ref | null;
  prioridad: PrioridadRef | null;
  ubicacion: Ubicacion;
  es_riesgo_inmediato: boolean;
  posible_duplicado: boolean;
  fecha_registro: string;
  fecha_actualizacion: string;
  fecha_cierre: string | null;
  reportante: Persona | null;
  tecnico_asignado: Persona | null;
  impacto: Nivel3 | null;
  urgencia: Urgencia | null;
  protocolo_emergencia_activo: boolean;
  descripcion_riesgo: string | null;
  numero_reaperturas: number;
  numero_reprocesos: number;
  resultado_final_cierre: string | null;
  incidencia_principal: { id: string; codigo_ticket: string; resumen?: string } | null;
  duplicados_vinculados: { id: string; codigo_ticket: string; resumen: string }[];
  sla: {
    fecha_limite_respuesta: string | null;
    fecha_primera_respuesta: string | null;
    sla_respuesta_cumplido: boolean | null;
    resolucion: SlaInfo | null;
  } | null;
  aclaraciones: {
    id: number;
    pregunta_gestor: string;
    fecha_solicitud: string;
    fecha_limite_respuesta: string | null;
    respuesta_reportante: string | null;
    fecha_respuesta: string | null;
    estado: string;
    gestor?: Persona;
  }[];
  evaluaciones_riesgo: {
    id: number;
    tiene_riesgo_inmediato: boolean;
    nivel_riesgo: string;
    protocolo_activado: boolean;
    acciones_adoptadas: string | null;
    observaciones: string | null;
    created_at: string;
    evaluador?: Persona;
  }[];
  asignaciones: {
    id: number;
    es_vigente: boolean;
    instrucciones: string | null;
    fecha_visita_tentativa: string | null;
    motivo_reasignacion: string | null;
    excepcion_wip: boolean;
    created_at: string;
    tecnico?: Persona;
    asignado_por?: Persona;
  }[];
  diagnosticos: Diagnostico[];
  solicitudes_recursos: SolicitudRecursos[];
  planes_intervencion: PlanIntervencion[];
  actividades: Actividad[];
  suspensiones: Suspension[];
  verificaciones: Verificacion[];
  evidencias: EvidenciaDetalle[];
  transiciones_disponibles: string[];
}

export interface TecnicoDisponible {
  id: number;
  nombre: string;
  email: string;
  especialidades: { id: number; codigo: string; nombre: string }[];
  carga_actual: number;
  limite_wip: number;
  disponible: boolean;
}

export interface PosibleDuplicado {
  id: string;
  codigo_ticket: string;
  resumen: string;
  descripcion: string;
  estado: EstadoRef;
  categoria: { id: number; nombre: string };
  espacio: { id: number; nombre: string };
  fecha_registro: string;
  evidencias: number;
  criterios: { misma_ubicacion: boolean; misma_categoria: boolean; similitud_descripcion: number };
  puntaje: number;
}
