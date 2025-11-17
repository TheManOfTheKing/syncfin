import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
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
  console.error('❌ ERRO: DATABASE_URL não encontrada no arquivo .env!');
  console.error('📝 Crie ou corrija o arquivo .env na raiz do projeto.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/contas', contasRoutes);
app.use('/api/transacoes', transacoesRoutes);
app.use('/api/importacao', importacaoRoutes);
app.use('/api/transferencias', transferenciasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/relatorios', relatoriosRoutes);

// Servir arquivos estáticos em produção
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '../../public');
  app.use(express.static(publicPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Middleware de tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erro no servidor:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`💡 Frontend: http://localhost:5173 (desenvolvimento)`);
});
