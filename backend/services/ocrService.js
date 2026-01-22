const { DocumentAnalysisClient, AzureKeyCredential } = require('@azure/ai-form-recognizer');
const { logger } = require('../utils/logger');

// Inicializar cliente Azure AI
const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
const apiKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

let client;
if (endpoint && apiKey) {
    client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));
} else {
    logger.warn('Azure Document Intelligence not configured. OCR features will be disabled.');
}

/**
 * Extrair texto de PDF usando Azure AI Document Intelligence
 * @param {Buffer} fileBuffer - Buffer do arquivo PDF
 * @returns {Promise<string>} Texto extraído
 */
const extractTextFromPDF = async (fileBuffer) => {
    try {
        if (!client) {
            throw new Error('Azure Document Intelligence não configurado');
        }

        // Analisar documento
        const poller = await client.beginAnalyzeDocument('prebuilt-read', fileBuffer);
        const result = await poller.pollUntilDone();

        // Extrair todo o texto
        let fullText = '';
        if (result.content) {
            fullText = result.content;
        }

        logger.info('OCR completed', {
            pages: result.pages?.length || 0,
            textLength: fullText.length
        });

        return fullText;
    } catch (error) {
        logger.error('OCR extraction error:', error);
        throw new Error('Falha na extração de texto do documento');
    }
};

/**
 * Extrair CNPJ do texto usando regex
 * @param {string} text - Texto extraído
 * @returns {string|null} CNPJ encontrado (apenas números)
 */
const extractCNPJ = (text) => {
    // Padrões de CNPJ: 00.000.000/0000-00 ou 00000000000000
    const patterns = [
        /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g,  // Formatado
        /\b\d{14}\b/g                          // Apenas números
    ];

    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
            // Remover formatação e retornar apenas números
            const cnpj = matches[0].replace(/\D/g, '');

            // Validar se tem 14 dígitos
            if (cnpj.length === 14) {
                logger.info('CNPJ detected', { cnpj });
                return cnpj;
            }
        }
    }

    logger.warn('No CNPJ found in document');
    return null;
};

/**
 * Classificar documento por palavras-chave
 * @param {string} text - Texto extraído
 * @returns {object} { categoria, confianca, palavrasEncontradas }
 */
const classifyDocument = (text) => {
    const textLower = text.toLowerCase();

    // Regras de classificação (ordem de prioridade)
    const rules = [
        {
            categoria: 'FISCAL',
            keywords: [
                'simples nacional',
                'das',
                'darf',
                'guia de recolhimento',
                'imposto de renda',
                'icms',
                'iss',
                'pis',
                'cofins',
                'nota fiscal'
            ]
        },
        {
            categoria: 'DP',
            keywords: [
                'fgts',
                'holerite',
                'folha de pagamento',
                'contracheque',
                'inss',
                'férias',
                'rescisão',
                'admissão',
                'caged',
                'esocial'
            ]
        },
        {
            categoria: 'CONTABIL',
            keywords: [
                'balancete',
                'balanço patrimonial',
                'dre',
                'demonstração do resultado',
                'razão contábil',
                'livro diário',
                'plano de contas'
            ]
        },
        {
            categoria: 'CERTIDOES',
            keywords: [
                'certidão',
                'certidao',
                'negativa',
                'positiva com efeito',
                'regularidade fiscal',
                'débitos'
            ]
        }
    ];

    let bestMatch = {
        categoria: 'OUTROS',
        confianca: 0,
        palavrasEncontradas: []
    };

    for (const rule of rules) {
        const foundKeywords = rule.keywords.filter(keyword =>
            textLower.includes(keyword)
        );

        if (foundKeywords.length > 0) {
            const confianca = foundKeywords.length / rule.keywords.length;

            if (confianca > bestMatch.confianca) {
                bestMatch = {
                    categoria: rule.categoria,
                    confianca,
                    palavrasEncontradas: foundKeywords
                };
            }
        }
    }

    logger.info('Document classified', {
        categoria: bestMatch.categoria,
        confianca: bestMatch.confianca,
        palavrasEncontradas: bestMatch.palavrasEncontradas
    });

    return bestMatch;
};

/**
 * Gerar nome de arquivo padronizado
 * @param {string} categoria - Categoria do documento
 * @param {string} cnpj - CNPJ da empresa
 * @param {string} originalName - Nome original do arquivo
 * @returns {string} Nome padronizado: AAAAMMDD_TipoDocumento_CNPJ.pdf
 */
const generateStandardFileName = (categoria, cnpj, originalName) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const datePrefix = `${year}${month}${day}`;
    const extension = originalName.split('.').pop();

    return `${datePrefix}_${categoria}_${cnpj}.${extension}`;
};

/**
 * Processar documento completo (OCR + Classificação)
 * @param {Buffer} fileBuffer - Buffer do arquivo
 * @param {string} originalName - Nome original
 * @returns {Promise<object>} Resultado do processamento
 */
const processDocument = async (fileBuffer, originalName) => {
    try {
        // 1. Extrair texto
        const text = await extractTextFromPDF(fileBuffer);

        // 2. Extrair CNPJ
        const cnpj = extractCNPJ(text);

        // 3. Classificar documento
        const classification = classifyDocument(text);

        // 4. Gerar nome padronizado
        let standardName = originalName;
        if (cnpj && classification.categoria !== 'OUTROS') {
            standardName = generateStandardFileName(
                classification.categoria,
                cnpj,
                originalName
            );
        }

        return {
            textoExtraido: text.substring(0, 5000), // Limitar para não sobrecarregar DB
            cnpjDetectado: cnpj,
            categoria: classification.categoria,
            confiancaOCR: classification.confianca,
            nomeArquivo: standardName,
            palavrasChave: classification.palavrasEncontradas
        };
    } catch (error) {
        logger.error('Document processing error:', error);
        throw error;
    }
};

module.exports = {
    extractTextFromPDF,
    extractCNPJ,
    classifyDocument,
    generateStandardFileName,
    processDocument
};
