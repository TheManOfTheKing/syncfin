# 🚂 Deploy do Backend no Railway

## Por que Railway?

O Railway é **perfeito** para backends Node.js/Express porque:

✅ Suporta Express tradicional (`app.listen()`)  
✅ Permite servidor rodando 24/7  
✅ Suporta upload de arquivos (Multer)  
✅ WebSockets funcionam  
✅ Cron jobs e background workers  
✅ Variáveis de ambiente fáceis  
✅ Logs em tempo real  
✅ Escalonamento automático  

**Diferente da Vercel**, que só aceita serverless functions.

---

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app) (grátis)
2. Repositório no GitHub
3. Banco de dados MySQL no Railway (já criado)

---

## 🚀 Passo a Passo

### 1. Criar Projeto no Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"**
5. Escolha o repositório: `TheManOfTheKing/syncfin`
6. Railway detecta automaticamente o `package.json`

### 2. Configurar Variáveis de Ambiente

No Railway, vá em **"Variables"** e adicione:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://root:senha@mysql.railway.internal:3306/railway
JWT_SECRET=sua_chave_secreta_super_segura_aqui
```

**Importante:**
- Use a **MYSQL_URL** (não MYSQL_PUBLIC_URL) para conexão interna
- A URL deve ser: `mysql://root:senha@mysql.railway.internal:3306/railway`

### 3. Configurar Build e Start

O Railway detecta automaticamente:
- **Build Command**: `npm run build:server`
- **Start Command**: `npm start`

Isso está configurado no `package.json`:
```json
{
  "scripts": {
    "build:server": "tsc --project tsconfig.server.json && tsc-alias -p tsconfig.server.json",
    "start": "cross-env NODE_ENV=production node dist/server/index.js"
  }
}
```

### 4. Conectar ao Banco de Dados

1. No Railway, vá em **"Data"** → Seu banco MySQL
2. Copie a **MYSQL_URL** (não a pública)
3. Cole no campo `DATABASE_URL` nas variáveis de ambiente

### 5. Deploy Automático

O Railway faz deploy automaticamente quando você faz push para `main`.

**Ou manualmente:**
1. Clique em **"Deploy"**
2. Aguarde o build completar
3. Veja os logs em tempo real

### 6. Obter URL Pública

Após o deploy:
1. Vá em **"Settings"** → **"Networking"**
2. Clique em **"Generate Domain"**
3. Você terá uma URL como: `https://syncfin-backend-production.up.railway.app`

---

## 🔧 Configurar Frontend (Vercel)

Após o backend estar no Railway, atualize o frontend:

1. Na Vercel, vá em **"Environment Variables"**
2. Adicione:
   ```env
   VITE_API_URL=https://syncfin-backend-production.up.railway.app
   ```

3. O frontend usará essa URL para chamar a API

---

## ✅ Verificar se Funcionou

1. Acesse: `https://sua-url-railway.app/api/health`
2. Deve retornar: `{"status":"ok","timestamp":"..."}`

3. Teste login no frontend
4. Verifique os logs no Railway

---

## 📊 Monitoramento

- **Logs**: Railway → Seu projeto → "Deployments" → "View Logs"
- **Métricas**: Railway mostra CPU, memória, requisições
- **Uptime**: Railway mantém o servidor online 24/7

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"
- Verifique se `DATABASE_URL` está usando `mysql.railway.internal` (não a URL pública)
- Confirme que o banco está no mesmo projeto Railway

### Erro: "Port already in use"
- Railway define `PORT` automaticamente
- Não precisa configurar manualmente

### Build falha
- Verifique os logs no Railway
- Confirme que `npm run build:server` funciona localmente

### Frontend não conecta
- Verifique CORS no backend (já configurado para `*`)
- Confirme que `VITE_API_URL` está configurado na Vercel

---

## 💰 Custos

Railway oferece:
- **$5 grátis** por mês
- **$0.000463/GB** de memória
- **$0.000231/vCPU** por hora

Para um backend pequeno/médio: **grátis ou ~$5-10/mês**

---

## 🎯 Próximos Passos

1. ✅ Deploy backend no Railway
2. ✅ Configurar variáveis de ambiente
3. ✅ Obter URL pública
4. ✅ Atualizar frontend na Vercel com `VITE_API_URL`
5. ✅ Testar login e funcionalidades

**Pronto!** Seu backend estará rodando 24/7 no Railway! 🚀

