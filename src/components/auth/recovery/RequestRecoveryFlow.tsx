"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { passwordRecoveryService } from '@/services/passwordRecoveryService';
import { apiErrorMessage, apiFieldErrors } from '@/lib/apiError';
import RecoveryShell from './RecoveryShell';
import FormAlert from './FormAlert';
import MailSentIllustration from './MailSentIllustration';

const RESEND_COOLDOWN_SECONDS = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = 'email' | 'sent';

export default function RequestRecoveryFlow() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [sendCount, setSendCount] = useState(0);
  const emailInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendLink = async (): Promise<boolean> => {
    setLoading(true);
    setError('');
    setNotice('');

    try {
      await passwordRecoveryService.request(email.trim());
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setSendCount((n) => n + 1);
      return true;
    } catch (err) {
      const fields = apiFieldErrors(err);
      if (fields.email) {
        setFieldError(fields.email);
        if (step === 'sent') setStep('email');
      } else {
        setError(apiErrorMessage(err, 'No pudimos enviar el enlace. Intenta de nuevo.'));
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();

    if (!value) {
      setFieldError('Escribe tu correo institucional.');
      emailInput.current?.focus();
      return;
    }
    if (!EMAIL_PATTERN.test(value)) {
      setFieldError('Revisa el formato del correo, por ejemplo nombre@universidad.edu.co.');
      emailInput.current?.focus();
      return;
    }

    setFieldError('');
    if (await sendLink()) setStep('sent');
  };

  const handleResend = async () => {
    if (await sendLink()) setNotice('Te enviamos un enlace nuevo. Los enlaces anteriores dejaron de funcionar.');
  };

  const changeEmail = () => {
    setStep('email');
    setError('');
    setNotice('');
  };

  const direction = step === 'email' ? -1 : 1;
  const slide = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 48 * direction },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -48 * direction },
      };

  return (
    <RecoveryShell step={step === 'email' ? 1 : 2}>
      <AnimatePresence mode="wait" initial={false}>
        {step === 'email' ? (
          <motion.div key="email" {...slide} transition={{ duration: 0.3, ease: 'easeOut' }} className="space-y-7">
            <header className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">¿Olvidaste tu contraseña?</h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-500">
                Escribe el correo con el que ingresas a PRAXIS y te enviaremos un enlace para crear una nueva.
              </p>
            </header>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="recovery-email" className="block text-sm font-semibold text-slate-700">
                  Correo institucional
                </label>
                <div className="relative flex items-center">
                  <svg className="pointer-events-none absolute left-4 h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A2.5 2.5 0 015.5 5h13A2.5 2.5 0 0121 7.5v9a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16.5v-9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 7l8.5 6 8.5-6" />
                  </svg>
                  <input
                    ref={emailInput}
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldError) setFieldError('');
                    }}
                    aria-invalid={fieldError ? true : undefined}
                    aria-describedby={fieldError ? 'recovery-email-error' : undefined}
                    placeholder="nombre@universidad.edu.co"
                    className={`w-full rounded-xl border bg-[#EEF2F6] py-4 pl-12 pr-4 text-base text-slate-900 transition focus:bg-white focus:outline-none focus:ring-4 ${
                      fieldError
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-transparent focus:border-[#1CA3E9] focus:ring-[#1CA3E9]/15'
                    }`}
                  />
                </div>
                <AnimatePresence>
                  {fieldError && (
                    <motion.p
                      id="recovery-email-error"
                      className="text-sm text-red-600"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {fieldError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <FormAlert message={error} />

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1CA3E9]"
              >
                {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
              </motion.button>
            </form>

            <p className="text-center text-sm text-slate-500">
              ¿La recordaste?{' '}
              <Link href="/auth/login" className="font-semibold text-slate-900 hover:underline">
                Inicia sesión
              </Link>
            </p>
          </motion.div>
        ) : (
          <motion.div key="sent" {...slide} transition={{ duration: 0.3, ease: 'easeOut' }} className="space-y-7">
            <MailSentIllustration playKey={sendCount} />

            <header className="space-y-2 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Revisa tu correo</h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-500">
                Si <span className="font-semibold text-slate-900 break-all">{email.trim()}</span> está registrado en PRAXIS,
                te llegará un enlace para crear una nueva contraseña.
              </p>
            </header>

            <ul className="space-y-3 rounded-2xl bg-[#F3F4F8] p-5 text-sm text-slate-600">
              {[
                'El enlace vence en 30 minutos y solo se puede usar una vez.',
                'Si no lo ves en unos minutos, revisa la carpeta de spam o correo no deseado.',
                'Si pides otro enlace, solo funcionará el más reciente.',
              ].map((tip) => (
                <li key={tip} className="flex gap-3">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#35BE8B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {tip}
                </li>
              ))}
            </ul>

            <FormAlert message={error} />
            <FormAlert message={notice} tone="success" />

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || cooldown > 0}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1CA3E9]"
              >
                {loading ? (
                  'Enviando…'
                ) : cooldown > 0 ? (
                  <span className="tabular-nums">Reenviar en {formatSeconds(cooldown)}</span>
                ) : (
                  'Reenviar enlace'
                )}
              </button>
              <button
                type="button"
                onClick={changeEmail}
                className="rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1CA3E9]"
              >
                Usar otro correo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </RecoveryShell>
  );
}

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
