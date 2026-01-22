# 🎬 Demo Visual - GitHub Pages

## 🎯 O Que Vamos Fazer

Criar uma versão **demo visual** do frontend que funciona sem backend, apenas para mostrar a interface na reunião.

**Vantagens:**
- ✅ Funciona 100% online
- ✅ Não precisa Azure
- ✅ Não precisa rodar nada local
- ✅ Link direto para mostrar no tablet
- ✅ Dados de exemplo já carregados

**Limitações:**
- ❌ Não faz upload real
- ❌ Não salva dados
- ❌ Apenas visual/interface

---

## 🚀 Como Vai Funcionar

### Opção 1: GitHub Pages (Recomendado)
**Link:** `https://hugoleomarques.github.io/portal-documentos-contabeis`

- Hospedagem grátis do GitHub
- Atualiza automaticamente
- Funciona em qualquer dispositivo

### Opção 2: Vercel (Alternativa)
**Link:** `https://portal-documentos.vercel.app`

- Deploy em 2 minutos
- Mais rápido que GitHub Pages
- Interface de deploy visual

---

## 📋 Passos para Deploy

### GitHub Pages (Escolha esta)

1. **Build do projeto:**
```bash
cd frontend/admin
npm run build
```

2. **Criar branch gh-pages:**
```bash
git checkout -b gh-pages
git add out/
git commit -m "deploy: GitHub Pages"
git push origin gh-pages
```

3. **Configurar no GitHub:**
- Settings → Pages
- Source: gh-pages branch
- Folder: / (root)
- Save

4. **Aguardar 2-3 minutos**
- Link fica disponível em:
- `https://hugoleomarques.github.io/portal-documentos-contabeis`

---

## 🎨 O Que Vai Aparecer

### Tela de Login
- Design bonito com gradiente
- Campo de email e senha
- Botão de login (vai para dashboard)

### Dashboard
- Cards com estatísticas mockadas
- Lista de documentos de exemplo
- Sidebar com navegação

### Upload
- Interface drag & drop
- Seleção de empresa
- Preview de arquivos
- Botão de envio (mostra sucesso fake)

---

## 💡 Alternativa Mais Rápida

Se quiser algo AINDA MAIS RÁPIDO, posso:

1. **Criar screenshots** das telas principais
2. **Montar um PDF** com as telas
3. **Você mostra** como se fosse o sistema

**Vantagem:** Pronto em 5 minutos!

---

## 🤔 Qual Você Prefere?

**A) GitHub Pages** - Sistema online funcionando (30 min)
**B) Screenshots em PDF** - Apresentação visual (5 min)
**C) Apenas GitHub README** - Já está pronto!

**Qual você quer fazer?**
