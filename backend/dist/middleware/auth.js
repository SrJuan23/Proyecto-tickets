"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || null;
if (!JWT_SECRET) {
    // No lanzar excepción en import time; emitir warning y manejar en runtime.
    console.warn('JWT_SECRET no está definido en el archivo .env. Operaciones que requieran JWT fallarán.');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Acceso no autorizado. Token no proporcionado.'
        });
        return;
    }
    try {
        if (!JWT_SECRET) {
            res.status(500).json({ success: false, message: 'JWT_SECRET no configurado en el servidor.' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(403).json({
            success: false,
            message: 'Token inválido o expirado.'
        });
        return;
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
            return;
        }
        if (!roles.includes(req.user.rol)) {
            res.status(403).json({
                success: false,
                message: `Permisos insuficientes. Se requiere uno de los siguientes roles: ${roles.join(', ')}`
            });
            return;
        }
        next();
    };
}
