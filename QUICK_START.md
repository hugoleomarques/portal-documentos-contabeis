# 🚀 GUIA RÁPIDO - Como Testar o Portal

## ⚡ Início Rápido (3 passos)

### 1️⃣ Iniciar Banco de Dados
```bash
# Na raiz do projeto
docker-compose up -d
```

### 2️⃣ Iniciar Backend
```bash
cd backend

# Instalar dependências (primeira vez)
npm install

# Configurar banco
npx prisma migrate dev
npx prisma db seed

# Iniciar servidor
npm run dev
```
✅ Backend rodando em: **http://localhost:3001**

### 3️⃣ Iniciar Frontend
```bash
cd frontend/admin

# Instalar dependências (primeira vez)
npm install

# Iniciar servidor
npm run dev
```
✅ Frontend rodando em: **http://localhost:3000**

---

## 🔐 Login

Acesse: **http://localhost:3000**

**Credenciais:**
- Email: `admin@contabilidade.com`
- Senha: `admin123`

---

## ✨ O Que Você Pode Testar

### ✅ Já Funciona
1. **Login** - Com suporte a 2FA (opcional)
2. **Dashboard** - Visualizar estatísticas
3. **Upload** - Arrastar PDFs (precisa selecionar empresa)
4. **Navegação** - Sidebar e menu

### ⚠️ Precisa de Azure (Opcional)
- **OCR Automático** - Requer credenciais Azure AI
- **Storage** - Requer Azure Blob Storage

**Sem Azure:** O sistema funciona, mas documentos ficam em "Processando"

---

## 🎨 Design

- **Tema:** Dark mode com roxo
- **Animações:** Transições suaves
- **Responsivo:** Funciona em mobile

---

## 🐛 Problemas Comuns

### Backend não inicia
```bash
# Verificar se Docker está rodando
docker ps

# Reiniciar containers
docker-compose down
docker-compose up -d
```

### Frontend não inicia
```bash
cd frontend/admin
rm -rf node_modules package-lock.json
npm install
```

### Porta ocupada
- Backend usa porta **3001**
- Frontend usa porta **3000**

---

## 📝 Próximos Passos

Para completar o sistema:
1. Criar páginas de Empresas (lista + CRUD)
2. Criar página de Documentos (lista + filtros)
3. Criar página de Logs (auditoria LGPD)
4. Adicionar notificações (e-mail/WhatsApp)

---

## 💡 Dicas

- Use **Ctrl+C** para parar os servidores
- Logs do backend aparecem no terminal
- Erros do frontend aparecem no navegador (F12)
- Dados de teste já estão no banco (5 empresas)
