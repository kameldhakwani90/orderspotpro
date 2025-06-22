const fs = require('fs');
const path = require('path');

console.log('🔧 Correction DYNAMIQUE des désynchronisations Types/Schema...');

class TypesSchemaSynchronizer {
  constructor() {
    this.schemaPath = path.join(__dirname, '../prisma/schema.prisma');
    this.typesPath = path.join(__dirname, '../src/lib/types.ts');
    this.srcDir = path.join(__dirname, '../src');
  }

  // ====================================
  // ANALYSE DES MODÈLES PRISMA
  // ====================================
  
  analyzePrismaSchema() {
    console.log('🔍 Analyse du schema Prisma...');
    
    if (!fs.existsSync(this.schemaPath)) {
      console.error('❌ Schema Prisma introuvable');
      return {};
    }
    
    const content = fs.readFileSync(this.schemaPath, 'utf-8');
    const models = {};
    
    // Extraire tous les modèles et leurs champs
    const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/gs;
    let match;
    
    while ((match = modelRegex.exec(content)) !== null) {
      const modelName = match[1];
      const modelBody = match[2];
      const fields = this.parseModelFields(modelBody);
      
      models[modelName] = fields;
      console.log(`  📋 ${modelName}: ${Object.keys(fields).length} champs`);
    }
    
    return models;
  }
  
  parseModelFields(modelBody) {
    const fields = {};
    const lines = modelBody.split('\n').map(l => l.trim()).filter(l => l);
    
    lines.forEach(line => {
      // Ignorer les directives @
      if (line.startsWith('@@') || line.startsWith('//')) return;
      
      const fieldMatch = line.match(/^(\w+)\s+(\w+)(\??)/);
      if (fieldMatch) {
        const [, fieldName, fieldType, optional] = fieldMatch;
        
        // Ignorer les relations (qui ont @relation)
        if (!line.includes('@relation')) {
          fields[fieldName] = {
            type: fieldType,
            optional: optional === '?',
            isPrismaField: true
          };
        }
      }
    });
    
    return fields;
  }

  // ====================================
  // ANALYSE DES INTERFACES TYPESCRIPT
  // ====================================
  
  analyzeTypeScriptInterfaces() {
    console.log('🔍 Analyse des interfaces TypeScript...');
    
    if (!fs.existsSync(this.typesPath)) {
      console.error('❌ types.ts introuvable');
      return {};
    }
    
    const content = fs.readFileSync(this.typesPath, 'utf-8');
    const interfaces = {};
    
    const interfaceRegex = /export\s+interface\s+(\w+)\s*\{([^}]+)\}/gs;
    let match;
    
    while ((match = interfaceRegex.exec(content)) !== null) {
      const interfaceName = match[1];
      const interfaceBody = match[2];
      const fields = this.parseInterfaceFields(interfaceBody);
      
      interfaces[interfaceName] = fields;
      console.log(`  📋 ${interfaceName}: ${Object.keys(fields).length} champs`);
    }
    
    return interfaces;
  }
  
  parseInterfaceFields(interfaceBody) {
    const fields = {};
    const lines = interfaceBody.split('\n').map(l => l.trim()).filter(l => l);
    
    lines.forEach(line => {
      const fieldMatch = line.match(/^(\w+)(\??):\s*([^;,\n]+)/);
      if (fieldMatch) {
        const [, fieldName, optional, fieldType] = fieldMatch;
        fields[fieldName] = {
          type: fieldType.trim(),
          optional: optional === '?',
          isInterfaceField: true
        };
      }
    });
    
    return fields;
  }

  // ====================================
  // DÉTECTION DES DÉSYNCHRONISATIONS
  // ====================================
  
  detectMismatches(prismaModels, tsInterfaces) {
    console.log('🔍 Détection des désynchronisations...');
    
    const mismatches = [];
    
    // Pour chaque modèle Prisma, vérifier l'interface correspondante
    Object.entries(prismaModels).forEach(([modelName, prismaFields]) => {
      const tsFields = tsInterfaces[modelName];
      
      if (!tsFields) {
        console.log(`  ⚠️  Interface manquante pour modèle ${modelName}`);
        return;
      }
      
      // Champs dans l'interface mais pas dans Prisma
      Object.keys(tsFields).forEach(fieldName => {
        if (!prismaFields[fieldName] && !this.isRelationField(fieldName)) {
          mismatches.push({
            model: modelName,
            field: fieldName,
            type: 'interface_only',
            interfaceType: tsFields[fieldName].type,
            message: `Champ '${fieldName}' existe dans interface mais pas dans Prisma`
          });
        }
      });
      
      // Champs dans Prisma mais pas dans l'interface
      Object.keys(prismaFields).forEach(fieldName => {
        if (!tsFields[fieldName] && !['id', 'createdAt', 'updatedAt'].includes(fieldName)) {
          mismatches.push({
            model: modelName,
            field: fieldName,
            type: 'prisma_only',
            prismaType: prismaFields[fieldName].type,
            message: `Champ '${fieldName}' existe dans Prisma mais pas dans interface`
          });
        }
      });
    });
    
    return mismatches;
  }
  
  isRelationField(fieldName) {
    // Champs qui sont des relations et non des données
    return fieldName.endsWith('Id') || 
           fieldName === 'host' || 
           fieldName === 'user' ||
           fieldName.endsWith('s'); // collections
  }

  // ====================================
  // CORRECTION AUTOMATIQUE DES COMPOSANTS
  // ====================================
  
  fixComponentTypes(mismatches) {
    console.log('🔧 Correction automatique des composants...');
    
    const componentsToFix = this.findAffectedComponents(mismatches);
    let fixedCount = 0;
    
    componentsToFix.forEach(({ filePath, mismatch }) => {
      if (this.fixComponentFile(filePath, mismatch)) {
        fixedCount++;
      }
    });
    
    console.log(`✅ ${fixedCount} composant(s) corrigé(s)`);
    return fixedCount;
  }
  
  findAffectedComponents(mismatches) {
    const affected = [];
    
    // Scanner tous les fichiers TypeScript/React
    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (!['node_modules', '.git', '.next'].includes(entry.name)) {
            scanDir(fullPath);
          }
        } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          // Vérifier si le fichier utilise les types affectés
          mismatches.forEach(mismatch => {
            if (content.includes(`${mismatch.model}[]`) || 
                content.includes(`<${mismatch.model}>`) ||
                content.includes(`as ${mismatch.model}`)) {
              affected.push({ filePath: fullPath, mismatch });
            }
          });
        }
      });
    };
    
    scanDir(this.srcDir);
    return affected;
  }
  
  fixComponentFile(filePath, mismatch) {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      let hasChanges = false;
      
      if (mismatch.type === 'interface_only') {
        // Le champ existe dans l'interface mais pas dans Prisma
        // Solution 1: Rendre le champ optionnel dans les types locaux
        const typePattern = new RegExp(`(interface\\s+${mismatch.model}\\s*\\{[^}]*${mismatch.field})\\s*:`, 'gs');
        if (typePattern.test(content)) {
          content = content.replace(typePattern, '$1?:');
          hasChanges = true;
          console.log(`  🔧 Rendu optionnel: ${mismatch.model}.${mismatch.field} dans ${path.basename(filePath)}`);
        }
        
        // Solution 2: Ajouter une valeur par défaut lors de l'utilisation
        const usagePattern = new RegExp(`\\.${mismatch.field}(?![?:])`, 'g');
        if (usagePattern.test(content)) {
          // Injecter une interface étendue locale
          const extendedInterface = `
// Interface étendue pour compatibilité
interface ${mismatch.model}Extended extends Omit<${mismatch.model}, '${mismatch.field}'> {
  ${mismatch.field}?: ${mismatch.interfaceType};
}
`;
          
          // Ajouter après les imports
          const importEnd = content.lastIndexOf('import');
          const insertPos = content.indexOf('\n', importEnd) + 1;
          
          if (!content.includes(`${mismatch.model}Extended`)) {
            content = content.slice(0, insertPos) + extendedInterface + content.slice(insertPos);
            
            // Remplacer les types
            content = content.replace(new RegExp(`:\\s*${mismatch.model}\\[\\]`, 'g'), `: ${mismatch.model}Extended[]`);
            content = content.replace(new RegExp(`<${mismatch.model}\\[\\]>`, 'g'), `<${mismatch.model}Extended[]>`);
            
            hasChanges = true;
            console.log(`  🔧 Interface étendue ajoutée dans ${path.basename(filePath)}`);
          }
        }
      }
      
      if (hasChanges) {
        fs.writeFileSync(filePath, content, 'utf-8');
        return true;
      }
      
    } catch (error) {
      console.error(`  ❌ Erreur correction ${filePath}:`, error.message);
    }
    
    return false;
  }

  // ====================================
  // GÉNÉRATION DE TYPES COMPATIBLES
  // ====================================
  
  generateCompatibilityTypes(mismatches) {
    console.log('📝 Génération des types de compatibilité...');
    
    const compatTypesPath = path.join(this.srcDir, 'lib', 'types-compat.ts');
    const imports = ['// Types de compatibilité générés automatiquement'];
    const types = [];
    
    // Importer les types originaux
    imports.push("import * as OriginalTypes from './types';");
    imports.push('');
    
    // Grouper par modèle
    const mismatchesByModel = {};
    mismatches.forEach(m => {
      if (!mismatchesByModel[m.model]) {
        mismatchesByModel[m.model] = [];
      }
      mismatchesByModel[m.model].push(m);
    });
    
    // Générer les types étendus
    Object.entries(mismatchesByModel).forEach(([model, modelMismatches]) => {
      types.push(`// Compatibilité pour ${model}`);
      types.push(`export interface ${model} extends OriginalTypes.${model} {`);
      
      modelMismatches.forEach(m => {
        if (m.type === 'interface_only') {
          // Rendre optionnel si manquant dans Prisma
          types.push(`  ${m.field}?: ${m.interfaceType};`);
        }
      });
      
      types.push('}');
      types.push('');
    });
    
    // Exporter tous les autres types non modifiés
    types.push('// Ré-export des types non modifiés');
    types.push('export * from "./types";');
    
    const content = [...imports, ...types].join('\n');
    fs.writeFileSync(compatTypesPath, content, 'utf-8');
    
    console.log(`✅ Types de compatibilité générés: ${compatTypesPath}`);
    return compatTypesPath;
  }

  // ====================================
  // EXÉCUTION PRINCIPALE
  // ====================================
  
  async synchronize() {
    console.log('🚀 Synchronisation Types/Schema...\n');
    
    // 1. Analyser Prisma et TypeScript
    const prismaModels = this.analyzePrismaSchema();
    const tsInterfaces = this.analyzeTypeScriptInterfaces();
    
    // 2. Détecter les désynchronisations
    const mismatches = this.detectMismatches(prismaModels, tsInterfaces);
    
    if (mismatches.length === 0) {
      console.log('✅ Aucune désynchronisation détectée !');
      return true;
    }
    
    console.log(`\n⚠️  ${mismatches.length} désynchronisation(s) détectée(s):`);
    mismatches.forEach(m => {
      console.log(`   - ${m.model}.${m.field}: ${m.message}`);
    });
    
    // 3. Corriger automatiquement
    console.log('\n🔧 Application des corrections...');
    
    // Corriger les composants
    const fixedComponents = this.fixComponentTypes(mismatches);
    
    // Générer les types de compatibilité
    const compatTypesPath = this.generateCompatibilityTypes(mismatches);
    
    console.log('\n✅ Synchronisation terminée !');
    console.log(`   - ${fixedComponents} composant(s) corrigé(s)`);
    console.log(`   - Types de compatibilité générés`);
    
    // 4. Recommandation
    console.log('\n💡 Recommandation:');
    console.log('   Pour éviter ces désynchronisations, assurez-vous que:');
    console.log('   1. types.ts reflète exactement la structure des données');
    console.log('   2. Les champs relationnels (hostId, etc.) sont correctement définis');
    console.log('   3. Utilisez types-compat.ts pour les types dans les composants');
    
    return true;
  }
}

// Exécution si appelé directement
if (require.main === module) {
  (async () => {
    try {
      const synchronizer = new TypesSchemaSynchronizer();
      const success = await synchronizer.synchronize();
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  })();
}

module.exports = TypesSchemaSynchronizer;
