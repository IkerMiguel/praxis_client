/**
 * Variables públicas del front. El backend se consume; no se hospeda aquí.
 * En el navegador solo existen las que empiezan por NEXT_PUBLIC_.
 */
export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
} as const;
