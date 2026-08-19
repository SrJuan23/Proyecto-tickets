import { Router } from 'express';
import { exportExcel, exportCsv } from '../controllers/exportController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/excel', authenticateToken, requireRole('ADMIN', 'AGENTE', 'CONSULTA'), exportExcel);
router.get('/csv', authenticateToken, requireRole('ADMIN', 'AGENTE', 'CONSULTA'), exportCsv);

export default router;
