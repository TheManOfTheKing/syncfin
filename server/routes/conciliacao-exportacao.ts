/**
 * Rotas de exportação de resultados de conciliação
 */

import { Router, Request, Response } from 'express';
import { getDb } from '../db/index.js';
import { 
  lotesConciliacao,
  conciliacoes,
  divergencias,
  lancamentosContabeis,
  empresas,
  contasBancarias
} from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { 
  exportarCNAB240,
  exportarCNAB400,
  exportarCSV,
  exportarJSON,
  exportarRelatorioTexto
} from '../services/exportacao-conciliacao.js';

const router = Router();

/**
 * GET /api/conciliacao/exportar/:loteId
 * Exporta resultado da conciliação em diversos formatos
 */
router.get('/exportar/:loteId', async (req: Request, res: Response) => {
  try {
    const { loteId } = req.params;
    const { formato = 'csv' } = req.query;

    const db = await getDb();

    // Buscar lote
    const [lote] = await db
      .select()
      .from(lotesConciliacao)
      .where(eq(lotesConciliacao.id, parseInt(loteId)));

    if (!lote) {
      return res.status(404).json({ erro: 'Lote não encontrado' });
    }

    // Buscar empresa
    const [empresa] = await db
      .select()
      .from(empresas)
      .where(eq(empresas.id, lote.empresaId));

    // Buscar conta bancária (primeira ativa da empresa)
    const [conta] = await db
      .select()
      .from(contasBancarias)
      .where(eq(contasBancarias.empresaId, lote.empresaId))
      .limit(1);

    // Buscar conciliações aprovadas do lote
    const conciliacoesLote = await db
      .select({
        conciliacao: conciliacoes,
        lancamento: lancamentosContabeis,
      })
      .from(conciliacoes)
      .leftJoin(lancamentosContabeis, eq(conciliacoes.lancamentoId, lancamentosContabeis.id))
      .where(eq(conciliacoes.loteId, parseInt(loteId)));

    // Buscar divergências do lote
    const divergenciasLote = await db
      .select()
      .from(divergencias)
      .where(eq(divergencias.loteId, parseInt(loteId)));

    // Preparar dados para exportação
    const dadosEmpresa = {
      nome: empresa.nome,
      documento: empresa.documento,
      bancoCodigo: conta?.bancoCodigo || '000',
      agencia: conta?.agencia || '0000',
      conta: conta?.conta || '00000000',
    };

    const dadosConciliacao = conciliacoesLote
      .filter(c => c.conciliacao.status === 'aprovada')
      .map(c => ({
        lancamentoId: c.lancamento!.id,
        numeroDocumento: c.lancamento!.numeroDocumento || '',
        nossoNumero: c.lancamento!.nossoNumero || '',
        dataPagamento: c.lancamento!.dataPagamento || c.lancamento!.dataVencimento,
        valorPago: parseFloat(c.conciliacao.valorConciliado),
        status: 'pago' as const,
      }));

    // Gerar arquivo no formato solicitado
    let conteudo: string;
    let nomeArquivo: string;
    let contentType: string;

    switch (formato) {
      case 'cnab240':
        conteudo = exportarCNAB240(dadosEmpresa, dadosConciliacao);
        nomeArquivo = `conciliacao_lote_${loteId}_cnab240.txt`;
        contentType = 'text/plain';
        break;

      case 'cnab400':
        conteudo = exportarCNAB400(dadosEmpresa, dadosConciliacao);
        nomeArquivo = `conciliacao_lote_${loteId}_cnab400.txt`;
        contentType = 'text/plain';
        break;

      case 'json':
        conteudo = exportarJSON(dadosEmpresa, lote, dadosConciliacao);
        nomeArquivo = `conciliacao_lote_${loteId}.json`;
        contentType = 'application/json';
        break;

      case 'relatorio':
        const conciliacoesComDetalhes = conciliacoesLote
          .filter(c => c.conciliacao.status === 'aprovada')
          .map(c => ({
            lancamentoId: c.lancamento!.id,
            numeroDocumento: c.lancamento!.numeroDocumento,
            nossoNumero: c.lancamento!.nossoNumero,
            dataPagamento: c.lancamento!.dataPagamento || c.lancamento!.dataVencimento,
            valorPago: parseFloat(c.conciliacao.valorConciliado),
            confidence: c.conciliacao.confidence,
            tipo: c.conciliacao.tipo,
          }));

        conteudo = exportarRelatorioTexto(
          dadosEmpresa,
          lote,
          conciliacoesComDetalhes,
          divergenciasLote
        );
        nomeArquivo = `relatorio_conciliacao_lote_${loteId}.txt`;
        contentType = 'text/plain';
        break;

      case 'csv':
      default:
        conteudo = exportarCSV(dadosConciliacao);
        nomeArquivo = `conciliacao_lote_${loteId}.csv`;
        contentType = 'text/csv';
        break;
    }

    // Enviar arquivo
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.send(conteudo);

  } catch (error: any) {
    console.error('Erro ao exportar conciliação:', error);
    res.status(500).json({ erro: 'Erro ao exportar conciliação', detalhes: error.message });
  }
});

export default router;