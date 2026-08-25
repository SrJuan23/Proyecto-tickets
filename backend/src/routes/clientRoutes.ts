import { Router } from 'express';
import { getClients, createClient, updateClient, toggleClientStatus, deleteClient } from '../controllers/clientController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireRole('ADMIN', 'AGENTE', 'CONSULTA'), getClients);
router.post('/', authenticateToken, requireRole('ADMIN'), createClient);
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateClient);
router.patch('/:id/toggle-status', authenticateToken, requireRole('ADMIN'), toggleClientStatus);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteClient);

export default router;
