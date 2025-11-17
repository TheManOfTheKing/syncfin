import { Router } from 'express';
import { db } from '../db/index.js';
import { categorias, usuarioEmpresas } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Listar categorias de uma empresa
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

    const categoriasList = await db
      .select()
      .from(categorias)
      .where(
        and(
          eq(categorias.empresaId, empresaId),
          eq(categorias.ativo, true)
        )
      );

    res.json(categoriasList);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

// Buscar categoria por ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const categoriaId = parseInt(req.params.id);

    const [categoria] = await db
      .select()
      .from(categorias)
      .where(eq(categorias.id, categoriaId))
      .limit(1);

    if (!categoria) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    // Verificar acesso à empresa
    const [acesso] = await db
      .select()
      .from(usuarioEmpresas)
      .where(
        and(
          eq(usuarioEmpresas.usuarioId, userId),
          eq(usuarioEmpresas.empresaId, categoria.empresaId)
        )
      )
      .limit(1);

    if (!acesso) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(categoria);
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    res.status(500).json({ error: 'Erro ao buscar categoria' });
  }
});

// Criar nova categoria
router.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { empresaId, nome, tipo, codigo, descricao } = req.body;

    if (!empresaId || !nome || !tipo) {
      return res.status(400).json({ error: 'Empresa, nome e tipo são obrigatórios' });
    }

    if (!['entrada', 'saida'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo deve ser "entrada" ou "saida"' });
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

    const [novaCategoria] = await db.insert(categorias).values({
      empresaId,
      nome,
      tipo,
      codigo,
      descricao,
      ativo: true,
    } as any);

    const [categoria] = await db
      .select()
      .from(categorias)
      .where(eq(categorias.id, novaCategoria.insertId))
      .limit(1);

    res.status(201).json(categoria);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// Atualizar categoria
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const categoriaId = parseInt(req.params.id);
    const { nome, tipo, codigo, descricao, ativo } = req.body;

    const [categoria] = await db
      .select()
      .from(categorias)
      .where(eq(categorias.id, categoriaId))
      .limit(1);

    if (!categoria) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    // Verificar acesso à empresa
    const [acesso] = await db
      .select()
      .from(usuarioEmpresas)
      .where(
        and(
          eq(usuarioEmpresas.usuarioId, userId),
          eq(usuarioEmpresas.empresaId, categoria.empresaId)
        )
      )
      .limit(1);

    if (!acesso) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const updateData: any = {};
    if (nome) updateData.nome = nome;
    if (tipo) updateData.tipo = tipo;
    if (codigo !== undefined) updateData.codigo = codigo;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (ativo !== undefined) updateData.ativo = ativo;
    updateData.updatedAt = new Date();

    await db
      .update(categorias)
      .set(updateData)
      .where(eq(categorias.id, categoriaId));

    const [categoriaAtualizada] = await db
      .select()
      .from(categorias)
      .where(eq(categorias.id, categoriaId))
      .limit(1);

    res.json(categoriaAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

// Deletar categoria (soft delete)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const categoriaId = parseInt(req.params.id);

    const [categoria] = await db
      .select()
      .from(categorias)
      .where(eq(categorias.id, categoriaId))
      .limit(1);

    if (!categoria) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    // Verificar acesso à empresa
    const [acesso] = await db
      .select()
      .from(usuarioEmpresas)
      .where(
        and(
          eq(usuarioEmpresas.usuarioId, userId),
          eq(usuarioEmpresas.empresaId, categoria.empresaId)
        )
      )
      .limit(1);

    if (!acesso) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Inativar categoria
    await db
      .update(categorias)
      .set({ ativo: false, updatedAt: new Date() } as any)
      .where(eq(categorias.id, categoriaId));

    res.json({ message: 'Categoria inativada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    res.status(500).json({ error: 'Erro ao deletar categoria' });
  }
});

export default router;

