const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const outputPath = path.join(__dirname, '../src/lib/prisma-service.ts');

// Vérifier que le schema Prisma existe
if (!fs.existsSync(schemaPath)) {
  console.error('❌ Fichier schema.prisma introuvable. Exécutez generatePrismaSchema.js d\'abord.');
  process.exit(1);
}

// Lire le schema Prisma et extraire les modèles
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
const modelMatches = schemaContent.match(/model\s+(\w+)\s*{/g);

if (!modelMatches) {
  console.error('❌ Aucun modèle trouvé dans schema.prisma');
  process.exit(1);
}

// Extraire les noms des modèles
const modelNames = modelMatches.map(match => {
  return match.match(/model\s+(\w+)/)[1];
});

console.log(`🔍 Modèles trouvés: ${modelNames.join(', ')}`);

// Générer le contenu du service
let content = `import { prisma } from './prisma';\n\n`;

for (const modelName of modelNames) {
  const camelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  
  // Fonction findById
  content += `export async function get${modelName}ById(id: string) {\n`;
  content += `  return await prisma.${camelName}.findUnique({ where: { id: parseInt(id) } });\n`;
  content += `}\n\n`;
  
  // Fonction findMany
  content += `export async function getAll${modelName}s() {\n`;
  content += `  return await prisma.${camelName}.findMany();\n`;
  content += `}\n\n`;
  
  // Fonction create
  content += `export async function create${modelName}(data: any) {\n`;
  content += `  return await prisma.${camelName}.create({ data });\n`;
  content += `}\n\n`;
  
  // Fonction update
  content += `export async function update${modelName}(id: string, data: any) {\n`;
  content += `  return await prisma.${camelName}.update({ where: { id: parseInt(id) }, data });\n`;
  content += `}\n\n`;
  
  // Fonction delete
  content += `export async function delete${modelName}(id: string) {\n`;
  content += `  return await prisma.${camelName}.delete({ where: { id: parseInt(id) } });\n`;
  content += `}\n\n`;
}

// Créer le répertoire s'il n'existe pas
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Écrire le fichier
fs.writeFileSync(outputPath, content.trim() + '\n', 'utf-8');
console.log('✅ prisma-service.ts généré automatiquement.');
console.log(`📁 Fichier créé: ${outputPath}`);
