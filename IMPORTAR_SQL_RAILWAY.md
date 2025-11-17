# 📥 Importar SQL Diretamente no Railway

## ❌ Problema

A migração do Drizzle criou uma tabela extra `_drizzle_migrations` que não existe no seu banco local.

## ✅ Solução: Importar SQL Diretamente

Você precisa importar o arquivo `drizzle/conciliacao_bancaria.sql` diretamente no Railway, sem usar migrações do Drizzle.

### Opção 1: Via Cliente MySQL (Recomendado)

Se você tem MySQL instalado localmente:

```bash
mysql -h ballast.proxy.rlwy.net -P 27358 -u root -p railway < drizzle/conciliacao_bancaria.sql
# Senha: VLRjpVkTXWiKoKImnfFRTMwymyJadedr
```

### Opção 2: Via MySQL Workbench ou DBeaver

1. Conecte ao Railway:
   - Host: `ballast.proxy.rlwy.net`
   - Port: `27358`
   - User: `root`
   - Password: `VLRjpVkTXWiKoKImnfFRTMwymyJadedr`
   - Database: `railway`

2. Abra o arquivo `drizzle/conciliacao_bancaria.sql`
3. Execute o script completo

### Opção 3: Via phpMyAdmin (se tiver acesso)

1. Conecte ao Railway via phpMyAdmin
2. Selecione o banco `railway`
3. Vá em "Importar"
4. Selecione o arquivo `drizzle/conciliacao_bancaria.sql`
5. Clique em "Executar"

## 📋 Arquivo a Importar

O arquivo correto está em: `drizzle/conciliacao_bancaria.sql`

Este é o SQL exportado do seu banco local que tem exatamente 9 tabelas (sem `_drizzle_migrations`).

## ⚠️ Importante

- **NÃO** use `pnpm db:push` - isso cria migrações
- **NÃO** use `drizzle-kit migrate` - isso cria a tabela `_drizzle_migrations`
- **USE** o SQL exportado diretamente

