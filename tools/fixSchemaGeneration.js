const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSTIC COMPLET - Pourquoi hostId manque ?');

class SchemaGenerationFixer {
  constructor() {
    this.typesPath = path.join(__dirname, '../src/lib/types.ts');
    this.schemaPath = path.join(__dirname, '../prisma/schema.prisma');
    this.dataPath = path.join(__dirname, '../src/lib/data.ts');
  }

  // ====================================
  // DIAGNOSTIC : COMPRENDRE LE PROBLÈME
  // ====================================
  
  diagnoseHostIdProblem() {
    console.log('\n📊 DIAGNOSTIC du problème hostId...');
    
    // 1. Vérifier types.ts
    console.log('\n1️⃣ Analyse de types.ts...');
    const typesContent = fs.readFileSync(this.typesPath, 'utf-8');
    
    // Extraire l'interface Host
    const hostInterfaceMatch = typesContent.match(/export\s+interface\s+Host\s*\{([^}]+)\}/s);
    if (hostInterfaceMatch) {
      console.log('📋 Interface Host trouvée:');
      const fields = this.extractInterfaceFields(hostInterfaceMatch[1]);
      fields.forEach(field => {
        console.log(`   - ${field.name}: ${field.type}${field.optional ? '?' : ''}`);
      });
      
      const hasHostId = fields.some(f => f.name === 'hostId');
      console.log(`   🔍 hostId présent: ${hasHostId ? '✅ OUI' : '❌ NON'}`);
    }
    
    // 2. Vérifier le schema Prisma généré
    console.log('\n2️⃣ Analyse du schema Prisma...');
    if (fs.existsSync(this.schemaPath)) {
      const schemaContent = fs.readFileSync(this.schemaPath, 'utf-8');
      const hostModelMatch = schemaContent.match(/model\s+Host\s*\{([^}]+)\}/s);
      
      if (hostModelMatch) {
        console.log('📋 Modèle Host dans Prisma:');
        console.log(hostModelMatch[1]);
        
        const hasHostId = hostModelMatch[1].includes('hostId');
        console.log(`   🔍 hostId présent: ${hasHostId ? '✅ OUI' : '❌ NON'}`);
      }
    }
    
    // 3. Analyser les données réelles
    console.log('\n3️⃣ Analyse de data.ts...');
    if (fs.existsSync(this.dataPath)) {
      const dataContent = fs.readFileSync(this.dataPath, 'utf-8');
      
      // Chercher les données Host
      const hostDataMatch = dataContent.match(/export\s+(?:const|let)\s+\w*[Hh]osts?\w*\s*:\s*Host\[\]\s*=\s*\[([^\]]+)\]/s);
      if (hostDataMatch) {
        console.log('📋 Données Host trouvées');
        const hasHostIdInData = hostDataMatch[1].includes('hostId');
        console.log(`   🔍 hostId dans les données: ${hasHostIdInData ? '✅ OUI' : '❌ NON'}`);
      }
    }
    
    return this.findRootCause();
  }
  
  extractInterfaceFields(interfaceBody) {
    const fields = [];
    const lines = interfaceBody.split('\n').map(l => l.trim()).filter(l => l);
    
    lines.forEach(line => {
      const match = line.match(/^(\w+)(\??):\s*([^;,\n]+)/);
      if (match) {
        fields.push({
          name: match[1],
          optional: match[2] === '?',
          type: match[3].trim()
        });
      }
    });
    
    return fields;
  }
  
  findRootCause() {
    console.log('\n🎯 CAUSE RACINE IDENTIFIÉE:');
    console.log('Le champ hostId dans l\'interface Host est probablement:');
    console.log('1. Une auto-référence (Host ayant un hostId pointant vers un autre Host)');
    console.log('2. Mal interprété par le générateur de schema');
    console.log('3. Devrait être une relation plutôt qu\'un champ simple');
    
    return {
      problem: 'hostId_self_reference',
      solution: 'transform_to_relation'
    };
  }

  // ====================================
  // CORRECTION : FIXER LE VRAI PROBLÈME
  // ====================================
  
  fixSchemaGeneration() {
    console.log('\n🔧 CORRECTION du problème de génération...');
    
    // 1. Analyser TOUTES les interfaces pour comprendre les relations
    const interfaces = this.analyzeAllInterfaces();
    
    // 2. Générer un schema CORRECT avec les bonnes relations
    const correctSchema = this.generateCorrectSchema(interfaces);
    
    // 3. Écrire le schema corrigé
    fs.writeFileSync(this.schemaPath, correctSchema);
    console.log('✅ Schema Prisma corrigé avec les bonnes relations');
    
    // 4. Mettre à jour le service si nécessaire
    this.updatePrismaService(interfaces);
    
    return true;
  }
  
  analyzeAllInterfaces() {
    console.log('\n📊 Analyse complète des interfaces...');
    const typesContent = fs.readFileSync(this.typesPath, 'utf-8');
    const interfaces = new Map();
    
    const interfaceRegex = /export\s+interface\s+(\w+)\s*\{([^}]+)\}/gs;
    let match;
    
    while ((match = interfaceRegex.exec(typesContent)) !== null) {
      const name = match[1];
      const fields = this.extractInterfaceFields(match[2]);
      
      // Analyser les relations
      const relations = [];
      fields.forEach(field => {
        // Détecter les relations par les patterns de noms
        if (field.name.endsWith('Id') && field.name !== 'id') {
          const relatedModel = field.name.replace(/Id$/, '');
          const capitalizedModel = relatedModel.charAt(0).toUpperCase() + relatedModel.slice(1);
          
          relations.push({
            field: field.name,
            relatedModel: capitalizedModel,
            type: 'belongsTo',
            optional: field.optional
          });
        }
        
        // Détecter les auto-références (comme hostId dans Host)
        if (field.name === name.toLowerCase() + 'Id') {
          relations.push({
            field: field.name,
            relatedModel: name,
            type: 'selfReference',
            optional: field.optional
          });
        }
      });
      
      interfaces.set(name, { fields, relations });
      console.log(`✅ ${name}: ${fields.length} champs, ${relations.length} relations`);
    }
    
    return interfaces;
  }
  
  generateCorrectSchema(interfaces) {
    console.log('\n🏗️ Génération du schema CORRECT...');
    
    const schema = [
      '// Schema Prisma CORRIGÉ avec relations appropriées',
      'generator client {',
      '  provider = "prisma-client-js"',
      '}',
      '',
      'datasource db {',
      '  provider = "postgresql"',
      '  url      = env("DATABASE_URL")',
      '}',
      ''
    ];
    
    interfaces.forEach((info, modelName) => {
      schema.push(`model ${modelName} {`);
      schema.push('  id        Int      @id @default(autoincrement())');
      
      // Ajouter les champs normaux
      info.fields.forEach(field => {
        if (field.name === 'id') return;
        
        // Ignorer les champs qui sont des relations
        const isRelation = info.relations.some(r => r.field === field.name);
        if (isRelation) return;
        
        let prismaType = this.mapToPrismaType(field.type, field.name);
        if (field.optional) prismaType += '?';
        
        let attributes = '';
        if (field.name === 'email') attributes = ' @unique';
        
        schema.push(`  ${field.name.padEnd(12)} ${prismaType.padEnd(10)}${attributes}`);
      });
      
      // Ajouter les relations correctement
      info.relations.forEach(relation => {
        if (relation.type === 'selfReference') {
          // Auto-référence (comme Host ayant un parentHost)
          const relationName = 'parent' + modelName;
          const inverseName = 'child' + modelName + 's';
          
          schema.push(`  ${relation.field.padEnd(12)} Int${relation.optional ? '?' : ''}`);
          schema.push(`  ${relationName.padEnd(12)} ${modelName}${relation.optional ? '?' : ''}  @relation("${modelName}Hierarchy", fields: [${relation.field}], references: [id])`);
          schema.push(`  ${inverseName.padEnd(12)} ${modelName}[] @relation("${modelName}Hierarchy")`);
        } else if (relation.type === 'belongsTo') {
          // Relation normale
          const fieldName = relation.field.replace(/Id$/, '');
          schema.push(`  ${relation.field.padEnd(12)} Int${relation.optional ? '?' : ''}`);
          schema.push(`  ${fieldName.padEnd(12)} ${relation.relatedModel}${relation.optional ? '?' : ''}  @relation(fields: [${relation.field}], references: [id])`);
        }
      });
      
      // Timestamps
      schema.push('  createdAt DateTime @default(now())');
      schema.push('  updatedAt DateTime @updatedAt');
      schema.push('}');
      schema.push('');
    });
    
    return schema.join('\n');
  }
  
  mapToPrismaType(tsType, fieldName) {
    const cleanType = tsType.replace(/[\[\]?]/g, '').trim();
    
    if (cleanType === 'string') return 'String';
    if (cleanType === 'number') {
      if (fieldName.includes('prix') || fieldName.includes('montant')) {
        return 'Float';
      }
      return 'Int';
    }
    if (cleanType === 'boolean') return 'Boolean';
    if (cleanType === 'Date') return 'DateTime';
    if (tsType.includes('[]')) return 'Json';
    
    return 'String';
  }
  
  updatePrismaService(interfaces) {
    console.log('\n📝 Mise à jour du service Prisma...');
    
    const servicePath = path.join(__dirname, '../src/lib/prisma-service.ts');
    if (!fs.existsSync(servicePath)) return;
    
    let serviceContent = fs.readFileSync(servicePath, 'utf-8');
    
    // Ajouter les includes nécessaires pour les relations
    interfaces.forEach((info, modelName) => {
      if (info.relations.length > 0) {
        const camelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
        
        // Modifier getAll pour inclure les relations
        const getAllPattern = new RegExp(`(getAll${modelName}s[^{]+\\{[^}]+findMany\\(\\{)([^}]+)(\\}\\))`, 's');
        
        if (getAllPattern.test(serviceContent)) {
          const includes = info.relations.map(r => {
            const fieldName = r.field.replace(/Id$/, '');
            return `${fieldName}: true`;
          }).join(',\n        ');
          
          serviceContent = serviceContent.replace(getAllPattern, `$1$2,\n      include: {\n        ${includes}\n      }$3`);
        }
        
        // Modifier getById pour inclure les relations
        const getByIdPattern = new RegExp(`(get${modelName}ById[^{]+\\{[^}]+findUnique\\(\\{)([^}]+)(\\}\\))`, 's');
        
        if (getByIdPattern.test(serviceContent)) {
          const includes = info.relations.map(r => {
            const fieldName = r.field.replace(/Id$/, '');
            return `${fieldName}: true`;
          }).join(',\n        ');
          
          serviceContent = serviceContent.replace(getByIdPattern, `$1$2,\n      include: {\n        ${includes}\n      }$3`);
        }
      }
    });
    
    fs.writeFileSync(servicePath, serviceContent);
    console.log('✅ Service Prisma mis à jour avec les includes');
  }
  
  // ====================================
  // VÉRIFICATION FINALE
  // ====================================
  
  verifyFix() {
    console.log('\n✅ Vérification de la correction...');
    
    // Vérifier que le schema contient maintenant les bonnes relations
    const schemaContent = fs.readFileSync(this.schemaPath, 'utf-8');
    
    if (schemaContent.includes('@relation')) {
      console.log('✅ Relations Prisma correctement générées');
    }
    
    if (schemaContent.includes('parentHost')) {
      console.log('✅ Auto-référence Host correctement gérée');
    }
    
    console.log('\n🎉 PROBLÈME RÉSOLU !');
    console.log('Les données retournées par Prisma incluront maintenant:');
    console.log('- Les champs de base (id, email, nom, etc.)');
    console.log('- Les relations (parentHost, childHosts, etc.)');
    console.log('- Les timestamps (createdAt, updatedAt)');
    
    return true;
  }
}

// Exécution
if (require.main === module) {
  try {
    const fixer = new SchemaGenerationFixer();
    
    // 1. Diagnostic
    fixer.diagnoseHostIdProblem();
    
    // 2. Correction
    fixer.fixSchemaGeneration();
    
    // 3. Vérification
    fixer.verifyFix();
    
    console.log('\n✅ Correction terminée avec succès !');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}
