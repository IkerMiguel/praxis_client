"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AtSign } from 'lucide-react';
import { authService } from '@/services/authService';
import { useSession } from '@/lib/session/SessionProvider';
import { apiErrorMessage, apiFieldErrors } from '@/lib/apiError';
import { AuthError, AuthField, AuthItem, AuthSubmit } from './AuthMotion';
import PasswordField from './recovery/PasswordField';

/** Solo se aceptan rutas internas como deep-link (HU-1.1). */
function returnUrlFromLocation(): string | undefined {
  const value = new URLSearchParams(window.location.search).get('returnUrl');
  return value && value.startsWith('/') && !value.startsWith('//') ? value : undefined;
}

export default function LoginForm() {
  const router = useRouter();
  const { startSession } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof fieldErrors = {};
    if (!email.trim()) next.email = 'Escribe tu correo institucional.';
    if (!password) next.password = 'Escribe tu contraseña.';
    setFieldErrors(next);
    setError('');
    if (next.email || next.password) return;

    setState('loading');
    try {
      const session = await authService.login({ email: email.trim(), password, return_url: returnUrlFromLocation() });
      await startSession(session);
      setState('success');
      setTimeout(() => router.replace(session.redirect_to ?? session.usuario.ruta_inicio ?? '/panel'), 450);
    } catch (err) {
      const fields = apiFieldErrors(err);
      setFieldErrors({ email: fields.email, password: fields.password });
      setError(fields.email || fields.password ? '' : apiErrorMessage(err, 'No se pudo iniciar sesión'));
      setState('idle');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
      <AuthError message={error} />

      <AuthItem>
        <AuthField
          id="login-email"
          label="Usuario o correo institucional"
          icon={AtSign}
          type="email"
          autoComplete="username"
          value={email}
          onChange={(v) => {
            setEmail(v);
            setFieldErrors((f) => ({ ...f, email: undefined }));
          }}
          placeholder="r.morales@infraestructura.uni.edu"
          error={fieldErrors.email}
        />
      </AuthItem>

      <AuthItem>
        <PasswordField
          id="login-password"
          label="Contraseña"
          autoComplete="current-password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            setFieldErrors((f) => ({ ...f, password: undefined }));
          }}
          error={fieldErrors.password}
        />
      </AuthItem>

      <AuthItem className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-xs">
        <label className="flex cursor-pointer select-none items-center gap-2 whitespace-nowrap text-slate-600">
          <input type="checkbox" className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#0A65A8]" />
          Recordar en este equipo
        </label>
        <Link href="/recuperar-password" className="group relative whitespace-nowrap font-semibold text-[#0A65A8]">
          ¿Olvidaste tu contraseña?
          <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-[#0A65A8] transition-transform duration-300 group-hover:scale-x-100" aria-hidden="true" />
        </Link>
      </AuthItem>

      <AuthItem>
        <AuthSubmit state={state} label="Iniciar sesión" loadingLabel="Ingresando" successLabel="Bienvenido" />
      </AuthItem>
    </form>
  );
}
