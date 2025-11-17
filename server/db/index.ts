import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

// Carregar .env
dotenv.config();

let pool: mysql.Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

// Função para inicializar a conexão de forma lazy (sob demanda)
async function initializeDb() {
  if (dbInstance) {
    return dbInstance;
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não encontrada!');
    console.error('📝 Configure a variável DATABASE_URL no ambiente (Vercel ou .env)');
    throw new Error('DATABASE_URL não configurada');
  }

  console.log('🔗 Conectando ao banco...');

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
    
    throw error;
  }
}

// Variável global para armazenar a promise de inicialização
let dbPromise: Promise<ReturnType<typeof drizzle>> | null = null;

// Função para obter o db (lazy initialization)
export async function getDb(): Promise<ReturnType<typeof drizzle>> {
  if (!dbPromise) {
    dbPromise = initializeDb();
  }
  return dbPromise;
}

// Exportar db como getDb para uso direto
// Todos os arquivos devem usar: const db = await getDb(); antes de usar
export { getDb };

// Para compatibilidade temporária, exportar db como uma promise
// que resolve para o db real (mas isso requer await em cada uso)
// ATENÇÃO: Isso não funciona com métodos encadeados como db.select().from()
// Os arquivos precisam ser atualizados para usar: const db = await getDb();
export const db = getDb() as any;