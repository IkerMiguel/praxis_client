"use client";

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { History, Minus, Plus, RotateCcw, Save, SlidersHorizontal } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { QueryBoundary } from '@/components/ui/States';
import StatusTimeline from '@/components/ui/StatusTimeline';
import { toast } from '@/components/ui/Toaster';
import { adminService, type Parametros } from '@/services/adminService';
import { useApiQuery } from '@/lib/useApiQuery';
import { apiErrorMessage } from '@/lib/apiError';
import { TONE_CLASSES, priorityTone } from '@/lib/tones';
import { useModuleAccess } from '@/lib/session/SessionProvider';
import ReadOnlyNotice from './ReadOnlyNotice';

const IMPACTS = ['ALTO', 'MEDIO', 'BAJO'];
const URGENCIES = ['ALTA', 'MEDIA', 'BAJA'];
const CYCLE = ['CRITICA', 'ALTA', 'MEDIA', 'BAJA'];
const NAMES: Record<string, string> = { CRITICA: 'Crítica', ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja', ALTO: 'Alto', MEDIO: 'Medio', BAJO: 'Bajo' };
const GROUPS: Record<string, string> = { ANALITICA: 'Analítica', RADICACION: 'Radicación', EVIDENCIAS: 'Evidencias', AUTORIZACION: 'Autorizaciones', SLA: 'Plazos', SEGURIDAD: 'Seguridad', OPERACION: 'Operación', REPORTANTE: 'Reportante' };

function humanize(key: string) {
  return key.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

/** Matriz de prioridad, metas SLA y parámetros generales con historial (HU-11.3, KAN-332). */
export default function ParametersView() {
  const readOnly = useModuleAccess('ADMIN_PARAMETROS') === 'LECTURA';
  const query = useApiQuery('admin:parametros', adminService.parameters);
  const history = useApiQuery('admin:parametros:historial', () => adminService.history());
  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Administración' }, { label: 'Parámetros del sistema' }]}
        title="Parámetros del sistema"
        description="Reglas que gobiernan la priorización, los plazos y el comportamiento del flujo. Los cambios aplican de inmediato y quedan auditados."
      />
      {readOnly && <ReadOnlyNotice />}
      <QueryBoundary loading={query.initialLoading} error={query.error} onRetry={query.reload} label="Cargando parámetros">
        {query.data && (
          <Editor
            key={JSON.stringify(query.data)}
            initial={query.data}
            readOnly={readOnly}
            onSaved={() => {
              void query.reload();
              void history.reload();
            }}
          />
        )}
      </QueryBoundary>
      <section className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
          <History className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Historial de configuración
        </h2>
        {history.data && history.data.data.length === 0 ? <p className="text-sm text-slate-500">Aún no hay cambios de configuración registrados.</p> : history.data ? <StatusTimeline events={history.data.data} /> : <p className="text-sm text-slate-400">Cargando…</p>}
      </section>
    </div>
  );
}

function Editor({ initial, readOnly, onSaved }: { initial: Parametros; readOnly: boolean; onSaved: () => void }) {
  const [matrix, setMatrix] = useState(initial.matriz_prioridad);
  const [sla, setSla] = useState(initial.sla);
  const [params, setParams] = useState(Object.fromEntries(initial.parametros.map((p) => [p.clave, p.valor])));
  const [saving, setSaving] = useState(false);

  const cell = (i: string, u: string) => matrix.find((m) => m.impacto === i && m.urgencia === u)?.prioridad ?? 'BAJA';
  const matrixDirty = matrix.some((m) => initial.matriz_prioridad.find((o) => o.impacto === m.impacto && o.urgencia === m.urgencia)?.prioridad !== m.prioridad);
  const slaDirty = sla.some((s, i) => s.horas_primera_respuesta !== initial.sla[i].horas_primera_respuesta || s.horas_resolucion !== initial.sla[i].horas_resolucion);
  const changedParams = initial.parametros.filter((p) => params[p.clave] !== p.valor);
  const changes = (matrixDirty ? 1 : 0) + (slaDirty ? 1 : 0) + changedParams.length;
  const invalid = sla.some((s) => s.horas_primera_respuesta < 1 || s.horas_resolucion < 1 || s.horas_resolucion < s.horas_primera_respuesta) || Object.values(params).some((v) => !(v >= 1));

  const cycle = (i: string, u: string) => {
    if (readOnly) return;
    const next = CYCLE[(CYCLE.indexOf(cell(i, u)) + 1) % CYCLE.length];
    setMatrix((m) => m.map((x) => (x.impacto === i && x.urgencia === u ? { ...x, prioridad: next } : x)));
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminService.updateParameters({
        matriz: matrixDirty ? matrix : undefined,
        sla: slaDirty ? sla.map(({ codigo, horas_primera_respuesta, horas_resolucion }) => ({ codigo, horas_primera_respuesta, horas_resolucion })) : undefined,
        parametros: changedParams.length ? Object.fromEntries(changedParams.map((p) => [p.clave, params[p.clave]])) : undefined,
      });
      toast('Configuración guardada y aplicada.');
      onSaved();
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo guardar la configuración.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const groups = initial.parametros.reduce<Record<string, Parametros['parametros']>>((acc, p) => ({ ...acc, [p.grupo]: [...(acc[p.grupo] ?? []), p] }), {});

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-bold text-slate-900">Matriz de prioridad</h2>
          <p className="mb-4 text-xs text-slate-500">{readOnly ? 'Prioridad resultante para cada combinación.' : 'Haz clic en una celda para cambiar la prioridad resultante.'}</p>
          <table className="w-full text-center text-sm">
            <thead>
              <tr className="text-[11px] font-semibold text-slate-500">
                <th className="px-2 py-2 text-left">Impacto \ Urgencia</th>
                {URGENCIES.map((u) => <th key={u} className="px-2 py-2">{NAMES[u]}</th>)}
              </tr>
            </thead>
            <tbody>
              {IMPACTS.map((i) => (
                <tr key={i}>
                  <th scope="row" className="px-2 py-1.5 text-left font-semibold text-slate-700">{NAMES[i]}</th>
                  {URGENCIES.map((u) => {
                    const p = cell(i, u);
                    const t = TONE_CLASSES[priorityTone(p)];
                    const changed = initial.matriz_prioridad.find((o) => o.impacto === i && o.urgencia === u)?.prioridad !== p;
                    return (
                      <td key={u} className="p-1.5">
                        <motion.button
                          type="button"
                          disabled={readOnly}
                          onClick={() => cycle(i, u)}
                          whileTap={{ scale: 0.92 }}
                          aria-label={`Impacto ${NAMES[i]}, urgencia ${NAMES[u]}: ${NAMES[p]}`}
                          className={`h-14 w-full rounded-xl text-xs font-bold transition disabled:cursor-default ${t.soft} ${t.text} ${changed ? 'ring-2 ring-praxis-navy ring-offset-2' : ''}`}
                        >
                          <motion.span key={p} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="block">
                            {NAMES[p]}
                          </motion.span>
                        </motion.button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card p-6">
          <h2 className="font-bold text-slate-900">Metas SLA por prioridad</h2>
          <p className="mb-4 text-xs text-slate-500">Horas hábiles (lunes a viernes, 8:00 a 18:00).</p>
          <div className="space-y-3">
            {sla.map((s, idx) => (
              <div key={s.codigo} className="grid grid-cols-[100px_1fr_1fr] items-center gap-3">
                <span className={`rounded-lg px-2 py-1 text-center text-xs font-bold ${TONE_CLASSES[priorityTone(s.codigo)].soft} ${TONE_CLASSES[priorityTone(s.codigo)].text}`}>{s.nombre}</span>
                <Spinner label="1.ª respuesta" value={s.horas_primera_respuesta} min={1} max={2000} disabled={readOnly} onChange={(v) => setSla((l) => l.map((x, j) => (j === idx ? { ...x, horas_primera_respuesta: v } : x)))} />
                <Spinner label="Resolución" value={s.horas_resolucion} min={1} max={5000} disabled={readOnly} error={s.horas_resolucion < s.horas_primera_respuesta} onChange={(v) => setSla((l) => l.map((x, j) => (j === idx ? { ...x, horas_resolucion: v } : x)))} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Parámetros generales
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <p className="eyebrow mb-2">{GROUPS[group] ?? humanize(group)}</p>
              <ul className="space-y-2">
                {items.map((p) => (
                  <li key={p.clave} className={`flex items-center gap-4 rounded-xl border p-3 ${params[p.clave] !== p.valor ? 'border-praxis-navy bg-sky-50/40' : 'border-praxis-line'}`}>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-800">{humanize(p.clave)}</span>
                      <span className="block text-xs text-slate-500">{p.descripcion}</span>
                    </span>
                    <Spinner value={params[p.clave]} min={1} max={100000000} disabled={readOnly} onChange={(v) => setParams((x) => ({ ...x, [p.clave]: v }))} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {!readOnly && changes > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="sticky bottom-4 z-20 mx-auto flex max-w-2xl items-center gap-3 rounded-2xl bg-praxis-navy px-5 py-3 text-white shadow-2xl">
            <span className="flex-1 text-sm">
              {changes} cambio{changes === 1 ? '' : 's'} sin guardar {invalid && <span className="ml-2 font-semibold text-amber-300">· revisa los valores</span>}
            </span>
            <button type="button" onClick={() => { setMatrix(initial.matriz_prioridad); setSla(initial.sla); setParams(Object.fromEntries(initial.parametros.map((p) => [p.clave, p.valor]))); }} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-sky-100 hover:bg-white/10">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Descartar
            </button>
            <button type="button" onClick={save} disabled={saving || invalid} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-praxis-navy disabled:opacity-50">
              <Save className="h-4 w-4" aria-hidden="true" />
              {saving ? 'Guardando…' : 'Guardar y aplicar'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Spinner({ value, onChange, min, max, label, disabled, error }: { value: number; onChange: (v: number) => void; min: number; max: number; label?: string; disabled?: boolean; error?: boolean }) {
  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(v) || min));
  return (
    <div>
      {label && <span className="mb-1 block text-[10px] font-semibold text-slate-500">{label}</span>}
      <span className={`flex items-center rounded-xl ${error ? 'bg-red-50 ring-1 ring-red-300' : 'bg-praxis-field'}`}>
        <button type="button" disabled={disabled || value <= min} onClick={() => onChange(clamp(value - 1))} aria-label="Disminuir" className="p-2 text-slate-500 disabled:opacity-30">
          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <input type="number" aria-label={label ?? 'Valor'} min={min} max={max} disabled={disabled} value={value} onChange={(e) => onChange(clamp(Number(e.target.value)))} style={{ width: `${Math.max(4, String(value).length + 1)}ch` }} className="bg-transparent text-center text-sm font-bold tabular-nums text-slate-900 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
        <button type="button" disabled={disabled || value >= max} onClick={() => onChange(clamp(value + 1))} aria-label="Aumentar" className="p-2 text-slate-500 disabled:opacity-30">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}
