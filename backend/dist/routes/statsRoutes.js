"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statsController_1 = require("../controllers/statsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/kpis', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN', 'AGENTE', 'CONSULTA'), statsController_1.getKPIs);
router.get('/charts', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN', 'AGENTE', 'CONSULTA'), statsController_1.getCharts);
exports.default = router;
