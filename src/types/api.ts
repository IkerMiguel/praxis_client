/** Colección paginada estándar de Laravel (data + links + meta). */
export interface Paginated<T, Extra = object> {
  data: T[];
  links?: { first: string | null; last: string | null; prev: string | null; next: string | null };
  meta: {
    current_page: number;
    last_page: number;
    per_page?: number;
    total: number;
    from?: number | null;
    to?: number | null;
  } & Extra;
}

export interface Ref {
  id: number;
  codigo?: string;
  nombre: string;
}

export interface EstadoRef {
  codigo: string;
  nombre: string;
  color?: string | null;
  requiere_accion_reportante?: boolean;
}

export interface PrioridadRef {
  id?: number;
  codigo: string;
  nombre: string;
  color?: string | null;
}

export interface Ubicacion {
  sede: Ref | null;
  edificio: Ref | null;
  piso: Ref | null;
  espacio: Ref | null;
  texto: string;
}

/** Fila de listado de incidencias (IncidenciaResumenResource). */
export interface IncidenciaResumen {
  id: string;
  codigo_ticket: string;
  resumen: string;
  estado: EstadoRef;
  prioridad?: PrioridadRef | null;
  categoria?: Ref;
  ubicacion?: Ubicacion;
  tecnico_asignado?: { id: number; name: string } | null;
  es_riesgo_inmediato: boolean;
  posible_duplicado: boolean;
  fecha_registro: string;
  fecha_actualizacion: string;
  fecha_cierre: string | null;
}
