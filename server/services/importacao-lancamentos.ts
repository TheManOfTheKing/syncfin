/**
 * Serviço de importação de lançamentos contábeis do ERP
 */

import { parseCNAB240, isValidCNAB240, CNAB240Lancamento } from './parsers/cnab240-parser.js';
import { parseCNAB400, isValidCNAB400, CNAB400Lancamento } from './parsers/cnab400-parser.js';

export interface ResultadoImportacaoLancamentos {
  sucesso: boolean;
  formato: 'cnab240' | 'cnab400' | 'csv' | 'xlsx' | 'desconhecido';
  lancamentos: LancamentoImportado[];
  erros: string[];
  totalLinhas: number;
  preview: any[];
}

export interface LancamentoImportado {
  tipo: 'pagar' | 'receber';
  dataVencimento: Date;
  dataEmissao?: Date;
  dataPagamento?: Date;
  descricao: string;
  numeroDocumento?: string;
  nossoNumero?: string;
  codigoBarras?: string;
  fornecedorCliente?: string;
  documentoFornecedorCliente?: string;
  valor: number;
  valorPago?: number;
  status: 'aberto' | 'parcialmente_conciliado' | 'conciliado' | 'cancelado';
  dadosOriginais?: any;
}

/**
 * Processa arquivo de lançamentos contábeis
 */
export function processarArquivoLancamentos(
  conteudo: string | Buffer,
  nomeArquivo: string
): ResultadoImportacaoLancamentos {
  const resultado: ResultadoImportacaoLancamentos = {
    sucesso: false,
    formato: 'desconhecido',
    lancamentos: [],
    erros: [],
    totalLinhas: 0,
    preview: [],
  };

  try {
    const conteudoStr = Buffer.isBuffer(conteudo) ? conteudo.toString('utf-8') : conteudo;

    // Detectar formato do arquivo
    if (isValidCNAB240(conteudoStr)) {
      resultado.formato = 'cnab240';
      const parsed = parseCNAB240(conteudoStr);
      
      resultado.lancamentos = parsed.lancamentos.map(mapearLancamentoCNAB240);
      resultado.erros = parsed.erros;
      resultado.totalLinhas = parsed.lancamentos.length;
      resultado.preview = parsed.lancamentos.slice(0, 5);
      resultado.sucesso = parsed.erros.length === 0;
      
    } else if (isValidCNAB400(conteudoStr)) {
      resultado.formato = 'cnab400';
      const parsed = parseCNAB400(conteudoStr);
      
      resultado.lancamentos = parsed.lancamentos.map(mapearLancamentoCNAB400);
      resultado.erros = parsed.erros;
      resultado.totalLinhas = parsed.lancamentos.length;
      resultado.preview = parsed.lancamentos.slice(0, 5);
      resultado.sucesso = parsed.erros.length === 0;
      
    } else if (nomeArquivo.endsWith('.csv')) {
      // Processar CSV genérico
      resultado.formato = 'csv';
      const csvResult = processarCSVLancamentos(conteudoStr);
      Object.assign(resultado, csvResult);
      
    } else if (nomeArquivo.endsWith('.xlsx')) {
      resultado.formato = 'xlsx';
      resultado.erros.push('Formato XLSX ainda não implementado para lançamentos. Use CSV ou CNAB.');
      
    } else {
      resultado.erros.push('Formato de arquivo não reconhecido. Use CNAB 240, CNAB 400 ou CSV.');
    }

  } catch (error: any) {
    resultado.erros.push(`Erro ao processar arquivo: ${error.message}`);
  }

  return resultado;
}

/**
 * Mapeia lançamento CNAB 240 para formato interno
 */
function mapearLancamentoCNAB240(lanc: CNAB240Lancamento): LancamentoImportado {
  return {
    tipo: lanc.tipo,
    dataVencimento: lanc.dataVencimento,
    dataEmissao: lanc.dataEmissao,
    dataPagamento: lanc.dataPagamento,
    descricao: lanc.descricao,
    numeroDocumento: lanc.numeroDocumento,
    nossoNumero: lanc.nossoNumero,
    codigoBarras: lanc.codigoBarras,
    fornecedorCliente: lanc.fornecedorCliente,
    documentoFornecedorCliente: lanc.documentoFornecedorCliente,
    valor: lanc.valor,
    valorPago: lanc.valorPago,
    status: lanc.status === 'pago' ? 'aberto' : 'aberto', // Será 'aberto' até ser conciliado
    dadosOriginais: lanc.dadosOriginais,
  };
}

/**
 * Mapeia lançamento CNAB 400 para formato interno
 */
function mapearLancamentoCNAB400(lanc: CNAB400Lancamento): LancamentoImportado {
  return {
    tipo: lanc.tipo,
    dataVencimento: lanc.dataVencimento,
    dataEmissao: lanc.dataEmissao,
    dataPagamento: lanc.dataPagamento,
    descricao: lanc.descricao,
    numeroDocumento: lanc.numeroDocumento,
    nossoNumero: lanc.nossoNumero,
    fornecedorCliente: lanc.fornecedorCliente,
    valor: lanc.valor,
    valorPago: lanc.valorPago,
    status: 'aberto',
    dadosOriginais: lanc.dadosOriginais,
  };
}

/**
 * Processa CSV genérico de lançamentos
 */
function processarCSVLancamentos(conteudo: string): Partial<ResultadoImportacaoLancamentos> {
  const Papa = require('papaparse');
  
  const resultado: Partial<ResultadoImportacaoLancamentos> = {
    sucesso: false,
    lancamentos: [],
    erros: [],
  };

  try {
    // Detectar delimitador
    const delimitadores = [',', ';', '\t', '|'];
    let melhorDelimitador = ',';
    let maiorNumColunas = 0;

    for (const delim of delimitadores) {
      const teste = Papa.parse(conteudo, { delimiter: delim, preview: 1 });
      if (teste.data[0] && Array.isArray(teste.data[0])) {
        const numColunas = teste.data[0].length;
        if (numColunas > maiorNumColunas) {
          maiorNumColunas = numColunas;
          melhorDelimitador = delim;
        }
      }
    }

    // Parse completo
    const parsed = Papa.parse(conteudo, {
      delimiter: melhorDelimitador,
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toLowerCase(),
    });

    if (parsed.errors.length > 0) {
      resultado.erros = parsed.errors.map((e: any) => e.message);
    }

    if (parsed.data.length === 0) {
      resultado.erros?.push('Nenhum dado encontrado no arquivo CSV');
      return resultado;
    }

    // Mapear dados do CSV para lançamentos
    resultado.lancamentos = parsed.data.map((linha: any) => {
      const lancamento: LancamentoImportado = {
        tipo: detectarTipo(linha),
        dataVencimento: parseData(linha.data_vencimento || linha.vencimento || linha.data),
        descricao: linha.descricao || linha.historico || 'Sem descrição',
        valor: parseValor(linha.valor || linha.valor_titulo || '0'),
        status: 'aberto',
      };

      // Campos opcionais
      if (linha.data_emissao) lancamento.dataEmissao = parseData(linha.data_emissao);
      if (linha.data_pagamento) lancamento.dataPagamento = parseData(linha.data_pagamento);
      if (linha.numero_documento) lancamento.numeroDocumento = linha.numero_documento;
      if (linha.nosso_numero) lancamento.nossoNumero = linha.nosso_numero;
      if (linha.codigo_barras) lancamento.codigoBarras = linha.codigo_barras;
      if (linha.fornecedor || linha.cliente) {
        lancamento.fornecedorCliente = linha.fornecedor || linha.cliente;
      }
      if (linha.valor_pago) lancamento.valorPago = parseValor(linha.valor_pago);

      return lancamento;
    });

    resultado.totalLinhas = resultado.lancamentos.length;
    resultado.preview = parsed.data.slice(0, 5);
    resultado.sucesso = true;

  } catch (error: any) {
    resultado.erros?.push(`Erro ao processar CSV: ${error.message}`);
  }

  return resultado;
}

/**
 * Detecta o tipo do lançamento (pagar ou receber)
 */
function detectarTipo(linha: any): 'pagar' | 'receber' {
  const tipo = (linha.tipo || '').toLowerCase();
  
  if (tipo.includes('pagar') || tipo.includes('pagamento') || tipo.includes('despesa')) {
    return 'pagar';
  }
  
  if (tipo.includes('receber') || tipo.includes('receita') || tipo.includes('entrada')) {
    return 'receber';
  }
  
  // Se tiver fornecedor, provavelmente é pagar
  if (linha.fornecedor) return 'pagar';
  
  // Se tiver cliente, provavelmente é receber
  if (linha.cliente) return 'receber';
  
  // Default
  return 'receber';
}

/**
 * Parse de data em diversos formatos
 */
function parseData(dataStr: string): Date {
  if (!dataStr) return new Date();
  
  // Tentar formato ISO
  const isoDate = new Date(dataStr);
  if (!isNaN(isoDate.getTime())) return isoDate;
  
  // Tentar formato brasileiro DD/MM/YYYY
  const brMatch = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Tentar formato DD-MM-YYYY
  const dashMatch = dataStr.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (dashMatch) {
    const [, day, month, year] = dashMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  return new Date();
}

/**
 * Parse de valor monetário
 */
function parseValor(valorStr: string): number {
  if (!valorStr) return 0;
  
  // Remover símbolos de moeda e espaços
  let valor = valorStr.toString().replace(/[R$\s]/g, '');
  
  // Substituir vírgula por ponto
  valor = valor.replace(',', '.');
  
  return parseFloat(valor) || 0;
}
