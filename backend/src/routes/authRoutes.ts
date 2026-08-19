import { Router } from 'express';
import { login, getMe, getDemoAccounts } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

router.post('/login', [
  body('email').isEmail().withMessage('Debe proporcionar un correo electrónico válido.'),
  body('password').isLength({ min: 1 }).withMessage('La contraseña es obligatoria.')
], login);

router.get('/me', authenticateToken, getMe);
router.get('/demo-accounts', getDemoAccounts);

export default router;
