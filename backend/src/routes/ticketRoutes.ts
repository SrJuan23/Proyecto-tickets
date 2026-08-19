import { Router } from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  changeTicketStatus,
  deleteTicket
} from '../controllers/ticketController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Consulta de tickets: ADMIN, AGENTE y CONSULTA
router.get('/', authenticateToken, requireRole('ADMIN', 'AGENTE', 'CONSULTA'), getTickets);
router.get('/:id', authenticateToken, requireRole('ADMIN', 'AGENTE', 'CONSULTA'), getTicketById);

// Creación: ADMIN y AGENTE
router.post('/', authenticateToken, requireRole('ADMIN', 'AGENTE'), createTicket);

// Actualización general: ADMIN y AGENTE
router.put('/:id', authenticateToken, requireRole('ADMIN', 'AGENTE'), updateTicket);

// Cambio rápido de estado: ADMIN y AGENTE
router.patch('/:id/estado', authenticateToken, requireRole('ADMIN', 'AGENTE'), changeTicketStatus);

// Eliminación: ADMIN y AGENTE
router.delete('/:id', authenticateToken, requireRole('ADMIN', 'AGENTE'), deleteTicket);

export default router;
