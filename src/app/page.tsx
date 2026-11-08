import { redirect } from 'next/navigation';

// Solo redirige: no hay contenido que prerenderizar para la navegación instantánea.
export const instant = false;

export default function Home() {
  redirect('/auth/login');
}