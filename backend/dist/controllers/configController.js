"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.updateConfig = updateConfig;
exports.getUsers = getUsers;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../services/db");
const logger_1 = require("../services/logger");
// ---------------- CONFIGURATION CONTROLLER ----------------
async function getConfig(req, res) {
    try {
        const configs = await db_1.db.query('SELECT clave, valor, descripcion, fecha_actualizacion FROM configuracion');
        const configMap = {};
        configs.forEach((c) => {
            configMap[c.clave] = c.valor;
        });
        res.json({
            success: true,
            data: {
                list: configs,
                map: configMap
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error al consultar configuración', { error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Error al consultar configuración.', error: error.message });
    }
}
async function updateConfig(req, res) {
    try {
        const { clave } = req.params;
        const { valor, descripcion } = req.body;
        if (valor === undefined) {
            res.status(400).json({ success: false, message: 'El valor de la configuración es requerido.' });
            return;
        }
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const exists = await db_1.db.get('SELECT clave FROM configuracion WHERE clave = ?', [clave]);
        if (exists) {
            await db_1.db.run('UPDATE configuracion SET valor = ?, descripcion = COALESCE(?, descripcion), fecha_actualizacion = ? WHERE clave = ?', [String(valor).trim(), descripcion ? String(descripcion).trim() : null, now, clave]);
        }
        else {
            await db_1.db.run('INSERT INTO configuracion (clave, valor, descripcion, fecha_actualizacion) VALUES (?, ?, ?, ?)', [clave, String(valor).trim(), descripcion ? String(descripcion).trim() : null, now]);
        }
        res.json({
            success: true,
            message: `Configuración '${clave}' actualizada correctamente.`
        });
    }
    catch (error) {
        logger_1.logger.error('Error al actualizar configuración', { clave: req.params.clave, error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Error al actualizar configuración.', error: error.message });
    }
}
// ---------------- USER MANAGEMENT CONTROLLER (ADMIN) ----------------
async function getUsers(req, res) {
    try {
        const users = await db_1.db.query('SELECT id, nombre, email, rol, estado, avatar_url, fecha_creacion FROM usuarios ORDER BY nombre ASC');
        res.json({
            success: true,
            data: users
        });
    }
    catch (error) {
        logger_1.logger.error('Error al consultar usuarios', { error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Error al consultar usuarios.', error: error.message });
    }
}
async function createUser(req, res) {
    try {
        const { nombre, email, password, rol = 'AGENTE', estado = 'ACTIVO' } = req.body;
        if (!nombre || !email || !password) {
            res.status(400).json({ success: false, message: 'Nombre, email y contraseña son obligatorios.' });
            return;
        }
        const exists = await db_1.db.get('SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?)', [email.trim()]);
        if (exists) {
            res.status(400).json({ success: false, message: 'El correo electrónico ya se encuentra registrado.' });
            return;
        }
        const passHash = await bcryptjs_1.default.hash(password, 10);
        const result = await db_1.db.run(`INSERT INTO usuarios (nombre, email, password_hash, rol, estado) VALUES (?, ?, ?, ?, ?)`, [nombre.trim(), email.trim().toLowerCase(), passHash, rol, estado]);
        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente.',
            data: { id: result.lastInsertRowid }
        });
    }
    catch (error) {
        logger_1.logger.error('Error al crear usuario', { error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Error al crear usuario.', error: error.message });
    }
}
async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const { nombre, email, password, rol, estado } = req.body;
        const existing = await db_1.db.get('SELECT * FROM usuarios WHERE id = ?', [id]);
        if (!existing) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
            return;
        }
        let passHash = existing.password_hash;
        if (password && password.trim()) {
            passHash = await bcryptjs_1.default.hash(password.trim(), 10);
        }
        await db_1.db.run(`UPDATE usuarios SET
        nombre = ?,
        email = ?,
        password_hash = ?,
        rol = ?,
        estado = ?
       WHERE id = ?`, [
            nombre !== undefined ? nombre.trim() : existing.nombre,
            email !== undefined ? email.trim().toLowerCase() : existing.email,
            passHash,
            rol !== undefined ? rol : existing.rol,
            estado !== undefined ? estado : existing.estado,
            id
        ]);
        res.json({
            success: true,
            message: 'Usuario actualizado correctamente.'
        });
    }
    catch (error) {
        logger_1.logger.error('Error al actualizar usuario', { userId: req.params.id, error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Error al actualizar usuario.', error: error.message });
    }
}
async function deleteUser(req, res) {
    try {
        const { id } = req.params;
        if (req.user?.id === Number(id)) {
            res.status(400).json({ success: false, message: 'No puedes eliminar tu propio usuario en sesión.' });
            return;
        }
        await db_1.db.run('DELETE FROM usuarios WHERE id = ?', [id]);
        res.json({
            success: true,
            message: 'Usuario eliminado correctamente.'
        });
    }
    catch (error) {
        logger_1.logger.error('Error al eliminar usuario', { userId: req.params.id, error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Error al eliminar usuario.', error: error.message });
    }
}
