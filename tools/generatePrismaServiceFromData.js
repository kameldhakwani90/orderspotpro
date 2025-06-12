const fs = require('fs');
const path = require('path');

console.log('🔍 Génération de prisma-service.ts depuis schema.prisma...');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const outputPath = path.join(__dirname, '../src/lib/prisma-service.ts');

// Vérifier que le schema Prisma existe
if (!fs.existsSync(schemaPath)) {
  console.error('❌ Fichier schema.prisma introuvable. Exécutez generatePrismaSchema.js d\'abord.');
  process.exit(1);
}

console.log('📖 Lecture du schema Prisma...');

// Lire le schema Prisma complet
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

// Fonction robuste pour extraire TOUS les modèles
function extractAllModels(content) {
  console.log('🔍 Extraction des modèles depuis le schema...');
  
  // Regex plus robuste pour capturer les modèles
  const modelRegex = /^\s*model\s+(\w+)\s*\{/gm;
  const models = [];
  let match;
  
  // Reset regex pour recommencer depuis le début
  modelRegex.lastIndex = 0;
  
  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1];
    models.push(modelName);
    console.log(`  ✅ Modèle trouvé: ${modelName}`);
  }
  
  return models;
}

// Extraire tous les modèles
const modelNames = extractAllModels(schemaContent);

if (modelNames.length === 0) {
  console.error('❌ Aucun modèle trouvé dans schema.prisma');
  console.error('Contenu du schema (premières lignes):');
  console.error(schemaContent.split('\n').slice(0, 20).join('\n'));
  process.exit(1);
}

console.log(`🔍 Modèles trouvés: ${modelNames.join(', ')}`);
console.log(`📊 Total: ${modelNames.length} modèles`);

// Validation minimum
if (modelNames.length < 10) {
  console.error(`❌ ERREUR: Seulement ${modelNames.length} modèles trouvés (minimum 10 attendus)`);
  console.error('Le schema Prisma semble incomplet ou corrompu');
  process.exit(1);
}

// Générer les imports et setup
let content = `// Généré automatiquement depuis schema.prisma
// Ne pas modifier manuellement ce fichier

import { PrismaClient } from '@prisma/client';

// Instance Prisma globale
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// ============================================
// FONCTIONS CRUD GÉNÉRÉES AUTOMATIQUEMENT
// ============================================

`;

// Générer les fonctions CRUD pour chaque modèle
modelNames.forEach(modelName => {
  console.log(`🔧 Génération des fonctions pour ${modelName}...`);
  
  // Nom en camelCase pour Prisma
  const camelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  
  // === FONCTIONS DE LECTURE ===
  
  // Fonction findById
  content += `// =============== ${modelName.toUpperCase()} ===============\n\n`;
  
  content += `export async function get${modelName}ById(id: string) {\n`;
  content += `  try {\n`;
  content += `    return await prisma.${camelName}.findUnique({ \n`;
  content += `      where: { id: id },\n`;
  content += `      include: {\n`;
  content += `        // Ajoutez ici les relations à inclure si nécessaire\n`;
  content += `      }\n`;
  content += `    });\n`;
  content += `  } catch (error) {\n`;
  content += `    console.error('Erreur get${modelName}ById:', error);\n`;
  content += `    throw error;\n`;
  content += `  }\n`;
  content += `}\n\n`;
  
  // Fonction findMany (getAll)
  content += `export async function getAll${modelName}s() {\n`;
  content += `  try {\n`;
  content += `    return await prisma.${camelName}.findMany({\n`;
  content += `      include: {\n`;
  content += `        // Ajoutez ici les relations à inclure si nécessaire\n`;
  content += `      },\n`;
  content += `      orderBy: {\n`;
  content += `        createdAt: 'desc'\n`;
  content += `      }\n`;
  content += `    });\n`;
  content += `  } catch (error) {\n`;
  content += `    console.error('Erreur getAll${modelName}s:', error);\n`;
  content += `    throw error;\n`;
  content += `  }\n`;
  content += `}\n\n`;
  
  // === FONCTIONS DE CRÉATION ===
  
  content += `export async function create${modelName}(data: any) {\n`;
  content += `  try {\n`;
  content += `    return await prisma.${camelName}.create({ \n`;
  content += `      data,\n`;
  content += `      include: {\n`;
  content += `        // Ajoutez ici les relations à inclure si nécessaire\n`;
  content += `      }\n`;
  content += `    });\n`;
  content += `  } catch (error) {\n`;
  content += `    console.error('Erreur create${modelName}:', error);\n`;
  content += `    throw error;\n`;
  content += `  }\n`;
  content += `}\n\n`;
  
  // === FONCTIONS DE MISE À JOUR ===
  
  content += `export async function update${modelName}(id: string, data: any) {\n`;
  content += `  try {\n`;
  content += `    return await prisma.${camelName}.update({ \n`;
  content += `      where: { id: id },\n`;
  content += `      data,\n`;
  content += `      include: {\n`;
  content += `        // Ajoutez ici les relations à inclure si nécessaire\n`;
  content += `      }\n`;
  content += `    });\n`;
  content += `  } catch (error) {\n`;
  content += `    console.error('Erreur update${modelName}:', error);\n`;
  content += `    throw error;\n`;
  content += `  }\n`;
  content += `}\n\n`;
  
  // === FONCTIONS DE SUPPRESSION ===
  
  content += `export async function delete${modelName}(id: string) {\n`;
  content += `  try {\n`;
  content += `    return await prisma.${camelName}.delete({ \n`;
  content += `      where: { id: id }\n`;
  content += `    });\n`;
  content += `  } catch (error) {\n`;
  content += `    console.error('Erreur delete${modelName}:', error);\n`;
  content += `    throw error;\n`;
  content += `  }\n`;
  content += `}\n\n`;
  
  // === ALIASES POUR COMPATIBILITÉ ===
  
  // Ajouter des aliases pour les anciennes fonctions data.ts
  const aliases = {
    'User': ['getUsers', 'addUser'],
    'Host': ['getHosts', 'addHost'],
    'Client': ['getClients', 'addClient'],
    'Order': ['getOrders', 'addOrder'],
    'Service': ['getServices', 'addService'],
    'Reservation': ['getReservations', 'addReservation'],
    'Site': ['getSites'],
    'RoomOrTable': ['getRoomsOrTables'],
    'Tag': ['getTags'],
    'MenuCard': ['getMenuCards']
  };
  
  if (aliases[modelName]) {
    content += `// Aliases pour compatibilité avec data.ts\n`;
    aliases[modelName].forEach(alias => {
      if (alias.startsWith('get') && alias.endsWith('s')) {
        content += `export const ${alias} = getAll${modelName}s;\n`;
      } else if (alias.startsWith('add')) {
        content += `export const ${alias} = create${modelName};\n`;
      }
    });
    content += `\n`;
  }
});

// Ajouter des fonctions utilitaires
content += `// ============================================
// FONCTIONS UTILITAIRES
// ============================================

export async function connectToDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Connexion à la base de données établie');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base:', error);
    return false;
  }
}

export async function disconnectFromDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Déconnexion de la base de données');
  } catch (error) {
    console.error('❌ Erreur lors de la déconnexion:', error);
  }
}

// Fonction de test de santé de la base
export async function healthCheck() {
  try {
    await prisma.$queryRaw\`SELECT 1\`;
    return { status: 'ok', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'error', error: error.message, timestamp: new Date().toISOString() };
  }
}
`;

// Créer le répertoire de destination s'il n'existe pas
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`📁 Répertoire créé: ${outputDir}`);
}

// Écrire le fichier
try {
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log('✅ prisma-service.ts généré avec succès');
  console.log(`📁 Fichier créé: ${outputPath}`);
  console.log(`📊 Fonctions générées pour ${modelNames.length} modèles:`);
  
  // Résumé des fonctions générées
  modelNames.forEach(model => {
    console.log(`  - get${model}ById, getAll${model}s, create${model}, update${model}, delete${model}`);
  });
  
  console.log(`\n🎉 Total: ${modelNames.length * 5} fonctions CRUD générées !`);
  
} catch (error) {
  console.error('❌ Erreur lors de l\'écriture du fichier:', error);
  process.exit(1);
}
