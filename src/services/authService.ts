import api, { clearAccessToken, refreshSession, setAccessToken } from './api';
import type { LoginCredentials, MenuItem, Profile, SessionResponse } from '@/types/auth';

export const authService = {
  /** POST /auth/login. `redirect_to` es la ruta de inicio del rol o el deep-link pedido. */
  login: async (credentials: LoginCredentials): Promise<SessionResponse> => {
    const { data } = await api.post<SessionResponse>('/auth/login', credentials);
    setAccessToken(data.access_token);
    return data;
  },

  /** Recupera la sesión desde la cookie de refresh (por ejemplo, al recargar la página). */
  restore: (): Promise<SessionResponse> => refreshSession(),

  /** GET /auth/me: perfil según el rol activo. */
  me: async (): Promise<Profile> => {
    const { data } = await api.get<{ data: Profile }>('/auth/me');
    return data.data;
  },

  /** GET /navegacion/menu: módulos visibles para el rol activo (D09). */
  menu: async (): Promise<MenuItem[]> => {
    const { data } = await api.get<{ data: MenuItem[] }>('/navegacion/menu');
    return data.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
    }
  },
};
