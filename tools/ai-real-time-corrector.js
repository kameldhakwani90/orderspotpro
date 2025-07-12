#!/usr/bin/env node

// ====================================
// 🧠 AI REAL-TIME CORRECTOR - IA CLAUDE TEMPS RÉEL
// ====================================
// Emplacement: /data/appfolder/tools/ai-real-time-corrector.js
// Version: 4.0 - Correction intelligente avec Claude API
// Mission: Surveiller et corriger erreurs build automatiquement
// ====================================

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const crypto = require('crypto');

// ====================================
// CLASSE AI REAL-TIME CORRECTOR
// ====================================

class AIRealTimeCorrector {
  constructor() {
    // Chemins et configuration
    this.toolsDir = __dirname;                                    // /data/appfolder/tools/
    this.projectRoot = path.resolve(__dirname, '..');            // /data/appfolder/
    this.dataRoot = path.resolve(__dirname, '../..');            // /data/
    
    // Configuration
    this.configPath = path.join(this.toolsDir, '.project-config.json');
    this.config = this.loadConfig();
    
    // État IA
    this.claudeAPI = null;
    this.isActive = false;
    this.errorQueue = [];
    this.correctionCache = new Map();
    this.learningData = new Map();
    
    // Statistiques
    this.stats = {
      errorsDetected: 0,
      errorsFixed: 0,
      apiCalls: 0,
      cacheHits: 0,
      buildRetriesSuccessful: 0,
      sessionStart: new Date().toISOString()
    };
    
    // Logs
    this.logFile = path.join(this.dataRoot, 'logs', 'ai-corrector.log');
    this.ensureLogDirectory();
    
    console.log('🧠 AI Real-Time Corrector - Claude IA');
    console.log(`📁 Projet surveillé: ${path.basename(this.projectRoot)}`);
    console.log(`🔧 Configuration: ${this.config.ai.enabled ? 'IA Activée' : 'IA Désactivée'}`);
  }
  
  // ====================================
  // CONFIGURATION ET INITIALISATION
  // ====================================
  
  loadConfig() {
    try {
      if (!fs.existsSync(this.configPath)) {
        throw new Error('Configuration manquante');
      }
      
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
      
      if (!config.ai || !config.ai.enabled) {
        throw new Error('IA désactivée dans configuration');
      }
      
      if (!config.ai.claudeApiKey) {
        throw new Error('Clé API Claude manquante');
      }
      
      return config;
      
    } catch (error) {
      console.error('❌ Erreur configuration IA:', error.message);
      process.exit(1);
    }
  }
  
  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }
  
  log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level}: ${message}`;
    
    console.log(logEntry);
    fs.appendFileSync(this.logFile, logEntry + '\n');
  }
  
  // ====================================
  // API CLAUDE INTERFACE
  // ====================================
  
  async initializeClaudeAPI() {
    this.log('INFO', '🔌 Initialisation API Claude...');
    
    try {
      // Configuration API Claude
      this.claudeAPI = {
        apiKey: this.config.ai.claudeApiKey,
        model: this.config.ai.model || 'claude-3-5-sonnet-20241022',
        maxTokens: this.config.ai.maxTokens || 4000,
        baseURL: 'https://api.anthropic.com/v1/messages'
      };
      
      // Test de connectivité
      await this.testClaudeConnection();
      
      this.log('SUCCESS', '✅ API Claude initialisée');
      return true;
      
    } catch (error) {
      this.log('ERROR', `❌ Échec initialisation Claude: ${error.message}`);
      return false;
    }
  }
  
  async testClaudeConnection() {
    const testPrompt = 'Réponds juste "OK" pour tester la connexion.';
    
    try {
      const response = await this.callClaude(testPrompt);
      if (response && response.includes('OK')) {
        this.log('INFO', '🎯 Test connexion Claude réussi');
        return true;
      }
      throw new Error('Réponse inattendue');
      
    } catch (error) {
      throw new Error(`Test connexion Claude échoué: ${error.message}`);
    }
  }
  
  async callClaude(prompt, context = {}) {
    try {
      this.stats.apiCalls++;
      
      const requestBody = {
        model: this.claudeAPI.model,
        max_tokens: this.claudeAPI.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      };
      
      // Import dynamique de fetch
      const fetch = (await import('node-fetch')).default;
      
      const response = await fetch(this.claudeAPI.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeAPI.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API Claude erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.content && data.content[0] && data.content[0].text) {
        return data.content[0].text;
      }
      
      throw new Error('Réponse API Claude invalide');
      
    } catch (error) {
      this.log('ERROR', `❌ Appel Claude échoué: ${error.message}`);
      
      // Fallback en cas d'erreur API
      if (error.message.includes('rate limit')) {
        this.log('WARNING', '⏰ Rate limit API - Attente 60s...');
        await this.sleep(60000);
        return await this.callClaude(prompt, context); // Retry
      }
      
      throw error;
    }
  }
  
  // ====================================
  // SURVEILLANCE ERREURS
  // ====================================
  
  async startErrorMonitoring() {
    this.log('INFO', '👁️ Démarrage surveillance erreurs...');
    this.isActive = true;
    
    // Surveiller différents types de logs
    const logSources = [
      path.join(this.dataRoot, 'logs', 'pipeline.log'),
      path.join(this.projectRoot, '.next', 'trace'),
      path.join(this.projectRoot, 'npm-debug.log')
    ];
    
    // Surveiller les processus build
    this.monitorBuildProcesses();
    
    // Surveiller les fichiers modifiés
    this.monitorFileChanges();
    
    // Boucle principale de surveillance
    while (this.isActive) {
      try {
        await this.processPendingErrors();
        await this.sleep(2000); // Check toutes les 2 secondes
      } catch (error) {
        this.log('ERROR', `❌ Erreur surveillance: ${error.message}`);
        await this.sleep(5000);
      }
    }
  }
  
  monitorBuildProcesses() {
    this.log('INFO', '🔍 Surveillance processus build...');
    
    // Surveiller npm run build / dev
    const buildProcess = spawn('npx', ['next', 'build', '--no-lint'], {
      cwd: this.projectRoot,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    buildProcess.stderr.on('data', (data) => {
      const errorText = data.toString();
      this.detectAndQueueErrors(errorText);
    });
    
    buildProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Error') || output.includes('Failed')) {
        this.detectAndQueueErrors(output);
      }
    });
  }
  
  monitorFileChanges() {
    this.log('INFO', '📁 Surveillance modifications fichiers...');
    
    const watchPaths = [
      path.join(this.projectRoot, 'src'),
      path.join(this.projectRoot, 'pages'),
      path.join(this.projectRoot, 'components'),
      path.join(this.toolsDir)
    ];
    
    watchPaths.forEach(watchPath => {
      if (fs.existsSync(watchPath)) {
        fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
          if (filename && (filename.endsWith('.ts') || filename.endsWith('.tsx'))) {
            this.log('INFO', `📝 Fichier modifié: ${filename}`);
            this.scheduleTypeCheck(path.join(watchPath, filename));
          }
        });
      }
    });
  }
  
  detectAndQueueErrors(text) {
    // Patterns d'erreurs communes
    const errorPatterns = [
      {
        type: 'typescript',
        pattern: /error TS\d+: (.+)/g,
        priority: 'high'
      },
      {
        type: 'nextjs',
        pattern: /Error: (.+)/g,
        priority: 'high'
      },
      {
        type: 'prisma',
        pattern: /PrismaClientKnownRequestError: (.+)/g,
        priority: 'medium'
      },
      {
        type: 'imports',
        pattern: /Module not found: (.+)/g,
        priority: 'high'
      },
      {
        type: 'syntax',
        pattern: /SyntaxError: (.+)/g,
        priority: 'critical'
      }
    ];
    
    errorPatterns.forEach(({ type, pattern, priority }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const error = {
          id: crypto.randomUUID(),
          type,
          message: match[1],
          fullText: text,
          priority,
          timestamp: new Date().toISOString(),
          status: 'pending'
        };
        
        this.errorQueue.push(error);
        this.stats.errorsDetected++;
        
        this.log('ERROR', `🚨 Erreur détectée [${type}]: ${error.message}`);
      }
    });
  }
  
  // ====================================
  // TRAITEMENT ERREURS IA
  // ====================================
  
  async processPendingErrors() {
    if (this.errorQueue.length === 0) return;
    
    // Traiter par priorité
    this.errorQueue.sort((a, b) => {
      const priorities = { critical: 3, high: 2, medium: 1, low: 0 };
      return priorities[b.priority] - priorities[a.priority];
    });
    
    const error = this.errorQueue.shift();
    if (error.status !== 'pending') return;
    
    this.log('INFO', `🧠 Traitement erreur: ${error.id}`);
    
    try {
      // Vérifier cache
      const cacheKey = this.generateCacheKey(error);
      if (this.correctionCache.has(cacheKey)) {
        this.log('INFO', '💾 Solution trouvée en cache');
        this.stats.cacheHits++;
        
        const cachedSolution = this.correctionCache.get(cacheKey);
        await this.applySolution(error, cachedSolution);
        return;
      }
      
      // Correction IA
      const solution = await this.generateAISolution(error);
      if (solution) {
        await this.applySolution(error, solution);
        
        // Sauvegarder en cache
        this.correctionCache.set(cacheKey, solution);
        
        // Apprentissage
        this.recordLearning(error, solution, true);
      }
      
    } catch (correctionError) {
      this.log('ERROR', `❌ Échec correction: ${correctionError.message}`);
      error.status = 'failed';
    }
  }
  
  async generateAISolution(error) {
    this.log('INFO', '🎯 Génération solution IA...');
    
    const prompt = this.buildCorrectionPrompt(error);
    
    try {
      const response = await this.callClaude(prompt);
      const solution = this.parseSolution(response);
      
      if (solution && solution.action) {
        this.log('SUCCESS', `✅ Solution IA générée: ${solution.action}`);
        return solution;
      }
      
      throw new Error('Solution IA invalide');
      
    } catch (error) {
      this.log('ERROR', `❌ Génération solution échouée: ${error.message}`);
      return null;
    }
  }
  
  buildCorrectionPrompt(error) {
    const contextFiles = this.gatherContextFiles(error);
    
    return `Tu es un expert en correction automatique de code TypeScript/Next.js.

ERREUR À CORRIGER:
Type: ${error.type}
Message: ${error.message}
Priorité: ${error.priority}

CONTEXTE PROJET:
${JSON.stringify(contextFiles, null, 2)}

RÈGLES STRICTES:
- Correction MINIMALE et PRÉCISE seulement
- JAMAIS toucher à la logique métier
- Préserver l'architecture existante
- Solution qui fonctionne à 100%

RETOURNE la solution en JSON exact:
{
  "action": "modify_file|add_import|fix_type|create_file",
  "file": "chemin/relatif/fichier",
  "changes": [
    {
      "line": numero_ligne_ou_null,
      "oldCode": "code_actuel",
      "newCode": "code_corrigé"
    }
  ],
  "explanation": "explication_courte",
  "confidence": 0.95
}

Solution immédiate:`;
  }
  
  gatherContextFiles(error) {
    const context = {
      projectStructure: this.getProjectStructure(),
      packageJson: this.readPackageJson(),
      tsConfig: this.readTsConfig(),
      recentFiles: this.getRecentlyModifiedFiles()
    };
    
    // Ajouter fichiers spécifiques selon type d'erreur
    if (error.type === 'typescript') {
      context.typesFiles = this.findTypesFiles();
    }
    
    if (error.type === 'imports') {
      context.importMaps = this.analyzeImports();
    }
    
    return context;
  }
  
  parseSolution(response) {
    try {
      // Extraire JSON de la réponse
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Aucun JSON trouvé dans la réponse');
      }
      
      const solution = JSON.parse(jsonMatch[0]);
      
      // Validation solution
      if (!solution.action || !solution.file) {
        throw new Error('Solution incomplète');
      }
      
      return solution;
      
    } catch (error) {
      this.log('ERROR', `❌ Parsing solution échoué: ${error.message}`);
      return null;
    }
  }
  
  // ====================================
  // APPLICATION SOLUTIONS
  // ====================================
  
  async applySolution(error, solution) {
    this.log('INFO', `🔧 Application solution: ${solution.action}`);
    
    try {
      const filePath = path.join(this.projectRoot, solution.file);
      
      switch (solution.action) {
        case 'modify_file':
          await this.modifyFile(filePath, solution.changes);
          break;
          
        case 'add_import':
          await this.addImport(filePath, solution.changes);
          break;
          
        case 'fix_type':
          await this.fixType(filePath, solution.changes);
          break;
          
        case 'create_file':
          await this.createFile(filePath, solution.content);
          break;
          
        default:
          throw new Error(`Action inconnue: ${solution.action}`);
      }
      
      // Vérifier succès
      const buildSuccess = await this.quickTypeCheck();
      if (buildSuccess) {
        this.stats.errorsFixed++;
        this.log('SUCCESS', `✅ Correction appliquée avec succès`);
        error.status = 'fixed';
        
        // Déclencher rebuild automatique
        this.triggerRebuild();
      } else {
        throw new Error('Correction appliquée mais erreurs persistent');
      }
      
    } catch (error) {
      this.log('ERROR', `❌ Application solution échouée: ${error.message}`);
      throw error;
    }
  }
  
  async modifyFile(filePath, changes) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Fichier inexistant: ${filePath}`);
    }
    
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Appliquer changements (en ordre inverse pour préserver numéros de ligne)
    changes.sort((a, b) => (b.line || 0) - (a.line || 0));
    
    for (const change of changes) {
      if (change.line && change.line > 0) {
        // Modification ligne spécifique
        if (lines[change.line - 1] && lines[change.line - 1].includes(change.oldCode)) {
          lines[change.line - 1] = lines[change.line - 1].replace(change.oldCode, change.newCode);
        }
      } else {
        // Remplacement global
        content = content.replace(change.oldCode, change.newCode);
      }
    }
    
    // Backup avant modification
    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    
    // Écrire modifications
    fs.writeFileSync(filePath, typeof lines === 'object' ? lines.join('\n') : content);
    
    this.log('INFO', `📝 Fichier modifié: ${path.relative(this.projectRoot, filePath)}`);
  }
  
  async quickTypeCheck() {
    try {
      execSync('npx tsc --noEmit --skipLibCheck', {
        cwd: this.projectRoot,
        stdio: 'pipe',
        timeout: 30000
      });
      return true;
    } catch (error) {
      return false;
    }
  }
  
  triggerRebuild() {
    this.log('INFO', '🔄 Déclenchement rebuild automatique...');
    
    // Toucher next.config.js pour déclencher rebuild
    const nextConfigPath = path.join(this.projectRoot, 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      const stat = fs.statSync(nextConfigPath);
      fs.utimesSync(nextConfigPath, stat.atime, new Date());
    }
  }
  
  // ====================================
  // UTILITAIRES
  // ====================================
  
  generateCacheKey(error) {
    return crypto.createHash('md5')
      .update(`${error.type}:${error.message}`)
      .digest('hex');
  }
  
  recordLearning(error, solution, success) {
    const learningEntry = {
      error: error.type,
      solution: solution.action,
      success,
      timestamp: new Date().toISOString(),
      confidence: solution.confidence || 0.5
    };
    
    const key = this.generateCacheKey(error);
    this.learningData.set(key, learningEntry);
  }
  
  getProjectStructure() {
    const structure = {};
    const scanDir = (dir, depth = 0) => {
      if (depth > 3) return; // Limiter profondeur
      
      try {
        const items = fs.readdirSync(dir);
        structure[path.relative(this.projectRoot, dir)] = items.filter(item => 
          !item.startsWith('.') && 
          !['node_modules', 'dist', 'build'].includes(item)
        );
      } catch (error) {
        // Ignorer erreurs lecture
      }
    };
    
    scanDir(this.projectRoot);
    return structure;
  }
  
  readPackageJson() {
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      return fs.existsSync(packagePath) ? 
        JSON.parse(fs.readFileSync(packagePath, 'utf-8')) : null;
    } catch (error) {
      return null;
    }
  }
  
  readTsConfig() {
    try {
      const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');
      return fs.existsSync(tsConfigPath) ? 
        JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8')) : null;
    } catch (error) {
      return null;
    }
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // ====================================
  // STATISTIQUES ET REPORTING
  // ====================================
  
  generateStatsReport() {
    const uptime = Date.now() - new Date(this.stats.sessionStart).getTime();
    
    return {
      ...this.stats,
      uptime: Math.round(uptime / 1000),
      cacheSize: this.correctionCache.size,
      queueSize: this.errorQueue.length,
      successRate: this.stats.errorsDetected > 0 ? 
        (this.stats.errorsFixed / this.stats.errorsDetected * 100).toFixed(1) : 0
    };
  }
  
  async shutdown() {
    this.log('INFO', '🛑 Arrêt IA Real-Time Corrector...');
    this.isActive = false;
    
    // Sauvegarder apprentissage
    this.saveLearningData();
    
    // Rapport final
    const stats = this.generateStatsReport();
    this.log('INFO', `📊 Session terminée - Statistiques finales:`);
    this.log('INFO', `   Erreurs détectées: ${stats.errorsDetected}`);
    this.log('INFO', `   Erreurs corrigées: ${stats.errorsFixed}`);
    this.log('INFO', `   Taux de succès: ${stats.successRate}%`);
    this.log('INFO', `   Appels API: ${stats.apiCalls}`);
    this.log('INFO', `   Cache hits: ${stats.cacheHits}`);
    this.log('INFO', `   Durée session: ${stats.uptime}s`);
  }
  
  saveLearningData() {
    try {
      const learningFile = path.join(this.toolsDir, 'ai-learning-data.json');
      const data = Object.fromEntries(this.learningData);
      fs.writeFileSync(learningFile, JSON.stringify(data, null, 2));
      this.log('INFO', '💾 Données d\'apprentissage sauvegardées');
    } catch (error) {
      this.log('ERROR', `❌ Erreur sauvegarde apprentissage: ${error.message}`);
    }
  }
  
  // ====================================
  // MÉTHODE PRINCIPALE
  // ====================================
  
  async start() {
    try {
      this.log('INFO', '🚀 Démarrage IA Real-Time Corrector...');
      
      // Initialisation
      const claudeReady = await this.initializeClaudeAPI();
      if (!claudeReady) {
        throw new Error('Impossible d\'initialiser Claude API');
      }
      
      // Démarrage surveillance
      await this.startErrorMonitoring();
      
    } catch (error) {
      this.log('ERROR', `❌ Erreur démarrage IA: ${error.message}`);
      process.exit(1);
    }
  }
}

// ====================================
// POINT D'ENTRÉE
// ====================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🧠 AI Real-Time Corrector - Claude IA

Usage:
  node ai-real-time-corrector.js           # Démarrage surveillance
  node ai-real-time-corrector.js --help    # Afficher aide

Fonctionnalités:
  ✅ Surveillance erreurs temps réel
  ✅ Correction automatique avec Claude API
  ✅ Cache intelligent pour optimiser coûts
  ✅ Apprentissage automatique
  ✅ Intégration transparente pipeline

Configuration requise:
  📋 .project-config.json avec IA activée
  🔑 Clé API Claude valide
  📦 Connexion Internet
`);
    process.exit(0);
  }
  
  // Démarrage IA
  const aiCorrector = new AIRealTimeCorrector();
  
  // Gestion signaux système
  process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt demandé par utilisateur...');
    await aiCorrector.shutdown();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await aiCorrector.shutdown();
    process.exit(0);
  });
  
  // Démarrage
  await aiCorrector.start();
}

// Gestion erreurs globales
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Erreur non gérée:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exception non gérée:', error.message);
  process.exit(1);
});

// Lancement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = AIRealTimeCorrector;