const TZ = 'America/Bogota';

const dateFmt = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: TZ });
const dateTimeFmt = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TZ,
});
const longDateFmt = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });
const timeFmt = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
const relativeFmt = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

/** Las fechas sin hora (Y-m-d) se fijan al mediodía para no cambiar de día por la zona horaria. */
function parse(iso: string): Date {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso);
}

export function formatDate(iso?: string | null): string {
  return iso ? dateFmt.format(parse(iso)) : '—';
}

export function formatDateTime(iso?: string | null): string {
  return iso ? dateTimeFmt.format(parse(iso)) : '—';
}

export function formatLongDate(iso?: string | null): string {
  return iso ? longDateFmt.format(parse(iso)) : '—';
}

export function formatTime(iso?: string | null): string {
  return iso ? timeFmt.format(new Date(iso)) : '—';
}

/** "hace 5 min", "ayer", "hace 3 días"; pasa a fecha absoluta después de una semana. */
export function formatRelative(iso?: string | null): string {
  if (!iso) return '—';
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(seconds);
  if (abs < 60) return 'justo ahora';
  if (abs < 3600) return relativeFmt.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return relativeFmt.format(Math.round(seconds / 3600), 'hour');
  if (abs < 604800) return relativeFmt.format(Math.round(seconds / 86400), 'day');
  return formatDate(iso);
}

/** Horas hábiles con un decimal como "6 h" o "45 min". */
export function formatHours(hours?: number | null): string {
  if (hours === null || hours === undefined || Number.isNaN(hours)) return '—';
  if (Math.abs(hours) < 1) return `${Math.round(hours * 60)} min`;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
}

export function formatNumber(value?: number | null): string {
  return value === null || value === undefined ? '—' : new Intl.NumberFormat('es-CO').format(value);
}

export function formatMoney(value?: number | string | null): string {
  if (value === null || value === undefined || value === '') return '—';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value));
}

export function formatBytes(bytes?: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initials(name?: string | null): string {
  if (!name) return '·';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
