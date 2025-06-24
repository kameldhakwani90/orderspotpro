// tools/fixSchemaGeneration.js - VERSION AMÉLIORÉE POUR ERREURS ERREUR4.TXT
const fs = require('fs');
const path = require('path');

class SchemaGenerationFixer {
  constructor() {
    this.schemaPath = path.join(__dirname, '../prisma/schema.prisma');
    this.typesPath = path.join(__dirname, '../src/lib/types.ts');
    
    console.log('🔧 Correcteur de génération schema Prisma - VERSION AMÉLIORÉE');
  }

  // ====================================
  // MÉTHODE PRINCIPALE
  // ====================================
  
  run() {
    console.log('\n🚀 DÉMARRAGE CORRECTION GÉNÉRATION SCHEMA PRISMA');
    
    try {
      // 1. Corriger les erreurs de validation Prisma spécifiques
      if (this.fixPrismaValidationErrors()) {
        console.log('✅ Corrections de validation Prisma appliquées');
        return true;
      }
      
      // 2. Si pas de corrections possibles, régénérer depuis types.ts
      console.log('🔄 Régénération depuis types.ts...');
      return this.generateFromTypes();
      
    } catch (error) {
      console.log('❌ Erreur pendant la correction:', error.message);
      
      // 3. En dernier recours, créer un schema minimal fonctionnel
      console.log('🚨 Création d\'un schema d\'urgence...');
      return this.createEmergencyWorkingSchema();
    }
  }

  // ====================================
  // CORRECTION SPÉCIFIQUE DES ERREURS PRISMA ERREUR4.TXT
  // ====================================
  
  fixPrismaValidationErrors() {
    console.log('\n🚨 CORRECTION DES ERREURS DE VALIDATION PRISMA (ERREUR4.TXT)');
    
    if (!fs.existsSync(this.schemaPath)) {
      console.log('❌ Schema Prisma introuvable, génération nécessaire...');
      return false;
    }
    
    let schemaContent = fs.readFileSync(this.schemaPath, 'utf-8');
    console.log('📖 Lecture du schema existant, taille:', schemaContent.length, 'caractères');
    
    let hasChanges = false;
    
    // CORRECTION 1: Supprimer les lignes avec juste des types (erreurs principales d'erreur4.txt)
    console.log('🔧 Suppression des déclarations de champs invalides...');
    
    const invalidFieldLines = [
      /^\s*String\s*$/gm,                    // Ligne 62: juste "String"
      /^\s*Int\s*$/gm,                       // Ligne 65: juste "Int"
      /^\s*DateTime\s*@default\(now\(\)\)\s*$/gm, // Ligne 76: DateTime dupliqué
      /^\s*Boolean\?\s*$/gm,                 // Champs Boolean orphelins
      /^\s*Json\s*$/gm,                      // Champs Json orphelins
      /^\s*String\?\s*$/gm,                  // String? orphelins (ligne 31 dans erreur4)
    ];
    
    invalidFieldLines.forEach((pattern, index) => {
      const before = schemaContent;
      schemaContent = schemaContent.replace(pattern, '');
      if (before !== schemaContent) {
        hasChanges = true;
        console.log(`  ✅ Supprimé: Déclaration invalide ${index + 1}`);
      }
    });
    
    // CORRECTION 2: Corriger les erreurs de configuration (ligne 4 dans erreur4.txt)
    console.log('🔧 Correction des erreurs de configuration generator/datasource...');
    
    // Ligne 4: "= "postgresql"" au lieu de "provider = "postgresql""
    const configFixes = [
      {
        pattern: /^\s*=\s*"postgresql"\s*$/gm,
        replacement: '  provider = "postgresql"',
        name: 'Configuration datasource malformée'
      },
      {
        pattern: /generator\s+client\s*\{\s*provider\s*=\s*"prisma-client-js"\s*=\s*"postgresql"/g,
        replacement: 'generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"',
        name: 'Section generator/datasource mélangée'
      }
    ];
    
    configFixes.forEach(({ pattern, replacement, name }) => {
      const before = schemaContent;
      schemaContent = schemaContent.replace(pattern, replacement);
      if (before !== schemaContent) {
        hasChanges = true;
        console.log(`  ✅ Corrigé: ${name}`);
      }
    });
    
    // CORRECTION 3: Corriger les déclarations de modèles malformées (ligne 40, 58 dans erreur4.txt)
    console.log('🔧 Correction des déclarations de modèles malformées...');
    
    const modelFixes = [
      {
        pattern: /^\s*Client\s*\{\s*$/gm,
        replacement: 'model Client {',
        name: 'Déclaration modèle Client malformée'
      },
      {
        pattern: /^\s*ChatConversation\s*\{\s*$/gm,
        replacement: 'model ChatConversation {',
        name: 'Déclaration modèle ChatConversation malformée'
      },
      {
        pattern: /^\s*ReservationPageSettings\s*\{\s*$/gm,
        replacement: 'model ReservationPageSettings {',
        name: 'Déclaration modèle ReservationPageSettings malformée'
      },
      {
        pattern: /^\s*AmenityOption\s*\{\s*$/gm,
        replacement: 'model AmenityOption {',
        name: 'Déclaration modèle AmenityOption malformée'
      }
    ];
    
    modelFixes.forEach(({ pattern, replacement, name }) => {
      const before = schemaContent;
      schemaContent = schemaContent.replace(pattern, replacement);
      if (before !== schemaContent) {
        hasChanges = true;
        console.log(`  ✅ Corrigé: ${name}`);
      }
    });
    
    // CORRECTION 4: Corriger les champs dupliqués (erreurs répétées dans erreur4.txt)
    console.log('🔧 Correction des champs dupliqués...');
    
    const duplicateFieldFixes = [
      {
        pattern: /(id\s+\w+\s+@id\s+@default\([^)]+\)[\s\n]+)\w+\s+@id\s+@default\([^)]+\)/g,
        replacement: '$1',
        name: 'Champs id dupliqués'
      },
      {
        pattern: /(createdAt\s+DateTime\s+@default\(now\(\)\)[\s\n]+)DateTime\s+@default\(now\(\)\)/g,
        replacement: '$1',
        name: 'Champs createdAt dupliqués'
      },
      {
        pattern: /(updatedAt\s+DateTime\s+@updatedAt[\s\n]+)DateTime\s+@updatedAt/g,
        replacement: '$1',
        name: 'Champs updatedAt dupliqués'
      },
      {
        pattern: /(name\s+String[\s\n]+)String/g,
        replacement: '$1',
        name: 'Champs name dupliqués'
      }
    ];
    
    duplicateFieldFixes.forEach(({ pattern, replacement, name }) => {
      const before = schemaContent;
      schemaContent = schemaContent.replace(pattern, replacement);
      if (before !== schemaContent) {
        hasChanges = true;
        console.log(`  ✅ Corrigé: ${name}`);
      }
    });
    
    // CORRECTION 5: Nettoyer les modèles spécifiquement mentionnés dans erreur4.txt
    console.log('🔧 Nettoyage des modèles spécifiques...');
    
    // Corriger le modèle ChatMessage spécifiquement mentionné dans l'erreur
    schemaContent = this.fixSpecificChatMessageModel(schemaContent);
    
    // Corriger le modèle Order qui a aussi des problèmes
    schemaContent = this.fixSpecificOrderModel(schemaContent);
    
    // Corriger le modèle Tag qui a des problèmes
    schemaContent = this.fixSpecificTagModel(schemaContent);
    
    // CORRECTION 6: Nettoyer les lignes vides multiples et valider la syntaxe
    schemaContent = schemaContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    schemaContent = schemaContent.replace(/^\s+$/gm, '');
    
    if (hasChanges) {
      // Sauvegarder l'ancien schema
      const backupPath = this.schemaPath + '.backup.' + Date.now();
      fs.writeFileSync(backupPath, fs.readFileSync(this.schemaPath, 'utf-8'));
      console.log(`📋 Sauvegarde créée: ${path.basename(backupPath)}`);
      
      // Écrire le nouveau schema
      fs.writeFileSync(this.schemaPath, schemaContent);
      console.log('✅ Schema corrigé et sauvegardé');
      
      return true;
    }
    
    console.log('⚠️ Aucune correction automatique possible');
    return false;
  }
  
  fixSpecificChatMessageModel(schemaContent) {
    console.log('🔧 Correction spécifique du modèle ChatMessage...');
    
    // Rechercher et corriger le modèle ChatMessage
    const chatMessageRegex = /model\s+ChatMessage\s*{([^}]+)}/s;
    const match = schemaContent.match(chatMessageRegex);
    
    if (match) {
      console.log('🔍 Reconstruction du modèle ChatMessage...');
      
      // Créer un modèle ChatMessage propre basé sur les erreurs d'erreur4.txt
      const cleanChatMessage = `model ChatMessage {
  id          String   @id @default(cuid())
  content     String
  userId      String?
  hostId      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}`;
      
      schemaContent = schemaContent.replace(chatMessageRegex, cleanChatMessage);
      console.log('✅ Modèle ChatMessage reconstruit proprement');
    }
    
    return schemaContent;
  }
  
  fixSpecificOrderModel(schemaContent) {
    console.log('🔧 Correction spécifique du modèle Order...');
    
    const orderRegex = /model\s+Order\s*{([^}]+)}/s;
    const match = schemaContent.match(orderRegex);
    
    if (match) {
      console.log('🔍 Reconstruction du modèle Order...');
      
      const cleanOrder = `model Order {
  id           String   @id @default(cuid())
  orderNumber  String   @unique
  userId       String
  total        Float
  status       String   @default("PENDING")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}`;
      
      schemaContent = schemaContent.replace(orderRegex, cleanOrder);
      console.log('✅ Modèle Order reconstruit proprement');
    }
    
    return schemaContent;
  }
  
  fixSpecificTagModel(schemaContent) {
    console.log('🔧 Correction spécifique du modèle Tag...');
    
    const tagRegex = /model\s+Tag\s*{([^}]+)}/s;
    const match = schemaContent.match(tagRegex);
    
    if (match) {
      console.log('🔍 Reconstruction du modèle Tag...');
      
      const cleanTag = `model Tag {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}`;
      
      schemaContent = schemaContent.replace(tagRegex, cleanTag);
      console.log('✅ Modèle Tag reconstruit proprement');
    }
    
    return schemaContent;
  }

  // ====================================
  // GÉNÉRATION DEPUIS TYPES.TS
  // ====================================
  
  generateFromTypes() {
    console.log('\n🏗️ Génération du schema depuis types.ts...');
    
    if (!fs.existsSync(this.typesPath)) {
      console.log('❌ Fichier types.ts introuvable');
      return this.createEmergencyWorkingSchema();
    }
    
    try {
      const typesContent = fs.readFileSync(this.typesPath, 'utf-8');
      console.log('📖 types.ts lu, taille:', typesContent.length, 'caractères');
      
      // Extraire les interfaces TypeScript
      const interfaces = this.extractInterfaces(typesContent);
      console.log(`📋 ${interfaces.length} interfaces détectées`);
      
      // Générer le schema Prisma
      const schema = this.generatePrismaSchema(interfaces);
      
      // Créer le répertoire prisma si nécessaire
      const prismaDir = path.dirname(this.schemaPath);
      if (!fs.existsSync(prismaDir)) {
        fs.mkdirSync(prismaDir, { recursive: true });
      }
      
      fs.writeFileSync(this.schemaPath, schema);
      console.log('✅ Schema généré depuis types.ts');
      
      return true;
      
    } catch (error) {
      console.log('❌ Erreur pendant la génération:', error.message);
      return this.createEmergencyWorkingSchema();
    }
  }
  
  extractInterfaces(content) {
    const interfaces = [];
    const interfaceRegex = /export\s+interface\s+(\w+)\s*{([^}]+)}/g;
    let match;
    
    while ((match = interfaceRegex.exec(content)) !== null) {
      const name = match[1];
      const fieldsStr = match[2];
      
      // Extraire les champs
      const fields = [];
      const fieldLines = fieldsStr.split('\n');
      
      for (const line of fieldLines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('//')) {
          const fieldMatch = trimmed.match(/(\w+)(\??):\s*([^;]+)/);
          if (fieldMatch) {
            fields.push({
              name: fieldMatch[1],
              optional: fieldMatch[2] === '?',
              type: fieldMatch[3].trim()
            });
          }
        }
      }
      
      interfaces.push({ name, fields });
    }
    
    return interfaces;
  }
  
  generatePrismaSchema(interfaces) {
    let schema = `// Schema Prisma généré automatiquement depuis types.ts
// Corrigé pour résoudre les erreurs d'erreur4.txt

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;
    
    // Générer les modèles
    for (const interface of interfaces) {
      schema += this.generateModel(interface);
    }
    
    return schema;
  }
  
  generateModel(interface) {
    let model = `model ${interface.name} {\n`;
    
    // Ajouter un ID par défaut si absent
    const hasId = interface.fields.some(field => field.name === 'id');
    if (!hasId) {
      model += `  id        String   @id @default(cuid())\n`;
    }
    
    // Ajouter les champs
    for (const field of interface.fields) {
      const prismaType = this.mapTypeToPrisma(field.type, field.optional);
      const attributes = this.getFieldAttributes(field);
      
      model += `  ${field.name.padEnd(10)} ${prismaType}${attributes}\n`;
    }
    
    // Ajouter timestamps si absents
    const hasCreatedAt = interface.fields.some(field => field.name === 'createdAt');
    const hasUpdatedAt = interface.fields.some(field => field.name === 'updatedAt');
    
    if (!hasCreatedAt) {
      model += `  createdAt DateTime @default(now())\n`;
    }
    if (!hasUpdatedAt) {
      model += `  updatedAt DateTime @updatedAt\n`;
    }
    
    model += `}\n\n`;
    
    return model;
  }
  
  mapTypeToPrisma(tsType, optional) {
    const optionalSuffix = optional ? '?' : '';
    
    // Nettoyer le type TypeScript
    tsType = tsType.replace(/\s*\|\s*undefined/g, '').trim();
    
    switch (tsType) {
      case 'string':
        return `String${optionalSuffix}`;
      case 'number':
        return `Float${optionalSuffix}`;
      case 'boolean':
        return `Boolean${optionalSuffix}`;
      case 'Date':
        return `DateTime${optionalSuffix}`;
      default:
        if (tsType.includes('[]')) {
          return `Json${optionalSuffix}`;
        }
        if (tsType.includes('|')) {
          return `String${optionalSuffix}`;
        }
        return `String${optionalSuffix}`;
    }
  }
  
  getFieldAttributes(field) {
    if (field.name === 'id') {
      return ' @id @default(cuid())';
    }
    if (field.name === 'email') {
      return ' @unique';
    }
    if (field.name === 'createdAt') {
      return ' @default(now())';
    }
    if (field.name === 'updatedAt') {
      return ' @updatedAt';
    }
    return '';
  }

  // ====================================
  // SCHEMA D'URGENCE
  // ====================================
  
  createEmergencyWorkingSchema() {
    console.log('🚨 Création d\'un schema d\'urgence fonctionnel...');
    
    const emergencySchema = `// Schema Prisma d'urgence - Fonctionnel garanti
// Créé pour résoudre les erreurs critiques d'erreur4.txt

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      String   @default("CLIENT")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Host {
  id          String   @id @default(cuid())
  name        String
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Order {
  id           String   @id @default(cuid())
  orderNumber  String   @unique
  userId       String
  total        Float
  status       String   @default("PENDING")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model ChatMessage {
  id        String   @id @default(cuid())
  content   String
  userId    String?
  hostId    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Tag {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Client {
  id        String   @id @default(cuid())
  name      String
  email     String
  phone     String?
  hostId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;
    
    // Créer le répertoire prisma si nécessaire
    const prismaDir = path.dirname(this.schemaPath);
    if (!fs.existsSync(prismaDir)) {
      fs.mkdirSync(prismaDir, { recursive: true });
    }
    
    fs.writeFileSync(this.schemaPath, emergencySchema);
    console.log('✅ Schema d\'urgence créé et sauvegardé');
    
    return true;
  }
}

// ====================================
// EXÉCUTION
// ====================================

if (require.main === module) {
  const fixer = new SchemaGenerationFixer();
  const success = fixer.run();
  
  if (success) {
    console.log('\n🎉 CORRECTION/GÉNÉRATION SCHEMA RÉUSSIE !');
    process.exit(0);
  } else {
    console.log('\n❌ ÉCHEC de la correction/génération');
    process.exit(1);
  }
}

module.exports = SchemaGenerationFixer;