// Tipos y Modelos de Soporte / Service Desk

export type RolUsuario = 'ADMIN' | 'AGENTE' | 'CONSULTA';
export type EstadoEntidad = 'ACTIVO' | 'INACTIVO';
export type PrioridadTicket = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
export type EstadoTicket = 'ABIERTO' | 'EN PROCESO' | 'PENDIENTE' | 'RESUELTO' | 'CERRADO';
export type TurnoTicket = 'NA' | 'T1' | 'T2' | 'T4' | 'TD' | 'TN';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  password_hash?: string;
  rol: RolUsuario;
  estado: EstadoEntidad;
  avatar_url?: string;
  fecha_creacion: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  nit?: string;
  contacto_principal?: string;
  correo_contacto?: string;
  telefono?: string;
  estado: EstadoEntidad;
  fecha_creacion: string;
  // Campos calculados
  total_casos?: number;
  casos_abiertos?: number;
  casos_en_proceso?: number;
  casos_cerrados?: number;
}

export interface Plataforma {
  id: number;
  nombre: string;
  descripcion?: string;
  color_badge?: string;
  estado: EstadoEntidad;
  fecha_creacion: string;
  // Campos calculados
  total_casos?: number;
  casos_abiertos?: number;
  casos_cerrados?: number;
  casos_alta_prioridad?: number;
}

export interface Agente {
  id: number;
  nombre: string;
  email?: string;
  telefono?: string;
  especialidad?: string;
  estado: EstadoEntidad;
  fecha_creacion: string;
  // Campos calculados
  total_casos?: number;
  casos_abiertos?: number;
  casos_cerrados?: number;
}

export interface Ticket {
  id: number;
  prioridad: PrioridadTicket;
  cliente_id: number;
  cliente_nombre?: string;
  asunto: string;
  descripcion: string;
  plataforma_id: number;
  plataforma_nombre?: string;
  plataforma_color?: string;
  solicitante: string;
  fecha_creacion: string;
  servicenow?: string;
  turno: TurnoTicket;
  agente_id: number;
  agente_nombre?: string;
  estado: EstadoTicket;
  fecha_actualizacion: string;
  fecha_cierre?: string;
  tiempo_atencion_minutos?: number;
  tiempo_atencion_formateado?: string;
}

export interface HistorialTicket {
  id: number;
  ticket_id: number;
  usuario_nombre: string;
  accion: 'CREACION' | 'CAMBIO_ESTADO' | 'CAMBIO_AGENTE' | 'EDICION' | 'COMENTARIO' | 'CAMBIO_PRIORIDAD';
  descripcion: string;
  valor_anterior?: string;
  valor_nuevo?: string;
  fecha: string;
}

export interface Configuracion {
  clave: string;
  valor: string;
  descripcion?: string;
  fecha_actualizacion?: string;
}

export interface FiltrosTickets {
  search?: string;
  prioridad?: string;
  cliente_id?: number | string;
  plataforma_id?: number | string;
  agente_id?: number | string;
  turno?: string;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  sort_by?: string;
  sort_direction?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
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
