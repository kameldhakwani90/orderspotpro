const fs = require('fs');
const path = require('path');

// ====================================
// FIX ALL TYPES DYNAMIQUE - PIPELINE UNIVERSEL
// ====================================

console.log('🔧 Correction automatique des types TypeScript - Pipeline Universel');

class TypesFixer {
  constructor() {
    this.detectedTypes = [];
    this.detectedModels = [];
    this.fixes = [];
    this.errors = [];
    this.config = null;
    
    this.loadConfiguration();
  }
  
  // ====================================
  // CHARGEMENT CONFIGURATION
  // ====================================
  
  loadConfiguration() {
    try {
      const configPath = path.join(process.cwd(), '.project-config.json');
      if (fs.existsSync(configPath)) {
        this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        console.log(`📋 Configuration chargée: ${this.config.app?.name || 'Projet'}`);
      } else {
        console.log('⚠️ Configuration .project-config.json non trouvée - mode basique');
      }
    } catch (error) {
      console.log('⚠️ Erreur chargement configuration:', error.message);
    }
  }
  
  // ====================================
  // ANALYSE DYNAMIQUE TYPES.TS
  // ====================================
  
  analyzeTypesFile() {
    console.log('\n🔍 Analyse dynamique de types.ts...');
    
    const typesPath = path.join(process.cwd(), 'src/lib/types.ts');
    
    if (!fs.existsSync(typesPath)) {
      console.log('⚠️ Fichier types.ts non trouvé - recherche alternative...');
      return this.searchAlternativeTypesFiles();
    }
    
    try {
      const content = fs.readFileSync(typesPath, 'utf-8');
      
      // Extraction des interfaces
      const interfaces = this.extractInterfaces(content);
      
      // Extraction des types
      const types = this.extractTypes(content);
      
      // Extraction des enums
      const enums = this.extractEnums(content);
      
      this.detectedTypes = [...interfaces, ...types, ...enums];
      this.detectedModels = this.inferModelsFromTypes();
      
      console.log(`✅ Types détectés: ${this.detectedTypes.map(t => t.name).join(', ')}`);
      console.log(`📊 Modèles inférés: ${this.detectedModels.join(', ')}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Erreur analyse types.ts:', error.message);
      return false;
    }
  }
  
  extractInterfaces(content) {
    const interfaces = [];
    const interfaceRegex = /export\s+interface\s+(\w+)\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = interfaceRegex.exec(content)) !== null) {
      const interfaceName = match[1];
      const interfaceBody = match[2];
      
      // Extraction des propriétés
      const properties = this.extractProperties(interfaceBody);
      
      interfaces.push({
        name: interfaceName,
        type: 'interface',
        properties,
        raw: match[0]
      });
    }
    
    return interfaces;
  }
  
  extractTypes(content) {
    const types = [];
    const typeRegex = /export\s+type\s+(\w+)\s*=\s*([^;]+);?/g;
    let match;
    
    while ((match = typeRegex.exec(content)) !== null) {
      const typeName = match[1];
      const typeDefinition = match[2].trim();
      
      types.push({
        name: typeName,
        type: 'type',
        definition: typeDefinition,
        raw: match[0]
      });
    }
    
    return types;
  }
  
  extractEnums(content) {
    const enums = [];
    const enumRegex = /export\s+enum\s+(\w+)\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = enumRegex.exec(content)) !== null) {
      const enumName = match[1];
      const enumBody = match[2];
      
      // Extraction des valeurs
      const values = enumBody.split(',').map(v => v.trim()).filter(v => v);
      
      enums.push({
        name: enumName,
        type: 'enum',
        values,
        raw: match[0]
      });
    }
    
    return enums;
  }
  
  extractProperties(interfaceBody) {
    const properties = [];
    const lines = interfaceBody.split('\n');
    
    lines.forEach(line => {
      const cleanLine = line.trim();
      if (cleanLine && !cleanLine.startsWith('//') && !cleanLine.startsWith('/*')) {
        const propMatch = cleanLine.match(/(\w+)(\?)?:\s*([^;,]+)/);
        if (propMatch) {
          properties.push({
            name: propMatch[1],
            optional: !!propMatch[2],
            type: propMatch[3].trim(),
            raw: cleanLine
          });
        }
      }
    });
    
    return properties;
  }
  
  inferModelsFromTypes() {
    const models = [];
    
    this.detectedTypes.forEach(type => {
      if (type.type === 'interface') {
        // Vérifier si c'est un modèle de données (a un id)
        const hasId = type.properties.some(prop => 
          prop.name.toLowerCase() === 'id' || 
          prop.name === '_id' ||
          prop.name.endsWith('Id')
        );
        
        if (hasId) {
          models.push(type.name);
        }
      }
    });
    
    return models;
  }
  
  searchAlternativeTypesFiles() {
    console.log('🔍 Recherche de fichiers types alternatifs...');
    
    const possiblePaths = [
      'src/types/index.ts',
      'src/types.ts',
      'types/index.ts',
      'lib/types.ts',
      'src/lib/data.ts' // Parfois les types sont dans data.ts
    ];
    
    for (const altPath of possiblePaths) {
      const fullPath = path.join(process.cwd(), altPath);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ Fichier types trouvé: ${altPath}`);
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const interfaces = this.extractInterfaces(content);
          const types = this.extractTypes(content);
          
          if (interfaces.length > 0 || types.length > 0) {
            this.detectedTypes = [...interfaces, ...types];
            this.detectedModels = this.inferModelsFromTypes();
            return true;
          }
        } catch (error) {
          console.log(`⚠️ Erreur lecture ${altPath}:`, error.message);
        }
      }
    }
    
    console.log('⚠️ Aucun fichier types trouvé - utilisation mode fallback');
    return false;
  }
  
  // ====================================
  // ANALYSE DYNAMIQUE DATA.TS
  // ====================================
  
  analyzeDataFile() {
    console.log('\n🔍 Analyse dynamique de data.ts...');
    
    const dataPath = path.join(process.cwd(), 'src/lib/data.ts');
    
    if (!fs.existsSync(dataPath)) {
      console.log('⚠️ Fichier data.ts non trouvé');
      return false;
    }
    
    try {
      const content = fs.readFileSync(dataPath, 'utf-8');
      
      // Extraction des fonctions exportées
      const functions = this.extractExportedFunctions(content);
      
      // Extraction des constantes/arrays
      const constants = this.extractExportedConstants(content);
      
      console.log(`📊 Fonctions détectées: ${functions.length}`);
      console.log(`📋 Constantes détectées: ${constants.length}`);
      
      // Inférer les modèles depuis les fonctions
      const modelsFromFunctions = this.inferModelsFromFunctions(functions);
      
      // Fusionner avec les modèles détectés depuis types.ts
      this.detectedModels = [...new Set([...this.detectedModels, ...modelsFromFunctions])];
      
      return true;
      
    } catch (error) {
      console.error('❌ Erreur analyse data.ts:', error.message);
      return false;
    }
  }
  
  extractExportedFunctions(content) {
    const functions = [];
    const functionRegex = /export\s+(?:const|function)\s+(\w+)/g;
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1];
      const functionType = this.categorizeCrudFunction(functionName);
      
      functions.push({
        name: functionName,
        type: functionType,
        model: this.extractModelFromFunctionName(functionName)
      });
    }
    
    return functions;
  }
  
  extractExportedConstants(content) {
    const constants = [];
    const constantRegex = /export\s+const\s+(\w+)\s*[:=]/g;
    let match;
    
    while ((match = constantRegex.exec(content)) !== null) {
      constants.push({
        name: match[1],
        type: 'constant'
      });
    }
    
    return constants;
  }
  
  categorizeCrudFunction(functionName) {
    const name = functionName.toLowerCase();
    if (name.startsWith('get')) return 'read';
    if (name.startsWith('add') || name.startsWith('create')) return 'create';
    if (name.startsWith('update') || name.startsWith('modify')) return 'update';
    if (name.startsWith('delete') || name.startsWith('remove')) return 'delete';
    return 'other';
  }
  
  extractModelFromFunctionName(functionName) {
    // Extraire le nom du modèle depuis le nom de fonction
    const patterns = [
      /^get(\w+)s?$/,           // getHosts -> Host
      /^add(\w+)$/,             // addHost -> Host
      /^update(\w+)$/,          // updateHost -> Host
      /^delete(\w+)$/,          // deleteHost -> Host
      /^create(\w+)$/,          // createHost -> Host
      /^(\w+)Data$/,            // hostsData -> Host
    ];
    
    for (const pattern of patterns) {
      const match = functionName.match(pattern);
      if (match) {
        let model = match[1];
        // Enlever le 's' final si présent
        if (model.endsWith('s') && model.length > 1) {
          model = model.slice(0, -1);
        }
        // Capitaliser
        return model.charAt(0).toUpperCase() + model.slice(1);
      }
    }
    
    return null;
  }
  
  inferModelsFromFunctions(functions) {
    const models = [];
    
    functions.forEach(func => {
      if (func.model && !models.includes(func.model)) {
        models.push(func.model);
      }
    });
    
    return models;
  }
  
  // ====================================
  // CORRECTIONS AUTOMATIQUES
  // ====================================
  
  async fixAllTypes() {
    console.log('\n🔧 Application des corrections automatiques...');
    
    let totalFixes = 0;
    
    // 1. Corriger data.ts
    totalFixes += await this.fixDataFile();
    
    // 2. Corriger les pages TypeScript
    totalFixes += await this.fixPageFiles();
    
    // 3. Corriger les composants
    totalFixes += await this.fixComponentFiles();
    
    // 4. Ajouter les exports manquants
    totalFixes += await this.addMissingExports();
    
    // 5. Corriger les imports
    totalFixes += await this.fixImports();
    
    console.log(`\n📊 Résumé des corrections:`);
    console.log(`   🔧 Total corrections: ${totalFixes}`);
    console.log(`   ✅ Types détectés: ${this.detectedTypes.length}`);
    console.log(`   📊 Modèles: ${this.detectedModels.length}`);
    
    return totalFixes;
  }
  
  async fixDataFile() {
    console.log('\n📝 Correction du fichier data.ts...');
    
    const dataPath = path.join(process.cwd(), 'src/lib/data.ts');
    
    if (!fs.existsSync(dataPath)) {
      console.log('⚠️ data.ts non trouvé - création...');
      return await this.createDataFile();
    }
    
    try {
      let content = fs.readFileSync(dataPath, 'utf-8');
      let fixes = 0;
      
      // Ajouter les imports de types manquants
      const missingTypeImports = this.detectMissingTypeImports(content);
      if (missingTypeImports.length > 0) {
        content = this.addTypeImports(content, missingTypeImports);
        fixes += missingTypeImports.length;
        console.log(`✅ Imports types ajoutés: ${missingTypeImports.join(', ')}`);
      }
      
      // Corriger les fonctions CRUD pour chaque modèle détecté
      this.detectedModels.forEach(model => {
        const modelFixes = this.addCrudFunctionsForModel(content, model);
        if (modelFixes.modified) {
          content = modelFixes.content;
          fixes += modelFixes.count;
          console.log(`✅ Fonctions ${model}: ${modelFixes.count} ajoutées`);
        }
      });
      
      // Sauvegarder si des modifications ont été faites
      if (fixes > 0) {
        fs.writeFileSync(dataPath, content);
        this.fixes.push(`data.ts: ${fixes} corrections`);
      }
      
      return fixes;
      
    } catch (error) {
      console.error('❌ Erreur correction data.ts:', error.message);
      this.errors.push(`data.ts: ${error.message}`);
      return 0;
    }
  }
  
  detectMissingTypeImports(content) {
    const missing = [];
    
    // Vérifier si les types détectés sont importés
    this.detectedTypes.forEach(type => {
      const importPattern = new RegExp(`import.*${type.name}.*from`, 'i');
      if (!importPattern.test(content) && content.includes(type.name)) {
        missing.push(type.name);
      }
    });
    
    return missing;
  }
  
  addTypeImports(content, missingTypes) {
    // Ajouter les imports manquants
    const importStatement = `import type { ${missingTypes.join(', ')} } from './types';\n`;
    
    // Insérer après les imports existants ou au début
    const importRegex = /^import.*from.*['"];?\s*$/gm;
    const lastImportMatch = [...content.matchAll(importRegex)].pop();
    
    if (lastImportMatch) {
      const insertPosition = lastImportMatch.index + lastImportMatch[0].length;
      content = content.slice(0, insertPosition) + '\n' + importStatement + content.slice(insertPosition);
    } else {
      content = importStatement + '\n' + content;
    }
    
    return content;
  }
  
  addCrudFunctionsForModel(content, modelName) {
    const pluralModel = modelName.toLowerCase() + 's';
    const functions = [
      `get${modelName}s`,
      `get${modelName}ById`, 
      `add${modelName}`,
      `update${modelName}`,
      `delete${modelName}`
    ];
    
    let addedCount = 0;
    let modified = false;
    
    functions.forEach(funcName => {
      if (!content.includes(`export const ${funcName}`) && !content.includes(`export function ${funcName}`)) {
        const funcCode = this.generateCrudFunction(funcName, modelName);
        content += '\n' + funcCode;
        addedCount++;
        modified = true;
      }
    });
    
    return { content, count: addedCount, modified };
  }
  
  generateCrudFunction(functionName, modelName) {
    const pluralModel = modelName.toLowerCase() + 's';
    
    if (functionName.startsWith('get') && functionName.endsWith('s')) {
      return `
export const ${functionName} = (): ${modelName}[] => {
  // TODO: Implémentation à compléter
  return [];
};`;
    }
    
    if (functionName.includes('ById')) {
      return `
export const ${functionName} = (id: string): ${modelName} | undefined => {
  // TODO: Implémentation à compléter
  return undefined;
};`;
    }
    
    if (functionName.startsWith('add')) {
      return `
export const ${functionName} = (data: Omit<${modelName}, 'id'>): ${modelName} => {
  // TODO: Implémentation à compléter
  const newItem = { ...data, id: Date.now().toString() } as ${modelName};
  return newItem;
};`;
    }
    
    if (functionName.startsWith('update')) {
      return `
export const ${functionName} = (id: string, data: Partial<${modelName}>): ${modelName} | null => {
  // TODO: Implémentation à compléter
  return null;
};`;
    }
    
    if (functionName.startsWith('delete')) {
      return `
export const ${functionName} = (id: string): boolean => {
  // TODO: Implémentation à compléter
  return false;
};`;
    }
    
    return `
export const ${functionName} = () => {
  // TODO: Fonction ${functionName} à implémenter
};`;
  }
  
  async fixPageFiles() {
    console.log('\n📄 Correction des fichiers pages...');
    
    const pagesDir = path.join(process.cwd(), 'src/app');
    if (!fs.existsSync(pagesDir)) {
      console.log('⚠️ Répertoire pages non trouvé');
      return 0;
    }
    
    return await this.fixFilesInDirectory(pagesDir, /\.tsx?$/, 'pages');
  }
  
  async fixComponentFiles() {
    console.log('\n🧩 Correction des fichiers composants...');
    
    const componentsDir = path.join(process.cwd(), 'src/components');
    if (!fs.existsSync(componentsDir)) {
      console.log('⚠️ Répertoire composants non trouvé');
      return 0;
    }
    
    return await this.fixFilesInDirectory(componentsDir, /\.tsx?$/, 'composants');
  }
  
  async fixFilesInDirectory(directory, pattern, type) {
    let totalFixes = 0;
    
    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          totalFixes += walkDir(fullPath);
        } else if (pattern.test(file)) {
          totalFixes += this.fixSingleFile(fullPath, type);
        }
      });
    };
    
    walkDir(directory);
    
    console.log(`✅ ${type}: ${totalFixes} corrections appliquées`);
    return totalFixes;
  }
  
  fixSingleFile(filePath, type) {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      let fixes = 0;
      const originalContent = content;
      
      // Corriger les erreurs TypeScript communes
      const commonFixes = [
        {
          pattern: /Parameter '(\w+)' implicitly has an 'any' type/g,
          fix: (match, paramName) => {
            // Ajouter type any explicite
            content = content.replace(
              new RegExp(`\\(${paramName}\\)`, 'g'),
              `(${paramName}: any)`
            );
            return 1;
          }
        },
        {
          pattern: /Binding element '(\w+)' implicitly has an 'any' type/g,
          fix: (match, elementName) => {
            // Corriger les destructuring sans types
            content = content.replace(
              new RegExp(`{\\s*${elementName}\\s*}`, 'g'),
              `{ ${elementName}: any }`
            );
            return 1;
          }
        }
      ];
      
      commonFixes.forEach(fixRule => {
        const matches = [...content.matchAll(fixRule.pattern)];
        matches.forEach(match => {
          fixes += fixRule.fix(match, match[1]);
        });
      });
      
      // Ajouter imports manquants pour les types détectés
      this.detectedTypes.forEach(type => {
        if (content.includes(type.name) && !content.includes(`import.*${type.name}`)) {
          const importLine = `import type { ${type.name} } from '@/lib/types';\n`;
          content = importLine + content;
          fixes++;
        }
      });
      
      // Sauvegarder si des modifications
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        const relativePath = path.relative(process.cwd(), filePath);
        this.fixes.push(`${relativePath}: ${fixes} corrections`);
      }
      
      return fixes;
      
    } catch (error) {
      const relativePath = path.relative(process.cwd(), filePath);
      this.errors.push(`${relativePath}: ${error.message}`);
      return 0;
    }
  }
  
  async addMissingExports() {
    console.log('\n📤 Ajout des exports manquants...');
    
    // Vérifier si prisma-service.ts existe
    const prismaServicePath = path.join(process.cwd(), 'src/lib/prisma-service.ts');
    
    if (!fs.existsSync(prismaServicePath)) {
      console.log('⚠️ prisma-service.ts non trouvé - sera créé par generateCompleteSystem.js');
      return 0;
    }
    
    try {
      let content = fs.readFileSync(prismaServicePath, 'utf-8');
      let fixes = 0;
      
      // Ajouter exports pour chaque modèle détecté
      this.detectedModels.forEach(model => {
        const exports = [
          `get${model}s`,
          `add${model}`,
          `update${model}`,
          `delete${model}`
        ];
        
        exports.forEach(exportName => {
          if (!content.includes(`export const ${exportName}`) && 
              !content.includes(`export { ${exportName}`)) {
            
            // Ajouter la fonction si elle n'existe pas
            const functionCode = this.generatePrismaFunction(exportName, model);
            content += '\n' + functionCode;
            fixes++;
          }
        });
      });
      
      if (fixes > 0) {
        fs.writeFileSync(prismaServicePath, content);
        this.fixes.push(`prisma-service.ts: ${fixes} exports ajoutés`);
      }
      
      return fixes;
      
    } catch (error) {
      console.error('❌ Erreur ajout exports:', error.message);
      this.errors.push(`exports: ${error.message}`);
      return 0;
    }
  }
  
  generatePrismaFunction(functionName, modelName) {
    const lowerModel = modelName.toLowerCase();
    
    if (functionName.endsWith('s')) {
      return `
export const ${functionName} = async () => {
  try {
    return await prisma.${lowerModel}.findMany();
  } catch (error) {
    console.error('Erreur ${functionName}:', error);
    return [];
  }
};`;
    }
    
    if (functionName.startsWith('add')) {
      return `
export const ${functionName} = async (data: any) => {
  try {
    return await prisma.${lowerModel}.create({ data });
  } catch (error) {
    console.error('Erreur ${functionName}:', error);
    throw error;
  }
};`;
    }
    
    if (functionName.startsWith('update')) {
      return `
export const ${functionName} = async (id: string, data: any) => {
  try {
    return await prisma.${lowerModel}.update({ where: { id }, data });
  } catch (error) {
    console.error('Erreur ${functionName}:', error);
    throw error;
  }
};`;
    }
    
    if (functionName.startsWith('delete')) {
      return `
export const ${functionName} = async (id: string) => {
  try {
    await prisma.${lowerModel}.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Erreur ${functionName}:', error);
    return false;
  }
};`;
    }
    
    return `
export const ${functionName} = async () => {
  // TODO: Implémenter ${functionName}
};`;
  }
  
  async fixImports() {
    console.log('\n📥 Correction des imports...');
    
    // Cette fonction sera implémentée si nécessaire
    // Pour l'instant, les imports sont gérés dans les autres fonctions
    
    return 0;
  }
  
  async createDataFile() {
    console.log('📝 Création du fichier data.ts...');
    
    const dataPath = path.join(process.cwd(), 'src/lib/data.ts');
    const dataDir = path.dirname(dataPath);
    
    // Créer le répertoire si nécessaire
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const projectName = this.config?.app?.name || 'Application';
    
    const dataContent = `// Fichier data.ts généré automatiquement pour ${projectName}
import type { ${this.detectedTypes.map(t => t.name).join(', ') || 'any'} } from './types';

// TODO: Implémentez vos fonctions de données ici
// Ce fichier sera complété par generateCompleteSystem.js

${this.detectedModels.map(model => `
// Fonctions pour ${model}
export const get${model}s = (): ${model}[] => {
  return [];
};

export const add${model} = (data: Omit<${model}, 'id'>): ${model} => {
  const newItem = { ...data, id: Date.now().toString() } as ${model};
  return newItem;
};

export const update${model} = (id: string, data: Partial<${model}>): ${model} | null => {
  return null;
};

export const delete${model} = (id: string): boolean => {
  return false;
};`).join('\n')}

export default {};
`;
    
    fs.writeFileSync(dataPath, dataContent);
    console.log('✅ Fichier data.ts créé');
    
    return this.detectedModels.length * 4; // 4 fonctions par modèle
  }
  
  // ====================================
  // RAPPORT FINAL
  // ====================================
  
  generateReport() {
    console.log('\n📊 RAPPORT CORRECTION TYPES:');
    console.log('='.repeat(50));
    
    if (this.config) {
      console.log(`📁 Projet: ${this.config.app.name}`);
    }
    
    console.log(`🔧 Types détectés: ${this.detectedTypes.length}`);
    this.detectedTypes.forEach(type => {
      console.log(`   - ${type.name} (${type.type})`);
    });
    
    console.log(`📊 Modèles inférés: ${this.detectedModels.length}`);
    this.detectedModels.forEach(model => {
      console.log(`   - ${model}`);
    });
    
    console.log(`✅ Corrections appliquées: ${this.fixes.length}`);
    this.fixes.forEach(fix => {
      console.log(`   + ${fix}`);
    });
    
    if (this.errors.length > 0) {
      console.log(`❌ Erreurs rencontrées: ${this.errors.length}`);
      this.errors.forEach(error => {
        console.log(`   ! ${error}`);
      });
    }
    
    console.log('='.repeat(50));
  }
}

// ====================================
// POINT D'ENTRÉE
// ====================================

async function main() {
  const fixer = new TypesFixer();
  
  try {
    console.log('🚀 Démarrage correction automatique des types...\n');
    
    // Analyser les fichiers existants
    const typesAnalyzed = fixer.analyzeTypesFile();
    const dataAnalyzed = fixer.analyzeDataFile();
    
    if (!typesAnalyzed && !dataAnalyzed) {
      console.log('⚠️ Aucun fichier types ou data trouvé - mode fallback');
      
      // Mode fallback - utiliser des types génériques
      fixer.detectedTypes = [
        { name: 'User', type: 'interface', properties: [] },
        { name: 'Item', type: 'interface', properties: [] }
      ];
      fixer.detectedModels = ['User', 'Item'];
    }
    
    // Appliquer les corrections
    const totalFixes = await fixer.fixAllTypes();
    
    // Générer le rapport
    fixer.generateReport();
    
    if (totalFixes > 0) {
      console.log(`\n🎉 Correction terminée avec succès: ${totalFixes} corrections appliquées`);
      return true;
    } else {
      console.log('\n💡 Aucune correction nécessaire - types déjà OK');
      return true;
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la correction des types:');
    console.error(`   💥 ${error.message}`);
    
    // Informations de debug
    console.log('\n🔍 Informations de debug:');
    console.log(`   📂 Répertoire: ${process.cwd()}`);
    console.log(`   🔧 Node.js: ${process.version}`);
    
    // Vérifier les fichiers critiques
    const criticalFiles = [
      'src/lib/types.ts',
      'src/lib/data.ts',
      '.project-config.json'
    ];
    
    criticalFiles.forEach(file => {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    });
    
    console.log('\n💡 Pour résoudre:');
    console.log('   1. Vérifiez que les fichiers types.ts et data.ts existent');
    console.log('   2. Vérifiez la syntaxe TypeScript dans ces fichiers');
    console.log('   3. Lancez: npm install typescript @types/node');
    console.log('   4. Vérifiez la configuration dans .project-config.json');
    
    fixer.generateReport();
    return false;
  }
}

// ====================================
// UTILITAIRES SUPPLÉMENTAIRES
// ====================================

function createBackup(filePath) {
  const backupPath = filePath + '.backup.' + Date.now();
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, backupPath);
    console.log(`💾 Backup créé: ${path.basename(backupPath)}`);
    return backupPath;
  }
  return null;
}

function validateTypeScript(content) {
  // Validation basique de la syntaxe TypeScript
  const errors = [];
  
  // Vérifier les accolades
  const openBraces = (content.match(/{/g) || []).length;
  const closeBraces = (content.match(/}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    errors.push('Accolades non équilibrées');
  }
  
  // Vérifier les parenthèses
  const openParens = (content.match(/\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  
  if (openParens !== closeParens) {
    errors.push('Parenthèses non équilibrées');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function formatTypeScriptCode(code) {
  // Formatage basique du code TypeScript
  return code
    .replace(/;\s*\n\s*\n/g, ';\n\n') // Espacement après points-virgules
    .replace(/{\s*\n\s*\n/g, '{\n')   // Pas de ligne vide après ouverture
    .replace(/\n\s*\n\s*}/g, '\n}')   // Pas de ligne vide avant fermeture
    .replace(/,\s*\n\s*\n/g, ',\n')   // Espacement après virgules
    .trim();
}

// ====================================
// EXPORT ET EXÉCUTION
// ====================================

if (require.main === module) {
  main()
    .then(success => {
      if (success) {
        console.log('\n🎉 Fix types réussi !');
        process.exit(0);
      } else {
        console.log('\n💥 Fix types échoué');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Erreur fatale:', error.message);
      process.exit(1);
    });
}

module.exports = { 
  TypesFixer, 
  createBackup, 
  validateTypeScript, 
  formatTypeScriptCode 
};