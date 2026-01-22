# 🐛 Log de Erros e Lições Aprendidas

## 📋 Objetivo
Documentar todos os erros encontrados durante o desenvolvimento e suas soluções para evitar reincidência.

---

## 🔴 Erros Encontrados

### 1. Erro: npm install gh-pages falhou
**Data:** 22/01/2026  
**Contexto:** Tentativa de deploy no GitHub Pages  
**Erro:**
```
npm error code ETARGET
Exit code: 1
```

**Causa:** Versão incompatível ou problema de rede  
**Solução:** Usar Vercel ao invés de GitHub Pages para deploy  
**Lição:** Sempre ter plano B para deploy (Vercel, Netlify)  
**Status:** ✅ Resolvido

---

### 2. Erro: Screenshots não apareciam no GitHub
**Data:** 22/01/2026  
**Contexto:** Imagens geradas mas não commitadas  
**Erro:** README mostrava apenas 1 screenshot  

**Causa:** Arquivos não foram adicionados ao git  
**Solução:**
```bash
git add docs/images/
git commit -m "feat: adicionar screenshots"
git push
```

**Lição:** Sempre verificar `git status` antes de assumir que está no repositório  
**Status:** ✅ Resolvido

---

### 3. Erro: Texto em português incorreto na imagem
**Data:** 22/01/2026  
**Contexto:** Imagem de segurança com "SECURIDO DE COCA"  
**Erro:** Palavra inexistente em português  

**Causa:** Erro de digitação no prompt da IA  
**Solução:** Regenerar imagem com texto correto "Segurança de Ponta"  
**Lição:** Sempre revisar textos em português nas imagens geradas  
**Status:** ✅ Resolvido

---

### 4. Alerta: Valores em Dólar ($) ao invés de Real (R$)
**Data:** 22/01/2026  
**Contexto:** Apresentação para cliente brasileiro  
**Erro:** Custos mostrados em USD  

**Causa:** Template padrão em inglês  
**Solução:** Converter todos os valores para BRL  
**Lição:** Sempre adaptar moeda e idioma para o mercado local  
**Status:** ✅ Resolvido

---

### 5. Alerta: Versões Beta/RC no README
**Data:** 22/01/2026  
**Contexto:** Next.js 15 e React 19 ainda não estáveis  
**Erro:** Versões muito recentes para produção  

**Causa:** Uso de versões mais recentes sem verificar estabilidade  
**Solução:** Downgrade para Next.js 14 e React 18 (estáveis)  
**Lição:** Sempre usar versões LTS/estáveis em projetos comerciais  
**Status:** ✅ Resolvido

---

## ✅ Boas Práticas Identificadas

### 1. Personalização com Logo do Cliente
**O que funcionou:** Adicionar logo Souza Lemos nos screenshots  
**Impacto:** Apresentação muito mais profissional e personalizada  
**Replicar:** Sempre personalizar demos com marca do cliente

### 2. Diagrama Mermaid no GitHub
**O que funcionou:** Adicionar diagrama visual que renderiza automaticamente  
**Impacto:** Engenheiros adoram visualizações técnicas  
**Replicar:** Usar Mermaid em todos os READMEs técnicos

### 3. Screenshots Organizados por Área
**O que funcionou:** Separar "Área Admin" e "Portal Cliente"  
**Impacto:** Cliente entende melhor as duas visões do sistema  
**Replicar:** Sempre mostrar ambas perspectivas (admin + usuário final)

---

## 🔧 Checklist Anti-Erro

Antes de fazer commit/push:
- [ ] `git status` - Verificar arquivos staged
- [ ] Revisar textos em português
- [ ] Conferir valores em R$ (não $)
- [ ] Verificar versões estáveis (não beta/RC)
- [ ] Testar links do README
- [ ] Aguardar 1-2min após push para GitHub processar

Antes de apresentar:
- [ ] Abrir GitHub no tablet e verificar imagens
- [ ] Testar scroll e navegação
- [ ] Verificar se todas as 4 screenshots aparecem
- [ ] Conferir se logo do cliente está visível

---

## 📝 Próximos Erros (Adicionar Aqui)

### Template:
```
### X. Erro: [Título do erro]
**Data:** DD/MM/AAAA
**Contexto:** [Onde aconteceu]
**Erro:** [Mensagem de erro]

**Causa:** [Por que aconteceu]
**Solução:** [Como foi resolvido]
**Lição:** [O que aprender]
**Status:** ⏳ Em andamento / ✅ Resolvido
```

---

## 🎯 Métricas

- **Total de Erros:** 5
- **Erros Resolvidos:** 5 (100%)
- **Erros Pendentes:** 0
- **Lições Aprendidas:** 8

---

**Última Atualização:** 22/01/2026 11:59
