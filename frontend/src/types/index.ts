export type RolUsuario = 'ADMIN' | 'AGENTE' | 'CONSULTA';
export type EstadoEntidad = 'ACTIVO' | 'INACTIVO';
export type PrioridadTicket = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
export type EstadoTicket = 'ABIERTO' | 'EN PROCESO' | 'PENDIENTE' | 'RESUELTO' | 'CERRADO';
export type TurnoTicket = 'NA' | 'T1' | 'T2' | 'T4' | 'TD' | 'TN';

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  estado: EstadoEntidad;
  password_change_required?: boolean;
  telefono?: string;
  especialidad?: string;
  avatar_url?: string;
  fecha_creacion: string;
}

export interface Agent extends User {
  total_casos?: number;
  casos_abiertos?: number;
  casos_cerrados?: number;
}

export interface Client {
  id: number;
  nombre: string;
  nit?: string;
  contacto_principal?: string;
  correo_contacto?: string;
  telefono?: string;
  estado: EstadoEntidad;
  fecha_creacion: string;
  total_casos?: number;
  casos_abiertos?: number;
  casos_en_proceso?: number;
  casos_cerrados?: number;
}

export interface Platform {
  id: number;
  nombre: string;
  descripcion?: string;
  color_badge?: string;
  estado: EstadoEntidad;
  fecha_creacion: string;
  total_casos?: number;
  casos_abiertos?: number;
  casos_cerrados?: number;
  casos_alta_prioridad?: number;
}

export interface TicketHistory {
  id: number;
  ticket_id: number;
  usuario_nombre: string;
  accion: 'CREACION' | 'CAMBIO_ESTADO' | 'EDICION' | 'COMENTARIO' | 'CAMBIO_PRIORIDAD';
  descripcion: string;
  valor_anterior?: string;
  valor_nuevo?: string;
  fecha: string;
}

export interface Ticket {
  id: number;
  prioridad: PrioridadTicket;
  cliente_id: number;
  cliente_nombre?: string;
  cliente_nit?: string;
  cliente_contacto?: string;
  cliente_correo?: string;
  asunto: string;
  descripcion: string;
  plataforma_id: number;
  plataforma_nombre?: string;
  plataforma_color?: string;
  plataforma_descripcion?: string;
  solicitante: string;
  fecha_creacion: string;
  servicenow?: string;
  turno: TurnoTicket;
  agente_id: number;
  agente_nombre?: string;
  agente_email?: string;
  estado: EstadoTicket;
  fecha_actualizacion: string;
  fecha_cierre?: string;
  tiempo_atencion_minutos?: number;
  tiempo_atencion_formateado?: string;
  historial?: TicketHistory[];
  servicenow_full_url?: string;
}

export interface TicketFilters {
  search?: string;
  prioridad?: string;
  cliente_id?: string;
  plataforma_id?: string;
  agente_id?: string;
  turno?: string;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  sort_by?: string;
  sort_direction?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardKPIs {
  total_casos: number;
  casos_abiertos: number;
  casos_en_proceso: number;
  casos_pendientes: number;
  casos_resueltos: number;
  casos_cerrados: number;
  casos_prioridad_alta: number;
  tiempo_promedio_resolucion_horas: number;
}

export interface ChartDataResponse {
  by_platform: Array<{ nombre: string; color_badge: string; cantidad: number }>;
  by_priority: Array<{ prioridad: string; cantidad: number }>;
  by_status: Array<{ estado: string; cantidad: number }>;
  by_agent: Array<{ nombre: string; cantidad: number }>;
  by_client: Array<{ nombre: string; cantidad: number }>;
  trend: Array<{ fecha: string; total: number; cerrados: number }>;
}
