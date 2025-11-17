# 🔧 Correção: Erro de CORS entre Vercel e Railway

## ❌ Problema

O frontend na Vercel (`https://syncfin.vercel.app`) não conseguia se conectar ao backend no Railway devido a erro de CORS:

```
Access-Control-Allow-Origin header contains the invalid value 'syncfin.vercel.app'
```

O navegador exige que o header CORS tenha o protocolo completo: `https://syncfin.vercel.app`

## ✅ Solução Aplicada

### 1. Função de Normalização de URL

Adicionada função que garante que URLs sempre tenham protocolo:

```typescript
function normalizeUrl(url: string): string {
  if (!url) return 'http://localhost:5173';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`; // Adiciona https:// se não tiver
}
```

### 2. Validação Dinâmica de CORS

Agora o CORS:
- ✅ Normaliza automaticamente URLs sem protocolo
- ✅ Permite múltiplas origens (desenvolvimento e produção)
- ✅ Valida dinamicamente cada requisição
- ✅ Loga todas as requisições CORS para debug

### 3. Origens Permitidas

O servidor agora permite:
- `http://localhost:5173` (desenvolvimento local)
- `http://localhost:3000` (alternativa local)
- `https://syncfin.vercel.app` (produção Vercel)
- `https://syncfin-front.vercel.app` (alternativa Vercel)
- Qualquer URL definida em `FRONTEND_URL` (normalizada)

## 📋 Verificar Variáveis de Ambiente no Railway

**IMPORTANTE:** Verifique se a variável `FRONTEND_URL` no Railway está configurada corretamente:

1. Acesse o Railway Dashboard
2. Vá em **Variables** do seu serviço
3. Verifique `FRONTEND_URL`:
   - ✅ **Correto:** `https://syncfin.vercel.app`
   - ❌ **Errado:** `syncfin.vercel.app` (sem protocolo)

Se estiver sem protocolo, o código agora corrige automaticamente, mas é melhor configurar corretamente.

## 🚀 Próximos Passos

1. **Fazer commit e push:**
   ```bash
   git add server/index.ts
   git commit -m "fix: corrigir CORS para aceitar URLs com e sem protocolo"
   git push origin main
   ```

2. **Aguardar deploy no Railway:**
   - O Railway vai detectar o novo commit
   - Vai fazer rebuild automaticamente
   - O servidor vai iniciar com a nova configuração CORS

3. **Testar no frontend:**
   - Acesse `https://syncfin.vercel.app/login`
   - Tente fazer login
   - O erro de CORS deve desaparecer ✅

## 🔍 Debug

Se ainda houver problemas, verifique os logs do Railway:

1. No Railway Dashboard, vá em **Deployments** → **View Logs**
2. Procure por linhas que começam com:
   - `🌐 FRONTEND_URL (raw):`
   - `🌐 FRONTEND_URL (normalized):`
   - `🌐 Origens permitidas:`
   - `✅ CORS permitido para:` ou `❌ CORS bloqueado para:`

Isso vai mostrar exatamente o que está acontecendo.

## ✅ Resultado Esperado

Após o deploy:
- ✅ Frontend consegue fazer requisições ao backend
- ✅ Login funciona
- ✅ Todas as APIs respondem corretamente
- ✅ Sem erros de CORS no console do navegador

