# 🔧 Solução para Erro 500 - Login não funciona

## 🔍 Diagnóstico

O erro 500 indica que a API está respondendo, mas há um erro interno. As causas mais comuns são:

1. **❌ Tabelas não criadas no banco Railway** (mais provável)
2. **❌ DATABASE_URL incorreta ou não configurada**
3. **❌ Banco de dados inacessível**

## ✅ Solução Passo a Passo

### Passo 1: Verificar se as Tabelas Existem

As tabelas precisam ser criadas no banco Railway. Execute as migrações:

```bash
# Configure a DATABASE_URL no seu .env local com a URL do Railway
DATABASE_URL=mysql://root:alhBAdzteoRhNqoNRKuUwxpUhuCRDVhp@switchyard.proxy.rlwy.net:11475/conciliacao_bancaria

# Execute as migrações
pnpm db:push
```

### Passo 2: Verificar Endpoint de Diagnóstico

Após fazer o deploy, teste:

```
https://syncfin.vercel.app/api/auth/diagnostico
```

**Resultado esperado se tudo estiver OK:**
```json
{
  "status": "ok",
  "mensagem": "Conexão com banco funcionando",
  "tabela_users": "existe",
  "database_url": "configurada"
}
```

**Se der erro de tabela:**
```json
{
  "status": "erro",
  "mensagem": "...",
  "erro_tipo": "Tabela não existe - Execute migrações"
}
```

### Passo 3: Executar Migrações Localmente

1. **Configure o .env local:**
   ```env
   DATABASE_URL=mysql://root:alhBAdzteoRhNqoNRKuUwxpUhuCRDVhp@switchyard.proxy.rlwy.net:11475/conciliacao_bancaria
   JWT_SECRET=px#UDA^fy&gNv5
   NODE_ENV=development
   ```

2. **Execute as migrações:**
   ```bash
   pnpm db:push
   ```

   Isso vai criar todas as tabelas no banco Railway.

3. **Verifique se funcionou:**
   - Teste o endpoint `/api/auth/diagnostico` novamente
   - Deve retornar `"status": "ok"`

### Passo 4: Verificar Variáveis na Vercel

Certifique-se de que estas variáveis estão configuradas:

- ✅ `DATABASE_URL` = `mysql://root:alhBAdzteoRhNqoNRKuUwxpUhuCRDVhp@switchyard.proxy.rlwy.net:11475/conciliacao_bancaria`
- ✅ `JWT_SECRET` = `px#UDA^fy&gNv5`
- ✅ `NODE_ENV` = `production`

### Passo 5: Fazer Novo Deploy

Após executar as migrações:

1. Faça commit e push (se necessário)
2. A Vercel vai fazer rebuild automaticamente
3. Teste o login novamente

## 🐛 Se Ainda Não Funcionar

### Verificar Logs na Vercel

1. Acesse **Deployments** na Vercel
2. Clique no último deployment
3. Vá em **Functions** → **api/index**
4. Veja os logs de erro
5. Copie a mensagem de erro completa

### Verificar Banco Railway

1. Acesse o Railway
2. Verifique se o banco está **Active**
3. Vá em **Data** → **MySQL**
4. Verifique se as tabelas existem:
   - `users`
   - `empresas`
   - `transacoes`
   - etc.

### Testar Conexão Direta

Você pode testar a conexão com o banco usando um cliente MySQL:

```bash
mysql -h switchyard.proxy.rlwy.net -P 11475 -u root -p
# Senha: alhBAdzteoRhNqoNRKuUwxpUhuCRDVhp
```

Depois execute:
```sql
USE conciliacao_bancaria;
SHOW TABLES;
```

Se não houver tabelas, execute as migrações.

## 📝 Checklist Final

- [ ] DATABASE_URL configurada corretamente no .env local
- [ ] Migrações executadas (`pnpm db:push`)
- [ ] Tabelas criadas no banco Railway (verificar com `SHOW TABLES`)
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Endpoint `/api/auth/diagnostico` retorna `"status": "ok"`
- [ ] Login funciona após todas as etapas

## 🆘 Próximos Passos

1. Execute `pnpm db:push` com a DATABASE_URL do Railway
2. Teste `/api/auth/diagnostico`
3. Me envie o resultado para eu ajudar a diagnosticar

