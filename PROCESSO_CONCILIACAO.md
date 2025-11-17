# Processo de Conciliação Bancária - Documentação Técnica

## Visão Geral

O sistema realiza conciliação bancária inteligente através de um processo automatizado em múltiplas etapas, desde a importação de extratos até a classificação e detecção de transferências internas.

---

## 1. Importação de Extratos

### 1.1 Upload e Processamento Inicial

**Arquivo:** `server/routes/importacao.ts` (rota `/api/importacao/upload`)

**Processo:**
1. **Upload do arquivo** (CSV ou XLSX, máximo 10MB)
2. **Identificação do formato:**
   - **CSV:** Usa `papaparse` para detectar delimitador automaticamente (`,`, `;`, `\t`, `|`)
   - **XLSX:** Usa `xlsx` para ler a primeira planilha
3. **Extração de dados:**
   - Primeira linha como cabeçalho
   - Geração de preview (5 primeiras linhas)
   - Dados completos armazenados temporariamente

### 1.2 Identificação Automática de Banco

**Função:** `identificarBanco(colunas: string[])`

O sistema identifica automaticamente o banco através de padrões de colunas:

```typescript
Padrões conhecidos:
- Banco do Brasil (001): ['banco do brasil', 'bb', 'data', 'histórico', 'documento', 'valor']
- Santander (033): ['santander', 'data', 'descrição', 'débito', 'crédito', 'saldo']
- Caixa (104): ['caixa', 'data', 'histórico', 'valor', 'saldo']
- Bradesco (237): ['bradesco', 'data', 'histórico', 'documento', 'valor']
- Itaú (341): ['itau', 'data', 'lançamento', 'descrição', 'valor']
- Safra (422): ['safra', 'data', 'histórico', 'valor']
- Sicredi (748): ['sicredi', 'data', 'histórico', 'valor']
```

**Lógica:**
- Se encontrar 3+ palavras-chave do padrão → identifica o banco
- Caso contrário, verifica padrões genéricos (data, descrição, valor)
- Retorna `null` se não identificar

### 1.3 Busca de Mapeamento Pré-Salvo

Se o banco foi identificado:
1. Busca mapeamento salvo para `empresaId + bancoCodigo + extensao`
2. Se encontrado, aplica automaticamente no frontend
3. Usuário pode confirmar ou ajustar o mapeamento

---

## 2. Mapeamento e Limpeza de Dados

### 2.1 Mapeamento de Colunas

**Arquivo:** `server/services/importacao.ts` (função `mapearTransacoes`)

**Processo:**
1. **Mapeamento manual pelo usuário:**
   - Seleciona coluna de **data**
   - Seleciona coluna de **descrição**
   - Seleciona coluna de **valor**
   - Opcional: coluna de **tipo** (entrada/saída) ou **saldo**

2. **Conversão de dados:**
   ```typescript
   - Data: new Date(dataStr)
   - Valor: parseFloat(valorStr.replace(/[^\d,-]/g, '').replace(',', '.'))
   - Tipo: 
     * Se coluna tipo existe: verifica se contém "saida"/"debito" → 'saida', senão → 'entrada'
     * Se não existe: valor negativo → 'saida', senão → 'entrada'
   - Saldo: parseFloat(saldoStr.replace(/[^\d,-]/g, '').replace(',', '.'))
   ```

### 2.2 Limpeza de Descrição

**Função:** `limparDescricao(descricao: string)`

**Processo:**
1. Remove espaços extras (`trim()`)
2. Normaliza espaços múltiplos para um único espaço
3. Remove caracteres especiais (mantém apenas letras, números, hífen e espaço)
4. Converte para minúsculas

**Exemplo:**
```
"PAGAMENTO - FORNECEDOR XYZ LTDA" 
→ "pagamento fornecedor xyz ltda"
```

### 2.3 Geração de Hash Único

**Função:** `gerarHashTransacao(empresaId, data, descricao, valor)`

**Objetivo:** Evitar duplicatas na importação

**Algoritmo:**
```typescript
conteudo = `${empresaId}-${data.toISOString()}-${descricao}-${valor}`
hash = SHA256(conteudo)
```

---

## 3. Confirmação e Persistência

### 3.1 Validação de Duplicatas

**Arquivo:** `server/routes/importacao.ts` (rota `/api/importacao/confirmar`)

**Processo:**
1. Para cada transação mapeada:
   - Gera hash único
   - Busca transação existente com mesmo `empresaId + hashUnico`
   - Se existe → **duplicada** (ignora)
   - Se não existe → continua

### 3.2 Classificação Automática na Importação

**Arquivo:** `server/services/classificacao.ts` (função `classificarAutomaticamente`)

**Processo em 3 níveis:**

#### Nível 1: Correspondência Exata
- Busca no histórico (`historico_aprendizado`) por `descricaoLimpa` idêntica
- Se encontrada → **100% de confiança**, retorna categoria

#### Nível 2: Palavras-Chave
- Extrai palavras-chave de ambas descrições (remove stop words)
- Calcula interseção de palavras
- Score = `(palavras_comuns / total_palavras) * 85`
- Se score ≥ 60% → classifica

#### Nível 3: Similaridade (Levenshtein)
- Calcula distância de Levenshtein entre descrições
- Similaridade = `1 - (distância / tamanho_máximo)`
- Confidence = `similaridade * 80`
- Se confidence ≥ 50% → classifica

**Critérios de classificação:**
- Confidence ≥ 70% → Status: `'classificacao_automatica'`
- Confidence 50-69% → Status: `'baixa_confianca'`
- Confidence < 50% → Status: `'pendente'`

### 3.3 Persistência no Banco

**Campos salvos:**
```typescript
{
  empresaId,
  contaId (opcional),
  dataOperacao,
  descricaoOriginal,
  descricaoLimpa,
  tipo: 'entrada' | 'saida',
  valor,
  saldoPos (opcional),
  hashUnico,
  categoriaId (se classificada),
  status: 'pendente' | 'classificacao_automatica' | 'baixa_confianca' | 'transferencia_interna' | 'classificacao_manual',
  origem: 'importacao'
}
```

### 3.4 Salvamento de Mapeamento

Se `bancoCodigo` foi fornecido:
- Salva mapeamento em `mapeamentos_importacao`
- Próximas importações do mesmo banco/empresa usarão este mapeamento automaticamente

---

## 4. Detecção de Transferências Internas

### 4.1 Algoritmo de Detecção

**Arquivo:** `server/services/classificacao.ts` (função `detectarTransferenciasInternas`)

**Processo:**

1. **Busca transações pendentes** da empresa no período

2. **Separa em saídas e entradas**

3. **Para cada par (saída, entrada):**

   **Critério 1: Contas Diferentes**
   ```typescript
   contasDiferentes = 
     (saida.contaId !== null && entrada.contaId !== null && saida.contaId !== entrada.contaId) ||
     (saida.contaId === null && entrada.contaId === null) // Transferência entre sistemas
   ```
   - **Requisito:** Devem ser de contas bancárias diferentes (ou ambas sem conta)

   **Critério 2: Mesmo Valor**
   ```typescript
   Math.abs(valorSaida - valorEntrada) < 0.01
   ```
   - Tolerância de R$ 0,01 para arredondamentos

   **Critério 3: Janela Temporal**
   ```typescript
   diffHoras = |dataEntrada - dataSaida| / (1000 * 60 * 60)
   diffHoras <= janelaTempoHoras (padrão: 60 horas = 2.5 dias)
   ```

   **Critério 4: Cálculo de Confiança**
   ```typescript
   confidence = 100
   
   // Redução por distância temporal (máx 30%)
   reducaoTemporal = min(30, (diffHoras / janelaTempoHoras) * 30)
   confidence -= reducaoTemporal
   
   // Bônus por similaridade de descrição (máx +20%)
   if (similaridadeDesc >= 0.5) {
     confidence += min(20, similaridadeDesc * 20)
   }
   
   confidence = max(50, min(100, confidence))
   ```

4. **Se confidence ≥ 70%:**
   - Marca ambas transações como `'transferencia_interna'`
   - Atribui `grupoTransferenciaId` (menor ID entre as duas)
   - Atualiza `updatedAt`

### 4.2 Execução da Detecção

**Arquivo:** `server/routes/transferencias.ts` (rota `/api/transferencias/detectar`)

**Processo:**
1. Usuário aciona detecção (pode especificar período, padrão: últimos 90 dias)
2. Algoritmo executa e retorna lista de transferências
3. Sistema atualiza status das transações identificadas
4. Retorna estatísticas: `{ transferencias, atualizadas, detalhes }`

---

## 5. Classificação Manual e Aprendizado

### 5.1 Classificação Manual

**Arquivo:** `server/routes/transacoes.ts` (rota `PUT /api/transacoes/:id/classificar`)

**Processo:**
1. Usuário seleciona transação e categoria
2. Sistema valida:
   - Transação existe
   - Usuário tem acesso à empresa
   - Categoria existe e está ativa
   - Categoria pertence à empresa

3. **Atualização:**
   ```typescript
   {
     categoriaId,
     status: 'classificacao_manual',
     updatedAt: new Date()
   }
   ```

### 5.2 Registro de Aprendizado

**Arquivo:** `server/services/classificacao.ts` (função `registrarAprendizado`)

**Processo:**
1. Insere registro em `historico_aprendizado`:
   ```typescript
   {
     empresaId,
     descricaoOriginal,
     descricaoLimpa,
     categoriaId,
     confidence: 100, // Manual = 100%
     usuarioId
   }
   ```

2. **Impacto:**
   - Próximas transações com descrição similar serão classificadas automaticamente
   - Sistema "aprende" com cada classificação manual

### 5.3 Classificação em Lote

**Frontend:** `client/src/pages/Transacoes.tsx`

**Processo:**
1. Usuário seleciona múltiplas transações (checkboxes)
2. Seleciona categoria
3. Sistema envia requisições em lote para `/api/transacoes/:id/classificar`
4. Cada classificação registra aprendizado individualmente

---

## 6. Fluxo Completo de Conciliação

### 6.1 Fluxo Automático (Primeira Importação)

```
1. Upload de extrato CSV/XLSX
   ↓
2. Identificação automática de banco
   ↓
3. Busca mapeamento pré-salvo (se existir)
   ↓
4. Usuário confirma/ajusta mapeamento
   ↓
5. Sistema mapeia e limpa dados
   ↓
6. Para cada transação:
   - Gera hash único
   - Verifica duplicata
   - Limpa descrição
   - Tenta classificação automática (histórico vazio → pendente)
   - Salva com status: 'pendente' | 'classificacao_automatica' | 'baixa_confianca'
   ↓
7. Salva mapeamento para próximas importações
   ↓
8. Retorna estatísticas: { importadas, duplicadas, erros, classificadas, taxaClassificacao }
```

### 6.2 Fluxo com Histórico (Importações Subsequentes)

```
1-4. (Mesmo processo acima)
   ↓
5. Sistema mapeia e limpa dados
   ↓
6. Para cada transação:
   - Gera hash único
   - Verifica duplicata
   - Limpa descrição
   - Classificação automática:
     * Busca no histórico (últimas 1000 classificações)
     * Tenta correspondência exata → palavras-chave → similaridade
     * Se confidence ≥ 70% → 'classificacao_automatica'
     * Se confidence 50-69% → 'baixa_confianca'
     * Se confidence < 50% → 'pendente'
   - Salva
   ↓
7. Salva mapeamento
   ↓
8. Retorna estatísticas
```

### 6.3 Fluxo de Detecção de Transferências

```
1. Usuário aciona detecção (período opcional)
   ↓
2. Sistema busca transações pendentes da empresa
   ↓
3. Separa em saídas e entradas
   ↓
4. Compara cada saída com cada entrada:
   - Verifica contas diferentes
   - Verifica mesmo valor (tolerância 0.01)
   - Verifica janela temporal (padrão 60h)
   - Calcula confiança (temporal + similaridade)
   ↓
5. Se confidence ≥ 70%:
   - Marca como 'transferencia_interna'
   - Atribui grupoTransferenciaId
   ↓
6. Retorna estatísticas
```

### 6.4 Fluxo de Classificação Manual

```
1. Usuário visualiza transações pendentes/baixa confiança
   ↓
2. Seleciona transação e categoria
   ↓
3. Sistema valida permissões e dados
   ↓
4. Atualiza transação:
   - categoriaId
   - status: 'classificacao_manual'
   ↓
5. Registra aprendizado:
   - Insere em historico_aprendizado
   - confidence: 100%
   ↓
6. Próximas importações usarão este aprendizado
```

---

## 7. Status das Transações

| Status | Descrição | Quando Ocorre |
|--------|-----------|---------------|
| `pendente` | Aguardando classificação | Importação sem classificação automática |
| `classificacao_automatica` | Classificada pela IA | Confidence ≥ 70% na importação |
| `baixa_confianca` | Classificada com baixa confiança | Confidence 50-69% na importação |
| `transferencia_interna` | Transferência entre contas | Detectada pelo algoritmo |
| `classificacao_manual` | Classificada manualmente | Usuário classificou |

---

## 8. Métricas e KPIs

**Arquivo:** `server/routes/dashboard.ts`

**KPIs calculados:**
- **Total de Transações:** Soma de todas as transações
- **Transações Pendentes:** Status = `'pendente'`
- **Total Entradas/Saídas:** Soma de valores por tipo
- **Saldo:** Entradas - Saídas
- **Taxa de Automação:** `(classificacao_automatica / total) * 100`
- **Ticket Médio:** `(totalEntradas + totalSaidas) / totalTransacoes`
- **Empresas Ativas:** Contagem de empresas com transações
- **Distribuição por Categoria:** Top 10 categorias com maior volume

---

## 9. Características Técnicas

### 9.1 Algoritmo de Similaridade (Levenshtein)

**Complexidade:** O(n*m) onde n e m são os tamanhos das strings

**Implementação:**
- Matriz de distâncias dinâmica
- Calcula custo mínimo de transformação (inserção, deleção, substituição)
- Similaridade = `1 - (distância / tamanho_máximo)`

### 9.2 Prevenção de Duplicatas

- Hash SHA256 baseado em: `empresaId + dataISO + descricao + valor`
- Verificação antes de cada inserção
- Duplicatas são ignoradas silenciosamente (contador de duplicatas)

### 9.3 Performance

- **Histórico limitado:** Busca apenas últimas 1000 classificações
- **Indexação:** Hash único indexado para busca rápida
- **Agregações:** KPIs calculados via queries otimizadas com Drizzle ORM

---

## 10. Melhorias Futuras Sugeridas

1. **Cache de classificação:** Armazenar resultados de classificação frequentes
2. **Machine Learning:** Substituir Levenshtein por modelo ML treinado
3. **Detecção de padrões:** Identificar transações recorrentes automaticamente
4. **Reconciliação automática:** Comparar com extratos bancários oficiais via API
5. **Alertas:** Notificações para transações não classificadas há X dias

---

## Conclusão

O sistema implementa um processo completo de conciliação bancária inteligente, combinando:
- **Automação:** Identificação de banco, mapeamento pré-salvo, classificação automática
- **Inteligência:** Algoritmos de similaridade, aprendizado supervisionado, detecção de padrões
- **Flexibilidade:** Classificação manual, ajustes de mapeamento, múltiplas empresas
- **Confiabilidade:** Prevenção de duplicatas, validações, cálculo de confiança

O processo é iterativo e melhora com o uso, aprendendo com cada classificação manual para aumentar a taxa de automação ao longo do tempo.

