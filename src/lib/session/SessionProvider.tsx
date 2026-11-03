"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { authService } from '@/services/authService';
import { onSessionChange, setActiveRoleHeader } from '@/services/api';
import type { MenuItem, Profile, RoleCode, SessionResponse } from '@/types/auth';

type Status = 'idle' | 'loading' | 'authenticated' | 'anonymous';

interface SessionContextValue {
  status: Status;
  profile: Profile | null;
  menu: MenuItem[];
  activeRole: RoleCode | null;
  /** true cuando el usuario cerró sesión a propósito (no por vencimiento). */
  signedOut: boolean;
  /** Recupera la sesión desde la cookie de refresh si todavía no hay una en memoria. */
  ensureSession: () => Promise<boolean>;
  /** Guarda la sesión recién iniciada en el login. */
  startSession: (session: SessionResponse) => Promise<void>;
  /** Cambia el rol activo y recarga perfil y menú según la matriz D09. */
  switchRole: (role: RoleCode) => Promise<Profile>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);
const ROLE_STORAGE_KEY = 'praxis.rol-activo';

function readStoredRole(): RoleCode | null {
  try {
    return (sessionStorage.getItem(ROLE_STORAGE_KEY) as RoleCode | null) ?? null;
  } catch {
    return null;
  }
}

function storeRole(role: RoleCode | null): void {
  try {
    if (role) sessionStorage.setItem(ROLE_STORAGE_KEY, role);
    else sessionStorage.removeItem(ROLE_STORAGE_KEY);
  } catch {
    // Sin almacenamiento disponible: el rol vuelve al predeterminado al recargar.
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('idle');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [activeRole, setActiveRole] = useState<RoleCode | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const pending = useRef<Promise<boolean> | null>(null);

  /** Aplica el rol preferido si el usuario lo tiene; si no, el que indique el backend. */
  const hydrate = useCallback(async (base: Profile) => {
    const stored = readStoredRole();
    const preferred = stored && base.roles.some((r) => r.codigo === stored) ? stored : base.rol_activo?.codigo ?? null;

    setActiveRoleHeader(preferred);
    const current = preferred && preferred !== base.rol_activo?.codigo ? await authService.me() : base;
    const items = await authService.menu();

    storeRole(current.rol_activo?.codigo ?? null);
    setProfile(current);
    setActiveRole(current.rol_activo?.codigo ?? null);
    setMenu(items);
    setStatus('authenticated');
    return current;
  }, []);

  const ensureSession = useCallback(async () => {
    if (status === 'authenticated') return true;
    if (pending.current) return pending.current;

    setStatus('loading');
    pending.current = authService
      .restore()
      .then(async ({ usuario }) => {
        await hydrate(usuario);
        return true;
      })
      .catch(() => {
        setStatus('anonymous');
        return false;
      })
      .finally(() => {
        pending.current = null;
      });

    return pending.current;
  }, [status, hydrate]);

  const startSession = useCallback(
    async (session: SessionResponse) => {
      storeRole(null);
      setSignedOut(false);
      await hydrate(session.usuario);
    },
    [hydrate],
  );

  const switchRole = useCallback(async (role: RoleCode) => {
    setActiveRoleHeader(role);
    const [current, items] = await Promise.all([authService.me(), authService.menu()]);
    storeRole(role);
    setProfile(current);
    setActiveRole(role);
    setMenu(items);
    return current;
  }, []);

  const signOut = useCallback(async () => {
    setSignedOut(true);
    try {
      await authService.logout();
    } finally {
      storeRole(null);
      setActiveRoleHeader(null);
      setProfile(null);
      setMenu([]);
      setActiveRole(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(
    () =>
      onSessionChange((event) => {
        if (event.type === 'expired') {
          setStatus('anonymous');
          setProfile(null);
        }
      }),
    [],
  );

  const value = useMemo(
    () => ({ status, profile, menu, activeRole, signedOut, ensureSession, startSession, switchRole, signOut }),
    [status, profile, menu, activeRole, signedOut, ensureSession, startSession, switchRole, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession debe usarse dentro de <SessionProvider>.');
  return context;
}

/** Nivel de acceso del rol activo a un módulo de la matriz D09, o null si no lo tiene. */
export function useModuleAccess(codigo: string) {
  const { menu, profile } = useSession();
  return (
    menu.find((item) => item.codigo === codigo)?.nivel_acceso ??
    profile?.permisos.find((p) => p.modulo === codigo)?.nivel_acceso ??
    null
  );
}
