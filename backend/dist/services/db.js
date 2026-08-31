"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
dotenv_1.default.config();
class DatabaseService {
    pgPool = null;
    async initialize() {
        const connectionString = process.env.DATABASE_URL || '';
        this.pgPool = new pg_1.Pool({
            connectionString: connectionString,
            max: 10
        });
        console.log('[DB] Conectado exitosamente a PostgreSQL');
        await this.initSchema();
    }
    async initSchema() {
        const schemaSql = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        rol VARCHAR(50) NOT NULL DEFAULT 'AGENTE',
        estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
        telefono VARCHAR(50) NULL,
        especialidad VARCHAR(100) NULL,
        avatar_url VARCHAR(255) NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(200) NOT NULL UNIQUE,
        nit VARCHAR(50) NULL,
        contacto_principal VARCHAR(150) NULL,
        correo_contacto VARCHAR(150) NULL,
        telefono VARCHAR(50) NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS plataformas (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        descripcion VARCHAR(255) NULL,
        color_badge VARCHAR(50) DEFAULT '#0945F7',
        estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        prioridad VARCHAR(20) NOT NULL DEFAULT 'MEDIO',
        cliente_id INTEGER NOT NULL REFERENCES clientes(id),
        asunto VARCHAR(255) NOT NULL,
        descripcion TEXT NOT NULL,
        plataforma_id INTEGER NOT NULL REFERENCES plataformas(id),
        solicitante VARCHAR(150) NOT NULL,
        fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        servicenow VARCHAR(50) NULL,
        turno VARCHAR(10) NOT NULL DEFAULT 'NA',
        agente_id INTEGER NULL REFERENCES usuarios(id),
        estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTO',
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_cierre TIMESTAMP NULL,
        tiempo_atencion_minutos INTEGER NULL
      );

      CREATE TABLE IF NOT EXISTS historial_ticket (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        usuario_nombre VARCHAR(150) NOT NULL,
        accion VARCHAR(100) NOT NULL,
        descripcion TEXT NOT NULL,
        valor_anterior TEXT NULL,
        valor_nuevo TEXT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS configuracion (
        clave VARCHAR(100) PRIMARY KEY,
        valor TEXT NOT NULL,
        descripcion VARCHAR(255) NULL,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);
      CREATE INDEX IF NOT EXISTS idx_tickets_prioridad ON tickets(prioridad);
      CREATE INDEX IF NOT EXISTS idx_tickets_cliente ON tickets(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_plataforma ON tickets(plataforma_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_agente ON tickets(agente_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_turno ON tickets(turno);
      CREATE INDEX IF NOT EXISTS idx_tickets_fecha_creacion ON tickets(fecha_creacion);
      CREATE INDEX IF NOT EXISTS idx_tickets_servicenow ON tickets(servicenow);
    `;
        await this.pgPool.query(schemaSql);
        console.log('[DB] Schema PostgreSQL inicializado correctamente');
    }
    async query(sql, params = []) {
        const res = await this.pgPool.query(this.toPostgresSql(sql, params), params);
        return res.rows;
    }
    async get(sql, params = []) {
        const res = await this.pgPool.query(this.toPostgresSql(sql, params), params);
        return res.rows[0] || null;
    }
    async run(sql, params = []) {
        const res = await this.pgPool.query(this.toPostgresSql(sql, params), params);
        return {
            lastInsertRowid: res.oid ? Number(res.oid) : (res.rowCount || 0),
            changes: res.rowCount || 0
        };
    }
    toPostgresSql(sql, params) {
        let parameterIndex = 0;
        return sql.replace(/\?/g, () => `$${++parameterIndex}`);
    }
    async close() {
        if (this.pgPool) {
            await this.pgPool.end();
        }
    }
}
exports.db = new DatabaseService();
