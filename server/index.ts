import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente ANTES de tudo
dotenv.config();

// ============================================
// LOGS DE INICIALIZAÇÃO
// ============================================
console.log('');
console.log('='.repeat(60));
console.log('🔄 INICIANDO SERVIDOR - ' + new Date().toISOString());
console.log('='.repeat(60));
console.log('');
console.log('📋 Variáveis de Ambiente:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || '❌ NÃO DEFINIDO'}`);
console.log(`   PORT: ${process.env.PORT || '❌ NÃO DEFINIDO (usando 3000)'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Configurado (' + process.env.DATABASE_URL.substring(0, 30) + '...)' : '❌ NÃO CONFIGURADO'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Configurado' : '❌ NÃO CONFIGURADO'}`);
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || '❌ NÃO DEFINIDO'}`);
console.log('');

// ============================================
// IMPORTAR ROTAS (com try/catch)
// ============================================
let authRoutes: any;
let empresasRoutes: any;
let categoriasRoutes: any;
let contasRoutes: any;
let transacoesRoutes: any;
let importacaoRoutes: any;
let transferenciasRoutes: any;
let dashboardRoutes: any;
let relatoriosRoutes: any;

try {
  console.log('📦 Importando rotas...');
  authRoutes = (await import('./routes/auth.js')).default;
  empresasRoutes = (await import('./routes/empresas.js')).default;
  categoriasRoutes = (await import('./routes/categorias.js')).default;
  contasRoutes = (await import('./routes/contas.js')).default;
  transacoesRoutes = (await import('./routes/transacoes.js')).default;
  importacaoRoutes = (await import('./routes/importacao.js')).default;
  transferenciasRoutes = (await import('./routes/transferencias.js')).default;
  dashboardRoutes = (await import('./routes/dashboard.js')).default;
  relatoriosRoutes = (await import('./routes/relatorios.js')).default;
  console.log('✅ Todas as rotas importadas com sucesso!');
} catch (error: any) {
  console.error('❌ ERRO ao importar rotas:', error.message);
  console.error('Stack:', error.stack);
  console.log('⚠️ Servidor continuará sem algumas rotas...');
}

console.log('');

// ============================================
// CONFIGURAÇÃO DO EXPRESS
// ============================================
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Função para normalizar URL (garantir que tenha protocolo)
function normalizeUrl(url: string): string {
  if (!url) return 'http://localhost:5173';
  // Se já tem protocolo, retorna como está
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Se não tem protocolo, adiciona https://
  return `https://${url}`;
}

// Obter e normalizar FRONTEND_URL
const FRONTEND_URL_RAW = process.env.FRONTEND_URL || 'http://localhost:5173';
const FRONTEND_URL = normalizeUrl(FRONTEND_URL_RAW);

// Lista de origens permitidas (desenvolvimento e produção)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  FRONTEND_URL,
  'https://syncfin.vercel.app',
  'https://syncfin-front.vercel.app',
].filter((url, index, self) => self.indexOf(url) === index); // Remove duplicatas

console.log('🔧 Configurando Express...');
console.log(`🌐 FRONTEND_URL (raw): ${FRONTEND_URL_RAW}`);
console.log(`🌐 FRONTEND_URL (normalized): ${FRONTEND_URL}`);
console.log(`🌐 Origens permitidas: ${allowedOrigins.join(', ')}`);

// Middlewares básicos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS - permitir frontend com validação dinâmica
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (ex: Postman, curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar se a origin está na lista de permitidas
    if (allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed))) {
      console.log(`✅ CORS permitido para: ${origin}`);
      return callback(null, true);
    }
    
    // Se não estiver na lista, verificar se é uma variação válida
    const normalizedOrigin = normalizeUrl(origin.replace(/^https?:\/\//, ''));
    if (allowedOrigins.includes(normalizedOrigin)) {
      console.log(`✅ CORS permitido para (normalizado): ${origin} -> ${normalizedOrigin}`);
      return callback(null, true);
    }
    
    console.log(`❌ CORS bloqueado para: ${origin}`);
    console.log(`   Origens permitidas: ${allowedOrigins.join(', ')}`);
    callback(new Error('Não permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
}));

// Log de requisições
app.use((req, _res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

console.log('✅ Express configurado!');
console.log('');

// ============================================
// ROTAS ESSENCIAIS (sempre disponíveis)
// ============================================

// Health check - SEMPRE RESPONDE
app.get('/health', (_req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    database: !!process.env.DATABASE_URL,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };
  
  console.log('✅ Healthcheck OK');
  res.status(200).json(health);
});

// Rota raiz
app.get('/', (_req, res) => {
  res.json({
    message: 'API de Conciliação Bancária - FinSync',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/health',
      api: '/api/*',
    },
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// REGISTRAR ROTAS DA API
// ============================================
console.log('🔗 Registrando rotas da API...');

if (authRoutes) {
  app.use('/api/auth', authRoutes);
  console.log('   ✅ /api/auth');
}

if (empresasRoutes) {
  app.use('/api/empresas', empresasRoutes);
  console.log('   ✅ /api/empresas');
}

if (categoriasRoutes) {
  app.use('/api/categorias', categoriasRoutes);
  console.log('   ✅ /api/categorias');
}

if (contasRoutes) {
  app.use('/api/contas', contasRoutes);
  console.log('   ✅ /api/contas');
}

if (transacoesRoutes) {
  app.use('/api/transacoes', transacoesRoutes);
  console.log('   ✅ /api/transacoes');
}

if (importacaoRoutes) {
  app.use('/api/importacao', importacaoRoutes);
  console.log('   ✅ /api/importacao');
}

if (transferenciasRoutes) {
  app.use('/api/transferencias', transferenciasRoutes);
  console.log('   ✅ /api/transferencias');
}

if (dashboardRoutes) {
  app.use('/api/dashboard', dashboardRoutes);
  console.log('   ✅ /api/dashboard');
}

if (relatoriosRoutes) {
  app.use('/api/relatorios', relatoriosRoutes);
  console.log('   ✅ /api/relatorios');
}

console.log('');

// Rota 404 para APIs não encontradas
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ============================================
// MIDDLEWARE DE ERRO
// ============================================
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Erro capturado:', err.message);
  console.error('Stack:', err.stack);
  
  const errorResponse: any = {
    error: 'Erro interno do servidor',
    message: err.message || 'Erro desconhecido',
  };
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

// ============================================
// INICIAR SERVIDOR
// ============================================
console.log('🚀 Iniciando servidor HTTP...');

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('🎉 SERVIDOR INICIADO COM SUCESSO!');
  console.log('='.repeat(60));
  console.log(`   📍 Porta: ${PORT}`);
  console.log(`   🌍 Host: 0.0.0.0`);
  console.log(`   🔗 URL: http://localhost:${PORT}`);
  console.log(`   ❤️ Health: http://localhost:${PORT}/health`);
  console.log(`   🌐 API: http://localhost:${PORT}/api`);
  console.log('='.repeat(60));
  console.log('');
  console.log('✅ Pronto para receber requisições!');
  console.log('');
});

// Eventos do servidor
server.on('listening', () => {
  console.log(`✅ Servidor escutando na porta ${PORT}`);
});

server.on('error', (error: any) => {
  console.error('');
  console.error('='.repeat(60));
  console.error('❌ ERRO AO INICIAR SERVIDOR');
  console.error('='.repeat(60));
  console.error('Erro:', error.message);
  console.error('Código:', error.code);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} já está em uso!`);
  }
  
  console.error('='.repeat(60));
  console.error('');
  process.exit(1);
});

// ============================================
// TRATAMENTO DE SINAIS E ERROS
// ============================================

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM recebido, encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT recebido, encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});

// Capturar erros não tratados
process.on('uncaughtException', (error) => {
  console.error('');
  console.error('='.repeat(60));
  console.error('❌ EXCEÇÃO NÃO CAPTURADA');
  console.error('='.repeat(60));
  console.error('Erro:', error.message);
  console.error('Stack:', error.stack);
  console.error('='.repeat(60));
  console.error('');
  console.error('⚠️ O servidor continuará rodando, mas pode estar instável.');
});

process.on('unhandledRejection', (reason: any, promise) => {
  console.error('');
  console.error('='.repeat(60));
  console.error('❌ PROMISE REJEITADA NÃO TRATADA');
  console.error('='.repeat(60));
  console.error('Razão:', reason);
  console.error('Promise:', promise);
  console.error('='.repeat(60));
  console.error('');
  console.error('⚠️ O servidor continuará rodando, mas pode estar instável.');
});

console.log('✅ Handlers de erro configurados');
console.log('');