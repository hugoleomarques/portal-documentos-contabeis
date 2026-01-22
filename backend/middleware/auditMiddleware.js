const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient({
    log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' }
    ]
});

// Log de queries (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
        logger.debug('Query:', { query: e.query, params: e.params, duration: e.duration });
    });
}

prisma.$on('error', (e) => {
    logger.error('Prisma error:', { message: e.message, target: e.target });
});

prisma.$on('warn', (e) => {
    logger.warn('Prisma warning:', { message: e.message });
});

/**
 * Middleware de auditoria LGPD
 * Registra TODAS as requisições no banco de dados
 */
const auditMiddleware = async (req, res, next) => {
    const startTime = Date.now();

    // Capturar resposta
    const originalSend = res.send;
    let responseBody;

    res.send = function (data) {
        responseBody = data;
        originalSend.call(this, data);
    };

    // Quando a resposta terminar
    res.on('finish', async () => {
        try {
            // Ignorar rotas de health check e assets
            if (req.path === '/health' || req.path.startsWith('/static')) {
                return;
            }

            const duration = Date.now() - startTime;
            const userId = req.user?.id || null; // Será preenchido após autenticação
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('user-agent') || 'Unknown';

            // Mapear método HTTP para tipo de ação
            const acaoMap = {
                'POST /api/auth/login': 'LOGIN',
                'POST /api/auth/logout': 'LOGOUT',
                'POST /api/documentos/upload': 'UPLOAD_DOCUMENTO',
                'GET /api/documentos/:id/download': 'DOWNLOAD_DOCUMENTO',
                'GET /api/documentos/:id': 'VISUALIZACAO_DOCUMENTO',
                'DELETE /api/documentos/:id': 'EXCLUSAO_DOCUMENTO',
                'POST /api/empresas': 'CADASTRO_EMPRESA',
                'PUT /api/empresas/:id': 'EDICAO_EMPRESA',
                'DELETE /api/empresas/:id': 'EXCLUSAO_EMPRESA',
                'POST /api/usuarios': 'CADASTRO_USUARIO',
                'PUT /api/usuarios/:id': 'EDICAO_USUARIO',
                'DELETE /api/usuarios/:id': 'EXCLUSAO_USUARIO',
                'GET /api/logs': 'ACESSO_LOGS'
            };

            // Determinar tipo de ação
            let acao = 'OUTROS';
            const routeKey = `${req.method} ${req.route?.path || req.path}`;

            for (const [pattern, tipoAcao] of Object.entries(acaoMap)) {
                if (routeKey.includes(pattern.split(' ')[1])) {
                    acao = tipoAcao;
                    break;
                }
            }

            // Criar log no banco
            await prisma.log.create({
                data: {
                    usuarioId: userId,
                    acao: acao,
                    descricao: `${req.method} ${req.path}`,
                    recurso: req.params.id || null,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    sucesso: res.statusCode < 400,
                    mensagemErro: res.statusCode >= 400 ? responseBody : null
                }
            });

            logger.info('Audit log created', {
                userId,
                acao,
                path: req.path,
                statusCode: res.statusCode,
                duration: `${duration}ms`
            });
        } catch (error) {
            // Não bloquear a requisição se o log falhar
            logger.error('Failed to create audit log:', error);
        }
    });

    next();
};

module.exports = { auditMiddleware, prisma };
