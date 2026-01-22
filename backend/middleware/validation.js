const Joi = require('joi');

/**
 * Validação de CNPJ
 */
const cnpjSchema = Joi.string()
    .length(14)
    .pattern(/^\d{14}$/)
    .required()
    .messages({
        'string.length': 'CNPJ deve ter 14 dígitos',
        'string.pattern.base': 'CNPJ deve conter apenas números',
        'any.required': 'CNPJ é obrigatório'
    });

/**
 * Schema de validação para criação de empresa
 */
const createEmpresaSchema = Joi.object({
    cnpj: cnpjSchema,
    razaoSocial: Joi.string().min(3).max(255).required().messages({
        'string.min': 'Razão Social deve ter no mínimo 3 caracteres',
        'string.max': 'Razão Social deve ter no máximo 255 caracteres',
        'any.required': 'Razão Social é obrigatória'
    }),
    nomeFantasia: Joi.string().max(255).optional().allow(''),
    email: Joi.string().email().required().messages({
        'string.email': 'E-mail inválido',
        'any.required': 'E-mail é obrigatório'
    }),
    telefone: Joi.string().pattern(/^\d{10,11}$/).optional().allow('').messages({
        'string.pattern.base': 'Telefone deve ter 10 ou 11 dígitos'
    })
});

/**
 * Schema de validação para atualização de empresa
 */
const updateEmpresaSchema = Joi.object({
    razaoSocial: Joi.string().min(3).max(255).optional(),
    nomeFantasia: Joi.string().max(255).optional().allow(''),
    email: Joi.string().email().optional(),
    telefone: Joi.string().pattern(/^\d{10,11}$/).optional().allow('')
});

/**
 * Schema de validação para registro de usuário
 */
const registerUserSchema = Joi.object({
    email: Joi.string().email().required(),
    senha: Joi.string().min(8).required().messages({
        'string.min': 'Senha deve ter no mínimo 8 caracteres',
        'any.required': 'Senha é obrigatória'
    }),
    nome: Joi.string().min(3).max(255).required(),
    cpf: Joi.string().length(11).pattern(/^\d{11}$/).optional().allow(''),
    tipo: Joi.string().valid('ADMIN_CONTABILIDADE', 'SOCIO', 'RH', 'FUNCIONARIO').optional(),
    empresaId: Joi.string().uuid().optional()
});

/**
 * Schema de validação para login
 */
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    senha: Joi.string().required(),
    twoFactorCode: Joi.string().length(6).pattern(/^\d{6}$/).optional()
});

/**
 * Middleware de validação
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Dados inválidos',
                details: errors
            });
        }

        next();
    };
};

module.exports = {
    validate,
    createEmpresaSchema,
    updateEmpresaSchema,
    registerUserSchema,
    loginSchema
};
