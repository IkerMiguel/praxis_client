# Praxis Client

Frontend de Praxis (Next.js). Consume un backend externo;

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS
- Playwright (e2e)

## Setup local

```bash
npm install
cp .env.example .env
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Copia `.env.example` → `.env` (no se sube a Git).

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_APP_URL` | URL pública del front |
| `NEXT_PUBLIC_API_URL` | URL del backend externo |
| `PLAYWRIGHT_BASE_URL` | Base URL para e2e (local/CI) |

- **Local:** valores en `.env` (p. ej. `http://localhost:3000` / `http://localhost:8080`)
- **Producción:** mismas keys en Vercel → Settings → Environment Variables, luego Redeploy

En código:

- `src/lib/env.ts` — lectura de vars
- `src/lib/api.ts` — `apiFetch()` hacia el backend

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo local |
| `npm run build` | Build de producción |
| `npm run start` | Servir build local |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright |
| `npm run test:e2e:ui` | Playwright con UI |

## Estructura relevante

```
src/app/          # Rutas y UI (App Router)
src/lib/env.ts    # Variables públicas
src/lib/api.ts    # Cliente HTTP al API externo
tests/            # E2E Playwright
.github/workflows # CI (lint + e2e)
```
