const { BlobServiceClient } = require('@azure/storage-blob');
const crypto = require('crypto');
const { logger } = require('../utils/logger');

// Inicializar cliente Azure Blob Storage
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'documentos-contabeis';

let blobServiceClient;
let containerClient;

if (connectionString) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(containerName);

    // Criar container se não existir
    containerClient.createIfNotExists({ access: 'private' })
        .then(() => logger.info('Azure Blob Storage container ready'))
        .catch(err => logger.error('Failed to create container:', err));
} else {
    logger.warn('Azure Storage not configured. File upload will be disabled.');
}

/**
 * Calcular hash SHA-256 do arquivo
 * @param {Buffer} buffer - Buffer do arquivo
 * @returns {string} Hash em hexadecimal
 */
const calculateHash = (buffer) => {
    return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Criptografar arquivo usando AES-256
 * @param {Buffer} buffer - Buffer do arquivo
 * @returns {object} { encrypted: Buffer, iv: string, key: string }
 */
const encryptFile = (buffer) => {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').substring(0, 32));
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

    return {
        encrypted,
        iv: iv.toString('hex'),
        key: key.toString('hex')
    };
};

/**
 * Descriptografar arquivo
 * @param {Buffer} encryptedBuffer - Buffer criptografado
 * @param {string} ivHex - IV em hexadecimal
 * @param {string} keyHex - Chave em hexadecimal
 * @returns {Buffer} Buffer descriptografado
 */
const decryptFile = (encryptedBuffer, ivHex, keyHex) => {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);

    return decrypted;
};

/**
 * Upload de arquivo para Azure Blob Storage
 * @param {Buffer} fileBuffer - Buffer do arquivo
 * @param {string} fileName - Nome do arquivo
 * @param {object} metadata - Metadados adicionais
 * @returns {Promise<string>} URL do blob
 */
const uploadFile = async (fileBuffer, fileName, metadata = {}) => {
    try {
        if (!containerClient) {
            throw new Error('Azure Storage não configurado');
        }

        // Gerar nome único para o blob
        const blobName = `${Date.now()}_${fileName}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Criptografar arquivo
        const { encrypted, iv, key } = encryptFile(fileBuffer);

        // Upload
        await blockBlobClient.upload(encrypted, encrypted.length, {
            metadata: {
                ...metadata,
                iv,
                encryptionKey: key,
                originalName: fileName
            }
        });

        const blobUrl = blockBlobClient.url;

        logger.info('File uploaded to Azure Blob Storage', {
            blobName,
            size: encrypted.length
        });

        return blobUrl;
    } catch (error) {
        logger.error('File upload error:', error);
        throw new Error('Falha no upload do arquivo');
    }
};

/**
 * Download de arquivo do Azure Blob Storage
 * @param {string} blobUrl - URL do blob
 * @returns {Promise<Buffer>} Buffer do arquivo descriptografado
 */
const downloadFile = async (blobUrl) => {
    try {
        if (!containerClient) {
            throw new Error('Azure Storage não configurado');
        }

        // Extrair nome do blob da URL
        const blobName = blobUrl.split('/').pop().split('?')[0];
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Download
        const downloadResponse = await blockBlobClient.download(0);
        const encryptedBuffer = await streamToBuffer(downloadResponse.readableStreamBody);

        // Obter metadados para descriptografar
        const properties = await blockBlobClient.getProperties();
        const { iv, encryptionKey } = properties.metadata;

        // Descriptografar
        const decrypted = decryptFile(encryptedBuffer, iv, encryptionKey);

        logger.info('File downloaded from Azure Blob Storage', { blobName });

        return decrypted;
    } catch (error) {
        logger.error('File download error:', error);
        throw new Error('Falha no download do arquivo');
    }
};

/**
 * Deletar arquivo do Azure Blob Storage
 * @param {string} blobUrl - URL do blob
 * @returns {Promise<boolean>} Sucesso
 */
const deleteFile = async (blobUrl) => {
    try {
        if (!containerClient) {
            throw new Error('Azure Storage não configurado');
        }

        const blobName = blobUrl.split('/').pop().split('?')[0];
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.delete();

        logger.info('File deleted from Azure Blob Storage', { blobName });

        return true;
    } catch (error) {
        logger.error('File deletion error:', error);
        throw new Error('Falha ao deletar arquivo');
    }
};

/**
 * Converter stream para buffer
 */
async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on('data', (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on('error', reject);
    });
}

module.exports = {
    calculateHash,
    encryptFile,
    decryptFile,
    uploadFile,
    downloadFile,
    deleteFile
};
