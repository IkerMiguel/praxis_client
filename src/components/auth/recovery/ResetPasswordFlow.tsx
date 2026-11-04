"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, Link2Off, WifiOff } from 'lucide-react';
import { passwordRecoveryService } from '@/services/passwordRecoveryService';
import { apiErrorMessage, apiFieldErrors, apiStatus } from '@/lib/apiError';
import { meetsPolicy } from '@/lib/passwordPolicy';
import AuthLayout from '../AuthLayout';
import { authButton } from '../authStyles';
import FormAlert from './FormAlert';
import PasswordField from './PasswordField';
import PasswordRequirements from './PasswordRequirements';

const INVALID_LINK_MESSAGE = 'El enlace de restablecimiento ha expirado. Por favor solicite uno nuevo';
type Status = 'checking' | 'unreachable' | 'invalid' | 'form' | 'done';

const COPY: Record<Status, { title: string; subtitle: string }> = {
  checking: { title: 'Verificando enlace', subtitle: 'Un momento, estamos validando tu solicitud' },
  unreachable: { title: 'Sin conexión', subtitle: 'No pudimos contactar al servidor' },
  invalid: { title: 'Enlace no válido', subtitle: 'Vence a los 30 minutos y solo se usa una vez' },
  form: { title: 'Nueva contraseña', subtitle: 'Crea una contraseña segura para tu cuenta' },
  done: { title: 'Contraseña actualizada', subtitle: 'Ya puedes iniciar sesión con tu nueva clave' },
};

function Shell({ status, children }: { status: Status; children: React.ReactNode }) {
  return (
    <AuthLayout
      title={COPY[status].title}
      subtitle={COPY[status].subtitle}
      showcaseTitle="Recupera el acceso a tu cuenta institucional."
      showcaseDescription="Al crear tu nueva contraseña cerraremos las sesiones abiertas en otros equipos."
      top={
        <Link href="/auth/login" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Volver al inicio de sesión
        </Link>
      }
    >
      {children}
    </AuthLayout>
  );
}

/** Restablecimiento desde el enlace del correo (alternativa al código). */
export default function ResetPasswordFlow({ token }: { token: string }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [status, setStatus] = useState<Status>('checking');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const checkToken = useCallback(() => {
    passwordRecoveryService
      .validateToken(token)
      .then((result) => setStatus(result === 'valid' ? 'form' : 'invalid'))
      .catch(() => setStatus('unreachable'));
  }, [token]);

  useEffect(checkToken, [checkToken]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetsPolicy(password)) return setFieldError('La contraseña todavía no cumple todos los requisitos.');
    if (confirmation !== password) return setFieldError('Las contraseñas no coinciden.');
    setSaving(true);
    setFieldError('');
    setError('');
    try {
      await passwordRecoveryService.reset({ token, password, password_confirmation: confirmation });
      setStatus('done');
      setTimeout(() => router.replace('/auth/login?restablecida=1'), 2500);
    } catch (err) {
      if (apiStatus(err) === 410) return setStatus('invalid');
      const fields = apiFieldErrors(err);
      if (fields.password) setFieldError(fields.password);
      else setError(apiErrorMessage(err, 'No pudimos actualizar tu contraseña.'));
    } finally {
      setSaving(false);
    }
  };

  const fade = reduceMotion ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 } };

  return (
    <Shell status={status}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={status} {...fade} className="space-y-4">
          {status === 'checking' && <p className="py-6 text-center text-sm text-slate-500" role="status">Verificando tu enlace…</p>}
          {status === 'unreachable' && (
            <>
              <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
                Revisa tu conexión e intenta de nuevo.
              </p>
              <button type="button" className={authButton} onClick={() => { setStatus('checking'); checkToken(); }}>
                Intentar de nuevo
              </button>
            </>
          )}
          {status === 'invalid' && (
            <>
              <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700">
                <Link2Off className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {INVALID_LINK_MESSAGE}.
              </p>
              <Link href="/recuperar-password" className={authButton}>
                Solicitar un código nuevo →
              </Link>
            </>
          )}
          {status === 'form' && (
            <form noValidate onSubmit={save} className="space-y-4">
              <PasswordField id="new-password" label="Nueva contraseña" value={password} autoFocus describedBy="password-requirements" onChange={(v) => { setPassword(v); setFieldError(''); }} />
              <PasswordRequirements id="password-requirements" password={password} />
              <PasswordField id="confirm-password" label="Confirmar contraseña" value={confirmation} onChange={(v) => { setConfirmation(v); setFieldError(''); }} />
              {confirmation && confirmation === password && <p className="text-xs font-semibold text-emerald-700">✓ Las contraseñas coinciden</p>}
              {fieldError && <p className="text-xs text-red-600">{fieldError}</p>}
              <FormAlert message={error} />
              <button type="submit" disabled={saving} className={authButton}>
                {saving ? 'Guardando…' : 'Guardar contraseña →'}
              </button>
            </form>
          )}
          {status === 'done' && (
            <>
              <p className="py-2 text-center text-xs text-slate-500" role="status">
                Cerramos tus sesiones en otros equipos. Te llevamos al inicio de sesión…
              </p>
              <Link href="/auth/login?restablecida=1" replace className={authButton}>
                Iniciar sesión ahora
              </Link>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </Shell>
  );
}

/** Fallback de Suspense mientras se resuelve el token de la URL. */
export function ResetPasswordFallback() {
  return (
    <Shell status="checking">
      <p className="py-6 text-center text-sm text-slate-500" role="status">
        Verificando tu enlace…
      </p>
    </Shell>
  );
}
