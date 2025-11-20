/**
 * Serviço de exportação de resultados de conciliação
 * Gera arquivos de retorno para o ERP em formatos padrão
 */

import { gerarCNAB240Retorno } from './parsers/cnab240-parser.js';
import { gerarCNAB400Retorno } from './parsers/cnab400-parser.js';

export interface DadosConciliacao {
  lancamentoId: number;
  numeroDocumento: string;
  nossoNumero: string;
  dataPagamento: Date;
  valorPago: number;
  status: 'pago' | 'cancelado';
}

export interface DadosEmpresa {
  nome: string;
  documento: string;
  bancoCodigo: string;
  agencia: string;
  conta: string;
}

/**
 * Exporta resultado da conciliação em formato CNAB 240
 */
export function exportarCNAB240(
  empresa: DadosEmpresa,
  conciliacoes: DadosConciliacao[]
): string {
  const lancamentos = conciliacoes.map(c => ({
    nossoNumero: c.nossoNumero || '',
    numeroDocumento: c.numeroDocumento || '',
    dataPagamento: c.dataPagamento,
    valorPago: c.valorPago,
    status: c.status,
  }));

  return gerarCNAB240Retorno({
    bancoCodigo: empresa.bancoCodigo,
    agencia: empresa.agencia,
    conta: empresa.conta,
    empresa: empresa.nome,
    lancamentos,
  });
}

/**
 * Exporta resultado da conciliação em formato CNAB 400
 */
export function exportarCNAB400(
  empresa: DadosEmpresa,
  conciliacoes: DadosConciliacao[]
): string {
  const lancamentos = conciliacoes.map(c => ({
    nossoNumero: c.nossoNumero || '',
    numeroDocumento: c.numeroDocumento || '',
    dataPagamento: c.dataPagamento,
    valorPago: c.valorPago,
    status: c.status,
  }));

  return gerarCNAB400Retorno({
    bancoCodigo: empresa.bancoCodigo,
    agencia: empresa.agencia,
    conta: empresa.conta,
    empresa: empresa.nome,
    lancamentos,
  });
}

/**
 * Exporta resultado da conciliação em formato CSV
 */
export function exportarCSV(conciliacoes: DadosConciliacao[]): string {
  const linhas: string[] = [];
  
  // Cabeçalho
  linhas.push([
    'Lançamento ID',
    'Número Documento',
    'Nosso Número',
    'Data Pagamento',
    'Valor Pago',
    'Status',
  ].join(';'));

  // Dados
  for (const conc of conciliacoes) {
    linhas.push([
      conc.lancamentoId,
      conc.numeroDocumento || '',
      conc.nossoNumero || '',
      formatarData(conc.dataPagamento),
      formatarValor(conc.valorPago),
      conc.status === 'pago' ? 'PAGO' : 'CANCELADO',
    ].join(';'));
  }

  return linhas.join('\n');
}

/**
 * Exporta resultado da conciliação em formato JSON
 */
export function exportarJSON(
  empresa: DadosEmpresa,
  lote: any,
  conciliacoes: DadosConciliacao[]
): string {
  const resultado = {
    empresa: {
      nome: empresa.nome,
      documento: empresa.documento,
      banco: {
        codigo: empresa.bancoCodigo,
        agencia: empresa.agencia,
        conta: empresa.conta,
      },
    },
    lote: {
      id: lote.id,
      descricao: lote.descricao,
      dataInicio: lote.dataInicio,
      dataFim: lote.dataFim,
      totalConciliados: conciliacoes.length,
    },
    conciliacoes: conciliacoes.map(c => ({
      lancamentoId: c.lancamentoId,
      numeroDocumento: c.numeroDocumento,
      nossoNumero: c.nossoNumero,
      dataPagamento: c.dataPagamento,
      valorPago: c.valorPago,
      status: c.status,
    })),
    dataExportacao: new Date().toISOString(),
  };

  return JSON.stringify(resultado, null, 2);
}

/**
 * Exporta relatório detalhado da conciliação em formato texto
 */
export function exportarRelatorioTexto(
  empresa: DadosEmpresa,
  lote: any,
  conciliacoes: any[],
  divergencias: any[]
): string {
  const linhas: string[] = [];

  linhas.push('='.repeat(80));
  linhas.push('RELATÓRIO DE CONCILIAÇÃO BANCÁRIA');
  linhas.push('='.repeat(80));
  linhas.push('');
  
  linhas.push(`Empresa: ${empresa.nome}`);
  linhas.push(`CNPJ: ${empresa.documento}`);
  linhas.push(`Banco: ${empresa.bancoCodigo} - Agência: ${empresa.agencia} - Conta: ${empresa.conta}`);
  linhas.push('');
  
  linhas.push(`Período: ${formatarData(lote.dataInicio)} a ${formatarData(lote.dataFim)}`);
  linhas.push(`Data do Relatório: ${formatarDataHora(new Date())}`);
  linhas.push('');
  
  linhas.push('-'.repeat(80));
  linhas.push('RESUMO');
  linhas.push('-'.repeat(80));
  linhas.push(`Total de Transações Bancárias: ${lote.totalTransacoes}`);
  linhas.push(`Total de Lançamentos do ERP: ${lote.totalLancamentos}`);
  linhas.push(`Total Conciliado: ${lote.totalConciliados}`);
  linhas.push(`Total de Divergências: ${lote.totalDivergencias}`);
  linhas.push(`Taxa de Conciliação: ${parseFloat(lote.taxaConciliacao).toFixed(2)}%`);
  linhas.push('');

  if (conciliacoes.length > 0) {
    linhas.push('-'.repeat(80));
    linhas.push('LANÇAMENTOS CONCILIADOS');
    linhas.push('-'.repeat(80));
    linhas.push('');
    
    let totalConciliado = 0;
    
    for (const conc of conciliacoes) {
      linhas.push(`Lançamento #${conc.lancamentoId}`);
      linhas.push(`  Documento: ${conc.numeroDocumento || 'N/A'}`);
      linhas.push(`  Nosso Número: ${conc.nossoNumero || 'N/A'}`);
      linhas.push(`  Data Pagamento: ${formatarData(conc.dataPagamento)}`);
      linhas.push(`  Valor: R$ ${formatarValor(conc.valorPago)}`);
      linhas.push(`  Confiança: ${conc.confidence}%`);
      linhas.push(`  Tipo: ${conc.tipo === 'automatica' ? 'Automática' : 'Manual'}`);
      linhas.push('');
      
      totalConciliado += conc.valorPago;
    }
    
    linhas.push(`TOTAL CONCILIADO: R$ ${formatarValor(totalConciliado)}`);
    linhas.push('');
  }

  if (divergencias.length > 0) {
    linhas.push('-'.repeat(80));
    linhas.push('DIVERGÊNCIAS ENCONTRADAS');
    linhas.push('-'.repeat(80));
    linhas.push('');
    
    for (const div of divergencias) {
      linhas.push(`Tipo: ${traduzirTipoDivergencia(div.tipo)}`);
      linhas.push(`  Descrição: ${div.descricao}`);
      if (div.valorEsperado) {
        linhas.push(`  Valor Esperado: R$ ${formatarValor(parseFloat(div.valorEsperado))}`);
      }
      if (div.valorEncontrado) {
        linhas.push(`  Valor Encontrado: R$ ${formatarValor(parseFloat(div.valorEncontrado))}`);
      }
      linhas.push(`  Status: ${div.status === 'pendente' ? 'PENDENTE' : div.status.toUpperCase()}`);
      linhas.push('');
    }
  }

  linhas.push('='.repeat(80));
  linhas.push('FIM DO RELATÓRIO');
  linhas.push('='.repeat(80));

  return linhas.join('\n');
}

/**
 * Formata data no padrão brasileiro
 */
function formatarData(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data) : data;
  const dia = d.getDate().toString().padStart(2, '0');
  const mes = (d.getMonth() + 1).toString().padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata data e hora no padrão brasileiro
 */
function formatarDataHora(data: Date): string {
  const dataStr = formatarData(data);
  const hora = data.getHours().toString().padStart(2, '0');
  const minuto = data.getMinutes().toString().padStart(2, '0');
  return `${dataStr} ${hora}:${minuto}`;
}

/**
 * Formata valor monetário
 */
function formatarValor(valor: number): string {
  return valor.toFixed(2).replace('.', ',');
}

/**
 * Traduz tipo de divergência
 */
function traduzirTipoDivergencia(tipo: string): string {
  const traducoes: Record<string, string> = {
    'valor_diferente': 'Valor Diferente',
    'data_diferente': 'Data Diferente',
    'nao_encontrado_banco': 'Não Encontrado no Banco',
    'nao_encontrado_erp': 'Não Encontrado no ERP',
    'duplicado': 'Duplicado',
    'outro': 'Outro',
  };
  
  return traducoes[tipo] || tipo;
}
