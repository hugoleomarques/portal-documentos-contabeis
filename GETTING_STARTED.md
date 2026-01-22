# Portal de Gestão de Documentos Contábeis - Guia de Início Rápido

## 📋 Pré-requisitos

- Node.js 20+ LTS
- Docker Desktop (para PostgreSQL e Redis)
- Conta Azure (para OCR e Storage)
- Git

## 🚀 Configuração Inicial

### 1. Instalar Dependências

```bash
# Instalar dependências globais
npm install -g concurrently prisma

# Instalar dependências do projeto
npm install
```

### 2. Configurar Ambiente Local

```bash
# Copiar arquivo de exemplo
copy .env.example .env

# Editar .env com suas credenciais
# Mínimo necessário para começar:
# - DATABASE_URL (já configurado para Docker)
# - JWT_SECRET (gerar um aleatório)
```

### 3. Iniciar Banco de Dados

```bash
# Subir PostgreSQL e Redis via Docker
npm run docker:up

# Verificar se está rodando
docker ps
```

### 4. Configurar Banco de Dados

```bash
# Executar migrations
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio para visualizar dados
npm run prisma:studio
```

### 5. Iniciar Aplicação

```bash
# Inicia backend + frontend admin + frontend client simultaneamente
npm run dev
```

Acesse:
- **Admin Dashboard**: http://localhost:3000
- **Portal do Cliente**: http://localhost:3001
- **API Backend**: http://localhost:3001/api
- **pgAdmin**: http://localhost:5050 (admin@admin.com / admin)

## 📦 Estrutura de Desenvolvimento

```
Fase Atual: PLANEJAMENTO
Próximos Passos:
1. Revisar implementation_plan.md
2. Aprovar arquitetura e stack
3. Iniciar desenvolvimento do backend
```

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia tudo
npm run dev:backend      # Apenas backend
npm run dev:admin        # Apenas admin frontend

# Banco de Dados
npm run prisma:migrate   # Criar/aplicar migrations
npm run prisma:studio    # Interface visual do banco

# Docker
npm run docker:up        # Subir containers
npm run docker:down      # Parar containers

# Testes
npm test                 # Todos os testes
npm run test:backend     # Apenas backend
```

## 📚 Documentação

- [Plano de Implementação](./brain/implementation_plan.md)
- [Lista de Tarefas](./brain/task.md)
- [README Principal](./README.md)

## 🆘 Troubleshooting

### Erro: "Port 5432 already in use"
```bash
# Parar PostgreSQL local se estiver rodando
net stop postgresql-x64-15
```

### Erro: "Cannot connect to database"
```bash
# Verificar se Docker está rodando
docker ps

# Reiniciar containers
npm run docker:down
npm run docker:up
```

## 🔐 Segurança

⚠️ **IMPORTANTE**: Antes de fazer deploy:
1. Altere todas as senhas em `.env`
2. Gere novos secrets JWT
3. Configure SSL/HTTPS
4. Ative rate limiting
5. Configure backup automático

## 📞 Suporte

Para dúvidas sobre a implementação, consulte o `implementation_plan.md` ou abra uma issue.
