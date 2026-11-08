import type { Metadata } from 'next';
import MyTasksView from '@/components/ops/MyTasksView';
import RequireModule from '@/lib/session/RequireModule';

export const instant = false;

export const metadata: Metadata = { title: 'Mis tareas | PRAXIS' };

export default function Page() {
  return (
    <RequireModule modules={['MIS_TAREAS']}>
      <MyTasksView />
    </RequireModule>
  );
}
