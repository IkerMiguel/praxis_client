"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { Camera, ChevronDown, CircleCheck, MapPin, Printer, Search, SearchX, Zap, BarChart3, ShieldAlert } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/Badges';
import { QueryBoundary } from '@/components/ui/States';
import { useApiQuery } from '@/lib/useApiQuery';
import { panelService } from '@/services/panelService';

const STEPS = [
  {
    icon: MapPin,
    title: 'Ubica el daño',
    text: 'Elige sede, edificio, piso y espacio exacto. Agrega referencias visibles como columnas o equipos cercanos.',
    tip: 'Ejemplo: Bloque principal, piso 3, laboratorio 302',
    tipIcon: MapPin,
  },
  {
    icon: Camera,
    title: 'Describe y fotografía',
    text: 'Cuenta qué pasa y desde cuándo. Adjunta una foto amplia del espacio y otra cercana del componente dañado.',
    tip: 'Las fotos aceleran el diagnóstico técnico',
    tipIcon: Zap,
  },
  {
    icon: CircleCheck,
    title: 'Sigue tu ticket',
    text: 'Recibes notificaciones con cada cambio. Si te piden una aclaración, respóndela desde Mis solicitudes.',
    tip: 'Trazabilidad completa desde Mis solicitudes',
    tipIcon: BarChart3,
  },
];

const FAQS = [
  {
    q: '¿Cuánto tarda en validarse mi solicitud?',
    a: 'La mesa de ayuda revisa y prioriza cada reporte según el impacto y la urgencia. Cada prioridad tiene una meta de respuesta en horas hábiles (lunes a viernes, 8:00 a 18:00). Los casos con riesgo para las personas se atienden de inmediato.',
  },
  {
    q: '¿Qué fotografías debo adjuntar?',
    a: 'Al menos dos: una toma amplia que muestre el contexto del espacio y una toma cercana y bien iluminada del componente dañado. Se aceptan JPG, PNG, WEBP o PDF de hasta 10 MB, con un máximo de 4 archivos por reporte. Algunas categorías exigen al menos una foto.',
  },
  {
    q: '¿Qué hago si mi ticket pasa a "Pendiente de información"?',
    a: 'Abre la solicitud desde Mis solicitudes y revisa la pregunta de la mesa de ayuda. Responde con la aclaración y, si hace falta, adjunta fotos. Si no respondes dentro del plazo indicado, la solicitud se cancela automáticamente.',
  },
  {
    q: '¿Cómo sé que el daño quedó resuelto?',
    a: 'Cuando el técnico termina y la verificación de calidad aprueba el trabajo, tu solicitud pasa a "Pendiente de confirmación". Entra, revisa las fotos de la intervención y confirma que quedó resuelto o indica que el problema persiste.',
  },
  {
    q: '¿Puedo cancelar una solicitud?',
    a: 'Sí, mientras todavía no tenga un técnico asignado. Debes indicar el motivo de la cancelación. Después de la asignación, comunícate con la mesa de ayuda.',
  },
  {
    q: '¿Qué pasa si el problema vuelve después del cierre?',
    a: 'Puedes reabrir la solicitud dentro de la ventana de garantía. Su prioridad sube a Alta y la coordinación recibe una alerta. Pasada la ventana, radica un reporte nuevo.',
  },
  {
    q: 'Alguien ya reportó el mismo daño, ¿qué hago?',
    a: 'Al radicar, PRAXIS te avisa si existe una solicitud abierta en el mismo espacio y categoría. Puedes seguirla en lugar de crear una nueva y recibirás sus actualizaciones.',
  },
];

function normalize(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Centro de ayuda: guía de proceso, preguntas frecuentes y glosario de estados (HU-2.4). */
export default function HelpView() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<number | null>(0);
  const glosario = useApiQuery('glosario', panelService.glosario);

  const q = normalize(query.trim());
  const faqs = useMemo(() => FAQS.map((f, i) => ({ ...f, i })).filter((f) => !q || normalize(`${f.q} ${f.a}`).includes(q)), [q]);
  const states = useMemo(
    () => (glosario.data ?? []).filter((s) => !q || normalize(`${s.codigo} ${s.nombre} ${s.significado}`).includes(q)),
    [glosario.data, q],
  );

  return (
    <div className="space-y-10">
      <PageHeader
        crumbs={[{ label: 'Centro de ayuda' }]}
        title="Aprende a reportar una falla en el campus"
        description="Guía rápida para radicar novedades de infraestructura, entender cada estado y resolver las dudas más comunes."
        actions={
          <button type="button" onClick={() => window.print()} className="btn-secondary">
            <Printer className="h-4 w-4" aria-hidden="true" />
            Imprimir guía
          </button>
        }
      />

      <div className="relative max-w-2xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <label htmlFor="help-search" className="sr-only">
          Buscar en la ayuda
        </label>
        <input
          id="help-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca una duda o un estado, por ejemplo: fotos, cancelar, en revisión"
          className="h-13 w-full rounded-2xl border border-praxis-line bg-white py-3.5 pl-12 pr-4 text-[15px] shadow-sm transition focus:border-praxis-sky focus:outline-none focus:ring-4 focus:ring-praxis-sky/15"
        />
      </div>

      {!q && (
        <section aria-labelledby="steps-title" className="space-y-4">
          <h2 id="steps-title" className="text-xl font-bold text-slate-900">
            Guía rápida en 3 pasos
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <motion.li
                key={step.title}
                className="card relative overflow-hidden p-6"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
              >
                <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-praxis-blue to-praxis-sky" aria-hidden="true" />
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">Paso {index + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
                <p className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-600">
                  <step.tipIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" aria-hidden="true" />
                  {step.tip}
                </p>
              </motion.li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="faq-title" className="space-y-4">
        <div>
          <h2 id="faq-title" className="text-xl font-bold text-slate-900">
            Preguntas frecuentes
          </h2>
          <p className="text-sm text-slate-500">Respuestas sobre el ciclo de vida de los reportes.</p>
        </div>
        {faqs.length === 0 ? (
          <p className="flex items-center gap-2 rounded-2xl border border-dashed border-praxis-line bg-white px-5 py-6 text-sm text-slate-500">
            <SearchX className="h-4 w-4" aria-hidden="true" />
            Ninguna pregunta coincide con “{query}”.
          </p>
        ) : (
          <div className="card divide-y divide-slate-100 overflow-hidden">
            {faqs.map((faq) => {
              const expanded = open === faq.i || Boolean(q);
              return (
                <div key={faq.q}>
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(open === faq.i ? null : faq.i)}
                      aria-expanded={expanded}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-[15px] font-semibold text-slate-900 transition hover:bg-slate-50"
                    >
                      {faq.q}
                      <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section id="estados" aria-labelledby="states-title" className="scroll-mt-40 space-y-4">
        <div>
          <h2 id="states-title" className="text-xl font-bold text-slate-900">
            Qué significa cada estado
          </h2>
          <p className="text-sm text-slate-500">Los estados que verás en tus solicitudes, en el orden en que normalmente ocurren.</p>
        </div>
        <QueryBoundary loading={glosario.initialLoading} error={glosario.error} onRetry={glosario.reload} label="Cargando estados">
          <ul className="grid gap-3 md:grid-cols-2">
            {states.map((state) => (
              <li key={state.codigo} className={`card flex gap-4 p-4 ${state.requiere_accion_reportante ? 'border-orange-200 bg-orange-50/40' : ''}`}>
                <span className="w-9 shrink-0 pt-0.5 font-mono text-xs font-bold text-slate-400">{state.codigo}</span>
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge code={state.codigo} name={state.nombre} color={state.color} />
                    {state.requiere_accion_reportante && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700">
                        <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                        Requiere tu acción
                      </span>
                    )}
                    {state.es_terminal && <span className="text-[11px] font-semibold text-slate-400">Estado final</span>}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">{state.significado}</p>
                </div>
              </li>
            ))}
          </ul>
          {states.length === 0 && q && <p className="text-sm text-slate-500">Ningún estado coincide con “{query}”.</p>}
        </QueryBoundary>
      </section>

      <aside className="rounded-3xl bg-gradient-to-br from-praxis-navy to-[#0a3d6e] px-6 py-6 text-white sm:px-8">
        <p className="text-lg font-bold">¿Hay riesgo para las personas?</p>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-sky-100/85">
          Ante fugas de gas o agua, chispas, cables expuestos o riesgo estructural, aléjate del área, avisa al personal de seguridad y radica el reporte marcándolo como riesgo.
        </p>
        <Link href="/reportes/nuevo" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-praxis-navy hover:bg-sky-50">
          Radicar un reporte
        </Link>
      </aside>
    </div>
  );
}
