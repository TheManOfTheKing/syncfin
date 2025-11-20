/**
 * Parser para arquivos CNAB 240
 * Padrão FEBRABAN para conciliação bancária
 */

export interface CNAB240Lancamento {
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
  status: 'aberto' | 'pago' | 'cancelado';
  dadosOriginais: any;
}

export interface CNAB240Result {
  bancoCodigo: string;
  agencia: string;
  conta: string;
  dataInicio?: Date;
  dataFim?: Date;
  lancamentos: CNAB240Lancamento[];
  erros: string[];
}

/**
 * Parse de arquivo CNAB 240
 */
export function parseCNAB240(conteudo: string): CNAB240Result {
  const linhas = conteudo.split('\n').filter(l => l.trim().length > 0);
  
  const resultado: CNAB240Result = {
    bancoCodigo: '',
    agencia: '',
    conta: '',
    lancamentos: [],
    erros: [],
  };

  try {
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      
      // Cada linha deve ter 240 caracteres
      if (linha.length !== 240) {
        resultado.erros.push(`Linha ${i + 1}: tamanho inválido (${linha.length} caracteres)`);
        continue;
      }

      // Identificar tipo de registro
      const tipoRegistro = linha.substring(7, 8);
      
      if (tipoRegistro === '0') {
        // Header de arquivo
        resultado.bancoCodigo = linha.substring(0, 3);
      } else if (tipoRegistro === '1') {
        // Header de lote
        const agencia = linha.substring(53, 58).trim();
        const conta = linha.substring(59, 71).trim();
        
        if (!resultado.agencia) resultado.agencia = agencia;
        if (!resultado.conta) resultado.conta = conta;
      } else if (tipoRegistro === '3') {
        // Segmento - Detalhes do lançamento
        const segmento = linha.substring(13, 14);
        
        if (segmento === 'A' || segmento === 'J') {
          // Segmento A (Pagamentos) ou J (Boletos)
          const lancamento = parseSegmentoDetalhe(linha, segmento);
          if (lancamento) {
            resultado.lancamentos.push(lancamento);
          }
        }
      }
    }
  } catch (error: any) {
    resultado.erros.push(`Erro ao processar CNAB 240: ${error.message}`);
  }

  return resultado;
}

/**
 * Parse de segmento de detalhe (A ou J)
 */
function parseSegmentoDetalhe(linha: string, segmento: string): CNAB240Lancamento | null {
  try {
    const lancamento: CNAB240Lancamento = {
      tipo: 'pagar', // Default, será ajustado
      dataVencimento: new Date(),
      descricao: '',
      valor: 0,
      status: 'aberto',
      dadosOriginais: { linha, segmento },
    };

    if (segmento === 'A') {
      // Segmento A - Pagamentos
      const dataVencimento = linha.substring(93, 101);
      const valorPagamento = linha.substring(119, 134);
      const numeroDocumento = linha.substring(73, 93).trim();
      
      lancamento.dataVencimento = parseCNABDate(dataVencimento);
      lancamento.valor = parseFloat(valorPagamento) / 100;
      lancamento.numeroDocumento = numeroDocumento || undefined;
      lancamento.descricao = `Pagamento - Doc ${numeroDocumento}`;
      lancamento.tipo = 'pagar';
    } else if (segmento === 'J') {
      // Segmento J - Boletos
      const codigoBarras = linha.substring(23, 67).trim();
      const nossoNumero = linha.substring(73, 93).trim();
      const dataVencimento = linha.substring(93, 101);
      const valorTitulo = linha.substring(101, 116);
      
      lancamento.dataVencimento = parseCNABDate(dataVencimento);
      lancamento.valor = parseFloat(valorTitulo) / 100;
      lancamento.codigoBarras = codigoBarras || undefined;
      lancamento.nossoNumero = nossoNumero || undefined;
      lancamento.descricao = `Boleto - ${nossoNumero}`;
      lancamento.tipo = 'receber';
    }

    return lancamento;
  } catch (error) {
    return null;
  }
}

/**
 * Converte data no formato CNAB (DDMMAAAA) para Date
 */
function parseCNABDate(dateStr: string): Date {
  if (!dateStr || dateStr === '00000000') {
    return new Date();
  }

  const day = parseInt(dateStr.substring(0, 2));
  const month = parseInt(dateStr.substring(2, 4)) - 1;
  const year = parseInt(dateStr.substring(4, 8));

  return new Date(year, month, day);
}

/**
 * Valida se o conteúdo é um arquivo CNAB 240 válido
 */
export function isValidCNAB240(conteudo: string): boolean {
  const linhas = conteudo.split('\n').filter(l => l.trim().length > 0);
  
  if (linhas.length === 0) return false;
  
  // Primeira linha deve ter 240 caracteres
  if (linhas[0].length !== 240) return false;
  
  // Primeira linha deve ser header (tipo 0)
  const tipoRegistro = linhas[0].substring(7, 8);
  return tipoRegistro === '0';
}

/**
 * Gera arquivo CNAB 240 de retorno para o ERP
 */
export function gerarCNAB240Retorno(dados: {
  bancoCodigo: string;
  agencia: string;
  conta: string;
  empresa: string;
  lancamentos: Array<{
    nossoNumero: string;
    numeroDocumento: string;
    dataPagamento: Date;
    valorPago: number;
    status: 'pago' | 'cancelado';
  }>;
}): string {
  const linhas: string[] = [];
  
  // Header de arquivo (Registro 0)
  const headerArquivo = gerarHeaderArquivo(dados.bancoCodigo, dados.empresa);
  linhas.push(headerArquivo);
  
  // Header de lote (Registro 1)
  const headerLote = gerarHeaderLote(dados.bancoCodigo, dados.agencia, dados.conta);
  linhas.push(headerLote);
  
  // Detalhes (Registro 3)
  dados.lancamentos.forEach((lanc, index) => {
    const detalhe = gerarDetalheRetorno(lanc, index + 1);
    linhas.push(detalhe);
  });
  
  // Trailer de lote (Registro 5)
  const trailerLote = gerarTrailerLote(dados.lancamentos.length);
  linhas.push(trailerLote);
  
  // Trailer de arquivo (Registro 9)
  const trailerArquivo = gerarTrailerArquivo(linhas.length + 1);
  linhas.push(trailerArquivo);
  
  return linhas.join('\n');
}

function gerarHeaderArquivo(bancoCodigo: string, empresa: string): string {
  let linha = '';
  linha += bancoCodigo.padStart(3, '0'); // Código do banco
  linha += '0000'; // Lote de serviço
  linha += '0'; // Tipo de registro
  linha += ' '.repeat(9); // Uso FEBRABAN
  linha += '2'; // Tipo de inscrição (2=CNPJ)
  linha += ' '.repeat(14); // Número de inscrição
  linha += ' '.repeat(20); // Convênio
  linha += empresa.substring(0, 30).padEnd(30, ' '); // Nome da empresa
  linha += ' '.repeat(30); // Nome do banco
  linha += ' '.repeat(10); // Uso FEBRABAN
  linha += '1'; // Código remessa/retorno (2=retorno)
  linha += formatDate(new Date()); // Data de geração
  linha += formatTime(new Date()); // Hora de geração
  linha += '000001'; // Número sequencial do arquivo
  linha += '103'; // Versão do layout
  linha += '00000'; // Densidade de gravação
  linha += ' '.repeat(20); // Reservado banco
  linha += ' '.repeat(20); // Reservado empresa
  linha += ' '.repeat(29); // Uso FEBRABAN
  
  return linha.substring(0, 240).padEnd(240, ' ');
}

function gerarHeaderLote(bancoCodigo: string, agencia: string, conta: string): string {
  let linha = '';
  linha += bancoCodigo.padStart(3, '0');
  linha += '0001'; // Lote de serviço
  linha += '1'; // Tipo de registro
  linha += 'C'; // Tipo de operação (C=Crédito)
  linha += '20'; // Tipo de serviço (20=Pagamento)
  linha += '01'; // Forma de lançamento
  linha += '045'; // Versão do layout do lote
  linha += ' '; // Uso FEBRABAN
  linha += '2'; // Tipo de inscrição
  linha += ' '.repeat(15); // Número de inscrição
  linha += ' '.repeat(20); // Convênio
  linha += agencia.padStart(5, '0'); // Agência
  linha += ' '; // DV agência
  linha += conta.padStart(12, '0'); // Conta
  linha += ' '; // DV conta
  linha += ' '; // DV ag/conta
  linha += ' '.repeat(30); // Nome da empresa
  linha += ' '.repeat(40); // Mensagem 1
  linha += ' '.repeat(40); // Mensagem 2
  linha += '00000001'; // Número sequencial
  linha += formatDate(new Date()); // Data de gravação
  linha += '00000000'; // Data do crédito
  linha += ' '.repeat(33); // Uso FEBRABAN
  
  return linha.substring(0, 240).padEnd(240, ' ');
}

function gerarDetalheRetorno(lancamento: any, sequencial: number): string {
  let linha = '';
  linha += '001'; // Código do banco
  linha += '0001'; // Lote de serviço
  linha += '3'; // Tipo de registro
  linha += sequencial.toString().padStart(5, '0'); // Número sequencial
  linha += 'A'; // Segmento
  linha += ' '; // Tipo de movimento
  linha += '00'; // Código de movimento
  linha += ' '.repeat(3); // Câmara de compensação
  linha += '001'; // Banco favorecido
  linha += ' '.repeat(20); // Agência/conta favorecido
  linha += lancamento.numeroDocumento.padEnd(20, ' '); // Número do documento
  linha += formatDate(lancamento.dataPagamento); // Data do pagamento
  linha += 'BRL'; // Tipo de moeda
  linha += ' '.repeat(15); // Quantidade de moeda
  linha += lancamento.valorPago.toFixed(2).replace('.', '').padStart(15, '0'); // Valor do pagamento
  linha += ' '.repeat(20); // Número do documento atribuído pelo banco
  linha += '00000000'; // Data real da efetivação
  linha += ' '.repeat(15); // Valor real da efetivação
  linha += ' '.repeat(40); // Outras informações
  linha += ' '.repeat(2); // Código de ocorrência
  linha += ' '.repeat(10); // Uso FEBRABAN
  
  return linha.substring(0, 240).padEnd(240, ' ');
}

function gerarTrailerLote(qtdRegistros: number): string {
  let linha = '';
  linha += '001'; // Código do banco
  linha += '0001'; // Lote de serviço
  linha += '5'; // Tipo de registro
  linha += ' '.repeat(9); // Uso FEBRABAN
  linha += (qtdRegistros + 2).toString().padStart(6, '0'); // Quantidade de registros
  linha += ' '.repeat(217); // Uso FEBRABAN
  
  return linha.substring(0, 240).padEnd(240, ' ');
}

function gerarTrailerArquivo(qtdLinhas: number): string {
  let linha = '';
  linha += '001'; // Código do banco
  linha += '9999'; // Lote de serviço
  linha += '9'; // Tipo de registro
  linha += ' '.repeat(9); // Uso FEBRABAN
  linha += '000001'; // Quantidade de lotes
  linha += qtdLinhas.toString().padStart(6, '0'); // Quantidade de registros
  linha += ' '.repeat(6); // Quantidade de contas
  linha += ' '.repeat(205); // Uso FEBRABAN
  
  return linha.substring(0, 240).padEnd(240, ' ');
}

function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  return day + month + year;
}

function formatTime(date: Date): string {
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');
  return hour + minute + second;
}
