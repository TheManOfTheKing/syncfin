import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

// Carregar .env
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada!');
  console.error('📝 Configure a variável DATABASE_URL no ambiente (Vercel ou .env)');
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
}

console.log('🔗 Conectando ao banco...');

let pool: mysql.Pool;
let db: ReturnType<typeof drizzle>;

try {
  // Usar createPool para melhor performance e compatibilidade com Vercel
  pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DATABASE_URL?.includes('railway') ? {
      rejectUnauthorized: false
    } : undefined
  });

  // Testar conexão
  const testConnection = await pool.getConnection();
  await testConnection.ping();
  testConnection.release();
  
  console.log('✅ Banco conectado com sucesso!');
  
  db = drizzle(pool, { schema, mode: 'default' });
  
} catch (error: any) {
  console.error('❌ Erro ao conectar ao banco de dados:');
  console.error(`   Mensagem: ${error.message}`);
  console.error(`   Código: ${error.code}`);
  console.error('');
  console.error('🔧 Verifique:');
  console.error('   1. Se o MySQL/XAMPP está rodando');
  console.error('   2. Se o banco "conciliacao_bancaria" existe');
  console.error('   3. Se a DATABASE_URL no .env está correta');
  console.error('   4. Se as credenciais estão corretas (usuário/senha)');
  console.error('');
  console.error('💡 Dica: Se estava funcionando antes, tente:');
  console.error('   - Reiniciar o XAMPP/MySQL');
  console.error('   - Reiniciar o servidor Node.js (Ctrl+C e pnpm dev)');
  console.error('');
  console.error('📝 Exemplo de DATABASE_URL:');
  console.error('   mysql://root@localhost:3306/conciliacao_bancaria');
  console.error('   mysql://root:senha@localhost:3306/conciliacao_bancaria');
  
  process.exit(1);
}

export { db };