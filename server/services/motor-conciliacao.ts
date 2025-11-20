/**
 * Motor de Conciliação Bancária (Matching Engine)
 * Responsável por comparar transações bancárias com lançamentos contábeis
 */

export interface Transacao {
  id: number;
  dataOperacao: Date;
  dataCompensacao?: Date;
  descricaoOriginal: string;
  descricaoLimpa: string;
  tipo: 'entrada' | 'saida';
  valor: number;
}

export interface Lancamento {
  id: number;
  tipo: 'pagar' | 'receber';
  dataVencimento: Date;
  dataPagamento?: Date;
  descricao: string;
  numeroDocumento?: string;
  nossoNumero?: string;
  codigoBarras?: string;
  fornecedorCliente?: string;
  valor: number;
  valorPago?: number;
}

export interface Match {
  transacaoId: number;
  lancamentoId: number;
  confidence: number; // 0-100
  tipo: 'automatica' | 'sugerida';
  motivos: string[];
  diferencas: {
    valor?: number;
    data?: number; // dias de diferença
  };
}

export interface ResultadoConciliacao {
  matchesAutomaticos: Match[];
  matchesSugeridos: Match[];
  transacoesNaoConciliadas: number[];
  lancamentosNaoConciliados: number[];
  estatisticas: {
    totalTransacoes: number;
    totalLancamentos: number;
    totalConciliados: number;
    taxaConciliacao: number;
    tempoProcessamento: number;
  };
}

/**
 * Executa o processo de conciliação
 */
export function executarConciliacao(
  transacoes: Transacao[],
  lancamentos: Lancamento[]
): ResultadoConciliacao {
  const inicio = Date.now();
  
  const resultado: ResultadoConciliacao = {
    matchesAutomaticos: [],
    matchesSugeridos: [],
    transacoesNaoConciliadas: [],
    lancamentosNaoConciliados: [],
    estatisticas: {
      totalTransacoes: transacoes.length,
      totalLancamentos: lancamentos.length,
      totalConciliados: 0,
      taxaConciliacao: 0,
      tempoProcessamento: 0,
    },
  };

  // Criar índices para otimizar busca
  const transacoesPorValor = indexarPorValor(transacoes);
  const lancamentosPorValor = indexarPorValor(lancamentos);

  const transacoesUsadas = new Set<number>();
  const lancamentosUsados = new Set<number>();

  // Fase 1: Matching por identificadores únicos (nosso número, código de barras)
  for (const lanc of lancamentos) {
    if (lancamentosUsados.has(lanc.id)) continue;

    for (const trans of transacoes) {
      if (transacoesUsadas.has(trans.id)) continue;

      const match = tentarMatchPorIdentificador(trans, lanc);
      if (match && match.confidence >= 95) {
        resultado.matchesAutomaticos.push(match);
        transacoesUsadas.add(trans.id);
        lancamentosUsados.add(lanc.id);
        break;
      }
    }
  }

  // Fase 2: Matching por valor exato + data próxima
  for (const lanc of lancamentos) {
    if (lancamentosUsados.has(lanc.id)) continue;

    const valorKey = Math.round(lanc.valor * 100);
    const transacoesCandidatas = transacoesPorValor.get(valorKey) || [];

    for (const trans of transacoesCandidatas) {
      if (transacoesUsadas.has(trans.id)) continue;

      const match = tentarMatchPorValorEData(trans, lanc);
      if (match) {
        if (match.confidence >= 85) {
          resultado.matchesAutomaticos.push(match);
          transacoesUsadas.add(trans.id);
          lancamentosUsados.add(lanc.id);
          break;
        } else if (match.confidence >= 70) {
          resultado.matchesSugeridos.push(match);
        }
      }
    }
  }

  // Fase 3: Matching por similaridade de descrição
  for (const lanc of lancamentos) {
    if (lancamentosUsados.has(lanc.id)) continue;

    let melhorMatch: Match | null = null;
    let melhorConfidence = 0;

    for (const trans of transacoes) {
      if (transacoesUsadas.has(trans.id)) continue;

      const match = tentarMatchPorSimilaridade(trans, lanc);
      if (match && match.confidence > melhorConfidence) {
        melhorMatch = match;
        melhorConfidence = match.confidence;
      }
    }

    if (melhorMatch) {
      if (melhorMatch.confidence >= 80) {
        resultado.matchesAutomaticos.push(melhorMatch);
        transacoesUsadas.add(melhorMatch.transacaoId);
        lancamentosUsados.add(melhorMatch.lancamentoId);
      } else if (melhorMatch.confidence >= 60) {
        resultado.matchesSugeridos.push(melhorMatch);
      }
    }
  }

  // Identificar não conciliados
  resultado.transacoesNaoConciliadas = transacoes
    .filter(t => !transacoesUsadas.has(t.id))
    .map(t => t.id);

  resultado.lancamentosNaoConciliados = lancamentos
    .filter(l => !lancamentosUsados.has(l.id))
    .map(l => l.id);

  // Calcular estatísticas
  resultado.estatisticas.totalConciliados = resultado.matchesAutomaticos.length;
  resultado.estatisticas.taxaConciliacao = 
    (resultado.estatisticas.totalConciliados / Math.max(transacoes.length, lancamentos.length)) * 100;
  resultado.estatisticas.tempoProcessamento = Date.now() - inicio;

  return resultado;
}

/**
 * Tenta fazer match por identificadores únicos
 */
function tentarMatchPorIdentificador(trans: Transacao, lanc: Lancamento): Match | null {
  const motivos: string[] = [];
  let confidence = 0;

  // Verificar tipo compatível
  if (!tiposCompativeis(trans.tipo, lanc.tipo)) {
    return null;
  }

  // Match por nosso número
  if (lanc.nossoNumero) {
    const nossoNumeroLimpo = limparTexto(lanc.nossoNumero);
    if (trans.descricaoLimpa.includes(nossoNumeroLimpo)) {
      confidence += 50;
      motivos.push(`Nosso número encontrado: ${lanc.nossoNumero}`);
    }
  }

  // Match por código de barras
  if (lanc.codigoBarras) {
    const codigoBarrasLimpo = limparTexto(lanc.codigoBarras);
    if (trans.descricaoLimpa.includes(codigoBarrasLimpo)) {
      confidence += 50;
      motivos.push(`Código de barras encontrado: ${lanc.codigoBarras}`);
    }
  }

  // Match por número do documento
  if (lanc.numeroDocumento) {
    const numeroDocLimpo = limparTexto(lanc.numeroDocumento);
    if (trans.descricaoLimpa.includes(numeroDocLimpo)) {
      confidence += 30;
      motivos.push(`Número do documento encontrado: ${lanc.numeroDocumento}`);
    }
  }

  // Verificar valor
  const diferencaValor = Math.abs(trans.valor - lanc.valor);
  if (diferencaValor === 0) {
    confidence += 20;
    motivos.push('Valor exato');
  } else if (diferencaValor < lanc.valor * 0.01) {
    confidence += 10;
    motivos.push('Valor muito próximo');
  }

  if (confidence >= 70) {
    return {
      transacaoId: trans.id,
      lancamentoId: lanc.id,
      confidence: Math.min(confidence, 100),
      tipo: confidence >= 85 ? 'automatica' : 'sugerida',
      motivos,
      diferencas: {
        valor: diferencaValor,
      },
    };
  }

  return null;
}

/**
 * Tenta fazer match por valor exato e data próxima
 */
function tentarMatchPorValorEData(trans: Transacao, lanc: Lancamento): Match | null {
  const motivos: string[] = [];
  let confidence = 0;

  // Verificar tipo compatível
  if (!tiposCompativeis(trans.tipo, lanc.tipo)) {
    return null;
  }

  // Verificar valor
  const diferencaValor = Math.abs(trans.valor - lanc.valor);
  if (diferencaValor === 0) {
    confidence += 50;
    motivos.push('Valor exato');
  } else if (diferencaValor < lanc.valor * 0.01) {
    confidence += 40;
    motivos.push(`Valor muito próximo (diferença: R$ ${diferencaValor.toFixed(2)})`);
  } else {
    return null; // Valor muito diferente
  }

  // Verificar data
  const dataTransacao = trans.dataCompensacao || trans.dataOperacao;
  const dataLancamento = lanc.dataPagamento || lanc.dataVencimento;
  
  const diferencaDias = Math.abs(
    (dataTransacao.getTime() - dataLancamento.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diferencaDias === 0) {
    confidence += 30;
    motivos.push('Data exata');
  } else if (diferencaDias <= 3) {
    confidence += 20;
    motivos.push(`Data próxima (${Math.round(diferencaDias)} dias de diferença)`);
  } else if (diferencaDias <= 7) {
    confidence += 10;
    motivos.push(`Data razoável (${Math.round(diferencaDias)} dias de diferença)`);
  } else {
    confidence -= 10;
  }

  // Verificar similaridade de descrição
  const similaridade = calcularSimilaridade(trans.descricaoLimpa, lanc.descricao);
  if (similaridade > 0.5) {
    confidence += Math.round(similaridade * 20);
    motivos.push(`Descrição similar (${Math.round(similaridade * 100)}%)`);
  }

  if (confidence >= 60) {
    return {
      transacaoId: trans.id,
      lancamentoId: lanc.id,
      confidence: Math.min(confidence, 100),
      tipo: confidence >= 85 ? 'automatica' : 'sugerida',
      motivos,
      diferencas: {
        valor: diferencaValor,
        data: Math.round(diferencaDias),
      },
    };
  }

  return null;
}

/**
 * Tenta fazer match por similaridade de descrição
 */
function tentarMatchPorSimilaridade(trans: Transacao, lanc: Lancamento): Match | null {
  const motivos: string[] = [];
  let confidence = 0;

  // Verificar tipo compatível
  if (!tiposCompativeis(trans.tipo, lanc.tipo)) {
    return null;
  }

  // Calcular similaridade de descrição
  const similaridade = calcularSimilaridade(trans.descricaoLimpa, lanc.descricao);
  confidence += Math.round(similaridade * 60);

  if (similaridade < 0.3) {
    return null; // Descrições muito diferentes
  }

  motivos.push(`Descrição similar (${Math.round(similaridade * 100)}%)`);

  // Verificar valor
  const diferencaValor = Math.abs(trans.valor - lanc.valor);
  const percentualDiferenca = diferencaValor / lanc.valor;

  if (percentualDiferenca === 0) {
    confidence += 30;
    motivos.push('Valor exato');
  } else if (percentualDiferenca < 0.05) {
    confidence += 20;
    motivos.push('Valor muito próximo');
  } else if (percentualDiferenca < 0.10) {
    confidence += 10;
    motivos.push('Valor próximo');
  }

  // Verificar fornecedor/cliente na descrição
  if (lanc.fornecedorCliente) {
    const fornecedorLimpo = limparTexto(lanc.fornecedorCliente);
    if (trans.descricaoLimpa.includes(fornecedorLimpo)) {
      confidence += 10;
      motivos.push('Fornecedor/Cliente encontrado na descrição');
    }
  }

  if (confidence >= 50) {
    return {
      transacaoId: trans.id,
      lancamentoId: lanc.id,
      confidence: Math.min(confidence, 100),
      tipo: confidence >= 80 ? 'automatica' : 'sugerida',
      motivos,
      diferencas: {
        valor: diferencaValor,
      },
    };
  }

  return null;
}

/**
 * Verifica se os tipos são compatíveis
 */
function tiposCompativeis(tipoTransacao: string, tipoLancamento: string): boolean {
  if (tipoTransacao === 'entrada' && tipoLancamento === 'receber') return true;
  if (tipoTransacao === 'saida' && tipoLancamento === 'pagar') return true;
  return false;
}

/**
 * Calcula similaridade entre duas strings (0-1)
 */
function calcularSimilaridade(str1: string, str2: string): number {
  const s1 = limparTexto(str1);
  const s2 = limparTexto(str2);

  if (s1 === s2) return 1;

  // Dividir em palavras
  const palavras1 = new Set(s1.split(/\s+/).filter(p => p.length > 2));
  const palavras2 = new Set(s2.split(/\s+/).filter(p => p.length > 2));

  if (palavras1.size === 0 || palavras2.size === 0) return 0;

  // Contar palavras em comum
  let matches = 0;
  palavras1.forEach(palavra => {
    if (palavras2.has(palavra)) {
      matches++;
    }
  });

  const total = Math.max(palavras1.size, palavras2.size);
  return matches / total;
}

/**
 * Limpa e normaliza texto
 */
function limparTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, ' ') // Remove caracteres especiais
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
}

/**
 * Indexa itens por valor para busca rápida
 */
function indexarPorValor<T extends { id: number; valor: number }>(itens: T[]): Map<number, T[]> {
  const indice = new Map<number, T[]>();

  for (const item of itens) {
    const valorKey = Math.round(item.valor * 100);
    
    if (!indice.has(valorKey)) {
      indice.set(valorKey, []);
    }
    
    indice.get(valorKey)!.push(item);
  }

  return indice;
}
