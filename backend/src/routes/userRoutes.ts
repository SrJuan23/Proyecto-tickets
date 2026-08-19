import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/configController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Todas las rutas de administración de usuarios requieren rol ADMIN
router.use(authenticateToken, requireRole('ADMIN'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
