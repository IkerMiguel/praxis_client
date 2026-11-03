"use client";

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import FullscreenLoader from '@/components/ui/FullscreenLoader';
import { useSession } from './SessionProvider';

/**
 * Protege las vistas internas (HU-1.1): recupera la sesión desde la cookie de refresh y,
 * si no hay sesión, envía al login conservando la ruta pedida como deep-link.
 */
export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, ensureSession } = useSession();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (status === 'idle') void ensureSession();
    if (status === 'authenticated') wasAuthenticated.current = true;
    if (status === 'anonymous') {
      const params = new URLSearchParams({ returnUrl: pathname });
      if (wasAuthenticated.current) params.set('sesion', 'expirada');
      router.replace(`/auth/login?${params.toString()}`);
    }
  }, [status, ensureSession, pathname, router]);

  if (status !== 'authenticated') return <FullscreenLoader label="Verificando sesión" />;

  return <>{children}</>;
}
