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

/** Descripción ampliada que se muestra en el módulo actual del menú de módulos. */
export const MODULE_DETAILS: Record<string, string> = {
  PANEL: 'Ve cuántas solicitudes tienes en revisión, en atención o esperando tu respuesta, y entra rápido a las más recientes.',
  NUEVO_REPORTE: 'Indica dónde está el daño, de qué tipo es y adjunta fotos. Al enviarlo recibes un código de ticket para seguirlo.',
  MIS_SOLICITUDES: 'Consulta el estado de cada reporte, responde aclaraciones, confirma las reparaciones y sigue los reportes de otros.',
  TRIAJE: 'Revisa los reportes nuevos, descarta duplicados, define la prioridad y pide aclaraciones antes de pasarlos a planificación.',
  PLANIFICACION: 'Asigna cada incidencia a un técnico de la especialidad y programa la fecha de atención según la prioridad.',
  MIS_TAREAS: 'Revisa las órdenes que tienes asignadas, registra la inspección y el diagnóstico, y documenta la ejecución con evidencias.',
  AUTORIZACIONES: 'Aprueba o rechaza las solicitudes de materiales y recursos que los técnicos necesitan para reparar.',
  VERIFICACION: 'Compara el antes y el después de cada reparación y decide si cumple la calidad para cerrarla.',
  CONSOLA: 'Busca y filtra todas las incidencias del campus por estado, prioridad, sede, categoría o responsable.',
  PLAZOS: 'Mira qué incidencias están a tiempo, por vencer o vencidas frente al plazo acordado para su prioridad.',
  INDICADORES: 'Mide el tiempo medio de reparación, el cumplimiento de plazos y los daños que más se repiten.',
  ADMIN_USUARIOS: 'Crea cuentas, asigna roles y especialidades, y activa o desactiva el acceso de las personas.',
  ADMIN_UBICACIONES: 'Administra las sedes, edificios, pisos y espacios que se pueden elegir al reportar un daño.',
  ADMIN_CATEGORIAS: 'Define las categorías y subcategorías de daño, la especialidad que las atiende y si exigen foto.',
  ADMIN_PARAMETROS: 'Ajusta la matriz de prioridad por impacto y urgencia, y los plazos de atención de cada prioridad.',
  AYUDA: 'Aprende a reportar en tres pasos, revisa qué significa cada estado y encuentra respuestas a las dudas frecuentes.',
};
