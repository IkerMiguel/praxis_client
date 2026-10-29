import api from './api';
import { LoginCredentials, AuthResponse } from '@/types/auth';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Cuando Laravel tenga la ruta lista, desatentas la petición real:
    // const { data } = await api.post('/login', credentials);
    // return data;

    // Simulación (Mock) mientras el backend está en desarrollo:
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          token: 'mock_jwt_token_12345',
          user: { id: 1, name: 'Usuario Prueba', email: credentials.email },
        });
      }, 2000);
    });
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('auth_token');
  },
};