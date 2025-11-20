/**
 * Parser para arquivos CNAB 400
 * Padrão legado ainda muito utilizado
 */

export interface CNAB400Lancamento {
  tipo: 'pagar' | 'receber';
  dataVencimento: Date;
  dataEmissao?: Date;
  dataPagamento?: Date;
  descricao: string;
  numeroDocumento?: string;
  nossoNumero?: string;
  fornecedorCliente?: string;
  valor: number;
  valorPago?: number;
  status: 'aberto' | 'pago' | 'cancelado';
  dadosOriginais: any;
}

export interface CNAB400Result {
  bancoCodigo: string;
  agencia: string;
  conta: string;
  lancamentos: CNAB400Lancamento[];
  erros: string[];
}

/**
 * Parse de arquivo CNAB 400
 */
export function parseCNAB400(conteudo: string): CNAB400Result {
  const linhas = conteudo.split('\n').filter(l => l.trim().length > 0);
  
  const resultado: CNAB400Result = {
    bancoCodigo: '',
    agencia: '',
    conta: '',
    lancamentos: [],
    erros: [],
  };

  try {
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      
      // Cada linha deve ter 400 caracteres
      if (linha.length !== 400) {
        resultado.erros.push(`Linha ${i + 1}: tamanho inválido (${linha.length} caracteres)`);
        continue;
      }

      // Identificar tipo de registro
      const tipoRegistro = linha.substring(0, 1);
      
      if (tipoRegistro === '0') {
        // Header
        resultado.bancoCodigo = linha.substring(76, 79);
      } else if (tipoRegistro === '1') {
        // Detalhe
        const lancamento = parseDetalhe400(linha);
        if (lancamento) {
          resultado.lancamentos.push(lancamento);
          
          // Extrair agência e conta do primeiro detalhe
          if (!resultado.agencia) {
            resultado.agencia = linha.substring(17, 21).trim();
            resultado.conta = linha.substring(23, 30).trim();
          }
        }
      }
    }
  } catch (error: any) {
    resultado.erros.push(`Erro ao processar CNAB 400: ${error.message}`);
  }

  return resultado;
}

/**
 * Parse de registro de detalhe
 */
function parseDetalhe400(linha: string): CNAB400Lancamento | null {
  try {
    const lancamento: CNAB400Lancamento = {
      tipo: 'receber',
      dataVencimento: new Date(),
      descricao: '',
      valor: 0,
      status: 'aberto',
      dadosOriginais: { linha },
    };

    // Nosso número
    const nossoNumero = linha.substring(62, 70).trim();
    lancamento.nossoNumero = nossoNumero || undefined;

    // Número do documento
    const numeroDocumento = linha.substring(116, 126).trim();
    lancamento.numeroDocumento = numeroDocumento || undefined;

    // Data de vencimento
    const dataVencimento = linha.substring(120, 126);
    lancamento.dataVencimento = parseCNAB400Date(dataVencimento);

    // Valor do título
    const valorTitulo = linha.substring(126, 139);
    lancamento.valor = parseFloat(valorTitulo) / 100;

    // Descrição
    lancamento.descricao = `Título ${nossoNumero || numeroDocumento}`;

    // Código de ocorrência (para determinar status)
    const codigoOcorrencia = linha.substring(108, 110);
    if (codigoOcorrencia === '06' || codigoOcorrencia === '17') {
      lancamento.status = 'pago';
      
      // Data de pagamento
      const dataPagamento = linha.substring(110, 116);
      if (dataPagamento !== '000000') {
        lancamento.dataPagamento = parseCNAB400Date(dataPagamento);
      }
      
      // Valor pago
      const valorPago = linha.substring(253, 266);
      lancamento.valorPago = parseFloat(valorPago) / 100;
    }

    return lancamento;
  } catch (error) {
    return null;
  }
}

/**
 * Converte data no formato CNAB 400 (DDMMAA) para Date
 */
function parseCNAB400Date(dateStr: string): Date {
  if (!dateStr || dateStr === '000000') {
    return new Date();
  }

  const day = parseInt(dateStr.substring(0, 2));
  const month = parseInt(dateStr.substring(2, 4)) - 1;
  let year = parseInt(dateStr.substring(4, 6));
  
  // Ajustar ano (assumir 20xx para anos < 50, 19xx para >= 50)
  year = year < 50 ? 2000 + year : 1900 + year;

  return new Date(year, month, day);
}

/**
 * Valida se o conteúdo é um arquivo CNAB 400 válido
 */
export function isValidCNAB400(conteudo: string): boolean {
  const linhas = conteudo.split('\n').filter(l => l.trim().length > 0);
  
  if (linhas.length === 0) return false;
  
  // Primeira linha deve ter 400 caracteres
  if (linhas[0].length !== 400) return false;
  
  // Primeira linha deve ser header (tipo 0)
  const tipoRegistro = linhas[0].substring(0, 1);
  return tipoRegistro === '0';
}

/**
 * Gera arquivo CNAB 400 de retorno para o ERP
 */
export function gerarCNAB400Retorno(dados: {
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
  
  // Header (Registro 0)
  const header = gerarHeader400(dados.bancoCodigo, dados.empresa, dados.agencia, dados.conta);
  linhas.push(header);
  
  // Detalhes (Registro 1)
  dados.lancamentos.forEach((lanc, index) => {
    const detalhe = gerarDetalhe400(lanc, index + 1);
    linhas.push(detalhe);
  });
  
  // Trailer (Registro 9)
  const trailer = gerarTrailer400(dados.lancamentos.length);
  linhas.push(trailer);
  
  return linhas.join('\n');
}

function gerarHeader400(bancoCodigo: string, empresa: string, agencia: string, conta: string): string {
  let linha = '';
  linha += '0'; // Tipo de registro
  linha += '1'; // Tipo de operação (1=Retorno)
  linha += 'RETORNO'.padEnd(7, ' '); // Literal RETORNO
  linha += '2'; // Tipo de serviço
  linha += 'COBRANCA'.padEnd(15, ' '); // Literal COBRANCA
  linha += agencia.padStart(4, '0'); // Agência
  linha += '00'; // Zeros
  linha += conta.padStart(8, '0'); // Conta
  linha += '0'; // DV conta
  linha += ' '.repeat(8); // Brancos
  linha += empresa.substring(0, 30).padEnd(30, ' '); // Nome da empresa
  linha += bancoCodigo.padStart(3, '0'); // Código do banco
  linha += 'BANCO'.padEnd(15, ' '); // Nome do banco
  linha += formatDate400(new Date()); // Data de geração
  linha += ' '.repeat(8); // Brancos
  linha += '01600'; // Identificação do sistema
  linha += '00001'; // Número sequencial do arquivo
  linha += ' '.repeat(277); // Brancos
  linha += '000001'; // Número sequencial do registro
  
  return linha.substring(0, 400).padEnd(400, ' ');
}

function gerarDetalhe400(lancamento: any, sequencial: number): string {
  let linha = '';
  linha += '1'; // Tipo de registro
  linha += ' '.repeat(16); // Brancos
  linha += ' '.repeat(4); // Agência
  linha += '00'; // Zeros
  linha += ' '.repeat(8); // Conta
  linha += '0'; // DV conta
  linha += ' '.repeat(25); // Uso da empresa
  linha += lancamento.nossoNumero.padStart(8, '0'); // Nosso número
  linha += ' '.repeat(13); // Brancos
  linha += '000'; // Carteira
  linha += '06'; // Código de ocorrência (06=Liquidação)
  linha += formatDate400(new Date()); // Data de ocorrência
  linha += lancamento.numeroDocumento.padEnd(10, ' '); // Número do documento
  linha += ' '.repeat(8); // Nosso número (repetido)
  linha += formatDate400(lancamento.dataPagamento); // Data de vencimento
  linha += lancamento.valorPago.toFixed(2).replace('.', '').padStart(13, '0'); // Valor do título
  linha += '001'; // Código do banco
  linha += '00000'; // Agência cobradora
  linha += '00'; // DV agência
  linha += '00'; // Espécie do título
  linha += formatDate400(lancamento.dataPagamento); // Data de crédito
  linha += '0000'; // Valor da tarifa
  linha += ' '.repeat(26); // Outras despesas
  linha += '0000000000000'; // Juros de mora
  linha += '0000000000000'; // Desconto concedido
  linha += lancamento.valorPago.toFixed(2).replace('.', '').padStart(13, '0'); // Valor pago
  linha += '0000000000000'; // Juros de mora
  linha += '0000000000000'; // Outros créditos
  linha += ' '; // Branco
  linha += ' '.repeat(6); // Motivo das rejeições
  linha += ' '.repeat(110); // Uso do banco
  linha += (sequencial + 1).toString().padStart(6, '0'); // Número sequencial
  
  return linha.substring(0, 400).padEnd(400, ' ');
}

function gerarTrailer400(qtdRegistros: number): string {
  let linha = '';
  linha += '9'; // Tipo de registro
  linha += ' '.repeat(393); // Brancos
  linha += (qtdRegistros + 2).toString().padStart(6, '0'); // Número sequencial
  
  return linha.substring(0, 400).padEnd(400, ' ');
}

function formatDate400(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().substring(2, 4);
  return day + month + year;
}
