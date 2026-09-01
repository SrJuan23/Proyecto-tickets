import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

export interface QueryResult {
  lastInsertRowid?: number | bigint;
  changes?: number;
}

class DatabaseService {
  private pgPool: Pool | null = null;

  public async initialize(): Promise<void> {
    const connectionString = process.env.DATABASE_URL || '';

    this.pgPool = new Pool({
      connectionString: connectionString,
      max: 10
    });

    console.log('[DB] Conectado exitosamente a PostgreSQL');
    await this.initSchema();
  }

  private async initSchema(): Promise<void> {
    const schemaSql = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        rol VARCHAR(50) NOT NULL DEFAULT 'AGENTE',
        estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
        password_change_required BOOLEAN NOT NULL DEFAULT TRUE,
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

    await this.pgPool!.query(schemaSql);
    console.log('[DB] Schema PostgreSQL inicializado correctamente');
    await this.migratePasswordChangeRequired();
  }

  private async migratePasswordChangeRequired(): Promise<void> {
    try {
      if (!this.pgPool) return;
      await this.pgPool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_change_required BOOLEAN NOT NULL DEFAULT TRUE;`);
      console.log('[DB] Migración aplicada: password_change_required en usuarios.');
    } catch (err) {
      console.error('[DB] Error en migración de password_change_required:', err);
    }
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const res = await this.pgPool!.query(this.toPostgresSql(sql, params), params);
    return res.rows as T[];
  }

  public async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const res = await this.pgPool!.query(this.toPostgresSql(sql, params), params);
    return (res.rows[0] as T) || null;
  }

  public async run(sql: string, params: any[] = []): Promise<QueryResult> {
    const res = await this.pgPool!.query(this.toPostgresSql(sql, params), params);
    return {
      lastInsertRowid: res.oid ? Number(res.oid) : (res.rowCount || 0),
      changes: res.rowCount || 0
    };
  }

  private toPostgresSql(sql: string, params: any[]): string {
    let parameterIndex = 0;
    return sql.replace(/\?/g, () => `$${++parameterIndex}`);
  }

  public async close(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
    }
  }
}

export const db = new DatabaseService();
