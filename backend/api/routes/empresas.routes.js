const express = require('express');
const router = express.Router();
const empresasController = require('../controllers/empresas.controller');
const { authenticate, authorize, checkEmpresaAccess } = require('../../middleware/authMiddleware');

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * @route   GET /api/empresas
 * @desc    Listar empresas (com paginação e busca)
 * @access  Admin only
 */
router.get('/',
    authorize('ADMIN_CONTABILIDADE'),
    empresasController.listEmpresas
);

/**
 * @route   GET /api/empresas/:id
 * @desc    Buscar empresa por ID ou CNPJ
 * @access  Admin ou própria empresa
 */
router.get('/:id',
    checkEmpresaAccess,
    empresasController.getEmpresa
);

/**
 * @route   POST /api/empresas
 * @desc    Cadastrar nova empresa
 * @access  Admin only
 */
router.post('/',
    authorize('ADMIN_CONTABILIDADE'),
    empresasController.createEmpresa
);

/**
 * @route   PUT /api/empresas/:id
 * @desc    Atualizar empresa
 * @access  Admin only
 */
router.put('/:id',
    authorize('ADMIN_CONTABILIDADE'),
    empresasController.updateEmpresa
);

/**
 * @route   DELETE /api/empresas/:id
 * @desc    Desativar empresa
 * @access  Admin only
 */
router.delete('/:id',
    authorize('ADMIN_CONTABILIDADE'),
    empresasController.deleteEmpresa
);

/**
 * @route   GET /api/empresas/:id/stats
 * @desc    Estatísticas da empresa
 * @access  Admin ou própria empresa
 */
router.get('/:id/stats',
    checkEmpresaAccess,
    empresasController.getEmpresaStats
);

module.exports = router;
