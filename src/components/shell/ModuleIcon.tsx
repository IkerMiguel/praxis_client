import {
  BarChart3,
  Calendar,
  CheckCircle2,
  CircleHelp,
  Clock,
  House,
  Inbox,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  Settings,
  ShieldCheck,
  Table2,
  Tag,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

/** Íconos que devuelve /navegacion/menu (nombres de Lucide) mapeados a componentes. */
const ICONS: Record<string, LucideIcon> = {
  home: House,
  plus: Plus,
  list: List,
  inbox: Inbox,
  calendar: Calendar,
  wrench: Wrench,
  'check-circle': CheckCircle2,
  'shield-check': ShieldCheck,
  table: Table2,
  clock: Clock,
  'bar-chart': BarChart3,
  users: Users,
  'map-pin': MapPin,
  tag: Tag,
  settings: Settings,
  'help-circle': CircleHelp,
};

export function moduleIcon(name?: string | null): LucideIcon {
  return (name && ICONS[name]) || LayoutGrid;
}

/** Descripción corta de cada módulo para el menú desplegable "Módulos". */
export const MODULE_HINTS: Record<string, string> = {
  PANEL: 'Resumen de tus solicitudes',
  NUEVO_REPORTE: 'Radica una falla locativa',
  MIS_SOLICITUDES: 'Seguimiento de lo que reportaste',
  TRIAJE: 'Revisión, duplicados y prioridad',
  PLANIFICACION: 'Asignación y programación',
  MIS_TAREAS: 'Inspección y ejecución en sitio',
  AUTORIZACIONES: 'Dictamen de recursos',
  VERIFICACION: 'Control de calidad y cierre',
  CONSOLA: 'Todas las incidencias con filtros',
  PLAZOS: 'Semáforo de SLA',
  INDICADORES: 'MTTR, cumplimiento y recurrencia',
  ADMIN_USUARIOS: 'Cuentas, roles y especialidades',
  ADMIN_UBICACIONES: 'Sedes, edificios, pisos y espacios',
  ADMIN_CATEGORIAS: 'Taxonomía de daños y reglas',
  ADMIN_PARAMETROS: 'Matriz de prioridad y SLA',
  AYUDA: 'Guía y preguntas frecuentes',
};
