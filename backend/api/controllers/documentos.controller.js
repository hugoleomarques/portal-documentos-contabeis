const multer = require('multer');
const { prisma } = require('../middleware/auditMiddleware');
const { addDocumentToQueue } = require('../jobs/documentProcessor.job');
const { downloadFile, calculateHash } = require('../services/storageService');
const { logger } = require('../utils/logger');

// Configurar multer para upload em memória
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 100 // Máximo 100 arquivos por vez
    },
    fileFilter: (req, file, cb) => {
        // Aceitar apenas PDFs
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos PDF são permitidos'));
        }
    }
});

/**
 * Upload em lote de documentos
 */
const uploadDocuments = async (req, res) => {
    try {
        const files = req.files;
        const { empresaId } = req.body;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        // Verificar se empresa existe
        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaId }
        });

        if (!empresa) {
            return res.status(404).json({ error: 'Empresa não encontrada' });
        }

        const uploadPor = req.user.nome;
        const results = [];

        // Processar cada arquivo
        for (const file of files) {
            try {
                // Criar registro inicial no banco
                const documento = await prisma.documento.create({
                    data: {
                        nomeOriginal: file.originalname,
                        nomeArquivo: file.originalname,
                        categoria: 'OUTROS', // Será atualizado pelo OCR
                        status: 'PROCESSANDO',
                        tamanhoBytes: file.size,
                        mimeType: file.mimetype,
                        hashSHA256: calculateHash(file.buffer),
                        blobUrl: '', // Será preenchido após upload
                        empresaId,
                        uploadPor
                    }
                });

                // Adicionar à fila de processamento
                const jobId = await addDocumentToQueue({
                    documentoId: documento.id,
                    fileBuffer: Array.from(file.buffer), // Converter Buffer para array
                    originalName: file.originalname,
                    empresaId,
                    uploadPor
                });

                results.push({
                    success: true,
                    documentoId: documento.id,
                    jobId,
                    fileName: file.originalname
                });

                logger.info('Document uploaded', {
                    documentoId: documento.id,
                    fileName: file.originalname,
                    size: file.size
                });
            } catch (error) {
                logger.error('Failed to upload document', {
                    fileName: file.originalname,
                    error: error.message
                });

                results.push({
                    success: false,
                    fileName: file.originalname,
                    error: error.message
                });
            }
        }

        res.status(201).json({
            message: `${results.filter(r => r.success).length} de ${files.length} arquivos enviados com sucesso`,
            results
        });
    } catch (error) {
        logger.error('Upload documents error:', error);
        res.status(500).json({ error: 'Erro ao fazer upload dos documentos' });
    }
};

/**
 * Listar documentos (com filtros)
 */
const listDocuments = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            empresaId,
            categoria,
            status,
            dataInicio,
            dataFim
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Construir filtros
        const where = {};

        // Se não for admin, filtrar pela empresa do usuário
        if (req.user.tipo !== 'ADMIN_CONTABILIDADE') {
            where.empresaId = req.user.empresaId;

            // RH só vê documentos de DP
            if (req.user.tipo === 'RH') {
                where.categoria = 'DP';
            }
        } else if (empresaId) {
            where.empresaId = empresaId;
        }

        if (categoria) {
            where.categoria = categoria;
        }

        if (status) {
            where.status = status;
        }

        if (dataInicio || dataFim) {
            where.createdAt = {};
            if (dataInicio) where.createdAt.gte = new Date(dataInicio);
            if (dataFim) where.createdAt.lte = new Date(dataFim);
        }

        // Buscar documentos
        const [documentos, total] = await Promise.all([
            prisma.documento.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    empresa: {
                        select: {
                            id: true,
                            razaoSocial: true,
                            cnpj: true
                        }
                    }
                }
            }),
            prisma.documento.count({ where })
        ]);

        res.json({
            documentos,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('List documents error:', error);
        res.status(500).json({ error: 'Erro ao listar documentos' });
    }
};

/**
 * Buscar documento por ID
 */
const getDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const documento = await prisma.documento.findUnique({
            where: { id },
            include: {
                empresa: true
            }
        });

        if (!documento) {
            return res.status(404).json({ error: 'Documento não encontrado' });
        }

        res.json({ documento });
    } catch (error) {
        logger.error('Get document error:', error);
        res.status(500).json({ error: 'Erro ao buscar documento' });
    }
};

/**
 * Download de documento (gera protocolo)
 */
const downloadDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const documento = req.documento; // Já validado pelo middleware

        // Buscar documento completo
        const doc = await prisma.documento.findUnique({
            where: { id }
        });

        // Download do arquivo
        const fileBuffer = await downloadFile(doc.blobUrl);

        // Criar protocolo de recebimento
        const protocolo = await prisma.protocolo.create({
            data: {
                documentoId: id,
                usuarioId: req.user.id,
                acao: 'DOWNLOAD',
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent') || 'Unknown',
                hashArquivo: doc.hashSHA256
            }
        });

        // Atualizar status do documento para VISUALIZADO
        if (doc.status === 'DISPONIVEL') {
            await prisma.documento.update({
                where: { id },
                data: { status: 'VISUALIZADO' }
            });
        }

        logger.info('Document downloaded', {
            documentoId: id,
            usuarioId: req.user.id,
            protocoloId: protocolo.id
        });

        // Enviar arquivo
        res.setHeader('Content-Type', doc.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${doc.nomeArquivo}"`);
        res.setHeader('X-Protocolo-Id', protocolo.id);
        res.send(fileBuffer);
    } catch (error) {
        logger.error('Download document error:', error);
        res.status(500).json({ error: 'Erro ao fazer download do documento' });
    }
};

/**
 * Buscar protocolo de documento
 */
const getProtocol = async (req, res) => {
    try {
        const { id } = req.params;

        const protocolos = await prisma.protocolo.findMany({
            where: { documentoId: id },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nome: true,
                        email: true
                    }
                },
                documento: {
                    select: {
                        id: true,
                        nomeArquivo: true,
                        categoria: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ protocolos });
    } catch (error) {
        logger.error('Get protocol error:', error);
        res.status(500).json({ error: 'Erro ao buscar protocolos' });
    }
};

/**
 * Deletar documento
 */
const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const documento = await prisma.documento.findUnique({
            where: { id }
        });

        if (!documento) {
            return res.status(404).json({ error: 'Documento não encontrado' });
        }

        // Deletar do storage
        if (documento.blobUrl) {
            await deleteFile(documento.blobUrl);
        }

        // Deletar do banco (cascade deleta protocolos)
        await prisma.documento.delete({
            where: { id }
        });

        logger.info('Document deleted', { documentoId: id });

        res.json({ message: 'Documento excluído com sucesso' });
    } catch (error) {
        logger.error('Delete document error:', error);
        res.status(500).json({ error: 'Erro ao excluir documento' });
    }
};

module.exports = {
    upload,
    uploadDocuments,
    listDocuments,
    getDocument,
    downloadDocument,
    getProtocol,
    deleteDocument
};
