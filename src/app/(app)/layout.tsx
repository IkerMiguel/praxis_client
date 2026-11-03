import { Suspense, type ReactNode } from 'react';
import AppShell from '@/components/shell/AppShell';
import FullscreenLoader from '@/components/ui/FullscreenLoader';

// El contenido depende de la sesión del navegador: no aplica la validación de navegación instantánea.
export const instant = false;

/**
 * Vistas internas. La sesión vive en el navegador (cookie de refresh + token en memoria) y el shell
 * lee la URL, así que todo el contenido autenticado se transmite detrás de este Suspense.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<FullscreenLoader label="Cargando" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
