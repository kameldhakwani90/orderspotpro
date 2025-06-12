const fs = require('fs');
const path = require('path');

console.log('🚀 Génération SYSTÈME COMPLET ultra-dynamique...');

// ✅ CHEMINS CORRIGÉS
const dataPath = path.join(__dirname, '../src/lib/data.ts');
const typesPath = path.join(__dirname, '../src/lib/types.ts');
const schemaPath = path.join(__dirname, './prisma/schema.prisma'); // ✅ CORRECTION
const servicePath = path.join(__dirname, '../src/lib/prisma-service.ts');

if (!fs.existsSync(dataPath)) {
  console.error('❌ data.ts introuvable');
  process.exit(1);
}

if (!fs.existsSync(typesPath)) {
  console.error('❌ types.ts introuvable');
  process.exit(1);
}

console.log('🔍 Analyse COMPLÈTE de data.ts + types.ts...');

function analyzeTypesFile(content) {
  console.log('📖 Extraction des types depuis types.ts...');
  
  const models = new Map();
  
  // ✅ REGEX SIMPLIFIÉES ET PLUS ROBUSTES
  const interfaceRegex = /export\s+interface\s+(\w+)\s*\{([^}]+)\}/gs;
  const typeRegex = /export\s+type\s+(\w+)\s*=\s*\{([^}]+)\}/gs;
  
  // Traiter les interfaces
  let match;
  while ((match = interfaceRegex.exec(content)) !== null) {
    const typeName = match[1];
    const typeBody = match[2];
    processTypeDefinition(typeName, typeBody, models);
  }
  
  // Traiter les types
  while ((match = typeRegex.exec(content)) !== null) {
    const typeName = match[1];
    const typeBody = match[2];
    processTypeDefinition(typeName, typeBody, models);
  }
  
  return models;
}

function processTypeDefinition(typeName, typeBody, models) {
  console.log(`  📋 Type trouvé: ${typeName}`);
  
  const fields = [];
  const fieldLines = typeBody.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//') && !line.startsWith('*'));
  
  fieldLines.forEach(line => {
    // ✅ REGEX AMÉLIORÉE pour les champs
    const fieldMatch = line.match(/(\w+)(\?)?\s*:\s*([^;,\n]+)/);
    if (fieldMatch) {
      const fieldName = fieldMatch[1];
      const isOptional = fieldMatch[2] === '?';
      const fieldType = fieldMatch[3].trim().replace(/[;,]$/, '');
      
      // ✅ ANALYSE DE TYPE AMÉLIORÉE
      const typeInfo = analyzeFieldType(fieldType);
      
      fields.push({
        name: fieldName,
        type: fieldType,
        optional: isOptional,
        ...typeInfo
      });
      
      console.log(`    - ${fieldName}: ${fieldType}${isOptional ? ' (optional)' : ''}`);
    }
  });
  
  models.set(typeName, {
    name: typeName,
    fields: fields
  });
}

// ✅ FONCTION D'ANALYSE DE TYPE AMÉLIORÉE
function analyzeFieldType(fieldType) {
  const cleanType = fieldType.toLowerCase();
  
  return {
    isArray: fieldType.includes('[]') || fieldType.includes('Array<'),
    isDate: cleanType.includes('date'),
    isJson: cleanType.includes('json') || cleanType.includes('any') || cleanType.includes('object') || cleanType.includes('record<'),
    isString: cleanType.includes('string'),
    isNumber: cleanType.includes('number') || cleanType.includes('int') || cleanType.includes('float'),
    isBoolean: cleanType.includes('boolean'),
    isUnion: fieldType.includes('|'),
    isOptional: fieldType.includes('undefined') || fieldType.includes('null')
  };
}

function analyzeDataFile(content) {
  console.log('📖 Extraction des fonctions depuis data.ts...');
  
  const functions = new Set();
  const dataArrays = new Map();
  
  // ✅ REGEX AMÉLIORÉE pour les arrays
  const dataArrayRegex = /(?:let|const)\s+(\w+)InMemory\s*:\s*(\w+)\[\]\s*=/g;
  let match;
  
  while ((match = dataArrayRegex.exec(content)) !== null) {
    const arrayName = match[1];
    const typeName = match[2];
    dataArrays.set(arrayName, typeName);
    console.log(`  📦 Array: ${arrayName}InMemory → ${typeName}`);
  }
  
  // ✅ EXTRACTION DE FONCTIONS AMÉLIORÉE
  const functionPatterns = [
    /export\s+(?:async\s+)?function\s+(\w+)/g,
    /export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\(/g
  ];
  
  functionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      functions.add(match[1]);
      console.log(`  🔧 Fonction: ${match[1]}`);
    }
  });
  
  return { functions, dataArrays };
}

// ✅ MAPPING PRISMA AMÉLIORÉ
function mapToPrismaType(tsType, field) {
  const cleanType = tsType.replace(/[\[\]?]/g, '').trim();
  
  // Gérer les unions
  if (field.isUnion) {
    const types = tsType.split('|').map(t => t.trim());
    const nonNullTypes = types.filter(t => t !== 'null' && t !== 'undefined');
    if (nonNullTypes.length === 1) {
      return mapToPrismaType(nonNullTypes[0], { ...field, isUnion: false });
    }
  }
  
  // Types de base
  if (field.isDate) return 'DateTime';
  if (field.isJson) return 'Json';
  if (field.isBoolean) return 'Boolean';
  if (field.isNumber) {
    return cleanType.includes('float') || cleanType.includes('Float') ? 'Float' : 'Int';
  }
  if (field.isString) return 'String';
  
  // Arrays
  if (field.isArray) {
    if (field.isString) return 'String[]';
    if (field.isNumber) return 'Int[]';
    return 'Json'; // Pour les arrays complexes
  }
  
  // Fallback
  return 'String';
}

function generatePrismaSchema(models) {
  console.log('🏗️ Génération schema Prisma...');
  
  let schema = `// Généré automatiquement depuis types.ts - ULTRA DYNAMIQUE
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;
  
  models.forEach((model, modelName) => {
    console.log(`  🔧 Génération modèle: ${modelName}`);
    
    schema += `// ${modelName} model - Généré depuis interface\n`;
    schema += `model ${modelName} {\n`;
    
    // ID obligatoire
    schema += `  id        String   @id @default(cuid())\n`;
    
    // Champs détectés
    model.fields.forEach(field => {
      if (field.name === 'id') return;
      
      let prismaType = mapToPrismaType(field.type, field);
      let attributes = '';
      
      if (field.name === 'email') attributes = ' @unique';
      if (field.optional || field.isOptional) prismaType += '?';
      
      schema += `  ${field.name.padEnd(12)} ${prismaType.padEnd(12)}${attributes}\n`;
    });
    
    // Timestamps
    schema += `  createdAt DateTime @default(now())\n`;
    schema += `  updatedAt DateTime @updatedAt\n`;
    schema += `}\n\n`;
  });
  
  return schema;
}

function generatePrismaService(models, functions) {
  console.log('🔧 Génération service Prisma...');
  
  let service = `// Généré automatiquement - ULTRA DYNAMIQUE
import { PrismaClient } from '@prisma/client';

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
  
  models.forEach((model, modelName) => {
    console.log(`  🔧 Génération service: ${modelName}`);
    
    const camelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    
    service += `// =============== ${modelName.toUpperCase()} ===============\n\n`;
    
    // CRUD de base
    service += `export async function get${modelName}ById(id: string) {
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
    
    // Fonctions spéciales détectées
    const modelLower = modelName.toLowerCase();
    const specialFunctions = Array.from(functions).filter(func => 
      func.toLowerCase().includes(modelLower) && func.includes('By') && !func.includes('ById')
    );
    
    specialFunctions.forEach(func => {
      const byMatch = func.match(/By(\w+)$/);
      if (byMatch) {
        const field = byMatch[1].toLowerCase();
        service += `export async function ${func}(${field}: string) {
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
    
    // Aliases compatibilité
    const pluralLower = modelName.toLowerCase() + 's';
    service += `// Aliases pour compatibilité\n`;
    service += `export const get${pluralLower} = getAll${modelName}s;\n`;
    service += `export const add${modelName} = create${modelName};\n\n`;
  });
  
  // ✅ CORRECTION - Échapper les backquotes
  service += `// ============================================
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
    await prisma.$queryRaw\\\`SELECT 1\\\`;
    return { status: 'ok', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'error', error: error.message, timestamp: new Date().toISOString() };
  }
}
`;
  
  return service;
}

// ====================================
// EXÉCUTION PRINCIPALE AVEC GESTION D'ERREURS
// ====================================

try {
  console.log('📖 Lecture des fichiers...');
  
  const typesContent = fs.readFileSync(typesPath, 'utf-8');
  const dataContent = fs.readFileSync(dataPath, 'utf-8');
  
  console.log('🔍 Analyse des types...');
  const models = analyzeTypesFile(typesContent);
  
  console.log('🔍 Analyse des données...');
  const { functions, dataArrays } = analyzeDataFile(dataContent);
  
  console.log(`📊 Résultats analyse:`);
  console.log(`   - ${models.size} modèles détectés`);
  console.log(`   - ${functions.size} fonctions détectées`);
  console.log(`   - ${dataArrays.size} arrays de données`);
  
  if (models.size === 0) {
    console.error('❌ Aucun modèle trouvé dans types.ts');
    console.error('💡 Vérifiez que les interfaces sont bien exportées avec "export interface"');
    process.exit(1);
  }
  
  console.log('🏗️ Génération du schema Prisma...');
  const prismaSchema = generatePrismaSchema(models);
  const prismaDir = path.dirname(schemaPath);
  if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir, { recursive: true });
  }
  fs.writeFileSync(schemaPath, prismaSchema, 'utf-8');
  console.log(`✅ Schema Prisma généré: ${schemaPath}`);
  
  console.log('🔧 Génération du service Prisma...');
  const prismaService = generatePrismaService(models, functions);
  const serviceDir = path.dirname(servicePath);
  if (!fs.existsSync(serviceDir)) {
    fs.mkdirSync(serviceDir, { recursive: true });
  }
  fs.writeFileSync(servicePath, prismaService, 'utf-8');
  console.log(`✅ Service Prisma généré: ${servicePath}`);
  
  console.log('\n🎉 SYSTÈME COMPLET généré avec succès !');
  console.log(`🚀 100% basé sur types.ts + data.ts !`);
  
} catch (error) {
  console.error('❌ Erreur critique:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
