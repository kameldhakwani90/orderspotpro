const fs = require('fs');
const path = require('path');

console.log('🚀 Génération ULTRA-DYNAMIQUE de prisma-service.ts...');

const dataPath = path.join(__dirname, '../src/lib/data.ts');
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const outputPath = path.join(__dirname, '../src/lib/prisma-service.ts');

// Vérifications de base
if (!fs.existsSync(dataPath)) {
  console.error('❌ data.ts introuvable');
  process.exit(1);
}

if (!fs.existsSync(schemaPath)) {
  console.error('❌ schema.prisma introuvable');
  process.exit(1);
}

console.log('🔍 Phase 1: Analyse dynamique des besoins...');

// ====================================
// PHASE 1: ANALYSER LES BESOINS (data.ts)
// ====================================

function extractNeededFunctions(dataContent) {
  console.log('📖 Extraction des fonctions depuis data.ts...');
  
  const functions = new Set();
  
  // Toutes les patterns possibles d'export
  const patterns = [
    /export\s+(?:async\s+)?function\s+(\w+)/g,
    /export\s+(?:const|let)\s+(\w+)\s*=/g,
    /export\s*\{\s*([^}]+)\s*\}/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(dataContent)) !== null) {
      if (match[1].includes(',')) {
        // Export multiple: export { func1, func2 }
        match[1].split(',').forEach(func => {
          const cleanFunc = func.trim();
          if (cleanFunc) {
            functions.add(cleanFunc);
            console.log(`  📦 ${cleanFunc}`);
          }
        });
      } else {
        functions.add(match[1]);
        console.log(`  📦 ${match[1]}`);
      }
    }
  });
  
  return Array.from(functions);
}

// ====================================
// PHASE 2: ANALYSER L'EXISTANT (prisma-service.ts)
// ====================================

function extractExistingFunctions(serviceContent) {
  console.log('📖 Analyse de l\'existant prisma-service.ts...');
  
  const existing = new Set();
  
  if (!serviceContent) {
    console.log('  ℹ️ Aucun fichier existant, création complète');
    return existing;
  }
  
  const patterns = [
    /export\s+(?:async\s+)?function\s+(\w+)/g,
    /export\s+(?:const|let)\s+(\w+)\s*=/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(serviceContent)) !== null) {
      existing.add(match[1]);
      console.log(`  ✅ Existant: ${match[1]}`);
    }
  });
  
  return existing;
}

// ====================================
// PHASE 3: ANALYSE INTELLIGENTE DES PATTERNS
// ====================================

function analyzeFunctionPattern(funcName) {
  // Patterns de reconnaissance automatique
  const patterns = [
    { regex: /^get(\w+)ById$/, type: 'getById', model: (m) => m[1] },
    { regex: /^get(\w+)By(\w+)$/, type: 'getByField', model: (m) => m[1], field: (m) => m[2] },
    { regex: /^getAll(\w+)s?$/, type: 'getAll', model: (m) => m[1] },
    { regex: /^get(\w+)s$/, type: 'getAll', model: (m) => m[1] },
    { regex: /^create(\w+)$/, type: 'create', model: (m) => m[1] },
    { regex: /^add(\w+)$/, type: 'create', model: (m) => m[1] },
    { regex: /^update(\w+)$/, type: 'update', model: (m) => m[1] },
    { regex: /^edit(\w+)$/, type: 'update', model: (m) => m[1] },
    { regex: /^delete(\w+)$/, type: 'delete', model: (m) => m[1] },
    { regex: /^remove(\w+)$/, type: 'delete', model: (m) => m[1] }
  ];
  
  for (const pattern of patterns) {
    const match = funcName.match(pattern.regex);
    if (match) {
      const result = {
        original: funcName,
        type: pattern.type,
        model: pattern.model(match)
      };
      
      if (pattern.field) {
        result.field = pattern.field(match);
      }
      
      return result;
    }
  }
  
  return null;
}

// ====================================
// PHASE 4: GÉNÉRATION INTELLIGENTE
// ====================================

function generateFunctionCode(analysis, schemaModels) {
  const { original, type, model, field } = analysis;
  
  // Vérifier si le modèle existe dans le schema
  if (!schemaModels.includes(model)) {
    console.log(`  ⚠️ Modèle ${model} non trouvé dans schema, ignoré`);
    return null;
  }
  
  const camelModel = model.charAt(0).toLowerCase() + model.slice(1);
  
  switch (type) {
    case 'getById':
      return `export async function ${original}(id: string) {
  try {
    return await prisma.${camelModel}.findUnique({ 
      where: { id: id }
    });
  } catch (error) {
    console.error('Erreur ${original}:', error);
    throw error;
  }
}`;

    case 'getByField':
      const lowerField = field.toLowerCase();
      return `export async function ${original}(${lowerField}: string) {
  try {
    return await prisma.${camelModel}.findUnique({ 
      where: { ${lowerField}: ${lowerField} }
    });
  } catch (error) {
    console.error('Erreur ${original}:', error);
    throw error;
  }
}`;

    case 'getAll':
      return `export async function ${original}() {
  try {
    return await prisma.${camelModel}.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
  } catch (error) {
    console.error('Erreur ${original}:', error);
    throw error;
  }
}`;

    case 'create':
      return `export async function ${original}(data: any) {
  try {
    return await prisma.${camelModel}.create({ data });
  } catch (error) {
    console.error('Erreur ${original}:', error);
    throw error;
  }
}`;

    case 'update':
      return `export async function ${original}(id: string, data: any) {
  try {
    return await prisma.${camelModel}.update({ 
      where: { id: id },
      data
    });
  } catch (error) {
    console.error('Erreur ${original}:', error);
    throw error;
  }
}`;

    case 'delete':
      return `export async function ${original}(id: string) {
  try {
    return await prisma.${camelModel}.delete({ 
      where: { id: id }
    });
  } catch (error) {
    console.error('Erreur ${original}:', error);
    throw error;
  }
}`;

    default:
      return null;
  }
}

// ====================================
// EXTRACTION DES MODÈLES DU SCHEMA
// ====================================

function extractSchemaModels(schemaContent) {
  console.log('🔍 Extraction des modèles depuis schema.prisma...');
  
  const models = [];
  const modelRegex = /model\s+(\w+)\s*\{/g;
  let match;
  
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    models.push(match[1]);
    console.log(`  ✅ Modèle: ${match[1]}`);
  }
  
  return models;
}

// ====================================
// EXÉCUTION PRINCIPALE
// ====================================

try {
  // Lire les fichiers
  const dataContent = fs.readFileSync(dataPath, 'utf-8');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  
  let existingContent = '';
  if (fs.existsSync(outputPath)) {
    existingContent = fs.readFileSync(outputPath, 'utf-8');
  }
  
  // Phase 1: Analyser les besoins
  const neededFunctions = extractNeededFunctions(dataContent);
  console.log(`📊 ${neededFunctions.length} fonctions nécessaires dans data.ts`);
  
  // Phase 2: Analyser l'existant
  const existingFunctions = extractExistingFunctions(existingContent);
  console.log(`📊 ${existingFunctions.size} fonctions déjà présentes`);
  
  // Phase 3: Calculer les manquantes
  const missingFunctions = neededFunctions.filter(func => !existingFunctions.has(func));
  console.log(`📊 ${missingFunctions.length} fonctions à générer`);
  
  if (missingFunctions.length === 0) {
    console.log('✅ Aucune fonction manquante, prisma-service.ts est à jour !');
    process.exit(0);
  }
  
  // Phase 4: Extraire les modèles du schema
  const schemaModels = extractSchemaModels(schemaContent);
  console.log(`📊 ${schemaModels.length} modèles disponibles`);
  
  // Phase 5: Analyser et générer
  console.log('🔧 Génération des fonctions manquantes...');
  
  const generatedFunctions = [];
  const aliasesToCreate = [];
  
  missingFunctions.forEach(funcName => {
    const analysis = analyzeFunctionPattern(funcName);
    
    if (analysis) {
      const code = generateFunctionCode(analysis, schemaModels);
      if (code) {
        generatedFunctions.push(code);
        console.log(`  ✅ Généré: ${funcName} (${analysis.type} pour ${analysis.model})`);
      }
    } else {
      // Fonction non reconnue, créer un alias intelligent
      const possibleAlias = neededFunctions.find(existing => 
        existing.toLowerCase().includes(funcName.toLowerCase()) ||
        funcName.toLowerCase().includes(existing.toLowerCase())
      );
      
      if (possibleAlias && possibleAlias !== funcName) {
        aliasesToCreate.push(`export const ${funcName} = ${possibleAlias};`);
        console.log(`  🔗 Alias: ${funcName} → ${possibleAlias}`);
      } else {
        console.log(`  ⚠️ Non reconnu: ${funcName} (ignoré)`);
      }
    }
  });
  
  // Phase 6: Construire le nouveau contenu
  let newContent = '';
  
  if (!existingContent) {
    // Première génération complète
    newContent = `// Généré automatiquement - Version ultra-dynamique
// Analyse: data.ts → Détection patterns → Génération intelligente

import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// ============================================
// FONCTIONS GÉNÉRÉES AUTOMATIQUEMENT
// ============================================

`;
  } else {
    // Mode incrémental - garder l'existant
    newContent = existingContent;
    
    if (!newContent.includes('// NOUVELLES FONCTIONS AJOUTÉES')) {
      newContent += `\n\n// ============================================
// NOUVELLES FONCTIONS AJOUTÉES AUTOMATIQUEMENT
// ============================================

`;
    }
  }
  
  // Ajouter les nouvelles fonctions
  if (generatedFunctions.length > 0) {
    newContent += generatedFunctions.join('\n\n') + '\n\n';
  }
  
  // Ajouter les alias
  if (aliasesToCreate.length > 0) {
    newContent += '// Aliases intelligents\n';
    newContent += aliasesToCreate.join('\n') + '\n\n';
  }
  
  // Ajouter les utilitaires si première génération
  if (!existingContent) {
    newContent += `// ============================================
// UTILITAIRES
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

export async function healthCheck() {
  try {
    await prisma.$queryRaw\`SELECT 1\`;
    return { status: 'ok', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'error', error: error.message, timestamp: new Date().toISOString() };
  }
}
`;
  }
  
  // Phase 7: Écrire le fichier
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, newContent, 'utf-8');
  
  console.log('\n🎉 Génération ULTRA-DYNAMIQUE terminée !');
  console.log(`📁 Fichier: ${outputPath}`);
  console.log(`✅ ${generatedFunctions.length} nouvelles fonctions`);
  console.log(`🔗 ${aliasesToCreate.length} nouveaux aliases`);
  console.log('🧠 Analyse intelligente des patterns réussie');
  console.log('🔄 Prochaine fois: mode incrémental automatique');
  
} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}
