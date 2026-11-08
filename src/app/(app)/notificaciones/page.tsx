import type { Metadata } from 'next';
import NotificationsView from '@/components/notifications/NotificationsView';

export const instant = false;

export const metadata: Metadata = { title: 'Notificaciones | PRAXIS' };

export default function Page() {
  return <NotificationsView />;
}
