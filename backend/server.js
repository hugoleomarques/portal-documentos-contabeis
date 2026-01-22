require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { logger } = require('./utils/logger');
const { auditMiddleware } = require('./middleware/auditMiddleware');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use('/api/', limiter);

// ============================================
// BODY PARSERS
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// AUDIT LOGGING (LGPD)
// ============================================
app.use(auditMiddleware);

// ============================================
// ROUTES
// ============================================
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});


// Auth routes
app.use('/api/auth', require('./api/routes/auth.routes'));

// Empresas routes
app.use('/api/empresas', require('./api/routes/empresas.routes'));

// Documentos routes
app.use('/api/documentos', require('./api/routes/documentos.routes'));

// Logs routes
app.use('/api/logs', require('./api/routes/logs.routes'));

// TODO: Import and use other route modules
// app.use('/api/usuarios', require('./api/routes/usuarios.routes'));



// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    res.status(err.status || 500).json({
        error: {
            message: process.env.NODE_ENV === 'production'
                ? 'Erro interno do servidor'
                : err.message,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    logger.info(`🚀 Servidor rodando na porta ${PORT}`);
    logger.info(`📝 Ambiente: ${process.env.NODE_ENV}`);
    logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
});

module.exports = app;
