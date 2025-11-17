# Scripts de Utilidade

## Criar Usuário de Teste

Script para criar um usuário de teste no sistema com credenciais pré-definidas.

### Como usar:

```bash
npm run create-test-user
```

ou

```bash
pnpm create-test-user
```

### Credenciais do usuário de teste:

- **Email:** `email@example.com`
- **Senha:** `#ConciliaTudoAgora2025*`
- **Nome:** `Usuário de Teste`

### Observações:

- O script verifica se o usuário já existe antes de criar
- Se o usuário já existir, o script apenas exibe as informações
- Certifique-se de que o banco de dados está rodando e acessível
- O arquivo `.env` deve estar configurado com a `DATABASE_URL` correta

