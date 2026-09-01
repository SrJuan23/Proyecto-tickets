import bcrypt from 'bcryptjs';
import { db } from './db';

export async function seedDatabase(): Promise<void> {
  const enableSeed = process.env.ENABLE_SEED === 'true';

  if (!enableSeed) {
    console.log('[SEED] Ejecución de seed deshabilitada (ENABLE_SEED=false).');
    return;
  }

  const existingUsers = await db.query('SELECT COUNT(*) as count FROM usuarios');
  if (existingUsers[0]?.count > 0) {
    console.log('[SEED] Base de datos ya cuenta con datos iniciales.');
    return;
  }

  console.log('[SEED] Creando cuenta de administrador...');

  const adminPass = await bcrypt.hash('admin123', 10);

  await db.run(
    `INSERT INTO usuarios (nombre, email, password_hash, rol, estado, telefono, especialidad) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['Administrador', 'admin@supportdesk.com', adminPass, 'ADMIN', 'ACTIVO', null, null]
  );

  await db.run(
    `INSERT INTO configuracion (clave, valor, descripcion) VALUES (?, ?, ?)`,
    ['SERVICENOW_BASE_URL', 'https://soporte.service-now.com/nav_to.do?uri=incident.do?sysparm_query=number=', 'URL base para apertura de incidentes en ServiceNow']
  );

  console.log('[SEED] Cuenta de administrador creada. Email: admin@supportdesk.com / Contraseña: admin123');
}
