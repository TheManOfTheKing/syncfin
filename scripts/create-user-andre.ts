import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { users } from '../server/db/schema.js';
import { hashPassword } from '../server/utils/auth.js';
import { eq } from 'drizzle-orm';
import * as schema from '../server/db/schema.js';

// Carregar variáveis de ambiente
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada no arquivo .env!');
  process.exit(1);
}

async function createUserAndre() {
  let connection: mysql.Connection | null = null;
  let db: ReturnType<typeof drizzle> | null = null;

  try {
    // Conectar ao banco
    console.log('🔗 Conectando ao banco de dados...');
    connection = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
    });

    await connection.ping();
    console.log('✅ Conectado ao banco de dados!\n');

    db = drizzle(connection, { schema, mode: 'default' });

    console.log('🚀 Criando usuário...\n');

    const email = 'delmondesadv@gmail.com';
    const password = 'px#UDA^fy&gNv5';
    const name = 'André de Sales Delmondes';

    // Verificar se usuário já existe
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      console.log('⚠️  Usuário já existe!');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Nome: ${existingUser.name}`);
      console.log(`   ID: ${existingUser.id}`);
      console.log('\n💡 Para recriar o usuário, delete-o primeiro do banco de dados.');
      await connection.end();
      process.exit(0);
    }

    // Hash da senha
    console.log('🔐 Gerando hash da senha...');
    const hashedPassword = await hashPassword(password);

    // Criar usuário
    console.log('👤 Criando usuário...');
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role: 'user',
      ativo: true,
    });

    // Buscar usuário criado
    const [createdUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, newUser.insertId))
      .limit(1);

    if (createdUser) {
      console.log('\n✅ Usuário criado com sucesso!\n');
      console.log('📋 Detalhes do usuário:');
      console.log(`   ID: ${createdUser.id}`);
      console.log(`   Nome: ${createdUser.name}`);
      console.log(`   Email: ${createdUser.email}`);
      console.log(`   Role: ${createdUser.role}`);
      console.log(`   Ativo: ${createdUser.ativo ? 'Sim' : 'Não'}`);
      console.log('\n🔑 Credenciais de acesso:');
      console.log(`   Email: ${email}`);
      console.log(`   Senha: ${password}`);
      console.log('\n✨ Você pode usar essas credenciais para fazer login no sistema.');
    } else {
      console.error('❌ Erro: Usuário criado mas não foi possível recuperá-lo.');
      process.exit(1);
    }

    // Fechar conexão
    await connection.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Erro ao criar usuário:');
    console.error(`   ${error.message}`);
    
    if (error.code) {
      console.error(`   Código: ${error.code}`);
    }
    
    console.error('\n🔧 Verifique:');
    console.error('   1. Se o banco de dados está rodando');
    console.error('   2. Se a DATABASE_URL no .env está correta');
    console.error('   3. Se as tabelas foram criadas (execute as migrations)');
    
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        // Ignorar erros ao fechar conexão
      }
    }
    
    process.exit(1);
  }
}

// Executar
createUserAndre();

