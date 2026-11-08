import api from './api';
import type { RoleCode } from '@/types/auth';
import type { Paginated } from '@/types/api';
import type { EventoHistorial } from '@/types/incident';

export interface AdminUser {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  bloqueado_hasta: string | null;
  ultimo_acceso_en: string | null;
  roles: { codigo: RoleCode; nombre: string }[];
  especialidades: { id?: number; codigo: string; nombre: string }[];
  fecha_creacion: string;
}

export interface RolCatalogo {
  id: number;
  codigo: RoleCode;
  nombre: string;
  descripcion: string;
  ruta_inicio: string;
}

export interface EspecialidadCatalogo {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export type NivelUbicacion = 'sedes' | 'edificios' | 'pisos' | 'espacios';

interface NodoBase {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
export interface EspacioAdmin extends NodoBase { piso_id: number; tipo: string | null }
export interface PisoAdmin extends NodoBase { edificio_id: number; nivel: number | null; espacios: EspacioAdmin[] }
export interface EdificioAdmin extends NodoBase { sede_id: number; pisos: PisoAdmin[] }
export interface SedeAdmin extends NodoBase { direccion: string | null; edificios: EdificioAdmin[] }

export interface CategoriaAdmin {
  id: number;
  categoria_padre_id: number | null;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  exige_evidencia_fotografica: boolean;
  requiere_confirmacion_cierre: boolean;
  nivel_riesgo_base: 'BAJO' | 'MEDIO' | 'ALTO';
  especialidad_id: number | null;
  activo: boolean;
  subcategorias?: CategoriaAdmin[];
}

export interface Parametros {
  matriz_prioridad: { impacto: string; urgencia: string; prioridad: string }[];
  sla: { codigo: string; nombre: string; horas_primera_respuesta: number; horas_resolucion: number }[];
  parametros: { clave: string; valor: number; tipo_dato: string; grupo: string; descripcion: string; actualizado_en: string }[];
}

export interface CategoriaPayload {
  codigo?: string;
  nombre?: string;
  categoria_padre_id?: number | null;
  descripcion?: string | null;
  exige_evidencia_fotografica?: boolean;
  requiere_confirmacion_cierre?: boolean;
  nivel_riesgo_base?: string;
  especialidad_id?: number | null;
  activo?: boolean;
}

/** Administración de usuarios (HU-1.2) y parametrización (E11). */
export const adminService = {
  users: async (params: { q?: string; rol?: string; activo?: string; page?: number }): Promise<Paginated<AdminUser>> =>
    (await api.get<Paginated<AdminUser>>('/admin/usuarios', { params: { ...params, q: params.q || undefined, rol: params.rol || undefined, activo: params.activo || undefined, per_page: 15 } })).data,
  createUser: async (body: { nombre: string; email: string; telefono?: string; password?: string; roles: RoleCode[]; especialidades: string[]; motivo?: string }) =>
    (await api.post<{ data: AdminUser }>('/admin/usuarios', body)).data.data,
  updateUser: async (id: number, body: { nombre?: string; email?: string; telefono?: string | null; password?: string; especialidades?: string[]; motivo?: string }) =>
    (await api.put<{ data: AdminUser }>(`/admin/usuarios/${id}`, body)).data.data,
  setRoles: async (id: number, roles: RoleCode[], motivo?: string) => (await api.put<{ data: AdminUser }>(`/admin/usuarios/${id}/roles`, { roles, motivo })).data.data,
  setUserState: async (id: number, activo: boolean, motivo?: string) => (await api.patch<{ data: AdminUser }>(`/admin/usuarios/${id}/estado`, { activo, motivo })).data.data,
  roles: async (): Promise<RolCatalogo[]> => (await api.get<{ data: RolCatalogo[] }>('/admin/roles')).data.data,
  especialidades: async (): Promise<EspecialidadCatalogo[]> => (await api.get<{ data: EspecialidadCatalogo[] }>('/admin/especialidades')).data.data,

  locations: async (): Promise<SedeAdmin[]> => (await api.get<{ data: SedeAdmin[] }>('/admin/ubicaciones')).data.data,
  createLocation: async (nivel: NivelUbicacion, body: Record<string, unknown>) => (await api.post(`/admin/ubicaciones/${nivel}`, body)).data,
  updateLocation: async (nivel: NivelUbicacion, id: number, body: Record<string, unknown>) => (await api.put(`/admin/ubicaciones/${nivel}/${id}`, body)).data,
  setLocationState: async (nivel: NivelUbicacion, id: number, activo: boolean, motivo?: string) => (await api.patch(`/admin/ubicaciones/${nivel}/${id}/estado`, { activo, motivo })).data,
  deleteLocation: async (nivel: NivelUbicacion, id: number) => (await api.delete(`/admin/ubicaciones/${nivel}/${id}`)).data,

  categories: async (): Promise<CategoriaAdmin[]> => (await api.get<{ data: CategoriaAdmin[] }>('/admin/categorias')).data.data,
  createCategory: async (body: CategoriaPayload) => (await api.post('/admin/categorias', body)).data,
  updateCategory: async (id: number, body: CategoriaPayload) => (await api.put(`/admin/categorias/${id}`, body)).data,

  parameters: async (): Promise<Parametros> => (await api.get<{ data: Parametros }>('/admin/parametros')).data.data,
  updateParameters: async (body: { matriz?: Parametros['matriz_prioridad']; sla?: Omit<Parametros['sla'][number], 'nombre'>[]; parametros?: Record<string, number> }) =>
    (await api.put('/admin/parametros', body)).data,
  history: async (page = 1): Promise<Paginated<EventoHistorial>> => (await api.get<Paginated<EventoHistorial>>('/admin/parametros/historial', { params: { page, per_page: 20 } })).data,
};
