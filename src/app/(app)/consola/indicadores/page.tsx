import type { Metadata } from 'next';
import IndicatorsView from '@/components/console/IndicatorsView';
import RequireModule from '@/lib/session/RequireModule';

export const instant = false;

export const metadata: Metadata = { title: 'Indicadores | PRAXIS' };

export default function Page() {
  return (
    <RequireModule modules={['INDICADORES']}>
      <IndicatorsView />
    </RequireModule>
  );
}
