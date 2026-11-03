/**
 * Colores semánticos que usa el backend (glosario de estados, prioridades, semáforo SLA)
 * traducidos a clases de la interfaz.
 */
export type Tone = 'azul' | 'naranja' | 'verde' | 'rojo' | 'gris' | 'amarillo' | 'violeta' | 'cian';

export const TONE_CLASSES: Record<Tone, { badge: string; dot: string; soft: string; text: string; bar: string }> = {
  azul: { badge: 'bg-sky-50 text-sky-800 ring-sky-200', dot: 'bg-sky-500', soft: 'bg-sky-50', text: 'text-sky-700', bar: 'bg-sky-500' },
  naranja: { badge: 'bg-orange-50 text-orange-800 ring-orange-200', dot: 'bg-orange-500', soft: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500' },
  verde: { badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500', soft: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  rojo: { badge: 'bg-red-50 text-red-800 ring-red-200', dot: 'bg-red-500', soft: 'bg-red-50', text: 'text-red-700', bar: 'bg-red-500' },
  gris: { badge: 'bg-slate-100 text-slate-700 ring-slate-200', dot: 'bg-slate-400', soft: 'bg-slate-50', text: 'text-slate-600', bar: 'bg-slate-400' },
  amarillo: { badge: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500', soft: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500' },
  violeta: { badge: 'bg-violet-50 text-violet-800 ring-violet-200', dot: 'bg-violet-500', soft: 'bg-violet-50', text: 'text-violet-700', bar: 'bg-violet-500' },
  cian: { badge: 'bg-cyan-50 text-cyan-800 ring-cyan-200', dot: 'bg-cyan-500', soft: 'bg-cyan-50', text: 'text-cyan-700', bar: 'bg-cyan-500' },
};

/** Color por estado D07 cuando la respuesta no trae el color del glosario. */
const STATE_TONES: Record<string, Tone> = {
  E01: 'azul', E02: 'naranja', E03: 'azul', E04: 'azul', E05: 'gris', E06: 'violeta', E07: 'violeta', E08: 'amarillo',
  E09: 'amarillo', E10: 'cian', E11: 'cian', E12: 'cian', E13: 'rojo', E14: 'naranja', E15: 'verde', E16: 'gris', E17: 'gris', E18: 'amarillo',
};

const PRIORITY_TONES: Record<string, Tone> = { CRITICA: 'rojo', ALTA: 'naranja', MEDIA: 'amarillo', BAJA: 'verde' };

const SLA_TONES: Record<string, Tone> = {
  EN_PLAZO: 'verde',
  PROXIMA_A_VENCER: 'amarillo',
  VENCIDA: 'rojo',
  CUMPLIDA: 'verde',
  INCUMPLIDA: 'rojo',
  SIN_META: 'gris',
  DETENIDO: 'gris',
  PAUSADA: 'gris',
  SIN_PLAZO: 'gris',
};

function asTone(value?: string | null): Tone | null {
  return value && value in TONE_CLASSES ? (value as Tone) : null;
}

export function stateTone(code?: string | null, color?: string | null): Tone {
  return asTone(color) ?? STATE_TONES[code ?? ''] ?? 'gris';
}

export function priorityTone(code?: string | null, color?: string | null): Tone {
  return asTone(color) ?? PRIORITY_TONES[code ?? ''] ?? 'gris';
}

export function slaTone(code?: string | null): Tone {
  return SLA_TONES[code ?? ''] ?? 'gris';
}

export const SLA_LABELS: Record<string, string> = {
  EN_PLAZO: 'En plazo',
  PROXIMA_A_VENCER: 'Próxima a vencer',
  VENCIDA: 'Vencida',
  SIN_META: 'Sin meta',
  DETENIDO: 'Detenido',
  CUMPLIDA: 'Cumplida',
  INCUMPLIDA: 'Incumplida',
  PAUSADA: 'Pausada',
  SIN_PLAZO: 'Sin plazo aún',
};

/** Estados en los que la solicitud ya terminó. */
export const TERMINAL_STATES = ['E15', 'E16', 'E17'];
