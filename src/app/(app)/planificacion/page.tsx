import type { Metadata } from 'next';
import PlanningBoardView from '@/components/ops/PlanningBoardView';
import RequireModule from '@/lib/session/RequireModule';

export const instant = false;

export const metadata: Metadata = { title: 'Planificación | PRAXIS' };

export default function Page() {
  return (
    <RequireModule modules={['PLANIFICACION']}>
      <PlanningBoardView />
    </RequireModule>
  );
}
