import XLSX from 'xlsx';
import Papa from 'papaparse';
import crypto from 'crypto';

export interface TransacaoImportada {
  data: Date;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  saldo?: number;
  identificador?: string;
}

export interface ResultadoImportacao {
  sucesso: boolean;
  transacoes: TransacaoImportada[];
  erros: string[];
  colunas: string[];
  preview: any[];
  dadosCompletos: any[];
  totalLinhas: number;
}

/**
 * Processa arquivo CSV
 */
export function processarCSV(conteudo: string): ResultadoImportacao {
  const resultado: ResultadoImportacao = {
    sucesso: false,
    transacoes: [],
    erros: [],
    colunas: [],
    preview: [],
    dadosCompletos: [],
    totalLinhas: 0,
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
      transformHeader: (header) => header.trim(),
    });

    if (parsed.errors.length > 0) {
      resultado.erros = parsed.errors.map(e => e.message);
    }

    if (parsed.data.length === 0) {
      resultado.erros.push('Nenhum dado encontrado no arquivo');
      return resultado;
    }

    // Extrair colunas
    resultado.colunas = parsed.meta.fields || [];
    
    // Preview (primeiras 5 linhas)
    resultado.preview = parsed.data.slice(0, 5);
    
    // Dados completos
    resultado.dadosCompletos = parsed.data;
    resultado.totalLinhas = parsed.data.length;

    resultado.sucesso = true;
  } catch (error: any) {
    resultado.erros.push(`Erro ao processar CSV: ${error.message}`);
  }

  return resultado;
}

/**
 * Processa arquivo XLSX
 */
export function processarXLSX(buffer: Buffer): ResultadoImportacao {
  const resultado: ResultadoImportacao = {
    sucesso: false,
    transacoes: [],
    erros: [],
    colunas: [],
    preview: [],
    dadosCompletos: [],
    totalLinhas: 0,
  };

  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

    if (data.length === 0) {
      resultado.erros.push('Nenhum dado encontrado no arquivo');
      return resultado;
    }

    // Primeira linha como cabeçalho
    const headers = data[0] as string[];
    resultado.colunas = headers.map(h => String(h).trim());

    // Converter para objetos
    const rows = data.slice(1).map((row: any) => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[String(header).trim()] = row[index];
      });
      return obj;
    });

    resultado.preview = rows.slice(0, 5);
    resultado.dadosCompletos = rows;
    resultado.totalLinhas = rows.length;
    resultado.sucesso = true;
  } catch (error: any) {
    resultado.erros.push(`Erro ao processar XLSX: ${error.message}`);
  }

  return resultado;
}

/**
 * Gera hash único para transação (evitar duplicatas)
 */
export function gerarHashTransacao(
  empresaId: number,
  data: Date,
  descricao: string,
  valor: number
): string {
  const conteudo = `${empresaId}-${data.toISOString()}-${descricao}-${valor}`;
  return crypto.createHash('sha256').update(conteudo).digest('hex');
}

/**
 * Limpa descrição da transação
 */
export function limparDescricao(descricao: string): string {
  return descricao
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s-]/gi, '')
    .toLowerCase();
}

/**
 * Mapeia dados importados para transações
 */
export function mapearTransacoes(
  dados: any[],
  mapeamento: {
    data: string;
    descricao: string;
    valor: string;
    tipo?: string;
    saldo?: string;
  },
  empresaId: number
): TransacaoImportada[] {
  return dados.map(linha => {
    const dataStr = linha[mapeamento.data];
    const descricao = String(linha[mapeamento.descricao] || '');
    const valorStr = String(linha[mapeamento.valor] || '0');
    const tipoStr = mapeamento.tipo ? String(linha[mapeamento.tipo] || '') : '';
    const saldoStr = mapeamento.saldo ? String(linha[mapeamento.saldo] || '') : '';

    // Parse data
    const data = new Date(dataStr);

    // Parse valor
    const valor = parseFloat(valorStr.replace(/[^\d,-]/g, '').replace(',', '.'));

    // Determinar tipo
    let tipo: 'entrada' | 'saida' = 'entrada';
    if (tipoStr) {
      tipo = tipoStr.toLowerCase().includes('saida') || tipoStr.toLowerCase().includes('debito') 
        ? 'saida' 
        : 'entrada';
    } else if (valor < 0) {
      tipo = 'saida';
    }

    // Parse saldo
    const saldo = saldoStr ? parseFloat(saldoStr.replace(/[^\d,-]/g, '').replace(',', '.')) : undefined;

    return {
      data,
      descricao,
      valor: Math.abs(valor),
      tipo,
      saldo,
      identificador: gerarHashTransacao(empresaId, data, descricao, valor),
    };
  });
}
