import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
// Inicializar o banco de dados antes de importar as rotas
import { getDb } from '../server/db/index.js';
// Aguardar inicialização do banco (lazy, só quando necessário)
getDb().catch((err) => {
  console.error('⚠️ Erro ao inicializar banco (será tentado novamente na primeira requisição):', err.message);
});

import authRoutes from '../server/routes/auth.js';
import empresasRoutes from '../server/routes/empresas.js';
import categoriasRoutes from '../server/routes/categorias.js';
import contasRoutes from '../server/routes/contas.js';
import transacoesRoutes from '../server/routes/transacoes.js';
import importacaoRoutes from '../server/routes/importacao.js';
import transferenciasRoutes from '../server/routes/transferencias.js';
import dashboardRoutes from '../server/routes/dashboard.js';
import relatoriosRoutes from '../server/routes/relatorios.js';

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Permitir todas as origens na Vercel
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rotas da API (sem prefixo /api pois a Vercel já adiciona)
app.use('/auth', authRoutes);
app.use('/empresas', empresasRoutes);
app.use('/categorias', categoriasRoutes);
app.use('/contas', contasRoutes);
app.use('/transacoes', transacoesRoutes);
app.use('/importacao', importacaoRoutes);
app.use('/transferencias', transferenciasRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/relatorios', relatoriosRoutes);

// Health check
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware de tratamento de erros
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: express.Response, _next: NextFunction): void => {
  console.error('❌ Erro no servidor:', err);
  if (!res.headersSent) {
    const error = err as { message?: string; code?: string; stack?: string };
    console.error('Erro completo:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message || 'Erro desconhecido',
      code: error.code,
      database_configured: !!process.env.DATABASE_URL
    });
  }
});

// Exportar como serverless function para Vercel
// A Vercel suporta Express diretamente quando exportado como default
// O vercel.json está configurado para rotear /api/* para este arquivo
export default app;
