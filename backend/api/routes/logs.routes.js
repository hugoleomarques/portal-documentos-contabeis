const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logs.controller');
const { authenticate, authorize } = require('../../middleware/authMiddleware');

// Todas as rotas requerem autenticação e são apenas para admin
router.use(authenticate);
router.use(authorize('ADMIN_CONTABILIDADE'));

/**
 * @route   GET /api/logs
 * @desc    Listar logs de auditoria
 * @access  Admin only
 */
router.get('/', logsController.listLogs);

/**
 * @route   GET /api/logs/export
 * @desc    Exportar logs em CSV
 * @access  Admin only
 */
router.get('/export', logsController.exportLogs);

/**
 * @route   GET /api/logs/stats
 * @desc    Estatísticas de logs
 * @access  Admin only
 */
router.get('/stats', logsController.getLogsStats);

module.exports = router;
