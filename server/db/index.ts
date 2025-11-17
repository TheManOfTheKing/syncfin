import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

// Carregar .env
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada no arquivo .env!');
  console.error('📝 Crie um arquivo .env na raiz do projeto com:');
  console.error('   DATABASE_URL=mysql://root@localhost:3306/conciliacao_bancaria');
  process.exit(1);
}

console.log('🔗 Conectando ao banco...');

let connection: mysql.Connection;
let db: ReturnType<typeof drizzle>;

try {
  connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
  });

  // Testar conexão
  await connection.ping();
  
  console.log('✅ Banco conectado com sucesso!');
  
  db = drizzle(connection, { schema, mode: 'default' });
  
  // Tratamento de erros de conexão perdida
  connection.on('error', (err: any) => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNREFUSED') {
      console.error('⚠️ Conexão com banco perdida. Reinicie o servidor.');
    } else {
      console.error('⚠️ Erro na conexão:', err.message);
    }
  });
  
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