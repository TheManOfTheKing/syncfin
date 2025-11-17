# 🔍 Diagnóstico do Erro 500 no Login

## Problema
Erro 500 (Internal Server Error) ao tentar fazer login em `/api/auth/login`

## Possíveis Causas

### 1. Tabela `users` não existe no banco
**Solução:**
```bash
pnpm db:push
```

### 2. Banco de dados não está conectado
**Verificar:**
- MySQL/XAMPP está rodando?
- DATABASE_URL no `.env` está correta?
- Banco `conciliacao_bancaria` existe?

### 3. Usuário não existe no banco
**Criar usuário admin:**
```sql
-- No phpMyAdmin ou MySQL CLI
INSERT INTO users (email, password, name, role, ativo) 
VALUES (
  'admin@sistema.com', 
  '$2a$10$rOZxqKZHMDAapL3Vg8K8eeGxZ0uJfvxhX7WqKp.vYZxqxqxqxqxqx', 
  'Administrador', 
  'admin', 
  1
);
```

**Ou usar senha "admin123" com hash correto:**
```sql
INSERT INTO users (email, password, name, role, ativo) 
VALUES (
  'admin@sistema.com', 
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 
  'Administrador', 
  'admin', 
  1
);
```

## Como Diagnosticar

### 1. Verificar logs do servidor
Ao fazer login, verifique o terminal onde o servidor está rodando. Agora mostra:
- ❌ Erro detalhado
- Stack trace
- Código do erro

### 2. Verificar se tabela existe
```sql
-- No phpMyAdmin
SHOW TABLES LIKE 'users';
```

### 3. Testar conexão manual
```bash
mysql -u root -p -h localhost -P 3306 conciliacao_bancaria
```

### 4. Verificar resposta da API
Agora a API retorna mensagens mais detalhadas:
- Se tabela não existe: "Tabela não encontrada no banco de dados"
- Se conexão falha: "Erro ao conectar com o banco de dados"
- Outros erros: Mensagem e código do erro (em desenvolvimento)

## Próximos Passos

1. **Pare o servidor** (Ctrl+C)
2. **Execute:** `pnpm db:push` (cria as tabelas)
3. **Crie o usuário admin** (SQL acima)
4. **Reinicie:** `pnpm dev`
5. **Teste o login novamente**

## Verificação Rápida

Execute no terminal do servidor e veja se aparece:
```
✅ Banco conectado com sucesso!
```

Se aparecer, o problema é provavelmente:
- Tabela não existe → Execute `pnpm db:push`
- Usuário não existe → Crie o usuário admin

