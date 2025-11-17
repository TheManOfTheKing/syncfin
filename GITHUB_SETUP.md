# 🔐 Configuração de Autenticação GitHub

## Problema: "Repository not found"

Este erro geralmente ocorre quando o Git não está autenticado. Para repositórios privados ou para fazer push via HTTPS, você precisa de um **Personal Access Token (PAT)**.

---

## 📝 Solução: Criar Personal Access Token

### Passo 1: Criar Token no GitHub

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Dê um nome: `FinSync Deploy`
4. Selecione o escopo: **`repo`** (acesso completo aos repositórios)
5. Clique em **"Generate token"**
6. **COPIE O TOKEN** (você só verá uma vez!)

### Passo 2: Usar o Token

Quando fizer push, o Git vai pedir credenciais:

**Username:** `TheManOfTheKing`  
**Password:** `SEU_TOKEN_AQUI` (cole o token, não sua senha!)

---

## 🚀 Alternativa: Configurar Credential Helper

Para não precisar digitar o token toda vez:

### Windows (Git Credential Manager)

```bash
git config --global credential.helper manager-core
```

Depois, quando fizer push, digite:
- Username: `TheManOfTheKing`
- Password: `SEU_TOKEN`

O Windows vai salvar as credenciais.

### Ou usar URL com Token (menos seguro)

```bash
git remote set-url origin https://SEU_TOKEN@github.com/TheManOfTheKing/syncfin.git
```

⚠️ **Não commite este token!**

---

## ✅ Testar

```bash
git push -u origin main
```

Se pedir credenciais:
- Username: `TheManOfTheKing`
- Password: `seu_token_aqui`

---

## 🔒 Segurança

- **NUNCA** commite o token no código
- Use o `.gitignore` para proteger arquivos sensíveis
- Tokens expiram - você pode renovar quando necessário

