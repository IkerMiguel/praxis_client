"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Inbox, MessageSquareMore, Search, ShieldAlert, Sparkles, SearchCheck, Tags, Loader2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, QueryBoundary } from '@/components/ui/States';
import { toast } from '@/components/ui/Toaster';
import { opsService } from '@/services/opsService';
import { useApiQuery } from '@/lib/useApiQuery';
import { useSession } from '@/lib/session/SessionProvider';
import { apiErrorMessage } from '@/lib/apiError';
import IncidentTable from './IncidentTable';
import QueueStats, { type QueueStat } from './QueueStats';

const BUCKETS: Record<string, { estado: string; riesgo?: boolean }> = {
  nuevas: { estado: 'E01' },
  revision: { estado: 'E03' },
  clasificacion: { estado: 'E04' },
  aclaracion: { estado: 'E02' },
  riesgo: { estado: 'E01,E02,E03,E04,E05', riesgo: true },
};
const ALL = 'E01,E02,E03,E04';

/** Bandeja de triaje operativo de la mesa de ayuda (HU-5.1, KAN-197). */
export default function TriageInboxView() {
  const { activeRole } = useSession();
  const [bucket, setBucket] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [taking, setTaking] = useState<string | null>(null);
  const filter = BUCKETS[bucket] ?? { estado: ALL };

  const counts = useApiQuery('triaje:conteos', async () => {
    const entries = await Promise.all(
      Object.entries(BUCKETS).map(async ([key, f]) => [key, (await opsService.consola({ estado: f.estado, riesgo_inmediato: f.riesgo, per_page: 1 })).meta.total] as const),
    );
    return Object.fromEntries(entries) as Record<string, number>;
  });
  const list = useApiQuery(`triaje:${bucket}:${q}`, () => opsService.consola({ estado: filter.estado, riesgo_inmediato: filter.riesgo, q, per_page: 50 }));

  const take = async (id: string, code: string) => {
    setTaking(id);
    try {
      await opsService.iniciarRevision(id);
      toast(`Tomaste ${code} para revisión.`);
      void list.reload();
      void counts.reload();
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo tomar la solicitud.'), 'error');
    } finally {
      setTaking(null);
    }
  };

  const c = counts.data;
  const stats: QueueStat[] = [
    { key: 'nuevas', label: 'Nuevas sin revisar', value: c?.nuevas, hint: 'Registradas', tone: 'azul', icon: <Sparkles className="h-4 w-4" /> },
    { key: 'revision', label: 'En revisión', value: c?.revision, hint: 'Procedencia y duplicados', tone: 'violeta', icon: <SearchCheck className="h-4 w-4" /> },
    { key: 'clasificacion', label: 'En clasificación', value: c?.clasificacion, hint: 'Impacto × urgencia', tone: 'cian', icon: <Tags className="h-4 w-4" /> },
    { key: 'aclaracion', label: 'Esperando reportante', value: c?.aclaracion, hint: 'Aclaración pendiente', tone: 'naranja', icon: <MessageSquareMore className="h-4 w-4" /> },
    { key: 'riesgo', label: 'Riesgo inmediato', value: c?.riesgo, hint: 'Atender primero', tone: 'rojo', icon: <ShieldAlert className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Bandeja de triaje' }]}
        title="Bandeja de triaje"
        description="Revisa las solicitudes nuevas, descarta duplicados, define su procedencia y prioriza la atención."
      />

      <QueueStats stats={stats} active={bucket} onSelect={setBucket} />

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-praxis-line px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900">{stats.find((s) => s.key === bucket)?.label ?? 'Todas las solicitudes en triaje'}</h2>
            <p className="text-xs text-slate-500">{list.data ? `${list.data.meta.total} solicitudes` : 'Cargando…'}</p>
          </div>
          <form
            className="relative sm:ml-auto sm:w-80"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setQ(search.trim());
            }}
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <label htmlFor="triage-search" className="sr-only">
              Buscar
            </label>
            <input id="triage-search" type="search" value={search} onChange={(e) => { setSearch(e.target.value); if (!e.target.value) setQ(''); }} placeholder="Código o resumen y Enter" className="field h-10 pl-10" />
          </form>
        </div>
        <QueryBoundary loading={list.initialLoading} error={list.error} onRetry={list.reload} label="Cargando bandeja">
          {list.data && list.data.data.length === 0 ? (
            <EmptyState icon={<Inbox className="h-7 w-7" />} title="Bandeja al día" description="No hay solicitudes en esta etapa. Las nuevas aparecerán aquí en cuanto se radiquen." />
          ) : (
            list.data && (
              <div className={list.loading ? 'opacity-60' : ''}>
                <IncidentTable
                  rows={list.data.data}
                  showTech={false}
                  action={(row) =>
                    row.estado.codigo === 'E01' && (activeRole === 'R02' || activeRole === 'R07') ? (
                      <button type="button" onClick={() => take(row.id, row.codigo_ticket)} disabled={taking !== null} className="btn-primary px-3 py-1.5 text-xs">
                        {taking === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
                        Tomar
                      </button>
                    ) : (
                      <Link href={`/incidencias/${row.id}`} className="btn-secondary px-3 py-1.5 text-xs">
                        Revisar
                      </Link>
                    )
                  }
                />
              </div>
            )
          )}
        </QueryBoundary>
      </section>
    </div>
  );
}
