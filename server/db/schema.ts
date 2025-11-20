import { mysqlTable, int, varchar, text, timestamp, datetime, mysqlEnum, boolean, index, unique, decimal, date } from 'drizzle-orm/mysql-core';

/**
 * Tabela de usuários (autenticação local)
 */
export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 180 }).notNull(),
  role: mysqlEnum('role', ['user', 'admin']).default('user').notNull(),
  ativo: boolean('ativo').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('idx_email').on(table.email),
  roleIdx: index('idx_role').on(table.role),
}));

/**
 * Tabela de empresas (multi-tenant)
 */
export const empresas = mysqlTable('empresas', {
  id: int('id').autoincrement().primaryKey(),
  nome: varchar('nome', { length: 180 }).notNull(),
  documento: varchar('documento', { length: 32 }).notNull().unique(),
  slug: varchar('slug', { length: 120 }),
  status: mysqlEnum('status', ['ativa', 'inativa', 'suspensa']).default('ativa').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  documentoIdx: index('idx_documento').on(table.documento),
  statusIdx: index('idx_status').on(table.status),
}));

/**
 * Relacionamento usuário-empresa (permissões)
 */
export const usuarioEmpresas = mysqlTable('usuario_empresas', {
  id: int('id').autoincrement().primaryKey(),
  usuarioId: int('usuarioId').notNull(),
  empresaId: int('empresaId').notNull(),
  perfil: mysqlEnum('perfil', ['admin', 'usuario', 'visualizador']).default('usuario').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  usuarioEmpresaUnique: unique('unique_usuario_empresa').on(table.usuarioId, table.empresaId),
  usuarioIdx: index('idx_usuario').on(table.usuarioId),
  empresaIdx: index('idx_empresa').on(table.empresaId),
}));

/**
 * Contas bancárias por empresa
 */
export const contasBancarias = mysqlTable('contas_bancarias', {
  id: int('id').autoincrement().primaryKey(),
  empresaId: int('empresaId').notNull(),
  nome: varchar('nome', { length: 120 }).notNull(),
  bancoCodigo: varchar('bancoCodigo', { length: 20 }),
  agencia: varchar('agencia', { length: 20 }),
  conta: varchar('conta', { length: 30 }),
  identificadorUnico: varchar('identificadorUnico', { length: 120 }),
  status: mysqlEnum('status', ['ativa', 'inativa']).default('ativa').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  empresaIdx: index('idx_empresa').on(table.empresaId),
  statusIdx: index('idx_status').on(table.status),
}));

/**
 * Categorias contábeis (plano de contas)
 */
export const categorias = mysqlTable('categorias', {
  id: int('id').autoincrement().primaryKey(),
  empresaId: int('empresaId').notNull(),
  nome: varchar('nome', { length: 120 }).notNull(),
  tipo: mysqlEnum('tipo', ['entrada', 'saida']).notNull(),
  codigo: varchar('codigo', { length: 40 }),
  descricao: text('descricao'),
  ativo: boolean('ativo').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  empresaIdx: index('idx_empresa').on(table.empresaId),
  tipoIdx: index('idx_tipo').on(table.tipo),
  ativoIdx: index('idx_ativo').on(table.ativo),
}));

/**
 * Transações bancárias importadas
 */
export const transacoes = mysqlTable('transacoes', {
  id: int('id').autoincrement().primaryKey(),
  empresaId: int('empresaId').notNull(),
  contaId: int('contaId'),
  dataOperacao: datetime('dataOperacao').notNull(),
  dataCompensacao: datetime('dataCompensacao'),
  descricaoOriginal: text('descricaoOriginal').notNull(),
  descricaoLimpa: text('descricaoLimpa').notNull(),
  tipo: mysqlEnum('tipo', ['entrada', 'saida']).notNull(),
  valor: decimal('valor', { precision: 15, scale: 2 }).notNull(),
  saldoPos: decimal('saldoPos', { precision: 15, scale: 2 }),
  status: mysqlEnum('status', [
    'pendente',
    'classificacao_automatica',
    'classificacao_manual',
    'transferencia_interna',
    'baixa_confianca'
  ]).default('pendente').notNull(),
  categoriaId: int('categoriaId'),
  origem: varchar('origem', { length: 32 }),
  hashUnico: varchar('hashUnico', { length: 64 }).notNull(),
  grupoTransferenciaId: int('grupoTransferenciaId'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  empresaHashIdx: unique('unique_empresa_hash').on(table.empresaId, table.hashUnico),
  empresaDataIdx: index('idx_empresa_data').on(table.empresaId, table.dataOperacao),
  statusIdx: index('idx_status').on(table.status),
  contaIdx: index('idx_conta').on(table.contaId),
  categoriaIdx: index('idx_categoria').on(table.categoriaId),
}));

/**
 * Mapeamentos de importação salvos
 */
export const mapeamentosImportacao = mysqlTable('mapeamentos_importacao', {
  id: int('id').autoincrement().primaryKey(),
  empresaId: int('empresaId').notNull(),
  bancoCodigo: varchar('bancoCodigo', { length: 20 }),
  extensao: varchar('extensao', { length: 8 }).notNull(),
  mapaJson: text('mapaJson').notNull(),
  ativo: boolean('ativo').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  empresaIdx: index('idx_empresa').on(table.empresaId),
  ativoIdx: index('idx_ativo').on(table.ativo),
}));

/**
 * Histórico de aprendizado para classificação automática
 */
export const historicoAprendizado = mysqlTable('historico_aprendizado', {
  id: int('id').autoincrement().primaryKey(),
  empresaId: int('empresaId').notNull(),
  descricaoOriginal: text('descricaoOriginal').notNull(),
  descricaoLimpa: text('descricaoLimpa').notNull(),
  categoriaId: int('categoriaId').notNull(),
  confidence: int('confidence').notNull(),
  usuarioId: int('usuarioId'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  empresaIdx: index('idx_empresa').on(table.empresaId),
  categoriaIdx: index('idx_categoria').on(table.categoriaId),
}));

/**
 * Configurações white-label do sistema
 */
export const configuracoesWhiteLabel = mysqlTable('configuracoes_white_label', {
  id: int('id').autoincrement().primaryKey(),
  nomeSistema: varchar('nomeSistema', { length: 120 }).default('Sistema de Conciliação Bancária').notNull(),
  logoUrl: varchar('logoUrl', { length: 512 }),
  corPrimaria: varchar('corPrimaria', { length: 7 }).default('#3b82f6').notNull(),
  corSecundaria: varchar('corSecundaria', { length: 7 }).default('#1e40af').notNull(),
  nomeEmpresaRevendedora: varchar('nomeEmpresaRevendedora', { length: 180 }),
  contatoSuporte: varchar('contatoSuporte', { length: 320 }),
  textoSobre: text('textoSobre'),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

/**
 * Lançamentos contábeis importados do ERP (contas a pagar/receber)
 * NOTA: Remover defaults para permitir undefined nos inserts
 */
export const lancamentosContabeis = mysqlTable('lancamentos_contabeis', {
  id: int('id').autoincrement().primaryKey(),
  empresaId: int('empresaId').notNull(),
  contaId: int('contaId'), // ✅ SEM .notNull()
  tipo: mysqlEnum('tipo', ['pagar', 'receber']).notNull(),
  dataVencimento: datetime('dataVencimento').notNull(),
  dataEmissao: datetime('dataEmissao'), // ✅ SEM .notNull()
  dataPagamento: datetime('dataPagamento'), // ✅ SEM .notNull()
  descricao: text('descricao').notNull(),
  numeroDocumento: varchar('numeroDocumento', { length: 120 }), // ✅ SEM .notNull()
  nossoNumero: varchar('nossoNumero', { length: 120 }), // ✅ SEM .notNull()
  codigoBarras: varchar('codigoBarras', { length: 120 }), // ✅ SEM .notNull()
  fornecedorCliente: varchar('fornecedorCliente', { length: 180 }), // ✅ SEM .notNull()
  documentoFornecedorCliente: varchar('documentoFornecedorCliente', { length: 32 }), // ✅ SEM .notNull()
  valor: decimal('valor', { precision: 15, scale: 2 }).notNull(),
  valorPago: decimal('valorPago', { precision: 15, scale: 2 }), // ✅ SEM .notNull()
  status: mysqlEnum('status', ['aberto', 'parcialmente_conciliado', 'conciliado', 'cancelado']).default('aberto').notNull(),
  categoriaId: int('categoriaId'), // ✅ SEM .notNull()
  origem: varchar('origem', { length: 32 }), // ✅ SEM .notNull()  
  dadosOriginais: text('dadosOriginais'), // ✅ SEM .notNull()
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  empresaIdx: index('idx_lanc_empresa').on(table.empresaId),
  statusIdx: index('idx_lanc_status').on(table.status),
  tipoIdx: index('idx_lanc_tipo').on(table.tipo),
  vencimentoIdx: index('idx_lanc_vencimento').on(table.dataVencimento),
}));

/**
 * Registros de conciliação entre transações bancárias e lançamentos contábeis
 */
export const conciliacoes = mysqlTable('conciliacoes', {
  id: int('id').autoincrement().primaryKey(),
  empresaId: int('empresaId').notNull(),
  transacaoId: int('transacaoId').notNull(),
  lancamentoId: int('lancamentoId').notNull(),
  loteId: int('loteId'), // ✅ SEM .notNull()
  valorConciliado: decimal('valorConciliado', { precision: 15, scale: 2 }).notNull(),
  tipo: mysqlEnum('tipo', ['automatica', 'manual', 'sugerida']).notNull(),
  confidence: int('confidence').notNull(),
  status: mysqlEnum('status', ['pendente', 'aprovada', 'rejeitada']).default('pendente').notNull(),
  observacoes: text('observacoes'), // ✅ SEM .notNull()
  usuarioId: int('usuarioId'), // ✅ SEM .notNull()
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  empresaIdx: index('idx_conc_empresa').on(table.empresaId),
  transacaoIdx: index('idx_conc_transacao').on(table.transacaoId),
  lancamentoIdx: index('idx_conc_lancamento').on(table.lancamentoId),
  loteIdx: index('idx_conc_lote').on(table.loteId),
  statusIdx: index('idx_conc_status').on(table.status),
  tipoIdx: index('idx_conc_tipo').on(table.tipo),
}));

/**
 * Divergências identificadas no processo de conciliação
 */
export const divergencias = mysqlTable('divergencias', {
  id: int('id').autoincrement().primaryKey(),
  empresaId: int('empresaId').notNull(),
  loteId: int('loteId'), // ✅ SEM .notNull()
  tipo: mysqlEnum('tipo', ['valor_diferente', 'data_diferente', 'nao_encontrado_banco', 'nao_encontrado_erp', 'duplicado', 'outro']).notNull(),
  transacaoId: int('transacaoId'), // ✅ SEM .notNull()
  lancamentoId: int('lancamentoId'), // ✅ SEM .notNull()
  descricao: text('descricao').notNull(),
  valorEsperado: decimal('valorEsperado', { precision: 15, scale: 2 }), // ✅ SEM .notNull()
  valorEncontrado: decimal('valorEncontrado', { precision: 15, scale: 2 }), // ✅ SEM .notNull()
  status: mysqlEnum('status', ['pendente', 'resolvida', 'ignorada']).default('pendente').notNull(),
  resolucao: text('resolucao'), // ✅ SEM .notNull()
  usuarioId: int('usuarioId'), // ✅ SEM .notNull()
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  empresaIdx: index('idx_div_empresa').on(table.empresaId),
  loteIdx: index('idx_div_lote').on(table.loteId),
  tipoIdx: index('idx_div_tipo').on(table.tipo),
  statusIdx: index('idx_div_status').on(table.status),
}));

/**
 * Lotes de conciliação para agrupar processamentos
 */
export const lotesConciliacao = mysqlTable('lotes_conciliacao', {
  id: int('id').autoincrement().primaryKey(),
  empresaId: int('empresaId').notNull(),
  descricao: varchar('descricao', { length: 255 }), // ✅ SEM .notNull()
  dataInicio: datetime('dataInicio').notNull(),
  dataFim: datetime('dataFim').notNull(),
  totalTransacoes: int('totalTransacoes'), // ✅ SEM .default() - permitir undefined no insert
  totalLancamentos: int('totalLancamentos'), // ✅ SEM .default()
  totalConciliados: int('totalConciliados'), // ✅ SEM .default()
  totalDivergencias: int('totalDivergencias'), // ✅ SEM .default()
  taxaConciliacao: decimal('taxaConciliacao', { precision: 5, scale: 2 }), // ✅ SEM .notNull()
  status: mysqlEnum('status', ['processando', 'concluido', 'erro']).default('processando').notNull(),
  usuarioId: int('usuarioId').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  empresaIdx: index('idx_lote_empresa').on(table.empresaId),
  statusIdx: index('idx_lote_status').on(table.status),
  dataInicioIdx: index('idx_lote_data_inicio').on(table.dataInicio),
}));

// Tipos inferidos
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Empresa = typeof empresas.$inferSelect;
export type InsertEmpresa = typeof empresas.$inferInsert;

export type UsuarioEmpresa = typeof usuarioEmpresas.$inferSelect;
export type InsertUsuarioEmpresa = typeof usuarioEmpresas.$inferInsert;

export type ContaBancaria = typeof contasBancarias.$inferSelect;
export type InsertContaBancaria = typeof contasBancarias.$inferInsert;

export type Categoria = typeof categorias.$inferSelect;
export type InsertCategoria = typeof categorias.$inferInsert;

export type Transacao = typeof transacoes.$inferSelect;
export type InsertTransacao = typeof transacoes.$inferInsert;

export type MapeamentoImportacao = typeof mapeamentosImportacao.$inferSelect;
export type InsertMapeamentoImportacao = typeof mapeamentosImportacao.$inferInsert;

export type HistoricoAprendizado = typeof historicoAprendizado.$inferSelect;
export type InsertHistoricoAprendizado = typeof historicoAprendizado.$inferInsert;

export type ConfiguracaoWhiteLabel = typeof configuracoesWhiteLabel.$inferSelect;
export type InsertConfiguracaoWhiteLabel = typeof configuracoesWhiteLabel.$inferInsert;

export type LancamentoContabil = typeof lancamentosContabeis.$inferSelect;
export type InsertLancamentoContabil = typeof lancamentosContabeis.$inferInsert;

export type Conciliacao = typeof conciliacoes.$inferSelect;
export type InsertConciliacao = typeof conciliacoes.$inferInsert;

export type Divergencia = typeof divergencias.$inferSelect;
export type InsertDivergencia = typeof divergencias.$inferInsert;

export type LoteConciliacao = typeof lotesConciliacao.$inferSelect;
export type InsertLoteConciliacao = typeof lotesConciliacao.$inferInsert;