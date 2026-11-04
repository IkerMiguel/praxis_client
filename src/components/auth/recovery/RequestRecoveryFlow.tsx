"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AtSign, Check, ChevronLeft, MailCheck, RotateCw } from 'lucide-react';
import { passwordRecoveryService } from '@/services/passwordRecoveryService';
import { apiErrorMessage, apiFieldErrors, apiStatus } from '@/lib/apiError';
import { meetsPolicy } from '@/lib/passwordPolicy';
import AuthLayout from '../AuthLayout';
import { AuthError, AuthField, AuthItem, AuthSubmit, authFieldLabel } from '../AuthMotion';
import { authButton } from '../authStyles';
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

const linkButton = 'group relative font-semibold text-[#0A65A8] hover:underline underline-offset-4 disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline';

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
    setNotice('');
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

  const stepNumber = { email: 1, code: 2, password: 3, done: 4 }[step];
  const matches = confirmation.length > 0 && confirmation === password;

  return (
    <AuthLayout
      contentKey={step}
      title={COPY[step].title}
      subtitle={COPY[step].subtitle}
      showcaseTitle="Recupera el acceso a tu cuenta institucional."
      showcaseDescription="Te enviaremos un código de un solo uso. Al crear tu nueva contraseña cerraremos las sesiones abiertas en otros equipos."
      top={
        step !== 'done' && (
          <Link href="/auth/login" className="group inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500 transition-colors hover:text-[#0B1B3A]">
            <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            Volver al inicio de sesión
          </Link>
        )
      }
    >
      <AuthItem>
        <StepIndicator current={stepNumber} />
      </AuthItem>

      {step === 'email' && (
        <form
          noValidate
          className="space-y-4 sm:space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void sendCode();
          }}
        >
          <AuthItem>
            <AuthField
              id="rec-email"
              label="Correo institucional"
              icon={AtSign}
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(v) => {
                setEmail(v);
                setFieldError('');
              }}
              placeholder="nombre@universidad.edu.co"
              error={fieldError}
            />
          </AuthItem>
          <AuthError message={error} />
          <AuthItem>
            <AuthSubmit state={busy ? 'loading' : 'idle'} label="Enviar código" loadingLabel="Enviando" />
          </AuthItem>
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
          <AuthItem>
            <div className="flex items-start gap-3 rounded-xl border border-[#D7E2ED] bg-[#F7FAFC] px-3 py-3 text-[13px] leading-relaxed text-slate-600">
              <motion.span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0B1B3A] text-[#35BE8B]"
                animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <MailCheck className="h-4 w-4" aria-hidden="true" />
              </motion.span>
              <span>
                Si <span className="font-semibold text-slate-900 break-all">{email.trim()}</span> está registrado, te llegó un código. Revisa también la carpeta de spam.
              </span>
            </div>
          </AuthItem>
          <AuthItem className="space-y-1.5">
            <p className={authFieldLabel}>Código de verificación</p>
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
            <AnimatePresence initial={false}>
              {fieldError && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden text-xs text-red-600">
                  {fieldError}
                </motion.p>
              )}
            </AnimatePresence>
          </AuthItem>
          <AuthError message={error} />
          <FormAlert message={notice} tone="success" />
          <AuthItem>
            <AuthSubmit state={busy ? 'loading' : 'idle'} disabled={code.length !== CODE_LENGTH} label="Verificar código" loadingLabel="Verificando" />
          </AuthItem>
          <AuthItem className="flex items-center justify-between text-[13px]">
            <button type="button" onClick={() => go('email')} className={linkButton}>
              Usar otro correo
            </button>
            <button type="button" onClick={() => void sendCode(true)} disabled={busy || cooldown > 0} className={`${linkButton} inline-flex items-center gap-1.5`}>
              <RotateCw className={`h-3.5 w-3.5 ${cooldown > 0 ? '' : 'transition-transform duration-500 group-hover:rotate-180'}`} aria-hidden="true" />
              {cooldown > 0 ? (
                <span className="tabular-nums">Reenviar en {cooldown}s</span>
              ) : (
                'Reenviar código'
              )}
            </button>
          </AuthItem>
        </form>
      )}

      {step === 'password' && (
        <form noValidate className="space-y-4" onSubmit={save}>
          <AuthItem>
            <PasswordField id="new-password" label="Nueva contraseña" value={password} autoFocus describedBy="password-requirements" onChange={(v) => { setPassword(v); setFieldError(''); }} />
          </AuthItem>
          <AuthItem>
            <PasswordRequirements id="password-requirements" password={password} />
          </AuthItem>
          <AuthItem className="space-y-1.5">
            <PasswordField id="confirm-password" label="Confirmar contraseña" value={confirmation} onChange={(v) => { setConfirmation(v); setFieldError(''); }} />
            <AnimatePresence initial={false}>
              {matches && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1 overflow-hidden text-xs font-semibold text-emerald-700">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                  Las contraseñas coinciden
                </motion.p>
              )}
            </AnimatePresence>
          </AuthItem>
          <AuthError message={fieldError || error} />
          <AuthItem>
            <AuthSubmit state={busy ? 'loading' : 'idle'} label="Guardar contraseña" loadingLabel="Guardando" />
          </AuthItem>
        </form>
      )}

      {step === 'done' && (
        <AuthItem className="flex flex-col items-center gap-4 py-2 text-center">
          <div role="status" className="flex flex-col items-center gap-3">
            <span className="relative flex h-16 w-16 items-center justify-center">
              {!reduceMotion && (
                <motion.span className="absolute inset-0 rounded-full bg-emerald-400/30" initial={{ scale: 0.6, opacity: 0.8 }} animate={{ scale: 1.8, opacity: 0 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }} aria-hidden="true" />
              )}
              <motion.span initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 15 }} className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-900/20">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <motion.path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" initial={reduceMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.45 }} />
                </svg>
              </motion.span>
            </span>
            <p className="text-xs text-slate-500">Cerramos tus sesiones en otros equipos. Te llevamos al inicio de sesión…</p>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
            <motion.div className="h-full bg-gradient-to-r from-[#1CA3E9] to-[#35BE8B]" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2.5, ease: 'linear' }} />
          </div>
          <Link href="/auth/login?restablecida=1" replace className={authButton}>
            Iniciar sesión ahora
          </Link>
        </AuthItem>
      )}
    </AuthLayout>
  );
}
