import api from './api';

export interface Espacio { id: number; codigo: string; nombre: string; tipo?: string; activo?: boolean }
export interface Piso { id: number; codigo: string; nombre: string; nivel?: number; activo?: boolean; espacios: Espacio[] }
export interface Edificio { id: number; codigo: string; nombre: string; activo?: boolean; pisos: Piso[] }
export interface Sede { id: number; codigo: string; nombre: string; activo?: boolean; edificios: Edificio[] }

export interface Subcategoria {
  id: number;
  codigo: string;
  nombre: string;
  exige_evidencia_fotografica: boolean;
  activo?: boolean;
}

export interface Categoria {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  exige_evidencia_fotografica: boolean;
  requiere_confirmacion_cierre: boolean;
  nivel_riesgo_base: string;
  especialidad: { id: number; codigo: string; nombre: string } | null;
  subcategorias: Subcategoria[];
  activo?: boolean;
}

export interface Prioridad {
  id: number;
  codigo: string;
  nombre: string;
  nivel: number;
  horas_primera_respuesta: number;
  horas_resolucion: number;
  color: string;
}

/** Catálogos de solo lectura (E03). */
export const catalogService = {
  ubicaciones: async (): Promise<Sede[]> => (await api.get<{ data: Sede[] }>('/catalogo/ubicaciones/arbol-activo')).data.data,
  categorias: async (): Promise<Categoria[]> => (await api.get<{ data: Categoria[] }>('/catalogo/categorias')).data.data,
  prioridades: async (): Promise<Prioridad[]> => (await api.get<{ data: Prioridad[] }>('/catalogo/prioridades')).data.data,
};
