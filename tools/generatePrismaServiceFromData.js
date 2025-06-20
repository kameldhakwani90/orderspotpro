const fs = require('fs');
const path = require('path');

console.log('🚀 Génération 100% DYNAMIQUE du service Prisma...');

const dataPath = path.join(__dirname, '../src/lib/data.ts');
const typesPath = path.join(__dirname, '../src/lib/types.ts');
const servicePath = path.join(__dirname, '../src/lib/prisma-service.ts');

function extractAllInterfacesFromTypes(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error('❌ types.ts introuvable');
    return new Map();
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const interfaces = new Map();
  
  console.log('📖 Extraction COMPLÈTE des interfaces depuis types.ts...');
  
  const interfaceRegex = /export\s+interface\s+(\w+)\s*\{([^}]+)\}/gs;
  let match;
  
  while ((match = interfaceRegex.exec(content)) !== null) {
    const typeName = match[1];
    const typeBody = match[2];
    
    const fields = [];
    const fieldLines = typeBody.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//') && !line.startsWith('*'));
    
    fieldLines.forEach(line => {
      const fieldMatch = line.match(/(\w+)(\?)?\s*:\s*([^;,\n]+)/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const isOptional = fieldMatch[2] === '?';
        const fieldType = fieldMatch[3].trim().replace(/[;,]$/, '');
        
        fields.push({
          name: fieldName,
          type: fieldType,
          optional: isOptional
        });
      }
    });
    
    interfaces.set(typeName, {
      name: typeName,
      fields: fields
    });
    
    console.log(`  📋 Interface: ${typeName} (${fields.length} champs)`);
  }
  
  return interfaces;
}

function analyzeDataFileForPatterns(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn('⚠️  data.ts introuvable - Service sans données initiales');
    return { functions: new Set(), dataArrays: new Map() };
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const functions = new Set();
  const dataArrays = new Map();
  
  console.log('📖 Analyse des patterns dans data.ts...');
  
  // Détecter toutes les fonctions exportées
  const functionPatterns = [
    /export\s+(?:async\s+)?function\s+(\w+)/g,
    /export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\(/g
  ];
  
  functionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      functions.add(match[1]);
      console.log(`  🔧 Fonction détectée: ${match[1]}`);
    }
  });
  
  // Détecter tous les arrays de données
  const dataArrayPatterns = [
    /export\s+(?:let|const)\s+(\w+)InMemory\s*:\s*(\w+)\[\]/g,
    /export\s+(?:let|const)\s+(\w+)Data\s*:\s*(\w+)\[\]/g,
    /export\s+(?:let|const)\s+(\w+)\s*:\s*(\w+)\[\]/g
  ];
  
  dataArrayPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const arrayName = match[1];
      const typeName = match[2];
      dataArrays.set(arrayName, typeName);
      console.log(`  📦 Array: ${arrayName} → ${typeName}`);
    }
  });
  
  return { functions, dataArrays };
}

function generateDynamicCrudFunctions(modelName, modelFields) {
  const camelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const pluralName = modelName.toLowerCase() + 's';
  
  let functions = `// =============== ${modelName.toUpperCase()} - Généré DYNAMIQUEMENT ===============\n\n`;
  
  // GET BY ID
  functions += `export async function get${modelName}ById(id: string) {
  try {
    const ${camelName} = await prisma.${camelName}.findUnique({ 
      where: { id: id }
    });
    
    if (!${camelName}) {
      console.warn(\`${modelName} avec ID \${id} non trouvé\`);
      return null;
    }
    
    return ${camelName};
  } catch (error) {
    console.error('Erreur get${modelName}ById:', error);
    throw error;
  }
}

`;

  // GET ALL
  functions += `export async function getAll${modelName}s() {
  try {
    const ${pluralName} = await prisma.${camelName}.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(\`Récupération de \${${pluralName}.length} ${pluralName}\`);
    return ${pluralName};
  } catch (error) {
    console.error('Erreur getAll${modelName}s:', error);
    throw error;
  }
}

`;

  // CREATE
  functions += `export async function create${modelName}(data: any) {
  try {
    // Nettoyer les données automatiquement
    const cleanData = { ...data };
    delete cleanData.id;
    delete cleanData.createdAt;
    delete cleanData.updatedAt;
    
    const new${modelName} = await prisma.${camelName}.create({ 
      data: cleanData 
    });
    
    console.log(\`${modelName} créé avec ID: \${new${modelName}.id}\`);
    return new${modelName};
  } catch (error) {
    console.error('Erreur create${modelName}:', error);
    throw error;
  }
}

`;

  // UPDATE
  functions += `export async function update${modelName}(id: string, data: any) {
  try {
    // Nettoyer les données automatiquement
    const cleanData = { ...data };
    delete cleanData.id;
    delete cleanData.createdAt;
    delete cleanData.updatedAt;
    
    const updated${modelName} = await prisma.${camelName}.update({ 
      where: { id: id },
      data: cleanData
    });
    
    console.log(\`${modelName} mis à jour: \${id}\`);
    return updated${modelName};
  } catch (error) {
    console.error('Erreur update${modelName}:', error);
    throw error;
  }
}

`;

  // DELETE
  functions += `export async function delete${modelName}(id: string) {
  try {
    const deleted${modelName} = await prisma.${camelName}.delete({ 
      where: { id: id }
    });
    
    console.log(\`${modelName} supprimé: \${id}\`);
    return deleted${modelName};
  } catch (error) {
    console.error('Erreur delete${modelName}:', error);
    throw error;
  }
}

`;

  // Générer des fonctions spéciales basées sur les champs
  modelFields.forEach(field => {
    if (field.name === 'email' && field.type === 'string') {
      functions += `export async function get${modelName}ByEmail(email: string) {
  try {
    const ${camelName} = await prisma.${camelName}.findUnique({ 
      where: { email: email }
    });
    
    return ${camelName};
  } catch (error) {
    console.error('Erreur get${modelName}ByEmail:', error);
    throw error;
  }
}

`;
    }
    
    // Fonctions pour les relations (ex: getOrdersByHostId)
    if (field.name.endsWith('Id') && field.name !== 'id') {
      const relationField = field.name;
      const functionName = `get${modelName}sBy${relationField.charAt(0).toUpperCase() + relationField.slice(1)}`;
      
      functions += `export async function ${functionName}(${relationField}: string) {
  try {
    const ${pluralName} = await prisma.${camelName}.findMany({ 
      where: { ${relationField}: ${relationField} },
      orderBy: { createdAt: 'desc' }
    });
    
    return ${pluralName};
  } catch (error) {
    console.error('Erreur ${functionName}:', error);
    throw error;
  }
}

`;
    }
  });
  
  // Aliases pour compatibilité
  functions += `// Aliases pour compatibilité avec l'ancien code\n`;
  functions += `export const get${pluralName} = getAll${modelName}s;\n`;
  functions += `export const add${modelName} = create${modelName};\n`;
  functions += `export const ${pluralName} = getAll${modelName}s;\n\n`;
  
  return functions;
}

function generateCompletePrismaService(interfaces) {
  console.log('🔧 Génération du service Prisma COMPLET et DYNAMIQUE...');
  
  let service = `// Service Prisma généré 100% DYNAMIQUEMENT depuis types.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Configuration Prisma optimisée
export const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// ============================================
// FONCTIONS CRUD GÉNÉRÉES AUTOMATIQUEMENT
// ============================================

`;

  // Générer les fonctions CRUD pour chaque interface
  interfaces.forEach((modelInfo, modelName) => {
    console.log(`  🔧 Génération service: ${modelName}`);
    service += generateDynamicCrudFunctions(modelName, modelInfo.fields);
  });
  
  // Fonctions utilitaires
  service += `// ============================================
// UTILITAIRES DE BASE DE DONNÉES
// ============================================

export async function connectToDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Connexion DB établie');
    return true;
  } catch (error) {
    console.error('❌ Erreur connexion DB:', error);
    return false;
  }
}

export async function disconnectFromDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Déconnexion DB');
    return true;
  } catch (error) {
    console.error('❌ Erreur déconnexion DB:', error);
    return false;
  }
}

export async function healthCheck() {
  try {
    await prisma.$queryRaw\`SELECT 1 as health\`;
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    };
  } catch (error) {
    return { 
      status: 'error', 
      error: error.message, 
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    };
  }
}

export async function resetDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Reset de DB interdit en production');
  }
  
  try {
    console.log('🔄 Reset de la base de données...');
    
    // Supprimer toutes les données dans l'ordre inverse des dépendances
    const models = [${Array.from(interfaces.keys()).map(name => `'${name.toLowerCase()}'`).join(', ')}];
    
    for (const model of models.reverse()) {
      const count = await prisma[model].deleteMany();
      console.log(\`  🗑️  \${model}: \${count.count} entrées supprimées\`);
    }
    
    console.log('✅ Base de données réinitialisée');
    return true;
  } catch (error) {
    console.error('❌ Erreur reset DB:', error);
    throw error;
  }
}

// ============================================
// STATISTIQUES DYNAMIQUES
// ============================================

export async function getDatabaseStats() {
  try {
    const stats = {};
    
    ${Array.from(interfaces.keys()).map(modelName => {
      const camelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
      return `    stats.${camelName}Count = await prisma.${camelName}.count();`;
    }).join('\n')}
    
    return {
      ...stats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erreur stats DB:', error);
    throw error;
  }
}

// Nettoyage automatique à la fermeture
process.on('beforeExit', async () => {
  await disconnectFromDatabase();
});

process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});
`;
  
  return service;
}

// ====================================
// EXÉCUTION PRINCIPALE
// ====================================

try {
  console.log('📖 Lecture des fichiers source...');
  
  const interfaces = extractAllInterfacesFromTypes(typesPath);
  const { functions, dataArrays } = analyzeDataFileForPatterns(dataPath);
  
  if (interfaces.size === 0) {
    console.error('❌ Aucune interface trouvée dans types.ts');
    console.error('💡 Vérifiez que les interfaces sont bien exportées avec "export interface"');
    process.exit(1);
  }
  
  console.log(`📊 Résultats analyse:`);
  console.log(`   - ${interfaces.size} interfaces détectées: ${Array.from(interfaces.keys()).join(', ')}`);
  console.log(`   - ${functions.size} fonctions existantes dans data.ts`);
  console.log(`   - ${dataArrays.size} arrays de données détectés`);
  
  console.log('🔧 Génération du service Prisma...');
  const prismaService = generateCompletePrismaService(interfaces);
  
  // Créer le répertoire si nécessaire
  const serviceDir = path.dirname(servicePath);
  if (!fs.existsSync(serviceDir)) {
    fs.mkdirSync(serviceDir, { recursive: true });
  }
  
  fs.writeFileSync(servicePath, prismaService, 'utf-8');
  console.log(`✅ Service Prisma généré: ${servicePath}`);
  
  console.log('\n🎉 SERVICE PRISMA 100% DYNAMIQUE généré avec succès !');
  console.log(`🚀 Basé entièrement sur vos interfaces TypeScript !`);
  console.log(`📋 Fonctions générées pour chaque modèle:`);
  interfaces.forEach((_, modelName) => {
    console.log(`   - get${modelName}ById, getAll${modelName}s`);
    console.log(`   - create${modelName}, update${modelName}, delete${modelName}`);
  });
  
} catch (error) {
  console.error('❌ Erreur critique:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
