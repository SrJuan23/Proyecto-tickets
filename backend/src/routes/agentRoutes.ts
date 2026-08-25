import { Router } from 'express';
import { getAgents, createAgent, updateAgent, toggleAgentStatus } from '../controllers/agentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireRole('ADMIN', 'AGENTE', 'CONSULTA'), getAgents);
router.post('/', authenticateToken, requireRole('ADMIN', 'AGENTE'), createAgent);
router.put('/:id', authenticateToken, requireRole('ADMIN', 'AGENTE'), updateAgent);
router.patch('/:id/toggle-status', authenticateToken, requireRole('ADMIN', 'AGENTE'), toggleAgentStatus);

export default router;
