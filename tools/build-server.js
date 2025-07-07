// ====================================
// BUILD SERVER IA ENHANCED - ORCHESTRATEUR PIPELINE INTELLIGENT
// ====================================
// Version: 4.0 - Intelligence Artificielle intégrée
// Compatible: Claude IA + Pipeline universel
// ====================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ====================================
// CONFIGURATION ET ÉTAT GLOBAL
// ====================================

class BuildServerIA {
  constructor() {
    this.startTime = Date.now();
    this.projectDir = process.cwd();
    this.toolsDir = path.join(this.projectDir, 'tools');
    this.logFile = this.createLogFile();
    
    // État IA
    this.aiEnabled = process.env.AI_ENABLED === 'true';
    this.hasClaudeKey = !!process.env.CLAUDE_API_KEY;
    this.aiInfrastructure = null;
    
    // Métriques pipeline
    this.metrics = {
      totalScripts: 0,
      successfulScripts: 0,
      failedScripts: 0,
      aiCalls: 0,
      classicFallbacks: 0,
      startTime: this.startTime,
      phases: {}
    };
    
    // Scripts exécutés
    this.executedScripts = [];
    this.failedScripts = [];
    
    console.log('🧠 Build Server IA Enhanced - Version 4.0');
    console.log('📁 Répertoire de travail:', this.projectDir);
    console.log(`🤖 IA Status: ${this.aiEnabled && this.hasClaudeKey ? '✅ Activée' : '❌ Désactivée'}`);
  }
  
  createLogFile() {
    const logsDir = path.join(this.projectDir, 'build-logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logsDir, `build-server-${timestamp}.log`);
    
    // Créer fichier log initial
    fs.writeFileSync(logFile, `Build Server IA Enhanced - Démarré le ${new Date().toISOString()}\n`);
    return logFile;
  }
  
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    // Console avec couleurs
    switch (level) {
      case 'SUCCESS':
        console.log(`✅ ${message}`);
        break;
      case 'ERROR':
        console.error(`❌ ${message}`);
        break;
      case 'WARNING':
        console.warn(`⚠️ ${message}`);
        break;
      case 'AI':
        console.log(`🧠 ${message}`);
        break;
      case 'PHASE':
        console.log(`🚀 ${message}`);
        break;
      default:
        console.log(`ℹ️ ${message}`);
    }
    
    // Log fichier avec données additionnelles
    const fullLogEntry = data && Object.keys(data).length > 0 
      ? `${logEntry} | Data: ${JSON.stringify(data)}`
      : logEntry;
    
    fs.appendFileSync(this.logFile, fullLogEntry + '\n');
  }
  
  // ====================================
  // INITIALISATION IA
  // ====================================
  
  async initializeAI() {
    if (!this.aiEnabled || !this.hasClaudeKey) {
      this.log('INFO', 'IA désactivée - Pipeline classique');
      return false;
    }
    
    try {
      this.log('AI', 'Initialisation infrastructure IA...');
      
      // Vérifier que les fichiers IA existent
      const aiFiles = [
        path.join(this.toolsDir, 'ai-infrastructure.js'),
        path.join(this.toolsDir, 'ai-prompts.js')
      ];
      
      for (const file of aiFiles) {
        if (!fs.existsSync(file)) {
          throw new Error(`Fichier IA manquant: ${path.basename(file)}`);
        }
      }
      
      // Charger infrastructure IA
      const { AIInfrastructure } = require('./tools/ai-infrastructure.js');
      
      const config = {
        apiKey: process.env.CLAUDE_API_KEY,
        model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
        baseDir: this.projectDir
      };
      
      this.aiInfrastructure = new AIInfrastructure(config);
      
      // Test rapide de l'IA
      await this.testAIInfrastructure();
      
      this.log('SUCCESS', 'IA Infrastructure opérationnelle', {
        model: config.model,
        maxTokens: config.maxTokens
      });
      
      return true;
      
    } catch (error) {
      this.log('ERROR', `Erreur initialisation IA: ${error.message}`);
      this.log('WARNING', 'Fallback vers pipeline classique');
      this.aiEnabled = false;
      return false;
    }
  }
  
  async testAIInfrastructure() {
    if (!this.aiInfrastructure) return false;
    
    try {
      // Test simple sans appel API coûteux
      const canModify = this.aiInfrastructure.canModifyFile('./package.json');
      const globalState = this.aiInfrastructure.getGlobalState();
      
      this.log('AI', 'Test infrastructure IA réussi', {
        canModifyPackage: canModify,
        globalStateExists: !!globalState
      });
      
      return true;
    } catch (error) {
      throw new Error(`Test IA échoué: ${error.message}`);
    }
  }
  
  // ====================================
  // EXÉCUTION SCRIPTS
  // ====================================
  
  async runScript(scriptName, description, options = {}) {
    const phaseStart = Date.now();
    this.metrics.totalScripts++;
    
    this.log('INFO', `Démarrage: ${description}...`);
    
    try {
      const scriptPath = path.join(this.toolsDir, scriptName);
      
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`Script introuvable: ${scriptName}`);
      }
      
      // Préparer environnement
      const scriptEnv = {
        ...process.env,
        AI_INFRASTRUCTURE_AVAILABLE: this.aiInfrastructure ? 'true' : 'false',
        BUILD_SERVER_LOG_FILE: this.logFile,
        SCRIPT_START_TIME: phaseStart.toString()
      };
      
      // Exécuter script
      execSync(`node ${scriptPath}`, {
        stdio: options.silent ? 'pipe' : 'inherit',
        timeout: options.timeout || 300000,
        env: scriptEnv,
        cwd: this.projectDir
      });
      
      const duration = Date.now() - phaseStart;
      this.metrics.successfulScripts++;
      this.executedScripts.push({
        script: scriptName,
        description,
        duration,
        success: true,
        timestamp: new Date().toISOString()
      });
      
      this.log('SUCCESS', `${description} terminé (${duration}ms)`);
      return true;
      
    } catch (error) {
      const duration = Date.now() - phaseStart;
      this.metrics.failedScripts++;
      this.failedScripts.push({
        script: scriptName,
        description,
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      });
      
      this.log('ERROR', `${description} échoué: ${error.message}`, {
        script: scriptName,
        duration,
        exitCode: error.status
      });
      
      if (options.critical) {
        throw error;
      }
      
      return false;
    }
  }
  
  async runIntelligentScript(scriptName, description, options = {}) {
    if (!this.aiInfrastructure) {
      // Fallback vers script classique
      const classicScript = this.getClassicFallback(scriptName);
      if (classicScript) {
        this.metrics.classicFallbacks++;
        this.log('WARNING', `Fallback classique: ${classicScript}`);
        return this.runScript(classicScript, `${description} (mode classique)`, options);
      } else {
        this.log('WARNING', `Pas de fallback pour ${scriptName}`);
        return false;
      }
    }
    
    this.log('AI', `Exécution intelligente: ${description}...`);
    this.metrics.aiCalls++;
    
    // Notifier l'infrastructure IA
    if (this.aiInfrastructure) {
      this.aiInfrastructure.sendScriptMessage(
        'build-server',
        scriptName.replace('.js', ''),
        'script_execution_start',
        { description, timestamp: new Date().toISOString() }
      );
    }
    
    // Exécuter avec timeout plus long pour IA
    const result = await this.runScript(scriptName, description, {
      ...options,
      timeout: options.timeout || 600000 // 10 minutes pour IA
    });
    
    // Enregistrer résultat dans IA
    if (this.aiInfrastructure) {
      this.aiInfrastructure.recordAction(
        scriptName.replace('.js', ''),
        'script_execution',
        result,
        { description, buildServerSession: this.startTime }
      );
    }
    
    return result;
  }
  
  getClassicFallback(intelligentScript) {
    const fallbacks = {
      'intelligentTypeFixer.js': 'fix-all-types.js',
      'intelligentErrorSurgeon.js': 'dynamicErrorResolver.js',
      'intelligentBuildMaster.js': 'smartBuildWithFix.js',
      'intelligentPerformanceOptimizer.js': null, // Pas de fallback
      'intelligentProjectAnalyzer.js': null, // Pas de fallback
      'intelligentMigrationAgent.js': 'detectFirebaseChanges.js',
      'intelligentHooksArchitect.js': 'generateReactHooks.js'
    };
    
    return fallbacks[intelligentScript] || null;
  }
  
  // ====================================
  // PHASES DU PIPELINE
  // ====================================
  
  async executePhase(phaseName, scripts) {
    const phaseStart = Date.now();
    this.log('PHASE', `=== PHASE: ${phaseName.toUpperCase()} ===`);
    
    let phaseSuccess = true;
    const phaseResults = [];
    
    for (const scriptConfig of scripts) {
      let result;
      
      if (typeof scriptConfig === 'string') {
        // Script simple
        result = await this.runScript(scriptConfig, scriptConfig.replace('.js', ''));
      } else {
        // Configuration complexe
        const { script, description, type, options = {} } = scriptConfig;
        
        if (type === 'intelligent') {
          result = await this.runIntelligentScript(script, description, options);
        } else {
          result = await this.runScript(script, description, options);
        }
      }
      
      phaseResults.push({
        script: typeof scriptConfig === 'string' ? scriptConfig : scriptConfig.script,
        success: result
      });
      
      if (!result && (typeof scriptConfig === 'object' && scriptConfig.critical)) {
        phaseSuccess = false;
        break;
      }
    }
    
    const phaseDuration = Date.now() - phaseStart;
    this.metrics.phases[phaseName] = {
      duration: phaseDuration,
      success: phaseSuccess,
      results: phaseResults
    };
    
    this.log(phaseSuccess ? 'SUCCESS' : 'WARNING', 
      `Phase ${phaseName} terminée (${phaseDuration}ms) - ${phaseSuccess ? 'Succès' : 'Partiel'}`);
    
    return phaseSuccess;
  }
  
  // ====================================
  // PIPELINE IA ENHANCED
  // ====================================
  
  async executePipelineIA() {
    this.log('AI', 'DÉMARRAGE PIPELINE IA ENHANCED');
    
    try {
      // PHASE 1: Analyse globale IA
      await this.executePhase('analyse_globale_ia', [
        {
          script: 'intelligentProjectAnalyzer.js',
          description: 'Analyse globale projet IA',
          type: 'intelligent',
          options: { critical: false }
        }
      ]);
      
      // PHASE 2: Préparation base
      await this.executePhase('preparation_base', [
        {
          script: 'prisma-auto-migrate.js',
          description: 'Auto-migration Prisma',
          type: 'classic',
          options: { critical: true }
        }
      ]);
      
      // PHASE 3: Corrections chirurgicales IA
      await this.executePhase('corrections_chirurgicales_ia', [
        {
          script: 'intelligentTypeFixer.js',
          description: 'Corrections TypeScript IA',
          type: 'intelligent',
          options: { critical: false }
        },
        {
          script: 'intelligentErrorSurgeon.js',
          description: 'Résolution erreurs IA',
          type: 'intelligent',
          options: { critical: false }
        }
      ]);
      
      // PHASE 4: Génération système
      await this.executePhase('generation_systeme', [
        {
          script: 'generateCompleteSystem.js',
          description: 'Génération système complet',
          type: 'classic',
          options: { critical: true }
        },
        {
          script: 'intelligentHooksArchitect.js',
          description: 'Architecture hooks intelligente',
          type: 'intelligent',
          options: { critical: false }
        }
      ]);
      
      // PHASE 5: Build intelligent IA
      await this.executePhase('build_intelligent_ia', [
        {
          script: 'intelligentBuildMaster.js',
          description: 'Build Master IA',
          type: 'intelligent',
          options: { critical: true, timeout: 900000 } // 15 minutes
        }
      ]);
      
      // PHASE 6: Optimisations IA
      await this.executePhase('optimisations_ia', [
        {
          script: 'intelligentPerformanceOptimizer.js',
          description: 'Optimisations performance IA',
          type: 'intelligent',
          options: { critical: false }
        }
      ]);
      
      // PHASE 7: Finalisation
      await this.executePhase('finalisation', [
        {
          script: 'deployment-validator.js',
          description: 'Validation déploiement',
          type: 'classic',
          options: { critical: false }
        }
      ]);
      
      this.log('SUCCESS', '🎉 PIPELINE IA ENHANCED TERMINÉ AVEC SUCCÈS !');
      return true;
      
    } catch (error) {
      this.log('ERROR', `Pipeline IA échoué: ${error.message}`);
      return false;
    }
  }
  
  // ====================================
  // PIPELINE CLASSIQUE (FALLBACK)
  // ====================================
  
  async executePipelineClassique() {
    this.log('INFO', 'DÉMARRAGE PIPELINE CLASSIQUE');
    
    try {
      // PHASE 1: Migration Prisma
      await this.executePhase('migration_prisma', [
        'prisma-auto-migrate.js'
      ]);
      
      // PHASE 2: Génération système
      await this.executePhase('generation_systeme', [
        'generateCompleteSystem.js'
      ]);
      
      // PHASE 3: Corrections
      await this.executePhase('corrections', [
        'fix-missing-functions.js',
        'fix-all-types.js'
      ]);
      
      // PHASE 4: Hooks React
      await this.executePhase('hooks_react', [
        'generateReactHooks.js',
        'migrateComponentsToHooks.js'
      ]);
      
      // PHASE 5: Correction AppShell
      await this.executePhase('correction_appshell', [
        'fix-appshell-redirections.js'
      ]);
      
      // PHASE 6: Build final
      await this.executePhase('build_final', [
        'fixNextJsBuildErrors.js',
        'smartBuildWithFix.js'
      ]);
      
      this.log('SUCCESS', '🎉 PIPELINE CLASSIQUE TERMINÉ !');
      return true;
      
    } catch (error) {
      this.log('ERROR', `Pipeline classique échoué: ${error.message}`);
      return false;
    }
  }
  
  // ====================================
  // RAPPORT FINAL
  // ====================================
  
  generateFinalReport() {
    const totalTime = Date.now() - this.startTime;
    const successRate = this.metrics.totalScripts > 0 
      ? (this.metrics.successfulScripts / this.metrics.totalScripts * 100).toFixed(1)
      : 0;
    
    const report = {
      summary: {
        totalTime: totalTime,
        totalScripts: this.metrics.totalScripts,
        successfulScripts: this.metrics.successfulScripts,
        failedScripts: this.metrics.failedScripts,
        successRate: parseFloat(successRate),
        aiEnabled: this.aiEnabled,
        aiCalls: this.metrics.aiCalls,
        classicFallbacks: this.metrics.classicFallbacks
      },
      phases: this.metrics.phases,
      executedScripts: this.executedScripts,
      failedScripts: this.failedScripts,
      timestamp: new Date().toISOString()
    };
    
    // Sauvegarder rapport
    const reportFile = path.join(path.dirname(this.logFile), 'build-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    // Afficher résumé
    console.log('\n📊 RAPPORT FINAL BUILD SERVER IA ENHANCED');
    console.log('═══════════════════════════════════════════');
    console.log(`⏱️  Temps total: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`📜 Scripts exécutés: ${this.metrics.successfulScripts}/${this.metrics.totalScripts}`);
    console.log(`✅ Taux de succès: ${successRate}%`);
    console.log(`🧠 Appels IA: ${this.metrics.aiCalls}`);
    console.log(`🔄 Fallbacks classiques: ${this.metrics.classicFallbacks}`);
    console.log(`📄 Rapport détaillé: ${reportFile}`);
    
    if (this.failedScripts.length > 0) {
      console.log('\n⚠️ Scripts échoués:');
      this.failedScripts.forEach(script => {
        console.log(`   ❌ ${script.script}: ${script.error}`);
      });
    }
    
    return report;
  }
  
  // ====================================
  // NETTOYAGE
  // ====================================
  
  async cleanup() {
    this.log('INFO', 'Nettoyage ressources...');
    
    // Cleanup IA si disponible
    if (this.aiInfrastructure) {
      try {
        this.aiInfrastructure.cleanup();
        this.log('AI', 'Ressources IA nettoyées');
      } catch (error) {
        this.log('WARNING', `Erreur nettoyage IA: ${error.message}`);
      }
    }
    
    this.log('SUCCESS', 'Nettoyage terminé');
  }
  
  // ====================================
  // MÉTHODE PRINCIPALE
  // ====================================
  
  async run() {
    try {
      console.log('\n📁 Architecture: /data/project-source/');
      console.log('🔧 Scripts: /data/tools/ → /data/project-source/tools/');
      console.log('📋 Config: /data/.project-config.json → ./project-config.json');
      
      // Initialiser IA
      const aiInitialized = await this.initializeAI();
      
      let pipelineSuccess;
      
      if (aiInitialized) {
        // Exécuter pipeline IA Enhanced
        pipelineSuccess = await this.executePipelineIA();
      } else {
        // Fallback pipeline classique
        pipelineSuccess = await this.executePipelineClassique();
      }
      
      // Générer rapport final
      this.generateFinalReport();
      
      // Cleanup
      await this.cleanup();
      
      console.log(`\n${pipelineSuccess ? '✅' : '❌'} Build Server terminé`);
      return pipelineSuccess;
      
    } catch (error) {
      this.log('ERROR', `Erreur fatale: ${error.message}`);
      await this.cleanup();
      throw error;
    }
  }
}

// ====================================
// POINT D'ENTRÉE
// ====================================

async function main() {
  const buildServer = new BuildServerIA();
  
  try {
    const success = await buildServer.run();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ ERREUR PIPELINE:', error.message);
    process.exit(1);
  }
}

// Exécution si appelé directement
if (require.main === module) {
  main();
}

module.exports = BuildServerIA;