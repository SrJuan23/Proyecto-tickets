"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exportController_1 = require("../controllers/exportController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/excel', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN', 'AGENTE', 'CONSULTA'), exportController_1.exportExcel);
router.get('/csv', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN', 'AGENTE', 'CONSULTA'), exportController_1.exportCsv);
exports.default = router;
