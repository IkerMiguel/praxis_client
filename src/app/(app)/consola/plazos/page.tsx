import type { Metadata } from 'next';
import DeadlinesView from '@/components/console/DeadlinesView';
import RequireModule from '@/lib/session/RequireModule';

export const instant = false;

export const metadata: Metadata = { title: 'Plazos SLA | PRAXIS' };

export default function Page() {
  return (
    <RequireModule modules={['PLAZOS']}>
      <DeadlinesView />
    </RequireModule>
  );
}
