import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export interface QueryResult {
  lastInsertRowid?: number | bigint;
  changes?: number;
}

class DatabaseService {
  private sqliteDb: any = null;
  private mysqlPool: any = null;
  private isSqlite = true;

  constructor() {
    const client = process.env.DB_CLIENT || 'sqlite';
    this.isSqlite = client.toLowerCase() === 'sqlite';
  }

  public async initialize(): Promise<void> {
    if (this.isSqlite) {
      const Database = require('better-sqlite3');
      const dbPath = process.env.DB_SQLITE_PATH || path.join(__dirname, '../../database/support_desk.sqlite');
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.sqliteDb = new Database(dbPath);
      // Enable WAL mode and foreign keys for high reliability
      this.sqliteDb.pragma('journal_mode = WAL');
      this.sqliteDb.pragma('foreign_keys = ON');

      console.log(`[DB] Conectado exitosamente a SQLite: ${dbPath}`);
      this.initSqliteSchema();
    } else {
      const mysql = require('mysql2/promise');
      this.mysqlPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'support_desk_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        dateStrings: true,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined
      });

      console.log(`[DB] Conectado exitosamente al pool de MySQL: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    }
  }

  private initSqliteSchema(): void {
    const schemaSql = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        rol VARCHAR(50) NOT NULL DEFAULT 'AGENTE',
        estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
        avatar_url VARCHAR(255) NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(200) NOT NULL UNIQUE,
        nit VARCHAR(50) NULL,
        contacto_principal VARCHAR(150) NULL,
        correo_contacto VARCHAR(150) NULL,
        telefono VARCHAR(50) NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS plataformas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        descripcion VARCHAR(255) NULL,
        color_badge VARCHAR(50) DEFAULT '#0945F7',
        estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS agentes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(150) NOT NULL UNIQUE,
        email VARCHAR(150) NULL,
        telefono VARCHAR(50) NULL,
        especialidad VARCHAR(100) NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prioridad VARCHAR(20) NOT NULL DEFAULT 'MEDIO',
        cliente_id INTEGER NOT NULL,
        asunto VARCHAR(255) NOT NULL,
        descripcion TEXT NOT NULL,
        plataforma_id INTEGER NOT NULL,
        solicitante VARCHAR(150) NOT NULL,
        fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        servicenow VARCHAR(50) NULL,
        turno VARCHAR(10) NOT NULL DEFAULT 'NA',
        agente_id INTEGER NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTO',
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_cierre DATETIME NULL,
        tiempo_atencion_minutos INTEGER NULL,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (plataforma_id) REFERENCES plataformas(id),
        FOREIGN KEY (agente_id) REFERENCES agentes(id)
      );

      CREATE TABLE IF NOT EXISTS historial_ticket (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL,
        usuario_nombre VARCHAR(150) NOT NULL,
        accion VARCHAR(100) NOT NULL,
        descripcion TEXT NOT NULL,
        valor_anterior TEXT NULL,
        valor_nuevo TEXT NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS configuracion (
        clave VARCHAR(100) PRIMARY KEY,
        valor TEXT NOT NULL,
        descripcion VARCHAR(255) NULL,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
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

    this.sqliteDb.exec(schemaSql);

    this.migrateTicketsAgenteNullable();
  }

  private migrateTicketsAgenteNullable(): void {
    try {
      const cols = this.sqliteDb.pragma(`table_info(tickets)`);
      const agenteCol = (cols as any[]).find((c) => c.name === 'agente_id');
      if (!agenteCol || agenteCol.notnull === 0) return;

      this.sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS tickets_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          prioridad VARCHAR(20) NOT NULL DEFAULT 'MEDIO',
          cliente_id INTEGER NOT NULL,
          asunto VARCHAR(255) NOT NULL,
          descripcion TEXT NOT NULL,
          plataforma_id INTEGER NOT NULL,
          solicitante VARCHAR(150) NOT NULL,
          fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          servicenow VARCHAR(50) NULL,
          turno VARCHAR(10) NOT NULL DEFAULT 'NA',
          agente_id INTEGER NULL,
          estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTO',
          fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
          fecha_cierre DATETIME NULL,
          tiempo_atencion_minutos INTEGER NULL,
          FOREIGN KEY (cliente_id) REFERENCES clientes(id),
          FOREIGN KEY (plataforma_id) REFERENCES plataformas(id),
          FOREIGN KEY (agente_id) REFERENCES agentes(id)
        );
      `);

      this.sqliteDb.exec(`
        INSERT INTO tickets_new
        SELECT id, prioridad, cliente_id, asunto, descripcion, plataforma_id, solicitante, fecha_creacion, servicenow, turno, agente_id, estado, fecha_actualizacion, fecha_cierre, tiempo_atencion_minutos
        FROM tickets
      `);

      this.sqliteDb.exec(`DROP TABLE tickets`);
      this.sqliteDb.exec(`ALTER TABLE tickets_new RENAME TO tickets`);

      this.sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado)`);
      this.sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_tickets_prioridad ON tickets(prioridad)`);
      this.sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_tickets_cliente ON tickets(cliente_id)`);
      this.sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_tickets_plataforma ON tickets(plataforma_id)`);
      this.sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_tickets_agente ON tickets(agente_id)`);
      this.sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_tickets_turno ON tickets(turno)`);
      this.sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_tickets_fecha_creacion ON tickets(fecha_creacion)`);
      this.sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_tickets_servicenow ON tickets(servicenow)`);

      console.log('[DB] Migracion aplicada: agente_id ahora permite NULL en tickets.');
    } catch (err) {
      console.error('[DB] Error en migracion de agente_id nullable:', err);
    }
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (this.isSqlite) {
      const stmt = this.sqliteDb.prepare(sql);
      return stmt.all(...params) as T[];
    } else {
      const [rows] = await this.mysqlPool.execute(sql, params);
      return rows as T[];
    }
  }

  public async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    if (this.isSqlite) {
      const stmt = this.sqliteDb.prepare(sql);
      const row = stmt.get(...params);
      return (row as T) || null;
    } else {
      const [rows] = await this.mysqlPool.execute(sql, params);
      const arr = rows as T[];
      return arr.length > 0 ? arr[0] : null;
    }
  }

  public async run(sql: string, params: any[] = []): Promise<QueryResult> {
    if (this.isSqlite) {
      const stmt = this.sqliteDb.prepare(sql);
      const info = stmt.run(...params);
      return {
        lastInsertRowid: Number(info.lastInsertRowid),
        changes: info.changes
      };
    } else {
      const [result] = await this.mysqlPool.execute(sql, params);
      return {
        lastInsertRowid: result.insertId,
        changes: result.affectedRows
      };
    }
  }
}

export const db = new DatabaseService();
