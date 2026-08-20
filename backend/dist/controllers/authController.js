"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.getMe = getMe;
exports.getDemoAccounts = getDemoAccounts;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const db_1 = require("../services/db");
const logger_1 = require("../services/logger");
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido en el archivo .env.');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
async function login(req, res) {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Datos de entrada inválidos.',
                errors: errors.array().map((err) => err.msg)
            });
            return;
        }
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'El correo electrónico y la contraseña son obligatorios.'
            });
            return;
        }
        const user = await db_1.db.get('SELECT * FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Credenciales inválidas. Usuario no encontrado.'
            });
            return;
        }
        if (user.estado !== 'ACTIVO') {
            res.status(403).json({
                success: false,
                message: 'El usuario se encuentra inactivo. Contacte al administrador.'
            });
            return;
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            res.status(401).json({
                success: false,
                message: 'Credenciales inválidas. Contraseña incorrecta.'
            });
            return;
        }
        const tokenPayload = {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({
            success: true,
            message: 'Inicio de sesión exitoso.',
            data: {
                token,
                user: {
                    id: user.id,
                    nombre: user.nombre,
                    email: user.email,
                    rol: user.rol,
                    avatar_url: user.avatar_url,
                    fecha_creacion: user.fecha_creacion
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error en login', { error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Error en el servidor durante el inicio de sesión.', error: error.message });
    }
}
async function getMe(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'No autenticado.' });
            return;
        }
        const user = await db_1.db.get('SELECT id, nombre, email, rol, estado, avatar_url, fecha_creacion FROM usuarios WHERE id = ?', [req.user.id]);
        if (!user) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
            return;
        }
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener datos del usuario.', error: error.message });
    }
}
async function getDemoAccounts(req, res) {
    try {
        const users = await db_1.db.query("SELECT id, nombre, email, rol, estado FROM usuarios WHERE estado = 'ACTIVO'");
        res.json({
            success: true,
            data: users
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al consultar cuentas demo.', error: error.message });
    }
}
