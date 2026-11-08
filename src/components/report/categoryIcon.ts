import { createElement } from 'react';
import { Armchair, BrickWall, Droplets, KeyRound, Paintbrush, Server, Snowflake, Waves, Wrench, Zap, Building2, type LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  ELECTRICA: Zap,
  HIDROSANITARIA: Droplets,
  FUGA_HIDRAULICA_MAYOR: Waves,
  ESTRUCTURAL_TECHOS: Building2,
  MAMPOSTERIA: BrickWall,
  CERRAJERIA: KeyRound,
  CLIMATIZACION: Snowflake,
  MOBILIARIO: Armchair,
  PINTURA: Paintbrush,
  CUARTO_TECNICO: Server,
};

/** Ícono por código de categoría de daño; las categorías nuevas usan una llave genérica. */
export function categoryIcon(codigo?: string | null): LucideIcon {
  return (codigo && ICONS[codigo]) || Wrench;
}

/** Ícono de categoría como componente estable (evita crear componentes durante el render). */
export function CategoryIcon({ codigo, className }: { codigo?: string | null; className?: string }) {
  return createElement(categoryIcon(codigo), { className, 'aria-hidden': true });
}
