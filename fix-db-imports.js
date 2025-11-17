// Script para corrigir imports de db em todos os arquivos
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesDir = path.join(__dirname, 'server', 'routes');
const servicesDir = path.join(__dirname, 'server', 'services');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Se já importa getDb, adicionar const db = await getDb(); no início de cada função async
  if (content.includes('import { getDb }')) {
    // Adicionar const db = await getDb(); após o try { em cada função async
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      newLines.push(lines[i]);
      
      // Se encontrar uma linha com "try {" e a próxima não tem "const db = await getDb()"
      if (lines[i].trim() === 'try {' && 
          i + 1 < lines.length && 
          !lines[i + 1].includes('const db = await getDb()') &&
          !lines[i + 1].includes('const dbInstance = await getDb()')) {
        // Verificar se há uso de db nas próximas linhas
        const nextLines = lines.slice(i + 1, Math.min(i + 20, lines.length)).join('\n');
        if (nextLines.includes('await db.') || nextLines.includes('db.select') || nextLines.includes('db.insert') || nextLines.includes('db.update')) {
          newLines.push('    const db = await getDb();');
          modified = true;
        }
      }
    }
    
    if (modified) {
      content = newLines.join('\n');
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// Processar todos os arquivos .ts em routes e services
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let count = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      count += processDirectory(filePath);
    } else if (file.endsWith('.ts')) {
      if (fixFile(filePath)) {
        count++;
      }
    }
  }
  
  return count;
}

console.log('🔧 Corrigindo imports de db...\n');
const routesCount = processDirectory(routesDir);
const servicesCount = processDirectory(servicesDir);

console.log(`\n✅ Total: ${routesCount + servicesCount} arquivos corrigidos`);
