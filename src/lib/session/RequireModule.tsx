"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import type { AccessLevel } from '@/types/auth';
import { useSession } from './SessionProvider';

interface RequireModuleProps {
  /** Códigos de módulo D09; basta con que el rol activo tenga uno. */
  modules: string[];
  children: ReactNode | ((access: AccessLevel) => ReactNode);
}

const RANK: Record<AccessLevel, number> = { TOTAL: 3, ASIGNADAS: 2, LECTURA: 1 };

/** Muestra la vista solo si el rol activo tiene acceso a alguno de los módulos (RoleGuard, HU-1.3). */
export default function RequireModule({ modules, children }: RequireModuleProps) {
  const { menu, profile, activeRole } = useSession();

  const levels = modules
    .map((code) => menu.find((item) => item.codigo === code)?.nivel_acceso ?? profile?.permisos.find((p) => p.modulo === code)?.nivel_acceso)
    .filter((level): level is AccessLevel => Boolean(level));

  if (levels.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <ShieldAlert className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-bold text-slate-900">Esta sección no está disponible para tu rol</h1>
        <p className="text-sm leading-relaxed text-slate-500">
          Con el rol {profile?.rol_activo?.nombre ?? activeRole} no tienes acceso a esta vista. Si tienes otro rol asignado, cámbialo desde tu perfil.
        </p>
        <Link href={profile?.ruta_inicio ?? '/panel'} className="rounded-xl bg-[#0B1B3A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#13274f]">
          Ir a mi inicio
        </Link>
      </div>
    );
  }

  const best = levels.sort((a, b) => RANK[b] - RANK[a])[0];
  return <>{typeof children === 'function' ? children(best) : children}</>;
}
