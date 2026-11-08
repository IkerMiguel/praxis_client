import type { Metadata } from 'next';
import HelpView from '@/components/help/HelpView';

export const instant = false;

export const metadata: Metadata = { title: 'Centro de ayuda | PRAXIS' };

export default function Page() {
  return <HelpView />;
}
