import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
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
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware de tratamento de erros
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Erro no servidor:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Exportar como serverless function para Vercel
export default app;

