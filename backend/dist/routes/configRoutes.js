"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const configController_1 = require("../controllers/configController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN', 'AGENTE', 'CONSULTA'), configController_1.getConfig);
router.put('/:clave', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN'), configController_1.updateConfig);
exports.default = router;
