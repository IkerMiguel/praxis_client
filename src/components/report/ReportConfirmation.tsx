"use client";

import { useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight, CalendarDays, Check, ClipboardCopy, MapPin, Plus, Tag, Activity, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badges';
import { useSession } from '@/lib/session/SessionProvider';
import { formatLongDate, formatTime } from '@/lib/format';
import type { Radicada } from '@/services/reportService';

gsap.registerPlugin(useGSAP);

interface ReportConfirmationProps {
  result: Radicada;
  ubicacion: string[];
  categoria: string;
  subcategoria?: string;
  onNew: () => void;
}

/** Confirmación oficial del ticket radicado (mockup "Confirmación de ticket registrado"). */
export default function ReportConfirmation({ result, ubicacion, categoria, subcategoria, onNew }: ReportConfirmationProps) {
  const { profile } = useSession();
  const scope = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from('.seal', { scale: 0, rotate: -40, duration: 0.6, ease: 'back.out(2)' })
          .from('.seal-ring', { scale: 0.6, opacity: 0, duration: 0.8 }, '<0.1')
          .from('.ticket-code span', { y: 18, opacity: 0, duration: 0.35, stagger: 0.03 }, '-=0.4')
          .from('.reveal', { y: 16, opacity: 0, duration: 0.4, stagger: 0.07 }, '-=0.2');
      });
      return () => mm.revert();
    },
    { scope },
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.codigo_ticket);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div ref={scope} className="mx-auto max-w-3xl">
      <nav aria-label="Ruta de navegación" className="mb-3 text-xs font-medium text-slate-500">
        Inicio <span className="mx-1 text-slate-300">›</span> <span className="font-semibold text-sky-800">Confirmación de ticket</span>
      </nav>
      <div className="card overflow-hidden">
        <div className="h-3 bg-gradient-to-r from-praxis-blue to-[#0b7cc4]" aria-hidden="true" />
        <div className="space-y-7 p-6 sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <span className="seal-ring absolute -inset-3 rounded-full bg-emerald-100" aria-hidden="true" />
              <span className="seal relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-600/30">
                <Check className="h-10 w-10" strokeWidth={3} aria-hidden="true" />
              </span>
            </div>
            <span className="reveal mt-6 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold text-sky-800">Confirmación oficial</span>
            <h1 className="reveal mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Reporte registrado con éxito</h1>
            <p className="reveal mt-2 max-w-lg text-sm leading-relaxed text-slate-500">
              Tu solicitud ingresó a PRAXIS y fue notificada a la coordinación de mantenimiento e infraestructura.
            </p>
          </div>

          {result.es_riesgo_inmediato && (
            <p className="reveal flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
              <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
              Marcado como riesgo inmediato: prioridad crítica y alerta enviada a la mesa de ayuda y a coordinación.
            </p>
          )}

          <div className="reveal flex flex-col items-start justify-between gap-4 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-[11px] font-bold text-sky-800">Identificador único</p>
              <p className="ticket-code mt-1 font-mono text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl" aria-label={result.codigo_ticket}>
                {Array.from(`#${result.codigo_ticket}`).map((ch, i) => (
                  <span key={i} className="inline-block" aria-hidden="true">
                    {ch}
                  </span>
                ))}
              </p>
            </div>
            <button type="button" onClick={copy} className="btn-secondary">
              {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <ClipboardCopy className="h-4 w-4" aria-hidden="true" />}
              {copied ? 'Copiado' : 'Copiar código'}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoTile icon={<CalendarDays className="h-4 w-4" />} label="Fecha de registro" value={formatLongDate(result.fecha_registro)} hint={`${formatTime(result.fecha_registro)} (hora local)`} />
            <InfoTile icon={<Activity className="h-4 w-4" />} label="Estado inicial">
              <StatusBadge code={result.estado.codigo} name={`Abierto · ${result.estado.nombre}`} size="md" />
            </InfoTile>
            <InfoTile icon={<MapPin className="h-4 w-4" />} label="Ubicación registrada" value={ubicacion[0] ?? ''} hint={ubicacion.slice(1).join(' · ')} />
            <InfoTile icon={<Tag className="h-4 w-4" />} label="Categoría" value={categoria} hint={subcategoria} />
          </div>

          {profile && (
            <p className="reveal rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
              Recibirás notificaciones en la plataforma y en tu correo institucional ({profile.email}).
            </p>
          )}

          <div className="reveal space-y-3">
            <Link href={`/mis-solicitudes/${result.id}`} className="btn-primary h-13 w-full py-4 text-base">
              Ver detalle de este ticket
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={onNew} className="btn-secondary h-12">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Crear nuevo reporte
              </button>
              <Link href="/mis-solicitudes" className="btn-secondary h-12">
                Ir a Mis solicitudes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value, hint, children }: { icon: React.ReactNode; label: string; value?: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="reveal rounded-2xl border border-praxis-line bg-slate-50/60 p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
        <span className="text-sky-700">{icon}</span>
        {label}
      </p>
      <div className="mt-2">
        {children ?? <p className="font-bold text-slate-900">{value}</p>}
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}
