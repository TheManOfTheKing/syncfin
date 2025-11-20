/**
 * Parser para arquivos OFX (Open Financial Exchange)
 * Formato padrão para extratos bancários
 */

export interface OFXTransaction {
  tipo: 'DEBIT' | 'CREDIT' | 'OTHER';
  data: Date;
  valor: number;
  fitid: string; // ID único da transação
  checknum?: string;
  refnum?: string;
  memo?: string;
  name?: string;
}

export interface OFXStatement {
  bankId: string;
  accountId: string;
  accountType: string;
  dataInicio: Date;
  dataFim: Date;
  saldoInicial?: number;
  saldoFinal?: number;
  transacoes: OFXTransaction[];
}

/**
 * Parse de arquivo OFX
 */
export function parseOFX(conteudo: string): OFXStatement {
  const resultado: OFXStatement = {
    bankId: '',
    accountId: '',
    accountType: '',
    dataInicio: new Date(),
    dataFim: new Date(),
    transacoes: [],
  };

  try {
    // Extrair informações da conta
    const bankIdMatch = conteudo.match(/<BANKID>(.*?)<\/BANKID>/i);
    const acctIdMatch = conteudo.match(/<ACCTID>(.*?)<\/ACCTID>/i);
    const acctTypeMatch = conteudo.match(/<ACCTTYPE>(.*?)<\/ACCTTYPE>/i);
    
    if (bankIdMatch) resultado.bankId = bankIdMatch[1].trim();
    if (acctIdMatch) resultado.accountId = acctIdMatch[1].trim();
    if (acctTypeMatch) resultado.accountType = acctTypeMatch[1].trim();

    // Extrair datas do extrato
    const dtStartMatch = conteudo.match(/<DTSTART>(.*?)<\/DTSTART>/i);
    const dtEndMatch = conteudo.match(/<DTEND>(.*?)<\/DTEND>/i);
    
    if (dtStartMatch) resultado.dataInicio = parseOFXDate(dtStartMatch[1]);
    if (dtEndMatch) resultado.dataFim = parseOFXDate(dtEndMatch[1]);

    // Extrair saldos
    const balAmtMatch = conteudo.match(/<BALAMT>(.*?)<\/BALAMT>/i);
    if (balAmtMatch) resultado.saldoFinal = parseFloat(balAmtMatch[1]);

    // Extrair transações
    const stmtTrnRegex = /<STMTTRN>(.*?)<\/STMTTRN>/gis;
    let match;

    while ((match = stmtTrnRegex.exec(conteudo)) !== null) {
      const trnContent = match[1];
      
      const trnTypeMatch = trnContent.match(/<TRNTYPE>(.*?)<\/TRNTYPE>/i);
      const dtPostedMatch = trnContent.match(/<DTPOSTED>(.*?)<\/DTPOSTED>/i);
      const trnAmtMatch = trnContent.match(/<TRNAMT>(.*?)<\/TRNAMT>/i);
      const fitIdMatch = trnContent.match(/<FITID>(.*?)<\/FITID>/i);
      const checkNumMatch = trnContent.match(/<CHECKNUM>(.*?)<\/CHECKNUM>/i);
      const refNumMatch = trnContent.match(/<REFNUM>(.*?)<\/REFNUM>/i);
      const memoMatch = trnContent.match(/<MEMO>(.*?)<\/MEMO>/i);
      const nameMatch = trnContent.match(/<NAME>(.*?)<\/NAME>/i);

      if (dtPostedMatch && trnAmtMatch && fitIdMatch) {
        const valor = parseFloat(trnAmtMatch[1]);
        
        resultado.transacoes.push({
          tipo: trnTypeMatch ? (trnTypeMatch[1] as any) : (valor < 0 ? 'DEBIT' : 'CREDIT'),
          data: parseOFXDate(dtPostedMatch[1]),
          valor: Math.abs(valor),
          fitid: fitIdMatch[1].trim(),
          checknum: checkNumMatch ? checkNumMatch[1].trim() : undefined,
          refnum: refNumMatch ? refNumMatch[1].trim() : undefined,
          memo: memoMatch ? memoMatch[1].trim() : undefined,
          name: nameMatch ? nameMatch[1].trim() : undefined,
        });
      }
    }

  } catch (error: any) {
    throw new Error(`Erro ao processar arquivo OFX: ${error.message}`);
  }

  return resultado;
}

/**
 * Converte data no formato OFX (YYYYMMDDHHMMSS) para Date
 */
function parseOFXDate(dateStr: string): Date {
  // Remove timezone se houver
  const cleanDate = dateStr.split('[')[0].trim();
  
  const year = parseInt(cleanDate.substring(0, 4));
  const month = parseInt(cleanDate.substring(4, 6)) - 1; // Mês começa em 0
  const day = parseInt(cleanDate.substring(6, 8));
  
  let hour = 0, minute = 0, second = 0;
  
  if (cleanDate.length >= 10) {
    hour = parseInt(cleanDate.substring(8, 10));
  }
  if (cleanDate.length >= 12) {
    minute = parseInt(cleanDate.substring(10, 12));
  }
  if (cleanDate.length >= 14) {
    second = parseInt(cleanDate.substring(12, 14));
  }

  return new Date(year, month, day, hour, minute, second);
}

/**
 * Valida se o conteúdo é um arquivo OFX válido
 */
export function isValidOFX(conteudo: string): boolean {
  return conteudo.includes('<OFX>') || conteudo.includes('OFXHEADER');
}
