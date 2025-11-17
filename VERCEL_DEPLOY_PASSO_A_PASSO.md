# 🚀 Deploy na Vercel - Passo a Passo Detalhado

## 🔐 Autenticação na Vercel

A Vercel **NÃO usa token na URL** como o GitHub. Ela se conecta ao GitHub via **OAuth/GitHub App**, então emails diferentes não são problema.

---

## 📋 Passo a Passo Completo

### Passo 1: Acessar Vercel

1. Acesse: https://vercel.com
2. Clique em **"Sign Up"** ou **"Log In"**
3. Escolha **"Continue with GitHub"**
4. Autorize a Vercel a acessar seus repositórios

### Passo 2: Importar Projeto

1. No dashboard da Vercel, clique em **"Add New..."**
2. Selecione **"Project"**
3. Você verá uma lista dos seus repositórios do GitHub
4. Procure por **`syncfin`** (ou `salesadvarquivo/syncfin`)
5. Clique em **"Import"**

### Passo 3: Configurar Projeto

A Vercel vai detectar automaticamente algumas configurações, mas você pode ajustar:

#### Framework Preset
- Selecione: **"Other"** ou deixe em branco

#### Root Directory
- Deixe como: **`./`** (raiz)

#### Build Command
- Use: **`pnpm build`** ou **`npm run build`**

#### Output Directory
- Use: **`dist/public`**

#### Install Command
- Use: **`pnpm install`** ou **`npm install`**

### Passo 4: Configurar Variáveis de Ambiente

**⚠️ MUITO IMPORTANTE:** Antes de fazer deploy, configure as variáveis de ambiente!

1. Na tela de configuração, role até **"Environment Variables"**
2. Clique em **"Add"** para cada variável:

#### Variável 1: DATABASE_URL
- **Name:** `DATABASE_URL`
- **Value:** `mysql://root:alhBAdzteoRhNqoNRKuUwxpUhuCRDVhp@switchyard.proxy.rlwy.net:11475/railway?ssl={"rejectUnauthorized":false}`
- **Environments:** Marque todas (Production, Preview, Development)

#### Variável 2: JWT_SECRET
- **Name:** `JWT_SECRET`
- **Value:** `outra-chave-secreta-para-jwt-altere-isso` (ou gere uma nova)
- **Environments:** Marque todas

#### Variável 3: NODE_ENV
- **Name:** `NODE_ENV`
- **Value:** `production`
- **Environments:** Apenas Production

### Passo 5: Fazer Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (pode levar 2-5 minutos)
3. Acompanhe os logs em tempo real

---

## 🔍 Verificando o Deploy

### Se o Deploy Funcionar:

1. Você receberá uma URL como: `https://syncfin.vercel.app`
2. Teste a API: `https://syncfin.vercel.app/api/health`
3. Deve retornar: `{"status":"ok","timestamp":"..."}`

### Se Houver Erros:

#### Erro: "Build Failed"
- Verifique os logs na Vercel
- Certifique-se de que `vercel.json` está correto
- Verifique se todas as dependências estão no `package.json`

#### Erro: "Cannot connect to database"
- Verifique se a `DATABASE_URL` está correta
- Verifique se o banco Railway está ativo
- Teste a conexão localmente primeiro

#### Erro: "Module not found"
- Certifique-se de que todas as dependências estão no `package.json`
- Execute `pnpm install` localmente e commite o `pnpm-lock.yaml`

---

## 🔄 Atualizações Futuras

Para atualizar o deploy:

```bash
git add .
git commit -m "Descrição da atualização"
git push origin main
```

A Vercel detecta automaticamente e faz um novo deploy.

---

## 💡 Dicas Importantes

1. **Emails Diferentes:** Não é problema! A Vercel se conecta via GitHub OAuth
2. **Token GitHub:** Não precisa na Vercel, ela usa OAuth
3. **Variáveis de Ambiente:** Configure ANTES do primeiro deploy
4. **Logs:** Use os logs da Vercel para debug
5. **Domínio Customizado:** Você pode adicionar depois nas configurações

---

## ✅ Checklist Antes do Deploy

- [ ] Repositório no GitHub (`syncfin`)
- [ ] Banco de dados Railway criado e ativo
- [ ] Migrations executadas no banco online
- [ ] `DATABASE_URL` copiada do Railway
- [ ] Variáveis de ambiente preparadas
- [ ] `vercel.json` criado
- [ ] `api/index.ts` criado
- [ ] Código commitado e pushado no GitHub

---

## 🆘 Problemas Comuns

### "Repository not found"
- Verifique se você autorizou a Vercel a acessar o repositório
- Vá em GitHub Settings → Applications → Authorized OAuth Apps
- Verifique se a Vercel está autorizada

### "Build timeout"
- O build pode demorar na primeira vez
- Verifique se não há processos muito lentos
- Considere otimizar o build

### "Function size limit exceeded"
- A Vercel tem limite de tamanho para serverless functions
- Verifique se não há dependências desnecessárias
- Considere usar Vercel Pro para limites maiores

---

**Boa sorte com o deploy! 🚀**

