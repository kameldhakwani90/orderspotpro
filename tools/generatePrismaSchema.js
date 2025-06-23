const fs = require('fs');
const path = require('path');

console.log('🔧 Génération COMPLÈTEMENT DYNAMIQUE du schema Prisma - VERSION AMÉLIORÉE...');

// ====================================
// GARDE TOUTE LA LOGIQUE EXISTANTE
// ====================================

// Lecture des fichiers source (GARDE)
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

// GARDE LA FONCTION EXISTANTE extractAllInterfaces
function extractAllInterfaces(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const interfaces = new Map();
  
  // Regex pour extraire TOUTES les interfaces (GARDE)
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

// ====================================
// AMÉLIORATION 1: DÉTECTION RELATIONS FIREBASE INTELLIGENTE
// ====================================

function detectRelationsFirebaseIntelligent(interfaces) {
  console.log('🔍 Détection FIREBASE intelligente des relations...');
  const relations = new Map();
  
  interfaces.forEach((fields, modelName) => {
    const modelRelations = [];
    
    fields.forEach(field => {
      // GARDE LA LOGIQUE EXISTANTE ET AJOUTE DES AMÉLIORATIONS
      
      // 1. Relations Firebase classiques (GARDE)
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
      
      // 2. Arrays de IDs (GARDE)
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
      
      // ====================================
      // NOUVEAUTÉ: DÉTECTION FIREBASE AVANCÉE
      // ====================================
      
      // 3. Relations Firebase avec noms personnalisés
      if (field.type.includes('DocumentReference') || field.type.includes('Firestore')) {
        const relationInfo = inferFirebaseRelation(field.name, field.type, interfaces);
        if (relationInfo) {
          modelRelations.push(relationInfo);
          console.log(`    🔥 Firebase: ${modelName}.${field.name} → ${relationInfo.relatedModel}`);
        }
      }
      
      // 4. Relations implicites par nom (ex: "owner", "author", "creator")
      const implicitRelations = ['owner', 'author', 'creator', 'user', 'host', 'client'];
      if (implicitRelations.includes(field.name.toLowerCase()) && field.type === 'string') {
        const implicitModel = field.name.charAt(0).toUpperCase() + field.name.slice(1);
        if (interfaces.has(implicitModel)) {
          modelRelations.push({
            type: 'belongsTo',
            field: field.name + 'Id', // Créer le champ ID correspondant
            relatedModel: implicitModel,
            relationName: `${modelName}${implicitModel}`,
            optional: field.optional,
            implicit: true
          });
          console.log(`    💡 Implicite: ${modelName}.${field.name} → ${implicitModel}`);
        }
      }
    });
    
    relations.set(modelName, modelRelations);
  });
  
  return relations;
}

// NOUVELLE FONCTION: Inférer relations Firebase
function inferFirebaseRelation(fieldName, fieldType, interfaces) {
  // Logique pour détecter les relations Firebase complexes
  if (fieldType.includes('DocumentReference')) {
    // DocumentReference<User> → User
    const typeMatch = fieldType.match(/DocumentReference<(\w+)>/);
    if (typeMatch && interfaces.has(typeMatch[1])) {
      return {
        type: 'belongsTo',
        field: fieldName + 'Id',
        relatedModel: typeMatch[1],
        relationName: `Firebase${fieldName}${typeMatch[1]}`,
        optional: true,
        firebase: true
      };
    }
  }
  
  return null;
}

// GARDE LA FONCTION mapToPrismaType EXISTANTE (avec petites améliorations)
function mapToPrismaType(tsType, fieldName, isOptional) {
  const cleanType = tsType.replace(/[\[\]?]/g, '').trim();
  
  // GARDE TOUTE LA LOGIQUE EXISTANTE
  if (cleanType === 'string' || cleanType === 'String') return 'String';
  if (cleanType === 'number' || cleanType === 'Number') {
    // Détecter automatiquement Float vs Int (GARDE)
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
  
  // NOUVEAUTÉ: Support des types Firebase
  if (cleanType.includes('Timestamp')) return 'DateTime';
  if (cleanType.includes('DocumentReference')) return 'String'; // Stocker l'ID
  if (cleanType.includes('GeoPoint')) return 'Json';
  
  // Arrays (GARDE)
  if (tsType.includes('[]')) {
    if (cleanType === 'string') return 'String[]';
    if (cleanType === 'number') return 'Int[]';
    return 'Json'; // Pour les arrays complexes
  }
  
  // Types complexes ou unions (GARDE)
  if (tsType.includes('|') || cleanType === 'any' || cleanType === 'object') return 'Json';
  
  // Par défaut (GARDE)
  return 'String';
}

// GARDE LA FONCTION findReverseRelations (avec amélioration mineure)
function findReverseRelations(targetModel, allRelations) {
  const reverseRels = [];
  
  allRelations.forEach((relations, sourceModel) => {
    if (Array.isArray(relations)) {
      relations.forEach(relation => {
        if (relation.relatedModel === targetModel && relation.type === 'belongsTo') {
          reverseRels.push({
            sourceModel: sourceModel,
            relationName: relation.relationName,
            firebase: relation.firebase || false // NOUVEAUTÉ: flag Firebase
          });
        }
      });
    }
  });
  
  return reverseRels;
}

// GARDE LA FONCTION generatePrismaModelDynamically AVEC AMÉLIORATIONS MINEURES
function generatePrismaModelDynamically(modelName, fields, relations, allRelations) {
  let model = `// ${modelName} model - Généré DYNAMIQUEMENT\n`;
  model += `model ${modelName} {\n`;
  
  // ID obligatoire avec auto-increment (GARDE)
  model += `  id        Int      @id @default(autoincrement())\n`;
  
  // Suivre les champs déjà ajoutés pour éviter les doublons (GARDE)
  const addedFields = new Set(['id']);
  
  // Champs de l'interface (GARDE TOUTE LA LOGIQUE)
  if (Array.isArray(fields)) {
    fields.forEach(field => {
      if (!field || !field.name || addedFields.has(field.name)) {
        return; // Éviter les champs invalides ou doublons
      }
      
      let prismaType = mapToPrismaType(field.type, field.name, field.optional);
      if (field.optional) prismaType += '?';
      
      let attributes = '';
      if (field.name === 'email') attributes = ' @unique';
      
      // Ajuster les types de relations pour utiliser Int (GARDE)
      if (field.name.endsWith('Id') && field.name !== 'id') {
        prismaType = 'Int' + (field.optional ? '?' : '');
      }
      
      // Vérifier que le nom du champ est valide (GARDE)
      if (field.name && field.name.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        model += `  ${field.name.padEnd(15)} ${prismaType.padEnd(12)}${attributes}\n`;
        addedFields.add(field.name);
      }
    });
  }
  
  // Relations détectées (belongsTo) - GARDE AVEC AMÉLIORATION
  if (Array.isArray(relations)) {
    relations.forEach(relation => {
      if (relation && relation.type === 'belongsTo' && relation.field) {
        const relatedField = relation.field.replace(/Id$/, '');
        if (!addedFields.has(relatedField) && relatedField.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
          // AMÉLIORATION: Nom de relation unique pour Firebase
          const relationName = relation.firebase ? 
            `Firebase_${modelName}_${relation.relatedModel}` : 
            `${modelName}_${relation.relatedModel}`;
          
          model += `  ${relatedField.padEnd(15)} ${relation.relatedModel}${relation.optional ? '?' : ''} @relation("${relationName}", fields: [${relation.field}], references: [id])\n`;
          addedFields.add(relatedField);
        }
      }
    });
  }
  
  // Timestamps standard - toujours ajouter (GARDE)
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

// GARDE LA FONCTION validateAndCleanSchema (parfaite)
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
  
  // Vérification finale (GARDE)
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

// GARDE LA FONCTION generateCompletePrismaSchema AVEC UNE SEULE AMÉLIORATION
function generateCompletePrismaSchema(interfaces) {
  console.log('🏗️ Génération COMPLÈTEMENT DYNAMIQUE du schema - VERSION AMÉLIORÉE...');
  
  let schema = `// Schema Prisma généré COMPLÈTEMENT DYNAMIQUEMENT depuis types.ts - VERSION AMÉLIORÉE
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

  // UTILISE LA NOUVELLE FONCTION DE DÉTECTION AMÉLIORÉE
  const relations = detectRelationsFirebaseIntelligent(interfaces);
  
  // GARDE TOUTE LA GÉNÉRATION EXISTANTE
  interfaces.forEach((fields, modelName) => {
    const modelRelations = relations.get(modelName) || [];
    schema += generatePrismaModelDynamically(modelName, fields, modelRelations, relations);
    schema += '\n';
  });
  
  // GARDE LA VALIDATION
  return validateAndCleanSchema(schema);
}

// ====================================
// GARDE TOUTE LA LOGIQUE D'EXÉCUTION EXISTANTE
// ====================================

// Créer le répertoire prisma (GARDE)
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
  console.log('✅ Schema Prisma généré COMPLÈTEMENT DYNAMIQUEMENT - VERSION AMÉLIORÉE');
  console.log(`📁 Fichier créé: ${schemaPath}`);
  console.log(`🎯 100% basé sur vos interfaces TypeScript !`);
  console.log(`🔥 + Support Firebase et relations intelligentes !`);
  
} catch (err) {
  console.error('❌ Erreur lors de la génération du schema:', err.message);
  process.exit(1);
}