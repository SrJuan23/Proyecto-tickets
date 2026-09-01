import { Request, Response } from 'express';
import { db } from '../services/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../services/logger';

export async function getAgents(req: Request, res: Response): Promise<void> {
  try {
    const { search, estado } = req.query;
    const conditions: string[] = ["rol = 'AGENTE'"];
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      conditions.push('(nombre LIKE ? OR email LIKE ? OR especialidad LIKE ?)');
      params.push(term, term, term);
    }

    if (estado && typeof estado === 'string' && estado !== 'all') {
      conditions.push('estado = ?');
      params.push(estado);
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT 
        u.*,
        COUNT(t.id) as total_casos,
        SUM(CASE WHEN t.estado IN ('ABIERTO','EN PROCESO','PENDIENTE') THEN 1 ELSE 0 END) as casos_abiertos,
        SUM(CASE WHEN t.estado IN ('CERRADO','RESUELTO') THEN 1 ELSE 0 END) as casos_cerrados
      FROM usuarios u
      LEFT JOIN tickets t ON u.id = t.agente_id
      WHERE ${whereClause}
      GROUP BY u.id
      ORDER BY u.nombre ASC
    `;

    const agents = await db.query(sql, params);

    res.json({
      success: true,
      data: agents
    });
  } catch (error: any) {
    logger.error('Error al consultar agentes', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al consultar agentes.', error: error.message });
  }
}

export async function createAgent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { nombre, email, telefono, especialidad, estado = 'ACTIVO', password } = req.body;

    if (!nombre || !nombre.trim()) {
      res.status(400).json({ success: false, message: 'El nombre del agente es obligatorio.' });
      return;
    }

    const exists = await db.get('SELECT id FROM usuarios WHERE LOWER(nombre) = LOWER(?)', [nombre.trim()]);
    if (exists) {
      res.status(400).json({ success: false, message: 'Ya existe un usuario con este nombre.' });
      return;
    }

    const passwordHash = password ? await require('bcryptjs').hash(password, 10) : null;

    const result = await db.run(
      `INSERT INTO usuarios (nombre, email, telefono, especialidad, estado, rol, password_hash, password_change_required) VALUES (?, ?, ?, ?, ?, 'AGENTE', ?, ?)`,
      [
        nombre.trim(),
        email ? email.trim() : null,
        telefono ? telefono.trim() : null,
        especialidad ? especialidad.trim() : null,
        estado || 'ACTIVO',
        passwordHash,
        true
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Agente registrado correctamente.',
      data: { id: result.lastInsertRowid }
    });
  } catch (error: any) {
    logger.error('Error al crear agente', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al crear agente.', error: error.message });
  }
}

export async function updateAgent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, especialidad, estado, password } = req.body;

    const existing = await db.get('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (!existing || existing.rol !== 'AGENTE') {
      res.status(404).json({ success: false, message: 'Agente no encontrado.' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (nombre !== undefined) { updates.push('nombre = ?'); values.push(nombre.trim()); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email ? email.trim() : null); }
    if (telefono !== undefined) { updates.push('telefono = ?'); values.push(telefono ? telefono.trim() : null); }
    if (especialidad !== undefined) { updates.push('especialidad = ?'); values.push(especialidad ? especialidad.trim() : null); }
    if (estado !== undefined) { updates.push('estado = ?'); values.push(estado); }
    if (password !== undefined && password.trim() !== '') {
      updates.push('password_hash = ?');
      values.push(require('bcryptjs').hash(password.trim(), 10));
    }

    if (updates.length === 0) {
      res.json({ success: true, message: 'Sin cambios.' });
      return;
    }

    values.push(id);
    await db.run(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({
      success: true,
      message: 'Agente actualizado correctamente.'
    });
  } catch (error: any) {
    logger.error('Error al actualizar agente', { agentId: req.params.id, error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al actualizar agente.', error: error.message });
  }
}

export async function toggleAgentStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await db.get('SELECT estado FROM usuarios WHERE id = ? AND rol = ?', [id, 'AGENTE']);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Agente no encontrado.' });
      return;
    }

    const newStatus = existing.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    await db.run('UPDATE usuarios SET estado = ? WHERE id = ?', [newStatus, id]);

    res.json({
      success: true,
      message: `Agente marcado como ${newStatus}.`,
      data: { estado: newStatus }
    });
  } catch (error: any) {
    logger.error('Error al modificar estado del agente', { agentId: req.params.id, error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al modificar estado del agente.', error: error.message });
  }
}

export async function deleteAgent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await db.get('SELECT id FROM usuarios WHERE id = ? AND rol = ?', [id, 'AGENTE']);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Agente no encontrado.' });
      return;
    }

    await db.run('UPDATE tickets SET agente_id = NULL WHERE agente_id = ?', [id]);
    await db.run('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'Agente eliminado correctamente.'
    });
  } catch (error: any) {
    logger.error('Error al eliminar agente', { agentId: req.params.id, error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al eliminar agente.', error: error.message });
  }
}
