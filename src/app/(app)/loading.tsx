import { LoadingState } from '@/components/ui/States';

/** Transición entre vistas internas con el loader institucional. */
export default function Loading() {
  return <LoadingState label="Cargando vista" />;
}
