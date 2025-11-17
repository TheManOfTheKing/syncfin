import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

// Carregar .env
dotenv.config();

let pool: mysql.Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;
let initPromise: Promise<ReturnType<typeof drizzle>> | null = null;

// Função para inicializar a conexão de forma lazy (sob demanda)
async function initializeDb(): Promise<ReturnType<typeof drizzle>> {
  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não encontrada!');
    console.error('📝 Configure a variável DATABASE_URL no ambiente (Vercel ou .env)');
    throw new Error('DATABASE_URL não configurada');
  }

  console.log('🔗 Conectando ao banco...');

  initPromise = (async () => {
    try {
      // Usar createPool para melhor performance e compatibilidade com Vercel
      pool = mysql.createPool({
        uri: process.env.DATABASE_URL!,
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
      
      dbInstance = drizzle(pool, { schema, mode: 'default' });
      return dbInstance;
      
    } catch (error: any) {
      console.error('❌ Erro ao conectar ao banco de dados:');
      console.error(`   Mensagem: ${error.message}`);
      console.error(`   Código: ${error.code}`);
      console.error('');
      console.error('🔧 Verifique:');
      console.error('   1. Se o MySQL está rodando');
      console.error('   2. Se o banco existe');
      console.error('   3. Se a DATABASE_URL está correta');
      console.error('   4. Se as credenciais estão corretas');
      
      initPromise = null; // Reset para permitir nova tentativa
      throw error;
    }
  })();

  return initPromise;
}

// Função para obter o db (lazy initialization)
export async function getDb(): Promise<ReturnType<typeof drizzle>> {
  return await initializeDb();
}

// Exportar db como um objeto que funciona com métodos encadeados do Drizzle
// Inicializa automaticamente na primeira chamada
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    // Retornar uma função que inicializa o db e então chama o método
    return async (...args: any[]) => {
      const instance = await initializeDb();
      const method = (instance as any)[prop];
      if (typeof method === 'function') {
        return method.apply(instance, args);
      }
      return method;
    };
  }
}) as any;
