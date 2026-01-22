const { Queue, Worker } = require('bullmq');
const { prisma } = require('../middleware/auditMiddleware');
const { processDocument } = require('../services/ocrService');
const { uploadFile, calculateHash } = require('../services/storageService');
const { logger } = require('../utils/logger');

// Configuração do Redis
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined
};

// Criar fila de processamento de documentos
const documentQueue = new Queue('document-processing', { connection });

/**
 * Adicionar documento à fila de processamento
 * @param {object} jobData - Dados do job
 */
const addDocumentToQueue = async (jobData) => {
    try {
        const job = await documentQueue.add('process-document', jobData, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000
            }
        });

        logger.info('Document added to processing queue', { jobId: job.id });
        return job.id;
    } catch (error) {
        logger.error('Failed to add document to queue:', error);
        throw error;
    }
};

/**
 * Worker para processar documentos
 */
const documentWorker = new Worker('document-processing', async (job) => {
    const { documentoId, fileBuffer, originalName, empresaId, uploadPor } = job.data;

    try {
        logger.info('Processing document', { documentoId, jobId: job.id });

        // 1. Processar OCR
        const ocrResult = await processDocument(Buffer.from(fileBuffer), originalName);

        // 2. Calcular hash
        const hashSHA256 = calculateHash(Buffer.from(fileBuffer));

        // 3. Upload para Azure Blob Storage
        const blobUrl = await uploadFile(
            Buffer.from(fileBuffer),
            ocrResult.nomeArquivo,
            {
                empresaId,
                categoria: ocrResult.categoria,
                cnpj: ocrResult.cnpjDetectado || 'unknown'
            }
        );

        // 4. Atualizar documento no banco
        const documento = await prisma.documento.update({
            where: { id: documentoId },
            data: {
                nomeArquivo: ocrResult.nomeArquivo,
                categoria: ocrResult.categoria,
                status: 'DISPONIVEL',
                cnpjDetectado: ocrResult.cnpjDetectado,
                confiancaOCR: ocrResult.confiancaOCR,
                textoExtraido: ocrResult.textoExtraido,
                blobUrl,
                hashSHA256,
                criptografado: true
            }
        });

        // 5. Se CNPJ foi detectado mas não bate com a empresa, atualizar
        if (ocrResult.cnpjDetectado) {
            const empresaCorreta = await prisma.empresa.findUnique({
                where: { cnpj: ocrResult.cnpjDetectado }
            });

            if (empresaCorreta && empresaCorreta.id !== empresaId) {
                await prisma.documento.update({
                    where: { id: documentoId },
                    data: { empresaId: empresaCorreta.id }
                });

                logger.info('Document reassigned to correct empresa', {
                    documentoId,
                    oldEmpresaId: empresaId,
                    newEmpresaId: empresaCorreta.id
                });
            }
        }

        // 6. TODO: Enviar notificação para a empresa
        // await notificationService.notifyNewDocument(documento);

        logger.info('Document processed successfully', {
            documentoId,
            categoria: ocrResult.categoria,
            cnpj: ocrResult.cnpjDetectado
        });

        return { success: true, documento };
    } catch (error) {
        logger.error('Document processing failed', {
            documentoId,
            error: error.message
        });

        // Marcar documento como erro
        await prisma.documento.update({
            where: { id: documentoId },
            data: { status: 'ERRO_PROCESSAMENTO' }
        });

        throw error;
    }
}, { connection });

// Event listeners
documentWorker.on('completed', (job) => {
    logger.info('Job completed', { jobId: job.id });
});

documentWorker.on('failed', (job, err) => {
    logger.error('Job failed', { jobId: job?.id, error: err.message });
});

module.exports = {
    documentQueue,
    documentWorker,
    addDocumentToQueue
};
