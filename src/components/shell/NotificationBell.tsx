"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import Popover from '@/components/ui/Popover';
import { notificationService, type Notificacion } from '@/services/notificationService';
import { setUnread, useUnread } from '@/lib/unreadStore';
import { formatRelative } from '@/lib/format';
import { notificationVisual } from './notificationVisual';

const POLL_MS = 60_000;

/** Campana del header con badge numérico y menú de las últimas notificaciones (HU-2.5). */
export default function NotificationBell() {
  const router = useRouter();
  const unread = useUnread();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notificacion[] | null>(null);

  const refresh = useCallback(async () => {
    try {
      const page = await notificationService.list({ per_page: 6 });
      setItems(page.data);
      setUnread(page.meta.no_leidas);
    } catch {
      // La campana no bloquea la vista si falla; se reintenta en el siguiente ciclo.
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const timer = setInterval(refresh, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [refresh]);

  const openItem = async (item: Notificacion) => {
    setOpen(false);
    if (!item.leida) {
      setItems((list) => list?.map((n) => (n.id === item.id ? { ...n, leida: true } : n)) ?? null);
      notificationService.markRead(item.id).then(setUnread).catch(() => undefined);
    }
    if (item.incidencia) router.push(`/incidencia/${item.incidencia.id}`);
  };

  const markAll = async () => {
    setItems((list) => list?.map((n) => ({ ...n, leida: true })) ?? null);
    setUnread(await notificationService.markAll().catch(() => unread));
  };

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      className="w-[min(380px,calc(100vw-2rem))]"
      trigger={
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            if (!open) void refresh();
          }}
          aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : 'Notificaciones'}
          aria-expanded={open}
          className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-praxis-line bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                key={unread}
                className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white"
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              >
                {unread > 99 ? '99+' : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      }
    >
      <div className="flex items-center justify-between border-b border-praxis-line px-4 py-3">
        <p className="text-sm font-bold text-slate-900">
          Notificaciones {unread > 0 && <span className="text-slate-400">({unread})</span>}
        </p>
        {unread > 0 && (
          <button type="button" onClick={markAll} className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900">
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {items === null ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Cargando…</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <BellOff className="h-7 w-7 text-slate-300" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-700">Todo al día</p>
            <p className="text-xs text-slate-500">Te avisaremos cuando cambie el estado de tus solicitudes.</p>
          </div>
        ) : (
          <ul>
            {items.map((item) => {
              const visual = notificationVisual(item.tipo);
              const Icon = visual.icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${item.leida ? '' : 'bg-sky-50/40'}`}
                  >
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${visual.tone}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={`line-clamp-2 text-[13px] leading-snug ${item.leida ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>{item.titulo}</span>
                        {!item.leida && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" aria-label="Sin leer" />}
                      </span>
                      <span className="mt-0.5 line-clamp-1 block text-xs text-slate-500">{item.mensaje}</span>
                      <span className="mt-1 block text-[11px] text-slate-400">{formatRelative(item.fecha_envio)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Link href="/notificaciones" onClick={() => setOpen(false)} className="block border-t border-praxis-line px-4 py-3 text-center text-xs font-semibold text-sky-700 hover:bg-slate-50">
        Ver todas las notificaciones
      </Link>
    </Popover>
  );
}
