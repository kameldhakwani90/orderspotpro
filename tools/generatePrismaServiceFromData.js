const fs = require('fs');
const path = require('path');

const modelsPath = path.join(__dirname, '../tools/models.json');
const outputPath = path.join(__dirname, '../src/lib/prisma-service.ts');

if (!fs.existsSync(modelsPath)) {
  console.error('❌ Fichier models.json introuvable.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(modelsPath, 'utf-8'));

let content = `import { prisma } from './prisma';\n\n`;

for (const modelName of Object.keys(data)) {
  const camelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  content += `export async function get${modelName}ById(id: string) {\n`;
  content += `  return await prisma.${camelName}.findUnique({ where: { id } });\n`;
  content += `}\n\n`;
}

fs.writeFileSync(outputPath, content.trim() + '\n', 'utf-8');
console.log('✅ prisma-service.ts généré automatiquement.');
