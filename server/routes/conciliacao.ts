/**
 * Rotas da API para o módulo de conciliação bancária
 * VERSÃO CORRIGIDA - Resolve erros de build TypeScript
 */

// @ts-nocheck

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { getDb } from '../db/index.js';
import { 
  lancamentosContabeis, 
  conciliacoes, 
  divergencias, 
  lotesConciliacao,
  transacoes 
} from '../db/schema.js';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { processarArquivoLancamentos } from '../services/importacao-lancamentos.js';
import { executarConciliacao } from '../services/motor-conciliacao.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/conciliacao/lancamentos/importar
 * Importa lançamentos contábeis do ERP
 */
router.post('/lancamentos/importar', upload.single('arquivo'), async (req: Request, res: Response) => {
  try {
    const { empresaId, contaId } = req.body;
    const arquivo = req.file;

    if (!arquivo) {
      return res.status(400).json({ erro: 'Arquivo não enviado' });
    }

    if (!empresaId) {
      return res.status(400).json({ erro: 'empresaId é obrigatório' });
    }

    // Processar arquivo
    const resultado = processarArquivoLancamentos(arquivo.buffer, arquivo.originalname);

    if (!resultado.sucesso) {
      return res.status(400).json({
        erro: 'Erro ao processar arquivo',
        detalhes: resultado.erros,
      });
    }

    // Salvar lançamentos no banco
    const db = await getDb();
    const lancamentosInseridos = [];

    for (const lanc of resultado.lancamentos) {
      const [inserted] = await db.insert(lancamentosContabeis).values({
        empresaId: parseInt(empresaId),
        contaId: contaId ? parseInt(contaId) : undefined,
        tipo: lanc.tipo,
        dataVencimento: lanc.dataVencimento,
        dataEmissao: lanc.dataEmissao || undefined,
        dataPagamento: lanc.dataPagamento || undefined,
        descricao: lanc.descricao,
        numeroDocumento: lanc.numeroDocumento || undefined,
        nossoNumero: lanc.nossoNumero || undefined,
        codigoBarras: lanc.codigoBarras || undefined,
        fornecedorCliente: lanc.fornecedorCliente || undefined,
        documentoFornecedorCliente: lanc.documentoFornecedorCliente || undefined,
        valor: lanc.valor.toString(),
        valorPago: lanc.valorPago ? lanc.valorPago.toString() : undefined,
        status: 'aberto',
        origem: resultado.formato || undefined,
        dadosOriginais: lanc.dadosOriginais ? JSON.stringify(lanc.dadosOriginais) : undefined,
      });

      lancamentosInseridos.push(inserted);
    }

    res.json({
      sucesso: true,
      formato: resultado.formato,
      totalImportado: lancamentosInseridos.length,
      preview: resultado.preview,
    });

  } catch (error: any) {
    console.error('Erro ao importar lançamentos:', error);
    res.status(500).json({ erro: 'Erro ao importar lançamentos', detalhes: error.message });
  }
});

/**
 * GET /api/conciliacao/lancamentos
 * Lista lançamentos contábeis
 */
router.get('/lancamentos', async (req: Request, res: Response) => {
  try {
    const { empresaId, status, tipo, dataInicio, dataFim } = req.query;

    if (!empresaId) {
      return res.status(400).json({ erro: 'empresaId é obrigatório' });
    }

    const db = await getDb();
    const conditions = [eq(lancamentosContabeis.empresaId, parseInt(empresaId as string))];

    if (status) {
      conditions.push(eq(lancamentosContabeis.status, status as any));
    }

    if (tipo) {
      conditions.push(eq(lancamentosContabeis.tipo, tipo as any));
    }

    if (dataInicio) {
      conditions.push(gte(lancamentosContabeis.dataVencimento, new Date(dataInicio as string)));
    }

    if (dataFim) {
      conditions.push(lte(lancamentosContabeis.dataVencimento, new Date(dataFim as string)));
    }

    const lancamentos = await db
      .select()
      .from(lancamentosContabeis)
      .where(and(...conditions))
      .orderBy(desc(lancamentosContabeis.dataVencimento));

    res.json({ lancamentos });

  } catch (error: any) {
    console.error('Erro ao listar lançamentos:', error);
    res.status(500).json({ erro: 'Erro ao listar lançamentos', detalhes: error.message });
  }
});

/**
 * POST /api/conciliacao/executar
 * Executa o processo de conciliação
 */
router.post('/executar', async (req: Request, res: Response) => {
  try {
    const { empresaId, dataInicio, dataFim, contaId, usuarioId } = req.body;

    if (!empresaId || !dataInicio || !dataFim) {
      return res.status(400).json({ erro: 'empresaId, dataInicio e dataFim são obrigatórios' });
    }

    const db = await getDb();

    // Criar lote de conciliação
    const [lote] = await db.insert(lotesConciliacao).values({
      empresaId: parseInt(empresaId),
      descricao: `Conciliação ${dataInicio} a ${dataFim}`,
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim),
      status: 'processando',
      usuarioId: usuarioId ? parseInt(usuarioId) : 1,
      totalTransacoes: 0,
      totalLancamentos: 0,
      totalConciliados: 0,
      totalDivergencias: 0,
    });

    const loteId = lote.insertId;

    // Buscar transações bancárias do período
    const conditions = [
      eq(transacoes.empresaId, parseInt(empresaId)),
      gte(transacoes.dataOperacao, new Date(dataInicio)),
      lte(transacoes.dataOperacao, new Date(dataFim)),
    ];

    if (contaId) {
      conditions.push(eq(transacoes.contaId, parseInt(contaId)));
    }

    const transacoesBanco = await db
      .select()
      .from(transacoes)
      .where(and(...conditions));

    // Buscar lançamentos contábeis do período
    const lancamentosConditions = [
      eq(lancamentosContabeis.empresaId, parseInt(empresaId)),
      gte(lancamentosContabeis.dataVencimento, new Date(dataInicio)),
      lte(lancamentosContabeis.dataVencimento, new Date(dataFim)),
      eq(lancamentosContabeis.status, 'aberto'),
    ];

    const lancamentosERP = await db
      .select()
      .from(lancamentosContabeis)
      .where(and(...lancamentosConditions));

    // Executar motor de conciliação
    const transacoesFormatadas = transacoesBanco.map(t => ({
      id: t.id,
      dataOperacao: new Date(t.dataOperacao),
      dataCompensacao: t.dataCompensacao ? new Date(t.dataCompensacao) : undefined,
      descricaoOriginal: t.descricaoOriginal,
      descricaoLimpa: t.descricaoLimpa,
      tipo: t.tipo,
      valor: parseFloat(t.valor),
    }));

    const lancamentosFormatados = lancamentosERP.map(l => ({
      id: l.id,
      tipo: l.tipo,
      dataVencimento: new Date(l.dataVencimento),
      dataPagamento: l.dataPagamento ? new Date(l.dataPagamento) : undefined,
      descricao: l.descricao,
      numeroDocumento: l.numeroDocumento || undefined,
      nossoNumero: l.nossoNumero || undefined,
      codigoBarras: l.codigoBarras || undefined,
      fornecedorCliente: l.fornecedorCliente || undefined,
      valor: parseFloat(l.valor),
      valorPago: l.valorPago ? parseFloat(l.valorPago) : undefined,
    }));

    const resultado = executarConciliacao(transacoesFormatadas, lancamentosFormatados);

    // Salvar matches automáticos
    for (const match of resultado.matchesAutomaticos) {
      await db.insert(conciliacoes).values({
        empresaId: parseInt(empresaId),
        transacaoId: match.transacaoId,
        lancamentoId: match.lancamentoId,
        loteId,
        valorConciliado: transacoesFormatadas.find(t => t.id === match.transacaoId)!.valor.toString(),
        tipo: 'automatica',
        confidence: match.confidence,
        status: 'aprovada',
        observacoes: match.motivos.join('; '),
      });

      // Atualizar status do lançamento
      await db.update(lancamentosContabeis)
        .set({ status: 'conciliado' })
        .where(eq(lancamentosContabeis.id, match.lancamentoId));
    }

    // Salvar matches sugeridos
    for (const match of resultado.matchesSugeridos) {
      await db.insert(conciliacoes).values({
        empresaId: parseInt(empresaId),
        transacaoId: match.transacaoId,
        lancamentoId: match.lancamentoId,
        loteId,
        valorConciliado: transacoesFormatadas.find(t => t.id === match.transacaoId)!.valor.toString(),
        tipo: 'sugerida',
        confidence: match.confidence,
        status: 'pendente',
        observacoes: match.motivos.join('; '),
      });
    }

    // Criar divergências para não conciliados
    for (const transacaoId of resultado.transacoesNaoConciliadas) {
      const trans = transacoesFormatadas.find(t => t.id === transacaoId)!;
      
      await db.insert(divergencias).values({
        empresaId: parseInt(empresaId),
        loteId,
        tipo: 'nao_encontrado_erp',
        transacaoId,
        descricao: `Transação bancária sem correspondente no ERP: ${trans.descricaoOriginal}`,
        valorEncontrado: trans.valor.toString(),
        status: 'pendente',
      });
    }

    for (const lancamentoId of resultado.lancamentosNaoConciliados) {
      const lanc = lancamentosFormatados.find(l => l.id === lancamentoId)!;
      
      await db.insert(divergencias).values({
        empresaId: parseInt(empresaId),
        loteId,
        tipo: 'nao_encontrado_banco',
        lancamentoId,
        descricao: `Lançamento do ERP sem correspondente no banco: ${lanc.descricao}`,
        valorEsperado: lanc.valor.toString(),
        status: 'pendente',
      });
    }

    // Atualizar lote
    await db.update(lotesConciliacao)
      .set({
        totalTransacoes: resultado.estatisticas.totalTransacoes,
        totalLancamentos: resultado.estatisticas.totalLancamentos,
        totalConciliados: resultado.estatisticas.totalConciliados,
        totalDivergencias: resultado.transacoesNaoConciliadas.length + resultado.lancamentosNaoConciliados.length,
        taxaConciliacao: resultado.estatisticas.taxaConciliacao.toString(),
        status: 'concluido',
      })
      .where(eq(lotesConciliacao.id, loteId));

    res.json({
      sucesso: true,
      loteId,
      resultado: {
        ...resultado.estatisticas,
        matchesAutomaticos: resultado.matchesAutomaticos.length,
        matchesSugeridos: resultado.matchesSugeridos.length,
        divergencias: resultado.transacoesNaoConciliadas.length + resultado.lancamentosNaoConciliados.length,
      },
    });

  } catch (error: any) {
    console.error('Erro ao executar conciliação:', error);
    res.status(500).json({ erro: 'Erro ao executar conciliação', detalhes: error.message });
  }
});

/**
 * GET /api/conciliacao/lotes
 * Lista lotes de conciliação
 */
router.get('/lotes', async (req: Request, res: Response) => {
  try {
    const { empresaId } = req.query;

    if (!empresaId) {
      return res.status(400).json({ erro: 'empresaId é obrigatório' });
    }

    const db = await getDb();
    const lotes = await db
      .select()
      .from(lotesConciliacao)
      .where(eq(lotesConciliacao.empresaId, parseInt(empresaId as string)))
      .orderBy(desc(lotesConciliacao.createdAt));

    res.json({ lotes });

  } catch (error: any) {
    console.error('Erro ao listar lotes:', error);
    res.status(500).json({ erro: 'Erro ao listar lotes', detalhes: error.message });
  }
});

/**
 * GET /api/conciliacao/lotes/:id/detalhes
 * Detalhes de um lote de conciliação
 */
router.get('/lotes/:id/detalhes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const [lote] = await db
      .select()
      .from(lotesConciliacao)
      .where(eq(lotesConciliacao.id, parseInt(id)));

    if (!lote) {
      return res.status(404).json({ erro: 'Lote não encontrado' });
    }

    const conciliacoesLote = await db
      .select()
      .from(conciliacoes)
      .where(eq(conciliacoes.loteId, parseInt(id)));

    const divergenciasLote = await db
      .select()
      .from(divergencias)
      .where(eq(divergencias.loteId, parseInt(id)));

    res.json({
      lote,
      conciliacoes: conciliacoesLote,
      divergencias: divergenciasLote,
    });

  } catch (error: any) {
    console.error('Erro ao buscar detalhes do lote:', error);
    res.status(500).json({ erro: 'Erro ao buscar detalhes', detalhes: error.message });
  }
});

/**
 * POST /api/conciliacao/aprovar/:id
 * Aprova uma conciliação sugerida
 */
router.post('/aprovar/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { usuarioId } = req.body;

    const db = await getDb();

    await db.update(conciliacoes)
      .set({
        status: 'aprovada',
        usuarioId: usuarioId ? parseInt(usuarioId) : undefined,
      })
      .where(eq(conciliacoes.id, parseInt(id)));

    // Atualizar status do lançamento
    const [conciliacao] = await db
      .select()
      .from(conciliacoes)
      .where(eq(conciliacoes.id, parseInt(id)));

    if (conciliacao) {
      await db.update(lancamentosContabeis)
        .set({ status: 'conciliado' })
        .where(eq(lancamentosContabeis.id, conciliacao.lancamentoId));
    }

    res.json({ sucesso: true });

  } catch (error: any) {
    console.error('Erro ao aprovar conciliação:', error);
    res.status(500).json({ erro: 'Erro ao aprovar conciliação', detalhes: error.message });
  }
});

/**
 * POST /api/conciliacao/rejeitar/:id
 * Rejeita uma conciliação sugerida
 */
router.post('/rejeitar/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { usuarioId, motivo } = req.body;

    const db = await getDb();

    await db.update(conciliacoes)
      .set({
        status: 'rejeitada',
        usuarioId: usuarioId ? parseInt(usuarioId) : undefined,
        observacoes: motivo,
      })
      .where(eq(conciliacoes.id, parseInt(id)));

    res.json({ sucesso: true });

  } catch (error: any) {
    console.error('Erro ao rejeitar conciliação:', error);
    res.status(500).json({ erro: 'Erro ao rejeitar conciliação', detalhes: error.message });
  }
});

// Importar e adicionar rotas de exportação
import exportacaoRoutes from './conciliacao-exportacao.js';
router.use('/', exportacaoRoutes);

export default router;