import { Pool } from 'pg';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:saBDDyaZXIJqDNUSRdonDVzlbRgOjKzC@altaria.proxy.rlwy.net:32705/railway';
const EXCEL_PATH = process.argv[2] || '';
const SHEET_NAME = 'BITACORA N1 2025';

if (!EXCEL_PATH) {
  console.error('Uso: ts-node scripts/import-excel-to-railway.ts <ruta-al-excel>');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function ensureClient(nombre: string): Promise<number> {
  const trimmed = nombre.trim();
  const found = await pool.query('SELECT id FROM clientes WHERE LOWER(nombre)=LOWER($1)', [trimmed]);
  if (found.rows[0]) return found.rows[0].id;

  const inserted = await pool.query('INSERT INTO clientes (nombre, estado) VALUES ($1, $2) RETURNING id', [trimmed, 'ACTIVO']);
  return inserted.rows[0].id;
}

async function ensurePlataforma(nombre: string): Promise<number> {
  const trimmed = nombre.trim();
  if (!trimmed) return 0;
  const found = await pool.query('SELECT id FROM plataformas WHERE LOWER(nombre)=LOWER($1)', [trimmed]);
  if (found.rows[0]) return found.rows[0].id;

  const inserted = await pool.query('INSERT INTO plataformas (nombre, estado) VALUES ($1, $2) RETURNING id', [trimmed, 'ACTIVO']);
  return inserted.rows[0].id;
}

async function ensureAgente(nombre: string, hasAgentsTable: boolean): Promise<number> {
  const trimmed = nombre.trim();
  if (!trimmed || trimmed === 'NA') return 0;

  const emailPlaceholder = `agente.${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@supportdesk.local`;
  const passwordHash = await bcrypt.hash('changeme', 10);

  if (hasAgentsTable) {
    const found = await pool.query('SELECT id FROM agentes WHERE LOWER(nombre)=LOWER($1)', [trimmed]);
    if (found.rows[0]) return found.rows[0].id;

    const inserted = await pool.query(
      'INSERT INTO agentes (nombre, email, telefono, especialidad, estado) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [trimmed, emailPlaceholder, null, null, 'ACTIVO']
    );
    const agentesId = inserted.rows[0].id;

    await pool.query(
      'INSERT INTO usuarios (id, nombre, email, password_hash, rol, estado) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING',
      [agentesId, trimmed, emailPlaceholder, passwordHash, 'AGENTE', 'ACTIVO']
    );

    return agentesId;
  }

  const found = await pool.query('SELECT id FROM usuarios WHERE LOWER(nombre)=LOWER($1) AND rol=$2', [trimmed, 'AGENTE']);
  if (found.rows[0]) return found.rows[0].id;

  const inserted = await pool.query(
    'INSERT INTO usuarios (nombre, email, password_hash, rol, estado) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [trimmed, emailPlaceholder, passwordHash, 'AGENTE', 'ACTIVO']
  );
  return inserted.rows[0].id;
}

function parseFecha(raw: any): string | undefined {
  if (!raw && raw !== 0) return undefined;

  let text = String(raw).trim();
  if (!text || text === 'NA') return undefined;

  const m = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (!m) return undefined;

  let dd = m[1];
  let mm = m[2];
  let yyyy = m[3];
  if (yyyy.length === 2) yyyy = `20${yyyy}`;
  dd = dd.padStart(2, '0');
  mm = mm.padStart(2, '0');

  const candidate = `${yyyy}-${mm}-${dd} 00:00:00`;
  const d = new Date(candidate);
  if (isNaN(d.getTime())) return undefined;
  return candidate;
}

async function run() {
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames.find((n) => n.toLowerCase().includes(SHEET_NAME.toLowerCase()));
  if (!sheetName) {
    console.error(`No se encontró la hoja: ${SHEET_NAME}`);
    process.exit(1);
  }

  const sheet = workbook.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as any[];
  if (!rows.length) {
    console.error('La hoja está vacía');
    process.exit(1);
  }

  const headers = rows[0].map((h: any) => String(h || '').trim());
  const dataRows = rows.slice(1);
  let imported = 0;
  let skipped = 0;

  const agentsTableCheck = await pool.query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agentes')");
  const hasAgentsTable = agentsTableCheck.rows[0]?.exists;

  for (const row of dataRows) {
    const get = (name: string) => row[headers.indexOf(name)];

    const cliente = get('Cliente');
    const asunto = get('Asunto Mail');
    const solicitante = get('Nombre Solicitante');

    if (!cliente || !asunto || !solicitante) {
      skipped++;
      continue;
    }

    const clienteId = await ensureClient(String(cliente));
    const plataformaId = await ensurePlataforma(String(get('Plataforma') || ''));
    const fechaCreacion = parseFecha(get('Fecha Solicitud')) || new Date().toISOString().slice(0, 19).replace('T', ' ');

    const atendidoPor = String(get('Atendido por') || '').trim();
    let agenteId: number | null = null;
    if (atendidoPor && atendidoPor !== 'NA') {
      agenteId = await ensureAgente(atendidoPor, hasAgentsTable);
    }

    await pool.query(
      `INSERT INTO tickets (
        prioridad, cliente_id, asunto, descripcion, plataforma_id, solicitante,
        fecha_creacion, servicenow, turno, agente_id, estado,
        fecha_actualizacion, fecha_cierre, tiempo_atencion_minutos
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        String(get('Tipo') || 'MEDIO').toUpperCase(),
        clienteId,
        String(asunto).trim(),
        String(get('Descripción') || '').trim(),
        plataformaId || null,
        String(solicitante).trim(),
        fechaCreacion,
        get('ServiceNow') ? String(get('ServiceNow')).trim() : null,
        String(get('Turno Atendido') || 'NA').toUpperCase(),
        agenteId,
        'ABIERTO',
        fechaCreacion,
        null,
        null
      ]
    );

    imported++;
  }

  console.log(`Importación finalizada: ${imported} tickets importados, ${skipped} filas omitidas.`);
  await pool.end();
}

run().catch((err) => {
  console.error('Error en importación:', err);
  process.exit(1);
});
