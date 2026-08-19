import { Request, Response } from 'express';
import { db } from '../services/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../services/logger';

export async function getClients(req: Request, res: Response): Promise<void> {
  try {
    const { search, estado } = req.query;
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      conditions.push('(c.nombre LIKE ? OR c.nit LIKE ? OR c.contacto_principal LIKE ?)');
      params.push(term, term, term);
    }

    if (estado && typeof estado === 'string' && estado !== 'all') {
      conditions.push('c.estado = ?');
      params.push(estado);
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT 
        c.*,
        COUNT(t.id) as total_casos,
        SUM(CASE WHEN t.estado = 'ABIERTO' THEN 1 ELSE 0 END) as casos_abiertos,
        SUM(CASE WHEN t.estado = 'EN PROCESO' THEN 1 ELSE 0 END) as casos_en_proceso,
        SUM(CASE WHEN t.estado = 'CERRADO' THEN 1 ELSE 0 END) as casos_cerrados
      FROM clientes c
      LEFT JOIN tickets t ON c.id = t.cliente_id
      WHERE ${whereClause}
      GROUP BY c.id
      ORDER BY c.nombre ASC
    `;

    const clients = await db.query(sql, params);

    res.json({
      success: true,
      data: clients
    });
  } catch (error: any) {
    logger.error('Error al consultar clientes', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al consultar clientes.', error: error.message });
  }
}

export async function createClient(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { nombre, nit, contacto_principal, correo_contacto, telefono, estado = 'ACTIVO' } = req.body;

    if (!nombre || !nombre.trim()) {
      res.status(400).json({ success: false, message: 'El nombre de la empresa/cliente es obligatorio.' });
      return;
    }

    const exists = await db.get('SELECT id FROM clientes WHERE LOWER(nombre) = LOWER(?)', [nombre.trim()]);
    if (exists) {
      res.status(400).json({ success: false, message: 'Ya existe un cliente con este nombre.' });
      return;
    }

    const result = await db.run(
      `INSERT INTO clientes (nombre, nit, contacto_principal, correo_contacto, telefono, estado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre.trim(),
        nit ? nit.trim() : null,
        contacto_principal ? contacto_principal.trim() : null,
        correo_contacto ? correo_contacto.trim() : null,
        telefono ? telefono.trim() : null,
        estado || 'ACTIVO'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Cliente creado correctamente.',
      data: { id: result.lastInsertRowid }
    });
  } catch (error: any) {
    logger.error('Error al crear cliente', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al crear cliente.', error: error.message });
  }
}

export async function updateClient(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { nombre, nit, contacto_principal, correo_contacto, telefono, estado } = req.body;

    const existing = await db.get('SELECT * FROM clientes WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
      return;
    }

    await db.run(
      `UPDATE clientes SET
        nombre = ?,
        nit = ?,
        contacto_principal = ?,
        correo_contacto = ?,
        telefono = ?,
        estado = ?
       WHERE id = ?`,
      [
        nombre !== undefined ? nombre.trim() : existing.nombre,
        nit !== undefined ? (nit ? nit.trim() : null) : existing.nit,
        contacto_principal !== undefined ? (contacto_principal ? contacto_principal.trim() : null) : existing.contacto_principal,
        correo_contacto !== undefined ? (correo_contacto ? correo_contacto.trim() : null) : existing.correo_contacto,
        telefono !== undefined ? (telefono ? telefono.trim() : null) : existing.telefono,
        estado !== undefined ? estado : existing.estado,
        id
      ]
    );

    res.json({
      success: true,
      message: 'Cliente actualizado correctamente.'
    });
  } catch (error: any) {
    logger.error('Error al actualizar cliente', { clientId: req.params.id, error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al actualizar cliente.', error: error.message });
  }
}

export async function toggleClientStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await db.get('SELECT estado FROM clientes WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
      return;
    }

    const newStatus = existing.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    await db.run('UPDATE clientes SET estado = ? WHERE id = ?', [newStatus, id]);

    res.json({
      success: true,
      message: `Cliente marcado como ${newStatus}.`,
      data: { estado: newStatus }
    });
  } catch (error: any) {
    logger.error('Error al modificar estado del cliente', { clientId: req.params.id, error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al modificar estado del cliente.', error: error.message });
  }
}
