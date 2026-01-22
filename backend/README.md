# Backend - Portal de Documentos Contábeis

API REST completa para gestão de documentos contábeis com OCR automático e conformidade LGPD.

## 🚀 Funcionalidades Implementadas

### ✅ Autenticação e Autorização
- Login com JWT (access + refresh tokens)
- 2FA com Google Authenticator (QR Code)
- Níveis de acesso: Admin, Sócio, RH, Funcionário
- Middleware de autorização granular

### ✅ Gestão de Empresas
- CRUD completo com validação Joi
- Busca e paginação
- Soft delete
- Estatísticas por empresa

### ✅ Gestão de Documentos
- Upload em lote (até 100 PDFs)
- Processamento assíncrono com BullMQ
- Download com geração de protocolo digital
- Filtros por categoria, status, data

### ✅ OCR Inteligente (Azure AI)
- Extração automática de texto
- Detecção de CNPJ via regex
- Classificação por palavras-chave (Fiscal, DP, Contábil, Certidões)
- Renomeação padronizada: `AAAAMMDD_TipoDocumento_CNPJ.pdf`

### ✅ Storage Seguro (Azure Blob)
- Criptografia AES-256 em repouso
- Hash SHA-256 para integridade
- Upload/Download criptografado

### ✅ Auditoria LGPD
- Logs inalteráveis de todas as ações
- Exportação em CSV
- Rastreamento de IP, User-Agent, timestamp
- Protocolos digitais de recebimento

## 📁 Estrutura

```
backend/
├── api/
│   ├── controllers/      # Lógica de negócio
│   │   ├── auth.controller.js
│   │   ├── empresas.controller.js
│   │   ├── documentos.controller.js
│   │   └── logs.controller.js
│   └── routes/           # Definição de rotas
├── middleware/
│   ├── authMiddleware.js     # JWT + 2FA + Autorização
│   ├── auditMiddleware.js    # Logs LGPD
│   └── validation.js         # Joi schemas
├── services/
│   ├── ocrService.js         # Azure AI Document Intelligence
│   └── storageService.js     # Azure Blob Storage + Criptografia
├── jobs/
│   └── documentProcessor.job.js  # BullMQ worker
├── utils/
│   └── logger.js             # Winston
├── prisma/
│   └── schema.prisma         # Modelo do banco
└── server.js                 # Entry point
```

## 🔧 Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

```env
# Banco de dados
DATABASE_URL="postgresql://user:password@localhost:5432/portal_documentos"

# JWT
JWT_SECRET="seu-secret-aqui"
REFRESH_TOKEN_SECRET="seu-refresh-secret-aqui"

# Azure
AZURE_STORAGE_CONNECTION_STRING="sua-connection-string"
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT="https://..."
AZURE_DOCUMENT_INTELLIGENCE_KEY="sua-key"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
```

### 3. Executar Migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Iniciar Servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📡 Endpoints Principais

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login (com 2FA opcional)
- `POST /api/auth/2fa/enable` - Habilitar 2FA
- `GET /api/auth/me` - Dados do usuário logado

### Empresas
- `GET /api/empresas` - Listar (admin only)
- `POST /api/empresas` - Cadastrar (admin only)
- `GET /api/empresas/:id` - Buscar
- `PUT /api/empresas/:id` - Atualizar (admin only)
- `DELETE /api/empresas/:id` - Desativar (admin only)

### Documentos
- `POST /api/documentos/upload` - Upload em lote (admin only)
- `GET /api/documentos` - Listar (filtrado por empresa)
- `GET /api/documentos/:id/download` - Download + Protocolo
- `GET /api/documentos/:id/protocolo` - Ver protocolos
- `DELETE /api/documentos/:id` - Deletar (admin only)

### Logs (LGPD)
- `GET /api/logs` - Listar logs (admin only)
- `GET /api/logs/export` - Exportar CSV (admin only)
- `GET /api/logs/stats` - Estatísticas (admin only)

## 🔐 Segurança

- ✅ Helmet.js para headers HTTP seguros
- ✅ CORS configurado
- ✅ Rate limiting (100 req/15min)
- ✅ Bcrypt para senhas (12 rounds)
- ✅ JWT com expiração
- ✅ Criptografia AES-256 para arquivos
- ✅ Validação de entrada com Joi
- ✅ Logs de auditoria inalteráveis

## 🧪 Testes

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Coverage
npm run test:coverage
```

## 📊 Monitoramento

Logs são salvos em:
- `logs/error.log` - Apenas erros
- `logs/combined.log` - Todos os logs
- Azure Application Insights (produção)

## 🚀 Deploy

Ver `../infrastructure/` para configurações de deploy no Azure.

## 📝 Próximos Passos

- [ ] Implementar notificações (e-mail/WhatsApp)
- [ ] Adicionar testes unitários
- [ ] Configurar CI/CD
- [ ] Documentação Swagger/OpenAPI
