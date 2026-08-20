"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Debe proporcionar un correo electrónico válido.'),
    (0, express_validator_1.body)('password').isLength({ min: 1 }).withMessage('La contraseña es obligatoria.')
], authController_1.login);
router.get('/me', auth_1.authenticateToken, authController_1.getMe);
router.get('/demo-accounts', authController_1.getDemoAccounts);
exports.default = router;
