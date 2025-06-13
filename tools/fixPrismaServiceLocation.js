const fs = require('fs');
const path = require('path');

console.log('🔧 Relocation automatique de prisma-service...');

const oldPath = path.join(__dirname, '../src/lib/prisma-service.ts');
const newPath = path.join(__dirname, '../src/server/prisma-service.ts');
const serverDir = path.join(__dirname, '../src/server');

// 1. Créer dossier server
if (!fs.existsSync(serverDir)) {
  fs.mkdirSync(serverDir, { recursive: true });
  console.log('📁 Dossier /src/server créé');
}

// 2. Déplacer le fichier si existe
if (fs.existsSync(oldPath)) {
  fs.renameSync(oldPath, newPath);
  console.log('📦 prisma-service.ts déplacé vers /src/server/');
}

// 3. Corriger TOUS les imports automatiquement
const apiDir = path.join(__dirname, '../src/app/api');
if (fs.existsSync(apiDir)) {
  function updateImports(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        updateImports(fullPath);
      } else if (entry.name === 'route.ts') {
        let content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes('@/lib/prisma-service')) {
          content = content.replace(/@\/lib\/prisma-service/g, '@/server/prisma-service');
          fs.writeFileSync(fullPath, content, 'utf-8');
          console.log(`  ✅ ${path.relative(process.cwd(), fullPath)}`);
        }
      }
    });
  }
  
  updateImports(apiDir);
}

console.log('✅ Relocation automatique terminée');
