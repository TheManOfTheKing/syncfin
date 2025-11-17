# Guia de Deploy: Vercel (Frontend) + Railway (Backend)

Este guia detalha o processo para fazer o deploy da aplicação, com o frontend na Vercel e o backend + banco de dados no Railway.

## Arquitetura de Deploy

- **Frontend (React SPA)**: Deployado como um site estático na **Vercel**.
- **Backend (Express Server)**: Deployado como um serviço no **Railway**.
- **Banco de Dados (MySQL)**: Provisionado como um serviço no **Railway**.

---

## Passo 1: Configurar o Backend e Banco no Railway

### 1.1. Crie um Novo Projeto no Railway

1.  Acesse seu painel do Railway.
2.  Clique em **New Project**.
3.  Selecione **Deploy from GitHub repo** e escolha o seu repositório.

### 1.2. Adicione um Serviço de Banco de Dados MySQL

1.  Dentro do seu projeto no Railway, clique em **New**.
2.  Selecione **Database** > **Add MySQL**.
3.  O Railway irá provisionar um banco de dados e disponibilizar a variável `DATABASE_URL` automaticamente para o seu serviço de backend.

### 1.3. Configure o Serviço do Backend

O Railway irá detectar o `railway.json` e configurar o build e o deploy automaticamente. Você só precisa configurar as variáveis de ambiente.

1.  Vá para o seu serviço de backend no Railway.
2.  Acesse a aba **Variables**.
3.  Adicione as seguintes variáveis:

| Variável | Valor | Descrição |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Define o ambiente para produção. |
| `JWT_SECRET` | `sua_chave_secreta_forte` | Chave para assinar os tokens JWT. Use um valor seguro. |
| `FRONTEND_URL` | `https://seu-projeto.vercel.app` | URL do seu frontend na Vercel (você obterá no próximo passo). |

4.  A variável `DATABASE_URL` já deve estar presente, injetada pelo serviço do MySQL.

### 1.4. Inicie o Deploy

O Railway fará o deploy automaticamente após a configuração. Verifique os logs de build e deploy para garantir que tudo correu bem. A URL do seu backend será algo como `https://seu-backend-XXXX.up.railway.app`.

---

## Passo 2: Configurar o Frontend na Vercel

### 2.1. Crie um Novo Projeto na Vercel

1.  Acesse seu painel da Vercel.
2.  Clique em **Add New...** > **Project**.
3.  Selecione seu repositório no GitHub.

### 2.2. Configure o Projeto

A Vercel deve detectar que é um projeto Vite e configurar a maioria das opções automaticamente. Verifique se as configurações estão corretas:

- **Framework Preset**: `Vite`
- **Build Command**: `npm run build:client` (ou deixe o padrão da Vercel `vite build` se o `vercel.json` estiver correto).
- **Output Directory**: `dist/public` (conforme `vercel.json`).

### 2.3. Adicione a Variável de Ambiente

1.  Vá para as configurações do projeto (**Settings** > **Environment Variables**).
2.  Adicione a seguinte variável:

| Variável | Valor | Descrição |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://seu-backend-XXXX.up.railway.app` | A URL pública do seu backend no Railway. |

**Importante**: O nome deve começar com `VITE_` para que o Vite a exponha para o código do frontend.

### 2.4. Inicie o Deploy

Clique em **Deploy**. A Vercel irá buildar e fazer o deploy do seu frontend. Após a conclusão, você terá a URL final (ex: `https://seu-projeto.vercel.app`).

---

## Passo 3: Atualizar a URL do Frontend no Railway

1.  Volte para as configurações de variáveis de ambiente do seu backend no **Railway**.
2.  Atualize a variável `FRONTEND_URL` com a URL final do seu projeto na Vercel.
3.  O Railway fará um novo deploy do backend com a variável atualizada. Isso é crucial para que o CORS funcione corretamente.

## Conclusão

Seu projeto está no ar! O frontend na Vercel se comunicará com o backend no Railway, que por sua vez se conecta ao banco de dados MySQL, também no Railway.
