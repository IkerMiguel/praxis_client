import api from './api';
import type { ConsolaFila } from '@/types/ops';

export interface Plazos {
  resumen: { en_plazo: number; proximas_a_vencer: number; vencidas: number };
  data: ConsolaFila[];
}

export interface Metricas {
  periodo: { desde: string; hasta: string };
  sin_datos: boolean;
  total_incidencias: number;
  por_estado: { codigo: string; nombre: string; total: number }[];
  por_prioridad: Record<string, number>;
  mttr: { incidencias_cerradas: number; horas_promedio: number | null; texto: string };
  cumplimiento_sla: { evaluadas: number; cumplidas: number; porcentaje: number | null };
  fallas_recurrentes: {
    ventana_dias: number;
    minimo_reportes: number;
    data: { espacio_fisico_id: number; espacio: string; categoria_id: number; categoria: string; reportes: number; ultimo_reporte: string }[];
  };
}

export type Periodo = 'semana' | 'mes' | 'semestre' | 'rango';

/** Plazos SLA y analítica (E10). */
export const analyticsService = {
  plazos: async (estado_sla?: string): Promise<Plazos> => (await api.get<Plazos>('/consola/plazos', { params: { estado_sla: estado_sla || undefined } })).data,
  metricas: async (periodo: Periodo, desde?: string, hasta?: string): Promise<Metricas> =>
    (await api.get<{ data: Metricas }>('/analitica/metricas-basicas', { params: { periodo, desde: periodo === 'rango' ? desde : undefined, hasta: periodo === 'rango' ? hasta : undefined } })).data.data,
};
