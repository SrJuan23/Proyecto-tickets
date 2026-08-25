import { Router } from 'express';
import { getAgents, createAgent, updateAgent, toggleAgentStatus } from '../controllers/agentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireRole('ADMIN'), getAgents);
router.post('/', authenticateToken, requireRole('ADMIN'), createAgent);
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateAgent);
router.patch('/:id/toggle-status', authenticateToken, requireRole('ADMIN'), toggleAgentStatus);

export default router;
