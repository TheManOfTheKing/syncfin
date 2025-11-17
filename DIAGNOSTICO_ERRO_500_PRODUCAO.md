# 🔍 Diagnóstico: Erro 500 no Login em Produção

## ❌ Problema

Erro 500 ao tentar fazer login na Vercel:
- `api/auth/login` retorna 500
- "Erro ao conectar com o servidor"

## 🔍 Possíveis Causas

### 1. DATABASE_URL não configurada na Vercel
- **Sintoma:** Erro 500 sem detalhes
- **Solução:** Verificar se `DATABASE_URL` está configurada na Vercel

### 2. DATABASE_URL incorreta na Vercel
- **Sintoma:** Erro de conexão com banco
- **Solução:** Usar a URL pública do Railway

### 3. Banco de dados não acessível
- **Sintoma:** Timeout ou erro de conexão
- **Solução:** Verificar se Railway está ativo

### 4. Tabelas não existem
- **Sintoma:** Erro "Table doesn't exist"
- **Solução:** Verificar se migração foi executada

## ✅ Passos para Diagnosticar

### Passo 1: Verificar Variáveis na Vercel

1. Acesse o projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Verifique se `DATABASE_URL` está configurada:
   ```
   mysql://root:efEAlrmvZVAFwPbIbrYOPKQVpnqMfxMT@crossover.proxy.rlwy.net:19882/railway
   ```

### Passo 2: Testar Endpoint de Diagnóstico

Acesse no navegador:
```
https://syncfin.vercel.app/api/auth/diagnostico
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "mensagem": "Conexão com banco funcionando",
  "tabela_users": "existe",
  "database_url": "configurada"
}
```

**Se der erro:**
- Copie a mensagem de erro completa
- Isso vai indicar o problema exato

### Passo 3: Verificar Logs na Vercel

1. Acesse **Deployments** na Vercel
2. Clique no último deployment
3. Vá em **Functions** → **api/index**
4. Veja os **logs de runtime**
5. Procure por erros relacionados a:
   - Conexão com banco
   - Tabelas não encontradas
   - DATABASE_URL

### Passo 4: Verificar Banco Railway

1. Acesse o Railway
2. Verifique se o banco está **Active**
3. Verifique se as tabelas existem:
   - `users`
   - `empresas`
   - etc.

## 🔧 Soluções Rápidas

### Solução 1: Atualizar DATABASE_URL na Vercel

Certifique-se de que está usando a **URL pública**:

```
mysql://root:efEAlrmvZVAFwPbIbrYOPKQVpnqMfxMT@crossover.proxy.rlwy.net:19882/railway
```

### Solução 2: Verificar se Usuários Existem

Execute no Railway:
```sql
SELECT * FROM users;
```

Deve retornar os 2 usuários criados.

### Solução 3: Testar Conexão Local

Teste localmente se a conexão funciona:
```bash
pnpm dev
```

Se funcionar localmente, o problema é na Vercel.

## 📝 Informações Necessárias

Para diagnosticar melhor, preciso:
1. Resultado de `/api/auth/diagnostico`
2. Logs de runtime da Vercel (aba Functions)
3. Confirmação de que `DATABASE_URL` está configurada na Vercel

