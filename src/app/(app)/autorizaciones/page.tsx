import type { Metadata } from 'next';
import AuthorizationsView from '@/components/ops/AuthorizationsView';
import RequireModule from '@/lib/session/RequireModule';

export const instant = false;

export const metadata: Metadata = { title: 'Autorizaciones | PRAXIS' };

export default function Page() {
  return (
    <RequireModule modules={['AUTORIZACIONES']}>
      <AuthorizationsView />
    </RequireModule>
  );
}
