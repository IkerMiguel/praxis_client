import api from './api';
import type { IncidenciaResumen, Paginated } from '@/types/api';
import type { EventoHistorial } from '@/types/incident';
import type { ConsolaFila, IncidenciaOperativa, Nivel3, PosibleDuplicado, SolicitudRecursos, TecnicoDisponible, Urgencia } from '@/types/ops';

interface Result {
  mensaje?: string;
  data?: unknown;
}

export interface ConsolaFiltros {
  estado?: string;
  sede_id?: number;
  edificio_id?: number;
  categoria_id?: number;
  prioridad?: string;
  tecnico_id?: number;
  q?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  riesgo_inmediato?: boolean;
  page?: number;
  per_page?: number;
}

export interface Horario {
  fecha_programada: string;
  hora_inicio: string;
  hora_fin: string;
  cuadrilla?: string;
  observaciones?: string;
}

const post = async (url: string, body?: object): Promise<Result> => (await api.post<Result>(url, body ?? {})).data;
const patch = async (url: string, body?: object): Promise<Result> => (await api.patch<Result>(url, body ?? {})).data;
const clean = <T extends object>(params: T) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null && v !== false));

/** Operación de incidencias: ficha, bandejas y transiciones de E05 a E10. */
export const opsService = {
  detail: async (id: string): Promise<IncidenciaOperativa> => (await api.get<{ data: IncidenciaOperativa }>(`/incidencias/${id}`)).data.data,
  historial: async (id: string): Promise<EventoHistorial[]> => (await api.get<{ data: EventoHistorial[] }>(`/incidencias/${id}/historial`)).data.data,

  consola: async (filtros: ConsolaFiltros): Promise<Paginated<ConsolaFila, { sin_resultados?: boolean }>> =>
    (await api.get<Paginated<ConsolaFila, { sin_resultados?: boolean }>>('/consola/incidencias', { params: { ...clean(filtros), riesgo_inmediato: filtros.riesgo_inmediato ? 1 : undefined } })).data,

  // E05 · Triaje
  iniciarRevision: (id: string) => post(`/incidencias/${id}/iniciar-revision`),
  solicitarAclaracion: (id: string, informacion_requerida: string) => post(`/incidencias/${id}/solicitar-aclaracion`, { informacion_requerida }),
  posiblesDuplicados: async (id: string): Promise<PosibleDuplicado[]> => (await api.get<{ data: PosibleDuplicado[] }>(`/incidencias/${id}/posibles-duplicados`)).data.data,
  vincularDuplicado: (id: string, incidencia_principal_id: string, observaciones?: string) => post(`/incidencias/${id}/vincular-duplicado`, { incidencia_principal_id, observaciones }),
  descartarDuplicado: (id: string, observaciones?: string) => post(`/incidencias/${id}/descartar-duplicado`, { observaciones }),
  clasificar: (id: string, body: { procedente: boolean; motivo?: string; impacto?: Nivel3; urgencia?: Urgencia; justificacion?: string }) => post(`/incidencias/${id}/clasificar`, body),
  cambiarPrioridad: (id: string, body: { impacto: Nivel3; urgencia: Urgencia; justificacion: string }) => patch(`/incidencias/${id}/prioridad`, body),
  evaluarRiesgo: (id: string, body: { tiene_riesgo_inmediato: boolean; nivel_riesgo: string; acciones_adoptadas?: string; observaciones?: string }) => post(`/incidencias/${id}/evaluacion-riesgo`, body),

  // E06 · Planificación
  tecnicosDisponibles: async (categoria_id?: number): Promise<TecnicoDisponible[]> =>
    (await api.get<{ data: TecnicoDisponible[] }>('/tecnicos/disponibles', { params: clean({ categoria_id }) })).data.data,
  asignar: (id: string, body: { tecnico_id: number; instrucciones?: string; fecha_visita_tentativa?: string; motivo_reasignacion?: string }) => post(`/incidencias/${id}/asignar`, clean(body)),
  programar: (id: string, body: Horario) => post(`/incidencias/${id}/programar`, clean(body)),
  reprogramar: (id: string, body: Horario & { motivo: string }) => patch(`/incidencias/${id}/reprogramar`, clean(body)),
  devolverDiagnostico: (id: string, observaciones: string) => post(`/incidencias/${id}/devolver-diagnostico`, { observaciones }),
  cerrarNoConfirmada: (id: string, observaciones?: string) => post(`/incidencias/${id}/cerrar-no-confirmada`, clean({ observaciones })),

  // E07 · Técnico
  tareas: async (page = 1): Promise<Paginated<IncidenciaResumen>> => (await api.get<Paginated<IncidenciaResumen>>('/tecnico/tareas', { params: { page, per_page: 50 } })).data,
  iniciarInspeccion: (id: string) => post(`/incidencias/${id}/iniciar-inspeccion`),
  diagnostico: (id: string, body: { hallazgos: string; descripcion_problema: string; alcance?: string; intervencion_propuesta: string; requiere_recursos: boolean; requiere_autorizacion: boolean; evidencias: number[] }) =>
    post(`/incidencias/${id}/diagnostico`, body),
  descartarPorInspeccion: (id: string, body: { hallazgos: string; justificacion: string; evidencias: number[] }) => post(`/incidencias/${id}/descartar-por-inspeccion`, body),
  iniciarAtencion: (id: string) => post(`/incidencias/${id}/iniciar-atencion`),
  registrarIntervencion: (
    id: string,
    body: { actividades_realizadas: string; tiempo_invertido_minutos: number; dificultades_observaciones?: string; materiales: { nombre: string; cantidad: number; unidad: string }[]; evidencias: number[] },
  ) => post(`/incidencias/${id}/registrar-intervencion`, body),
  suspender: (id: string, body: { causal: string; motivo_detallado: string; condiciones_reanudacion: string }) => post(`/incidencias/${id}/suspender`, body),
  reanudar: (id: string, body: { estado_destino: 'E10' | 'E11'; observacion: string; fecha_programada?: string; hora_inicio?: string; hora_fin?: string }) => post(`/incidencias/${id}/reanudar`, clean(body)),

  // E08 · Recursos
  solicitarRecursos: (
    id: string,
    body: { decision_requerida: string; requiere_autorizacion: boolean; es_emergencia?: boolean; items: { recurso_nombre: string; cantidad: number; unidad: string; costo_estimado?: number }[] },
  ) => post(`/incidencias/${id}/solicitudes-recursos`, body),
  autorizacionesPendientes: async (): Promise<SolicitudRecursos[]> => (await api.get<{ data: SolicitudRecursos[] }>('/autorizaciones/pendientes')).data.data,
  dictamen: (
    solicitudId: number,
    body: { resultado: 'APROBADA' | 'RECHAZADA'; justificacion?: string; recursos_disponibles?: boolean; accion_rechazo?: string; condiciones_reanudacion?: string; fecha_programada?: string; hora_inicio?: string; hora_fin?: string },
  ) => post(`/solicitudes-recursos/${solicitudId}/dictamen`, clean(body)),
  confirmarRecursos: (id: string, body: Horario & { todos_disponibles?: boolean; detalles_disponibles?: number[] }) => patch(`/incidencias/${id}/confirmar-recursos`, clean(body)),
  seguimientoRecursos: (solicitudId: number, comentario: string) => post(`/solicitudes-recursos/${solicitudId}/seguimientos`, { comentario }),
  anular: (id: string, motivo: string) => post(`/incidencias/${id}/anular`, { motivo }),

  // E09 · Verificación
  verificacionPendientes: async (page = 1): Promise<Paginated<IncidenciaResumen>> =>
    (await api.get<Paginated<IncidenciaResumen>>('/verificacion/pendientes', { params: { page, per_page: 50 } })).data,
  verificar: (id: string, body: { criterios: { criterio: string; cumple: boolean }[]; observaciones?: string }) => post(`/incidencias/${id}/verificar`, body),
  rechazarVerificacion: (id: string, body: { criterios: { criterio: string; cumple: boolean }[]; observaciones?: string; motivo_rechazo: string; correccion_requerida: string }) =>
    post(`/incidencias/${id}/rechazar-verificacion`, body),
  planificarCorreccion: (id: string, body: Horario) => post(`/incidencias/${id}/planificar-correccion`, clean(body)),
  cierreAdministrativo: (id: string, notas?: string) => post(`/incidencias/${id}/cierre-administrativo`, clean({ notas })),
};
