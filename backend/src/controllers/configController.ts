import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../services/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../services/logger';

// ---------------- CONFIGURATION CONTROLLER ----------------

export async function getConfig(req: Request, res: Response): Promise<void> {
  try {
    const configs = await db.query('SELECT clave, valor, descripcion, fecha_actualizacion FROM configuracion');
    const configMap: Record<string, string> = {};
    configs.forEach((c: any) => {
      configMap[c.clave] = c.valor;
    });

    res.json({
      success: true,
      data: {
        list: configs,
        map: configMap
      }
    });
  } catch (error: any) {
    logger.error('Error al consultar configuración', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al consultar configuración.', error: error.message });
  }
}

export async function updateConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { clave } = req.params;
    const { valor, descripcion } = req.body;

    if (valor === undefined) {
      res.status(400).json({ success: false, message: 'El valor de la configuración es requerido.' });
      return;
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const exists = await db.get('SELECT clave FROM configuracion WHERE clave = ?', [clave]);
    if (exists) {
      await db.run(
        'UPDATE configuracion SET valor = ?, descripcion = COALESCE(?, descripcion), fecha_actualizacion = ? WHERE clave = ?',
        [String(valor).trim(), descripcion ? String(descripcion).trim() : null, now, clave]
      );
    } else {
      await db.run(
        'INSERT INTO configuracion (clave, valor, descripcion, fecha_actualizacion) VALUES (?, ?, ?, ?)',
        [clave, String(valor).trim(), descripcion ? String(descripcion).trim() : null, now]
      );
    }

    res.json({
      success: true,
      message: `Configuración '${clave}' actualizada correctamente.`
    });
  } catch (error: any) {
    logger.error('Error al actualizar configuración', { clave: req.params.clave, error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al actualizar configuración.', error: error.message });
  }
}

// ---------------- USER MANAGEMENT CONTROLLER (ADMIN) ----------------

export async function getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const users = await db.query(
      'SELECT id, nombre, email, rol, estado, telefono, especialidad, avatar_url, fecha_creacion FROM usuarios ORDER BY nombre ASC'
    );
    res.json({
      success: true,
      data: users
    });
  } catch (error: any) {
    logger.error('Error al consultar usuarios', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al consultar usuarios.', error: error.message });
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { nombre, email, password, rol = 'AGENTE', estado = 'ACTIVO' } = req.body;

    if (!nombre || !email || !password) {
      res.status(400).json({ success: false, message: 'Nombre, email y contraseña son obligatorios.' });
      return;
    }

    const exists = await db.get('SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (exists) {
      res.status(400).json({ success: false, message: 'El correo electrónico ya se encuentra registrado.' });
      return;
    }

    const passHash = await bcrypt.hash(password, 10);
    const result = await db.run(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, estado) VALUES (?, ?, ?, ?, ?)`,
      [nombre.trim(), email.trim().toLowerCase(), passHash, rol, estado]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente.',
      data: { id: result.lastInsertRowid }
    });
  } catch (error: any) {
    logger.error('Error al crear usuario', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al crear usuario.', error: error.message });
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { nombre, email, password, rol, estado, telefono, especialidad } = req.body;

    const existing = await db.get('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      return;
    }

    // Si edita su propio perfil, no permitir cambiar el rol
    let finalRol = rol;
    if (req.user?.id === Number(id)) {
      finalRol = existing.rol;
    }

    let passHash = existing.password_hash;
    if (password && password.trim()) {
      passHash = await bcrypt.hash(password.trim(), 10);
    }

    await db.run(
      `UPDATE usuarios SET
        nombre = ?,
        email = ?,
        password_hash = ?,
        rol = ?,
        estado = ?,
        telefono = ?,
        especialidad = ?
       WHERE id = ?`,
      [
        nombre !== undefined ? nombre.trim() : existing.nombre,
        email !== undefined ? email.trim().toLowerCase() : existing.email,
        passHash,
        finalRol !== undefined ? finalRol : existing.rol,
        estado !== undefined ? estado : existing.estado,
        telefono !== undefined ? telefono : existing.telefono,
        especialidad !== undefined ? especialidad : existing.especialidad,
        id
      ]
    );

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente.'
    });
  } catch (error: any) {
    logger.error('Error al actualizar usuario', { userId: req.params.id, error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al actualizar usuario.', error: error.message });
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (req.user?.id === Number(id)) {
      res.status(400).json({ success: false, message: 'No puedes eliminar tu propio usuario en sesión.' });
      return;
    }

    await db.run('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'Usuario eliminado correctamente.'
    });
  } catch (error: any) {
    logger.error('Error al eliminar usuario', { userId: req.params.id, error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al eliminar usuario.', error: error.message });
  }
}
