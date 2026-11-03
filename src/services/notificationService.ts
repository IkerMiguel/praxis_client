import api from './api';
import type { Paginated } from '@/types/api';

export interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  incidencia: { id: string; codigo_ticket: string } | null;
  fecha_envio: string;
  fecha_lectura: string | null;
}

export type NotificationPage = Paginated<Notificacion, { no_leidas: number }>;

/** Centro de notificaciones (HU-2.5). */
export const notificationService = {
  list: async (params: { page?: number; per_page?: number; solo_no_leidas?: boolean } = {}): Promise<NotificationPage> => {
    const { data } = await api.get<NotificationPage>('/notificaciones', {
      params: { ...params, solo_no_leidas: params.solo_no_leidas ? 1 : undefined },
    });
    return data;
  },

  markRead: async (id: number): Promise<number> => {
    const { data } = await api.patch<{ meta: { no_leidas: number } }>(`/notificaciones/${id}/leer`);
    return data.meta.no_leidas;
  },

  markAll: async (): Promise<number> => {
    const { data } = await api.patch<{ meta: { no_leidas: number } }>('/notificaciones/leer-todas');
    return data.meta.no_leidas;
  },
};
