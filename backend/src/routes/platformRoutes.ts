import { Router } from 'express';
import { getPlatforms, createPlatform, updatePlatform, togglePlatformStatus, deletePlatform } from '../controllers/platformController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireRole('ADMIN', 'AGENTE', 'CONSULTA'), getPlatforms);
router.post('/', authenticateToken, requireRole('ADMIN'), createPlatform);
router.put('/:id', authenticateToken, requireRole('ADMIN'), updatePlatform);
router.patch('/:id/toggle-status', authenticateToken, requireRole('ADMIN'), togglePlatformStatus);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deletePlatform);

export default router;
