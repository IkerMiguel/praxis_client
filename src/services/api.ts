import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/lib/env';
import type { Profile, RoleCode, SessionResponse } from '@/types/auth';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

const apiBaseUrl = `${env.apiUrl.replace(/\/+$/, '')}/api/v1`;

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

let accessToken: string | null = null;
let activeRole: RoleCode | null = null;
let refreshRequest: Promise<SessionResponse> | null = null;

type SessionListener = (event: { type: 'refreshed'; profile: Profile } | { type: 'expired' }) => void;
const listeners = new Set<SessionListener>();

/** Permite al proveedor de sesión enterarse de refrescos silenciosos y de sesiones vencidas. */
export function onSessionChange(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

export function hasAccessToken(): boolean {
  return accessToken !== null;
}

/** Rol con el que actúa el usuario; viaja en la cabecera X-Active-Role. */
export function setActiveRoleHeader(role: RoleCode | null): void {
  activeRole = role;
}

/**
 * Rota el refresh token (cookie HttpOnly) y guarda el nuevo access token.
 * Comparte la petición en curso para no rotar dos veces la misma cookie.
 */
export function refreshSession(): Promise<SessionResponse> {
  if (!refreshRequest) {
    refreshRequest = axios
      .post<SessionResponse>(`${apiBaseUrl}/auth/refresh`, null, {
        withCredentials: true,
        headers: { Accept: 'application/json' },
      })
      .then(({ data }) => {
        setAccessToken(data.access_token);
        listeners.forEach((listener) => listener({ type: 'refreshed', profile: data.usuario }));
        return data;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (activeRole) {
    config.headers['X-Active-Role'] = activeRole;
  }

  return config;
});

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config;
  const authRequest = /\/auth\/(login|refresh)$/.test(config?.url ?? '');

  if (error.response?.status !== 401 || !config || authRequest || config._retry) {
    return Promise.reject(error);
  }

  config._retry = true;

  try {
    await refreshSession();
    return api(config);
  } catch (refreshError) {
    clearAccessToken();
    listeners.forEach((listener) => listener({ type: 'expired' }));
    return Promise.reject(refreshError);
  }
});

export default api;
