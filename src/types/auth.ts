export interface LoginCredentials {
  email: string;
  password: string;
  return_url?: string;
}

/** Códigos de rol de la matriz D03. */
export type RoleCode = 'R01' | 'R02' | 'R03' | 'R04' | 'R05' | 'R06' | 'R07';

export type AccessLevel = 'TOTAL' | 'LECTURA' | 'ASIGNADAS';

export interface UserRole {
  codigo: RoleCode;
  nombre: string;
  ruta_inicio: string;
}

export interface Especialidad {
  id?: number;
  codigo?: string;
  nombre: string;
}

/** Perfil que devuelven /auth/login, /auth/refresh y /auth/me. */
export interface Profile {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  roles: UserRole[];
  rol_activo: { codigo: RoleCode; nombre: string } | null;
  ruta_inicio: string | null;
  especialidades: Especialidad[];
  permisos: { modulo: string; nivel_acceso: AccessLevel }[];
}

/** Respuesta de /auth/login y /auth/refresh. */
export interface SessionResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_expires_in: number;
  redirect_to: string | null;
  usuario: Profile;
}

/** Ítem de /navegacion/menu (matriz D09 del rol activo). */
export interface MenuItem {
  codigo: string;
  etiqueta: string;
  ruta: string;
  icono: string | null;
  grupo: string;
  solo_lectura: boolean;
  nivel_acceso: AccessLevel;
}
