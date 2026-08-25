import { Router } from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  changeTicketStatus,
  deleteTicket,
  toggleTicketStatus
} from '../controllers/ticketController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Consulta de tickets: ADMIN y AGENTE
router.get('/', authenticateToken, requireRole('ADMIN', 'AGENTE'), getTickets);
router.get('/:id', authenticateToken, requireRole('ADMIN', 'AGENTE'), getTicketById);

// Creación: ADMIN y AGENTE
router.post('/', authenticateToken, requireRole('ADMIN', 'AGENTE'), createTicket);

// Actualización general: solo ADMIN
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateTicket);

// Cambio rápido de estado: ADMIN y AGENTE
router.patch('/:id/estado', authenticateToken, requireRole('ADMIN', 'AGENTE'), changeTicketStatus);

// Desactivar/Activar ticket: ADMIN y AGENTE
router.patch('/:id/toggle-status', authenticateToken, requireRole('ADMIN', 'AGENTE'), toggleTicketStatus);

// Eliminación: solo ADMIN
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteTicket);

export default router;
