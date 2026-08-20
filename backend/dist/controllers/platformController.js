"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatforms = getPlatforms;
exports.createPlatform = createPlatform;
exports.updatePlatform = updatePlatform;
exports.togglePlatformStatus = togglePlatformStatus;
const db_1 = require("../services/db");
const logger_1 = require("../services/logger");
async function getPlatforms(req, res) {
    try {
        const { search, estado } = req.query;
        const conditions = ['1=1'];
        const params = [];
        if (search && typeof search === 'string' && search.trim() !== '') {
            const term = `%${search.trim()}%`;
            conditions.push('(p.nombre LIKE ? OR p.descripcion LIKE ?)');
            params.push(term, term);
        }
        if (estado && typeof estado === 'string' && estado !== 'all') {
            conditions.push('p.estado = ?');
            params.push(estado);
        }
        const whereClause = conditions.join(' AND ');
        const sql = `
      SELECT 
        p.*,
        COUNT(t.id) as total_casos,
        SUM(CASE WHEN t.estado = 'ABIERTO' THEN 1 ELSE 0 END) as casos_abiertos,
        SUM(CASE WHEN t.estado = 'CERRADO' THEN 1 ELSE 0 END) as casos_cerrados,
        SUM(CASE WHEN t.prioridad = 'ALTO' OR t.prioridad = 'CRITICO' THEN 1 ELSE 0 END) as casos_alta_prioridad
      FROM plataformas p
      LEFT JOIN tickets t ON p.id = t.plataforma_id
      WHERE ${whereClause}
      GROUP BY p.id
      ORDER BY p.nombre ASC
    `;
        const platforms = await db_1.db.query(sql, params);
        res.json({
            success: true,
            data: platforms
        });
    }
    catch (error) {
        logger_1.logger.error('Error al consultar plataformas', { error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Error al consultar plataformas.', error: error.message });
    }
}
async function createPlatform(req, res) {
    try {
        const { nombre, descripcion, color_badge = '#0945F7', estado = 'ACTIVO' } = req.body;
        if (!nombre || !nombre.trim()) {
            res.status(400).json({ success: false, message: 'El nombre de la plataforma es obligatorio.' });
            return;
        }
        const exists = await db_1.db.get('SELECT id FROM plataformas WHERE LOWER(nombre) = LOWER(?)', [nombre.trim()]);
        if (exists) {
            res.status(400).json({ success: false, message: 'Ya existe una plataforma con este nombre.' });
            return;
        }
        const result = await db_1.db.run(`INSERT INTO plataformas (nombre, descripcion, color_badge, estado) VALUES (?, ?, ?, ?)`, [nombre.trim().toUpperCase(), descripcion ? descripcion.trim() : null, color_badge, estado || 'ACTIVO']);
        res.status(201).json({
            success: true,
            message: 'Plataforma creada correctamente.',
            data: { id: result.lastInsertRowid }
        });
    }
    catch (error) {
        logger_1.logger.error('Error al registrar plataforma', { error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Error al registrar plataforma.', error: error.message });
    }
}
async function updatePlatform(req, res) {
    try {
        const { id } = req.params;
        const { nombre, descripcion, color_badge, estado } = req.body;
        const existing = await db_1.db.get('SELECT * FROM plataformas WHERE id = ?', [id]);
        if (!existing) {
            res.status(404).json({ success: false, message: 'Plataforma no encontrada.' });
            return;
        }
        await db_1.db.run(`UPDATE plataformas SET
        nombre = ?,
        descripcion = ?,
        color_badge = ?,
        estado = ?
       WHERE id = ?`, [
            nombre !== undefined ? nombre.trim().toUpperCase() : existing.nombre,
            descripcion !== undefined ? (descripcion ? descripcion.trim() : null) : existing.descripcion,
            color_badge !== undefined ? color_badge : existing.color_badge,
            estado !== undefined ? estado : existing.estado,
            id
        ]);
        res.json({
            success: true,
            message: 'Plataforma actualizada correctamente.'
        });
    }
    catch (error) {
        logger_1.logger.error('Error al actualizar plataforma', { platformId: req.params.id, error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Error al actualizar plataforma.', error: error.message });
    }
}
async function togglePlatformStatus(req, res) {
    try {
        const { id } = req.params;
        const existing = await db_1.db.get('SELECT estado FROM plataformas WHERE id = ?', [id]);
        if (!existing) {
            res.status(404).json({ success: false, message: 'Plataforma no encontrada.' });
            return;
        }
        const newStatus = existing.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
        await db_1.db.run('UPDATE plataformas SET estado = ? WHERE id = ?', [newStatus, id]);
        res.json({
            success: true,
            message: `Plataforma marcada como ${newStatus}.`,
            data: { estado: newStatus }
        });
    }
    catch (error) {
        logger_1.logger.error('Error al modificar estado de plataforma', { platformId: req.params.id, error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Error al modificar estado de plataforma.', error: error.message });
    }
}
