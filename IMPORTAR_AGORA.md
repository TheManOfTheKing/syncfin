# 🚀 Importar Banco SQL no Railway - AGORA

## ⚠️ IMPORTANTE: URL Pública Necessária

A URL que você forneceu (`mysql.railway.internal:3306`) é **interna** e só funciona dentro do Railway.

Para importar de fora, você precisa da **URL pública** do Railway.

## 📋 Como Obter a URL Pública

1. Acesse o Railway
2. Clique no serviço MySQL
3. Vá em **Variables** ou **Connect**
4. Procure por **`MYSQL_PUBLIC_URL`** ou **`PUBLIC_URL`**
5. Copie essa URL (formato: `mysql://root:SENHA@HOST:PORTA/railway`)

## ✅ Importação Direta (Sem Drizzle)

### Opção 1: Via Linha de Comando (MySQL instalado)

```bash
mysql -h HOST_PUBLICO -P PORTA_PUBLICA -u root -p railway < conciliacao_bancaria.sql
```

**Substitua:**
- `HOST_PUBLICO` pela URL pública do Railway (ex: `ballast.proxy.rlwy.net`)
- `PORTA_PUBLICA` pela porta pública (ex: `27358`)
- Senha: `efEAlrmvZVAFwPbIbrYOPKQVpnqMfxMT`

### Opção 2: Via MySQL Workbench

1. **Criar Nova Conexão:**
   - Hostname: `HOST_PUBLICO` (da URL pública)
   - Port: `PORTA_PUBLICA` (da URL pública)
   - Username: `root`
   - Password: `efEAlrmvZVAFwPbIbrYOPKQVpnqMfxMT`
   - Default Schema: `railway`

2. **Conectar**

3. **Importar:**
   - File → Open SQL Script
   - Selecione: `conciliacao_bancaria.sql`
   - Execute (⚡ ou Ctrl+Shift+Enter)

### Opção 3: Via DBeaver

1. Criar conexão MySQL
2. Configurar com a URL pública
3. Abrir e executar `conciliacao_bancaria.sql`

## 📝 Arquivo a Importar

**Arquivo:** `conciliacao_bancaria.sql` (na raiz do projeto)

Este arquivo tem **exatamente 9 tabelas** (sem `_drizzle_migrations`).

## ✅ Verificação

Após importar, verifique se há **9 tabelas**:

1. `categorias`
2. `configuracoes_white_label`
3. `contas_bancarias`
4. `empresas`
5. `historico_aprendizado`
6. `mapeamentos_importacao`
7. `transacoes`
8. `users`
9. `usuario_empresas`

## 🔄 Após Importar

Atualize a `DATABASE_URL` na Vercel com a URL pública do Railway.

