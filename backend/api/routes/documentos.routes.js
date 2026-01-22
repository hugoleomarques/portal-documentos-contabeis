const express = require('express');
const router = express.Router();
const documentosController = require('../controllers/documentos.controller');
const { authenticate, authorize, checkDocumentoAccess } = require('../../middleware/authMiddleware');

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * @route   POST /api/documentos/upload
 * @desc    Upload em lote de documentos
 * @access  Admin only
 */
router.post('/upload',
    authorize('ADMIN_CONTABILIDADE'),
    documentosController.upload.array('files', 100),
    documentosController.uploadDocuments
);

/**
 * @route   GET /api/documentos
 * @desc    Listar documentos (com filtros)
 * @access  Private (filtrado por empresa)
 */
router.get('/',
    documentosController.listDocuments
);

/**
 * @route   GET /api/documentos/:id
 * @desc    Buscar documento por ID
 * @access  Private (validado por checkDocumentoAccess)
 */
router.get('/:id',
    checkDocumentoAccess,
    documentosController.getDocument
);

/**
 * @route   GET /api/documentos/:id/download
 * @desc    Download de documento (gera protocolo)
 * @access  Private (validado por checkDocumentoAccess)
 */
router.get('/:id/download',
    checkDocumentoAccess,
    documentosController.downloadDocument
);

/**
 * @route   GET /api/documentos/:id/protocolo
 * @desc    Buscar protocolos de um documento
 * @access  Private (validado por checkDocumentoAccess)
 */
router.get('/:id/protocolo',
    checkDocumentoAccess,
    documentosController.getProtocol
);

/**
 * @route   DELETE /api/documentos/:id
 * @desc    Deletar documento
 * @access  Admin only
 */
router.delete('/:id',
    authorize('ADMIN_CONTABILIDADE'),
    documentosController.deleteDocument
);

module.exports = router;
