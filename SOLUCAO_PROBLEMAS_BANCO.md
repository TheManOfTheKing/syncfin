# 🔧 Solução de Problemas - Conexão com Banco de Dados

## ❌ Erro: "Erro ao conectar com o servidor"

Este erro geralmente ocorre quando:
1. O arquivo `.env` não existe ou está mal configurado
2. O MySQL/XAMPP não está rodando
3. O banco de dados não existe
4. As credenciais estão incorretas

---

## ✅ Solução Passo a Passo

### 1. Verificar se o arquivo `.env` existe

O arquivo `.env` deve estar na **raiz do projeto** (mesma pasta do `package.json`).

**Conteúdo mínimo necessário:**
```env
DATABASE_URL=mysql://root@localhost:3306/conciliacao_bancaria
PORT=3000
NODE_ENV=development
SESSION_SECRET=sua-chave-secreta-aleatoria
JWT_SECRET=outra-chave-secreta-aleatoria
```

### 2. Verificar se o MySQL está rodando

#### Windows (XAMPP):
1. Abra o **XAMPP Control Panel**
2. Verifique se o **MySQL** está com status "Running" (verde)
3. Se não estiver, clique em **Start**

#### Linux:
```bash
sudo systemctl status mysql
# ou
sudo service mysql status
```

#### macOS:
```bash
brew services list | grep mysql
```

### 3. Verificar se o banco de dados existe

#### Via phpMyAdmin (XAMPP):
1. Acesse: http://localhost/phpmyadmin
2. Verifique se existe o banco `conciliacao_bancaria`
3. Se não existir, crie:
   - Clique em "Novo"
   - Nome: `conciliacao_bancaria`
   - Collation: `utf8mb4_unicode_ci`
   - Clique em "Criar"

#### Via Terminal:
```bash
mysql -u root -p
```
```sql
SHOW DATABASES;
-- Se não existir, crie:
CREATE DATABASE conciliacao_bancaria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Verificar a DATABASE_URL

O formato correto é:
```
mysql://usuario:senha@host:porta/nome_banco
```

**Exemplos:**

**Sem senha (padrão XAMPP):**
```env
DATABASE_URL=mysql://root@localhost:3306/conciliacao_bancaria
```

**Com senha:**
```env
DATABASE_URL=mysql://root:suasenha@localhost:3306/conciliacao_bancaria
```

**MySQL em outra porta:**
```env
DATABASE_URL=mysql://root@localhost:3307/conciliacao_bancaria
```

### 5. Criar as tabelas no banco

Após criar o banco, execute:
```bash
pnpm db:push
```

Isso criará todas as tabelas necessárias.

### 6. Verificar logs do servidor

Ao iniciar o servidor (`pnpm dev`), você deve ver:
```
🔗 Conectando ao banco...
✅ Banco conectado com sucesso!
🚀 Servidor rodando na porta 3000
```

Se aparecer erro, leia a mensagem de erro que agora é mais descritiva.

---

## 🐛 Problemas Comuns

### Erro: "Access denied for user 'root'@'localhost'"

**Solução:**
- Verifique se a senha está correta no `.env`
- Se não tem senha, use: `mysql://root@localhost:3306/conciliacao_bancaria`
- Se tem senha, use: `mysql://root:SUASENHA@localhost:3306/conciliacao_bancaria`

### Erro: "Unknown database 'conciliacao_bancaria'"

**Solução:**
- Crie o banco de dados (passo 3 acima)
- Execute `pnpm db:push` para criar as tabelas

### Erro: "Can't connect to MySQL server"

**Solução:**
- Verifique se o MySQL está rodando (passo 2)
- Verifique se a porta está correta (padrão: 3306)
- Verifique se o firewall não está bloqueando

### Erro: "ECONNREFUSED"

**Solução:**
- MySQL não está rodando
- Porta incorreta
- Host incorreto (use `localhost` ou `127.0.0.1`)

---

## ✅ Checklist de Verificação

- [ ] Arquivo `.env` existe na raiz do projeto
- [ ] `DATABASE_URL` está configurada corretamente
- [ ] MySQL/XAMPP está rodando
- [ ] Banco `conciliacao_bancaria` existe
- [ ] Tabelas foram criadas (`pnpm db:push`)
- [ ] Credenciais (usuário/senha) estão corretas
- [ ] Porta do MySQL está correta (padrão: 3306)

---

## 🆘 Ainda com problemas?

1. Verifique os logs do servidor ao iniciar
2. Verifique os logs do MySQL/XAMPP
3. Teste a conexão manualmente:
   ```bash
   mysql -u root -p -h localhost -P 3306
   ```
4. Verifique se não há outro processo usando a porta 3000

