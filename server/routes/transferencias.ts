import { Router } from 'express';
import { getDb } from '../db/index.js';
import { transacoes, usuarioEmpresas } from '../db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { detectarTransferenciasInternas } from '../services/classificacao.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Detectar transferências internas
router.post('/detectar', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { empresaId, dataInicio, dataFim } = req.body;

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
          eq(usuarioEmpresas.empresaId, parseInt(empresaId))
        )
      )
      .limit(1);

    if (!acesso) {
      return res.status(403).json({ error: 'Acesso negado a esta empresa' });
    }

    const inicio = dataInicio ? new Date(dataInicio) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 dias atrás
    const fim = dataFim ? new Date(dataFim) : new Date();

    const transferencias = await detectarTransferenciasInternas(
      parseInt(empresaId),
      inicio,
      fim
    );

    // Atualizar status das transações identificadas como transferências
    let atualizadas = 0;
    for (const transferencia of transferencias) {
      if (transferencia.confidence >= 70) {
        // Buscar transações
        const [saida] = await db
          .select()
          .from(transacoes)
          .where(eq(transacoes.id, transferencia.saida))
          .limit(1);

        const [entrada] = await db
          .select()
          .from(transacoes)
          .where(eq(transacoes.id, transferencia.entrada))
          .limit(1);

        if (saida && entrada) {
          // Gerar grupo de transferência (usar o menor ID)
          const grupoId = Math.min(saida.id, entrada.id);

          const dbInstance2 = await getDb();
          await dbInstance2.update(transacoes)
            .set({
              status: 'transferencia_interna',
              grupoTransferenciaId: grupoId,
              updatedAt: new Date(),
            } as any)
            .where(
              and(
                eq(transacoes.empresaId, parseInt(empresaId)),
                eq(transacoes.id, transferencia.saida)
              )
            );

          const dbInstance2 = await getDb();
          await dbInstance2.update(transacoes)
            .set({
              status: 'transferencia_interna',
              grupoTransferenciaId: grupoId,
              updatedAt: new Date(),
            } as any)
            .where(
              and(
                eq(transacoes.empresaId, parseInt(empresaId)),
                eq(transacoes.id, transferencia.entrada)
              )
            );

          atualizadas += 2;
        }
      }
    }

    res.json({
      transferencias: transferencias.length,
      atualizadas,
      detalhes: transferencias,
    });
  } catch (error) {
    console.error('Erro ao detectar transferências:', error);
    res.status(500).json({ error: 'Erro ao detectar transferências' });
  }
});

// Listar transferências de uma empresa
router.get('/empresa/:empresaId', async (req: AuthRequest, res) => {
  try {
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

    const transferenciasList = await db
      .select()
      .from(transacoes)
      .where(
        and(
          eq(transacoes.empresaId, empresaId),
          eq(transacoes.status, 'transferencia_interna')
        )
      );

    // Agrupar por grupoTransferenciaId
    const grupos: Record<number, any[]> = {};
    transferenciasList.forEach(t => {
      if (t.grupoTransferenciaId) {
        if (!grupos[t.grupoTransferenciaId]) {
          grupos[t.grupoTransferenciaId] = [];
        }
        grupos[t.grupoTransferenciaId].push(t);
      }
    });

    const transferenciasAgrupadas = Object.values(grupos).filter(grupo => grupo.length === 2);

    res.json(transferenciasAgrupadas);
  } catch (error) {
    console.error('Erro ao listar transferências:', error);
    res.status(500).json({ error: 'Erro ao listar transferências' });
  }
});

export default router;

