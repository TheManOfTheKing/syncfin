// Helper para facilitar o uso do db em todas as rotas
import { getDb } from '../db/index.js';

// Função helper que retorna o db inicializado
// Use: const db = await getDbInstance();
export async function getDbInstance() {
  return await getDb();
}

// Alias para compatibilidade
export { getDb as db };

