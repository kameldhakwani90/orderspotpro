const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../src/lib/data.ts');
const prismaService = path.join(__dirname, '../src/lib/prisma-service.ts');

if (!fs.existsSync(dataFile) || !fs.existsSync(prismaService)) {
  console.error('❌ Fichier manquant : data.ts ou prisma-service.ts');
  process.exit(1);
}

const serviceContent = fs.readFileSync(prismaService, 'utf-8');
const dataContent = fs.readFileSync(dataFile, 'utf-8');

const functionNames = [...serviceContent.matchAll(/export async function (get\w+ById)/g)].map(m => m[1]);

let cleaned = dataContent;
let removed = 0;

functionNames.forEach(fn => {
  const regex = new RegExp(`export async function ${fn}\\([^\\}]+\\}\\n\\n`, 'g');
  if (regex.test(cleaned)) {
    cleaned = cleaned.replace(regex, '');
    removed++;
  }
});

fs.writeFileSync(dataFile, cleaned, 'utf-8');
console.log(`✅ Nettoyage terminé : ${removed} fonctions supprimées de data.ts`);
