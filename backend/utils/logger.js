const winston = require('winston');

// Configuração de formato
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Criar logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'portal-documentos-api' },
    transports: [
        // Console (desenvolvimento)
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
                        }`;
                })
            )
        }),

        // Arquivo de erros
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),

        // Arquivo combinado
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});

// Azure Application Insights (produção)
if (process.env.NODE_ENV === 'production' && process.env.AZURE_INSIGHTS_KEY) {
    const { AzureApplicationInsightsLogger } = require('winston-azure-application-insights');
    logger.add(new AzureApplicationInsightsLogger({
        key: process.env.AZURE_INSIGHTS_KEY
    }));
}

module.exports = { logger };
