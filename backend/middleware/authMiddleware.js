const jwt = require('jsonwebtoken');
const { prisma } = require('./auditMiddleware');
const { logger } = require('../utils/logger');

/**
 * Gera token JWT
 */
const generateToken = (userId, type = 'access') => {
    const secret = type === 'access' ? process.env.JWT_SECRET : process.env.REFRESH_TOKEN_SECRET;
    const expiresIn = type === 'access' ? process.env.JWT_EXPIRES_IN : process.env.REFRESH_TOKEN_EXPIRES_IN;

    return jwt.sign({ userId, type }, secret, { expiresIn });
};

/**
 * Middleware de autenticação
 * Verifica se o token JWT é válido
 */
const authenticate = async (req, res, next) => {
    try {
        // Extrair token do header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        const token = authHeader.substring(7);

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'access') {
            return res.status(401).json({ error: 'Token inválido' });
        }

        // Buscar usuário
        const usuario = await prisma.usuario.findUnique({
            where: { id: decoded.userId },
            include: { empresa: true }
        });

        if (!usuario || !usuario.ativo) {
            return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
        }

        // Anexar usuário à requisição
        req.user = usuario;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }

        logger.error('Authentication error:', error);
        return res.status(500).json({ error: 'Erro na autenticação' });
    }
};

/**
 * Middleware de autorização por tipo de usuário
 * @param {Array<string>} tiposPermitidos - Tipos de usuário permitidos
 */
const authorize = (...tiposPermitidos) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Não autenticado' });
        }

        if (!tiposPermitidos.includes(req.user.tipo)) {
            logger.warn('Unauthorized access attempt', {
                userId: req.user.id,
                userType: req.user.tipo,
                requiredTypes: tiposPermitidos,
                path: req.path
            });

            return res.status(403).json({
                error: 'Acesso negado. Permissões insuficientes.'
            });
        }

        next();
    };
};

/**
 * Middleware para verificar se o usuário pertence à empresa
 * Usado para garantir que clientes só acessem dados da própria empresa
 */
const checkEmpresaAccess = (req, res, next) => {
    const { empresaId } = req.params;

    // Admin da contabilidade pode acessar qualquer empresa
    if (req.user.tipo === 'ADMIN_CONTABILIDADE') {
        return next();
    }

    // Usuários de empresa só podem acessar sua própria empresa
    if (req.user.empresaId !== empresaId) {
        logger.warn('Unauthorized empresa access attempt', {
            userId: req.user.id,
            userEmpresaId: req.user.empresaId,
            requestedEmpresaId: empresaId
        });

        return res.status(403).json({
            error: 'Acesso negado. Você não tem permissão para acessar esta empresa.'
        });
    }

    next();
};

/**
 * Middleware para verificar acesso a documento
 * Garante que usuários só acessem documentos da própria empresa
 */
const checkDocumentoAccess = async (req, res, next) => {
    try {
        const { id } = req.params;

        const documento = await prisma.documento.findUnique({
            where: { id },
            select: { empresaId: true, categoria: true }
        });

        if (!documento) {
            return res.status(404).json({ error: 'Documento não encontrado' });
        }

        // Admin da contabilidade pode acessar qualquer documento
        if (req.user.tipo === 'ADMIN_CONTABILIDADE') {
            return next();
        }

        // Verificar se o documento pertence à empresa do usuário
        if (documento.empresaId !== req.user.empresaId) {
            logger.warn('Unauthorized documento access attempt', {
                userId: req.user.id,
                userEmpresaId: req.user.empresaId,
                documentoEmpresaId: documento.empresaId,
                documentoId: id
            });

            return res.status(403).json({
                error: 'Acesso negado. Este documento não pertence à sua empresa.'
            });
        }

        // Verificar permissões por tipo de usuário e categoria
        if (req.user.tipo === 'RH' && documento.categoria !== 'DP') {
            return res.status(403).json({
                error: 'Acesso negado. Você só pode acessar documentos de DP.'
            });
        }

        // Anexar documento à requisição para evitar nova consulta
        req.documento = documento;
        next();
    } catch (error) {
        logger.error('Error checking documento access:', error);
        return res.status(500).json({ error: 'Erro ao verificar permissões' });
    }
};

module.exports = {
    generateToken,
    authenticate,
    authorize,
    checkEmpresaAccess,
    checkDocumentoAccess
};
