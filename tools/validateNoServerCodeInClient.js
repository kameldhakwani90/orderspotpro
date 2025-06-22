// tools/validateNoServerCodeInClient.js

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(process.cwd(), 'src');

function getAllTsxFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(getAllTsxFiles(filePath));
    } else if (file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });

  return results;
}

const files = getAllTsxFiles(SRC_DIR);
let violations = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineTrimmed = line.trim();
    const isImport = lineTrimmed.startsWith('import');
    
    if (isImport && lineTrimmed.includes('prisma-service')) {
      violations.push({
        file,
        line: index + 1,
        type: 'import'
      });
    }

    if (!isImport && lineTrimmed.includes('prisma.')) {
      violations.push({
        file,
        line: index + 1,
        type: 'usage direct'
      });
    }
  });
});

if (violations.length > 0) {
  console.error('❌ Erreur : du code serveur (Prisma) détecté dans du code React client (.tsx)');
  violations.forEach(v => {
    console.error(`- ${v.file} (ligne ${v.line}) → ${v.type === 'import' ? 'import serveur illégal' : 'appel direct à Prisma'}`);
  });
  process.exit(1);
}

console.log('✅ validateNoServerCodeInClient.js : aucun code serveur détecté côté client ✔');
