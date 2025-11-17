# 📥 Instruções para Importar o Banco no Railway

## ✅ Arquivo Preparado

O arquivo `importar_railway.sql` contém **exatamente** as 9 tabelas do seu banco local que funciona.

## 🚀 Como Importar

### Opção 1: Via Linha de Comando (Recomendado)

Se você tem MySQL instalado localmente:

```bash
mysql -h ballast.proxy.rlwy.net -P 27358 -u root -p railway < importar_railway.sql
```

Quando pedir a senha, digite: `VLRjpVkTXWiKoKImnfFRTMwymyJadedr`

### Opção 2: Via MySQL Workbench

1. Abra o MySQL Workbench
2. Crie uma nova conexão:
   - **Hostname:** `ballast.proxy.rlwy.net`
   - **Port:** `27358`
   - **Username:** `root`
   - **Password:** `VLRjpVkTXWiKoKImnfFRTMwymyJadedr`
   - **Default Schema:** `railway`
3. Conecte
4. Vá em **File** → **Open SQL Script**
5. Selecione o arquivo `importar_railway.sql`
6. Execute o script (⚡ ícone ou Ctrl+Shift+Enter)

### Opção 3: Via DBeaver

1. Crie uma nova conexão MySQL
2. Configure:
   - **Host:** `ballast.proxy.rlwy.net`
   - **Port:** `27358`
   - **Database:** `railway`
   - **Username:** `root`
   - **Password:** `VLRjpVkTXWiKoKImnfFRTMwymyJadedr`
3. Conecte
4. Abra o arquivo `importar_railway.sql`
5. Execute o script

## ✅ Verificação

Após importar, verifique se foram criadas **exatamente 9 tabelas**:

1. ✅ `categorias`
2. ✅ `configuracoes_white_label`
3. ✅ `contas_bancarias`
4. ✅ `empresas`
5. ✅ `historico_aprendizado`
6. ✅ `mapeamentos_importacao`
7. ✅ `transacoes`
8. ✅ `users` (com 2 usuários já inseridos)
9. ✅ `usuario_empresas`

**❌ NÃO deve ter** a tabela `_drizzle_migrations`!

## 📝 Próximo Passo

Após importar com sucesso, atualize a `DATABASE_URL` na Vercel:

```
mysql://root:VLRjpVkTXWiKoKImnfFRTMwymyJadedr@ballast.proxy.rlwy.net:27358/railway
```

## ⚠️ Importante

- **NÃO** use `pnpm db:push` - isso criaria migrações
- **NÃO** use `drizzle-kit migrate` - isso criaria a tabela `_drizzle_migrations`
- **USE** o arquivo `importar_railway.sql` diretamente

