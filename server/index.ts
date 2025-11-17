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

console.log('🔄 Iniciando servidor...');
console.log('📋 Variáveis de ambiente:');
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'não definido'}`);
console.log(`   - PORT: ${process.env.PORT || 'não definido (usando 3000)'}`);
console.log(`   - DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Configurado' : '❌ Não configurado'}`);
console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Configurado' : '⚠️ Não configurado'}`);
console.log(`   - FRONTEND_URL: ${process.env.FRONTEND_URL || 'não definido (usando http://localhost:5173)'}`);

// Verificar variáveis de ambiente essenciais
if (!process.env.DATABASE_URL) {
  console.error('❌ ERRO CRÍTICO: DATABASE_URL não encontrada!');
  console.error('📝 Configure a variável DATABASE_URL no Railway.');
  console.error('⚠️ O servidor será iniciado, mas as rotas de API não funcionarão.');
}

if (!process.env.JWT_SECRET) {
  console.error('⚠️ AVISO: JWT_SECRET não encontrada! Usando valor padrão (NÃO RECOMENDADO EM PRODUÇÃO)');
}

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log('🔧 Configuração do servidor:');
console.log(`   - Ambiente: ${process.env.NODE_ENV || 'development'}`);
console.log(`   - Porta: ${PORT}`);
console.log(`   - Frontend permitido: ${FRONTEND_URL}`);

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
// Este endpoint DEVE responder mesmo se o banco estiver offline
app.get('/health', (_req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    database: !!process.env.DATABASE_URL,
    uptime: process.uptime(),
  };
  
  console.log('✅ Healthcheck acessado:', health);
  res.status(200).json(health);
});

// Rota raiz para debug
app.get('/', (_req, res) => {
  res.json({
    message: 'API de Conciliação Bancária',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/*'
    }
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
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ========================================');
  console.log(`   ✅ Servidor rodando na porta ${PORT}`);
  console.log(`   📍 Escutando em 0.0.0.0:${PORT}`);
  console.log(`   🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   🔗 API: http://localhost:${PORT}/api`);
  console.log(`   ❤️ Health: http://localhost:${PORT}/health`);
  console.log('🚀 ========================================');
  console.log('');
  console.log('✅ Servidor pronto para receber requisições!');
});

// Timeout para garantir que o servidor está escutando
server.on('listening', () => {
  console.log('✅ Servidor está escutando na porta', PORT);
});

server.on('error', (error: any) => {
  console.error('❌ Erro ao iniciar servidor:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} já está em uso!`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM recebido, encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT recebido, encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  });
});

// Capturar erros não tratados
process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', promise, 'razão:', reason);
});