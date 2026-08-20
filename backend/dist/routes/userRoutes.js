"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const configController_1 = require("../controllers/configController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Todas las rutas de administración de usuarios requieren rol ADMIN
router.use(auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN'));
router.get('/', configController_1.getUsers);
router.post('/', configController_1.createUser);
router.put('/:id', configController_1.updateUser);
router.delete('/:id', configController_1.deleteUser);
exports.default = router;
