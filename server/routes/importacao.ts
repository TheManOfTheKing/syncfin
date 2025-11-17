import { Router } from 'express';
import multer from 'multer';
import { getDb } from '../db/index.js';
import { transacoes, usuarioEmpresas, mapeamentosImportacao } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { processarCSV, processarXLSX, mapearTransacoes, gerarHashTransacao, limparDescricao } from '../services/importacao.js';
import { classificarAutomaticamente } from '../services/classificacao.js';

const router = Router();

/**
 * Identifica o banco pela formatação/colunas do extrato
 */
function identificarBanco(colunas: string[]): string | null {
  const colunasLower = colunas.map(c => c.toLowerCase().trim());
  
  // Padrões conhecidos de bancos brasileiros
  const padroesBancos: Record<string, string[]> = {
    '001': ['banco do brasil', 'bb', 'data', 'histórico', 'documento', 'valor'],
    '033': ['santander', 'data', 'descrição', 'débito', 'crédito', 'saldo'],
    '104': ['caixa', 'data', 'histórico', 'valor', 'saldo'],
    '237': ['bradesco', 'data', 'histórico', 'documento', 'valor'],
    '341': ['itau', 'itau', 'data', 'lançamento', 'descrição', 'valor'],
    '422': ['safra', 'data', 'histórico', 'valor'],
    '748': ['sicredi', 'data', 'histórico', 'valor'],
  };

  // Verificar cada padrão
  for (const [codigo, palavrasChave] of Object.entries(padroesBancos)) {
    const matches = palavrasChave.filter(palavra => 
      colunasLower.some(col => col.includes(palavra))
    );
    
    // Se encontrou pelo menos 3 palavras-chave, provavelmente é este banco
    if (matches.length >= 3) {
      return codigo;
    }
  }

  // Tentar identificar por padrões genéricos
  const temData = colunasLower.some(c => /data|date|dt/i.test(c));
  const temDescricao = colunasLower.some(c => /descri|historico|hist|lançamento/i.test(c));
  const temValor = colunasLower.some(c => /valor|value|amount|debito|credito/i.test(c));

  if (temData && temDescricao && temValor) {
    // Formato genérico, não identificamos banco específico
    return null;
  }

  return null;
}

// Configurar multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
    const allowedMimes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.csv') || file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV e XLSX são permitidos'));
    }
  },
});

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Upload e processamento inicial do arquivo
router.post('/upload', upload.single('arquivo'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { empresaId } = req.body;

    if (!empresaId || !req.file) {
      return res.status(400).json({ error: 'Empresa e arquivo são obrigatórios' });
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

    let resultado;

    // Processar arquivo
    if (req.file.originalname.endsWith('.csv')) {
      const conteudo = req.file.buffer.toString('utf-8');
      resultado = processarCSV(conteudo);
    } else if (req.file.originalname.endsWith('.xlsx')) {
      resultado = processarXLSX(req.file.buffer);
    } else {
      return res.status(400).json({ error: 'Formato de arquivo não suportado' });
    }

    if (!resultado.sucesso) {
      return res.status(400).json({ error: 'Erro ao processar arquivo', detalhes: resultado.erros });
    }

    // Tentar identificar banco e buscar mapeamento pré-salvo
    const bancoIdentificado = identificarBanco(resultado.colunas);
    let mapeamentoPreSalvo = null;

    if (bancoIdentificado) {
      // Buscar mapeamento salvo para este banco/empresa
      const [mapeamento] = await db
        .select()
        .from(mapeamentosImportacao)
        .where(
          and(
            eq(mapeamentosImportacao.empresaId, parseInt(empresaId)),
            eq(mapeamentosImportacao.bancoCodigo, bancoIdentificado),
            eq(mapeamentosImportacao.extensao, req.file.originalname.split('.').pop() || ''),
            eq(mapeamentosImportacao.ativo, true)
          )
        )
        .orderBy(desc(mapeamentosImportacao.createdAt))
        .limit(1);

      if (mapeamento) {
        try {
          mapeamentoPreSalvo = JSON.parse(mapeamento.mapaJson);
        } catch (error) {
          console.error('Erro ao parsear mapeamento salvo:', error);
        }
      }
    }

    res.json({
      colunas: resultado.colunas,
      preview: resultado.preview,
      dadosCompletos: resultado.dadosCompletos,
      totalLinhas: resultado.totalLinhas,
      extensao: req.file.originalname.split('.').pop(),
      bancoIdentificado,
      mapeamentoPreSalvo,
    });
  } catch (error: any) {
    console.error('Erro ao fazer upload:', error);
    res.status(500).json({ error: error.message || 'Erro ao processar arquivo' });
  }
});

// Confirmar importação com mapeamento
router.post('/confirmar', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { empresaId, contaId, mapeamento, dados, extensao, bancoCodigo } = req.body;

    if (!empresaId || !mapeamento || !dados || !extensao) {
      return res.status(400).json({ error: 'Dados incompletos para importação' });
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

    // Mapear transações
    const transacoesMapeadas = mapearTransacoes(dados, mapeamento, parseInt(empresaId));

    let importadas = 0;
    let duplicadas = 0;
    let erros = 0;
    let classificadas = 0;

    // Inserir transações
    for (const transacao of transacoesMapeadas) {
      try {
        const hashUnico = gerarHashTransacao(
          parseInt(empresaId),
          transacao.data,
          transacao.descricao,
          transacao.valor
        );

        // Verificar se já existe
        const [existente] = await db
          .select()
          .from(transacoes)
          .where(
            and(
              eq(transacoes.empresaId, parseInt(empresaId)),
              eq(transacoes.hashUnico, hashUnico)
            )
          )
          .limit(1);

        if (existente) {
          duplicadas++;
          continue;
        }

        const descricaoLimpa = limparDescricao(transacao.descricao);

        // Tentar classificação automática
        const classificacao = await classificarAutomaticamente(
          parseInt(empresaId),
          descricaoLimpa
        );

        // Inserir transação
        const dbInstance = await getDb();
        await dbInstance.insert(transacoes).values({
          empresaId: parseInt(empresaId),
          contaId: contaId ? parseInt(contaId) : null,
          dataOperacao: transacao.data,
          descricaoOriginal: transacao.descricao,
          descricaoLimpa,
          tipo: transacao.tipo,
          valor: transacao.valor.toString(),
          saldoPos: transacao.saldo ? transacao.saldo.toString() : null,
          hashUnico: hashUnico,
          categoriaId: classificacao.categoriaId,
          status: classificacao.categoriaId
            ? classificacao.confidence >= 70
              ? 'classificacao_automatica'
              : 'baixa_confianca'
            : 'pendente',
          origem: 'importacao',
        } as any);

        importadas++;
        if (classificacao.categoriaId) {
          classificadas++;
        }
      } catch (error: any) {
        console.error('Erro ao importar transação:', error);
        erros++;
      }
    }

    // Salvar mapeamento se fornecido
    if (bancoCodigo) {
      try {
        const dbInstance2 = await getDb();
        await dbInstance2.insert(mapeamentosImportacao).values({
          empresaId: parseInt(empresaId),
          bancoCodigo,
          extensao,
          mapaJson: JSON.stringify(mapeamento),
          ativo: true,
        } as any);
      } catch (error) {
        console.error('Erro ao salvar mapeamento:', error);
      }
    }

    res.json({
      sucesso: true,
      importadas,
      duplicadas,
      erros,
      classificadas,
      taxaClassificacao: importadas > 0 ? Math.round((classificadas / importadas) * 100) : 0,
    });
  } catch (error: any) {
    console.error('Erro ao confirmar importação:', error);
    res.status(500).json({ error: error.message || 'Erro ao confirmar importação' });
  }
});

// Listar mapeamentos salvos
router.get('/mapeamentos/empresa/:empresaId', async (req: AuthRequest, res) => {
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

    const mapeamentos = await db
      .select()
      .from(mapeamentosImportacao)
      .where(
        and(
          eq(mapeamentosImportacao.empresaId, empresaId),
          eq(mapeamentosImportacao.ativo, true)
        )
      );

    const mapeamentosFormatados = mapeamentos.map(m => ({
      id: m.id,
      bancoCodigo: m.bancoCodigo,
      extensao: m.extensao,
      mapa: JSON.parse(m.mapaJson),
      createdAt: m.createdAt,
    }));

    res.json(mapeamentosFormatados);
  } catch (error) {
    console.error('Erro ao listar mapeamentos:', error);
    res.status(500).json({ error: 'Erro ao listar mapeamentos' });
  }
});

export default router;

