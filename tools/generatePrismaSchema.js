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

function findReverseRelations(targetModel, allRelations) {
  const reverseRels = [];
  
  // allRelations est une Map, pas un array
  allRelations.forEach((relations, sourceModel) => {
    if (Array.isArray(relations)) {
      relations.forEach(relation => {
        if (relation.relatedModel === targetModel && relation.type === 'belongsTo') {
          reverseRels.push({
            sourceModel: sourceModel,
            relationName: relation.relationName
          });
        }
      });
    }
  });
  
  return reverseRels;
}

function generatePrismaModelDynamically(modelName, fields, relations, allRelations) {
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
  
  // Relations détectées (belongsTo)
  if (Array.isArray(relations)) {
    relations.forEach(relation => {
      if (relation.type === 'belongsTo') {
        const relatedField = relation.field.replace(/Id$/, '');
        model += `  ${relatedField.padEnd(15)} ${relation.relatedModel}${relation.optional ? '?' : ''} @relation("${relation.relationName}", fields: [${relation.field}], references: [id])\n`;
      }
    });
  }
  
  // Relations inverses (hasMany)
  const reverseRelations = findReverseRelations(modelName, allRelations);
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

function validateAndCleanSchema(schema) {
  console.log('🔍 Validation et nettoyage du schema...');
  
  const lines = schema.split('\n');
  const cleanedLines = [];
  const models = new Map();
  
  let currentModel = null;
  let currentModelFields = new Set();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Détecter le début d'un modèle
    const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
    if (modelMatch) {
      currentModel = modelMatch[1];
      currentModelFields = new Set();
      cleanedLines.push(line);
      continue;
    }
    
    // Détecter la fin d'un modèle
    if (line.trim() === '}' && currentModel) {
      cleanedLines.push(line);
      currentModel = null;
      currentModelFields = new Set();
      continue;
    }
    
    // Si on est dans un modèle, vérifier les doublons de champs
    if (currentModel) {
      const fieldMatch = line.match(/^\s+(\w+)\s+/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        
        if (currentModelFields.has(fieldName)) {
          console.log(`  ⚠️  Champ dupliqué supprimé: ${currentModel}.${fieldName}`);
          continue; // Ignorer ce champ dupliqué
        }
        
        currentModelFields.add(fieldName);
      }
    }
    
    cleanedLines.push(line);
  }
  
  const cleanedSchema = cleanedLines.join('\n');
  
  // Vérification finale
  const duplicateCheck = /^\s*(\w+)\s+.*\n[\s\S]*?^\s*\1\s+/gm;
  const duplicates = cleanedSchema.match(duplicateCheck);
  
  if (duplicates) {
    console.warn('⚠️  Doublons potentiels détectés, nettoyage supplémentaire...');
    return cleanedSchema.replace(duplicateCheck, (match, fieldName) => {
      console.log(`  🔧 Suppression doublon: ${fieldName}`);
      return match.split('\n')[0] + '\n'; // Garder seulement la première occurrence
    });
  }
  
  console.log('✅ Schema validé et nettoyé');
  return cleanedSchema;
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
    schema += generatePrismaModelDynamically(modelName, fields, modelRelations, relations);
    schema += '\n';
  });
  
  // Valider et nettoyer le schema avant de le retourner
  return validateAndCleanSchema(schema);
}

function generatePrismaModelDynamically(modelName, fields, relations, allRelations) {
  let model = `// ${modelName} model - Généré DYNAMIQUEMENT\n`;
  model += `model ${modelName} {\n`;
  
  // ID obligatoire avec auto-increment - plus compatible
  model += `  id        Int      @id @default(autoincrement())\n`;
  
  // Suivre les champs déjà ajoutés pour éviter les doublons
  const addedFields = new Set(['id']);
  
  // Champs de l'interface
  fields.forEach(field => {
    if (addedFields.has(field.name)) {
      return; // Éviter les doublons
    }
    
    let prismaType = mapToPrismaType(field.type, field.name, field.optional);
    if (field.optional) prismaType += '?';
    
    let attributes = '';
    if (field.name === 'email') attributes = ' @unique';
    
    // Ajuster les types de relations pour utiliser Int au lieu de String
    if (field.name.endsWith('Id') && field.name !== 'id') {
      prismaType = 'Int' + (field.optional ? '?' : '');
    }
    
    model += `  ${field.name.padEnd(15)} ${prismaType.padEnd(12)}${attributes}\n`;
    addedFields.add(field.name);
  });
  
  // Relations détectées (belongsTo) - éviter les doublons
  if (Array.isArray(relations)) {
    relations.forEach(relation => {
      if (relation.type === 'belongsTo') {
        const relatedField = relation.field.replace(/Id$/, '');
        if (!addedFields.has(relatedField)) {
          model += `  ${relatedField.padEnd(15)} ${relation.relatedModel}${relation.optional ? '?' : ''} @relation("${relation.relationName}", fields: [${relation.field}], references: [id])\n`;
          addedFields.add(relatedField);
        }
      }
    });
  }
  
  // Relations inverses (hasMany) - éviter les doublons
  const reverseRelations = findReverseRelations(modelName, allRelations);
  reverseRelations.forEach(reverseRel => {
    const pluralField = reverseRel.sourceModel.toLowerCase() + 's';
    if (!addedFields.has(pluralField)) {
      // Créer un nom de relation unique pour éviter les conflits
      const uniqueRelationName = `${reverseRel.sourceModel}${modelName}`;
      model += `  ${pluralField.padEnd(15)} ${reverseRel.sourceModel}[] @relation("${uniqueRelationName}")\n`;
      addedFields.add(pluralField);
    }
  });
  
  // Timestamps - éviter les doublons
  if (!addedFields.has('createdAt')) {
    model += `  createdAt DateTime @default(now())\n`;
    addedFields.add('createdAt');
  }
  if (!addedFields.has('updatedAt')) {
    model += `  updatedAt DateTime @updatedAt\n`;
    addedFields.add('updatedAt');
  }
  
  model += `}\n`;
  
  return model;
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
