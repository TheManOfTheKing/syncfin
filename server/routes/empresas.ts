import { Router } from 'express';
import { getDb } from '../db/index.js';
// Helper para facilitar uso do db
async function getDbInstance() {
  return await getDb();
}
import { empresas, usuarioEmpresas } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Listar empresas do usuário
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    // Buscar empresas associadas ao usuário
    const empresasUsuario = await db
      .select({
        id: empresas.id,
        nome: empresas.nome,
        documento: empresas.documento,
        slug: empresas.slug,
        status: empresas.status,
        perfil: usuarioEmpresas.perfil,
        createdAt: empresas.createdAt,
      })
      .from(empresas)
      .innerJoin(usuarioEmpresas, eq(empresas.id, usuarioEmpresas.empresaId))
      .where(eq(usuarioEmpresas.usuarioId, userId));

    res.json(empresasUsuario);
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    res.status(500).json({ error: 'Erro ao listar empresas' });
  }
});

// Buscar empresa por ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const empresaId = parseInt(req.params.id);

    // Verificar se usuário tem acesso à empresa
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

    const [empresa] = await db
      .select()
      .from(empresas)
      .where(eq(empresas.id, empresaId))
      .limit(1);

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    res.json(empresa);
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    res.status(500).json({ error: 'Erro ao buscar empresa' });
  }
});

// Criar nova empresa
router.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { nome, documento, slug } = req.body;

    if (!nome || !documento) {
      return res.status(400).json({ error: 'Nome e documento são obrigatórios' });
    }

    // Verificar se documento já existe
    const [existente] = await db
      .select()
      .from(empresas)
      .where(eq(empresas.documento, documento))
      .limit(1);

    if (existente) {
      return res.status(400).json({ error: 'Documento já cadastrado' });
    }

    // Criar empresa
    const dbInstance = await getDb();
    const [novaEmpresa] = await dbInstance.insert(empresas).values({
      nome,
      documento,
      slug: slug || nome.toLowerCase().replace(/\s+/g, '-'),
      status: 'ativa',
    } as any);

    // Associar usuário à empresa como admin
    const dbInstance2 = await getDb();
    await dbInstance2.insert(usuarioEmpresas).values({
      usuarioId: userId,
      empresaId: novaEmpresa.insertId,
      perfil: 'admin',
    } as any);

    const [empresa] = await db
      .select()
      .from(empresas)
      .where(eq(empresas.id, novaEmpresa.insertId))
      .limit(1);

    res.status(201).json(empresa);
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    res.status(500).json({ error: 'Erro ao criar empresa' });
  }
});

// Atualizar empresa
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const empresaId = parseInt(req.params.id);
    const { nome, documento, slug, status } = req.body;

    // Verificar se usuário tem acesso como admin
    const [acesso] = await db
      .select()
      .from(usuarioEmpresas)
      .where(
        and(
          eq(usuarioEmpresas.usuarioId, userId),
          eq(usuarioEmpresas.empresaId, empresaId),
          eq(usuarioEmpresas.perfil, 'admin')
        )
      )
      .limit(1);

    if (!acesso) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem editar empresas' });
    }

    // Verificar se documento já existe (se foi alterado)
    if (documento) {
      const [existente] = await db
        .select()
        .from(empresas)
        .where(eq(empresas.documento, documento))
        .limit(1);

      if (existente && existente.id !== empresaId) {
        return res.status(400).json({ error: 'Documento já cadastrado' });
      }
    }

    // Atualizar empresa
    const updateData: any = {};
    if (nome) updateData.nome = nome;
    if (documento) updateData.documento = documento;
    if (slug) updateData.slug = slug;
    if (status) updateData.status = status;
    updateData.updatedAt = new Date();

    await db
      .update(empresas)
      .set(updateData)
      .where(eq(empresas.id, empresaId));

    const [empresa] = await db
      .select()
      .from(empresas)
      .where(eq(empresas.id, empresaId))
      .limit(1);

    res.json(empresa);
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    res.status(500).json({ error: 'Erro ao atualizar empresa' });
  }
});

// Deletar empresa (soft delete - apenas inativar)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const empresaId = parseInt(req.params.id);

    // Verificar se usuário tem acesso como admin
    const [acesso] = await db
      .select()
      .from(usuarioEmpresas)
      .where(
        and(
          eq(usuarioEmpresas.usuarioId, userId),
          eq(usuarioEmpresas.empresaId, empresaId),
          eq(usuarioEmpresas.perfil, 'admin')
        )
      )
      .limit(1);

    if (!acesso) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem deletar empresas' });
    }

    // Inativar empresa
    await db
      .update(empresas)
      .set({ status: 'inativa', updatedAt: new Date() } as any)
      .where(eq(empresas.id, empresaId));

    res.json({ message: 'Empresa inativada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar empresa:', error);
    res.status(500).json({ error: 'Erro ao deletar empresa' });
  }
});

export default router;

