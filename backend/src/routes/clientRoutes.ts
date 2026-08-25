import { Router } from 'express';
import { getClients, createClient, updateClient, toggleClientStatus } from '../controllers/clientController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireRole('ADMIN', 'AGENTE', 'CONSULTA'), getClients);
router.post('/', authenticateToken, requireRole('ADMIN', 'AGENTE'), createClient);
router.put('/:id', authenticateToken, requireRole('ADMIN', 'AGENTE'), updateClient);
router.patch('/:id/toggle-status', authenticateToken, requireRole('ADMIN', 'AGENTE'), toggleClientStatus);

export default router;
