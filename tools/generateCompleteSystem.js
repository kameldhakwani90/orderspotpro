const fs = require('fs');
const path = require('path');

console.log('🚀 Génération SYSTÈME COMPLET ultra-dynamique...');
console.log('📋 Schema Prisma + Service + Types - 100% basé sur data.ts');

const dataPath = path.join(__dirname, '../src/lib/data.ts');
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const servicePath = path.join(__dirname, '../src/lib/prisma-service.ts');

// Vérifications
if (!fs.existsSync(dataPath)) {
  console.error('❌ data.ts introuvable');
  process.exit(1);
}

console.log('🔍 Phase 1: Analyse COMPLÈTE de data.ts...');

// ====================================
// PHASE 1: ANALYSE ULTRA-DYNAMIQUE DE DATA.TS
// ====================================

function analyzeDataFile(content) {
  console.log('📖 Analyse ultra-dynamique de data.ts...');
  
  const result = {
    models: new Map(),
    functions: new Set(),
    interfaces: new Set()
  };
  
  // 1. Extraire les interfaces TypeScript
  const interfaceRegex = /interface\s+(\w+)\s*\{([^}]+)\}/g;
  let match;
  
  while ((match = interfaceRegex.exec(content)) !== null) {
    const interfaceName = match[1];
    const fields = match[2];
    
    result.interfaces.add(interfaceName);
    
    // Analyser les champs de l'interface
    const fieldLines = fields.split('\n').filter(line => line.trim());
    const parsedFields = [];
    
    fieldLines.forEach(line => {
      const fieldMatch = line.match(/(\w+)[\?]?\s*:\s*([^;]+)/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const fieldType = fieldMatch[2].trim();
        
        parsedFields.push({
          name: fieldName,
          type: fieldType,
          optional: line.includes('?'),
          isArray: fieldType.includes('[]'),
          isDate: fieldType.includes('Date'),
          isJson: fieldType.includes('Json') || fieldType.includes('object'),
          isRelation: fieldType.match(/^[A-Z]\w+$/) && !['String', 'Number', 'Boolean', 'Date'].includes(fieldType)
        });
      }
    });
    
    result.models.set(interfaceName, {
      name: interfaceName,
      fields: parsedFields
    });
    
    console.log(`  📋 Interface ${interfaceName}: ${parsedFields.length} champs`);
  }
  
  // 2. Extraire les arrays de données (usersInMemory, etc.)
  const dataArrayRegex = /let\s+(\w+)InMemory\s*:\s*(\w+)\[\]\s*=/g;
  while ((match = dataArrayRegex.exec(content)) !== null) {
    const arrayName = match[1];
    const typeName = match[2];
    
    if (result.models.has(typeName)) {
      console.log(`  📦 Données: ${arrayName}InMemory → ${typeName}`);
    }
  }
  
  // 3. Extraire toutes les fonctions exportées
  const functionPatterns = [
    /export\s+(?:async\s+)?function\s+(\w+)/g,
    /export\s+(?:const|let)\s+(\w+)\s*=/g
  ];
  
  functionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      result.functions.add(match[1]);
      console.log(`  🔧 Fonction: ${match[1]}`);
    }
  });
  
  return result;
}

// ====================================
// PHASE 2: GÉNÉRATION SCHEMA PRISMA DYNAMIQUE
// ====================================

function generateDynamicPrismaSchema(analysis) {
  console.log('🏗️ Génération schema Prisma DYNAMIQUE...');
  
  let schema = `// Généré automatiquement depuis data.ts - ULTRA DYNAMIQUE
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;
  
  // Générer chaque modèle dynamiquement
  analysis.models.forEach((model, modelName) => {
    console.log(`  🔧 Génération modèle: ${modelName}`);
    
    schema += `// ${modelName} model - Généré depuis interface\n`;
    schema += `model ${modelName} {\n`;
    
    // Champs de base (toujours présents)
    schema += `  id        String   @id @default(cuid())\n`;
    
    // Analyser chaque champ de l'interface
    model.fields.forEach(field => {
      if (field.name === 'id') return; // Déjà ajouté
      
      let prismaType = mapToPrismaType(field.type, field.isArray);
      let attributes = '';
      
      // Gestion des types spéciaux
      if (field.name === 'email') {
        attributes = ' @unique';
      }
      
      if (field.optional) {
        prismaType += '?';
      }
      
      if (field.isArray) {
        // Les arrays sont gérés différemment selon le type
        if (field.type.includes('String')) {
          prismaType = 'String[]';
        } else if (field.type.includes('Json')) {
          prismaType = 'Json[]';
        }
      }
      
      schema += `  ${field.name.padEnd(12)} ${prismaType.padEnd(12)}${attributes}\n`;
    });
    
    // Timestamps automatiques
    schema += `  createdAt DateTime @default(now())\n`;
    schema += `  updatedAt DateTime @updatedAt\n`;
    
    schema += `}\n\n`;
  });
  
  return schema;
}

function mapToPrismaType(tsType, isArray) {
  // Mapping TypeScript → Prisma
  const typeMap = {
    'string': 'String',
    'String': 'String',
    'number': isArray ? 'Int[]' : 'Int',
    'Int': isArray ? 'Int[]' : 'Int',
    'float': isArray ? 'Float[]' : 'Float',
    'Float': isArray ? 'Float[]' : 'Float',
    'boolean': 'Boolean',
    'Boolean': 'Boolean',
    'Date': 'DateTime',
    'DateTime': 'DateTime',
    'object': 'Json',
    'Json': 'Json',
    'any': 'Json'
  };
  
  // Nettoyer le type (enlever [], ?, etc.)
  const cleanType = tsType.replace(/[\[\]?]/g, '').trim();
  
  return typeMap[cleanType] || 'String';
}

// ====================================
// PHASE 3: GÉNÉRATION SERVICE PRISMA DYNAMIQUE
// ====================================

function generateDynamicPrismaService(analysis) {
  console.log('🔧 Génération service Prisma DYNAMIQUE...');
  
  let service = `// Généré automatiquement depuis data.ts - ULTRA DYNAMIQUE
// Service Prisma complet avec toutes les fonctions détectées

import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// ============================================
// FONCTIONS CRUD GÉNÉRÉES DYNAMIQUEMENT
// ============================================

`;
  
  // Générer les fonctions pour chaque modèle
  analysis.models.forEach((model, modelName) => {
    console.log(`  🔧 Génération service: ${modelName}`);
    
    const camelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    
    service += `// =============== ${modelName.toUpperCase()} ===============\n\n`;
    
    // Fonctions CRUD de base
    service += generateCrudFunctions(modelName, camelName);
    
    // Fonctions spéciales détectées dans data.ts
    service += generateSpecialFunctions(modelName, analysis.functions);
    
    service += `\n`;
  });
  
  // Génération des aliases pour compatibilité
  service += generateCompatibilityAliases(analysis);
  
  // Utilitaires
  service += `
// ============================================
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
  
  return service;
}

function generateCrudFunctions(modelName, camelName) {
  return `export async function get${modelName}ById(id: string) {
  try {
    return await prisma.${camelName}.findUnique({ 
      where: { id: id }
    });
  } catch (error) {
    console.error('Erreur get${modelName}ById:', error);
    throw error;
  }
}

export async function getAll${modelName}s() {
  try {
    return await prisma.${camelName}.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
  } catch (error) {
    console.error('Erreur getAll${modelName}s:', error);
    throw error;
  }
}

export async function create${modelName}(data: any) {
  try {
    return await prisma.${camelName}.create({ data });
  } catch (error) {
    console.error('Erreur create${modelName}:', error);
    throw error;
  }
}

export async function update${modelName}(id: string, data: any) {
  try {
    return await prisma.${camelName}.update({ 
      where: { id: id },
      data
    });
  } catch (error) {
    console.error('Erreur update${modelName}:', error);
    throw error;
  }
}

export async function delete${modelName}(id: string) {
  try {
    return await prisma.${camelName}.delete({ 
      where: { id: id }
    });
  } catch (error) {
    console.error('Erreur delete${modelName}:', error);
    throw error;
  }
}

`;
}

function generateSpecialFunctions(modelName, allFunctions) {
  let special = '';
  
  // Chercher des fonctions spéciales pour ce modèle
  const modelLower = modelName.toLowerCase();
  const specialFunctions = Array.from(allFunctions).filter(func => 
    func.toLowerCase().includes(modelLower) && 
    (func.includes('ByEmail') || func.includes('ByName') || func.includes('By'))
  );
  
  specialFunctions.forEach(func => {
    // Extraire le field depuis le nom de fonction
    const byMatch = func.match(/By(\w+)$/);
    if (byMatch) {
      const field = byMatch[1].toLowerCase();
      const camelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
      
      special += `export async function ${func}(${field}: string) {
  try {
    return await prisma.${camelName}.findUnique({ 
      where: { ${field}: ${field} }
    });
  } catch (error) {
    console.error('Erreur ${func}:', error);
    throw error;
  }
}

`;
    }
  });
  
  return special;
}

function generateCompatibilityAliases(analysis) {
  let aliases = `// ============================================
// ALIASES POUR COMPATIBILITÉ
// ============================================

`;
  
  // Générer des aliases pour les anciennes fonctions
  analysis.models.forEach((model, modelName) => {
    const pluralLower = modelName.toLowerCase() + 's';
    
    aliases += `// Aliases pour ${modelName}\n`;
    aliases += `export const get${pluralLower} = getAll${modelName}s;\n`;
    aliases += `export const add${modelName} = create${modelName};\n`;
    
    // Aliases spéciaux
    if (modelName === 'User') {
      aliases += `export const getUsers = getAllUsers;\n`;
    }
    if (modelName === 'Host') {
      aliases += `export const getHosts = getAllHosts;\n`;
    }
    
    aliases += `\n`;
  });
  
  return aliases;
}

// ====================================
// EXÉCUTION PRINCIPALE
// ====================================

try {
  const dataContent = fs.readFileSync(dataPath, 'utf-8');
  
  // Phase 1: Analyser data.ts complètement
  const analysis = analyzeDataFile(dataContent);
  
  console.log(`📊 Résultats analyse:`);
  console.log(`   - ${analysis.models.size} modèles détectés`);
  console.log(`   - ${analysis.functions.size} fonctions détectées`);
  console.log(`   - ${analysis.interfaces.size} interfaces trouvées`);
  
  if (analysis.models.size === 0) {
    console.error('❌ Aucun modèle trouvé dans data.ts');
    process.exit(1);
  }
  
  // Phase 2: Générer schema Prisma
  console.log('\n🏗️ Phase 2: Génération schema Prisma...');
  const prismaSchema = generateDynamicPrismaSchema(analysis);
  
  // Créer le répertoire prisma
  const prismaDir = path.dirname(schemaPath);
  if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir, { recursive: true });
  }
  
  fs.writeFileSync(schemaPath, prismaSchema, 'utf-8');
  console.log(`✅ Schema Prisma généré: ${schemaPath}`);
  
  // Phase 3: Générer service Prisma
  console.log('\n🔧 Phase 3: Génération service Prisma...');
  const prismaService = generateDynamicPrismaService(analysis);
  
  // Créer le répertoire lib
  const serviceDir = path.dirname(servicePath);
  if (!fs.existsSync(serviceDir)) {
    fs.mkdirSync(serviceDir, { recursive: true });
  }
  
  fs.writeFileSync(servicePath, prismaService, 'utf-8');
  console.log(`✅ Service Prisma généré: ${servicePath}`);
  
  console.log('\n🎉 SYSTÈME COMPLET généré avec succès !');
  console.log('📋 Résumé:');
  console.log(`   - Schema Prisma: ${analysis.models.size} modèles`);
  console.log(`   - Service Prisma: ${analysis.models.size * 5} fonctions CRUD`);
  console.log(`   - Fonctions spéciales: détectées automatiquement`);
  console.log(`   - Aliases: générés pour compatibilité`);
  console.log('\n🚀 100% basé sur data.ts - Aucun hardcoding !');
  
} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}