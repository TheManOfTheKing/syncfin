import { Router } from 'express';
import { getDb } from '../db/index.js';
import { transacoes, usuarioEmpresas, categorias, empresas } from '../db/schema.js';
import { eq, and, or, gte, lte, desc } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import XLSX from 'xlsx';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Relatório consolidado DRE/Fluxo (soma por categoria em período)
router.get('/dre-fluxo', async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const userId = req.user!.userId;
    const { empresaId, dataInicio, dataFim, formato = 'json' } = req.query;

    if (!empresaId) {
      return res.status(400).json({ error: 'Empresa é obrigatória' });
    }

    // Verificar acesso à empresa
    const [acesso] = await db
      .select()
      .from(usuarioEmpresas)
      .where(
        and(
          eq(usuarioEmpresas.usuarioId, userId),
          eq(usuarioEmpresas.empresaId, parseInt(empresaId as string))
        )
      )
      .limit(1);

    if (!acesso) {
      return res.status(403).json({ error: 'Acesso negado a esta empresa' });
    }

    // Construir condições
    const conditions: any[] = [eq(transacoes.empresaId, parseInt(empresaId as string))];

    if (dataInicio) {
      conditions.push(gte(transacoes.dataOperacao, new Date(dataInicio as string)));
    }
    if (dataFim) {
      conditions.push(lte(transacoes.dataOperacao, new Date(dataFim as string)));
    }

    // Buscar transações
    const todasTransacoes = await db
      .select()
      .from(transacoes)
      .where(and(...conditions));

    // Filtrar transferências internas (não devem aparecer no DRE/Fluxo)
    const transacoesValidas = todasTransacoes.filter(t => t.status !== 'transferencia_interna');

    // Buscar categorias
    const categoriaIds = transacoesValidas
      .map(t => t.categoriaId)
      .filter((id): id is number => id !== null);

    let categoriasMap: Record<number, any> = {};
    if (categoriaIds.length > 0) {
      const categoriasList = await db
        .select()
        .from(categorias)
        .where(
          categoriaIds.length === 1
            ? eq(categorias.id, categoriaIds[0])
            : or(...categoriaIds.map(id => eq(categorias.id, id)))
        );

      categoriasList.forEach(cat => {
        categoriasMap[cat.id] = cat;
      });
    }

    // Agrupar por categoria
    const agrupadoPorCategoria: Record<number, { categoria: any; entradas: number; saidas: number }> = {};

    transacoesValidas.forEach(t => {
      if (t.categoriaId) {
        if (!agrupadoPorCategoria[t.categoriaId]) {
          agrupadoPorCategoria[t.categoriaId] = {
            categoria: categoriasMap[t.categoriaId],
            entradas: 0,
            saidas: 0,
          };
        }
        if (t.tipo === 'entrada') {
          agrupadoPorCategoria[t.categoriaId].entradas += parseFloat(t.valor);
        } else {
          agrupadoPorCategoria[t.categoriaId].saidas += parseFloat(t.valor);
        }
      }
    });

    const resultado = Object.values(agrupadoPorCategoria).map(item => ({
      categoria: item.categoria?.nome || 'Sem categoria',
      tipo: item.categoria?.tipo || 'entrada',
      codigo: item.categoria?.codigo || '',
      totalEntradas: item.entradas,
      totalSaidas: item.saidas,
      saldo: item.entradas - item.saidas,
    }));

    if (formato === 'xlsx') {
      // Criar workbook
      const workbook = XLSX.utils.book_new();

      // Dados do relatório
      const dados = [
        ['Categoria', 'Tipo', 'Código', 'Total Entradas', 'Total Saídas', 'Saldo'],
        ...resultado.map(r => [
          r.categoria,
          r.tipo,
          r.codigo,
          r.totalEntradas,
          r.totalSaidas,
          r.saldo,
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(dados);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'DRE/Fluxo');

      // Gerar buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="dre-fluxo-${empresaId}-${Date.now()}.xlsx"`);
      res.send(buffer);
    } else {
      res.json(resultado);
    }
  } catch (error) {
    console.error('Erro ao gerar relatório DRE/Fluxo:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

// Exportação detalhada (todas as transações)
router.get('/exportacao-detalhada', async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const userId = req.user!.userId;
    const { empresaId, dataInicio, dataFim } = req.query;

    if (!empresaId) {
      return res.status(400).json({ error: 'Empresa é obrigatória' });
    }

    // Verificar acesso à empresa
    const [acesso] = await db
      .select()
      .from(usuarioEmpresas)
      .where(
        and(
          eq(usuarioEmpresas.usuarioId, userId),
          eq(usuarioEmpresas.empresaId, parseInt(empresaId as string))
        )
      )
      .limit(1);

    if (!acesso) {
      return res.status(403).json({ error: 'Acesso negado a esta empresa' });
    }

    // Construir condições
    const conditions: any[] = [eq(transacoes.empresaId, parseInt(empresaId as string))];

    if (dataInicio) {
      conditions.push(gte(transacoes.dataOperacao, new Date(dataInicio as string)));
    }
    if (dataFim) {
      conditions.push(lte(transacoes.dataOperacao, new Date(dataFim as string)));
    }

    // Buscar transações
    const todasTransacoes = await db
      .select()
      .from(transacoes)
      .where(and(...conditions))
      .orderBy(desc(transacoes.dataOperacao));

    // Buscar categorias
    const categoriaIds = todasTransacoes
      .map(t => t.categoriaId)
      .filter((id): id is number => id !== null);

    let categoriasMap: Record<number, any> = {};
    if (categoriaIds.length > 0) {
      const categoriasList = await db
        .select()
        .from(categorias)
        .where(
          categoriaIds.length === 1
            ? eq(categorias.id, categoriaIds[0])
            : or(...categoriaIds.map(id => eq(categorias.id, id)))
        );

      categoriasList.forEach(cat => {
        categoriasMap[cat.id] = cat;
      });
    }

    // Criar workbook
    const workbook = XLSX.utils.book_new();

    // Dados das transações
    const dados = [
      ['Data', 'Descrição', 'Tipo', 'Valor', 'Categoria', 'Status', 'Saldo Pós-Operação'],
      ...todasTransacoes.map(t => [
        new Date(t.dataOperacao).toLocaleDateString('pt-BR'),
        t.descricaoOriginal,
        t.tipo,
        parseFloat(t.valor),
        categoriasMap[t.categoriaId || 0]?.nome || 'Sem categoria',
        t.status,
        t.saldoPos ? parseFloat(t.saldoPos) : '',
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(dados);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações');

    // Gerar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="transacoes-detalhadas-${empresaId}-${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Erro ao exportar transações:', error);
    res.status(500).json({ error: 'Erro ao exportar transações' });
  }
});

// Relatório de divergências
router.get('/divergencias', async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const userId = req.user!.userId;
    const { empresaId, dataInicio, dataFim, formato = 'json' } = req.query;

    if (!empresaId) {
      return res.status(400).json({ error: 'Empresa é obrigatória' });
    }

    // Verificar acesso à empresa
    const [acesso] = await db
      .select()
      .from(usuarioEmpresas)
      .where(
        and(
          eq(usuarioEmpresas.usuarioId, userId),
          eq(usuarioEmpresas.empresaId, parseInt(empresaId as string))
        )
      )
      .limit(1);

    if (!acesso) {
      return res.status(403).json({ error: 'Acesso negado a esta empresa' });
    }

    // Construir condições
    const conditions: any[] = [
      eq(transacoes.empresaId, parseInt(empresaId as string)),
      or(
        eq(transacoes.status, 'pendente'),
        eq(transacoes.status, 'baixa_confianca')
      ),
    ];

    if (dataInicio) {
      conditions.push(gte(transacoes.dataOperacao, new Date(dataInicio as string)));
    }
    if (dataFim) {
      conditions.push(lte(transacoes.dataOperacao, new Date(dataFim as string)));
    }

    // Buscar transações não classificadas ou com baixa confiança
    const divergencias = await db
      .select()
      .from(transacoes)
      .where(and(...conditions))
      .orderBy(desc(transacoes.dataOperacao));

    const resultado = divergencias.map(t => ({
      data: new Date(t.dataOperacao).toLocaleDateString('pt-BR'),
      descricao: t.descricaoOriginal,
      tipo: t.tipo,
      valor: parseFloat(t.valor),
      status: t.status,
      motivo: t.status === 'pendente' 
        ? 'Não classificada automaticamente' 
        : 'Classificação com baixa confiança',
    }));

    if (formato === 'xlsx') {
      // Criar workbook
      const workbook = XLSX.utils.book_new();

      const dados = [
        ['Data', 'Descrição', 'Tipo', 'Valor', 'Status', 'Motivo'],
        ...resultado.map(r => [
          r.data,
          r.descricao,
          r.tipo,
          r.valor,
          r.status,
          r.motivo,
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(dados);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Divergências');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="divergencias-${empresaId}-${Date.now()}.xlsx"`);
      res.send(buffer);
    } else {
      res.json(resultado);
    }
  } catch (error) {
    console.error('Erro ao gerar relatório de divergências:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório de divergências' });
  }
});

export default router;