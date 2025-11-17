import { Router } from 'express';
import { db } from '../db/index.js';
import { transacoes, usuarioEmpresas, empresas, categorias } from '../db/schema.js';
import { eq, and, or, inArray } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Dashboard executivo com KPIs agregados
router.get('/kpis', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    // Buscar todas as empresas do usuário
    const empresasUsuario = await db
      .select()
      .from(usuarioEmpresas)
      .where(eq(usuarioEmpresas.usuarioId, userId));

    const empresaIds = empresasUsuario.map(e => e.empresaId);

    if (empresaIds.length === 0) {
      return res.json({
        totalTransacoes: 0,
        transacoesPendentes: 0,
        totalEntradas: 0,
        totalSaidas: 0,
        taxaAutomacao: 0,
        ticketMedio: 0,
        empresasAtivas: 0,
        distribuicaoCategorias: [],
      });
    }

    // Buscar todas as transações das empresas do usuário
    const todasTransacoes = await db
      .select()
      .from(transacoes)
      .where(
        empresaIds.length === 1
          ? eq(transacoes.empresaId, empresaIds[0])
          : or(...empresaIds.map(id => eq(transacoes.empresaId, id)))
      );

    // Calcular KPIs
    const totalTransacoes = todasTransacoes.length;
    const transacoesPendentes = todasTransacoes.filter(t => t.status === 'pendente').length;
    
    const transacoesClassificadas = todasTransacoes.filter(
      t => t.status === 'classificacao_automatica' || t.status === 'classificacao_manual'
    );
    const taxaAutomacao = totalTransacoes > 0
      ? Math.round((transacoesClassificadas.length / totalTransacoes) * 100)
      : 0;

    const entradas = todasTransacoes.filter(t => t.tipo === 'entrada');
    const saidas = todasTransacoes.filter(t => t.tipo === 'saida');
    
    const totalEntradas = entradas.reduce((sum, t) => sum + parseFloat(t.valor), 0);
    const totalSaidas = saidas.reduce((sum, t) => sum + parseFloat(t.valor), 0);

    // Ticket médio (média dos valores de entrada)
    const ticketMedio = entradas.length > 0
      ? totalEntradas / entradas.length
      : 0;

    // Distribuição por categoria
    const categoriaIds = todasTransacoes
      .map(t => t.categoriaId)
      .filter((id): id is number => id !== null);

    let distribuicaoCategorias: Array<{ categoria: string; total: number; tipo: string }> = [];
    
    if (categoriaIds.length > 0) {
      const categoriasList = await db
        .select()
        .from(categorias)
        .where(
          categoriaIds.length === 1
            ? eq(categorias.id, categoriaIds[0])
            : or(...categoriaIds.map(id => eq(categorias.id, id)))
        );

      const categoriasMap: Record<number, any> = {};
      categoriasList.forEach(cat => {
        categoriasMap[cat.id] = cat;
      });

      const distribuicaoMap: Record<number, number> = {};
      todasTransacoes.forEach(t => {
        if (t.categoriaId) {
          distribuicaoMap[t.categoriaId] = (distribuicaoMap[t.categoriaId] || 0) + parseFloat(t.valor);
        }
      });

      distribuicaoCategorias = Object.entries(distribuicaoMap)
        .map(([catId, total]) => ({
          categoria: categoriasMap[parseInt(catId)]?.nome || 'Sem categoria',
          total,
          tipo: categoriasMap[parseInt(catId)]?.tipo || 'entrada',
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10); // Top 10 categorias
    }

    // Contar empresas ativas
    const empresasAtivas = await db
      .select()
      .from(empresas)
      .where(
        and(
          empresaIds.length === 1
            ? eq(empresas.id, empresaIds[0])
            : or(...empresaIds.map(id => eq(empresas.id, id))),
          eq(empresas.status, 'ativa')
        )
      );

    res.json({
      totalTransacoes,
      transacoesPendentes,
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
      taxaAutomacao,
      ticketMedio,
      empresasAtivas: empresasAtivas.length,
      distribuicaoCategorias,
    });
  } catch (error) {
    console.error('Erro ao buscar KPIs do dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar KPIs do dashboard' });
  }
});

export default router;

