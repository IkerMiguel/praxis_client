"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { passwordRecoveryService } from '@/services/passwordRecoveryService';
import { apiErrorMessage, apiFieldErrors, apiStatus } from '@/lib/apiError';
import { meetsPolicy } from '@/lib/passwordPolicy';
import PraxisLoader from '@/components/ui/PraxisLoader';
import RecoveryShell from './RecoveryShell';
import FormAlert from './FormAlert';
import PasswordField from './PasswordField';
import PasswordRequirements from './PasswordRequirements';

const REDIRECT_SECONDS = 6;
const INVALID_LINK_MESSAGE = 'El enlace de restablecimiento ha expirado. Por favor solicite uno nuevo';

type Status = 'checking' | 'unreachable' | 'invalid' | 'form' | 'done';

export default function ResetPasswordFlow({ token }: { token: string }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [status, setStatus] = useState<Status>('checking');
  const [invalidMessage, setInvalidMessage] = useState(INVALID_LINK_MESSAGE);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmation?: string }>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  const checkToken = useCallback(() => {
    passwordRecoveryService
      .validateToken(token)
      .then((result) => setStatus(result === 'valid' ? 'form' : 'invalid'))
      .catch(() => setStatus('unreachable'));
  }, [token]);

  useEffect(checkToken, [checkToken]);

  useEffect(() => {
    if (status !== 'done') return;
    if (countdown <= 0) {
      router.replace('/auth/login?restablecida=1');
      return;
    }
    const timer = setTimeout(() => setCountdown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};

    if (!meetsPolicy(password)) nextErrors.password = 'La contraseña todavía no cumple todos los requisitos.';
    if (!confirmation) nextErrors.confirmation = 'Repite la contraseña para confirmarla.';
    else if (confirmation !== password) nextErrors.confirmation = 'Las contraseñas no coinciden.';

    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await passwordRecoveryService.reset({ token, password, password_confirmation: confirmation });
      setStatus('done');
    } catch (err) {
      if (apiStatus(err) === 410) {
        setInvalidMessage(apiErrorMessage(err, INVALID_LINK_MESSAGE));
        setStatus('invalid');
        return;
      }
      const fields = apiFieldErrors(err);
      if (fields.password) setErrors({ password: fields.password });
      else setFormError(apiErrorMessage(err, 'No pudimos actualizar tu contraseña. Intenta de nuevo.'));
    } finally {
      setSaving(false);
    }
  };

  const fade = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };

  return (
    <RecoveryShell step={status === 'done' ? 4 : 3}>
      <AnimatePresence mode="wait" initial={false}>
        {status === 'checking' && (
          <motion.div key="checking" {...fade}>
            <CheckingLink />
          </motion.div>
        )}

        {status === 'unreachable' && (
          <motion.div key="unreachable" {...fade} className="space-y-6 text-center">
            <StatusIcon tone="warning" />
            <header className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">No pudimos verificar el enlace</h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-500">
                No hay conexión con el servidor en este momento. Revisa tu conexión e intenta de nuevo.
              </p>
            </header>
            <button
              type="button"
              onClick={() => {
                setStatus('checking');
                checkToken();
              }}
              className="w-full rounded-xl bg-[#111827] px-4 py-4 text-base font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1CA3E9]"
            >
              Intentar de nuevo
            </button>
          </motion.div>
        )}

        {status === 'invalid' && (
          <motion.div key="invalid" {...fade} className="space-y-6 text-center">
            <StatusIcon tone="error" />
            <header className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Este enlace ya no funciona</h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-500">
                {invalidMessage}. Los enlaces vencen a los 30 minutos y solo se pueden usar una vez.
              </p>
            </header>
            <Link
              href="/recuperar-password"
              className="block w-full rounded-xl bg-[#111827] px-4 py-4 text-base font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1CA3E9]"
            >
              Solicitar un enlace nuevo
            </Link>
          </motion.div>
        )}

        {status === 'form' && (
          <motion.div key="form" {...fade} className="space-y-7">
            <header className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Crea tu nueva contraseña</h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-500">
                Al guardarla cerraremos tus sesiones abiertas en otros equipos.
              </p>
            </header>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <PasswordField
                id="new-password"
                label="Nueva contraseña"
                value={password}
                autoFocus
                describedBy="password-requirements"
                error={errors.password}
                onChange={(value) => {
                  setPassword(value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
              />

              <PasswordRequirements id="password-requirements" password={password} />

              <PasswordField
                id="confirm-password"
                label="Confirma la contraseña"
                value={confirmation}
                error={errors.confirmation}
                onChange={(value) => {
                  setConfirmation(value);
                  if (errors.confirmation) setErrors((prev) => ({ ...prev, confirmation: undefined }));
                }}
              />

              <AnimatePresence>
                {confirmation && confirmation === password && !errors.confirmation && (
                  <motion.p
                    className="-mt-2 flex items-center gap-2 text-sm font-medium text-emerald-700"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Las contraseñas coinciden
                  </motion.p>
                )}
              </AnimatePresence>

              <FormAlert message={formError} />

              <motion.button
                type="submit"
                disabled={saving}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1CA3E9]"
              >
                {saving ? 'Guardando…' : 'Guardar nueva contraseña'}
              </motion.button>
            </form>
          </motion.div>
        )}

        {status === 'done' && (
          <motion.div key="done" {...fade} className="space-y-6 text-center" role="status">
            <SuccessMark />
            <header className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Contraseña actualizada</h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-500">
                Ya puedes iniciar sesión con tu nueva contraseña. Te llevaremos al inicio de sesión en{' '}
                <span className="font-semibold tabular-nums text-slate-900">{countdown}</span> s.
              </p>
            </header>
            <Link
              href="/auth/login?restablecida=1"
              replace
              className="block w-full rounded-xl bg-[#111827] px-4 py-4 text-base font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1CA3E9]"
            >
              Iniciar sesión ahora
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </RecoveryShell>
  );
}

/** Vista de carga mientras se resuelve y valida el token; también sirve como fallback de Suspense. */
export function ResetPasswordFallback() {
  return (
    <RecoveryShell step={3}>
      <CheckingLink />
    </RecoveryShell>
  );
}

function CheckingLink() {
  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center" role="status">
      <PraxisLoader size={64} label={null} />
      <p className="text-base font-medium text-slate-600">Verificando tu enlace…</p>
    </div>
  );
}

function SuccessMark() {
  const reduceMotion = useReducedMotion();
  const draw = (delay: number) =>
    reduceMotion ? { initial: false as const } : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.5, delay, ease: 'easeOut' as const } };

  return (
    <motion.svg
      viewBox="0 0 96 96"
      className="mx-auto h-24 w-24"
      aria-hidden="true"
      initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 14 }}
    >
      <circle cx="48" cy="48" r="44" fill="#35BE8B" fillOpacity="0.12" />
      <motion.circle cx="48" cy="48" r="34" fill="none" stroke="#35BE8B" strokeWidth="5" strokeLinecap="round" {...draw(0.1)} />
      <motion.path d="M33 49l10 10 20-21" fill="none" stroke="#35BE8B" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" {...draw(0.5)} />
    </motion.svg>
  );
}

function StatusIcon({ tone }: { tone: 'error' | 'warning' }) {
  const color = tone === 'error' ? 'text-red-500 bg-red-50' : 'text-amber-500 bg-amber-50';
  return (
    <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${color}`}>
      <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        {tone === 'error' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.2 6.8l1.4-1.4a4 4 0 015.7 5.7l-2.8 2.8a4 4 0 01-4.6.8M10.8 17.2l-1.4 1.4a4 4 0 01-5.7-5.7l2.8-2.8a4 4 0 014.6-.8M4 4l16 16" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
        )}
      </svg>
    </div>
  );
}
