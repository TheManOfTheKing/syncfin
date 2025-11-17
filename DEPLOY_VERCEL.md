# 🚀 Guia Completo de Deploy na Vercel

Este guia vai te ajudar a fazer o deploy do FinSync na Vercel com banco de dados online.

---

## 📋 Pré-requisitos

1. Conta no [GitHub](https://github.com)
2. Conta na [Vercel](https://vercel.com) (pode usar GitHub para login)
3. Conta em um serviço de banco de dados MySQL online (recomendamos [PlanetScale](https://planetscale.com) ou [Railway](https://railway.app))

---

## 🗄️ Passo 1: Criar Banco de Dados Online

### Opção A: PlanetScale (Recomendado - Gratuito)

1. Acesse [https://planetscale.com](https://planetscale.com)
2. Crie uma conta (pode usar GitHub)
3. Clique em "Create database"
4. Escolha um nome (ex: `finsync`)
5. Escolha a região mais próxima (ex: `us-east`)
6. Clique em "Create database"
7. Após criar, vá em "Connect"
8. Selecione "Connect with" → "Prisma" ou "General"
9. Copie a string de conexão (formato: `mysql://...`)

**Importante:** PlanetScale usa SSL por padrão. A string já vem com SSL configurado.

### Opção B: Railway (Alternativa - Gratuito)

1. Acesse [https://railway.app](https://railway.app)
2. Crie uma conta (pode usar GitHub)
3. Clique em "New Project"
4. Selecione "Provision MySQL"
5. Após criar, clique no banco MySQL
6. Vá em "Variables" → copie a `DATABASE_URL`

### Opção C: Outros Serviços

- **Aiven**: [https://aiven.io](https://aiven.io)
- **Render**: [https://render.com](https://render.com)
- **Supabase**: [https://supabase.com](https://supabase.com) (PostgreSQL, requer ajustes)

---

## 📦 Passo 2: Preparar o Repositório GitHub

### 2.1 Criar Repositório

1. Acesse [https://github.com/new](https://github.com/new)
2. Nome do repositório: `finsync` (ou outro nome)
3. Marque como **Private** (se quiser) ou **Public**
4. **NÃO** marque "Initialize with README"
5. Clique em "Create repository"

### 2.2 Criar .gitignore

Certifique-se de ter um `.gitignore` adequado:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Vercel
.vercel
```

### 2.3 Fazer Push do Código

```bash
# No diretório do projeto
git init
git add .
git commit -m "Initial commit - FinSync"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/finsync.git
git push -u origin main
```

---

## 🔧 Passo 3: Executar Migrations no Banco Online

Antes de fazer deploy, você precisa criar as tabelas no banco de dados online.

### 3.1 Configurar .env Localmente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=mysql://usuario:senha@host:porta/nome_do_banco?ssl={"rejectUnauthorized":true}
JWT_SECRET=sua-chave-secreta-super-segura-aqui
NODE_ENV=production
```

**Para PlanetScale:**
- A string de conexão já vem pronta
- Exemplo: `mysql://abc123:pscale_pw_xyz@aws.connect.psdb.cloud/finsync?ssl={"rejectUnauthorized":true}`

**Para Railway:**
- Use a `DATABASE_URL` fornecida
- Pode precisar adicionar `?ssl={"rejectUnauthorized":false}`

### 3.2 Executar Migrations

```bash
# Instalar dependências (se ainda não instalou)
pnpm install

# Executar migrations
pnpm db:push
```

Isso vai criar todas as tabelas no banco de dados online.

### 3.3 (Opcional) Criar Usuário de Teste

```bash
pnpm create-test-user
```

---

## 🚀 Passo 4: Deploy na Vercel

### 4.1 Conectar Repositório

1. Acesse [https://vercel.com](https://vercel.com)
2. Faça login (pode usar GitHub)
3. Clique em "Add New..." → "Project"
4. Importe o repositório do GitHub
5. Selecione o repositório `finsync`

### 4.2 Configurar Build

A Vercel deve detectar automaticamente as configurações, mas verifique:

- **Framework Preset:** Other
- **Root Directory:** `./` (raiz)
- **Build Command:** `pnpm build` ou `npm run build`
- **Output Directory:** `dist/public`
- **Install Command:** `pnpm install` ou `npm install`

### 4.3 Configurar Variáveis de Ambiente

Na tela de configuração do projeto, vá em "Environment Variables" e adicione:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `DATABASE_URL` | `mysql://...` (sua string de conexão) | Production, Preview, Development |
| `JWT_SECRET` | `sua-chave-secreta-super-segura` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

**⚠️ IMPORTANTE:**
- Use uma `JWT_SECRET` forte e única (pode gerar com: `openssl rand -base64 32`)
- **NUNCA** commite o `.env` no GitHub
- A `DATABASE_URL` deve ser a do banco online

### 4.4 Fazer Deploy

1. Clique em "Deploy"
2. Aguarde o build (pode levar 2-5 minutos)
3. Se houver erros, verifique os logs

---

## 🔍 Passo 5: Verificar e Testar

### 5.1 Verificar Deploy

Após o deploy, você receberá uma URL como: `https://finsync.vercel.app`

### 5.2 Testar API

Acesse: `https://seu-projeto.vercel.app/api/health`

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2025-01-XX..."
}
```

### 5.3 Testar Frontend

Acesse a URL do projeto e teste:
1. Login
2. Cadastro de empresa
3. Importação de extrato

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

**Solução:**
- Verifique se a `DATABASE_URL` está correta na Vercel
- Verifique se o banco permite conexões externas
- Para PlanetScale: certifique-se de que o banco está ativo (não pausado)

### Erro: "Module not found"

**Solução:**
- Verifique se todas as dependências estão no `package.json`
- Execute `pnpm install` localmente e commite o `pnpm-lock.yaml`

### Erro: "Build failed"

**Solução:**
- Verifique os logs de build na Vercel
- Certifique-se de que o `vercel.json` está correto
- Verifique se o TypeScript compila sem erros

### Frontend não carrega

**Solução:**
- Verifique se o `dist/public` contém os arquivos do build
- Verifique se as rotas estão configuradas corretamente no `vercel.json`

---

## 📝 Estrutura de Arquivos Necessários

Certifique-se de que estes arquivos existem:

```
projeto/
├── api/
│   └── index.ts          ← Serverless function para Vercel
├── server/               ← Código do servidor
├── client/               ← Código do frontend
├── vercel.json           ← Configuração da Vercel
├── package.json
├── tsconfig.json
├── tsconfig.server.json
└── vite.config.ts
```

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

1. **Banco de Dados:**
   - PlanetScale oferece plano gratuito com 5GB
   - Railway oferece $5 grátis por mês
   - Ambos são suficientes para começar

2. **Performance:**
   - A Vercel tem cold start (primeira requisição pode ser mais lenta)
   - Considere usar Vercel Pro para melhor performance

3. **Segurança:**
   - Use `JWT_SECRET` forte
   - Não commite credenciais
   - Use variáveis de ambiente na Vercel

4. **Monitoramento:**
   - Use os logs da Vercel para debug
   - Configure alertas se necessário

---

## ✅ Checklist Final

Antes de fazer deploy, verifique:

- [ ] Banco de dados online criado e acessível
- [ ] Migrations executadas (tabelas criadas)
- [ ] `.env` configurado localmente (para testes)
- [ ] Código commitado no GitHub
- [ ] `vercel.json` criado
- [ ] `api/index.ts` criado
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Build funciona localmente (`pnpm build`)

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs na Vercel
2. Teste localmente primeiro
3. Verifique a documentação da Vercel: [https://vercel.com/docs](https://vercel.com/docs)
4. Verifique a documentação do PlanetScale: [https://planetscale.com/docs](https://planetscale.com/docs)

---

**Boa sorte com o deploy! 🚀**

