 


const fs = require('fs');
const path = require('path');

const viewsPath = './src/pages/';
const apiMapping = {
  host: '/api/hosts',
  user: '/api/users',
  product: '/api/products',
};

function migrateViewFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Cherche import de data.ts ou prisma-service.ts
  const importRegex = /import\s+\{\s*(\w+)\s*\}\s+from\s+['"](?:..\/)*lib\/(?:data|prisma-service)['"]/g;
  const matches = [...content.matchAll(importRegex)];

  if (matches.length === 0) return;

  let newContent = content;
  matches.forEach(match => {
    const functionName = match[1];
    const entityName = functionName.replace(/^getAll/i, '').toLowerCase();
    const apiUrl = apiMapping[entityName];

    if (apiUrl) {
      // Remplacer import
      newContent = newContent.replace(match[0], '');
      // Remplacer appel à la fonction
      const callRegex = new RegExp(`${functionName}\(\)`, 'g');
      newContent = newContent.replace(callRegex, `fetch('${apiUrl}').then(res => res.json())`);
    }
  });

  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✅ Migrated ${filePath}`);
}

function scanAndMigrate(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanAndMigrate(fullPath);
    } else if (file.endsWith('.tsx')) {
      migrateViewFile(fullPath);
    }
  });
}

scanAndMigrate(viewsPath);