const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, '../src/app');
const dataServicePath = '@/lib/data';
const prismaServicePath = '@/lib/prisma-service';

function scanAndReplace(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes(dataServicePath)) return false;

  const updatedContent = content
    .replace(dataServicePath, prismaServicePath)
    .replace(/get(\w+)ById/g, 'findUnique$1'); // Exemple : getClientById → findUniqueClient

  if (updatedContent !== content) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`✅ Migré : ${filePath}`);
    return true;
  }

  return false;
}

function walk(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.tsx')) {
      scanAndReplace(fullPath);
    }
  });
}

walk(viewsDir);
