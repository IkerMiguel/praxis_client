import type { Metadata } from 'next';
import VerificationQueueView from '@/components/ops/VerificationQueueView';
import RequireModule from '@/lib/session/RequireModule';

export const instant = false;

export const metadata: Metadata = { title: 'Verificación | PRAXIS' };

export default function Page() {
  return (
    <RequireModule modules={['VERIFICACION']}>
      <VerificationQueueView />
    </RequireModule>
  );
}
