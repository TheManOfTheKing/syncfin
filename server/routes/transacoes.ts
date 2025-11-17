import { Router } from 'express';
import { getDb } from '../db/index.js';
import { transacoes, usuarioEmpresas, categorias } from '../db/schema.js';
import { eq, and, desc, gte, lte, or } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { classificarAutomaticamente, registrarAprendizado } from '../services/classificacao.js';
import { limparDescricao } from '../services/importacao.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Listar transações de uma empresa
router.get('/empresa/:empresaId', async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const userId = req.user!.userId;
    const empresaId = parseInt(req.params.empresaId);
    const { status, tipo, dataInicio, dataFim, limit = '100', offset = '0' } = req.query;

    // Verificar acesso à empresa
    const [acesso] = await db
      .select()
      .from(usuarioEmpresas)
      .where(
        and(
          eq(usuarioEmpresas.usuarioId, userId),
          eq(usuarioEmpresas.empresaId, empresaId)
        )
      )
      .limit(1);

    if (!acesso) {
      return res.status(403).json({ error: 'Acesso negado a esta empresa' });
    }

    // Construir condições de filtro
    const conditions: any[] = [eq(transacoes.empresaId, empresaId)];

    if (status) {
      conditions.push(eq(transacoes.status, status as any));
    }

    if (tipo) {
      conditions.push(eq(transacoes.tipo, tipo as any));
    }

    if (dataInicio) {
      const inicio = new Date(dataInicio as string);
      conditions.push(gte(transacoes.dataOperacao, inicio));
    }

    if (dataFim) {
      const fim = new Date(dataFim as string);
      conditions.push(lte(transacoes.dataOperacao, fim));
    }

    const transacoesList = await db
      .select()
      .from(transacoes)
      .where(and(...conditions))
      .orderBy(desc(transacoes.dataOperacao))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    // Buscar categorias relacionadas
    const categoriaIds = transacoesList
      .map(t => t.categoriaId)
      .filter((id): id is number => id !== null);

    let categoriasMap: Record<number, any> = {};
    if (categoriaIds.length > 0) {
      // Buscar categorias uma por uma ou usar inArray se disponível
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

    const transacoesComCategorias = transacoesList.map(t => ({
      ...t,
      categoria: t.categoriaId ? categoriasMap[t.categoriaId] : null,
    }));

    res.json(transacoesComCategorias);
  } catch (error) {
    console.error('Erro ao listar transações:', error);
    res.status(500).json({ error: 'Erro ao listar transações' });
  }
});

// Buscar transação por ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const userId = req.user!.userId;
    const transacaoId = parseInt(req.params.id);

    const [transacao] = await db
      .select()
      .from(transacoes)
      .where(eq(transacoes.id, transacaoId))
      .limit(1);

    if (!transacao) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    // Verificar acesso à empresa
    const [acesso] = await db
      .select()
      .from(usuarioEmpresas)
      .where(
        and(
          eq(usuarioEmpresas.usuarioId, userId),
          eq(usuarioEmpresas.empresaId, transacao.empresaId)
        )
      )
      .limit(1);

    if (!acesso) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Buscar categoria se existir
    let categoria = null;
    if (transacao.categoriaId) {
      const [cat] = await db
        .select()
        .from(categorias)
        .where(eq(categorias.id, transacao.categoriaId))
        .limit(1);
      categoria = cat || null;
    }

    res.json({ ...transacao, categoria });
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    res.status(500).json({ error: 'Erro ao buscar transação' });
  }
});

// Classificar transação manualmente
router.put('/:id/classificar', async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const userId = req.user!.userId;
    const transacaoId = parseInt(req.params.id);
    const { categoriaId } = req.body;

    if (!categoriaId) {
      return res.status(400).json({ error: 'Categoria é obrigatória' });
    }

    const [transacao] = await db
      .select()
      .from(transacoes)
      .where(eq(transacoes.id, transacaoId))
      .limit(1);

    if (!transacao) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    // Verificar acesso à empresa
    const [acesso] = await db
      .select()
      .from(usuarioEmpresas)
      .where(
        and(
          eq(usuarioEmpresas.usuarioId, userId),
          eq(usuarioEmpresas.empresaId, transacao.empresaId)
        )
      )
      .limit(1);

    if (!acesso) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Verificar se categoria existe e pertence à empresa
    const [categoria] = await db
      .select()
      .from(categorias)
      .where(
        and(
          eq(categorias.id, categoriaId),
          eq(categorias.empresaId, transacao.empresaId),
          eq(categorias.ativo, true)
        )
      )
      .limit(1);

    if (!categoria) {
      return res.status(404).json({ error: 'Categoria não encontrada ou inativa' });
    }

    // Atualizar transação
    await db
      .update(transacoes)
      .set({
        categoriaId,
        status: 'classificacao_manual',
        updatedAt: new Date(),
      } as any)
      .where(eq(transacoes.id, transacaoId));

    // Registrar aprendizado
    await registrarAprendizado(
      transacao.empresaId,
      transacao.descricaoOriginal,
      transacao.descricaoLimpa,
      categoriaId,
      userId
    );

    const [transacaoAtualizada] = await db
      .select()
      .from(transacoes)
      .where(eq(transacoes.id, transacaoId))
      .limit(1);

    res.json(transacaoAtualizada);
  } catch (error) {
    console.error('Erro ao classificar transação:', error);
    res.status(500).json({ error: 'Erro ao classificar transação' });
  }
});

// Estatísticas de transações
router.get('/empresa/:empresaId/estatisticas', async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const userId = req.user!.userId;
    const empresaId = parseInt(req.params.empresaId);

    // Verificar acesso à empresa
    const [acesso] = await db
      .select()
      .from(usuarioEmpresas)
      .where(
        and(
          eq(usuarioEmpresas.usuarioId, userId),
          eq(usuarioEmpresas.empresaId, empresaId)
        )
      )
      .limit(1);

    if (!acesso) {
      return res.status(403).json({ error: 'Acesso negado a esta empresa' });
    }

    const todasTransacoes = await db
      .select()
      .from(transacoes)
      .where(eq(transacoes.empresaId, empresaId));

    const pendentes = todasTransacoes.filter(t => t.status === 'pendente').length;
    const automaticas = todasTransacoes.filter(t => t.status === 'classificacao_automatica').length;
    const manuais = todasTransacoes.filter(t => t.status === 'classificacao_manual').length;
    const transferencias = todasTransacoes.filter(t => t.status === 'transferencia_interna').length;

    const totalEntradas = todasTransacoes
      .filter(t => t.tipo === 'entrada')
      .reduce((sum, t) => sum + parseFloat(t.valor), 0);

    const totalSaidas = todasTransacoes
      .filter(t => t.tipo === 'saida')
      .reduce((sum, t) => sum + parseFloat(t.valor), 0);

    const taxaAutomacao = todasTransacoes.length > 0
      ? Math.round((automaticas / todasTransacoes.length) * 100)
      : 0;

    res.json({
      total: todasTransacoes.length,
      pendentes,
      automaticas,
      manuais,
      transferencias,
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
      taxaAutomacao,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;