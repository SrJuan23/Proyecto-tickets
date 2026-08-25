import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { db } from './services/db';
import { seedDatabase } from './services/seed';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './services/logger';

import authRoutes from './routes/authRoutes';
import ticketRoutes from './routes/ticketRoutes';
import clientRoutes from './routes/clientRoutes';
import platformRoutes from './routes/platformRoutes';
import agentRoutes from './routes/agentRoutes';
import statsRoutes from './routes/statsRoutes';
import exportRoutes from './routes/exportRoutes';
import configRoutes from './routes/configRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(helmet({
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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Intente de nuevo en 15 minutos.'
  }
});

const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Intente de nuevo en 5 minutos.'
  }
});

const exportLimiter = rateLimit({
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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1 as health');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Support Desk API - Gestión de Casos',
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('Health check fallido: base de datos no disponible', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'Support Desk API - Gestión de Casos',
      database: 'disconnected',
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/clientes', clientRoutes);
app.use('/api/plataformas', platformRoutes);
app.use('/api/agentes', agentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/config', configRoutes);
app.use('/api/usuarios', userRoutes);

const publicDir = path.join(__dirname, '../../frontend/dist');

logger.info(`Sirviendo frontend desde: ${publicDir}`);

app.use(express.static(publicDir));

app.get('/login', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(publicDir, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).json({ error: 'index.html not found', path: indexPath });
    }
  });
});

app.use(errorHandler);

async function bootstrap() {
  try {
    logger.info('Iniciando Support Desk API...');
    await db.initialize();
    await seedDatabase();

    const server = app.listen(PORT, () => {
      logger.info(`====================================================`);
      logger.info(`  SUPPORT DESK - GESTIÓN DE CASOS Y TICKETS`);
      logger.info(`  Servidor activo en: http://localhost:${PORT}`);
      logger.info(`  API Health: http://localhost:${PORT}/api/health`);
      logger.info(`  Entorno: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`====================================================`);
    });

    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} recibido. Cerrando servidor gracefully...`);
      server.close(() => {
        logger.info('Servidor HTTP cerrado.');
        process.exit(0);
      });
      setTimeout(() => {
        logger.error('Forzando cierre después de timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Error crítico al iniciar la aplicación:', error);
    process.exit(1);
  }
}

bootstrap();
