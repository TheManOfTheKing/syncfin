# 🔧 Correção Necessária: Uso do db

## Problema

O `db` exportado não funciona com métodos encadeados do Drizzle quando usado com Proxy ou Promise.

## Solução

Todos os arquivos que usam `db` devem primeiro chamar `await getDb()` para obter a instância.

## Padrão a seguir

**Antes:**
```typescript
const [result] = await db.select().from(tabela).where(...);
```

**Depois:**
```typescript
const db = await getDb();
const [result] = await db.select().from(tabela).where(...);
```

## Arquivos que precisam ser corrigidos

- `server/routes/contas.ts` - ✅ Parcialmente corrigido
- `server/routes/dashboard.ts`
- `server/routes/empresas.ts`
- `server/routes/importacao.ts`
- `server/routes/relatorios.ts`
- `server/routes/transacoes.ts`
- `server/routes/transferencias.ts`
- `server/services/classificacao.ts`

## Como corrigir

1. No início de cada função que usa `db`, adicione:
   ```typescript
   const db = await getDb();
   ```

2. Remova qualquer import de `db` se existir, mantenha apenas `getDb`.

3. Teste localmente antes de fazer commit.

## Status

⚠️ **ATENÇÃO:** Este é um trabalho em progresso. O build vai falhar até que todos os arquivos sejam corrigidos.

