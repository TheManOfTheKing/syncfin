import { Router } from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { eq } from 'drizzle-orm';

const router = Router();

// Endpoint de diagnóstico (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  router.get('/diagnostico', async (req, res) => {
    try {
      // Testar conexão
      await db.select().from(users).limit(1);
      
      res.json({
        status: 'ok',
        mensagem: 'Conexão com banco funcionando',
        tabela_users: 'existe'
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'erro',
        mensagem: error.message,
        codigo: error.code,
        stack: error.stack
      });
    }
  });
}

// Registro de novo usuário
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    // Verificar se usuário já existe
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password);

    // Criar usuário
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role: 'user',
    });

    // Gerar token
    const token = generateToken(newUser.insertId, email);

    res.json({
      token,
      user: {
        id: newUser.insertId,
        email,
        name,
        role: 'user',
      },
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    if (!user.ativo) {
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    // Verificar senha
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Gerar token
    const token = generateToken(user.id, user.email);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('❌ Erro no login:', error);
    console.error('Stack:', error.stack);
    
    // Verificar se é erro de conexão com banco
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ER_ACCESS_DENIED_ERROR') {
      return res.status(503).json({ 
        error: 'Erro ao conectar com o banco de dados',
        detalhes: 'Verifique se o MySQL está rodando e se a DATABASE_URL está correta'
      });
    }
    
    // Verificar se é erro de tabela não encontrada
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes('doesn\'t exist')) {
      return res.status(500).json({ 
        error: 'Tabela não encontrada no banco de dados',
        detalhes: 'Execute: pnpm db:push para criar as tabelas'
      });
    }
    
    res.status(500).json({ 
      error: 'Erro ao fazer login',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: process.env.NODE_ENV === 'development' ? error.code : undefined
    });
  }
});

// Verificar token
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const { verifyToken } = await import('../utils/auth.js');
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({ error: 'Erro ao verificar token' });
  }
});

export default router;
