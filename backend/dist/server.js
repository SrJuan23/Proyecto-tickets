"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./services/db");
const seed_1 = require("./services/seed");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./services/logger");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const ticketRoutes_1 = __importDefault(require("./routes/ticketRoutes"));
const clientRoutes_1 = __importDefault(require("./routes/clientRoutes"));
const platformRoutes_1 = __importDefault(require("./routes/platformRoutes"));
const agentRoutes_1 = __importDefault(require("./routes/agentRoutes"));
const statsRoutes_1 = __importDefault(require("./routes/statsRoutes"));
const exportRoutes_1 = __importDefault(require("./routes/exportRoutes"));
const configRoutes_1 = __importDefault(require("./routes/configRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || corsOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Origen no permitido por CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
            styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Demasiados intentos de autenticación. Intente de nuevo en 15 minutos.'
    }
});
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Demasiadas solicitudes. Intente de nuevo en 5 minutos.'
    }
});
const exportLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Demasiadas exportaciones. Intente de nuevo en 5 minutos.'
    }
});
if (process.env.NODE_ENV === 'production') {
    app.use('/api/auth/login', authLimiter);
    app.use('/api/', apiLimiter);
    app.use('/api/export/', exportLimiter);
}
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/api/health', async (req, res) => {
    try {
        await db_1.db.query('SELECT 1 as health');
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'Support Desk API - Gestión de Casos',
            database: 'connected',
            environment: process.env.NODE_ENV || 'development'
        });
    }
    catch (error) {
        logger_1.logger.error('Health check fallido: base de datos no disponible', error);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            service: 'Support Desk API - Gestión de Casos',
            database: 'disconnected',
            environment: process.env.NODE_ENV || 'development'
        });
    }
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/tickets', ticketRoutes_1.default);
app.use('/api/clientes', clientRoutes_1.default);
app.use('/api/plataformas', platformRoutes_1.default);
app.use('/api/agentes', agentRoutes_1.default);
app.use('/api/stats', statsRoutes_1.default);
app.use('/api/export', exportRoutes_1.default);
app.use('/api/config', configRoutes_1.default);
app.use('/api/usuarios', userRoutes_1.default);
const publicDir = path_1.default.join(__dirname, '../../frontend/dist');
const publicDirAlt = path_1.default.join(process.cwd(), 'frontend/dist');
const resolvedPublicDir = fs_1.default.existsSync(publicDir) ? publicDir : publicDirAlt;
logger_1.logger.info(`Sirviendo frontend desde: ${resolvedPublicDir}`);
app.use(express_1.default.static(resolvedPublicDir));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    const indexPath = path_1.default.join(publicDir, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.json({
                message: 'API de Support Desk en ejecución. El frontend se sirve de forma independiente o compilada en /frontend/dist'
            });
        }
    });
});
app.use(errorHandler_1.errorHandler);
async function bootstrap() {
    try {
        logger_1.logger.info('Iniciando Support Desk API...');
        await db_1.db.initialize();
        await (0, seed_1.seedDatabase)();
        const server = app.listen(PORT, () => {
            logger_1.logger.info(`====================================================`);
            logger_1.logger.info(`  SUPPORT DESK - GESTIÓN DE CASOS Y TICKETS`);
            logger_1.logger.info(`  Servidor activo en: http://localhost:${PORT}`);
            logger_1.logger.info(`  API Health: http://localhost:${PORT}/api/health`);
            logger_1.logger.info(`  Entorno: ${process.env.NODE_ENV || 'development'}`);
            logger_1.logger.info(`====================================================`);
        });
        const gracefulShutdown = (signal) => {
            logger_1.logger.info(`${signal} recibido. Cerrando servidor gracefully...`);
            server.close(() => {
                logger_1.logger.info('Servidor HTTP cerrado.');
                process.exit(0);
            });
            setTimeout(() => {
                logger_1.logger.error('Forzando cierre después de timeout.');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error('Error crítico al iniciar la aplicación:', error);
        process.exit(1);
    }
}
bootstrap();
