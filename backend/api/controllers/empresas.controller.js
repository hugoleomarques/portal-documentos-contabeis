const { prisma } = require('../middleware/auditMiddleware');
const { logger } = require('../utils/logger');

/**
 * Listar todas as empresas (com paginação)
 */
const listEmpresas = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', ativo } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Construir filtros
        const where = {};

        if (search) {
            where.OR = [
                { razaoSocial: { contains: search, mode: 'insensitive' } },
                { cnpj: { contains: search } },
                { nomeFantasia: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (ativo !== undefined) {
            where.ativo = ativo === 'true';
        }

        // Buscar empresas
        const [empresas, total] = await Promise.all([
            prisma.empresa.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { razaoSocial: 'asc' },
                select: {
                    id: true,
                    cnpj: true,
                    razaoSocial: true,
                    nomeFantasia: true,
                    email: true,
                    telefone: true,
                    ativo: true,
                    createdAt: true,
                    _count: {
                        select: {
                            usuarios: true,
                            documentos: true
                        }
                    }
                }
            }),
            prisma.empresa.count({ where })
        ]);

        res.json({
            empresas,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('List empresas error:', error);
        res.status(500).json({ error: 'Erro ao listar empresas' });
    }
};

/**
 * Buscar empresa por ID ou CNPJ
 */
const getEmpresa = async (req, res) => {
    try {
        const { id } = req.params;

        // Tentar buscar por ID ou CNPJ
        const empresa = await prisma.empresa.findFirst({
            where: {
                OR: [
                    { id },
                    { cnpj: id }
                ]
            },
            include: {
                usuarios: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        tipo: true,
                        ativo: true
                    }
                },
                _count: {
                    select: {
                        documentos: true
                    }
                }
            }
        });

        if (!empresa) {
            return res.status(404).json({ error: 'Empresa não encontrada' });
        }

        res.json({ empresa });
    } catch (error) {
        logger.error('Get empresa error:', error);
        res.status(500).json({ error: 'Erro ao buscar empresa' });
    }
};

/**
 * Criar nova empresa
 */
const createEmpresa = async (req, res) => {
    try {
        const { cnpj, razaoSocial, nomeFantasia, email, telefone } = req.body;

        // Validar se CNPJ já existe
        const existingEmpresa = await prisma.empresa.findUnique({
            where: { cnpj }
        });

        if (existingEmpresa) {
            return res.status(400).json({ error: 'CNPJ já cadastrado' });
        }

        // Criar empresa
        const empresa = await prisma.empresa.create({
            data: {
                cnpj,
                razaoSocial,
                nomeFantasia,
                email,
                telefone
            }
        });

        logger.info('Empresa created', { empresaId: empresa.id, cnpj: empresa.cnpj });

        res.status(201).json({
            message: 'Empresa cadastrada com sucesso',
            empresa
        });
    } catch (error) {
        logger.error('Create empresa error:', error);
        res.status(500).json({ error: 'Erro ao cadastrar empresa' });
    }
};

/**
 * Atualizar empresa
 */
const updateEmpresa = async (req, res) => {
    try {
        const { id } = req.params;
        const { razaoSocial, nomeFantasia, email, telefone } = req.body;

        // Verificar se empresa existe
        const empresaExistente = await prisma.empresa.findUnique({
            where: { id }
        });

        if (!empresaExistente) {
            return res.status(404).json({ error: 'Empresa não encontrada' });
        }

        // Atualizar empresa
        const empresa = await prisma.empresa.update({
            where: { id },
            data: {
                razaoSocial,
                nomeFantasia,
                email,
                telefone
            }
        });

        logger.info('Empresa updated', { empresaId: empresa.id });

        res.json({
            message: 'Empresa atualizada com sucesso',
            empresa
        });
    } catch (error) {
        logger.error('Update empresa error:', error);
        res.status(500).json({ error: 'Erro ao atualizar empresa' });
    }
};

/**
 * Desativar empresa (soft delete)
 */
const deleteEmpresa = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se empresa existe
        const empresaExistente = await prisma.empresa.findUnique({
            where: { id }
        });

        if (!empresaExistente) {
            return res.status(404).json({ error: 'Empresa não encontrada' });
        }

        // Desativar empresa e seus usuários
        await prisma.$transaction([
            prisma.empresa.update({
                where: { id },
                data: { ativo: false }
            }),
            prisma.usuario.updateMany({
                where: { empresaId: id },
                data: { ativo: false }
            })
        ]);

        logger.info('Empresa deactivated', { empresaId: id });

        res.json({ message: 'Empresa desativada com sucesso' });
    } catch (error) {
        logger.error('Delete empresa error:', error);
        res.status(500).json({ error: 'Erro ao desativar empresa' });
    }
};

/**
 * Estatísticas da empresa
 */
const getEmpresaStats = async (req, res) => {
    try {
        const { id } = req.params;

        const [empresa, stats] = await Promise.all([
            prisma.empresa.findUnique({ where: { id } }),
            prisma.documento.groupBy({
                by: ['categoria', 'status'],
                where: { empresaId: id },
                _count: true
            })
        ]);

        if (!empresa) {
            return res.status(404).json({ error: 'Empresa não encontrada' });
        }

        // Organizar estatísticas
        const estatisticas = {
            totalDocumentos: 0,
            porCategoria: {},
            porStatus: {}
        };

        stats.forEach(stat => {
            estatisticas.totalDocumentos += stat._count;

            if (!estatisticas.porCategoria[stat.categoria]) {
                estatisticas.porCategoria[stat.categoria] = 0;
            }
            estatisticas.porCategoria[stat.categoria] += stat._count;

            if (!estatisticas.porStatus[stat.status]) {
                estatisticas.porStatus[stat.status] = 0;
            }
            estatisticas.porStatus[stat.status] += stat._count;
        });

        res.json({ estatisticas });
    } catch (error) {
        logger.error('Get empresa stats error:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
};

module.exports = {
    listEmpresas,
    getEmpresa,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa,
    getEmpresaStats
};
