import axios from 'axios';

/**
 * El backend responde errores como Problem Details (RFC 7807):
 * { title, status, detail, errors?: { campo: string[] } }.
 */
interface ProblemDetails {
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

function problemFrom(err: unknown): ProblemDetails | null {
  if (!axios.isAxiosError(err)) return null;
  const data = err.response?.data;
  return data && typeof data === 'object' ? (data as ProblemDetails) : null;
}

export function apiStatus(err: unknown): number | null {
  return axios.isAxiosError(err) ? err.response?.status ?? null : null;
}

/** Primer mensaje de validación de cada campo (respuestas 422). */
export function apiFieldErrors(err: unknown): Record<string, string> {
  const errors = problemFrom(err)?.errors;
  if (!errors) return {};

  return Object.fromEntries(
    Object.entries(errors)
      .filter(([, messages]) => Array.isArray(messages) && messages.length > 0)
      .map(([field, messages]) => [field, messages[0]]),
  );
}

/** Mensaje legible para mostrar al usuario a partir de un error de la API. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && !err.response) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
  }

  const problem = problemFrom(err);
  const firstFieldError = Object.values(apiFieldErrors(err))[0];

  return firstFieldError ?? problem?.detail ?? problem?.title ?? fallback;
}
