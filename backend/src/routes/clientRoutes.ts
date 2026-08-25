import { Router } from 'express';
import { getClients, createClient, updateClient, toggleClientStatus } from '../controllers/clientController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireRole('ADMIN'), getClients);
router.post('/', authenticateToken, requireRole('ADMIN'), createClient);
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateClient);
router.patch('/:id/toggle-status', authenticateToken, requireRole('ADMIN'), toggleClientStatus);

export default router;
