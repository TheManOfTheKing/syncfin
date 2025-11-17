import { Router } from 'express';
import { getDb } from '../db/index.js';
import { contasBancarias, usuarioEmpresas } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Listar contas bancárias de uma empresa
router.get('/empresa/:empresaId', async (req: AuthRequest, res) => {
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

    const contas = await db
      .select()
      .from(contasBancarias)
      .where(eq(contasBancarias.empresaId, empresaId));

    res.json(contas);
  } catch (error) {
    console.error('Erro ao listar contas:', error);
    res.status(500).json({ error: 'Erro ao listar contas bancárias' });
  }
});

// Buscar conta por ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const userId = req.user!.userId;
    const contaId = parseInt(req.params.id);

    const [conta] = await db
      .select()
      .from(contasBancarias)
      .where(eq(contasBancarias.id, contaId))
      .limit(1);

    if (!conta) {
      return res.status(404).json({ error: 'Conta bancária não encontrada' });
    }

    // Verificar acesso à empresa
    const [acesso] = await db
      .select()
      .from(usuarioEmpresas)
      .where(
        and(
          eq(usuarioEmpresas.usuarioId, userId),
          eq(usuarioEmpresas.empresaId, conta.empresaId)
        )
      )
      .limit(1);

    if (!acesso) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(conta);
  } catch (error) {
    console.error('Erro ao buscar conta:', error);
    res.status(500).json({ error: 'Erro ao buscar conta bancária' });
  }
});

// Criar nova conta bancária
router.post('/', async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const userId = req.user!.userId;
    const { empresaId, nome, bancoCodigo, agencia, conta: numeroConta, identificadorUnico } = req.body;

    if (!empresaId || !nome) {
      return res.status(400).json({ error: 'Empresa e nome são obrigatórios' });
    }

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

    const [novaConta] = await db.insert(contasBancarias).values({
      empresaId,
      nome,
      bancoCodigo,
      agencia,
      conta: numeroConta,
      identificadorUnico,
      status: 'ativa',
    } as any);

    const [contaCriada] = await db
      .select()
      .from(contasBancarias)
      .where(eq(contasBancarias.id, novaConta.insertId))
      .limit(1);

    res.status(201).json(contaCriada);
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    res.status(500).json({ error: 'Erro ao criar conta bancária' });
  }
});

// Atualizar conta bancária
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const userId = req.user!.userId;
    const contaId = parseInt(req.params.id);
    const { nome, bancoCodigo, agencia, conta: numeroConta, identificadorUnico, status } = req.body;

    const [contaExistente] = await db
      .select()
      .from(contasBancarias)
      .where(eq(contasBancarias.id, contaId))
      .limit(1);

    if (!contaExistente) {
      return res.status(404).json({ error: 'Conta bancária não encontrada' });
    }

    // Verificar acesso à empresa
    const [acesso] = await db
      .select()
      .from(usuarioEmpresas)
      .where(
        and(
          eq(usuarioEmpresas.usuarioId, userId),
          eq(usuarioEmpresas.empresaId, contaExistente.empresaId)
        )
      )
      .limit(1);

    if (!acesso) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const updateData: any = {};
    if (nome) updateData.nome = nome;
    if (bancoCodigo !== undefined) updateData.bancoCodigo = bancoCodigo;
    if (agencia !== undefined) updateData.agencia = agencia;
    if (numeroConta !== undefined) updateData.conta = numeroConta;
    if (identificadorUnico !== undefined) updateData.identificadorUnico = identificadorUnico;
    if (status) updateData.status = status;
    updateData.updatedAt = new Date();

    await db
      .update(contasBancarias)
      .set(updateData)
      .where(eq(contasBancarias.id, contaId));

    const [contaAtualizada] = await db
      .select()
      .from(contasBancarias)
      .where(eq(contasBancarias.id, contaId))
      .limit(1);

    res.json(contaAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar conta:', error);
    res.status(500).json({ error: 'Erro ao atualizar conta bancária' });
  }
});

// Deletar conta bancária (soft delete)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const userId = req.user!.userId;
    const contaId = parseInt(req.params.id);

    const [conta] = await db
      .select()
      .from(contasBancarias)
      .where(eq(contasBancarias.id, contaId))
      .limit(1);

    if (!conta) {
      return res.status(404).json({ error: 'Conta bancária não encontrada' });
    }

    // Verificar acesso à empresa
    const [acesso] = await db
      .select()
      .from(usuarioEmpresas)
      .where(
        and(
          eq(usuarioEmpresas.usuarioId, userId),
          eq(usuarioEmpresas.empresaId, conta.empresaId)
        )
      )
      .limit(1);

    if (!acesso) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Inativar conta
    await db
      .update(contasBancarias)
      .set({ status: 'inativa', updatedAt: new Date() } as any)
      .where(eq(contasBancarias.id, contaId));

    res.json({ message: 'Conta bancária inativada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    res.status(500).json({ error: 'Erro ao deletar conta bancária' });
  }
});

export default router;

