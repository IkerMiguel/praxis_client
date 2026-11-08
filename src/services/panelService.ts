import api from './api';
import type { IncidenciaResumen } from '@/types/api';

export interface PanelResumen {
  total: number;
  por_estado: { codigo: string; nombre: string; total: number }[];
  requieren_accion: { pendiente_informacion: number; pendiente_confirmacion: number };
  activas: number;
  recientes: IncidenciaResumen[];
}

export interface EstadoGlosario {
  codigo: string;
  nombre: string;
  significado: string;
  color: string;
  categoria: string;
  requiere_accion_reportante: boolean;
  es_terminal: boolean;
}

export const panelService = {
  /** GET /panel/resumen (HU-2.3). */
  resumen: async (): Promise<PanelResumen> => {
    const { data } = await api.get<{ data: PanelResumen }>('/panel/resumen');
    return data.data;
  },

  /** GET /catalogo/glosario-estados (HU-2.4). */
  glosario: async (): Promise<EstadoGlosario[]> => {
    const { data } = await api.get<{ data: EstadoGlosario[] }>('/catalogo/glosario-estados');
    return data.data;
  },
};
