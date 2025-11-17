# ⚡ Deploy Rápido - FinSync na Vercel

## 🎯 Resumo dos Passos

### 1. Banco de Dados Online (5 minutos)

**PlanetScale (Recomendado):**
1. Acesse: https://planetscale.com
2. Crie conta → "Create database"
3. Nome: `finsync`
4. Copie a `DATABASE_URL` (já vem com SSL)

### 2. Executar Migrations Localmente

```bash
# Configure .env com a DATABASE_URL do PlanetScale
echo "DATABASE_URL=mysql://..." > .env
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env

# Execute migrations
pnpm install
pnpm db:push
```

### 3. GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/SEU_USUARIO/finsync.git
git push -u origin main
```

### 4. Vercel

1. Acesse: https://vercel.com
2. "Add New Project" → Importe do GitHub
3. Configure variáveis de ambiente:
   - `DATABASE_URL` = string do PlanetScale
   - `JWT_SECRET` = chave secreta forte
   - `NODE_ENV` = `production`
4. Deploy!

### 5. Testar

- Frontend: `https://seu-projeto.vercel.app`
- API Health: `https://seu-projeto.vercel.app/api/health`

---

## ✅ Arquivos Criados para Deploy

- ✅ `vercel.json` - Configuração da Vercel
- ✅ `api/index.ts` - Serverless function
- ✅ `.gitignore` - Atualizado
- ✅ `package.json` - Script `vercel-build` adicionado

---

## 🔧 Variáveis de Ambiente na Vercel

| Variável | Valor | Onde Obter |
|----------|-------|------------|
| `DATABASE_URL` | `mysql://...` | PlanetScale → Connect |
| `JWT_SECRET` | `string-aleatoria` | Gerar com `openssl rand -base64 32` |
| `NODE_ENV` | `production` | Fixo |

---

## 📚 Documentação Completa

Veja `DEPLOY_VERCEL.md` para instruções detalhadas.

