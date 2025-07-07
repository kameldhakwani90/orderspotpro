// ====================================
// INTELLIGENT TYPE FIXER - CHIRURGIEN TYPESCRIPT IA
// ====================================
// Version: 1.0 - Dr. TypeScript avec Claude IA
// Mission: Corrections chirurgicales TypeScript automatiques
// ====================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ====================================
// CLASSE INTELLIGENT TYPE FIXER
// ====================================

class IntelligentTypeFixer {
  constructor() {
    this.projectDir = process.cwd();
    this.startTime = Date.now();
    this.sessionId = `type-fixer-${Date.now()}`;
    
    // Infrastructure IA
    this.aiInfrastructure = null;
    this.promptManager = null;
    this.aiEnabled = process.env.AI_INFRASTRUCTURE_AVAILABLE === 'true';
    
    // Métriques
    this.metrics = {
      filesAnalyzed: 0,
      errorsFound: 0,
      errorsFixed: 0,
      aiCalls: 0,
      cacheHits: 0,
      manualFixes: 0
    };
    
    // État
    this.typeErrors = [];
    this.fixedFiles = new Set();
    this.processedErrors = new Map();
    
    console.log('🔧 Intelligent Type Fixer - Dr. TypeScript IA');
    console.log(`📁 Projet: ${this.projectDir}`);
    console.log(`🤖 IA: ${this.aiEnabled ? '✅ Disponible' : '❌ Indisponible'}`);
    
    this.initialize();
  }
  
  // ====================================
  // INITIALISATION
  // ====================================
  
  async initialize() {
    try {
      if (this.aiEnabled) {
        await this.initializeAI();
      } else {
        console.log('⚠️ Mode dégradé - Corrections basiques seulement');
      }
      
      // Créer répertoire de travail
      this.workDir = path.join(this.projectDir, '.type-fixer-work');
      if (!fs.existsSync(this.workDir)) {
        fs.mkdirSync(this.workDir, { recursive: true });
      }
      
    } catch (error) {
      console.error('❌ Erreur initialisation:', error.message);
      this.aiEnabled = false;
    }
  }
  
  async initializeAI() {
    try {
      // Charger infrastructure IA
      const { AIInfrastructure } = require('./ai-infrastructure.js');
      const { DynamicPromptManager } = require('./ai-prompts.js');
      
      this.aiInfrastructure = new AIInfrastructure({
        baseDir: this.projectDir
      });
      
      this.promptManager = new DynamicPromptManager();
      
      console.log('🧠 IA Infrastructure chargée');
      
      // Notifier début session
      this.aiInfrastructure.sendScriptMessage(
        'intelligentTypeFixer',
        'build-server',
        'session_start',
        { sessionId: this.sessionId, timestamp: new Date().toISOString() }
      );
      
    } catch (error) {
      console.error('❌ Erreur IA:', error.message);
      this.aiEnabled = false;
    }
  }
  
  // ====================================
  // ANALYSE TYPESCRIPT
  // ====================================
  
  analyzeTypeScriptErrors() {
    console.log('\n🔍 Analyse des erreurs TypeScript...');
    
    try {
      // Compilation TypeScript pour capturer erreurs
      const result = execSync('npx tsc --noEmit --pretty false', { 
        encoding: 'utf8',
        cwd: this.projectDir
      });
      
      console.log('✅ Aucune erreur TypeScript détectée');
      return [];
      
    } catch (error) {
      const output = error.stdout || error.stderr || '';
      return this.parseTypeScriptErrors(output);
    }
  }
  
  parseTypeScriptErrors(output) {
    const errors = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Format: fichier(ligne,colonne): error TS2304: message
      const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
      
      if (match) {
        const [, filePath, lineNum, column, errorCode, message] = match;
        
        errors.push({
          file: filePath,
          line: parseInt(lineNum),
          column: parseInt(column),
          code: errorCode,
          message: message.trim(),
          severity: this.categorizeSeverity(errorCode, message)
        });
      }
    }
    
    this.metrics.errorsFound = errors.length;
    console.log(`📊 ${errors.length} erreurs TypeScript trouvées`);
    
    return this.prioritizeErrors(errors);
  }
  
  categorizeSeverity(code, message) {
    const criticalCodes = ['TS2304', 'TS2322', 'TS2339', 'TS2345'];
    const messagePriority = ['Cannot find', 'Property', 'does not exist', 'Argument of type'];
    
    if (criticalCodes.includes(code)) return 'critical';
    if (messagePriority.some(phrase => message.includes(phrase))) return 'high';
    return 'medium';
  }
  
  prioritizeErrors(errors) {
    return errors.sort((a, b) => {
      const severityOrder = { critical: 3, high: 2, medium: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }
  
  // ====================================
  // CORRECTIONS CHIRURGICALES IA
  // ====================================
  
  async fixTypeError(error) {
    console.log(`\n🔧 Correction: ${path.basename(error.file)}:${error.line}`);
    console.log(`   📋 ${error.message}`);
    
    try {
      if (this.aiEnabled) {
        return await this.fixWithAI(error);
      } else {
        return await this.fixManually(error);
      }
    } catch (fixError) {
      console.error(`❌ Échec correction: ${fixError.message}`);
      return false;
    }
  }
  
  async fixWithAI(error) {
    this.metrics.aiCalls++;
    
    // Vérifier cache d'abord
    const cacheKey = this.generateCacheKey(error);
    const cachedSolution = this.aiInfrastructure.memory.recall(cacheKey, 'typeErrors');
    
    if (cachedSolution && cachedSolution.confidence > 0.8) {
      console.log('💾 Solution en cache trouvée');
      this.metrics.cacheHits++;
      return await this.applyCachedSolution(error, cachedSolution);
    }
    
    // Nouvelle analyse IA
    const context = await this.buildErrorContext(error);
    const prompt = this.promptManager.generatePrompt(
      'intelligentTypeFixer',
      'actionPrompt',
      context
    );
    
    console.log('🧠 Consultation Dr. TypeScript IA...');
    
    const response = await this.aiInfrastructure.surgicalFix(prompt, context);
    const solution = this.parseSolution(response.solution);
    
    if (solution) {
      // Appliquer et sauvegarder en cache
      const success = await this.applySolution(error, solution);
      
      this.aiInfrastructure.memory.remember(cacheKey, {
        solution,
        confidence: success ? 0.9 : 0.3,
        timestamp: new Date().toISOString()
      }, 'typeErrors');
      
      // Enregistrer apprentissage
      this.aiInfrastructure.memory.learn(
        this.formatErrorForLearning(error),
        solution,
        success,
        { errorCode: error.code, file: path.basename(error.file) }
      );
      
      return success;
    }
    
    console.log('⚠️ IA n\'a pas pu générer de solution, fallback manuel');
    return await this.fixManually(error);
  }
  
  async buildErrorContext(error) {
    const context = {
      projectName: path.basename(this.projectDir),
      errorType: this.categorizeErrorType(error),
      fileName: path.basename(error.file),
      filePath: error.file,
      lineNumber: error.line,
      errorMessage: error.message,
      errorCode: error.code
    };
    
    // Ajouter contexte de code
    try {
      const fileContent = fs.readFileSync(error.file, 'utf8');
      const lines = fileContent.split('\n');
      const contextStart = Math.max(0, error.line - 3);
      const contextEnd = Math.min(lines.length, error.line + 2);
      
      context.codeContext = lines.slice(contextStart, contextEnd)
        .map((line, idx) => {
          const lineNum = contextStart + idx + 1;
          const marker = lineNum === error.line ? ' ❌' : '   ';
          return `${lineNum}${marker} ${line}`;
        })
        .join('\n');
        
      // Ajouter types existants du projet
      context.existingTypes = await this.extractExistingTypes();
      
    } catch (err) {
      context.codeContext = 'Impossible de lire le contexte du fichier';
    }
    
    return context;
  }
  
  categorizeErrorType(error) {
    const { code, message } = error;
    
    if (code === 'TS2304') return 'Cannot find name';
    if (code === 'TS2339') return 'Property does not exist';
    if (code === 'TS2322') return 'Type assignment error';
    if (code === 'TS2345') return 'Argument type error';
    if (message.includes('import')) return 'Import error';
    
    return 'General TypeScript error';
  }
  
  async extractExistingTypes() {
    try {
      const typesFile = path.join(this.projectDir, 'src/types.ts');
      if (fs.existsSync(typesFile)) {
        const content = fs.readFileSync(typesFile, 'utf8');
        const interfaces = content.match(/interface\s+(\w+)/g) || [];
        const types = content.match(/type\s+(\w+)/g) || [];
        return [...interfaces, ...types].join(', ');
      }
    } catch (error) {
      // Ignore
    }
    return 'Aucun type disponible';
  }
  
  parseSolution(solutionText) {
    try {
      // Essayer de parser JSON de la réponse IA
      const jsonMatch = solutionText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: parser manuel simple
      return this.parseSimpleSolution(solutionText);
      
    } catch (error) {
      console.error('❌ Erreur parsing solution:', error.message);
      return null;
    }
  }
  
  parseSimpleSolution(text) {
    // Parser simple pour extraire actions basiques
    if (text.includes('ajouter import')) {
      const importMatch = text.match(/import\s+{[^}]+}\s+from\s+['"][^'"]+['"]/);
      if (importMatch) {
        return {
          action: 'ajouter_import',
          newCode: importMatch[0]
        };
      }
    }
    
    return null;
  }
  
  async applySolution(error, solution) {
    console.log(`🔧 Application solution: ${solution.action}`);
    
    try {
      // Backup du fichier
      if (!this.fixedFiles.has(error.file)) {
        this.aiInfrastructure.backupFile(error.file);
        this.fixedFiles.add(error.file);
      }
      
      let success = false;
      
      switch (solution.action) {
        case 'modifier_ligne':
          success = await this.modifyLine(error.file, error.line, solution.newCode);
          break;
          
        case 'ajouter_import':
          success = await this.addImport(error.file, solution.newCode);
          break;
          
        case 'corriger_type':
          success = await this.fixType(error.file, solution);
          break;
          
        case 'ajouter_interface':
          success = await this.addInterface(solution);
          break;
          
        default:
          console.log(`⚠️ Action non reconnue: ${solution.action}`);
          return false;
      }
      
      if (success) {
        this.metrics.errorsFixed++;
        console.log('✅ Solution appliquée avec succès');
        
        // Tester que ça compile
        return await this.testCompilation(error.file);
      }
      
      return false;
      
    } catch (error) {
      console.error(`❌ Erreur application solution: ${error.message}`);
      return false;
    }
  }
  
  async modifyLine(filePath, lineNumber, newCode) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      if (lineNumber > 0 && lineNumber <= lines.length) {
        lines[lineNumber - 1] = newCode;
        fs.writeFileSync(filePath, lines.join('\n'));
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
  
  async addImport(filePath, importStatement) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Vérifier si l'import existe déjà
      if (content.includes(importStatement.trim())) {
        console.log('ℹ️ Import déjà présent');
        return true;
      }
      
      // Trouver la position des imports
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          insertIndex = i + 1;
        } else if (lines[i].trim() === '' && insertIndex > 0) {
          insertIndex = i;
          break;
        }
      }
      
      lines.splice(insertIndex, 0, importStatement);
      fs.writeFileSync(filePath, lines.join('\n'));
      return true;
      
    } catch (error) {
      return false;
    }
  }
  
  async fixType(filePath, solution) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (solution.oldCode && solution.newCode) {
        const newContent = content.replace(solution.oldCode, solution.newCode);
        fs.writeFileSync(filePath, newContent);
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
  
  async addInterface(solution) {
    try {
      const typesFile = path.join(this.projectDir, 'src/types.ts');
      
      if (!fs.existsSync(typesFile)) {
        // Créer fichier types.ts
        fs.writeFileSync(typesFile, `// Types générés automatiquement\n\n${solution.newCode}\n`);
      } else {
        // Ajouter à la fin
        const content = fs.readFileSync(typesFile, 'utf8');
        fs.writeFileSync(typesFile, `${content}\n\n${solution.newCode}\n`);
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async testCompilation(filePath) {
    try {
      execSync(`npx tsc --noEmit ${filePath}`, {
        stdio: 'pipe',
        cwd: this.projectDir
      });
      return true;
    } catch (error) {
      // Si ça compile pas, on considère que c'est pas réparé
      return false;
    }
  }
  
  // ====================================
  // CORRECTIONS MANUELLES (FALLBACK)
  // ====================================
  
  async fixManually(error) {
    this.metrics.manualFixes++;
    console.log('🔧 Correction manuelle basique...');
    
    // Corrections simples sans IA
    const { code, message, file } = error;
    
    if (code === 'TS2304' && message.includes('Cannot find name')) {
      return await this.fixCannotFindName(error);
    }
    
    if (code === 'TS2339' && message.includes('Property') && message.includes('does not exist')) {
      return await this.fixPropertyDoesNotExist(error);
    }
    
    console.log('⚠️ Pas de correction manuelle disponible');
    return false;
  }
  
  async fixCannotFindName(error) {
    // Corrections simples pour "Cannot find name"
    const commonImports = [
      "import React from 'react';",
      "import { useState, useEffect } from 'react';",
      "import { NextResponse } from 'next/server';"
    ];
    
    for (const importStatement of commonImports) {
      if (await this.addImport(error.file, importStatement)) {
        if (await this.testCompilation(error.file)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  async fixPropertyDoesNotExist(error) {
    // Essayer d'ajouter propriété manquante dans interface
    const propertyMatch = error.message.match(/Property '(\w+)' does not exist on type '(\w+)'/);
    
    if (propertyMatch) {
      const [, property, typeName] = propertyMatch;
      console.log(`🔧 Tentative ajout propriété ${property} au type ${typeName}`);
      
      // Implementation basique - ajouter propriété optionnelle
      return await this.addPropertyToInterface(typeName, property);
    }
    
    return false;
  }
  
  async addPropertyToInterface(typeName, property) {
    try {
      const typesFile = path.join(this.projectDir, 'src/types.ts');
      if (!fs.existsSync(typesFile)) return false;
      
      let content = fs.readFileSync(typesFile, 'utf8');
      
      // Chercher l'interface
      const interfaceRegex = new RegExp(`interface\\s+${typeName}\\s*\\{([^}]*)\\}`, 's');
      const match = content.match(interfaceRegex);
      
      if (match) {
        const interfaceBody = match[1];
        const newProperty = `  ${property}?: string; // Ajouté automatiquement`;
        const newInterfaceBody = interfaceBody.trim() + '\n' + newProperty + '\n';
        const newInterface = `interface ${typeName} {\n${newInterfaceBody}}`;
        
        content = content.replace(match[0], newInterface);
        fs.writeFileSync(typesFile, content);
        
        return await this.testCompilation(typesFile);
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
  
  // ====================================
  // UTILITAIRES
  // ====================================
  
  generateCacheKey(error) {
    return `${error.code}-${error.message.substring(0, 50)}-${path.basename(error.file)}`;
  }
  
  formatErrorForLearning(error) {
    return `${error.code}: ${error.message} in ${path.basename(error.file)}:${error.line}`;
  }
  
  async applyCachedSolution(error, cachedData) {
    return await this.applySolution(error, cachedData.solution);
  }
  
  // ====================================
  // RAPPORT FINAL
  // ====================================
  
  generateReport() {
    const duration = Date.now() - this.startTime;
    const successRate = this.metrics.errorsFound > 0 
      ? (this.metrics.errorsFixed / this.metrics.errorsFound * 100).toFixed(1)
      : 100;
    
    console.log('\n📊 RAPPORT INTELLIGENT TYPE FIXER');
    console.log('═══════════════════════════════════');
    console.log(`⏱️  Temps total: ${(duration / 1000).toFixed(1)}s`);
    console.log(`📁 Fichiers analysés: ${this.metrics.filesAnalyzed}`);
    console.log(`🔍 Erreurs trouvées: ${this.metrics.errorsFound}`);
    console.log(`✅ Erreurs corrigées: ${this.metrics.errorsFixed}`);
    console.log(`📈 Taux de succès: ${successRate}%`);
    console.log(`🧠 Appels IA: ${this.metrics.aiCalls}`);
    console.log(`💾 Cache hits: ${this.metrics.cacheHits}`);
    console.log(`🔧 Corrections manuelles: ${this.metrics.manualFixes}`);
    
    return {
      duration,
      successRate: parseFloat(successRate),
      metrics: this.metrics,
      session: this.sessionId
    };
  }
  
  async cleanup() {
    if (this.aiInfrastructure) {
      // Notifier fin de session
      this.aiInfrastructure.sendScriptMessage(
        'intelligentTypeFixer',
        'build-server',
        'session_end',
        { 
          sessionId: this.sessionId,
          metrics: this.metrics,
          timestamp: new Date().toISOString()
        }
      );
    }
    
    // Nettoyer répertoire de travail
    if (fs.existsSync(this.workDir)) {
      fs.rmSync(this.workDir, { recursive: true, force: true });
    }
  }
  
  // ====================================
  // MÉTHODE PRINCIPALE
  // ====================================
  
  async run() {
    try {
      console.log('\n🚀 Démarrage analyse TypeScript...');
      
      // Analyser erreurs TypeScript
      this.typeErrors = this.analyzeTypeScriptErrors();
      
      if (this.typeErrors.length === 0) {
        console.log('🎉 Aucune erreur TypeScript à corriger !');
        return true;
      }
      
      console.log(`\n🔧 Correction de ${this.typeErrors.length} erreurs...`);
      
      // Corriger chaque erreur
      for (const error of this.typeErrors) {
        await this.fixTypeError(error);
      }
      
      // Vérification finale
      console.log('\n🔍 Vérification finale...');
      const remainingErrors = this.analyzeTypeScriptErrors();
      
      const report = this.generateReport();
      
      if (remainingErrors.length === 0) {
        console.log('🎉 Toutes les erreurs TypeScript ont été corrigées !');
        return true;
      } else {
        console.log(`⚠️ ${remainingErrors.length} erreurs restantes`);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erreur fatale:', error.message);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// ====================================
// POINT D'ENTRÉE
// ====================================

async function main() {
  const typeFixer = new IntelligentTypeFixer();
  
  try {
    const success = await typeFixer.run();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    process.exit(1);
  }
}

// Exécution si appelé directement
if (require.main === module) {
  main();
}

module.exports = IntelligentTypeFixer;