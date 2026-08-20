"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../services/logger");
function errorHandler(err, req, res, next) {
    logger_1.logger.error('Error no manejado:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
    });
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Ocurrió un error interno en el servidor.';
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { error: err.stack })
    });
}
