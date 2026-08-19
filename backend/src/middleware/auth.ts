import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { RolUsuario } from '../models/types';

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido en el archivo .env. El servidor no puede iniciar sin esta variable.');
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
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
    const decoded = jwt.verify(token, JWT_SECRET!) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({
      success: false,
      message: 'Token inválido o expirado.'
    });
    return;
  }
}

export function requireRole(...roles: RolUsuario[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
