import { AlertTriangle, Ban, Bell, CalendarClock, CheckCircle2, ClipboardCheck, MessageSquareText, RotateCcw, ShieldAlert, UserCheck, Wrench, type LucideIcon } from 'lucide-react';

/** Ícono y color según el tipo de notificación que emite el backend. */
export function notificationVisual(tipo: string): { icon: LucideIcon; tone: string } {
  const t = tipo.toUpperCase();
  if (t.includes('ACLARACION') || t.includes('INFORMACION')) return { icon: MessageSquareText, tone: 'bg-amber-100 text-amber-700' };
  if (t.includes('RIESGO') || t.includes('EMERGENCIA')) return { icon: ShieldAlert, tone: 'bg-red-100 text-red-700' };
  if (t.includes('CANCEL') || t.includes('ANUL') || t.includes('NO_PROCEDENTE')) return { icon: Ban, tone: 'bg-slate-100 text-slate-600' };
  if (t.includes('ASIGNA')) return { icon: UserCheck, tone: 'bg-violet-100 text-violet-700' };
  if (t.includes('PROGRAM')) return { icon: CalendarClock, tone: 'bg-cyan-100 text-cyan-700' };
  if (t.includes('VERIFIC') || t.includes('CONFIRM')) return { icon: ClipboardCheck, tone: 'bg-emerald-100 text-emerald-700' };
  if (t.includes('CIERRE') || t.includes('CERRAD') || t.includes('RESUEL')) return { icon: CheckCircle2, tone: 'bg-emerald-100 text-emerald-700' };
  if (t.includes('REABR') || t.includes('CORRECC') || t.includes('RECHAZ')) return { icon: RotateCcw, tone: 'bg-orange-100 text-orange-700' };
  if (t.includes('SUSPEN') || t.includes('VENC') || t.includes('SLA')) return { icon: AlertTriangle, tone: 'bg-amber-100 text-amber-700' };
  if (t.includes('DIAGNOST') || t.includes('INTERVENC') || t.includes('ATENCION') || t.includes('RECURSO')) return { icon: Wrench, tone: 'bg-sky-100 text-sky-700' };
  return { icon: Bell, tone: 'bg-sky-100 text-sky-700' };
}
