import { Router } from 'express';
import { getPlatforms, createPlatform, updatePlatform, togglePlatformStatus } from '../controllers/platformController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireRole('ADMIN', 'AGENTE', 'CONSULTA'), getPlatforms);
router.post('/', authenticateToken, requireRole('ADMIN', 'AGENTE'), createPlatform);
router.put('/:id', authenticateToken, requireRole('ADMIN', 'AGENTE'), updatePlatform);
router.patch('/:id/toggle-status', authenticateToken, requireRole('ADMIN', 'AGENTE'), togglePlatformStatus);

export default router;
