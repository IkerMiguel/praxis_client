"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Pencil, Plus, Power, Tag } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { QueryBoundary } from '@/components/ui/States';
import { toast } from '@/components/ui/Toaster';
import { CategoryIcon } from '@/components/report/categoryIcon';
import { FormError, useSubmit } from '@/components/ops/actions/ActionKit';
import { adminService, type CategoriaAdmin, type CategoriaPayload } from '@/services/adminService';
import { useApiQuery } from '@/lib/useApiQuery';
import { apiErrorMessage } from '@/lib/apiError';
import { useModuleAccess } from '@/lib/session/SessionProvider';
import ReadOnlyNotice from './ReadOnlyNotice';

const RISK = [
  ['BAJO', 'Bajo'],
  ['MEDIO', 'Medio'],
  ['ALTO', 'Alto'],
];

/** Taxonomía de daños con reglas por categoría (HU-11.2, KAN-327). */
export default function CategoriesView() {
  const readOnly = useModuleAccess('ADMIN_CATEGORIAS') === 'LECTURA';
  const cats = useApiQuery('admin:categorias', adminService.categories);
  const esp = useApiQuery('admin:especialidades', adminService.especialidades);
  const [form, setForm] = useState<{ cat?: CategoriaAdmin; parent?: CategoriaAdmin } | null>(null);

  const patch = async (cat: CategoriaAdmin, body: CategoriaPayload, message: string) => {
    cats.setData((list) => (list ?? []).map((c) => (c.id === cat.id ? { ...c, ...body } as CategoriaAdmin : { ...c, subcategorias: c.subcategorias?.map((s) => (s.id === cat.id ? ({ ...s, ...body } as CategoriaAdmin) : s)) })));
    try {
      await adminService.updateCategory(cat.id, body);
      toast(message);
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo guardar el cambio.'), 'error');
      void cats.reload();
    }
  };

  const espName = (id: number | null) => esp.data?.find((e) => e.id === id)?.nombre ?? 'Sin especialidad';

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Administración' }, { label: 'Categorías de daño' }]}
        title="Categorías de daño"
        description="Clasificación que eligen los reportantes y reglas que aplica el flujo: foto obligatoria, confirmación del cierre y especialidad que atiende."
        actions={
          !readOnly && (
            <button type="button" onClick={() => setForm({})} className="btn-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nueva categoría
            </button>
          )
        }
      />
      {readOnly && <ReadOnlyNotice />}
      <QueryBoundary loading={cats.initialLoading} error={cats.error} onRetry={cats.reload} label="Cargando categorías">
        <div className="grid gap-4 lg:grid-cols-2">
          {(cats.data ?? []).map((c, i) => (
            <motion.section key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`card p-5 ${c.activo ? '' : 'opacity-60'}`}>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <CategoryIcon codigo={c.codigo} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">{c.nombre}</span>
                    <span className="font-mono text-[11px] text-slate-400">{c.codigo}</span>
                    {!c.activo && <span className="rounded bg-slate-200 px-1.5 text-[10px] font-bold text-slate-600">Inactiva</span>}
                  </p>
                  <p className="text-xs text-slate-500">Atiende: {espName(c.especialidad_id)}</p>
                </div>
                {!readOnly && (
                  <span className="flex gap-0.5">
                    <button type="button" title="Editar" onClick={() => setForm({ cat: c })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" title={c.activo ? 'Inactivar' : 'Activar'} onClick={() => patch(c, { activo: !c.activo }, c.activo ? 'Categoría inactivada.' : 'Categoría activada.')} className={`rounded-lg p-2 hover:bg-slate-100 ${c.activo ? 'text-amber-600' : 'text-emerald-600'}`}>
                      <Power className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </span>
                )}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Switch label="Foto obligatoria al radicar" hint="RN-005" checked={c.exige_evidencia_fotografica} disabled={readOnly} onChange={(v) => patch(c, { exige_evidencia_fotografica: v }, 'Regla de foto actualizada.')} />
                <Switch label="Confirmación del reportante" hint="Termina en E14 en vez de E15" checked={c.requiere_confirmacion_cierre} disabled={readOnly} onChange={(v) => patch(c, { requiere_confirmacion_cierre: v }, 'Regla de cierre actualizada.')} />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-500">Riesgo base</span>
                {RISK.map(([v, l]) => (
                  <button key={v} type="button" disabled={readOnly} aria-pressed={c.nivel_riesgo_base === v} onClick={() => patch(c, { nivel_riesgo_base: v }, 'Riesgo base actualizado.')} className={`rounded-full px-2.5 py-1 font-semibold transition disabled:cursor-default ${c.nivel_riesgo_base === v ? (v === 'ALTO' ? 'bg-red-600 text-white' : v === 'MEDIO' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white') : 'bg-slate-100 text-slate-500'}`}>
                    {l}
                  </button>
                ))}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="mb-2 text-xs font-semibold text-slate-500">Subcategorías</p>
                <div className="flex flex-wrap gap-1.5">
                  {(c.subcategorias ?? []).map((s) => (
                    <button key={s.id} type="button" disabled={readOnly} onClick={() => setForm({ cat: s, parent: c })} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${s.activo ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 text-slate-400 line-through'}`}>
                      <Tag className="h-3 w-3" aria-hidden="true" />
                      {s.nombre}
                    </button>
                  ))}
                  {!readOnly && (
                    <button type="button" onClick={() => setForm({ parent: c })} className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50">
                      <Plus className="h-3 w-3" aria-hidden="true" />
                      Agregar
                    </button>
                  )}
                </div>
              </div>
            </motion.section>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Las metas de tiempo por prioridad se configuran en{' '}
          <Link href="/admin/parametros" className="font-semibold text-sky-700 hover:underline">
            Parámetros del sistema
          </Link>
          .
        </p>
      </QueryBoundary>
      {form && (
        <CategoryForm
          cat={form.cat}
          parent={form.parent}
          especialidades={esp.data ?? []}
          onClose={() => setForm(null)}
          onDone={(m) => {
            toast(m);
            void cats.reload();
          }}
        />
      )}
    </div>
  );
}

function Switch({ label, hint, checked, onChange, disabled }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className="flex items-center gap-3 rounded-xl border border-praxis-line px-3 py-2.5 text-left transition hover:border-slate-300 disabled:cursor-default disabled:hover:border-praxis-line">
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? 'bg-praxis-blue' : 'bg-slate-300'}`}>
        <motion.span className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow" animate={{ left: checked ? 18 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
      </span>
      <span>
        <span className="block text-xs font-semibold text-slate-800">{label}</span>
        <span className="block text-[10px] text-slate-400">{hint}</span>
      </span>
    </button>
  );
}

function CategoryForm({ cat, parent, especialidades, onClose, onDone }: { cat?: CategoriaAdmin; parent?: CategoriaAdmin; especialidades: { id: number; nombre: string; activo: boolean }[]; onClose: () => void; onDone: (m: string) => void }) {
  const [f, setF] = useState({
    codigo: cat?.codigo ?? (parent ? `${parent.codigo}_` : ''),
    nombre: cat?.nombre ?? '',
    descripcion: cat?.descripcion ?? '',
    especialidad_id: cat?.especialidad_id ?? parent?.especialidad_id ?? null,
    exige: cat?.exige_evidencia_fotografica ?? parent?.exige_evidencia_fotografica ?? false,
    confirma: cat?.requiere_confirmacion_cierre ?? parent?.requiere_confirmacion_cierre ?? true,
    riesgo: cat?.nivel_riesgo_base ?? parent?.nivel_riesgo_base ?? 'BAJO',
    activo: cat?.activo ?? true,
  });
  const submit = useSubmit();
  const save = async () => {
    if (!f.codigo.trim() || !f.nombre.trim()) return submit.setError('Código y nombre son obligatorios.');
    const body: CategoriaPayload = {
      codigo: f.codigo.trim(),
      nombre: f.nombre.trim(),
      descripcion: f.descripcion.trim() || null,
      especialidad_id: f.especialidad_id,
      exige_evidencia_fotografica: f.exige,
      requiere_confirmacion_cierre: f.confirma,
      nivel_riesgo_base: f.riesgo,
      activo: f.activo,
      ...(parent && !cat ? { categoria_padre_id: parent.id } : {}),
    };
    if (await submit.run(() => (cat ? adminService.updateCategory(cat.id, body) : adminService.createCategory(body)))) {
      onClose();
      onDone(cat ? 'Categoría actualizada.' : parent ? 'Subcategoría creada.' : 'Categoría creada.');
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      busy={submit.busy}
      size="lg"
      icon={<Tag className="h-5 w-5" />}
      title={cat ? `Editar ${parent ? 'subcategoría' : 'categoría'}` : parent ? `Nueva subcategoría de ${parent.nombre}` : 'Nueva categoría'}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submit.busy}>
            Cancelar
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={submit.busy}>
            {submit.busy ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <label className="field-label">
            Código
            <input className="field mt-1.5 font-mono font-normal uppercase" maxLength={40} value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value.toUpperCase().replace(/\s+/g, '_') })} />
          </label>
          <label className="field-label">
            Nombre
            <input className="field mt-1.5 font-normal" maxLength={120} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} />
          </label>
        </div>
        <label className="field-label block">
          Descripción <span className="font-normal text-slate-400">(opcional)</span>
          <textarea rows={2} className="field mt-1.5 font-normal" maxLength={500} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} />
        </label>
        <label className="field-label block">
          Especialidad que la atiende
          <select className="field mt-1.5 font-normal" value={f.especialidad_id ?? ''} onChange={(e) => setF({ ...f, especialidad_id: Number(e.target.value) || null })}>
            <option value="">Sin especialidad</option>
            {especialidades.filter((e) => e.activo).map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <Switch label="Foto obligatoria al radicar" hint="RN-005" checked={f.exige} onChange={(v) => setF({ ...f, exige: v })} />
          <Switch label="Confirmación del reportante" hint="Cierre en E14" checked={f.confirma} onChange={(v) => setF({ ...f, confirma: v })} />
          <Switch label="Activa" hint="Visible al radicar" checked={f.activo} onChange={(v) => setF({ ...f, activo: v })} />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Riesgo base</span>
          {RISK.map(([v, l]) => (
            <button key={v} type="button" aria-pressed={f.riesgo === v} onClick={() => setF({ ...f, riesgo: v as typeof f.riesgo })} className={`rounded-full px-3 py-1.5 font-semibold ${f.riesgo === v ? 'bg-praxis-navy text-white' : 'bg-slate-100 text-slate-600'}`}>
              {l}
            </button>
          ))}
        </div>
        <FormError message={submit.error} />
      </div>
    </Modal>
  );
}
