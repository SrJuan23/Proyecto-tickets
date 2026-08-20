"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ticketController_1 = require("../controllers/ticketController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Consulta de tickets: ADMIN, AGENTE y CONSULTA
router.get('/', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN', 'AGENTE', 'CONSULTA'), ticketController_1.getTickets);
router.get('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN', 'AGENTE', 'CONSULTA'), ticketController_1.getTicketById);
// Creación: ADMIN y AGENTE
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN', 'AGENTE'), ticketController_1.createTicket);
// Actualización general: ADMIN y AGENTE
router.put('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN', 'AGENTE'), ticketController_1.updateTicket);
// Cambio rápido de estado: ADMIN y AGENTE
router.patch('/:id/estado', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN', 'AGENTE'), ticketController_1.changeTicketStatus);
// Eliminación: ADMIN y AGENTE
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN', 'AGENTE'), ticketController_1.deleteTicket);
exports.default = router;
