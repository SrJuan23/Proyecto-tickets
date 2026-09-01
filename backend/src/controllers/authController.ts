import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { db } from '../services/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../services/logger';

const JWT_SECRET = process.env.JWT_SECRET || null;

if (!JWT_SECRET) {
  logger.warn('JWT_SECRET no está definido en el archivo .env. Operaciones que requieran firmar JWT fallarán.');
}

const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const errors = validationResult(req);
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

    const user = await db.get('SELECT * FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);

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

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
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

    if (!JWT_SECRET) {
    res.status(500).json({ success: false, message: 'JWT_SECRET no configurado en el servidor.' });
    return;
  }
  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);

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
          fecha_creacion: user.fecha_creacion,
          password_change_required: user.password_change_required
        }
      }
    });
  } catch (error: any) {
    logger.error('Error en login', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error en el servidor durante el inicio de sesión.', error: error.message });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'No autenticado.' });
      return;
    }

    const user = await db.get(
      'SELECT id, nombre, email, rol, estado, avatar_url, fecha_creacion FROM usuarios WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener datos del usuario.', error: error.message });
  }
}

export async function getDemoAccounts(req: Request, res: Response): Promise<void> {
  try {
    const users = await db.query(
      "SELECT id, nombre, email, rol, estado FROM usuarios WHERE estado = 'ACTIVO'"
    );
    res.json({
      success: true,
      data: users
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al consultar cuentas demo.', error: error.message });
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'No autenticado.' });
      return;
    }

    const { current_password, new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    const user = await db.get('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);
    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      return;
    }

    if (current_password) {
      const isValid = await bcrypt.compare(current_password, user.password_hash);
      if (!isValid) {
        res.status(400).json({ success: false, message: 'La contraseña actual es incorrecta.' });
        return;
      }
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await db.run(
      'UPDATE usuarios SET password_hash = ?, password_change_required = false WHERE id = ?',
      [newHash, req.user.id]
    );

    res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (error: any) {
    logger.error('Error al cambiar contraseña', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al cambiar contraseña.', error: error.message });
  }
}
