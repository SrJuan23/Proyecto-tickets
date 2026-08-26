-- ==========================================================
-- GESTIÓN DE CASOS / SUPPORT DESK - ESQUEMA DE BASE DE DATOS
-- Compatible con MySQL 8.0+ y SQLite
-- ==========================================================

-- 1. Tabla: usuarios (Autenticación y roles)
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL DEFAULT 'AGENTE', -- 'ADMIN', 'AGENTE', 'CONSULTA'
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO', -- 'ACTIVO', 'INACTIVO'
  avatar_url VARCHAR(255) NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla: clientes (Empresas u organizaciones solicitantes)
CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre VARCHAR(200) NOT NULL UNIQUE,
  nit VARCHAR(50) NULL,
  contacto_principal VARCHAR(150) NULL,
  correo_contacto VARCHAR(150) NULL,
  telefono VARCHAR(50) NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO', -- 'ACTIVO', 'INACTIVO'
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla: plataformas (Tecnologías de soporte)
CREATE TABLE IF NOT EXISTS plataformas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  color_badge VARCHAR(50) DEFAULT '#0945F7',
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO', -- 'ACTIVO', 'INACTIVO'
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- 5. Tabla: tickets (Registro principal de casos de soporte)
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prioridad VARCHAR(20) NOT NULL DEFAULT 'MEDIO', -- 'BAJO', 'MEDIO', 'ALTO', 'CRITICO'
  cliente_id INTEGER NOT NULL,
  asunto VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  plataforma_id INTEGER NOT NULL,
  solicitante VARCHAR(150) NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  servicenow VARCHAR(50) NULL,
  turno VARCHAR(10) NOT NULL DEFAULT 'NA', -- 'NA', 'T1', 'T2', 'T4', 'TD', 'TN'
  agente_id INTEGER NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTO', -- 'ABIERTO', 'EN PROCESO', 'PENDIENTE', 'RESUELTO', 'CERRADO'
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre DATETIME NULL,
  tiempo_atencion_minutos INTEGER NULL,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (plataforma_id) REFERENCES plataformas(id),
  FOREIGN KEY (agente_id) REFERENCES usuarios(id)
);

-- 6. Tabla: historial_ticket (Trazabilidad y auditoría de eventos)
CREATE TABLE IF NOT EXISTS historial_ticket (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  usuario_nombre VARCHAR(150) NOT NULL,
  accion VARCHAR(100) NOT NULL, -- 'CREACION', 'CAMBIO_ESTADO', 'CAMBIO_AGENTE', 'EDICION', 'COMENTARIO'
  descripcion TEXT NOT NULL,
  valor_anterior TEXT NULL,
  valor_nuevo TEXT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- 7. Tabla: configuracion (Parámetros del sistema)
CREATE TABLE IF NOT EXISTS configuracion (
  clave VARCHAR(100) PRIMARY KEY,
  valor TEXT NOT NULL,
  descripcion VARCHAR(255) NULL,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización de búsqueda y filtros
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_prioridad ON tickets(prioridad);
CREATE INDEX IF NOT EXISTS idx_tickets_cliente ON tickets(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tickets_plataforma ON tickets(plataforma_id);
CREATE INDEX IF NOT EXISTS idx_tickets_agente ON tickets(agente_id);
CREATE INDEX IF NOT EXISTS idx_tickets_turno ON tickets(turno);
CREATE INDEX IF NOT EXISTS idx_tickets_fecha_creacion ON tickets(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_tickets_servicenow ON tickets(servicenow);
CREATE INDEX IF NOT EXISTS idx_historial_ticket ON historial_ticket(ticket_id);
