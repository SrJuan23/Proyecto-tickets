"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgents = getAgents;
exports.createAgent = createAgent;
exports.updateAgent = updateAgent;
exports.toggleAgentStatus = toggleAgentStatus;
const db_1 = require("../services/db");
const logger_1 = require("../services/logger");
async function getAgents(req, res) {
    try {
        const { search, estado } = req.query;
        const conditions = ['1=1'];
        const params = [];
        if (search && typeof search === 'string' && search.trim() !== '') {
            const term = `%${search.trim()}%`;
            conditions.push('(a.nombre LIKE ? OR a.email LIKE ? OR a.especialidad LIKE ?)');
            params.push(term, term, term);
        }
        if (estado && typeof estado === 'string' && estado !== 'all') {
            conditions.push('a.estado = ?');
            params.push(estado);
        }
        const whereClause = conditions.join(' AND ');
        const sql = `
      SELECT 
        a.*,
        COUNT(t.id) as total_casos,
        SUM(CASE WHEN t.estado = 'ABIERTO' OR t.estado = 'EN PROCESO' OR t.estado = 'PENDIENTE' THEN 1 ELSE 0 END) as casos_abiertos,
        SUM(CASE WHEN t.estado = 'CERRADO' OR t.estado = 'RESUELTO' THEN 1 ELSE 0 END) as casos_cerrados
      FROM agentes a
      LEFT JOIN tickets t ON a.id = t.agente_id
      WHERE ${whereClause}
      GROUP BY a.id
      ORDER BY a.nombre ASC
    `;
        const agents = await db_1.db.query(sql, params);
        res.json({
            success: true,
            data: agents
        });
    }
    catch (error) {
        logger_1.logger.error('Error al consultar agentes', { error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Error al consultar agentes.', error: error.message });
    }
}
async function createAgent(req, res) {
    try {
        const { nombre, email, telefono, especialidad, estado = 'ACTIVO' } = req.body;
        if (!nombre || !nombre.trim()) {
            res.status(400).json({ success: false, message: 'El nombre del agente es obligatorio.' });
            return;
        }
        const exists = await db_1.db.get('SELECT id FROM agentes WHERE LOWER(nombre) = LOWER(?)', [nombre.trim()]);
        if (exists) {
            res.status(400).json({ success: false, message: 'Ya existe un agente con este nombre.' });
            return;
        }
        const result = await db_1.db.run(`INSERT INTO agentes (nombre, email, telefono, especialidad, estado) VALUES (?, ?, ?, ?, ?)`, [
            nombre.trim(),
            email ? email.trim() : null,
            telefono ? telefono.trim() : null,
            especialidad ? especialidad.trim() : null,
            estado || 'ACTIVO'
        ]);
        res.status(201).json({
            success: true,
            message: 'Agente registrado correctamente.',
            data: { id: result.lastInsertRowid }
        });
    }
    catch (error) {
        logger_1.logger.error('Error al crear agente', { error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Error al crear agente.', error: error.message });
    }
}
async function updateAgent(req, res) {
    try {
        const { id } = req.params;
        const { nombre, email, telefono, especialidad, estado } = req.body;
        const existing = await db_1.db.get('SELECT * FROM agentes WHERE id = ?', [id]);
        if (!existing) {
            res.status(404).json({ success: false, message: 'Agente no encontrado.' });
            return;
        }
        await db_1.db.run(`UPDATE agentes SET
        nombre = ?,
        email = ?,
        telefono = ?,
        especialidad = ?,
        estado = ?
       WHERE id = ?`, [
            nombre !== undefined ? nombre.trim() : existing.nombre,
            email !== undefined ? (email ? email.trim() : null) : existing.email,
            telefono !== undefined ? (telefono ? telefono.trim() : null) : existing.telefono,
            especialidad !== undefined ? (especialidad ? especialidad.trim() : null) : existing.especialidad,
            estado !== undefined ? estado : existing.estado,
            id
        ]);
        res.json({
            success: true,
            message: 'Agente actualizado correctamente.'
        });
    }
    catch (error) {
        logger_1.logger.error('Error al actualizar agente', { agentId: req.params.id, error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Error al actualizar agente.', error: error.message });
    }
}
async function toggleAgentStatus(req, res) {
    try {
        const { id } = req.params;
        const existing = await db_1.db.get('SELECT estado FROM agentes WHERE id = ?', [id]);
        if (!existing) {
            res.status(404).json({ success: false, message: 'Agente no encontrado.' });
            return;
        }
        const newStatus = existing.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
        await db_1.db.run('UPDATE agentes SET estado = ? WHERE id = ?', [newStatus, id]);
        res.json({
            success: true,
            message: `Agente marcado como ${newStatus}.`,
            data: { estado: newStatus }
        });
    }
    catch (error) {
        logger_1.logger.error('Error al modificar estado del agente', { agentId: req.params.id, error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Error al modificar estado del agente.', error: error.message });
    }
}
