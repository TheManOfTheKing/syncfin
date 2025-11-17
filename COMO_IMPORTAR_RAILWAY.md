# 📥 Como Importar o SQL no Railway

## ✅ Arquivo Preparado

Criei o arquivo `importar_railway.sql` com exatamente as 9 tabelas do seu banco local (sem `_drizzle_migrations`).

## 🚀 Opção 1: Via Linha de Comando (MySQL instalado)

```bash
mysql -h ballast.proxy.rlwy.net -P 27358 -u root -p railway < importar_railway.sql
```

Quando pedir a senha, digite: `VLRjpVkTXWiKoKImnfFRTMwymyJadedr`

## 🖥️ Opção 2: Via MySQL Workbench ou DBeaver

1. **Conecte ao Railway:**
   - Host: `ballast.proxy.rlwy.net`
   - Port: `27358`
   - Username: `root`
   - Password: `VLRjpVkTXWiKoKImnfFRTMwymyJadedr`
   - Database: `railway`

2. **Abra o arquivo `importar_railway.sql`**

3. **Execute o script completo** (Ctrl+Shift+Enter ou botão Execute)

## 🌐 Opção 3: Via phpMyAdmin (se tiver acesso)

1. Conecte ao Railway via phpMyAdmin
2. Selecione o banco `railway`
3. Vá em **Importar**
4. Selecione o arquivo `importar_railway.sql`
5. Clique em **Executar**

## ✅ Verificação

Após importar, verifique se foram criadas **exatamente 9 tabelas**:

1. `categorias`
2. `configuracoes_white_label`
3. `contas_bancarias`
4. `empresas`
5. `historico_aprendizado`
6. `mapeamentos_importacao`
7. `transacoes`
8. `users`
9. `usuario_empresas`

**NÃO deve ter** a tabela `_drizzle_migrations`!

## 📝 Próximo Passo

Após importar com sucesso, atualize a `DATABASE_URL` na Vercel:

```
mysql://root:VLRjpVkTXWiKoKImnfFRTMwymyJadedr@ballast.proxy.rlwy.net:27358/railway
```

