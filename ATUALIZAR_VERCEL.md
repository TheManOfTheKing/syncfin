# 🔄 Atualizar DATABASE_URL na Vercel

## ✅ Migração Concluída!

As tabelas foram criadas com sucesso no Railway usando o schema corrigido.

## 📝 Próximo Passo: Atualizar Vercel

Agora você precisa atualizar a variável `DATABASE_URL` na Vercel com a nova URL do Railway.

### URL para usar na Vercel:

**Para produção (use a URL pública):**
```
mysql://root:VLRjpVkTXWiKoKImnfFRTMwymyJadedr@ballast.proxy.rlwy.net:27358/railway
```

**OU use a URL interna (se a Vercel estiver no mesmo ambiente Railway):**
```
mysql://root:VLRjpVkTXWiKoKImnfFRTMwymyJadedr@mysql.railway.internal:3306/railway
```

### Como atualizar:

1. Acesse o projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Encontre a variável `DATABASE_URL`
4. Clique em **Edit**
5. Cole a nova URL:
   ```
   mysql://root:VLRjpVkTXWiKoKImnfFRTMwymyJadedr@ballast.proxy.rlwy.net:27358/railway
   ```
6. Salve
7. Faça um novo deploy (ou aguarde o redeploy automático)

## ✅ Verificação

Após atualizar, teste:
- Endpoint: `https://syncfin.vercel.app/api/auth/diagnostico`
- Deve retornar: `{"status":"ok",...}`
- Login deve funcionar!

