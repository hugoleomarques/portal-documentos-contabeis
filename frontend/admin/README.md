# Frontend Admin - Portal de Documentos Contábeis

Interface administrativa moderna construída com Next.js 15, React 19 e TailwindCSS.

## 🎨 Design

- **Tema**: Dark mode com gradientes roxos
- **Tipografia**: Inter (Google Fonts)
- **Ícones**: Lucide React
- **Animações**: Transições suaves e micro-interações

## ✨ Funcionalidades Implementadas

### ✅ Autenticação
- Login com e-mail/senha
- Suporte a 2FA (código de 6 dígitos)
- Persistência de sessão (localStorage)
- Logout automático em caso de token expirado

### ✅ Dashboard
- Cards de estatísticas (empresas, documentos, uploads, pendentes)
- Lista de documentos recentes
- Badges de status coloridos
- Loading states

### ✅ Upload de Documentos
- Drag & drop de múltiplos PDFs
- Seleção de empresa
- Preview de arquivos antes do envio
- Feedback de sucesso/erro por arquivo
- Limite de 100 arquivos

### ✅ Layout
- Sidebar com navegação
- Header com busca
- Responsivo
- Animações de entrada

## 🚀 Como Rodar

### 1. Instalar Dependências

```bash
cd frontend/admin
npm install
```

### 2. Configurar Ambiente

O arquivo `.env.local` já está configurado:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000**

## 🔐 Credenciais de Teste

```
Email: admin@contabilidade.com
Senha: admin123
```

## 🛠️ Tecnologias

- **Next.js 15** - Framework React
- **React 19** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Zustand** - State management
- **Axios** - HTTP client
- **React Dropzone** - File upload
- **Lucide React** - Icons
