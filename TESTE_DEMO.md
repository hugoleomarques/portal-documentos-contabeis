# ✅ Guia de Teste - Preparação para Demo

## 🎯 Objetivo
Garantir que tudo funciona perfeitamente antes da apresentação.

---

## 📋 Passo 1: Testar Backend (5 minutos)

### Iniciar Banco de Dados
```bash
# Na raiz do projeto
cd C:\Users\hugol\.gemini\antigravity\scratch\novo-projeto-grande
docker-compose up -d
```

✅ **Verificar:** `docker ps` deve mostrar PostgreSQL e Redis rodando

### Iniciar Backend
```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

✅ **Verificar:** Deve aparecer "🚀 Servidor rodando na porta 3001"

### Testar API
Abra: http://localhost:3001/health

✅ **Deve retornar:** `{"status":"OK",...}`

---

## 📋 Passo 2: Testar Frontend (5 minutos)

### Iniciar Frontend (Novo Terminal)
```bash
cd frontend/admin
npm install
npm run dev
```

✅ **Verificar:** "ready - started server on 0.0.0.0:3000"

### Testar Login
1. Abra: http://localhost:3000
2. Login: `admin@contabilidade.com`
3. Senha: `admin123`

✅ **Deve:** Redirecionar para dashboard

---

## 📋 Passo 3: Testar Upload (10 minutos)

### Preparar PDFs de Teste

**Opção A: Criar PDFs Simples**
1. Abra Word/Google Docs
2. Escreva:
   ```
   GUIA DE FGTS
   CNPJ: 00000000000001
   Valor: R$ 1.500,00
   Vencimento: 20/02/2026
   ```
3. Salve como PDF
4. Repita para 3-5 documentos diferentes

**Opção B: Usar PDFs Existentes**
- Qualquer PDF serve para testar o upload
- OCR só funciona com credenciais Azure

### Testar Upload
1. No dashboard, clique em **"Upload"**
2. Selecione empresa: **Empresa Exemplo 1 LTDA**
3. Arraste os PDFs para a área
4. Clique em **"Enviar"**

✅ **Deve:** Mostrar barra de progresso e sucesso

---

## 📋 Passo 4: Verificar Dashboard (2 minutos)

1. Volte para **Dashboard**
2. Verifique se os cards mostram:
   - Total de Empresas: 5
   - Total de Documentos: (número de uploads)
   - Documentos Recentes: aparecem na lista

✅ **Tudo funcionando!**

---

## 🎬 Passo 5: Preparar Demo no Tablet

### Opção A: GitHub (Mais Fácil)
1. Abra no tablet: https://github.com/hugoleomarques/portal-documentos-contabeis
2. Adicione aos favoritos
3. Teste scroll e visualização dos diagramas

### Opção B: Sistema Rodando (Mais Impressionante)

**Se tablet e laptop estiverem na mesma WiFi:**

1. No laptop, descubra seu IP:
   ```bash
   ipconfig
   # Procure "IPv4 Address" (ex: 192.168.1.100)
   ```

2. No tablet, acesse:
   ```
   http://SEU_IP:3000
   ```

3. Faça login e mostre funcionando ao vivo!

---

## 🎯 Cenários de Demo

### Cenário 1: Upload Rápido (30 segundos)
1. "Vou fazer upload de 5 documentos agora"
2. Arraste PDFs
3. Clique em enviar
4. "Pronto! Em 30 segundos, 5 documentos processados"

### Cenário 2: Dashboard (1 minuto)
1. "Aqui vocês veem tudo em tempo real"
2. Mostre os cards de estatísticas
3. "5 empresas cadastradas, X documentos no sistema"
4. Scroll na lista de documentos recentes

### Cenário 3: Segurança (1 minuto)
1. Mostre o GitHub no tablet
2. Scroll até diagrama de segurança
3. "Criptografia AES-256, mesma de bancos"
4. "Logs de auditoria para LGPD"

---

## ⚠️ Troubleshooting

### Backend não inicia
```bash
# Reiniciar Docker
docker-compose down
docker-compose up -d

# Limpar e reinstalar
cd backend
rm -rf node_modules
npm install
```

### Frontend não inicia
```bash
cd frontend/admin
rm -rf node_modules .next
npm install
npm run dev
```

### "Port already in use"
```bash
# Matar processo na porta 3001
netstat -ano | findstr :3001
taskkill /PID [número] /F

# Matar processo na porta 3000
netstat -ano | findstr :3000
taskkill /PID [número] /F
```

---

## ✅ Checklist Final Antes da Reunião

- [ ] Backend rodando sem erros
- [ ] Frontend abre e faz login
- [ ] Upload funciona (testado com 3+ PDFs)
- [ ] Dashboard mostra estatísticas
- [ ] GitHub abre no tablet
- [ ] Diagramas aparecem corretamente
- [ ] Bateria do tablet carregada
- [ ] Internet funcionando
- [ ] Plano B: Screenshots em PDF

---

## 💡 Dicas para a Demo

### Se Tudo Funcionar
- Mostre o sistema rodando
- Faça upload ao vivo
- Impressiona muito mais!

### Se Algo Der Errado
- Tenha o GitHub aberto no tablet
- Mostre os diagramas
- Explique: "Aqui está a documentação técnica"
- Ofereça demo técnica depois

### Frase de Segurança
"Este é um ambiente de desenvolvimento. Em produção, fica ainda mais rápido com a infraestrutura Azure."

---

## 🎬 Está Tudo Pronto!

Agora você tem:
- ✅ Sistema testado e funcionando
- ✅ GitHub com apresentação profissional
- ✅ Cenários de demo preparados
- ✅ Plano B se algo der errado

**Boa sorte na apresentação! 🚀**
