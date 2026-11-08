"use client";

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Building, ChevronRight, DoorOpen, Layers, MapPinned, Pencil, Plus, Power, Search, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { QueryBoundary } from '@/components/ui/States';
import { confirmAction } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/Toaster';
import { FormError, useSubmit } from '@/components/ops/actions/ActionKit';
import { adminService, type NivelUbicacion } from '@/services/adminService';
import { useApiQuery } from '@/lib/useApiQuery';
import { apiErrorMessage } from '@/lib/apiError';
import { useModuleAccess } from '@/lib/session/SessionProvider';
import ReadOnlyNotice from './ReadOnlyNotice';

const LEVELS: Record<NivelUbicacion, { label: string; child?: NivelUbicacion; parentKey?: string; icon: typeof Building }> = {
  sedes: { label: 'Sede', child: 'edificios', icon: MapPinned },
  edificios: { label: 'Edificio', child: 'pisos', parentKey: 'sede_id', icon: Building },
  pisos: { label: 'Piso', child: 'espacios', parentKey: 'edificio_id', icon: Layers },
  espacios: { label: 'Espacio', parentKey: 'piso_id', icon: DoorOpen },
};

interface TreeNode {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
  direccion?: string | null;
  nivel?: number | null;
  tipo?: string | null;
  edificios?: TreeNode[];
  pisos?: TreeNode[];
  espacios?: TreeNode[];
}

type Form = { mode: 'create' | 'edit'; level: NivelUbicacion; node?: TreeNode; parentId?: number; parentName?: string };

function children(level: NivelUbicacion, node: TreeNode): TreeNode[] {
  return (level === 'sedes' ? node.edificios : level === 'edificios' ? node.pisos : level === 'pisos' ? node.espacios : []) ?? [];
}

function count(nodes: TreeNode[] = [], key: 'edificios' | 'pisos' | 'espacios'): number {
  return nodes.reduce((acc, n) => acc + (key === 'edificios' ? n.edificios?.length ?? 0 : key === 'pisos' ? (n.edificios ?? []).reduce((a, e) => a + (e.pisos?.length ?? 0), 0) : (n.edificios ?? []).reduce((a, e) => a + (e.pisos ?? []).reduce((b, p) => b + (p.espacios?.length ?? 0), 0), 0)), 0);
}

/** Árbol de ubicaciones con formularios modales (HU-11.1, KAN-322). */
export default function LocationsView() {
  const readOnly = useModuleAccess('ADMIN_UBICACIONES') === 'LECTURA';
  const tree = useApiQuery('admin:ubicaciones', adminService.locations);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<Form | null>(null);
  const [q, setQ] = useState('');
  const sedes = (tree.data ?? []) as unknown as TreeNode[];

  const toggle = async (level: NivelUbicacion, node: TreeNode) => {
    const ok = await confirmAction(
      node.activo
        ? {
            tone: 'warning',
            icon: 'power',
            title: `¿Inactivar ${LEVELS[level].label.toLowerCase()}?`,
            subject: node.nombre,
            description: 'Dejará de aparecer al radicar reportes. Las incidencias que ya tiene no cambian y puedes activarla de nuevo cuando quieras.',
            confirmLabel: 'Inactivar',
          }
        : { tone: 'primary', icon: 'power', title: `¿Activar ${LEVELS[level].label.toLowerCase()}?`, subject: node.nombre, description: 'Volverá a estar disponible al radicar reportes.', confirmLabel: 'Activar' },
    );
    if (!ok) return;
    try {
      await adminService.setLocationState(level, node.id, !node.activo);
      toast(node.activo ? `${LEVELS[level].label} inactivada: deja de aparecer al radicar.` : `${LEVELS[level].label} activada.`);
      void tree.reload();
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo cambiar el estado.'), 'error');
    }
  };
  const remove = async (level: NivelUbicacion, node: TreeNode) => {
    const ok = await confirmAction({
      tone: 'danger',
      icon: 'delete',
      title: `¿Eliminar ${LEVELS[level].label.toLowerCase()}?`,
      subject: node.nombre,
      description: 'Esta acción no se puede deshacer. Solo es posible si no tiene incidencias ni niveles dependientes.',
      confirmLabel: 'Eliminar',
    });
    if (!ok) return;
    try {
      await adminService.deleteLocation(level, node.id);
      toast(`${node.nombre} se eliminó del catálogo de ubicaciones.`, 'success', 'Ubicación eliminada');
      void tree.reload();
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo eliminar.'), 'error');
    }
  };

  const match = (n: TreeNode): boolean => !q || n.nombre.toLowerCase().includes(q.toLowerCase()) || n.codigo.toLowerCase().includes(q.toLowerCase());
  const visible = (level: NivelUbicacion, n: TreeNode): boolean => match(n) || children(level, n).some((c) => visible(LEVELS[level].child!, c));

  const renderNode = (level: NivelUbicacion, node: TreeNode, depth: number, parentId?: number) => {
    if (q && !visible(level, node)) return null;
    const key = `${level}-${node.id}`;
    const meta = LEVELS[level];
    const kids = children(level, node);
    const expanded = q ? true : open[key];
    const Icon = meta.icon;
    return (
      <li key={key}>
        <div className={`group flex items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-slate-50 ${node.activo ? '' : 'opacity-50'}`} style={{ paddingLeft: depth * 24 + 8 }}>
          {meta.child ? (
            <button type="button" onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))} aria-expanded={Boolean(expanded)} aria-label={expanded ? 'Contraer' : 'Expandir'} className="rounded p-1 text-slate-400 hover:text-slate-700">
              <ChevronRight className={`h-4 w-4 transition ${expanded ? 'rotate-90' : ''}`} aria-hidden="true" />
            </button>
          ) : (
            <span className="w-6" />
          )}
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${level === 'sedes' ? 'bg-praxis-navy text-white' : 'bg-slate-100 text-slate-600'}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate font-semibold text-slate-900">{node.nombre}</span>
              <span className="font-mono text-[11px] text-slate-400">{node.codigo}</span>
              {!node.activo && <span className="rounded bg-slate-200 px-1.5 text-[10px] font-bold text-slate-600">Inactiva</span>}
            </span>
            <span className="block text-xs text-slate-500">
              {level === 'sedes' && (node.direccion ?? '')}
              {level === 'pisos' && node.nivel !== null && node.nivel !== undefined && `Nivel ${node.nivel}`}
              {level === 'espacios' && (node.tipo ?? '')}
              {meta.child && ` ${kids.length} ${LEVELS[meta.child].label.toLowerCase()}${kids.length === 1 ? '' : 's'}`}
            </span>
          </span>
          {!readOnly && (
            <span className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              {meta.child && (
                <button type="button" title={`Agregar ${LEVELS[meta.child].label.toLowerCase()}`} onClick={() => setForm({ mode: 'create', level: meta.child!, parentId: node.id, parentName: node.nombre })} className="rounded-lg p-2 text-sky-700 hover:bg-sky-50">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <button type="button" title="Editar" onClick={() => setForm({ mode: 'edit', level, node, parentId })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button" title={node.activo ? 'Inactivar' : 'Activar'} onClick={() => toggle(level, node)} className={`rounded-lg p-2 hover:bg-slate-100 ${node.activo ? 'text-amber-600' : 'text-emerald-600'}`}>
                <Power className="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button" title="Eliminar" onClick={() => remove(level, node)} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </span>
          )}
        </div>
        <AnimatePresence initial={false}>
          {expanded && meta.child && kids.length > 0 && (
            <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              {kids.map((k) => renderNode(meta.child!, k, depth + 1, node.id))}
            </motion.ul>
          )}
        </AnimatePresence>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Administración' }, { label: 'Ubicaciones' }]}
        title="Ubicaciones del campus"
        description="Jerarquía sede › edificio › piso › espacio que se usa al radicar. Las inactivas dejan de aparecer pero se conservan en el historial."
        actions={
          !readOnly && (
            <button type="button" onClick={() => setForm({ mode: 'create', level: 'sedes' })} className="btn-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nueva sede
            </button>
          )
        }
      />
      {readOnly && <ReadOnlyNotice />}
      <QueryBoundary loading={tree.initialLoading} error={tree.error} onRetry={tree.reload} label="Cargando ubicaciones">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            ['Sedes', sedes.length],
            ['Edificios', count(sedes, 'edificios')],
            ['Pisos', count(sedes, 'pisos')],
            ['Espacios', count(sedes, 'espacios')],
          ].map(([l, v]) => (
            <div key={l} className="card p-4">
              <p className="text-xs font-semibold text-slate-500">{l}</p>
              <p className="text-3xl font-extrabold tabular-nums text-slate-900">{v}</p>
            </div>
          ))}
        </div>
        <section className="card p-4">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input type="search" aria-label="Buscar ubicación" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o código" className="field h-10 pl-10" />
          </div>
          <ul role="tree" aria-label="Ubicaciones">{sedes.map((s) => renderNode('sedes', s, 0))}</ul>
        </section>
      </QueryBoundary>
      {form && <LocationForm form={form} onClose={() => setForm(null)} onDone={(m) => { toast(m); void tree.reload(); }} />}
    </div>
  );
}

function LocationForm({ form, onClose, onDone }: { form: Form; onClose: () => void; onDone: (m: string) => void }) {
  const meta = LEVELS[form.level];
  const [codigo, setCodigo] = useState(form.node?.codigo ?? '');
  const [nombre, setNombre] = useState(form.node?.nombre ?? '');
  const [extra, setExtra] = useState(String((form.level === 'sedes' ? form.node?.direccion : form.level === 'pisos' ? form.node?.nivel : form.node?.tipo) ?? ''));
  const submit = useSubmit();
  const save = async () => {
    if (!codigo.trim() || !nombre.trim()) return submit.setError('Código y nombre son obligatorios.');
    const body: Record<string, unknown> = { codigo: codigo.trim(), nombre: nombre.trim() };
    if (form.level === 'sedes') body.direccion = extra.trim() || null;
    if (form.level === 'pisos' && extra !== '') body.nivel = Number(extra);
    if (form.level === 'espacios') body.tipo = extra.trim() || null;
    if (form.mode === 'create' && meta.parentKey) body[meta.parentKey] = form.parentId;
    const ok = await submit.run(() => (form.mode === 'create' ? adminService.createLocation(form.level, body) : adminService.updateLocation(form.level, form.node!.id, body)));
    if (ok) {
      onClose();
      onDone(form.mode === 'create' ? `${meta.label} creada.` : `${meta.label} actualizada.`);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      busy={submit.busy}
      icon={<meta.icon className="h-5 w-5" />}
      title={form.mode === 'create' ? `Nuevo ${meta.label.toLowerCase()}` : `Editar ${meta.label.toLowerCase()}`}
      description={form.parentName ? `Dentro de ${form.parentName}` : undefined}
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
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <label className="field-label">
            Código
            <input className="field mt-1.5 font-mono font-normal uppercase" maxLength={30} value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} />
          </label>
          <label className="field-label">
            Nombre
            <input className="field mt-1.5 font-normal" maxLength={120} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>
        </div>
        {form.level === 'sedes' && (
          <label className="field-label block">
            Dirección <span className="font-normal text-slate-400">(opcional)</span>
            <input className="field mt-1.5 font-normal" maxLength={255} value={extra} onChange={(e) => setExtra(e.target.value)} />
          </label>
        )}
        {form.level === 'pisos' && (
          <label className="field-label block">
            Nivel <span className="font-normal text-slate-400">(opcional, -10 a 200)</span>
            <input type="number" min={-10} max={200} className="field mt-1.5 w-40 font-normal" value={extra} onChange={(e) => setExtra(e.target.value)} />
          </label>
        )}
        {form.level === 'espacios' && (
          <label className="field-label block">
            Tipo de espacio
            <input list="space-types" className="field mt-1.5 font-normal" maxLength={40} value={extra} onChange={(e) => setExtra(e.target.value.toUpperCase())} placeholder="AULA, LABORATORIO, BANO…" />
            <datalist id="space-types">
              {['AULA', 'LABORATORIO', 'BANO', 'OFICINA', 'AUDITORIO', 'BIBLIOTECA', 'CORREDOR', 'CUARTO_TECNICO'].map((t) => <option key={t} value={t} />)}
            </datalist>
          </label>
        )}
        <FormError message={submit.error} />
      </div>
    </Modal>
  );
}
