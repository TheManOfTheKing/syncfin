# Guia de Instalação - Sistema de Conciliação Bancária

## 📋 Requisitos do Sistema

### Windows
- Windows 10 ou superior
- 4GB RAM mínimo (8GB recomendado)
- 500MB espaço em disco
- XAMPP 8.0+ ou MySQL 8.0+
- Node.js 18.0+ ([Download](https://nodejs.org))

### Linux
- Ubuntu 20.04+ / Debian 11+
- 2GB RAM mínimo
- MySQL 8.0+ ou MariaDB 10.5+
- Node.js 18.0+

### macOS
- macOS 11 (Big Sur) ou superior
- MySQL 8.0+ ou MAMP
- Node.js 18.0+

## 🚀 Instalação no Windows (XAMPP)

### 1. Instalar XAMPP

1. Baixe o XAMPP: https://www.apachefriends.org/
2. Execute o instalador
3. Marque: Apache, MySQL, PHP, phpMyAdmin
4. Instale na pasta padrão: `C:\xampp`
5. Inicie o **XAMPP Control Panel**
6. Clique em **Start** no MySQL

### 2. Instalar Node.js

1. Baixe: https://nodejs.org (versão LTS)
2. Execute o instalador
3. Marque "Add to PATH"
4. Abra o terminal e teste:
```bash
node --version
npm --version
```

### 3. Instalar pnpm

```bash
npm install -g pnpm
```

### 4. Criar Banco de Dados

1. Abra: http://localhost/phpmyadmin
2. Clique em **"Novo"**
3. Nome do banco: `conciliacao_bancaria`
4. Collation: `utf8mb4_unicode_ci`
5. Clique em **"Criar"**

### 5. Extrair e Configurar o Projeto

1. Extraia o ZIP do projeto
2. Abra o terminal na pasta do projeto
3. Copie o arquivo de configuração:
```bash
copy .env.example .env
```

4. Edite o `.env` com suas configurações:
```env
DATABASE_URL=mysql://root@localhost:3306/conciliacao_bancaria
PORT=3000
NODE_ENV=development
SESSION_SECRET=mude-esta-chave-para-algo-aleatorio-e-seguro
JWT_SECRET=outra-chave-secreta-diferente-e-aleatoria
```

**IMPORTANTE:** Mude as chaves `SESSION_SECRET` e `JWT_SECRET` para valores aleatórios!

### 6. Instalar Dependências

```bash
pnpm install
```

Aguarde a instalação (pode levar alguns minutos).

### 7. Criar Tabelas no Banco

```bash
pnpm db:push
```

Isso criará automaticamente todas as 9 tabelas necessárias.

### 8. Criar Usuário Administrador

Abra o phpMyAdmin e execute este SQL:

```sql
INSERT INTO users (email, password, name, role, ativo, createdAt, updatedAt) 
VALUES (
  'admin@sistema.com',
  '$2a$10$rOZxqKZHMDAapL3Vg8K8eeGxZ0uJfvxhX7WqKpYvYZxqxqxqxqxqx',
  'Administrador',
  'admin',
  1,
  NOW(),
  NOW()
);
```

**Credenciais padrão:**
- Email: `admin@sistema.com`
- Senha: `admin123`

**IMPORTANTE:** Altere a senha após o primeiro login!

### 9. Iniciar o Sistema

**Modo Desenvolvimento:**
```bash
pnpm dev
```

Acesse: http://localhost:5173

**Modo Produção:**
```bash
pnpm build
pnpm start
```

Acesse: http://localhost:3000

## 🐧 Instalação no Linux (Ubuntu/Debian)

### 1. Instalar MySQL

```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### 2. Instalar Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Instalar pnpm

```bash
npm install -g pnpm
```

### 4. Criar Banco de Dados

```bash
sudo mysql -u root -p
```

No MySQL:
```sql
CREATE DATABASE conciliacao_bancaria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'conciliacao'@'localhost' IDENTIFIED BY 'senha_segura';
GRANT ALL PRIVILEGES ON conciliacao_bancaria.* TO 'conciliacao'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. Configurar Projeto

```bash
cp .env.example .env
nano .env
```

Edite:
```env
DATABASE_URL=mysql://conciliacao:senha_segura@localhost:3306/conciliacao_bancaria
```

### 6. Instalar e Iniciar

```bash
pnpm install
pnpm db:push
pnpm build
pnpm start
```

## 🍎 Instalação no macOS

### 1. Instalar Homebrew (se não tiver)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Instalar MySQL

```bash
brew install mysql
brew services start mysql
```

### 3. Instalar Node.js

```bash
brew install node@18
```

### 4. Seguir passos do Linux

A partir daqui, siga os passos 3-6 da instalação Linux.

## 🔧 Solução de Problemas

### Erro: "Cannot connect to MySQL"

**Windows:**
- Verifique se o MySQL está rodando no XAMPP Control Panel
- Teste a conexão: `mysql -u root -h 127.0.0.1`

**Linux:**
- `sudo systemctl status mysql`
- `sudo systemctl start mysql`

### Erro: "pnpm: command not found"

```bash
npm install -g pnpm
```

Feche e abra o terminal novamente.

### Erro: "Port 3000 already in use"

Mude a porta no `.env`:
```env
PORT=3001
```

### Erro ao criar tabelas

1. Verifique se o banco existe
2. Verifique as credenciais no `.env`
3. Execute manualmente:
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## 📊 Verificar Instalação

Após instalação, verifique:

1. ✅ Banco de dados criado (10 tabelas)
2. ✅ Servidor rodando sem erros
3. ✅ Frontend acessível no navegador
4. ✅ Login funcionando
5. ✅ Dashboard carregando

## 🔐 Segurança Pós-Instalação

1. **Altere as chaves secretas** no `.env`
2. **Mude a senha do admin** após primeiro login
3. **Configure firewall** se for servidor público
4. **Use HTTPS** em produção
5. **Faça backups** regulares do banco

## 📝 Próximos Passos

Após instalação bem-sucedida:

1. Faça login com `admin@sistema.com` / `admin123`
2. Altere a senha do administrador
3. Cadastre sua primeira empresa
4. Configure as categorias contábeis
5. Adicione contas bancárias
6. Importe seu primeiro extrato

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do servidor
2. Consulte a documentação
3. Verifique se todas as dependências estão instaladas
4. Entre em contato com o suporte

---

**Instalação completa! Bom uso do sistema! 🎉**
