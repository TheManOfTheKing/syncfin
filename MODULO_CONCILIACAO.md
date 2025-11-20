# Módulo de Conciliação Bancária Completa - SyncFin

## 📋 Visão Geral

O **Módulo de Conciliação Bancária** é uma extensão completa do SyncFin que transforma o sistema de um classificador de extratos em uma **plataforma de conciliação bancária verdadeira**, comparando movimentações bancárias com lançamentos contábeis do ERP.

### O que foi implementado

Este módulo adiciona ao SyncFin a capacidade de:

1. **Importar lançamentos contábeis** do ERP (contas a pagar/receber)
2. **Comparar automaticamente** transações bancárias com lançamentos do ERP
3. **Identificar correspondências** (matches) com diferentes níveis de confiança
4. **Detectar divergências** e itens não conciliados
5. **Exportar resultados** em formatos padrão do mercado para o ERP

---

## 🏗️ Arquitetura

### Novas Tabelas do Banco de Dados

Foram adicionadas 4 novas tabelas ao schema:

#### 1. `lancamentos_contabeis`
Armazena contas a pagar e receber importadas do ERP.

**Campos principais:**
- `tipo`: 'pagar' | 'receber'
- `dataVencimento`, `dataEmissao`, `dataPagamento`
- `numeroDocumento`, `nossoNumero`, `codigoBarras`
- `fornecedorCliente`, `valor`, `valorPago`
- `status`: 'aberto' | 'parcialmente_conciliado' | 'conciliado' | 'cancelado'

#### 2. `conciliacoes`
Registra os matches entre transações bancárias e lançamentos contábeis.

**Campos principais:**
- `transacaoId`, `lancamentoId`
- `tipo`: 'automatica' | 'manual' | 'sugerida'
- `confidence`: score de 0-100
- `status`: 'pendente' | 'aprovada' | 'rejeitada'

#### 3. `divergencias`
Armazena divergências identificadas no processo.

**Tipos de divergência:**
- `valor_diferente`: Valores não batem
- `data_diferente`: Datas muito distantes
- `nao_encontrado_banco`: Lançamento sem transação correspondente
- `nao_encontrado_erp`: Transação sem lançamento correspondente
- `duplicado`: Possível duplicação

#### 4. `lotes_conciliacao`
Agrupa processamentos de conciliação.

**Campos principais:**
- `dataInicio`, `dataFim`
- `totalTransacoes`, `totalLancamentos`, `totalConciliados`
- `taxaConciliacao`
- `status`: 'processando' | 'concluido' | 'erro'

---

## 📦 Componentes Implementados

### 1. Parsers de Formatos Padrão

#### OFX Parser (`/server/services/parsers/ofx-parser.ts`)
- Lê arquivos OFX (Open Financial Exchange)
- Extrai transações bancárias
- Formato padrão internacional

#### CNAB 240 Parser (`/server/services/parsers/cnab240-parser.ts`)
- Lê arquivos CNAB 240 (Padrão FEBRABAN moderno)
- Gera arquivos de retorno CNAB 240
- Suporta segmentos A (pagamentos) e J (boletos)

#### CNAB 400 Parser (`/server/services/parsers/cnab400-parser.ts`)
- Lê arquivos CNAB 400 (Padrão legado)
- Gera arquivos de retorno CNAB 400
- Ainda muito utilizado no mercado

### 2. Serviço de Importação

**Arquivo:** `/server/services/importacao-lancamentos.ts`

**Funcionalidades:**
- Detecta automaticamente o formato do arquivo (CNAB 240, CNAB 400, CSV)
- Processa e valida dados
- Mapeia para formato interno unificado
- Suporta CSV genérico com detecção inteligente de colunas

### 3. Motor de Conciliação (Matching Engine)

**Arquivo:** `/server/services/motor-conciliacao.ts`

**Algoritmo em 3 Fases:**

#### Fase 1: Match por Identificadores Únicos
- Busca por nosso número, código de barras, número do documento
- **Confidence: 95-100%** quando encontrado
- Garante precisão máxima

#### Fase 2: Match por Valor Exato + Data Próxima
- Compara valor exato (ou muito próximo)
- Tolera diferença de até 7 dias na data
- **Confidence: 85-95%** para matches automáticos
- **Confidence: 70-84%** para sugestões

#### Fase 3: Match por Similaridade
- Calcula similaridade entre descrições
- Considera valor aproximado e fornecedor/cliente
- **Confidence: 60-80%** para sugestões
- Requer revisão manual

**Resultado:**
- **Matches Automáticos** (≥85%): Aprovados automaticamente
- **Matches Sugeridos** (60-84%): Requerem aprovação manual
- **Não Conciliados**: Geram divergências

### 4. API REST

**Arquivo:** `/server/routes/conciliacao.ts`

#### Endpoints Implementados:

```
POST   /api/conciliacao/lancamentos/importar
GET    /api/conciliacao/lancamentos
POST   /api/conciliacao/executar
GET    /api/conciliacao/lotes
GET    /api/conciliacao/lotes/:id/detalhes
POST   /api/conciliacao/aprovar/:id
POST   /api/conciliacao/rejeitar/:id
GET    /api/conciliacao/exportar/:loteId
```

### 5. Serviço de Exportação

**Arquivo:** `/server/services/exportacao-conciliacao.ts`

**Formatos Suportados:**
- **CNAB 240**: Arquivo de retorno padrão FEBRABAN
- **CNAB 400**: Arquivo de retorno legado
- **CSV**: Formato universal
- **JSON**: Formato estruturado para APIs
- **Relatório TXT**: Relatório detalhado para análise

---

## 🚀 Como Usar

### Passo 1: Importar Lançamentos do ERP

```bash
POST /api/conciliacao/lancamentos/importar
Content-Type: multipart/form-data

empresaId: 1
contaId: 1
arquivo: [arquivo CNAB 240/400 ou CSV]
```

**Resposta:**
```json
{
  "sucesso": true,
  "formato": "cnab240",
  "totalImportado": 150,
  "preview": [...]
}
```

### Passo 2: Executar Conciliação

```bash
POST /api/conciliacao/executar
Content-Type: application/json

{
  "empresaId": 1,
  "dataInicio": "2025-01-01",
  "dataFim": "2025-01-31",
  "contaId": 1,
  "usuarioId": 1
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "loteId": 42,
  "resultado": {
    "totalTransacoes": 200,
    "totalLancamentos": 150,
    "totalConciliados": 135,
    "taxaConciliacao": 90.0,
    "matchesAutomaticos": 120,
    "matchesSugeridos": 15,
    "divergencias": 50,
    "tempoProcessamento": 1250
  }
}
```

### Passo 3: Revisar Sugestões

```bash
GET /api/conciliacao/lotes/42/detalhes
```

**Aprovar um match:**
```bash
POST /api/conciliacao/aprovar/123
{
  "usuarioId": 1
}
```

**Rejeitar um match:**
```bash
POST /api/conciliacao/rejeitar/124
{
  "usuarioId": 1,
  "motivo": "Valores não correspondem"
}
```

### Passo 4: Exportar Resultado

```bash
GET /api/conciliacao/exportar/42?formato=cnab240
```

**Formatos disponíveis:**
- `cnab240` - Arquivo CNAB 240 para importação no ERP
- `cnab400` - Arquivo CNAB 400 para importação no ERP
- `csv` - Planilha CSV
- `json` - Dados estruturados em JSON
- `relatorio` - Relatório detalhado em texto

---

## 📊 Fluxo Completo de Conciliação

```
┌─────────────────────────────────────────────────────────────┐
│                    1. IMPORTAÇÃO                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ERP BLUETI                    BANCO                        │
│      │                           │                          │
│      │ Exporta TXT               │ Exporta Extrato         │
│      │ (Contas a Pagar/Receber)  │ (CSV/XLSX)              │
│      │                           │                          │
│      └──────────┬────────────────┘                          │
│                 │                                           │
│                 v                                           │
│          ┌─────────────┐                                    │
│          │   SYNCFIN   │                                    │
│          │  Importação │                                    │
│          └─────────────┘                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 2. CONCILIAÇÃO AUTOMÁTICA                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Lançamentos ERP    vs    Transações Banco                 │
│        │                         │                          │
│        └────────┬────────────────┘                          │
│                 │                                           │
│                 v                                           │
│        ┌─────────────────┐                                  │
│        │ Matching Engine │                                  │
│        │   (3 Fases)     │                                  │
│        └─────────────────┘                                  │
│                 │                                           │
│        ┌────────┴────────┐                                  │
│        │                 │                                  │
│        v                 v                                  │
│  ┌──────────┐     ┌─────────────┐                          │
│  │Automáticos│     │ Sugeridos   │                          │
│  │(≥85%)    │     │ (60-84%)    │                          │
│  └──────────┘     └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  3. REVISÃO MANUAL                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│           Usuário revisa sugestões                          │
│                     │                                       │
│              ┌──────┴──────┐                                │
│              │             │                                │
│              v             v                                │
│         ┌────────┐    ┌─────────┐                          │
│         │Aprovar │    │Rejeitar │                          │
│         └────────┘    └─────────┘                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    4. EXPORTAÇÃO                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│          Gera arquivo de retorno                            │
│                     │                                       │
│                     v                                       │
│           ┌──────────────────┐                              │
│           │ CNAB 240/400     │                              │
│           │ CSV / JSON       │                              │
│           │ Relatório TXT    │                              │
│           └──────────────────┘                              │
│                     │                                       │
│                     v                                       │
│              ERP BLUETI                                     │
│          (Baixa automática)                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuração e Deploy

### 1. Executar Migrations do Banco

As novas tabelas foram adicionadas ao schema. Execute as migrations:

```bash
npm run db:push
```

Ou manualmente:
```bash
npx drizzle-kit push:mysql
```

### 2. Instalar Dependências

O módulo usa a biblioteca `papaparse` para CSV:

```bash
npm install papaparse
npm install --save-dev @types/papaparse
```

### 3. Verificar Importações

O servidor já foi configurado para carregar as novas rotas automaticamente.

Verifique se no console aparecer:
```
✅ /api/conciliacao
```

---

## 📝 Formato CSV para Importação de Lançamentos

O sistema aceita CSV genérico com as seguintes colunas (case-insensitive):

### Colunas Obrigatórias:
- `data_vencimento` ou `vencimento` ou `data`
- `valor` ou `valor_titulo`
- `descricao` ou `historico`

### Colunas Opcionais:
- `tipo` (pagar/receber)
- `data_emissao`
- `data_pagamento`
- `numero_documento`
- `nosso_numero`
- `codigo_barras`
- `fornecedor` ou `cliente`
- `valor_pago`

### Exemplo de CSV:

```csv
tipo;data_vencimento;descricao;numero_documento;fornecedor;valor
pagar;15/01/2025;Fornecedor ABC Ltda;12345;Fornecedor ABC;1500,00
receber;20/01/2025;Cliente XYZ;67890;Cliente XYZ;2500,00
pagar;25/01/2025;Aluguel Janeiro;ALG-01;Imobiliária;3000,00
```

---

## 🎯 Benefícios do Módulo

### Para o Cliente (ERP BLUETI)

1. **Conciliação Verdadeira**: Não apenas classifica, mas compara banco vs. contábil
2. **Automação Inteligente**: 85-90% de conciliação automática após aprendizado
3. **Suporte a PIX**: Incluído nos extratos bancários normalmente
4. **Formatos Padrão**: CNAB 240/400 amplamente suportados
5. **Integração Simples**: Exporta/importa arquivos TXT como já faz hoje

### Para o Desenvolvedor

1. **Código Modular**: Novos componentes não afetam funcionalidades existentes
2. **Extensível**: Fácil adicionar novos formatos de arquivo
3. **Bem Documentado**: Código comentado e tipado
4. **Testável**: Lógica separada em serviços independentes

---

## 🔍 Próximos Passos Sugeridos

### Curto Prazo:
1. **Criar interface web** para o módulo de conciliação
2. **Adicionar testes automatizados** para o motor de matching
3. **Implementar logs detalhados** do processo de conciliação

### Médio Prazo:
1. **Suporte a múltiplos layouts** CNAB personalizados por banco
2. **Integração via API** com ERP (além de arquivos)
3. **Dashboard de conciliação** com gráficos e métricas

### Longo Prazo:
1. **Machine Learning** para melhorar matching
2. **Conciliação em tempo real** via Open Finance
3. **Suporte a outros ERPs** além do BLUETI

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação da API
2. Verifique os logs do servidor
3. Entre em contato com a equipe de desenvolvimento

---

## 📄 Licença

Este módulo é parte integrante do sistema SyncFin.

---

**Desenvolvido com ❤️ pela equipe SyncFin**

*Última atualização: 20 de novembro de 2025*
