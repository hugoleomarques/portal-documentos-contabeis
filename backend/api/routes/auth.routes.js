const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../../middleware/authMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Registrar novo usuário
 * @access  Public (mas pode ser restrito a admin em produção)
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuário
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar access token
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   GET /api/auth/me
 * @desc    Obter dados do usuário logado
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   POST /api/auth/2fa/enable
 * @desc    Habilitar 2FA
 * @access  Private
 */
router.post('/2fa/enable', authenticate, authController.enable2FA);

/**
 * @route   POST /api/auth/2fa/verify
 * @desc    Verificar e ativar 2FA
 * @access  Private
 */
router.post('/2fa/verify', authenticate, authController.verify2FA);

/**
 * @route   POST /api/auth/2fa/disable
 * @desc    Desabilitar 2FA
 * @access  Private
 */
router.post('/2fa/disable', authenticate, authController.disable2FA);

module.exports = router;
