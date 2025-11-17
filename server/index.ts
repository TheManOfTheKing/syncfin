import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import empresasRoutes from './routes/empresas.js';
import categoriasRoutes from './routes/categorias.js';
import contasRoutes from './routes/contas.js';
import transacoesRoutes from './routes/transacoes.js';
import importacaoRoutes from './routes/importacao.js';
import transferenciasRoutes from './routes/transferencias.js';
import dashboardRoutes from './routes/dashboard.js';
import relatoriosRoutes from './routes/relatorios.js';

// Carregar variáveis de ambiente
dotenv.config();

// Verificar variáveis de ambiente essenciais
if (!process.env.DATABASE_URL) {
  console.error('❌ ERRO: DATABASE_URL não encontrada!');
  console.error('📝 Configure a variável DATABASE_URL no Railway.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('⚠️ AVISO: JWT_SECRET não encontrada! Usando valor padrão (NÃO RECOMENDADO EM PRODUÇÃO)');
}

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log('🔧 Configuração do servidor:');
console.log(`   - Ambiente: ${process.env.NODE_ENV || 'development'}`);
console.log(`   - Porta: ${PORT}`);
console.log(`   - Frontend permitido: ${FRONTEND_URL}`);
console.log(`   - Banco de dados: ${process.env.DATABASE_URL ? '✅ Configurado' : '❌ Não configurado'}`);

// Middlewares
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Log de requisições em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`📥 ${req.method} ${req.path}`);
    next();
  });
}

// Health check (importante para Railway)
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: !!process.env.DATABASE_URL
  });
});

// Rotas da API (todas com prefixo /api)
app.use('/api/auth', authRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/contas', contasRoutes);
app.use('/api/transacoes', transacoesRoutes);
app.use('/api/importacao', importacaoRoutes);
app.use('/api/transferencias', transferenciasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/relatorios', relatoriosRoutes);

// Rota 404 para APIs não encontradas
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Middleware de tratamento de erros
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Erro no servidor:', err);
  
  // Não enviar stack trace em produção
  const errorResponse: any = {
    error: 'Erro interno do servidor',
    message: err.message || 'Erro desconhecido'
  };
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.code = err.code;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ========================================');
  console.log(`   Servidor rodando na porta ${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log('🚀 ========================================');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM recebido, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT recebido, encerrando servidor...');
  process.exit(0);
});
