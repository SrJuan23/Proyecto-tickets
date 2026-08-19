import { Router } from 'express';
import { getKPIs, getCharts } from '../controllers/statsController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/kpis', authenticateToken, requireRole('ADMIN', 'AGENTE', 'CONSULTA'), getKPIs);
router.get('/charts', authenticateToken, requireRole('ADMIN', 'AGENTE', 'CONSULTA'), getCharts);

export default router;
