# Integración del frontend con el backend

## ¿Por qué se hicieron estos cambios?

El frontend y el backend estaban preparados para comunicarse, pero el formulario de inicio de sesión todavía devolvía una respuesta simulada. Además, el cliente Axios usaba una variable de entorno distinta a la documentada y una URL local que no correspondía con el puerto publicado por Docker.

El backend expone su API bajo `/api/v1` y Docker publica el servicio en `http://localhost:8000`. Por eso se alineó el cliente del frontend con esa dirección y con el contrato real de autenticación de Laravel.

## Cambios realizados

- `src/lib/env.ts`: el valor por defecto de `NEXT_PUBLIC_API_URL` es ahora `http://localhost:8000`.
- `.env.example`: se actualizó la URL local del backend a `http://localhost:8000`.
- `src/services/api.ts`:
  - Construye la base de Axios como `${NEXT_PUBLIC_API_URL}/api/v1`.
  - Incluye credenciales para que el navegador envíe y reciba la cookie HttpOnly de refresh.
  - Adjunta el access token como `Bearer` en las solicitudes autenticadas, manteniéndolo en memoria y no en `localStorage`.
  - Ante un `401` de una ruta protegida, intenta renovar el access token con `/auth/refresh` y repite la solicitud una vez.
- `src/services/authService.ts`:
  - Reemplaza el login simulado por `POST /auth/login`.
  - Adapta la respuesta del backend (`access_token` y `usuario`) al tipo que consume el frontend (`token` y `user`).
  - Cierra la sesión llamando a `POST /auth/logout` y elimina el token de memoria.
- `src/components/auth/LoginForm.tsx`: muestra el resultado del login y mensajes de error del backend o de conexión.
- `README.md`: actualiza el ejemplo de URL local del backend.

## Cómo probarlo localmente

1. Levanta el backend con Docker y confirma que está disponible en `http://localhost:8000`.
2. En `Frontend/.env`, configura:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. Inicia el frontend en `http://localhost:3000` y entra con credenciales válidas configuradas en el backend.

La URL contiene solo el origen del backend; el cliente agrega `/api/v1` automáticamente. No pongas `/api/v1` también en `NEXT_PUBLIC_API_URL`, porque duplicaría el prefijo.

## Comprobaciones realizadas

- `GET http://localhost:8000/up` respondió `200`.
- La ruta `POST /api/v1/auth/login` respondió desde el backend. Una solicitud sin credenciales devolvió `422`, como corresponde a los campos obligatorios.
- La preflight CORS desde `http://localhost:3000` respondió `204` y permitió credenciales.
- `npm run build`, `npx tsc --noEmit` y `npm run lint` finalizaron correctamente. ESLint mostró una advertencia ya existente sobre el uso de `<img>` en `src/components/auth/LoginPage.tsx`.

No se validó el acceso con una cuenta real; para confirmar que las credenciales funcionan hay que iniciar sesión desde el formulario con un usuario existente en la base de datos.

## Consideraciones actuales

- El access token vive en memoria: desaparece al recargar la página. Esto evita guardarlo en `localStorage`, como recomienda la documentación del backend, pero todavía no se implementó una hidratación automática de sesión al recargar.
- El formulario confirma que el login fue exitoso, pero todavía no redirige al panel de usuario.
- En producción, `NEXT_PUBLIC_API_URL` debe apuntar al dominio HTTPS del backend y el backend debe permitir el origen del frontend en su configuración CORS.
