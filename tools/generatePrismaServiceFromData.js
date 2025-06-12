# Corriger le script directement dans le conteneur
docker exec orderspot-app sh -c "cat > /app/tools/generateCompleteSystem.js << 'EOF'
const fs = require('fs');
const path = require('path');

console.log('🚀 Génération SYSTÈME COMPLET ultra-dynamique...');

const dataPath = path.join(__dirname, '../src/lib/data.ts');
const typesPath = path.join(__dirname, '../src/lib/types.ts');
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
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
  
  // Regex pour capturer interface/type avec leurs champs
  const fullTypeRegex = /(?:export\s+)?(?:interface|type)\s+(\w+)\s*=?\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs;
  let match;
  
  while ((match = fullTypeRegex.exec(content)) !== null) {
    const typeName = match[1];
    const typeBody = match[2];
    
    console.log(\`  📋 Type trouvé: \${typeName}\`);
    
    // Analyser les champs
    const fields = [];
    const fieldLines = typeBody.split('\\n').filter(line => line.trim() && !line.trim().startsWith('//'));
    
    fieldLines.forEach(line => {
      const fieldMatch = line.match(/(\\w+)(\\?)\\s*:\\s*([^;,\\n]+)/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const isOptional = fieldMatch[2] === '?';
        const fieldType = fieldMatch[3].trim().replace(/[;,]$/, '');
        
        fields.push({
          name: fieldName,
          type: fieldType,
          optional: isOptional,
          isArray: fieldType.includes('[]'),
          isDate: fieldType.toLowerCase().includes('date'),
          isJson: fieldType.includes('Json') || fieldType.includes('any') || fieldType.includes('object'),
          isString: fieldType.includes('string') || fieldType.includes('String'),
          isNumber: fieldType.includes('number') || fieldType.includes('Number'),
          isBoolean: fieldType.includes('boolean') || fieldType.includes('Boolean')
        });
        
        console.log(\`    - \${fieldName}: \${fieldType}\${isOptional ? ' (optional)' : ''}\`);
      }
    });
    
    models.set(typeName, {
      name: typeName,
      fields: fields
    });
  }
  
  return models;
}

function analyzeDataFile(content) {
  console.log('📖 Extraction des fonctions depuis data.ts...');
  
  const functions = new Set();
  const dataArrays = new Map();
  
  // Extraire les arrays de données
  const dataArrayRegex = /let\\s+(\\w+)InMemory\\s*:\\s*(\\w+)\\[\\]\\s*=/g;
  let match;
  
  while ((match = dataArrayRegex.exec(content)) !== null) {
    const arrayName = match[1];
    const typeName = match[2];
    dataArrays.set(arrayName, typeName);
    console.log(\`  📦 Array: \${arrayName}InMemory → \${typeName}\`);
  }
  
  // Extraire toutes les fonctions exportées
  const functionPatterns = [
    /export\\s+(?:async\\s+)?function\\s+(\\w+)/g,
    /export\\s+(?:const|let)\\s+(\\w+)\\s*=/g
  ];
  
  functionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      functions.add(match[1]);
      console.log(\`  🔧 Fonction: \${match[1]}\`);
    }
  });
  
  return { functions, dataArrays };
}

function mapToPrismaType(tsType, field) {
  // Mapping TypeScript → Prisma plus intelligent
  const cleanType = tsType.replace(/[\\[\\]?]/g, '').trim();
  
  if (field.isArray && !field.isJson) {
    if (field.isString) return 'String[]';
    if (field.isNumber) return 'Int[]';
    return 'String[]'; // fallback
  }
  
  if (field.isDate) return 'DateTime';
  if (field.isJson) return 'Json';
  if (field.isBoolean) return 'Boolean';
  if (field.isNumber) return cleanType.includes('float') || cleanType.includes('Float') ? 'Float' : 'Int';
  if (field.isString) return 'String';
  
  // Types custom (relations potentielles)
  if (cleanType.match(/^[A-Z]\\w+$/)) {
    return 'String'; // Foreign key
  }
  
  return 'String'; // fallback sécurisé
}

function generatePrismaSchema(models) {
  console.log('🏗️ Génération schema Prisma...');
  
  let schema = \`// Généré automatiquement depuis types.ts - ULTRA DYNAMIQUE
generator client {
  provider = \"prisma-client-js\"
}

datasource db {
  provider = \"postgresql\"
  url      = env(\"DATABASE_URL\")
}

\`;
  
  models.forEach((model, modelName) => {
    console.log(\`  🔧 Génération modèle: \${modelName}\`);
    
    schema += \`// \${modelName} model - Généré depuis interface\\n\`;
    schema += \`model \${modelName} {\\n\`;
    
    // ID obligatoire
    schema += \`  id        String   @id @default(cuid())\\n\`;
    
    // Champs détectés
    model.fields.forEach(field => {
      if (field.name === 'id') return; // Déjà ajouté
      
      let prismaType = mapToPrismaType(field.type, field);
      let attributes = '';
      
      if (field.name === 'email') attributes = ' @unique';
      if (field.optional) prismaType += '?';
      
      schema += \`  \${field.name.padEnd(12)} \${prismaType.padEnd(12)}\${attributes}\\n\`;
    });
    
    // Timestamps
    schema += \`  createdAt DateTime @default(now())\\n\`;
    schema += \`  updatedAt DateTime @updatedAt\\n\`;
    schema += \`}\\n\\n\`;
  });
  
  return schema;
}

function generatePrismaService(models, functions) {
  console.log('🔧 Génération service Prisma...');
  
  let service = \`// Généré automatiquement - ULTRA DYNAMIQUE
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

\`;
  
  models.forEach((model, modelName) => {
    console.log(\`  🔧 Génération service: \${modelName}\`);
    
    const camelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    
    service += \`// =============== \${modelName.toUpperCase()} ===============\\n\\n\`;
    
    // CRUD de base
    service += \`export async function get\${modelName}ById(id: string) {
  try {
    return await prisma.\${camelName}.findUnique({ 
      where: { id: id }
    });
  } catch (error) {
    console.error('Erreur get\${modelName}ById:', error);
    throw error;
  }
}

export async function getAll\${modelName}s() {
  try {
    return await prisma.\${camelName}.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
  } catch (error) {
    console.error('Erreur getAll\${modelName}s:', error);
    throw error;
  }
}

export async function create\${modelName}(data: any) {
  try {
    return await prisma.\${camelName}.create({ data });
  } catch (error) {
    console.error('Erreur create\${modelName}:', error);
    throw error;
  }
}

export async function update\${modelName}(id: string, data: any) {
  try {
    return await prisma.\${camelName}.update({ 
      where: { id: id },
      data
    });
  } catch (error) {
    console.error('Erreur update\${modelName}:', error);
    throw error;
  }
}

export async function delete\${modelName}(id: string) {
  try {
    return await prisma.\${camelName}.delete({ 
      where: { id: id }
    });
  } catch (error) {
    console.error('Erreur delete\${modelName}:', error);
    throw error;
  }
}

\`;
    
    // Fonctions spéciales détectées
    const modelLower = modelName.toLowerCase();
    const specialFunctions = Array.from(functions).filter(func => 
      func.toLowerCase().includes(modelLower) && func.includes('By') && !func.includes('ById')
    );
    
    specialFunctions.forEach(func => {
      const byMatch = func.match(/By(\\w+)$/);
      if (byMatch) {
        const field = byMatch[1].toLowerCase();
        service += \`export async function \${func}(\${field}: string) {
  try {
    return await prisma.\${camelName}.findUnique({ 
      where: { \${field}: \${field} }
    });
  } catch (error) {
    console.error('Erreur \${func}:', error);
    throw error;
  }
}

\`;
      }
    });
    
    // Aliases compatibilité
    const pluralLower = modelName.toLowerCase() + 's';
    service += \`// Aliases pour compatibilité\\n\`;
    service += \`export const get\${pluralLower} = getAll\${modelName}s;\\n\`;
    service += \`export const add\${modelName} = create\${modelName};\\n\\n\`;
  });
  
  // Utilitaires
  service += \`// ============================================
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
\`;
  
  return service;
}

// ====================================
// EXÉCUTION PRINCIPALE
// ====================================

try {
  const typesContent = fs.readFileSync(typesPath, 'utf-8');
  const dataContent = fs.readFileSync(dataPath, 'utf-8');
  
  // Phase 1: Analyser types.ts
  const models = analyzeTypesFile(typesContent);
  
  // Phase 2: Analyser data.ts
  const { functions, dataArrays } = analyzeDataFile(dataContent);
  
  console.log(\`📊 Résultats analyse:\`);
  console.log(\`   - \${models.size} modèles détectés\`);
  console.log(\`   - \${functions.size} fonctions détectées\`);
  console.log(\`   - \${dataArrays.size} arrays de données\`);
  
  if (models.size === 0) {
    console.error('❌ Aucun modèle trouvé dans types.ts');
    process.exit(1);
  }
  
  // Phase 3: Générer schema Prisma
  const prismaSchema = generatePrismaSchema(models);
  const prismaDir = path.dirname(schemaPath);
  if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir, { recursive: true });
  }
  fs.writeFileSync(schemaPath, prismaSchema, 'utf-8');
  console.log(\`✅ Schema Prisma généré: \${schemaPath}\`);
  
  // Phase 4: Générer service Prisma
  const prismaService = generatePrismaService(models, functions);
  const serviceDir = path.dirname(servicePath);
  if (!fs.existsSync(serviceDir)) {
    fs.mkdirSync(serviceDir, { recursive: true });
  }
  fs.writeFileSync(servicePath, prismaService, 'utf-8');
  console.log(\`✅ Service Prisma généré: \${servicePath}\`);
  
  console.log('\\n🎉 SYSTÈME COMPLET généré avec succès !');
  console.log(\`🚀 100% basé sur types.ts + data.ts !\`);
  
} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}
EOF"

# Tester le script SOLIDE
docker exec orderspot-app sh -c "cd /app && node tools/generateCompleteSystem.js"
