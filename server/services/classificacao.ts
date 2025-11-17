import { getDb } from '../db/index.js';
import { eq, and, desc } from 'drizzle-orm';
import { historicoAprendizado, categorias, transacoes } from '../db/schema.js';

/**
 * Similaridade entre duas strings usando Levenshtein Distance
 */
function calcularSimilaridade(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0 || len2 === 0) return 0;

  // Matriz de distâncias
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deleção
        matrix[i][j - 1] + 1,      // inserção
        matrix[i - 1][j - 1] + cost // substituição
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  
  return 1 - (distance / maxLen);
}

/**
 * Extrai palavras-chave da descrição
 */
function extrairPalavrasChave(descricao: string): string[] {
  const stopWords = [
    'de', 'da', 'do', 'em', 'no', 'na', 'para', 'com', 'por',
    'a', 'o', 'e', 'ou', 'um', 'uma', 'the', 'and', 'or', 'of'
  ];

  return descricao
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(palavra => palavra.length > 2 && !stopWords.includes(palavra));
}

/**
 * Calcula score de correspondência baseado em palavras-chave
 */
function calcularScorePalavrasChave(desc1: string, desc2: string): number {
  const palavras1 = new Set(extrairPalavrasChave(desc1));
  const palavras2 = new Set(extrairPalavrasChave(desc2));

  if (palavras1.size === 0 || palavras2.size === 0) return 0;

  let matches = 0;
  palavras1.forEach(palavra => {
    if (palavras2.has(palavra)) {
      matches++;
    }
  });

  const total = Math.max(palavras1.size, palavras2.size);
  return matches / total;
}

export interface ResultadoClassificacao {
  categoriaId: number | null;
  confidence: number; // 0-100
  metodo: 'exata' | 'palavras_chave' | 'similaridade' | 'nenhuma';
}

/**
 * Classifica automaticamente uma transação baseada no histórico
 */
export async function classificarAutomaticamente(
  empresaId: number,
  descricaoLimpa: string
): Promise<ResultadoClassificacao> {
  try {
    // Buscar histórico de aprendizado da empresa
    const historico = await db
      .select()
      .from(historicoAprendizado)
      .where(eq(historicoAprendizado.empresaId, empresaId))
      .orderBy(desc(historicoAprendizado.createdAt))
      .limit(1000);

    if (historico.length === 0) {
      return { categoriaId: null, confidence: 0, metodo: 'nenhuma' };
    }

    let melhorMatch = {
      categoriaId: null as number | null,
      confidence: 0,
      metodo: 'nenhuma' as 'exata' | 'palavras_chave' | 'similaridade' | 'nenhuma',
    };

    // 1. Buscar correspondência exata
    for (const item of historico) {
      if (item.descricaoLimpa === descricaoLimpa) {
        return {
          categoriaId: item.categoriaId,
          confidence: 100,
          metodo: 'exata',
        };
      }
    }

    // 2. Buscar por palavras-chave
    for (const item of historico) {
      const score = calcularScorePalavrasChave(descricaoLimpa, item.descricaoLimpa);
      const confidence = Math.round(score * 85); // Máximo 85% para palavras-chave

      if (confidence > melhorMatch.confidence && confidence >= 60) {
        melhorMatch = {
          categoriaId: item.categoriaId,
          confidence,
          metodo: 'palavras_chave',
        };
      }
    }

    // 3. Buscar por similaridade (Levenshtein)
    if (melhorMatch.confidence < 60) {
      for (const item of historico) {
        const similaridade = calcularSimilaridade(descricaoLimpa, item.descricaoLimpa);
        const confidence = Math.round(similaridade * 80); // Máximo 80% para similaridade

        if (confidence > melhorMatch.confidence && confidence >= 50) {
          melhorMatch = {
            categoriaId: item.categoriaId,
            confidence,
            metodo: 'similaridade',
          };
        }
      }
    }

    return melhorMatch;
  } catch (error) {
    console.error('Erro na classificação automática:', error);
    return { categoriaId: null, confidence: 0, metodo: 'nenhuma' };
  }
}

/**
 * Registra aprendizado de classificação manual
 */
export async function registrarAprendizado(
  empresaId: number,
  descricaoOriginal: string,
  descricaoLimpa: string,
  categoriaId: number,
  usuarioId: number
): Promise<void> {
  try {
    const dbInstance = await getDb();
    await dbInstance.insert(historicoAprendizado).values({
      empresaId,
      descricaoOriginal,
      descricaoLimpa,
      categoriaId,
      confidence: 100, // Classificação manual tem 100% de confiança
      usuarioId,
    } as any);
  } catch (error) {
    console.error('Erro ao registrar aprendizado:', error);
    throw error;
  }
}

/**
 * Detecta transferências internas entre contas
 * Considera apenas transações de contas bancárias diferentes da mesma empresa
 */
export async function detectarTransferenciasInternas(
  empresaId: number,
  dataInicio: Date,
  dataFim: Date,
  janelaTempoHoras: number = 60 // Configurável, padrão 60 horas (2.5 dias)
): Promise<Array<{ saida: number; entrada: number; confidence: number }>> {
  try {
    // Buscar transações de saída e entrada no período
    const transacoesEmpresa = await db
      .select()
      .from(transacoes)
      .where(
        and(
          eq(transacoes.empresaId, empresaId),
          eq(transacoes.status, 'pendente')
        )
      );

    const saidas = transacoesEmpresa.filter(t => t.tipo === 'saida');
    const entradas = transacoesEmpresa.filter(t => t.tipo === 'entrada');

    const transferencias: Array<{ saida: number; entrada: number; confidence: number }> = [];

    // Comparar saídas com entradas
    for (const saida of saidas) {
      for (const entrada of entradas) {
        // 1. Verificar se são de contas bancárias diferentes (ou ambas sem conta)
        const contasDiferentes = 
          (saida.contaId !== null && entrada.contaId !== null && saida.contaId !== entrada.contaId) ||
          (saida.contaId === null && entrada.contaId === null); // Se ambas sem conta, pode ser transferência entre sistemas
        
        if (!contasDiferentes && saida.contaId !== null) {
          continue; // Mesma conta, não é transferência interna
        }

        // 2. Mesmo valor (tolerância de 0.01 para arredondamentos)
        const valorSaida = parseFloat(saida.valor);
        const valorEntrada = parseFloat(entrada.valor);
        if (Math.abs(valorSaida - valorEntrada) >= 0.01) {
          continue;
        }

        // 3. Datas próximas (janela configurável em horas)
        const diffHoras = Math.abs(
          (entrada.dataOperacao.getTime() - saida.dataOperacao.getTime()) / (1000 * 60 * 60)
        );

        if (diffHoras > janelaTempoHoras) {
          continue;
        }

        // 4. Calcular confiança baseada em múltiplos fatores
        let confidence = 100;

        // Reduzir confiança pela distância temporal (máximo 30% de redução)
        const reducaoTemporal = Math.min(30, (diffHoras / janelaTempoHoras) * 30);
        confidence -= reducaoTemporal;

        // Adicionar verificação de similaridade de descrição (opcional, aumenta confiança)
        const similaridadeDesc = calcularSimilaridade(
          saida.descricaoLimpa || '',
          entrada.descricaoLimpa || ''
        );
        
        // Se descrições são similares (>= 50%), aumenta confiança
        if (similaridadeDesc >= 0.5) {
          confidence += Math.min(20, similaridadeDesc * 20);
        }

        // Garantir que confiança está entre 50 e 100
        confidence = Math.max(50, Math.min(100, Math.round(confidence)));

        // Só adicionar se confiança >= 70%
        if (confidence >= 70) {
          transferencias.push({
            saida: saida.id,
            entrada: entrada.id,
            confidence,
          });
        }
      }
    }

    return transferencias;
  } catch (error) {
    console.error('Erro ao detectar transferências:', error);
    return [];
  }
}
