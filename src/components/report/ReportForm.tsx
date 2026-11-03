"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Check, CircleAlert, Info, MapPin, Send, ShieldAlert, Siren } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import EvidenceUploader from '@/components/ui/EvidenceUploader';
import { QueryBoundary } from '@/components/ui/States';
import FullscreenLoader from '@/components/ui/FullscreenLoader';
import { catalogService, type Categoria, type Sede } from '@/services/catalogService';
import { reportService, type Radicada } from '@/services/reportService';
import type { Evidencia } from '@/services/evidenceService';
import { useApiQuery } from '@/lib/useApiQuery';
import { apiErrorMessage, apiFieldErrors } from '@/lib/apiError';
import { categoryIcon } from './categoryIcon';
import DuplicateAlert from './DuplicateAlert';
import ReportConfirmation from './ReportConfirmation';

const DRAFT_KEY = 'praxis.borrador-reporte';
const MIN_DESC = 20;
const MAX_DESC = 500;

interface Draft {
  sedeId: number | null;
  edificioId: number | null;
  pisoId: number | null;
  espacioId: number | null;
  categoriaId: number | null;
  subcategoriaId: number | null;
  resumen: string;
  descripcion: string;
  riesgo: boolean;
  descripcionRiesgo: string;
}

const EMPTY: Draft = {
  sedeId: null,
  edificioId: null,
  pisoId: null,
  espacioId: null,
  categoriaId: null,
  subcategoriaId: null,
  resumen: '',
  descripcion: '',
  riesgo: false,
  descripcionRiesgo: '',
};

function readDraft(): Draft {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function saveDraft(draft: Draft | null) {
  try {
    if (draft) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Sin almacenamiento local: el borrador simplemente no se conserva.
  }
}

/** Radicación de incidencias con ubicación jerárquica, clasificación, evidencias y riesgo (HU-3.1 a 3.3). */
export default function ReportForm() {
  const catalogs = useApiQuery('catalogos-radicacion', async () => {
    const [sedes, categorias] = await Promise.all([catalogService.ubicaciones(), catalogService.categorias()]);
    return { sedes, categorias };
  });

  return (
    <QueryBoundary loading={catalogs.initialLoading} error={catalogs.error} onRetry={catalogs.reload} label="Preparando formulario">
      {catalogs.data && <ReportFormBody sedes={catalogs.data.sedes} categorias={catalogs.data.categorias} />}
    </QueryBoundary>
  );
}

function ReportFormBody({ sedes, categorias }: { sedes: Sede[]; categorias: Categoria[] }) {
  const router = useRouter();
  const [form, setForm] = useState<Draft>(readDraft);
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [diferente, setDiferente] = useState(false);
  const [hasMatches, setHasMatches] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Radicada | null>(null);
  const [leaving, setLeaving] = useState(false);
  const idempotencyKey = useRef<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => saveDraft(form), 400);
    return () => clearTimeout(timer);
  }, [form]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
    idempotencyKey.current = null;
  };

  /** Cambiar un nivel de la ubicación limpia los niveles inferiores y sus errores. */
  const pickLocation = (patch: Partial<Draft>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => ({ ...e, ...Object.fromEntries(Object.keys(patch).filter((k) => patch[k as keyof Draft]).map((k) => [k, ''])) }));
    idempotencyKey.current = null;
  };

  const sede = sedes.find((s) => s.id === form.sedeId);
  const edificio = sede?.edificios.find((e) => e.id === form.edificioId);
  const piso = edificio?.pisos.find((p) => p.id === form.pisoId);
  const espacio = piso?.espacios.find((e) => e.id === form.espacioId);
  const categoria = categorias.find((c) => c.id === form.categoriaId);
  const subcategoria = categoria?.subcategorias.find((s) => s.id === form.subcategoriaId);
  const requiresPhoto = Boolean(categoria?.exige_evidencia_fotografica || subcategoria?.exige_evidencia_fotografica);
  const descLength = form.descripcion.trim().length;

  const checklist = [
      { label: 'Ubicación exacta', done: Boolean(espacio) },
      { label: 'Categoría del daño', done: Boolean(categoria) },
      { label: `Descripción (mín. ${MIN_DESC} caracteres)`, done: descLength >= MIN_DESC },
      { label: requiresPhoto ? 'Foto obligatoria' : 'Fotos (recomendado)', done: evidencias.length > 0, optional: !requiresPhoto },
      ...(form.riesgo ? [{ label: 'Detalle del riesgo', done: form.descripcionRiesgo.trim().length > 0 }] : []),
  ];

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.sedeId) next.sedeId = 'Elige la sede.';
    if (!form.edificioId) next.edificioId = 'Elige el edificio.';
    if (!form.pisoId) next.pisoId = 'Elige el piso.';
    if (!form.espacioId) next.espacioId = 'Elige el espacio exacto.';
    if (!form.categoriaId) next.categoriaId = 'Elige la categoría del daño.';
    if (descLength < MIN_DESC) next.descripcion = `Describe el daño con al menos ${MIN_DESC} caracteres.`;
    if (descLength > MAX_DESC) next.descripcion = `La descripción admite máximo ${MAX_DESC} caracteres.`;
    if (requiresPhoto && evidencias.length === 0) next.evidencias = 'Esta categoría exige al menos una foto del daño.';
    if (form.riesgo && !form.descripcionRiesgo.trim()) next.descripcionRiesgo = 'Explica cuál es el riesgo para las personas.';
    if (hasMatches && !diferente) next.duplicado = 'Revisa las solicitudes abiertas en este espacio: síguela o confirma que es un problema diferente.';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      document.querySelector(`[data-field="${Object.keys(next)[0]}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  };

  const submit = async () => {
    setSending(true);
    setFormError('');
    idempotencyKey.current ??= crypto.randomUUID();
    try {
      const created = await reportService.radicar(
        {
          sede_id: form.sedeId!,
          edificio_id: form.edificioId!,
          piso_id: form.pisoId!,
          espacio_fisico_id: form.espacioId!,
          categoria_id: form.categoriaId!,
          subcategoria_id: form.subcategoriaId ?? undefined,
          resumen: form.resumen.trim() || `${subcategoria?.nombre ?? categoria?.nombre} en ${espacio?.nombre}`.slice(0, 150),
          descripcion: form.descripcion.trim(),
          canal_radicacion: window.matchMedia('(max-width: 640px)').matches ? 'MOVIL' : 'WEB',
          es_riesgo_inmediato: form.riesgo,
          descripcion_riesgo: form.riesgo ? form.descripcionRiesgo.trim() : undefined,
          es_problema_diferente: hasMatches ? diferente : undefined,
          evidencias: evidencias.map((e) => e.id),
        },
        idempotencyKey.current,
      );
      saveDraft(null);
      setConfirming(false);
      setResult(created);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const fields = apiFieldErrors(err);
      const mapped: Record<string, string> = {};
      const keys: Record<string, string> = {
        sede_id: 'sedeId', edificio_id: 'edificioId', piso_id: 'pisoId', espacio_fisico_id: 'espacioId',
        categoria_id: 'categoriaId', descripcion: 'descripcion', descripcion_riesgo: 'descripcionRiesgo', evidencias: 'evidencias',
      };
      for (const [k, v] of Object.entries(fields)) mapped[keys[k.split('.')[0]] ?? k] = v;
      setErrors(mapped);
      setFormError(apiErrorMessage(err, 'No pudimos radicar el reporte. Intenta de nuevo.'));
      setConfirming(false);
    } finally {
      setSending(false);
    }
  };

  if (result) {
    return (
      <ReportConfirmation
        result={result}
        ubicacion={[sede?.nombre, edificio?.nombre, piso?.nombre, espacio?.nombre].filter(Boolean) as string[]}
        categoria={categoria?.nombre ?? ''}
        subcategoria={subcategoria?.nombre}
        onNew={() => {
          setForm(EMPTY);
          setEvidencias([]);
          setDiferente(false);
          setResult(null);
          idempotencyKey.current = null;
        }}
      />
    );
  }

  const selectClass = (key: string) => `field h-12 appearance-none pr-10 ${errors[key] ? 'border-red-300 ring-4 ring-red-50' : ''}`;

  return (
    <div className="space-y-6">
      {leaving && <FullscreenLoader label="Saliendo" />}
      <PageHeader
        crumbs={[{ label: 'Nuevo reporte de mantenimiento' }]}
        title="Nuevo reporte de mantenimiento"
        description="Diligencia los datos de la novedad para que la coordinación de infraestructura gestione la orden técnica."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (validate()) setConfirming(true);
          }}
          className="card overflow-hidden"
        >
          <div className="h-2 bg-gradient-to-r from-praxis-blue via-praxis-sky to-praxis-green" aria-hidden="true" />
          <div className="space-y-10 p-6 sm:p-10">
            <Section number={1} title="Ubicación exacta" subtitle="Identifica el punto donde está la falla" badge="Obligatorio">
              <div className="grid gap-4 md:grid-cols-3">
                <SelectField label="Sede / campus" error={errors.sedeId} field="sedeId">
                  <select className={selectClass('sedeId')} value={form.sedeId ?? ''} onChange={(e) => pickLocation({ sedeId: Number(e.target.value) || null, edificioId: null, pisoId: null, espacioId: null })}>
                    <option value="">Selecciona la sede</option>
                    {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </SelectField>
                <SelectField label="Bloque / edificio" error={errors.edificioId} field="edificioId">
                  <select className={selectClass('edificioId')} disabled={!sede} value={form.edificioId ?? ''} onChange={(e) => pickLocation({ edificioId: Number(e.target.value) || null, pisoId: null, espacioId: null })}>
                    <option value="">{sede ? 'Selecciona el edificio' : 'Primero la sede'}</option>
                    {sede?.edificios.map((ed) => <option key={ed.id} value={ed.id}>{ed.nombre}</option>)}
                  </select>
                </SelectField>
                <SelectField label="Piso / nivel" error={errors.pisoId} field="pisoId">
                  <select className={selectClass('pisoId')} disabled={!edificio} value={form.pisoId ?? ''} onChange={(e) => pickLocation({ pisoId: Number(e.target.value) || null, espacioId: null })}>
                    <option value="">{edificio ? 'Selecciona el piso' : 'Primero el edificio'}</option>
                    {edificio?.pisos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </SelectField>
              </div>

              <div data-field="espacioId">
                <p className="field-label">
                  Espacio específico <span className="text-red-500">*</span>
                </p>
                {!piso ? (
                  <p className="rounded-xl border border-dashed border-praxis-line px-4 py-4 text-sm text-slate-400">Elige sede, edificio y piso para ver sus espacios.</p>
                ) : piso.espacios.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-500">Este piso no tiene espacios activos registrados.</p>
                ) : (
                  <div role="radiogroup" aria-label="Espacio" className="flex flex-wrap gap-2">
                    {piso.espacios.map((sp) => {
                      const selected = sp.id === form.espacioId;
                      return (
                        <button
                          key={sp.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => set('espacioId', sp.id)}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition ${
                            selected ? 'border-praxis-blue bg-sky-50 text-sky-900 ring-4 ring-sky-100' : 'border-praxis-line bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <MapPin className={`h-4 w-4 ${selected ? 'text-sky-700' : 'text-slate-400'}`} aria-hidden="true" />
                          {sp.nombre}
                          <span className="font-mono text-[11px] font-medium text-slate-400">{sp.codigo}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {errors.espacioId && <p className="mt-1.5 text-sm text-red-600">{errors.espacioId}</p>}
              </div>

              <div>
                <label htmlFor="resumen" className="field-label">
                  Título breve y referencia visual <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <input
                  id="resumen"
                  className="field h-12"
                  maxLength={150}
                  value={form.resumen}
                  onChange={(e) => set('resumen', e.target.value)}
                  placeholder="Ej.: Luminaria apagada junto a la sala de racks"
                />
                <p className="mt-2 flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-800">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Agrega referencias como columnas o equipos contiguos para agilizar la llegada de la cuadrilla.
                </p>
              </div>
            </Section>

            <Section number={2} title="Clasificación y detalle" subtitle="Tipo de daño para despacharlo al equipo correcto" badge="Paso clave" badgeTone="sky">
              <div data-field="categoriaId">
                <p className="field-label">
                  Categoría principal <span className="text-red-500">*</span>
                </p>
                <div role="radiogroup" aria-label="Categoría" className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                  {categorias.map((c) => {
                    const Icon = categoryIcon(c.codigo);
                    const selected = c.id === form.categoriaId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => {
                          setForm((f) => ({ ...f, categoriaId: c.id, subcategoriaId: null }));
                          setErrors((e) => ({ ...e, categoriaId: '' }));
                        }}
                        className={`relative flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition ${
                          selected ? 'border-praxis-blue bg-sky-50 ring-4 ring-sky-100' : 'border-praxis-line bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-900/5'
                        }`}
                      >
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${selected ? 'bg-praxis-blue text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                        </span>
                        <span className={`text-[13px] font-semibold leading-snug ${selected ? 'text-sky-900' : 'text-slate-800'}`}>{c.nombre}</span>
                        {c.exige_evidencia_fotografica && <span className="text-[10px] font-bold text-amber-700">Requiere foto</span>}
                        {selected && (
                          <motion.span layoutId="cat-check" className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-praxis-blue text-white">
                            <Check className="h-3 w-3" aria-hidden="true" />
                          </motion.span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {errors.categoriaId && <p className="mt-1.5 text-sm text-red-600">{errors.categoriaId}</p>}
              </div>

              <AnimatePresence initial={false}>
                {categoria && categoria.subcategorias.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <p className="field-label">Subcategoría</p>
                    <div className="flex flex-wrap gap-2">
                      {categoria.subcategorias.map((s) => {
                        const selected = s.id === form.subcategoriaId;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => set('subcategoriaId', selected ? null : s.id)}
                            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${selected ? 'border-praxis-navy bg-praxis-navy text-white' : 'border-praxis-line bg-white text-slate-700 hover:border-slate-300'}`}
                          >
                            {s.nombre}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div data-field="descripcion">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="descripcion" className="field-label">
                    Descripción detallada del daño <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-xs font-semibold tabular-nums ${descLength > MAX_DESC ? 'text-red-600' : descLength >= MIN_DESC ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {descLength} / {MAX_DESC}
                  </span>
                </div>
                <textarea
                  id="descripcion"
                  rows={5}
                  maxLength={MAX_DESC + 50}
                  value={form.descripcion}
                  onChange={(e) => set('descripcion', e.target.value)}
                  className={`field resize-y leading-relaxed ${errors.descripcion ? 'border-red-300 ring-4 ring-red-50' : ''}`}
                  placeholder="Qué observas, desde cuándo ocurre y si afecta el desarrollo de clases o la seguridad."
                />
                {errors.descripcion ? (
                  <p className="mt-1.5 text-sm text-red-600">{errors.descripcion}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-500">Indica si hay chispas, olor, calor o agua, y si interrumpe actividades.</p>
                )}
              </div>

              {espacio && (
                <div data-field="duplicado">
                  <DuplicateAlert
                    espacioId={espacio.id}
                    categoriaId={categoria?.id}
                    diferente={diferente}
                    onDiferenteChange={(v) => {
                      setDiferente(v);
                      setErrors((e) => ({ ...e, duplicado: '' }));
                    }}
                    onMatchesChange={setHasMatches}
                    onFollowed={() => {
                      saveDraft(null);
                      setLeaving(true);
                      router.push('/mis-solicitudes?ambito=seguidas');
                    }}
                  />
                  {errors.duplicado && <p className="mt-2 text-sm font-medium text-red-600">{errors.duplicado}</p>}
                </div>
              )}

              <div
                data-field="descripcionRiesgo"
                className={`rounded-2xl border p-4 transition sm:p-5 ${form.riesgo ? 'border-red-300 bg-red-50' : 'border-praxis-line bg-slate-50/60'}`}
              >
                <label className="flex cursor-pointer items-start gap-4">
                  <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${form.riesgo ? 'bg-red-600 text-white' : 'bg-white text-red-500'}`}>
                    <Siren className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold text-slate-900">Hay riesgo inmediato para las personas</span>
                    <span className="block text-sm text-slate-600">Chispas, cables expuestos, fuga mayor, riesgo estructural. Queda en prioridad crítica y se alerta a coordinación.</span>
                  </span>
                  <input type="checkbox" className="peer sr-only" checked={form.riesgo} onChange={(e) => set('riesgo', e.target.checked)} />
                  <span className={`relative mt-2 h-6 w-11 shrink-0 rounded-full transition ${form.riesgo ? 'bg-red-600' : 'bg-slate-300'} peer-focus-visible:ring-4 peer-focus-visible:ring-red-200`} aria-hidden="true">
                    <motion.span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow" animate={{ left: form.riesgo ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                  </span>
                </label>
                <AnimatePresence initial={false}>
                  {form.riesgo && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <label htmlFor="riesgo" className="field-label mt-4">
                        ¿Cuál es el riesgo? <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="riesgo"
                        rows={2}
                        maxLength={500}
                        value={form.descripcionRiesgo}
                        onChange={(e) => set('descripcionRiesgo', e.target.value)}
                        className={`field bg-white ${errors.descripcionRiesgo ? 'border-red-300' : ''}`}
                        placeholder="Ej.: cable energizado expuesto a la altura de los estudiantes"
                      />
                      {errors.descripcionRiesgo && <p className="mt-1.5 text-sm text-red-700">{errors.descripcionRiesgo}</p>}
                      <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-red-800">
                        <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                        Si hay peligro, aléjate del área y avisa también al personal de seguridad.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Section>

            <Section number={3} title="Evidencia fotográfica" subtitle="Ayuda al técnico a diagnosticar antes de llegar" badge={requiresPhoto ? 'Obligatorio' : 'Recomendado'} badgeTone={requiresPhoto ? 'amber' : 'green'}>
              <div data-field="evidencias">
                <EvidenceUploader value={evidencias} onChange={(v) => { setEvidencias(v); setErrors((e) => ({ ...e, evidencias: '' })); }} required={requiresPhoto} onBusyChange={setUploading} />
                {errors.evidencias && <p className="mt-2 text-sm text-red-600">{errors.evidencias}</p>}
              </div>
            </Section>

            {formError && (
              <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {formError}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-praxis-line pt-6 sm:flex-row sm:items-center">
              <Link href="/panel" className="btn-secondary h-12 px-6">
                Cancelar
              </Link>
              <button type="submit" disabled={uploading} className={`${form.riesgo ? 'btn-danger' : 'btn-primary'} h-12 px-7`}>
                {uploading ? 'Esperando la carga de fotos…' : 'Revisar y enviar reporte'}
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="text-xs text-slate-400 sm:ml-auto">Borrador guardado en este equipo</span>
            </div>
          </div>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-44">
          <div className="card p-5">
            <p className="text-sm font-bold text-slate-900">Tu reporte</p>
            <ul className="mt-4 space-y-3">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm">
                  <motion.span
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${item.done ? 'bg-emerald-500 text-white' : 'border-2 border-slate-200 text-transparent'}`}
                    animate={{ scale: item.done ? [1, 1.2, 1] : 1 }}
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </motion.span>
                  <span className={item.done ? 'font-medium text-slate-800' : 'text-slate-500'}>{item.label}</span>
                </li>
              ))}
            </ul>
            {espacio && (
              <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">{espacio.nombre}</p>
                <p>{[sede?.nombre, edificio?.nombre, piso?.nombre].join(' · ')}</p>
              </div>
            )}
            {categoria?.especialidad && (
              <p className="mt-3 text-xs text-slate-500">
                Lo atenderá: <span className="font-semibold text-slate-700">{categoria.especialidad.nombre}</span>
              </p>
            )}
          </div>
          <Link href="/ayuda" className="block rounded-2xl border border-praxis-line bg-white p-4 text-xs text-slate-500 hover:border-slate-300">
            <span className="font-semibold text-slate-800">¿Dudas al reportar?</span> Revisa la guía en 3 pasos del centro de ayuda.
          </Link>
        </aside>
      </div>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        busy={sending}
        icon={form.riesgo ? <Siren className="h-5 w-5 text-red-600" /> : <Send className="h-5 w-5" />}
        title={form.riesgo ? 'Confirmar reporte con riesgo inmediato' : 'Confirmar envío del reporte'}
        description="Revisa los datos antes de radicar. Después podrás seguirlo desde Mis solicitudes."
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setConfirming(false)} disabled={sending}>
              Seguir editando
            </button>
            <button type="button" className={form.riesgo ? 'btn-danger' : 'btn-primary'} onClick={submit} disabled={sending}>
              {sending ? 'Radicando…' : 'Radicar reporte'}
            </button>
          </>
        }
      >
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Summary label="Ubicación" value={[edificio?.nombre, piso?.nombre, espacio?.nombre].filter(Boolean).join(' · ')} />
          <Summary label="Categoría" value={[categoria?.nombre, subcategoria?.nombre].filter(Boolean).join(' / ')} />
          <Summary label="Descripción" value={form.descripcion} wide />
          <Summary label="Evidencias" value={`${evidencias.length} archivo${evidencias.length === 1 ? '' : 's'}`} />
          {form.riesgo && <Summary label="Riesgo inmediato" value={form.descripcionRiesgo} tone="danger" />}
        </dl>
      </Modal>
    </div>
  );
}

function Section({
  number,
  title,
  subtitle,
  badge,
  badgeTone = 'slate',
  children,
}: {
  number: number;
  title: string;
  subtitle: string;
  badge: string;
  badgeTone?: 'slate' | 'sky' | 'green' | 'amber';
  children: React.ReactNode;
}) {
  const tones = { slate: 'bg-slate-100 text-slate-600', sky: 'bg-sky-100 text-sky-800', green: 'bg-emerald-100 text-emerald-800', amber: 'bg-amber-100 text-amber-800' };
  return (
    <section className="space-y-5" aria-labelledby={`section-${number}`}>
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-praxis-navy text-sm font-bold text-white">{number}</span>
        <div className="flex-1">
          <h2 id={`section-${number}`} className="text-lg font-bold text-slate-900">
            {title}
          </h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${tones[badgeTone]}`}>{badge}</span>
      </div>
      <div className="space-y-5 sm:pl-14">{children}</div>
    </section>
  );
}

function SelectField({ label, error, field, children }: { label: string; error?: string; field: string; children: React.ReactNode }) {
  return (
    <div data-field={field}>
      <label className="field-label">
        {label} <span className="text-red-500">*</span>
        <span className="relative mt-1.5 block font-normal">
          {children}
          <svg className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </span>
      </label>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function Summary({ label, value, wide, tone }: { label: string; value: string; wide?: boolean; tone?: 'danger' }) {
  return (
    <div className={`rounded-xl p-3 ${wide ? 'sm:col-span-2' : ''} ${tone === 'danger' ? 'bg-red-50' : 'bg-slate-50'}`}>
      <dt className={`text-xs font-semibold ${tone === 'danger' ? 'text-red-700' : 'text-slate-500'}`}>{label}</dt>
      <dd className="mt-1 whitespace-pre-line font-medium text-slate-900">{value || '—'}</dd>
    </div>
  );
}
