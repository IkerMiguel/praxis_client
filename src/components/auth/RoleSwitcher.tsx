"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Repeat } from 'lucide-react';
import { useSession } from '@/lib/session/SessionProvider';
import { apiErrorMessage } from '@/lib/apiError';
import FullscreenLoader from '@/components/ui/FullscreenLoader';
import type { RoleCode } from '@/types/auth';

/** Cambio de rol activo para usuarios multi-rol (HU-1.3). */
export default function RoleSwitcher({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const { profile, activeRole, switchRole } = useSession();
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState('');

  if (!profile || profile.roles.length < 2) return null;

  const choose = async (role: RoleCode) => {
    if (role === activeRole) return;
    setSwitching(true);
    setError('');
    try {
      const current = await switchRole(role);
      onDone?.();
      router.push(current.ruta_inicio ?? '/panel');
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo cambiar de rol.'));
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="space-y-1.5">
      {switching && <FullscreenLoader label="Cambiando de rol" />}
      <p className="flex items-center gap-2 px-3 pt-1 text-[11px] font-semibold text-slate-500">
        <Repeat className="h-3.5 w-3.5" aria-hidden="true" />
        Actuar como
      </p>
      <ul role="listbox" aria-label="Rol activo" className="space-y-0.5">
        {profile.roles.map((role) => {
          const selected = role.codigo === activeRole;
          return (
            <li key={role.codigo}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => choose(role.codigo)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                  selected ? 'bg-sky-50 font-semibold text-sky-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{role.nombre}</span>
                {selected && <Check className="h-4 w-4 text-sky-700" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>
      {error && <p className="px-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}
