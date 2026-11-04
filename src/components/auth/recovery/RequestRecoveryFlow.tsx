"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, MailCheck } from 'lucide-react';
import { passwordRecoveryService } from '@/services/passwordRecoveryService';
import { apiErrorMessage, apiFieldErrors, apiStatus } from '@/lib/apiError';
import { meetsPolicy } from '@/lib/passwordPolicy';
import AuthLayout from '../AuthLayout';
import { authButton, authInput, authInputError, authLabel, authLink } from '../authStyles';
import StepIndicator from './StepIndicator';
import CodeInput from './CodeInput';
import PasswordField from './PasswordField';
import PasswordRequirements from './PasswordRequirements';
import FormAlert from './FormAlert';

const RESEND_SECONDS = 60;
const CODE_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Step = 'email' | 'code' | 'password' | 'done';

const COPY: Record<Step, { title: string; subtitle: string }> = {
  email: { title: 'Recuperar contraseña', subtitle: 'Te enviaremos un código a tu correo institucional' },
  code: { title: 'Revisa tu correo', subtitle: 'Escribe el código de 6 dígitos que te enviamos' },
  password: { title: 'Nueva contraseña', subtitle: 'Crea una contraseña segura para tu cuenta' },
  done: { title: 'Contraseña actualizada', subtitle: 'Ya puedes iniciar sesión con tu nueva clave' },
};

/** Restablecimiento por código numérico enviado al correo (HU-1.4). */
export default function RequestRecoveryFlow() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const go = (next: Step) => {
    setError('');
    setFieldError('');
    setNotice('');
    setStep(next);
  };

  const sendCode = async (resend = false) => {
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setFieldError(value ? 'Revisa el formato del correo.' : 'Escribe tu correo institucional.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await passwordRecoveryService.request(value);
      setCooldown(RESEND_SECONDS);
      setCode('');
      if (resend) setNotice('Te enviamos un código nuevo. El anterior dejó de funcionar.');
      else go('code');
    } catch (err) {
      const fields = apiFieldErrors(err);
      if (fields.email) setFieldError(fields.email);
      else setError(apiErrorMessage(err, 'No pudimos enviar el código. Intenta de nuevo.'));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    if (value.length !== CODE_LENGTH) {
      setFieldError(`Escribe los ${CODE_LENGTH} dígitos del código.`);
      return;
    }
    setBusy(true);
    setError('');
    setFieldError('');
    try {
      setToken(await passwordRecoveryService.verifyCode(email.trim(), value));
      go('password');
    } catch (err) {
      const status = apiStatus(err);
      if (status === 404 || status === 405) setError('La verificación por código todavía no está disponible en el servidor. Contacta a la mesa de ayuda.');
      else setFieldError(apiFieldErrors(err).codigo ?? apiErrorMessage(err, 'El código no es válido o ya venció.'));
    } finally {
      setBusy(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetsPolicy(password)) return setFieldError('La contraseña todavía no cumple todos los requisitos.');
    if (confirmation !== password) return setFieldError('Las contraseñas no coinciden.');
    setBusy(true);
    setError('');
    setFieldError('');
    try {
      await passwordRecoveryService.reset({ token, password, password_confirmation: confirmation });
      go('done');
      setTimeout(() => router.replace('/auth/login?restablecida=1'), 2500);
    } catch (err) {
      if (apiStatus(err) === 410) {
        setError('El código venció mientras creabas la contraseña. Solicita uno nuevo.');
        setStep('code');
        return;
      }
      setFieldError(apiFieldErrors(err).password ?? '');
      setError(apiFieldErrors(err).password ? '' : apiErrorMessage(err, 'No pudimos actualizar tu contraseña.'));
    } finally {
      setBusy(false);
    }
  };

  const slide = reduceMotion ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 } };
  const stepNumber = { email: 1, code: 2, password: 3, done: 4 }[step];

  return (
    <AuthLayout
      title={COPY[step].title}
      subtitle={COPY[step].subtitle}
      showcaseTitle="Recupera el acceso a tu cuenta institucional."
      showcaseDescription="Te enviaremos un código de un solo uso. Al crear tu nueva contraseña cerraremos las sesiones abiertas en otros equipos."
      top={
        <Link href="/auth/login" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Volver al inicio de sesión
        </Link>
      }
    >
      <StepIndicator current={stepNumber} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} {...slide} transition={{ duration: 0.25, ease: 'easeOut' }} className="space-y-4 sm:space-y-5">
          {step === 'email' && (
            <form
              noValidate
              className="space-y-4 sm:space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                void sendCode();
              }}
            >
              <div className="space-y-1.5">
                <label htmlFor="rec-email" className={authLabel}>
                  Correo institucional
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 text-sm font-medium">@</span>
                  <input
                    id="rec-email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldError('');
                    }}
                    aria-invalid={fieldError ? true : undefined}
                    placeholder="nombre@universidad.edu.co"
                    className={`${authInput} pl-9 pr-4 ${fieldError ? authInputError : ''}`}
                  />
                </div>
                {fieldError && <p className="text-xs text-red-600">{fieldError}</p>}
              </div>
              <FormAlert message={error} />
              <button type="submit" disabled={busy} className={authButton}>
                {busy ? 'Enviando…' : 'Enviar código →'}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form
              noValidate
              className="space-y-4 sm:space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                void verify();
              }}
            >
              <p className="flex items-start gap-2 rounded-xl bg-[#F3F4F8] px-3 py-2.5 text-xs leading-relaxed text-slate-600">
                <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                <span>
                  Si <span className="font-semibold text-slate-900 break-all">{email.trim()}</span> está registrado, te llegó un código. Revisa también la carpeta de spam.
                </span>
              </p>
              <div className="space-y-1.5">
                <p className={authLabel}>Código de verificación</p>
                <CodeInput
                  value={code}
                  autoFocus
                  invalid={Boolean(fieldError)}
                  onChange={(v) => {
                    setCode(v);
                    setFieldError('');
                  }}
                  onComplete={(v) => void verify(v)}
                />
                {fieldError && <p className="text-xs text-red-600">{fieldError}</p>}
              </div>
              <FormAlert message={error} />
              <FormAlert message={notice} tone="success" />
              <button type="submit" disabled={busy || code.length !== CODE_LENGTH} className={authButton}>
                {busy ? 'Verificando…' : 'Verificar código →'}
              </button>
              <div className="flex items-center justify-between text-xs">
                <button type="button" onClick={() => go('email')} className={authLink}>
                  Usar otro correo
                </button>
                <button type="button" onClick={() => void sendCode(true)} disabled={busy || cooldown > 0} className={`${authLink} disabled:font-semibold disabled:text-slate-400 disabled:no-underline`}>
                  {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar código'}
                </button>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form noValidate className="space-y-4" onSubmit={save}>
              <PasswordField id="new-password" label="Nueva contraseña" value={password} autoFocus describedBy="password-requirements" onChange={(v) => { setPassword(v); setFieldError(''); }} />
              <PasswordRequirements id="password-requirements" password={password} />
              <PasswordField id="confirm-password" label="Confirmar contraseña" value={confirmation} onChange={(v) => { setConfirmation(v); setFieldError(''); }} />
              {confirmation && confirmation === password && <p className="text-xs font-semibold text-emerald-700">✓ Las contraseñas coinciden</p>}
              {fieldError && <p className="text-xs text-red-600">{fieldError}</p>}
              <FormAlert message={error} />
              <button type="submit" disabled={busy} className={authButton}>
                {busy ? 'Guardando…' : 'Guardar contraseña →'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center" role="status">
              <motion.span initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }} className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <motion.path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" initial={reduceMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.4 }} />
                </svg>
              </motion.span>
              <p className="text-xs text-slate-500">Cerramos tus sesiones en otros equipos. Te llevamos al inicio de sesión…</p>
              <Link href="/auth/login?restablecida=1" replace className={authButton}>
                Iniciar sesión ahora
              </Link>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </AuthLayout>
  );
}
