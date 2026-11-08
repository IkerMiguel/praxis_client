"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, CircleHelp, LogOut, Mail, Wrench } from 'lucide-react';
import Popover from '@/components/ui/Popover';
import FullscreenLoader from '@/components/ui/FullscreenLoader';
import RoleSwitcher from '@/components/auth/RoleSwitcher';
import { useSession } from '@/lib/session/SessionProvider';
import { confirmAction } from '@/components/ui/ConfirmDialog';
import { initials } from '@/lib/format';

export default function UserMenu() {
  const { profile, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  if (!profile) return null;

  const logout = async () => {
    setOpen(false);
    const ok = await confirmAction({
      tone: 'primary',
      icon: 'logout',
      title: '¿Cerrar sesión?',
      description: 'Tendrás que volver a ingresar con tu correo institucional para seguir usando PRAXIS.',
      confirmLabel: 'Cerrar sesión',
    });
    if (!ok) return;
    setLeaving(true);
    await signOut().catch(() => undefined);
  };

  return (
    <>
      {leaving && <FullscreenLoader label="Cerrando sesión" />}
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        // Mismo ancho que el botón del usuario; en móvil el botón solo muestra el avatar y el panel usa un ancho fijo.
        className="w-64 sm:left-0 sm:w-auto"
        trigger={
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="flex items-center gap-3 rounded-2xl border border-praxis-line bg-white py-1.5 pl-1.5 pr-3 text-left transition hover:border-slate-300"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-praxis-blue to-praxis-green text-xs font-bold text-white">
              {initials(profile.nombre)}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-[150px] truncate text-[13px] font-bold leading-tight text-slate-900">{profile.nombre}</span>
              <span className="block max-w-[150px] truncate text-[11px] text-slate-500">{profile.rol_activo?.nombre}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        }
      >
        <div className="border-b border-praxis-line bg-gradient-to-br from-slate-50 to-white px-4 py-3.5">
          <p className="truncate text-sm font-bold text-slate-900">{profile.nombre}</p>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-slate-500" title={profile.email}>
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{profile.email}</span>
          </p>
          {profile.especialidades.length > 0 && (
            <p className="mt-2 flex flex-wrap items-center gap-1">
              <Wrench className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              {profile.especialidades.map((e) => (
                <span key={e.nombre} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  {e.nombre}
                </span>
              ))}
            </p>
          )}
        </div>

        {profile.roles.length > 1 && (
          <div className="border-b border-praxis-line p-2">
            <RoleSwitcher onDone={() => setOpen(false)} />
          </div>
        )}

        <div className="p-2">
          <Link href="/ayuda" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <CircleHelp className="h-4 w-4 text-slate-400" aria-hidden="true" />
            Centro de ayuda
          </Link>
          <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </Popover>
    </>
  );
}
