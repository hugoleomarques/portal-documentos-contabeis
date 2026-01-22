const { prisma } = require('../middleware/auditMiddleware');
const { logger } = require('../utils/logger');

/**
 * Listar logs de auditoria
 */
const listLogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            usuarioId,
            acao,
            dataInicio,
            dataFim,
            sucesso
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Construir filtros
        const where = {};

        if (usuarioId) {
            where.usuarioId = usuarioId;
        }

        if (acao) {
            where.acao = acao;
        }

        if (sucesso !== undefined) {
            where.sucesso = sucesso === 'true';
        }

        if (dataInicio || dataFim) {
            where.createdAt = {};
            if (dataInicio) where.createdAt.gte = new Date(dataInicio);
            if (dataFim) where.createdAt.lte = new Date(dataFim);
        }

        // Buscar logs
        const [logs, total] = await Promise.all([
            prisma.log.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    usuario: {
                        select: {
                            id: true,
                            nome: true,
                            email: true,
                            tipo: true
                        }
                    }
                }
            }),
            prisma.log.count({ where })
        ]);

        res.json({
            logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('List logs error:', error);
        res.status(500).json({ error: 'Erro ao listar logs' });
    }
};

/**
 * Exportar logs em CSV
 */
const exportLogs = async (req, res) => {
    try {
        const { dataInicio, dataFim } = req.query;

        const where = {};
        if (dataInicio || dataFim) {
            where.createdAt = {};
            if (dataInicio) where.createdAt.gte = new Date(dataInicio);
            if (dataFim) where.createdAt.lte = new Date(dataFim);
        }

        const logs = await prisma.log.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                usuario: {
                    select: {
                        nome: true,
                        email: true,
                        tipo: true
                    }
                }
            }
        });

        // Gerar CSV
        const csvHeader = 'Data/Hora,Usuário,Email,Tipo,Ação,Descrição,Recurso,IP,Sucesso\n';
        const csvRows = logs.map(log => {
            return [
                log.createdAt.toISOString(),
                log.usuario?.nome || 'N/A',
                log.usuario?.email || 'N/A',
                log.usuario?.tipo || 'N/A',
                log.acao,
                `"${log.descricao}"`,
                log.recurso || 'N/A',
                log.ipAddress,
                log.sucesso ? 'Sim' : 'Não'
            ].join(',');
        }).join('\n');

        const csv = csvHeader + csvRows;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="logs_${Date.now()}.csv"`);
        res.send('\uFEFF' + csv); // BOM para UTF-8

        logger.info('Logs exported', { count: logs.length, userId: req.user.id });
    } catch (error) {
        logger.error('Export logs error:', error);
        res.status(500).json({ error: 'Erro ao exportar logs' });
    }
};

/**
 * Estatísticas de logs
 */
const getLogsStats = async (req, res) => {
    try {
        const { dataInicio, dataFim } = req.query;

        const where = {};
        if (dataInicio || dataFim) {
            where.createdAt = {};
            if (dataInicio) where.createdAt.gte = new Date(dataInicio);
            if (dataFim) where.createdAt.lte = new Date(dataFim);
        }

        const [porAcao, porSucesso, total] = await Promise.all([
            prisma.log.groupBy({
                by: ['acao'],
                where,
                _count: true
            }),
            prisma.log.groupBy({
                by: ['sucesso'],
                where,
                _count: true
            }),
            prisma.log.count({ where })
        ]);

        const stats = {
            total,
            porAcao: Object.fromEntries(porAcao.map(s => [s.acao, s._count])),
            porSucesso: Object.fromEntries(porSucesso.map(s => [s.sucesso ? 'sucesso' : 'falha', s._count]))
        };

        res.json({ stats });
    } catch (error) {
        logger.error('Get logs stats error:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
};

module.exports = {
    listLogs,
    exportLogs,
    getLogsStats
};
