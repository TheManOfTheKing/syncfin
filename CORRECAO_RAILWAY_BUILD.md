# 🔧 Correção: Erro "Cannot find module" no Railway

## ❌ Problema

O Railway estava tentando executar `node dist/server/index.js`, mas o arquivo não existia porque o build estava gerando em `dist/server/server/index.js`.

## ✅ Solução Aplicada

### 1. Corrigido `tsconfig.server.json`

**Antes:**
```json
{
  "outDir": "./dist/server",
  "rootDir": ".",
  "include": ["server/**/*", "shared/**/*", "api/**/*"]
}
```

**Depois:**
```json
{
  "outDir": "./dist",
  "rootDir": ".",
  "include": ["server/**/*", "shared/**/*"]
}
```

**Por quê?**
- Com `outDir: "./dist/server"` e `rootDir: "."`, o TypeScript mantém a estrutura de pastas
- `server/index.ts` virava `dist/server/server/index.js` ❌
- Agora com `outDir: "./dist"`, `server/index.ts` vira `dist/server/index.js` ✅

### 2. Atualizado `.nixpacks.toml`

**Mudanças:**
- Adicionado `pnpm` nas dependências do Nixpacks
- Mudado de `npm ci` para `pnpm install --frozen-lockfile`
- Mudado de `npm run build:server` para `pnpm run build:server`

**Por quê?**
- O projeto usa `pnpm` (há `pnpm-lock.yaml`)
- O Railway precisa usar o mesmo gerenciador de pacotes

## 📋 Próximos Passos

1. **Fazer commit e push das mudanças:**
   ```bash
   git add tsconfig.server.json .nixpacks.toml
   git commit -m "fix: corrigir caminho de build do servidor para Railway"
   git push origin main
   ```

2. **No Railway:**
   - O Railway vai detectar automaticamente o novo commit
   - Vai executar o build novamente
   - Agora deve encontrar `dist/server/index.js` ✅

3. **Verificar logs:**
   - Se ainda der erro, verifique os logs do Railway
   - O build deve mostrar: `✓ Compiled successfully`

## 🔍 Verificação Local (Opcional)

Para testar localmente antes de fazer deploy:

```bash
# Instalar dependências
pnpm install

# Fazer build
pnpm run build:server

# Verificar se o arquivo foi gerado
ls dist/server/index.js

# Testar execução
node dist/server/index.js
```

## ⚠️ Nota Importante

O script `start` no `package.json` está correto:
```json
"start": "cross-env NODE_ENV=production node dist/server/index.js"
```

O Railway vai executar esse comando após o build.

