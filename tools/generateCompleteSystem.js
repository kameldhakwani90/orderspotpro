const fs = require('fs');
const path = require('path');

console.log('🚀 Génération SYSTÈME COMPLET ultra-dynamique...');

const dataPath = path.join(__dirname, '../src/lib/data.ts');
const typesPath = path.join(__dirname, '../src/lib/types.ts');
const schemaPath = path.join(__dirname, './prisma/schema.prisma');
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
  
  // ✅ REGEX CORRIGÉES - Plus permissives pour capturer les interfaces multi-lignes
  console.log('🔍 Recherche des interfaces...');
  
  // Supprimer les commentaires pour éviter les faux positifs
  const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  
  // Regex pour capturer les interfaces complètes (avec accolades imbriquées)
  const interfacePattern = /export\s+interface\s+(\w+)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/gs;
  const typePattern = /export\s+type\s+(\w+)\s*=\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/gs;
  
  let match;
  
  // Traiter les interfaces
  while ((match = interfacePattern.exec(cleanContent)) !== null) {
    const typeName = match[1];
    const typeBody = match[2];
    console.log(`  📋 Interface trouvée: ${typeName}`);
    processTypeDefinition(typeName, typeBody, models);
  }
  
  // Reset pour les types
  typePattern.lastIndex = 0;
  while ((match = typePattern.exec(cleanContent)) !== null) {
    const typeName = match[1];
    const typeBody = match[2];
    console.log(`  📋 Type trouvé: ${typeName}`);
    processTypeDefinition(typeName, typeBody, models);
  }
  
  // Si aucune interface trouvée, essayer une approche plus simple ligne par ligne
  if (models.size === 0) {
    console.log('⚠️  Aucune interface trouvée avec regex, essai méthode alternative...');
    analyzeTypesLineByLine(content, models);
  }
  
  return models;
}

function analyzeTypesLineByLine(content, models) {
  const lines = content.split('\n');
  let currentInterface = null;
  let braceLevel = 0;
  let interfaceContent = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Détecter le début d'une interface
    const interfaceMatch = line.match(/export\s+interface\s+(\w+)\s*\{?/);
    if (interfaceMatch) {
      currentInterface = interfaceMatch[1];
      braceLevel = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      interfaceContent = '';
      console.log(`  📋 Interface détectée: ${currentInterface}`);
      continue;
    }
    
    // Si on est dans une interface
    if (currentInterface) {
      interfaceContent += line + '\n';
      braceLevel += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      
      // Fin de l'interface
      if (braceLevel <= 0) {
        processTypeDefinition(currentInterface, interfaceContent, models);
        currentInterface = null;
        interfaceContent = '';
      }
    }
  }
}

function processTypeDefinition(typeName, typeBody, models) {
  // Filtrer les types qui ne sont pas des modèles de données
  const skipTypes = ['UserRole', 'Icon', 'LucideIcon', 'MenuPermissions'];
  if (skipTypes.some(skip => typeName.includes(skip))) {
    console.log(`  ⏭️  Ignoré: ${typeName} (pas un modèle de données)`);
    return;
  }
  
  const fields = [];
  const fieldLines = typeBody.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//') && !line.startsWith('*') && line !== '}');
  
  fieldLines.forEach(line => {
    // ✅ REGEX AMÉLIORÉE pour capturer plus de patterns
    const patterns = [
      /(\w+)(\?)?\s*:\s*([^;,\n]+)/,          // standard: nom?: type
      /(\w+)\s*:\s*([^;,\n]+)/,               // sans optionnel
      /"?(\w+)"?\s*:\s*([^;,\n]+)/            // avec guillemets
    ];
    
    let fieldMatch = null;
    for (const pattern of patterns) {
      fieldMatch = line.match(pattern);
      if (fieldMatch) break;
    }
    
    if (fieldMatch) {
      const fieldName = fieldMatch[1];
      const isOptional = fieldMatch[2] === '?' || line.includes('?');
      const fieldType = (fieldMatch[3] || fieldMatch[2]).trim().replace(/[;,]$/, '');
      
      // Ignorer certains champs métiers spécifiques
      if (['menuPermissions', 'employeeType'].includes(fieldName)) {
        console.log(`    ⏭️  Champ ignoré: ${fieldName}`);
        return;
      }
      
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
  
  if (fields.length > 0) {
    models.set(typeName, {
      name: typeName,
      fields: fields
    });
    console.log(`  ✅ Modèle ajouté: ${typeName} (${fields.length} champs)`);
  }
}

function analyzeFieldType(fieldType) {
  const cleanType = fieldType.toLowerCase();
  
  return {
    isArray: fieldType.includes('[]') || fieldType.includes('Array<'),
    isDate: cleanType.includes('date') || fieldType === 'Date',
    isJson: cleanType.includes('json') || cleanType.includes('any') || cleanType.includes('object') || cleanType.includes('record<') || fieldType.includes('{'),
    isString: cleanType.includes('string') || fieldType.includes('"'),
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
  
  // Arrays de données
  const dataArrayRegex = /(?:let|const)\s+(\w+)InMemory\s*:\s*(\w+)\[\]\s*=/g;
  let match;
  
  while ((match = dataArrayRegex.exec(content)) !== null) {
    const arrayName = match[1];
    const typeName = match[2];
    dataArrays.set(arrayName, typeName);
    console.log(`  📦 Array: ${arrayName}InMemory → ${typeName}`);
  }
  
  // Fonctions exportées
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

function mapToPrismaType(tsType, field) {
  // Gérer les unions d'abord
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
    return tsType.includes('float') || tsType.includes('Float') ? 'Float' : 'Int';
  }
  
  if (field.isString || tsType.includes('"')) return 'String';
  
  // Arrays
  if (field.isArray) {
    if (field.isString) return 'String[]';
    if (field.isNumber) return 'Int[]';
    return 'Json'; // Pour les arrays complexes
  }
  
  // Types custom (enum ou relation)
  if (tsType.match(/^[A-Z]\w+$/)) {
    return 'String'; // Foreign key pour relations
  }
  
  // Fallback sécurisé
  return 'String';
}

function generatePrismaSchema(models) {
  console.log('🏗️ Génération schema Prisma...');
  
  let schema = `// Généré automatiquement depuis types.ts
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
    
    schema += `// ${modelName} - Généré depuis interface TypeScript\nmodel ${modelName} {\n`;
    
    // ID automatique (sauf si déjà présent)
    const hasId = model.fields.some(f => f.name === 'id');
    if (!hasId) {
      schema += `  id        String   @id @default(cuid())\n`;
    }
    
    // Champs du modèle
    model.fields.forEach(field => {
      let prismaType = mapToPrismaType(field.type, field);
      let attributes = '';
      
      // Attributs spéciaux
      if (field.name === 'email') attributes = ' @unique';
      if (field.name === 'id' && prismaType === 'String') attributes = ' @id @default(cuid())';
      if (field.optional || field.isOptional) prismaType += '?';
      
      schema += `  ${field.name.padEnd(12)} ${prismaType.padEnd(12)}${attributes}\n`;
    });
    
    // Timestamps automatiques
    schema += `  createdAt DateTime @default(now())\n`;
    schema += `  updatedAt DateTime @updatedAt\n`;
    schema += `}\n\n`;
  });
  
  return schema;
}

function generatePrismaService(models, functions) {
  console.log('🔧 Génération service Prisma...');
  
  let service = `// Service Prisma généré automatiquement
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
    console.log(`  🔧 Génération CRUD: ${modelName}`);
    
    const camelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    
    service += `// =============== ${modelName.toUpperCase()} ===============\n\n`;
    
    // CRUD complet
    service += `export async function get${modelName}ById(id: string) {
  try {
    return await prisma.${camelName}.findUnique({ where: { id } });
  } catch (error) {
    console.error('Erreur get${modelName}ById:', error);
    throw error;
  }
}

export async function getAll${modelName}s() {
  try {
    return await prisma.${camelName}.findMany({
      orderBy: { createdAt: 'desc' }
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
      where: { id },
      data
    });
  } catch (error) {
    console.error('Erreur update${modelName}:', error);
    throw error;
  }
}

export async function delete${modelName}(id: string) {
  try {
    return await prisma.${camelName}.delete({ where: { id } });
  } catch (error) {
    console.error('Erreur delete${modelName}:', error);
    throw error;
  }
}

// Aliases compatibilité
export const get${modelName.toLowerCase()}s = getAll${modelName}s;
export const add${modelName} = create${modelName};

`;
  });
  
  // Utilitaires
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
    await prisma.$queryRaw\`SELECT 1\`;
    return { status: 'ok', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'error', error: error.message, timestamp: new Date().toISOString() };
  }
}
`;
  
  return service;
}

// ====================================
// EXÉCUTION PRINCIPALE
// ====================================

try {
  console.log('📖 Lecture des fichiers...');
  
  const typesContent = fs.readFileSync(typesPath, 'utf-8');
  const dataContent = fs.readFileSync(dataPath, 'utf-8');
  
  console.log('🔍 Analyse types.ts...');
  const models = analyzeTypesFile(typesContent);
  
  console.log('🔍 Analyse data.ts...');
  const { functions, dataArrays } = analyzeDataFile(dataContent);
  
  console.log(`\n📊 Résultats analyse:`);
  console.log(`   - ${models.size} modèles détectés`);
  console.log(`   - ${functions.size} fonctions détectées`);
  console.log(`   - ${dataArrays.size} arrays de données`);
  
  if (models.size === 0) {
    console.error('❌ Aucun modèle trouvé dans types.ts');
    console.error('💡 Vérifiez que les interfaces sont exportées avec "export interface"');
    
    // Debug - afficher un extrait
    console.log('\n🔍 DEBUG - Extrait de types.ts:');
    console.log(typesContent.substring(0, 500) + '...');
    process.exit(1);
  }
  
  // Afficher les modèles trouvés
  console.log('\n📋 Modèles détectés:');
  models.forEach((model, name) => {
    console.log(`   - ${name} (${model.fields.length} champs)`);
  });
  
  console.log('\n🏗️ Génération schema Prisma...');
  const prismaSchema = generatePrismaSchema(models);
  const prismaDir = path.dirname(schemaPath);
  if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir, { recursive: true });
  }
  fs.writeFileSync(schemaPath, prismaSchema, 'utf-8');
  console.log(`✅ Schema: ${schemaPath}`);
  
  console.log('🔧 Génération service Prisma...');
  const prismaService = generatePrismaService(models, functions);
  const serviceDir = path.dirname(servicePath);
  if (!fs.existsSync(serviceDir)) {
    fs.mkdirSync(serviceDir, { recursive: true });
  }
  fs.writeFileSync(servicePath, prismaService, 'utf-8');
  console.log(`✅ Service: ${servicePath}`);
  
  console.log('\n🎉 SYSTÈME COMPLET généré avec succès !');
  console.log('🚀 Prêt pour la migration Prisma !');
  
} catch (error) {
  console.error('❌ Erreur critique:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
