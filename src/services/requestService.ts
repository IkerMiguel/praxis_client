import api from './api';
import type { IncidenciaResumen, Paginated } from '@/types/api';
import type { SolicitudDetalle } from '@/types/incident';

export type Ambito = 'propias' | 'seguidas' | 'todas';

export type SolicitudesPage = Paginated<IncidenciaResumen, { filtros?: { estado: string[]; q: string | null }; sin_resultados?: boolean }>;

interface ActionResult {
  mensaje: string;
  data?: { estado?: string };
}

/** Mis solicitudes y acciones del reportante (E04). */
export const requestService = {
  list: async (params: { estado?: string; q?: string; ambito?: Ambito; page?: number; per_page?: number }): Promise<SolicitudesPage> => {
    const { data } = await api.get<SolicitudesPage>('/mis-solicitudes', { params: { ...params, q: params.q || undefined, estado: params.estado || undefined } });
    return data;
  },

  detail: async (id: string): Promise<SolicitudDetalle> => {
    const { data } = await api.get<{ data: SolicitudDetalle }>(`/mis-solicitudes/${id}`);
    return data.data;
  },

  responderAclaracion: async (id: string, respuesta: string, evidencias: number[]): Promise<ActionResult> =>
    (await api.post<ActionResult>(`/mis-solicitudes/${id}/aclaraciones`, { respuesta, evidencias })).data,

  cancelar: async (id: string, motivo: string): Promise<ActionResult> =>
    (await api.post<ActionResult>(`/incidencias/${id}/cancelar-solicitante`, { motivo })).data,

  reabrir: async (id: string, motivo: string): Promise<ActionResult> => (await api.post<ActionResult>(`/incidencias/${id}/reabrir`, { motivo })).data,

  confirmar: async (id: string, calificacion: number, comentario?: string): Promise<ActionResult> =>
    (await api.post<ActionResult>(`/incidencias/${id}/confirmar`, { calificacion, comentario: comentario || undefined })).data,

  rechazarConformidad: async (id: string, motivo: string): Promise<ActionResult> =>
    (await api.post<ActionResult>(`/incidencias/${id}/rechazar-conformidad`, { motivo })).data,
};
