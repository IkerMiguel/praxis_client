import api from './api';

export interface RadicarPayload {
  sede_id: number;
  edificio_id: number;
  piso_id: number;
  espacio_fisico_id: number;
  categoria_id: number;
  subcategoria_id?: number;
  resumen?: string;
  descripcion: string;
  canal_radicacion: 'WEB' | 'MOVIL';
  es_riesgo_inmediato: boolean;
  descripcion_riesgo?: string;
  es_problema_diferente?: boolean;
  evidencias: number[];
}

export interface Radicada {
  id: string;
  codigo_ticket: string;
  estado: { codigo: string; nombre: string };
  posible_duplicado: boolean;
  es_riesgo_inmediato: boolean;
  fecha_registro: string;
}

export interface Coincidencia {
  id: string;
  codigo_ticket: string;
  resumen: string;
  categoria: { id: number; nombre: string };
  estado: { codigo: string; nombre: string };
  fecha_registro: string;
  es_mia: boolean;
  ya_suscrito: boolean;
}

/** Radicación de incidencias (E03). */
export const reportService = {
  /** POST /incidencias/radicar con Idempotency-Key para que un doble envío no duplique el ticket. */
  radicar: async (payload: RadicarPayload, idempotencyKey: string): Promise<Radicada> => {
    const { data } = await api.post<{ data: Radicada }>('/incidencias/radicar', payload, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return data.data;
  },

  coincidencias: async (espacioId: number, categoriaId?: number): Promise<Coincidencia[]> => {
    const { data } = await api.get<{ hay_coincidencias: boolean; data: Coincidencia[] }>('/incidencias/coincidencias-activas', {
      params: { espacio_fisico_id: espacioId, categoria_id: categoriaId },
    });
    return data.data;
  },

  suscribir: async (incidenciaId: string): Promise<string> => {
    const { data } = await api.post<{ mensaje: string }>(`/incidencias/${incidenciaId}/suscribir-seguimiento`);
    return data.mensaje;
  },
};
