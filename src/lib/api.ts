import { env } from "./env";

/**
 * Llama al backend externo usando NEXT_PUBLIC_API_URL.
 * Local → .env | Producción → variable de Vercel (mismo nombre).
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${env.apiUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText} (${url})`);
  }

  return res.json() as Promise<T>;
}
