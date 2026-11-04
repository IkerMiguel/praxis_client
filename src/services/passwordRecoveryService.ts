import api from './api';
import { apiStatus } from '@/lib/apiError';

export interface ResetPasswordPayload {
  token: string;
  password: string;
  password_confirmation: string;
}

export type ResetTokenStatus = 'valid' | 'invalid';

/**
 * Recuperación de contraseña (HU-1.4). El correo nunca revela si la cuenta existe.
 *
 * Flujo por código: solicitar → el correo trae un código numérico de 6 dígitos →
 * `verifyCode` lo canjea por un token de un solo uso → `reset` cambia la contraseña.
 * El enlace `/restablecer-password/{token}` sigue soportado como alternativa.
 */
export const passwordRecoveryService = {
  /** POST /auth/solicitar-recuperacion. Devuelve el mensaje neutro del backend. */
  request: async (email: string): Promise<string> => {
    const { data } = await api.post<{ mensaje: string }>('/auth/solicitar-recuperacion', { email });
    return data.mensaje;
  },

  /**
   * POST /auth/verificar-codigo { email, codigo } → { token }.
   * Contrato propuesto al backend: responde 422 si el código es inválido o venció y 429 si se superan los intentos.
   */
  verifyCode: async (email: string, codigo: string): Promise<string> => {
    const { data } = await api.post<{ token: string }>('/auth/verificar-codigo', { email, codigo });
    return data.token;
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
