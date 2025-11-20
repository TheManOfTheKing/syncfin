# Guia Rápido: Conciliação Bancária com ERP BLUETI

## 🎯 O que o Sistema Faz Agora

O SyncFin evoluiu de um **classificador de extratos** para uma **plataforma completa de conciliação bancária**. Agora ele:

✅ Importa seus lançamentos contábeis do ERP BLUETI  
✅ Compara automaticamente com o extrato bancário  
✅ Identifica quais contas foram pagas/recebidas  
✅ Detecta divergências e valores não previstos  
✅ Exporta o resultado para você importar de volta no ERP  

---

## 🚀 Como Usar (Passo a Passo)

### Passo 1: Exportar Lançamentos do ERP BLUETI

No seu ERP BLUETI, exporte um arquivo com as **contas a pagar e a receber** do período que deseja conciliar.

**Formatos aceitos:**
- CNAB 240 (padrão FEBRABAN moderno)
- CNAB 400 (padrão legado)
- CSV (formato genérico)

**Campos necessários no CSV:**
```
tipo;data_vencimento;descricao;numero_documento;fornecedor;valor
pagar;15/01/2025;Fornecedor ABC;12345;ABC Ltda;1500,00
receber;20/01/2025;Cliente XYZ;67890;XYZ SA;2500,00
```

### Passo 2: Importar no SyncFin

Acesse o SyncFin e vá em **"Conciliação" > "Importar Lançamentos"**

- Selecione o arquivo exportado do ERP
- Clique em "Importar"
- O sistema detectará automaticamente o formato

### Passo 3: Importar Extrato Bancário

Como você já faz hoje, importe o extrato bancário:

- Vá em **"Importação" > "Importar Extrato"**
- Selecione o arquivo CSV/XLSX do banco
- O sistema incluirá automaticamente as transações PIX

### Passo 4: Executar Conciliação

Agora vem a mágica! Vá em **"Conciliação" > "Executar"**

- Selecione o período (ex: 01/01/2025 a 31/01/2025)
- Clique em "Conciliar"
- Aguarde alguns segundos

**O sistema irá:**
1. Comparar cada transação do banco com os lançamentos do ERP
2. Identificar automaticamente as correspondências
3. Calcular um score de confiança para cada match
4. Gerar um relatório completo

### Passo 5: Revisar Resultados

O sistema mostrará 3 categorias:

#### ✅ Conciliados Automaticamente (85-100% de confiança)
Estes já estão prontos! O sistema tem certeza do match.

#### 🔍 Sugestões para Revisão (60-84% de confiança)
Revise manualmente e aprove ou rejeite cada sugestão.

#### ⚠️ Divergências
- Transações no banco sem lançamento no ERP (ex: tarifas)
- Lançamentos no ERP sem transação no banco (ex: cheques não compensados)

### Passo 6: Exportar Resultado

Após revisar, clique em **"Exportar"** e escolha o formato:

- **CNAB 240/400**: Para importar no ERP BLUETI
- **CSV**: Para análise em planilha
- **Relatório**: Para impressão/arquivo

### Passo 7: Importar de Volta no ERP

Pegue o arquivo exportado e importe no seu ERP BLUETI para dar **baixa automática** nos títulos conciliados.

---

## 📊 Exemplo Prático

### Situação:
- Você tem 200 transações no extrato bancário
- Você tem 150 lançamentos no ERP (contas a pagar/receber)

### Resultado da Conciliação:
```
✅ 135 conciliados automaticamente (90%)
🔍 15 sugestões para revisão
⚠️ 50 transações no banco sem lançamento no ERP
⚠️ 15 lançamentos no ERP sem transação no banco
```

### O que fazer com as divergências:

**Transações no banco sem lançamento:**
- Tarifas bancárias → Lançar manualmente no ERP
- IOF, impostos → Lançar manualmente no ERP
- Pagamentos não previstos → Investigar

**Lançamentos no ERP sem transação:**
- Cheques não compensados → Aguardar compensação
- Boletos não pagos → Verificar com cliente/fornecedor
- Erros de lançamento → Corrigir no ERP

---

## 🎓 Dicas para Melhor Resultado

### 1. Padronize Descrições
Quanto mais padronizadas as descrições no ERP, melhor o sistema aprende.

### 2. Use Identificadores
Sempre que possível, use:
- Nosso número (boletos)
- Código de barras
- Número do documento

### 3. Mantenha Datas Consistentes
Lançar com a data correta ajuda o matching automático.

### 4. Revise Sugestões
As sugestões rejeitadas ajudam o sistema a melhorar.

### 5. Concilie Regularmente
Conciliações mensais são mais rápidas que anuais.

---

## ❓ Perguntas Frequentes

### O sistema substitui o ERP BLUETI?
**Não.** O SyncFin é um complemento que automatiza a conciliação. O ERP continua sendo sua fonte de verdade contábil.

### Preciso mudar algo no meu ERP?
**Não.** O sistema trabalha com os arquivos que seu ERP já exporta hoje.

### E se o ERP não exportar CNAB?
Use CSV! Basta exportar uma planilha com as colunas: tipo, data, descrição, valor.

### O sistema aprende com o tempo?
**Sim!** Quanto mais você usa e corrige, melhor ele fica em identificar matches.

### Funciona com PIX?
**Sim!** As transações PIX vêm no extrato bancário normal e são conciliadas automaticamente.

### Posso conciliar múltiplas contas?
**Sim!** Basta importar os extratos de cada conta e os lançamentos correspondentes.

---

## 📞 Próximos Passos

### Para começar a usar:

1. **Teste com um mês pequeno** (ex: última semana)
2. **Exporte 10-20 lançamentos** do ERP
3. **Importe o extrato** do mesmo período
4. **Execute a conciliação** e veja o resultado
5. **Revise as sugestões** para o sistema aprender
6. **Exporte e reimporte** no ERP

### Precisa de ajuda?

Entre em contato informando:
- Layout do arquivo TXT que o ERP BLUETI exporta
- Layout do arquivo TXT que o ERP BLUETI importa
- Qualquer dúvida sobre o processo

---

## ✅ Checklist de Implementação

- [ ] Exportar lançamentos do ERP BLUETI
- [ ] Importar lançamentos no SyncFin
- [ ] Importar extrato bancário no SyncFin
- [ ] Executar primeira conciliação
- [ ] Revisar sugestões
- [ ] Exportar resultado
- [ ] Importar resultado no ERP BLUETI
- [ ] Validar baixas no ERP
- [ ] Documentar processo interno
- [ ] Treinar equipe

---

**Pronto! Agora você tem conciliação bancária automatizada com suporte a PIX! 🎉**
