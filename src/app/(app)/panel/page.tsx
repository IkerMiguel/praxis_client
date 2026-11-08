import type { Metadata } from 'next';
import PanelView from '@/components/panel/PanelView';

export const instant = false;

export const metadata: Metadata = { title: 'Inicio | PRAXIS' };

export default function Page() {
  return <PanelView />;
}
