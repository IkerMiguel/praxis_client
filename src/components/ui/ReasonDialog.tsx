"use client";

import { useState, type ReactNode } from 'react';
import Modal from './Modal';
import { apiErrorMessage, apiFieldErrors } from '@/lib/apiError';

interface ReasonDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  label: string;
  placeholder?: string;
  min?: number;
  max?: number;
  confirmLabel: string;
  tone?: 'primary' | 'danger' | 'warning' | 'dark';
  /** Contenido extra sobre el campo de texto (selectores, avisos...). */
  children?: ReactNode;
  /** Bloquea el envío por validaciones propias del contenido extra. */
  extraValid?: boolean;
  onSubmit: (reason: string) => Promise<unknown>;
  onDone?: () => void;
}

const BUTTONS = { primary: 'btn-primary', danger: 'btn-danger', warning: 'btn-warning', dark: 'btn-dark' };

/** Diálogo de acción con motivo obligatorio y longitud validada (cancelar, devolver, rechazar...). */
export default function ReasonDialog({
  open,
  onClose,
  title,
  description,
  icon,
  label,
  placeholder,
  min = 10,
  max = 1000,
  confirmLabel,
  tone = 'primary',
  children,
  extraValid = true,
  onSubmit,
  onDone,
}: ReasonDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const length = reason.trim().length;
  const valid = length >= min && length <= max && extraValid;

  const close = () => {
    if (busy) return;
    setReason('');
    setError('');
    onClose();
  };

  const submit = async () => {
    if (!valid) {
      setError(length < min ? `Escribe al menos ${min} caracteres.` : length > max ? `Máximo ${max} caracteres.` : 'Completa los campos requeridos.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSubmit(reason.trim());
      setReason('');
      onClose();
      onDone?.();
    } catch (err) {
      setError(Object.values(apiFieldErrors(err))[0] ?? apiErrorMessage(err, 'No se pudo completar la acción.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      busy={busy}
      icon={icon}
      title={title}
      description={description}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={close} disabled={busy}>
            Volver
          </button>
          <button type="button" className={BUTTONS[tone]} onClick={submit} disabled={busy}>
            {busy ? 'Guardando…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {children}
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="reason-dialog-text" className="field-label">
              {label}
            </label>
            <span className={`text-xs tabular-nums ${length > max ? 'text-red-600' : length >= min ? 'text-emerald-600' : 'text-slate-400'}`}>
              {length} / {max}
            </span>
          </div>
          <textarea
            id="reason-dialog-text"
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder={placeholder}
            className="field resize-y"
          />
          <p className="mt-1 text-xs text-slate-400">Mínimo {min} caracteres.</p>
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
