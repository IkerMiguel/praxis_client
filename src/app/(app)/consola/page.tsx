import type { Metadata } from 'next';
import ConsoleView from '@/components/console/ConsoleView';
import RequireModule from '@/lib/session/RequireModule';

export const instant = false;

export const metadata: Metadata = { title: 'Consola de incidencias | PRAXIS' };

export default function Page() {
  return (
    <RequireModule modules={['CONSOLA']}>
      <ConsoleView />
    </RequireModule>
  );
}
