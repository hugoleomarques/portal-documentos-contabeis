const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { prisma } = require('../middleware/auditMiddleware');
const { generateToken } = require('../middleware/authMiddleware');
const { logger } = require('../utils/logger');

/**
 * Registrar novo usuário
 */
const register = async (req, res) => {
    try {
        const { email, senha, nome, cpf, tipo, empresaId } = req.body;

        // Validar se email já existe
        const existingUser = await prisma.usuario.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'E-mail já cadastrado' });
        }

        // Validar se CPF já existe (se fornecido)
        if (cpf) {
            const existingCpf = await prisma.usuario.findUnique({
                where: { cpf }
            });

            if (existingCpf) {
                return res.status(400).json({ error: 'CPF já cadastrado' });
            }
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(senha, 12);

        // Criar usuário
        const usuario = await prisma.usuario.create({
            data: {
                email,
                senha: hashedPassword,
                nome,
                cpf,
                tipo: tipo || 'FUNCIONARIO',
                empresaId
            },
            select: {
                id: true,
                email: true,
                nome: true,
                tipo: true,
                empresaId: true,
                createdAt: true
            }
        });

        logger.info('User registered', { userId: usuario.id, email: usuario.email });

        res.status(201).json({
            message: 'Usuário cadastrado com sucesso',
            usuario
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
};

/**
 * Login
 */
const login = async (req, res) => {
    try {
        const { email, senha, twoFactorCode } = req.body;

        // Buscar usuário
        const usuario = await prisma.usuario.findUnique({
            where: { email },
            include: { empresa: true }
        });

        if (!usuario || !usuario.ativo) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Verificar 2FA se habilitado
        if (usuario.twoFactorEnabled) {
            if (!twoFactorCode) {
                return res.status(200).json({
                    requires2FA: true,
                    message: 'Código 2FA necessário'
                });
            }

            const verified = speakeasy.totp.verify({
                secret: usuario.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorCode,
                window: 2 // Permite 2 intervalos de tempo (60s cada)
            });

            if (!verified) {
                return res.status(401).json({ error: 'Código 2FA inválido' });
            }
        }

        // Atualizar último login
        await prisma.usuario.update({
            where: { id: usuario.id },
            data: { ultimoLogin: new Date() }
        });

        // Gerar tokens
        const accessToken = generateToken(usuario.id, 'access');
        const refreshToken = generateToken(usuario.id, 'refresh');

        logger.info('User logged in', { userId: usuario.id, email: usuario.email });

        res.json({
            message: 'Login realizado com sucesso',
            accessToken,
            refreshToken,
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nome: usuario.nome,
                tipo: usuario.tipo,
                empresa: usuario.empresa ? {
                    id: usuario.empresa.id,
                    razaoSocial: usuario.empresa.razaoSocial,
                    cnpj: usuario.empresa.cnpj
                } : null
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ error: 'Erro ao realizar login' });
    }
};

/**
 * Habilitar 2FA
 */
const enable2FA = async (req, res) => {
    try {
        const userId = req.user.id;

        // Gerar secret
        const secret = speakeasy.generateSecret({
            name: `Portal Documentos (${req.user.email})`,
            length: 32
        });

        // Salvar secret no banco
        await prisma.usuario.update({
            where: { id: userId },
            data: {
                twoFactorSecret: secret.base32,
                twoFactorEnabled: false // Será habilitado após verificação
            }
        });

        // Gerar QR Code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        logger.info('2FA setup initiated', { userId });

        res.json({
            message: '2FA configurado. Escaneie o QR Code com seu app autenticador.',
            qrCode: qrCodeUrl,
            secret: secret.base32,
            manualEntry: secret.base32
        });
    } catch (error) {
        logger.error('2FA enable error:', error);
        res.status(500).json({ error: 'Erro ao habilitar 2FA' });
    }
};

/**
 * Verificar e ativar 2FA
 */
const verify2FA = async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;

        const usuario = await prisma.usuario.findUnique({
            where: { id: userId }
        });

        if (!usuario.twoFactorSecret) {
            return res.status(400).json({ error: '2FA não foi configurado' });
        }

        // Verificar código
        const verified = speakeasy.totp.verify({
            secret: usuario.twoFactorSecret,
            encoding: 'base32',
            token: code,
            window: 2
        });

        if (!verified) {
            return res.status(401).json({ error: 'Código inválido' });
        }

        // Ativar 2FA
        await prisma.usuario.update({
            where: { id: userId },
            data: { twoFactorEnabled: true }
        });

        logger.info('2FA enabled', { userId });

        res.json({ message: '2FA ativado com sucesso' });
    } catch (error) {
        logger.error('2FA verify error:', error);
        res.status(500).json({ error: 'Erro ao verificar 2FA' });
    }
};

/**
 * Desabilitar 2FA
 */
const disable2FA = async (req, res) => {
    try {
        const userId = req.user.id;
        const { senha } = req.body;

        const usuario = await prisma.usuario.findUnique({
            where: { id: userId }
        });

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({ error: 'Senha inválida' });
        }

        // Desabilitar 2FA
        await prisma.usuario.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null
            }
        });

        logger.info('2FA disabled', { userId });

        res.json({ message: '2FA desabilitado com sucesso' });
    } catch (error) {
        logger.error('2FA disable error:', error);
        res.status(500).json({ error: 'Erro ao desabilitar 2FA' });
    }
};

/**
 * Refresh token
 */
const refreshToken = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return res.status(401).json({ error: 'Refresh token não fornecido' });
        }

        // Verificar refresh token
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

        if (decoded.type !== 'refresh') {
            return res.status(401).json({ error: 'Token inválido' });
        }

        // Gerar novo access token
        const accessToken = generateToken(decoded.userId, 'access');

        res.json({ accessToken });
    } catch (error) {
        logger.error('Refresh token error:', error);
        res.status(401).json({ error: 'Refresh token inválido ou expirado' });
    }
};

/**
 * Obter dados do usuário logado
 */
const getMe = async (req, res) => {
    try {
        const usuario = await prisma.usuario.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                nome: true,
                cpf: true,
                tipo: true,
                twoFactorEnabled: true,
                ultimoLogin: true,
                createdAt: true,
                empresa: {
                    select: {
                        id: true,
                        cnpj: true,
                        razaoSocial: true,
                        nomeFantasia: true,
                        email: true
                    }
                }
            }
        });

        res.json({ usuario });
    } catch (error) {
        logger.error('Get me error:', error);
        res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
    }
};

module.exports = {
    register,
    login,
    enable2FA,
    verify2FA,
    disable2FA,
    refreshToken,
    getMe
};
