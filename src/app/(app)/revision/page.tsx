import type { Metadata } from 'next';
import TriageInboxView from '@/components/ops/TriageInboxView';
import RequireModule from '@/lib/session/RequireModule';

export const instant = false;

export const metadata: Metadata = { title: 'Bandeja de triaje | PRAXIS' };

export default function Page() {
  return (
    <RequireModule modules={['TRIAJE']}>
      <TriageInboxView />
    </RequireModule>
  );
}
