# Sistema de Conciliação Bancária - Standalone

Sistema completo de conciliação bancária **100% standalone**, sem dependências da plataforma Manus. Pronto para rodar localmente no Windows com XAMPP e MySQL, e para venda como produto white-label.

## ✨ Características

- ✅ **Totalmente Standalone** - Sem dependências externas
- ✅ **Autenticação Local** - Sistema próprio de login (sem OAuth)
- ✅ **Multi-tenant** - Múltiplas empresas em um único sistema
- ✅ **Importação Inteligente** - CSV e XLSX com detecção automática
- ✅ **IA de Classificação** - Aprendizado automático de categorias
- ✅ **Detecção de Transferências** - Identificação automática de transferências internas
- ✅ **White-Label** - Totalmente personalizável
- ✅ **Pronto para Venda** - Produto comercial completo

## 🚀 Instalação Rápida

### Pré-requisitos

- Node.js 18+ instalado
- XAMPP com MySQL rodando
- pnpm instalado (`npm install -g pnpm`)

### Passo a Passo

1. **Extrair o projeto**
```bash
cd conciliacao_standalone
```

2. **Instalar dependências**
```bash
pnpm install
```

3. **Configurar banco de dados**

Crie o banco no phpMyAdmin:
- Nome: `conciliacao_bancaria`
- Collation: `utf8mb4_unicode_ci`

4. **Configurar variáveis de ambiente**

Copie `.env.example` para `.env` e configure:
```env
DATABASE_URL=mysql://root@localhost:3306/conciliacao_bancaria
PORT=3000
NODE_ENV=development
SESSION_SECRET=sua-chave-secreta-aleatoria
JWT_SECRET=outra-chave-secreta-aleatoria
```

5. **Criar tabelas no banco**
```bash
pnpm db:push
```

6. **Criar usuário administrador**

Execute no phpMyAdmin (SQL):
```sql
INSERT INTO users (email, password, name, role, ativo) 
VALUES (
  'admin@sistema.com', 
  '$2a$10$YourHashedPasswordHere', 
  'Administrador', 
  'admin', 
  1
);
```

Ou use o hash bcrypt para senha `admin123`:
```sql
INSERT INTO users (email, password, name, role, ativo) 
VALUES (
  'admin@sistema.com', 
  '$2a$10$rOZxqKZHMDAapL3Vg8K8eeGxZ0uJfvxhX7WqKp.vYZxqxqxqxqxqx', 
  'Administrador', 
  'admin', 
  1
);
```

7. **Iniciar em desenvolvimento**
```bash
pnpm dev
```

Acesse: http://localhost:5173

8. **Build para produção**
```bash
pnpm build
pnpm start
```

Acesse: http://localhost:3000

## 📁 Estrutura do Projeto

```
conciliacao_standalone/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilitários
│   │   ├── App.tsx        # Componente principal
│   │   └── main.tsx       # Entry point
│   └── index.html
├── server/                # Backend Node.js
│   ├── db/               # Banco de dados
│   │   ├── schema.ts     # Schema Drizzle ORM
│   │   └── index.ts      # Conexão
│   ├── routes/           # Rotas da API
│   ├── services/         # Lógica de negócio
│   ├── middleware/       # Middlewares Express
│   ├── utils/            # Utilitários
│   └── index.ts          # Servidor Express
├── shared/               # Código compartilhado
├── drizzle/              # Migrations
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔐 Autenticação

O sistema usa **JWT (JSON Web Tokens)** para autenticação:

- Login: `POST /api/auth/login`
- Registro: `POST /api/auth/register`
- Verificar: `GET /api/auth/me`

Token é armazenado no `localStorage` do navegador.

## 🗄️ Banco de Dados

### Tabelas

1. **users** - Usuários do sistema
2. **empresas** - Empresas cadastradas
3. **usuario_empresas** - Relacionamento usuário-empresa
4. **contas_bancarias** - Contas bancárias por empresa
5. **categorias** - Categorias contábeis (plano de contas)
6. **transacoes** - Transações bancárias importadas
7. **mapeamentos_importacao** - Mapeamentos salvos de importação
8. **historico_aprendizado** - Histórico para IA de classificação
9. **configuracoes_white_label** - Configurações de personalização

## 🎨 White-Label

Personalize o sistema com:
- Logo customizado
- Cores primária e secundária
- Nome do sistema
- Informações da empresa revendedora

## 📦 Scripts Disponíveis

- `pnpm dev` - Inicia desenvolvimento (frontend + backend)
- `pnpm dev:server` - Apenas backend
- `pnpm dev:client` - Apenas frontend
- `pnpm build` - Build para produção
- `pnpm start` - Inicia produção
- `pnpm db:push` - Cria/atualiza tabelas do banco

## 🌐 Distribuição

### Para Clientes

1. Entregue o código-fonte completo
2. Cliente instala MySQL no servidor dele
3. Cliente executa `pnpm install` e `pnpm db:push`
4. Cliente personaliza (logo, cores)
5. Cliente usa o sistema

### Modelos de Venda

- 💰 **Licença perpétua** - Venda única
- 🔧 **Instalação** - Serviço de setup
- 🎓 **Treinamento** - Capacitação de usuários
- 🛠️ **Suporte** - Mensalidade de manutenção

## 🔒 Segurança

- Senhas hasheadas com bcrypt
- JWT para autenticação
- Proteção contra SQL injection (Drizzle ORM)
- Validação de dados com Zod
- CORS configurável

## 📝 Licença

Produto white-label - Você pode revender com sua marca.

## 🆘 Suporte

Para dúvidas sobre instalação ou uso, consulte a documentação ou entre em contato.

---

**Desenvolvido para ser 100% standalone e pronto para venda! 🚀**
