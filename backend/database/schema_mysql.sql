-- ==========================================================
-- GESTIÓN DE CASOS / SUPPORT DESK - ESQUEMA NATIVO MYSQL 8.0+
-- ==========================================================

CREATE DATABASE IF NOT EXISTS support_desk_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE support_desk_db;

-- 1. Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('ADMIN', 'AGENTE', 'CONSULTA') NOT NULL DEFAULT 'AGENTE',
  estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  avatar_url VARCHAR(255) NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Tabla: clientes
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL UNIQUE,
  nit VARCHAR(50) NULL,
  contacto_principal VARCHAR(150) NULL,
  correo_contacto VARCHAR(150) NULL,
  telefono VARCHAR(50) NULL,
  estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Tabla: plataformas
CREATE TABLE IF NOT EXISTS plataformas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  color_badge VARCHAR(50) DEFAULT '#0945F7',
  estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Tabla: agentes
CREATE TABLE IF NOT EXISTS agentes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL UNIQUE,
  email VARCHAR(150) NULL,
  telefono VARCHAR(50) NULL,
  especialidad VARCHAR(100) NULL,
  estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Tabla: tickets
CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prioridad ENUM('BAJO', 'MEDIO', 'ALTO', 'CRITICO') NOT NULL DEFAULT 'MEDIO',
  cliente_id INT NOT NULL,
  asunto VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  plataforma_id INT NOT NULL,
  solicitante VARCHAR(150) NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  servicenow VARCHAR(50) NULL,
  turno ENUM('NA', 'T1', 'T2', 'T4', 'TD', 'TN') NOT NULL DEFAULT 'NA',
  agente_id INT NOT NULL,
  estado ENUM('ABIERTO', 'EN PROCESO', 'PENDIENTE', 'RESUELTO', 'CERRADO') NOT NULL DEFAULT 'ABIERTO',
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  fecha_cierre DATETIME NULL,
  tiempo_atencion_minutos INT NULL,
  INDEX idx_estado (estado),
  INDEX idx_prioridad (prioridad),
  INDEX idx_cliente (cliente_id),
  INDEX idx_plataforma (plataforma_id),
  INDEX idx_agente (agente_id),
  INDEX idx_turno (turno),
  INDEX idx_fecha_creacion (fecha_creacion),
  INDEX idx_servicenow (servicenow),
  CONSTRAINT fk_ticket_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON UPDATE CASCADE,
  CONSTRAINT fk_ticket_plataforma FOREIGN KEY (plataforma_id) REFERENCES plataformas(id) ON UPDATE CASCADE,
  CONSTRAINT fk_ticket_agente FOREIGN KEY (agente_id) REFERENCES agentes(id) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6. Tabla: historial_ticket
CREATE TABLE IF NOT EXISTS historial_ticket (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  usuario_nombre VARCHAR(150) NOT NULL,
  accion VARCHAR(100) NOT NULL,
  descripcion TEXT NOT NULL,
  valor_anterior TEXT NULL,
  valor_nuevo TEXT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_historial_ticket (ticket_id),
  CONSTRAINT fk_historial_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Tabla: configuracion
CREATE TABLE IF NOT EXISTS configuracion (
  clave VARCHAR(100) PRIMARY KEY,
  valor TEXT NOT NULL,
  descripcion VARCHAR(255) NULL,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
