"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { BellOff, CheckCheck, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, QueryBoundary } from '@/components/ui/States';
import { notificationService, type Notificacion } from '@/services/notificationService';
import { notificationVisual } from '@/components/shell/notificationVisual';
import { setUnread, useUnread } from '@/lib/unreadStore';
import { useApiQuery } from '@/lib/useApiQuery';
import { formatDate, formatRelative } from '@/lib/format';

type Filter = 'todas' | 'no-leidas';
const PER_PAGE = 20;

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return formatDate(iso);
}

/** Centro de notificaciones en plataforma (HU-2.5). */
export default function NotificationsView() {
  const router = useRouter();
  const unread = useUnread();
  const [filter, setFilter] = useState<Filter>('todas');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Notificacion[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const query = useApiQuery(`notificaciones:${filter}`, async () => {
    const result = await notificationService.list({ per_page: PER_PAGE, page: 1, solo_no_leidas: filter === 'no-leidas' });
    setItems(result.data);
    setPage(1);
    setUnread(result.meta.no_leidas);
    return result;
  });

  const lastPage = query.data?.meta.last_page ?? 1;

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const result = await notificationService.list({ per_page: PER_PAGE, page: page + 1, solo_no_leidas: filter === 'no-leidas' });
      setItems((list) => [...list, ...result.data]);
      setPage(page + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  const open = (item: Notificacion) => {
    if (!item.leida) {
      setItems((list) => list.map((n) => (n.id === item.id ? { ...n, leida: true } : n)));
      notificationService.markRead(item.id).then(setUnread).catch(() => undefined);
    }
    if (item.incidencia) router.push(`/incidencia/${item.incidencia.id}`);
  };

  const markAll = async () => {
    setItems((list) => (filter === 'no-leidas' ? [] : list.map((n) => ({ ...n, leida: true }))));
    setUnread(await notificationService.markAll().catch(() => unread));
  };

  const groups = items.reduce<{ label: string; items: Notificacion[] }[]>((acc, item) => {
    const label = dayLabel(item.fecha_envio);
    const group = acc.find((g) => g.label === label);
    if (group) group.items.push(item);
    else acc.push({ label, items: [item] });
    return acc;
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        crumbs={[{ label: 'Notificaciones' }]}
        title="Notificaciones"
        description="Cambios de estado, aclaraciones y avisos sobre las solicitudes en las que participas."
        actions={
          unread > 0 && (
            <button type="button" onClick={markAll} className="btn-secondary">
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              Marcar todas como leídas
            </button>
          )
        }
      />

      <div role="tablist" aria-label="Filtro de notificaciones" className="inline-flex rounded-xl border border-praxis-line bg-white p-1">
        {(
          [
            ['todas', 'Todas'],
            ['no-leidas', `Sin leer${unread > 0 ? ` (${unread})` : ''}`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
            className={`relative rounded-lg px-4 py-2 text-sm font-semibold transition ${filter === value ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {filter === value && <motion.span layoutId="notif-filter" className="absolute inset-0 rounded-lg bg-praxis-navy" />}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      <QueryBoundary loading={query.initialLoading || (query.loading && items.length === 0)} error={query.error} onRetry={query.reload} label="Cargando notificaciones">
        {items.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<BellOff className="h-7 w-7" />}
              title={filter === 'no-leidas' ? 'No tienes notificaciones sin leer' : 'Aún no tienes notificaciones'}
              description="Te avisaremos aquí y en la campana cuando cambie algo en tus solicitudes."
            />
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.label} aria-label={group.label}>
                <h2 className="eyebrow mb-2 px-1">{group.label}</h2>
                <ul className="card divide-y divide-slate-100 overflow-hidden">
                  <AnimatePresence initial={false}>
                    {group.items.map((item) => {
                      const visual = notificationVisual(item.tipo);
                      const Icon = visual.icon;
                      return (
                        <motion.li key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}>
                          <button
                            type="button"
                            onClick={() => open(item)}
                            className={`group flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-slate-50 ${item.leida ? '' : 'bg-sky-50/40'}`}
                          >
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${visual.tone}`}>
                              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className={`text-sm ${item.leida ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>{item.titulo}</span>
                                {item.incidencia && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">{item.incidencia.codigo_ticket}</span>}
                              </span>
                              <span className="mt-1 block text-sm leading-relaxed text-slate-500">{item.mensaje}</span>
                              <span className="mt-1.5 block text-xs text-slate-400">{formatRelative(item.fecha_envio)}</span>
                            </span>
                            {!item.leida && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" aria-label="Sin leer" />}
                            {item.incidencia && <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-500" aria-hidden="true" />}
                          </button>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              </section>
            ))}
            {page < lastPage && (
              <div className="flex justify-center">
                <button type="button" onClick={loadMore} disabled={loadingMore} className="btn-secondary">
                  {loadingMore ? 'Cargando…' : 'Cargar más'}
                </button>
              </div>
            )}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
