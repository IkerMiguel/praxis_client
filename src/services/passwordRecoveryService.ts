import api from './api';
import { apiStatus } from '@/lib/apiError';

export interface ResetPasswordPayload {
  token: string;
  password: string;
  password_confirmation: string;
}

export type ResetTokenStatus = 'valid' | 'invalid';

/**
 * Recuperación de contraseña (HU-1.4). El backend envía un enlace de un solo uso
 * a `${FRONTEND_URL}/restablecer-password/{token}` y nunca revela si el correo existe.
 */
export const passwordRecoveryService = {
  /** POST /auth/solicitar-recuperacion. Devuelve el mensaje neutro del backend. */
  request: async (email: string): Promise<string> => {
    const { data } = await api.post<{ mensaje: string }>('/auth/solicitar-recuperacion', { email });
    return data.mensaje;
  },

  /** GET /auth/restablecer-password/{token}. 410 = enlace expirado, usado o inexistente. */
  validateToken: async (token: string): Promise<ResetTokenStatus> => {
    try {
      await api.get(`/auth/restablecer-password/${encodeURIComponent(token)}`);
      return 'valid';
    } catch (err) {
      if (apiStatus(err) === 410) return 'invalid';
      throw err;
    }
  },

  /** POST /auth/restablecer-password. Cierra todas las sesiones del usuario. */
  reset: async (payload: ResetPasswordPayload): Promise<string> => {
    const { data } = await api.post<{ mensaje: string }>('/auth/restablecer-password', payload);
    return data.mensaje;
  },
};
