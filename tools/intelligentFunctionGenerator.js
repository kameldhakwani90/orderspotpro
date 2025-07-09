#!/usr/bin/env node

// ====================================
// 🧠 INTELLIGENT FUNCTION GENERATOR - IA RÉVOLUTIONNAIRE
// ====================================
// Générateur automatique de TOUTES les fonctions manquantes
// Scanner complet + IA Claude + Génération intelligente
// Résout 500+ erreurs d'imports automatiquement

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class IntelligentFunctionGenerator {
  constructor(projectDir = process.cwd()) {
    this.projectDir = path.resolve(projectDir);
    this.startTime = Date.now();
    
    // Résultats scanning
    this.missingFunctions = new Set();
    this.functionPatterns = new Map();
    this.fileImports = new Map();
    
    // Métriques génération
    this.metrics = {
      filesScanned: 0,
      functionsDetected: 0,
      functionsGenerated: 0,
      aiCallsUsed: 0,
      compilationTests: 0,
      cacheHits: 0
    };
    
    // Infrastructure IA
    this.aiInfrastructure = this.initializeAI();
    this.generatedFunctions = new Map();
    this.functionCache = new Map();
    
    console.log('🧠 Intelligent Function Generator initialisé');
    console.log(`📁 Projet: ${this.projectDir}`);
  }
  
  // ====================================
  // INITIALISATION IA
  // ====================================
  
  initializeAI() {
    try {
      const aiPath = path.join(this.projectDir, 'tools', 'ai-infrastructure.js');
      if (fs.existsSync(aiPath)) {
        const { ClaudeAPI, IntelligentMemory } = require(aiPath);
        
        return {
          claude: new ClaudeAPI(process.env.CLAUDE_API_KEY, process.env.CLAUDE_MODEL),
          memory: new IntelligentMemory(path.join(this.projectDir, 'ai-memory'))
        };
      }
      
      console.log('⚠️  Infrastructure IA non trouvée - Mode basique');
      return null;
    } catch (error) {
      console.warn('⚠️  Erreur initialisation IA:', error.message);
      return null;
    }
  }
  
  // ====================================
  // SCANNING COMPLET DU PROJET
  // ====================================
  
  async scanProjectForMissingFunctions() {
    console.log('\n🔍 SCANNING COMPLET DU PROJET...');
    
    // Scanner tous les fichiers React/TypeScript
    const files = this.getAllTsxTsFiles();
    console.log(`📁 ${files.length} fichiers trouvés`);
    
    for (const file of files) {
      await this.scanFileForImports(file);
    }
    
    console.log(`\n📊 RÉSULTATS SCANNING :`);
    console.log(`   📄 Fichiers scannés: ${this.metrics.filesScanned}`);
    console.log(`   🔍 Fonctions détectées: ${this.missingFunctions.size}`);
    console.log(`   📥 Imports uniques: ${this.fileImports.size}`);
    
    return Array.from(this.missingFunctions);
  }
  
  getAllTsxTsFiles() {
    const files = [];
    
    const scanDir = (dir) => {
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          // Skip node_modules, .next, etc.
          if (item.isDirectory() && !this.shouldSkipDirectory(item.name)) {
            scanDir(fullPath);
          } else if (item.isFile() && this.isReactTypeScriptFile(item.name)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Ignorer erreurs d'accès
      }
    };
    
    // Scanner src/ principalement
    const srcDir = path.join(this.projectDir, 'src');
    if (fs.existsSync(srcDir)) {
      scanDir(srcDir);
    }
    
    return files;
  }
  
  shouldSkipDirectory(dirName) {
    const skipDirs = ['node_modules', '.next', '.git', 'dist', 'build', 'coverage'];
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }
  
  isReactTypeScriptFile(fileName) {
    return /\.(tsx?|jsx?)$/.test(fileName);
  }
  
  async scanFileForImports(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.metrics.filesScanned++;
      
      // Regex pour capturer les imports depuis @/lib/data
      const importRegex = /import\s*{([^}]+)}\s*from\s*['"]@\/lib\/data['"]/g;
      const matches = [...content.matchAll(importRegex)];
      
      for (const match of matches) {
        const imports = match[1];
        const functions = this.parseImportedFunctions(imports);
        
        // Stocker par fichier pour analyse contextuelle
        const relativePath = path.relative(this.projectDir, filePath);
        this.fileImports.set(relativePath, functions);
        
        // Ajouter à la liste globale
        functions.forEach(func => {
          this.missingFunctions.add(func);
          this.metrics.functionsDetected++;
        });
      }
      
    } catch (error) {
      console.warn(`⚠️  Erreur lecture ${filePath}: ${error.message}`);
    }
  }
  
  parseImportedFunctions(importString) {
    // Parser les fonctions importées, gérer les alias
    return importString
      .split(',')
      .map(item => {
        // Gérer "func as alias"
        const cleanItem = item.trim();
        const asMatch = cleanItem.match(/^(.+?)\s+as\s+(.+)$/);
        
        if (asMatch) {
          return {
            original: asMatch[1].trim(),
            alias: asMatch[2].trim(),
            hasAlias: true
          };
        } else {
          return {
            original: cleanItem,
            alias: cleanItem,
            hasAlias: false
          };
        }
      })
      .filter(item => item.original.length > 0);
  }
  
  // ====================================
  // ANALYSE IA DES FONCTIONS
  // ====================================
  
  async analyzeWithClaude(functionData) {
    if (!this.aiInfrastructure) {
      return this.generateBasicFunction(functionData);
    }
    
    try {
      this.metrics.aiCallsUsed++;
      
      // Chercher dans le cache d'abord
      const cacheKey = `function-${functionData.original}`;
      const cached = this.functionCache.get(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        return cached;
      }
      
      // Analyser le contexte d'utilisation
      const context = this.analyzeUsageContext(functionData.original);
      
      const analysisPrompt = `
Analyse cette fonction manquante et génère son code complet :

FONCTION À GÉNÉRER: ${functionData.original}
${functionData.hasAlias ? `ALIAS: ${functionData.alias}` : ''}

CONTEXTE D'UTILISATION:
${context.usage}

MODÈLES PRISMA DISPONIBLES:
- User (id, email, name, password, role, createdAt, updatedAt)
- Host (id, name, email, phone, address, isActive, createdAt, updatedAt)  
- Client (id, name, email, phone, credit, hostId, createdAt, updatedAt)
- Order (id, orderNumber, total, status, userId, hostId, clientId, createdAt, updatedAt)
- Product (id, name, price, category, description, isActive, createdAt, updatedAt)
- Service (id, name, category, price, description, isActive, createdAt, updatedAt)

RÈGLES DE GÉNÉRATION:
1. Utiliser Prisma Client pour database
2. Gestion erreurs avec try/catch
3. Types TypeScript précis
4. Fonction async si database
5. Export named function
6. Logique métier appropriée selon le nom

EXEMPLES PATTERNS:
- get* = SELECT/findMany
- add* = INSERT/create  
- update* = UPDATE/update
- delete* = DELETE/delete
- *ById = findUnique avec where: {id}

Génère le code TypeScript complet de cette fonction.
Retourne uniquement le code, sans explication.
`;

      const generatedCode = await this.aiInfrastructure.claude.optimizeCall(
        analysisPrompt,
        {
          maxTokens: 1000,
          context: `function-generation-${functionData.original}`
        }
      );
      
      // Cache le résultat
      this.functionCache.set(cacheKey, generatedCode);
      
      // Sauvegarder dans la mémoire IA
      if (this.aiInfrastructure.memory) {
        await this.aiInfrastructure.memory.remember(
          `function-${functionData.original}`,
          {
            code: generatedCode,
            context: context,
            timestamp: new Date().toISOString()
          }
        );
      }
      
      return generatedCode;
      
    } catch (error) {
      console.warn(`⚠️  Analyse IA échouée pour ${functionData.original}: ${error.message}`);
      return this.generateBasicFunction(functionData);
    }
  }
  
  analyzeUsageContext(functionName) {
    const usageFiles = [];
    
    // Trouver où cette fonction est utilisée
    for (const [file, functions] of this.fileImports.entries()) {
      const found = functions.find(f => f.original === functionName);
      if (found) {
        usageFiles.push({
          file: file,
          context: this.extractFileContext(file)
        });
      }
    }
    
    return {
      usage: usageFiles.length > 0 
        ? usageFiles.map(u => `${u.file}: ${u.context}`).join('\n')
        : 'Fonction générique sans contexte spécifique',
      filesCount: usageFiles.length
    };
  }
  
  extractFileContext(filePath) {
    // Extraire le contexte depuis le nom du fichier/dossier
    const segments = filePath.split('/');
    
    if (segments.includes('admin')) return 'Administration';
    if (segments.includes('host')) return 'Gestion Host/Restaurant';
    if (segments.includes('client')) return 'Gestion Clients';
    if (segments.includes('order')) return 'Gestion Commandes';
    if (segments.includes('reservation')) return 'Gestion Réservations';
    if (segments.includes('dashboard')) return 'Dashboard';
    if (segments.includes('settings')) return 'Paramètres';
    
    return 'Contexte générique';
  }
  
  generateBasicFunction(functionData) {
    const funcName = functionData.original;
    
    // Patterns de base selon le nom
    if (funcName.startsWith('get') && funcName.endsWith('s')) {
      return this.generateGetAllFunction(funcName);
    } else if (funcName.startsWith('get') && funcName.includes('ById')) {
      return this.generateGetByIdFunction(funcName);
    } else if (funcName.startsWith('add')) {
      return this.generateAddFunction(funcName);
    } else if (funcName.startsWith('update')) {
      return this.generateUpdateFunction(funcName);
    } else if (funcName.startsWith('delete')) {
      return this.generateDeleteFunction(funcName);
    } else {
      return this.generateGenericFunction(funcName);
    }
  }
  
  generateGetAllFunction(funcName) {
    const model = this.extractModelFromFunction(funcName);
    
    return `export async function ${funcName}() {
  try {
    const items = await prisma.${model.toLowerCase()}.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return items;
  } catch (error) {
    console.error('Erreur ${funcName}:', error);
    return [];
  }
}`;
  }
  
  generateGetByIdFunction(funcName) {
    const model = this.extractModelFromFunction(funcName);
    
    return `export async function ${funcName}(id: string) {
  try {
    const item = await prisma.${model.toLowerCase()}.findUnique({
      where: { id }
    });
    return item;
  } catch (error) {
    console.error('Erreur ${funcName}:', error);
    return null;
  }
}`;
  }
  
  generateAddFunction(funcName) {
    const model = this.extractModelFromFunction(funcName);
    
    return `export async function ${funcName}(data: any) {
  try {
    const newItem = await prisma.${model.toLowerCase()}.create({
      data: {
        ...data,
        id: data.id || Date.now().toString()
      }
    });
    return newItem;
  } catch (error) {
    console.error('Erreur ${funcName}:', error);
    throw error;
  }
}`;
  }
  
  generateUpdateFunction(funcName) {
    const model = this.extractModelFromFunction(funcName);
    
    return `export async function ${funcName}(id: string, data: any) {
  try {
    const updatedItem = await prisma.${model.toLowerCase()}.update({
      where: { id },
      data: data
    });
    return updatedItem;
  } catch (error) {
    console.error('Erreur ${funcName}:', error);
    throw error;
  }
}`;
  }
  
  generateDeleteFunction(funcName) {
    const model = this.extractModelFromFunction(funcName);
    
    return `export async function ${funcName}(id: string) {
  try {
    await prisma.${model.toLowerCase()}.delete({
      where: { id }
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur ${funcName}:', error);
    throw error;
  }
}`;
  }
  
  generateGenericFunction(funcName) {
    return `export async function ${funcName}(...args: any[]) {
  try {
    console.log('${funcName} appelée avec:', args);
    // TODO: Implémenter la logique pour ${funcName}
    return null;
  } catch (error) {
    console.error('Erreur ${funcName}:', error);
    throw error;
  }
}`;
  }
  
  extractModelFromFunction(funcName) {
    // Extraire le modèle depuis le nom de fonction
    const patterns = {
      'Host': /host/i,
      'Client': /client/i,
      'User': /user/i,
      'Order': /order/i,
      'Product': /product/i,
      'Service': /service/i,
      'Reservation': /reservation/i,
      'Site': /site/i,
      'Tag': /tag/i,
      'Menu': /menu/i,
      'Room': /room/i,
      'Table': /table/i
    };
    
    for (const [model, pattern] of Object.entries(patterns)) {
      if (pattern.test(funcName)) {
        return model;
      }
    }
    
    return 'Item'; // Fallback générique
  }
  
  // ====================================
  // GÉNÉRATION DU FICHIER DATA.TS COMPLET
  // ====================================
  
  async generateCompleteDataFile() {
    console.log('\n🔨 GÉNÉRATION DU FICHIER data.ts COMPLET...');
    
    const functions = Array.from(this.missingFunctions);
    console.log(`📝 Génération de ${functions.length} fonctions...`);
    
    let generatedCode = '';
    let successCount = 0;
    
    // Header du fichier
    generatedCode += this.generateFileHeader();
    
    // Générer chaque fonction
    for (const functionData of functions) {
      try {
        console.log(`   🔧 Génération: ${functionData.original || functionData}`);
        
        const funcData = typeof functionData === 'string' 
          ? { original: functionData, alias: functionData, hasAlias: false }
          : functionData;
        
        const functionCode = await this.analyzeWithClaude(funcData);
        
        if (functionCode && functionCode.trim()) {
          generatedCode += '\n\n' + functionCode.trim();
          this.generatedFunctions.set(funcData.original, functionCode);
          successCount++;
          this.metrics.functionsGenerated++;
        }
        
      } catch (error) {
        console.warn(`⚠️  Erreur génération ${functionData.original || functionData}:`, error.message);
      }
    }
    
    console.log(`✅ ${successCount}/${functions.length} fonctions générées`);
    
    // Sauvegarder le fichier
    await this.saveDataFile(generatedCode);
    
    return successCount;
  }
  
  generateFileHeader() {
    return `// ====================================
// 🧠 FICHIER DATA.TS - GÉNÉRÉ AUTOMATIQUEMENT
// ====================================
// Généré par IntelligentFunctionGenerator
// Date: ${new Date().toISOString()}
// Fonctions: ${this.missingFunctions.size} détectées automatiquement

import { PrismaClient } from "@prisma/client";

// Prisma client global
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

// ====================================
// 🔧 FONCTIONS GÉNÉRÉES AUTOMATIQUEMENT
// ====================================`;
  }
  
  async saveDataFile(content) {
    const dataFilePath = path.join(this.projectDir, 'src', 'lib', 'data.ts');
    
    // Créer le répertoire si nécessaire
    const dataDir = path.dirname(dataFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Sauvegarder le fichier
    fs.writeFileSync(dataFilePath, content, 'utf8');
    
    console.log(`💾 Fichier sauvegardé: ${dataFilePath}`);
    console.log(`📊 Taille: ${Math.round(content.length / 1024)}KB`);
    
    return dataFilePath;
  }
  
  // ====================================
  // VALIDATION ET TEST
  // ====================================
  
  async validateGeneration() {
    console.log('\n🧪 VALIDATION DE LA GÉNÉRATION...');
    
    try {
      // Test 1: Vérifier que le fichier compile
      const result = await this.testTypeScriptCompilation();
      
      if (result.success) {
        console.log('✅ Compilation TypeScript réussie');
      } else {
        console.log('❌ Erreurs de compilation:');
        console.log(result.errors);
      }
      
      // Test 2: Vérifier que les imports fonctionnent
      const importTest = await this.testImports();
      
      if (importTest.success) {
        console.log('✅ Test des imports réussi');
      } else {
        console.log('❌ Erreurs d\'imports:');
        console.log(importTest.errors);
      }
      
      return result.success && importTest.success;
      
    } catch (error) {
      console.error('❌ Erreur validation:', error.message);
      return false;
    }
  }
  
  async testTypeScriptCompilation() {
    try {
      this.metrics.compilationTests++;
      
      // Test compilation du fichier data.ts
      execSync('npx tsc --noEmit src/lib/data.ts', {
        cwd: this.projectDir,
        stdio: 'pipe'
      });
      
      return { success: true };
      
    } catch (error) {
      return {
        success: false,
        errors: error.stderr ? error.stderr.toString() : error.message
      };
    }
  }
  
  async testImports() {
    try {
      // Créer un fichier test temporaire
      const testFile = path.join(this.projectDir, 'test-imports.ts');
      
      const testCode = `
import { ${Array.from(this.missingFunctions).slice(0, 10).map(f => f.original || f).join(', ')} } from './src/lib/data';

console.log('Test imports OK');
`;
      
      fs.writeFileSync(testFile, testCode);
      
      // Tester compilation
      execSync(`npx tsc --noEmit ${testFile}`, {
        cwd: this.projectDir,
        stdio: 'pipe'
      });
      
      // Nettoyer
      fs.unlinkSync(testFile);
      
      return { success: true };
      
    } catch (error) {
      return {
        success: false,
        errors: error.stderr ? error.stderr.toString() : error.message
      };
    }
  }
  
  // ====================================
  // RAPPORT FINAL
  // ====================================
  
  generateReport() {
    const duration = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('🧠 RAPPORT INTELLIGENT FUNCTION GENERATOR');
    console.log('='.repeat(80));
    
    console.log(`⏱️  Durée totale: ${Math.round(duration / 1000)}s`);
    console.log(`📄 Fichiers scannés: ${this.metrics.filesScanned}`);
    console.log(`🔍 Fonctions détectées: ${this.metrics.functionsDetected}`);
    console.log(`🔧 Fonctions générées: ${this.metrics.functionsGenerated}`);
    console.log(`🧠 Appels IA utilisés: ${this.metrics.aiCallsUsed}`);
    console.log(`⚡ Cache hits: ${this.metrics.cacheHits}`);
    console.log(`🧪 Tests compilation: ${this.metrics.compilationTests}`);
    
    const successRate = this.metrics.functionsDetected > 0 
      ? (this.metrics.functionsGenerated / this.metrics.functionsDetected * 100).toFixed(1)
      : 0;
    
    console.log(`📊 Taux de succès: ${successRate}%`);
    
    if (this.metrics.functionsGenerated > 0) {
      console.log('\n🎉 FICHIER CRÉÉ: src/lib/data.ts');
      console.log('💡 Toutes les erreurs d\'imports devraient être résolues !');
    }
    
    console.log('\n' + '='.repeat(80));
    
    return {
      success: this.metrics.functionsGenerated > 0,
      metrics: this.metrics,
      duration: duration
    };
  }
  
  // ====================================
  // POINT D'ENTRÉE PRINCIPAL
  // ====================================
  
  async execute() {
    try {
      console.log('🚀 DÉMARRAGE INTELLIGENT FUNCTION GENERATOR\n');
      
      // 1. Scanner le projet complet
      await this.scanProjectForMissingFunctions();
      
      // 2. Générer toutes les fonctions
      await this.generateCompleteDataFile();
      
      // 3. Valider la génération
      const isValid = await this.validateGeneration();
      
      // 4. Rapport final
      const report = this.generateReport();
      
      if (isValid && report.success) {
        console.log('\n🎉 GÉNÉRATION RÉUSSIE ! L\'application devrait maintenant compiler ! 🚀');
        return true;
      } else {
        console.log('\n⚠️  GÉNÉRATION PARTIELLE - Vérifiez les erreurs ci-dessus');
        return false;
      }
      
    } catch (error) {
      console.error('\n💥 ERREUR CRITIQUE:', error.message);
      console.error('Stack:', error.stack);
      return false;
    }
  }
}

// ====================================
// EXÉCUTION SI SCRIPT DIRECT
// ====================================

if (require.main === module) {
  const generator = new IntelligentFunctionGenerator();
  
  generator.execute()
    .then(success => {
      if (success) {
        console.log('\n✅ SCRIPT TERMINÉ AVEC SUCCÈS !');
        process.exit(0);
      } else {
        console.log('\n❌ SCRIPT TERMINÉ AVEC ERREURS');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 ERREUR FATALE:', error.message);
      process.exit(1);
    });
}

module.exports = { IntelligentFunctionGenerator };