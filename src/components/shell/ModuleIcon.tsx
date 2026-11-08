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

/** Descripción algo más amplia que se muestra en el módulo actual del menú de módulos. */
export const MODULE_DETAILS: Record<string, string> = {
  PANEL: 'Tus solicitudes por estado y accesos a las más recientes.',
  NUEVO_REPORTE: 'Ubica el daño, descríbelo y adjunta fotos para radicarlo.',
  MIS_SOLICITUDES: 'Revisa el estado de tus reportes y responde lo que te pidan.',
  TRIAJE: 'Clasifica los reportes nuevos, descarta duplicados y fija prioridad.',
  PLANIFICACION: 'Asigna técnicos y programa la fecha de atención.',
  MIS_TAREAS: 'Registra inspección, diagnóstico y ejecución de tus órdenes.',
  AUTORIZACIONES: 'Aprueba o rechaza los recursos que piden los técnicos.',
  VERIFICACION: 'Compara el antes y el después y decide el cierre.',
  CONSOLA: 'Busca y filtra todas las incidencias del campus.',
  PLAZOS: 'Incidencias a tiempo, por vencer o vencidas según su plazo.',
  INDICADORES: 'Tiempo de reparación, cumplimiento y daños recurrentes.',
  ADMIN_USUARIOS: 'Crea cuentas y asigna roles y especialidades.',
  ADMIN_UBICACIONES: 'Sedes, edificios, pisos y espacios disponibles para reportar.',
  ADMIN_CATEGORIAS: 'Tipos de daño, especialidad que los atiende y fotos exigidas.',
  ADMIN_PARAMETROS: 'Matriz de prioridad y plazos de atención por prioridad.',
  AYUDA: 'Cómo reportar, qué significa cada estado y dudas frecuentes.',
};
