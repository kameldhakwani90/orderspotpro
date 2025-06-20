const fs = require('fs');
const path = require('path');

console.log('🔧 Génération COMPLÈTEMENT DYNAMIQUE du schema Prisma...');

// Lecture des fichiers source
const dataPath = path.join(__dirname, '../src/lib/data.ts');
const typesPath = path.join(__dirname, '../src/lib/types.ts');

if (!fs.existsSync(dataPath)) {
  console.error('❌ data.ts introuvable');
  process.exit(1);
}

if (!fs.existsSync(typesPath)) {
  console.error('❌ types.ts introuvable');
  process.exit(1);
}

function extractAllInterfaces(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const interfaces = new Map();
  
  // Regex pour extraire TOUTES les interfaces
  const interfaceRegex = /export\s+interface\s+(\w+)\s*\{([^}]+)\}/gs;
  let match;
  
  while ((match = interfaceRegex.exec(content)) !== null) {
    const typeName = match[1];
    const typeBody = match[2];
    
    const fields = [];
    const fieldLines = typeBody.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'));
    
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
    
    interfaces.set(typeName, fields);
    console.log(`  📋 Interface: ${typeName} (${fields.length} champs)`);
  }
  
  return interfaces;
}

function detectRelations(interfaces) {
  console.log('🔍 Détection DYNAMIQUE des relations...');
  const relations = new Map();
  
  interfaces.forEach((fields, modelName) => {
    const modelRelations = [];
    
    fields.forEach(field => {
      // Détecter les IDs de relation (ex: hostId, userId)
      if (field.name.endsWith('Id') && field.name !== 'id') {
        const relatedModel = field.name.replace(/Id$/, '');
        const capitalizedModel = relatedModel.charAt(0).toUpperCase() + relatedModel.slice(1);
        
        // Vérifier si le modèle cible existe
        if (interfaces.has(capitalizedModel)) {
          modelRelations.push({
            type: 'belongsTo',
            field: field.name,
            relatedModel: capitalizedModel,
            relationName: `${modelName}${capitalizedModel}`,
            optional: field.optional
          });
          console.log(`    🔗 ${modelName}.${field.name} → ${capitalizedModel}`);
        }
      }
      
      // Détecter les arrays de IDs (ex: tagIds: string[])
      if (field.name.endsWith('Ids') && field.type.includes('[]')) {
        const relatedModel = field.name.replace(/Ids$/, '');
        const capitalizedModel = relatedModel.charAt(0).toUpperCase() + relatedModel.slice(1);
        
        if (interfaces.has(capitalizedModel)) {
          modelRelations.push({
            type: 'hasMany',
            field: field.name,
            relatedModel: capitalizedModel,
            relationName: `${modelName}${capitalizedModel}s`,
            optional: field.optional
          });
          console.log(`    🔗 ${modelName}.${field.name} → ${capitalizedModel}[]`);
        }
      }
    });
    
    relations.set(modelName, modelRelations);
  });
  
  return relations;
}

function mapToPrismaType(tsType, fieldName, isOptional) {
  const cleanType = tsType.replace(/[\[\]?]/g, '').trim();
  
  // Types de base
  if (cleanType === 'string' || cleanType === 'String') return 'String';
  if (cleanType === 'number' || cleanType === 'Number') {
    // Détecter automatiquement Float vs Int
    if (fieldName.toLowerCase().includes('prix') || 
        fieldName.toLowerCase().includes('price') ||
        fieldName.toLowerCase().includes('montant') ||
        fieldName.toLowerCase().includes('taux')) {
      return 'Float';
    }
    return 'Int';
  }
  if (cleanType === 'boolean' || cleanType === 'Boolean') return 'Boolean';
  if (cleanType === 'Date' || cleanType === 'DateTime') return 'DateTime';
  
  // Arrays
  if (tsType.includes('[]')) {
    if (cleanType === 'string') return 'String[]';
    if (cleanType === 'number') return 'Int[]';
    return 'Json'; // Pour les arrays complexes
  }
  
  // Types complexes ou unions
  if (tsType.includes('|') || cleanType === 'any' || cleanType === 'object') return 'Json';
  
  // Par défaut
  return 'String';
}

function generatePrismaModelDynamically(modelName, fields, relations) {
  let model = `// ${modelName} model - Généré DYNAMIQUEMENT\n`;
  model += `model ${modelName} {\n`;
  
  // ID obligatoire
  model += `  id        String   @id @default(cuid())\n`;
  
  // Champs de l'interface
  fields.forEach(field => {
    if (field.name === 'id') return; // Éviter les doublons
    
    let prismaType = mapToPrismaType(field.type, field.name, field.optional);
    if (field.optional) prismaType += '?';
    
    let attributes = '';
    if (field.name === 'email') attributes = ' @unique';
    
    model += `  ${field.name.padEnd(15)} ${prismaType.padEnd(12)}${attributes}\n`;
  });
  
  // Relations détectées
  relations.forEach(relation => {
    if (relation.type === 'belongsTo') {
      const relatedField = relation.field.replace(/Id$/, '');
      model += `  ${relatedField.padEnd(15)} ${relation.relatedModel}${relation.optional ? '?' : ''} @relation("${relation.relationName}", fields: [${relation.field}], references: [id])\n`;
    }
  });
  
  // Relations inverses (hasMany)
  const reverseRelations = findReverseRelations(modelName, relations);
  reverseRelations.forEach(reverseRel => {
    const pluralField = reverseRel.sourceModel.toLowerCase() + 's';
    model += `  ${pluralField.padEnd(15)} ${reverseRel.sourceModel}[] @relation("${reverseRel.relationName}")\n`;
  });
  
  // Timestamps
  model += `  createdAt DateTime @default(now())\n`;
  model += `  updatedAt DateTime @updatedAt\n`;
  model += `}\n`;
  
  return model;
}

function findReverseRelations(targetModel, allRelations) {
  const reverseRels = [];
  
  allRelations.forEach((relations, sourceModel) => {
    relations.forEach(relation => {
      if (relation.relatedModel === targetModel && relation.type === 'belongsTo') {
        reverseRels.push({
          sourceModel: sourceModel,
          relationName: relation.relationName
        });
      }
    });
  });
  
  return reverseRels;
}

function generateCompletePrismaSchema(interfaces) {
  console.log('🏗️ Génération COMPLÈTEMENT DYNAMIQUE du schema...');
  
  let schema = `// Schema Prisma généré COMPLÈTEMENT DYNAMIQUEMENT depuis types.ts
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

  const relations = detectRelations(interfaces);
  
  // Générer tous les modèles dynamiquement
  interfaces.forEach((fields, modelName) => {
    const modelRelations = relations.get(modelName) || [];
    schema += generatePrismaModelDynamically(modelName, fields, modelRelations);
    schema += '\n';
  });
  
  return schema;
}

// Créer le répertoire prisma
const prismaDir = path.join(__dirname, '../prisma');
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
  console.log(`📁 Répertoire créé: ${prismaDir}`);
}

try {
  const interfaces = extractAllInterfaces(typesPath);
  
  if (interfaces.size === 0) {
    console.error('❌ Aucune interface trouvée dans types.ts');
    process.exit(1);
  }
  
  console.log(`📊 ${interfaces.size} interfaces détectées: ${Array.from(interfaces.keys()).join(', ')}`);
  
  const schema = generateCompletePrismaSchema(interfaces);
  const schemaPath = path.join(prismaDir, 'schema.prisma');
  
  fs.writeFileSync(schemaPath, schema);
  console.log('✅ Schema Prisma généré COMPLÈTEMENT DYNAMIQUEMENT');
  console.log(`📁 Fichier créé: ${schemaPath}`);
  console.log(`🎯 100% basé sur vos interfaces TypeScript !`);
  
} catch (err) {
  console.error('❌ Erreur lors de la génération du schema:', err.message);
  process.exit(1);
}
