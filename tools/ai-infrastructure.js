// ====================================
// AI INFRASTRUCTURE - PIPELINE INTELLIGENT
// ====================================
// Version: 1.0 - Infrastructure complète IA
// Compatible: Claude API + Pipeline universel
// ====================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ====================================
// CLAUDE API SERVICE OPTIMISÉ
// ====================================

class ClaudeAPI {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.CLAUDE_API_KEY;
    this.model = config.model || process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    this.maxTokens = parseInt(config.maxTokens || process.env.AI_MAX_TOKENS || '4000');
    this.baseURL = 'https://api.anthropic.com/v1/messages';
    
    // Rate limiting (100 calls/hour par défaut)
    this.rateLimiter = {
      calls: [],
      maxCalls: 100,
      timeWindow: 60 * 60 * 1000 // 1 heure
    };
    
    // Cache et optimisations
    this.cache = new Map();
    this.batchQueue = [];
    this.batchTimeout = null;
    
    if (!this.apiKey) {
      throw new Error('Clé API Claude requise');
    }
    
    console.log(`🧠 ClaudeAPI initialisé - Modèle: ${this.model}`);
  }
  
  // ====================================
  // GESTION RATE LIMITING
  // ====================================
  
  checkRateLimit() {
    const now = Date.now();
    
    // Nettoyer les anciens appels
    this.rateLimiter.calls = this.rateLimiter.calls.filter(
      callTime => now - callTime < this.rateLimiter.timeWindow
    );
    
    if (this.rateLimiter.calls.length >= this.rateLimiter.maxCalls) {
      const oldestCall = Math.min(...this.rateLimiter.calls);
      const waitTime = this.rateLimiter.timeWindow - (now - oldestCall);
      throw new Error(`Rate limit atteint. Attendre ${Math.ceil(waitTime / 1000)}s`);
    }
    
    this.rateLimiter.calls.push(now);
    return true;
  }
  
  // ====================================
  // CACHE INTELLIGENT
  // ====================================
  
  getCacheKey(prompt, context = {}) {
    const dataToHash = {
      prompt: prompt.substring(0, 500), // Premier 500 chars pour cache
      contextHash: this.hashObject(context)
    };
    return crypto.createHash('md5').update(JSON.stringify(dataToHash)).digest('hex');
  }
  
  hashObject(obj) {
    return crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex');
  }
  
  // ====================================
  // APPELS API OPTIMISÉS
  // ====================================
  
  async callClaude(prompt, context = {}, options = {}) {
    try {
      // Vérifier cache d'abord
      const cacheKey = this.getCacheKey(prompt, context);
      if (this.cache.has(cacheKey) && !options.bypassCache) {
        console.log('💾 Cache hit - Réponse instantanée');
        return this.cache.get(cacheKey);
      }
      
      // Vérifier rate limit
      this.checkRateLimit();
      
      console.log('🧠 Appel Claude API...');
      const startTime = Date.now();
      
      // Construire le prompt optimisé
      const optimizedPrompt = this.buildOptimizedPrompt(prompt, context);
      
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          messages: [{
            role: 'user',
            content: optimizedPrompt
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const result = {
        content: data.content[0].text,
        usage: data.usage,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
      
      // Mettre en cache
      this.cache.set(cacheKey, result);
      
      console.log(`✅ Claude réponse reçue (${result.responseTime}ms)`);
      return result;
      
    } catch (error) {
      console.error('❌ Erreur Claude API:', error.message);
      
      // Retry une fois en cas d'erreur temporaire
      if (!options.isRetry && error.message.includes('rate limit')) {
        console.log('🔄 Retry dans 2s...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.callClaude(prompt, context, { ...options, isRetry: true });
      }
      
      throw error;
    }
  }
  
  // ====================================
  // PROMPTS OPTIMISÉS
  // ====================================
  
  buildOptimizedPrompt(prompt, context) {
    let optimizedPrompt = prompt;
    
    // Ajouter contexte si fourni
    if (context.file) {
      optimizedPrompt = `FICHIER: ${context.file}\n${optimizedPrompt}`;
    }
    
    if (context.error) {
      optimizedPrompt = `ERREUR: ${context.error}\n${optimizedPrompt}`;
    }
    
    if (context.codeSnippet) {
      optimizedPrompt = `CODE:\n${context.codeSnippet}\n\n${optimizedPrompt}`;
    }
    
    // Limiter la taille du prompt
    if (optimizedPrompt.length > 8000) {
      optimizedPrompt = optimizedPrompt.substring(0, 8000) + '... (tronqué)';
    }
    
    return optimizedPrompt;
  }
  
  // ====================================
  // BATCH REQUESTS (OPTIMISATION)
  // ====================================
  
  async batchAnalyze(requests) {
    if (requests.length === 1) {
      return [await this.callClaude(requests[0].prompt, requests[0].context)];
    }
    
    // Pour plusieurs requêtes, les combiner intelligemment
    const combinedPrompt = requests.map((req, index) => 
      `PROBLÈME ${index + 1}:\n${req.prompt}\n`
    ).join('\n---\n');
    
    const response = await this.callClaude(
      `ANALYSE MULTIPLE:\n${combinedPrompt}\n\nRÉPONDS POUR CHAQUE PROBLÈME SÉPARÉMENT.`,
      { type: 'batch', count: requests.length }
    );
    
    // Parser la réponse pour séparer les solutions
    return this.parseBatchResponse(response.content, requests.length);
  }
  
  parseBatchResponse(content, expectedCount) {
    // Simple parsing - à améliorer selon les besoins
    const sections = content.split(/PROBLÈME \d+:|SOLUTION \d+:/i);
    return sections.slice(1, expectedCount + 1).map(section => ({
      content: section.trim(),
      timestamp: new Date().toISOString()
    }));
  }
}

// ====================================
// INTELLIGENT MEMORY - MÉMOIRE PERSISTANTE
// ====================================

class IntelligentMemory {
  constructor(baseDir = '/data') {
    this.memoryDir = path.join(baseDir, 'ai-memory');
    this.globalStatePath = path.join(this.memoryDir, 'global-state.json');
    this.protectedZonesPath = path.join(this.memoryDir, 'protected-zones.json');
    this.learningCachePath = path.join(this.memoryDir, 'learning-cache', 'cache.json');
    
    this.ensureDirectories();
    this.loadMemory();
    
    console.log('🧠 IntelligentMemory initialisée');
  }
  
  ensureDirectories() {
    const dirs = [
      this.memoryDir,
      path.join(this.memoryDir, 'script-actions'),
      path.join(this.memoryDir, 'file-fingerprints'),
      path.join(this.memoryDir, 'learning-cache')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  loadMemory() {
    try {
      this.globalState = this.loadJSON(this.globalStatePath) || this.createDefaultGlobalState();
      this.protectedZones = this.loadJSON(this.protectedZonesPath) || this.createDefaultProtectedZones();
      this.learningCache = this.loadJSON(this.learningCachePath) || this.createDefaultLearningCache();
    } catch (error) {
      console.warn('⚠️ Erreur chargement mémoire, utilisation valeurs par défaut');
      this.globalState = this.createDefaultGlobalState();
      this.protectedZones = this.createDefaultProtectedZones();
      this.learningCache = this.createDefaultLearningCache();
    }
  }
  
  // ====================================
  // GESTION MÉMOIRE
  // ====================================
  
  remember(key, value, category = 'general') {
    if (!this.learningCache[category]) {
      this.learningCache[category] = {};
    }
    
    this.learningCache[category][key] = {
      value,
      timestamp: new Date().toISOString(),
      accessCount: (this.learningCache[category][key]?.accessCount || 0) + 1
    };
    
    this.saveLearningCache();
  }
  
  recall(key, category = 'general') {
    const memory = this.learningCache[category]?.[key];
    if (memory) {
      memory.accessCount = (memory.accessCount || 0) + 1;
      memory.lastAccessed = new Date().toISOString();
      this.saveLearningCache();
      return memory.value;
    }
    return null;
  }
  
  learn(problem, solution, success, metadata = {}) {
    const problemHash = crypto.createHash('md5').update(problem).digest('hex');
    const learningEntry = {
      problem,
      solution,
      success,
      metadata,
      timestamp: new Date().toISOString(),
      confidence: success ? 0.8 : 0.2
    };
    
    if (success) {
      this.remember(problemHash, learningEntry, 'successfulFixes');
    } else {
      this.remember(problemHash, learningEntry, 'failedAttempts');
    }
    
    this.updateGlobalStats(success);
  }
  
  // ====================================
  // FINGERPRINTS FICHIERS
  // ====================================
  
  getFileFingerprint(filePath) {
    try {
      if (!fs.existsSync(filePath)) return null;
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const hash = crypto.createHash('md5').update(content).digest('hex');
      const stats = fs.statSync(filePath);
      
      return {
        hash,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        lines: content.split('\n').length
      };
    } catch (error) {
      return null;
    }
  }
  
  hasFileChanged(filePath) {
    const currentFingerprint = this.getFileFingerprint(filePath);
    const storedFingerprint = this.loadJSON(
      path.join(this.memoryDir, 'file-fingerprints', `${path.basename(filePath)}.json`)
    );
    
    if (!storedFingerprint || !currentFingerprint) return true;
    
    return currentFingerprint.hash !== storedFingerprint.hash;
  }
  
  saveFileFingerprint(filePath) {
    const fingerprint = this.getFileFingerprint(filePath);
    if (fingerprint) {
      const fingerprintPath = path.join(
        this.memoryDir, 
        'file-fingerprints', 
        `${path.basename(filePath)}.json`
      );
      fs.writeFileSync(fingerprintPath, JSON.stringify(fingerprint, null, 2));
    }
  }
  
  // ====================================
  // UTILITAIRES
  // ====================================
  
  loadJSON(filePath) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
      return null;
    }
  }
  
  saveJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
  
  saveLearningCache() {
    this.saveJSON(this.learningCachePath, this.learningCache);
  }
  
  saveGlobalState() {
    this.saveJSON(this.globalStatePath, this.globalState);
  }
  
  updateGlobalStats(success) {
    this.globalState.metrics.totalCalls++;
    if (success) {
      this.globalState.metrics.successCount = (this.globalState.metrics.successCount || 0) + 1;
    }
    this.globalState.metrics.successRate = 
      this.globalState.metrics.successCount / this.globalState.metrics.totalCalls;
    
    this.saveGlobalState();
  }
  
  // ====================================
  // VALEURS PAR DÉFAUT
  // ====================================
  
  createDefaultGlobalState() {
    return {
      initialized: true,
      timestamp: new Date().toISOString(),
      metrics: {
        totalCalls: 0,
        successCount: 0,
        successRate: 0,
        averageResponseTime: 0
      },
      currentSession: crypto.randomBytes(8).toString('hex')
    };
  }
  
  createDefaultProtectedZones() {
    return {
      doNotTouch: [
        'src/custom/',
        '*.config.js',
        '// CUSTOM:',
        '/* CUSTOM:',
        '// USER:',
        '/* USER:'
      ],
      requireConfirmation: [
        'package.json',
        'prisma/schema.prisma',
        'next.config.js'
      ],
      surgicalOnly: [
        'src/components/',
        'src/lib/',
        'src/hooks/',
        'src/types/',
        'src/app/'
      ]
    };
  }
  
  createDefaultLearningCache() {
    return {
      successfulFixes: {},
      failedAttempts: {},
      patterns: {},
      lastUpdated: new Date().toISOString()
    };
  }
}

// ====================================
// PROTECTED ZONES MANAGER
// ====================================

class ProtectedZones {
  constructor(memory) {
    this.memory = memory;
    this.zones = memory.protectedZones;
    console.log('🛡️ ProtectedZones initialisé');
  }
  
  isProtected(filePath) {
    return this.zones.doNotTouch.some(pattern => {
      if (pattern.includes('/')) {
        return filePath.includes(pattern);
      }
      return filePath.includes(pattern) || path.basename(filePath).includes(pattern);
    });
  }
  
  requiresConfirmation(filePath) {
    return this.zones.requireConfirmation.some(pattern => {
      return filePath.includes(pattern) || path.basename(filePath) === pattern;
    });
  }
  
  isSurgicalOnly(filePath) {
    return this.zones.surgicalOnly.some(pattern => {
      return filePath.includes(pattern);
    });
  }
  
  canModify(filePath, content = '') {
    // Vérifier si le fichier est protégé
    if (this.isProtected(filePath)) {
      console.log(`🛡️ Fichier protégé: ${filePath}`);
      return false;
    }
    
    // Vérifier les blocs custom dans le contenu
    if (content.includes('// CUSTOM:') || content.includes('/* CUSTOM:')) {
      console.log(`🛡️ Contenu personnalisé détecté dans: ${filePath}`);
      return false;
    }
    
    return true;
  }
  
  backupFile(filePath) {
    try {
      const backupDir = path.join('/data/ai-memory', 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `${path.basename(filePath)}.${timestamp}.backup`);
      
      fs.copyFileSync(filePath, backupPath);
      console.log(`💾 Backup créé: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error(`❌ Erreur backup ${filePath}:`, error.message);
      return null;
    }
  }
}

// ====================================
// INTER-SCRIPT COMMUNICATION
// ====================================

class InterScript {
  constructor(memory) {
    this.memory = memory;
    this.messagesDir = path.join('/data/ai-memory', 'messages');
    this.ensureMessageDir();
    console.log('📡 InterScript communication initialisée');
  }
  
  ensureMessageDir() {
    if (!fs.existsSync(this.messagesDir)) {
      fs.mkdirSync(this.messagesDir, { recursive: true });
    }
  }
  
  sendMessage(from, to, message, data = {}) {
    const messageId = crypto.randomBytes(8).toString('hex');
    const messageData = {
      id: messageId,
      from,
      to,
      message,
      data,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    const messagePath = path.join(this.messagesDir, `${to}-${messageId}.json`);
    fs.writeFileSync(messagePath, JSON.stringify(messageData, null, 2));
    
    console.log(`📧 Message envoyé: ${from} → ${to}`);
    return messageId;
  }
  
  getMessages(scriptName) {
    try {
      const files = fs.readdirSync(this.messagesDir);
      const messageFiles = files.filter(file => file.startsWith(`${scriptName}-`));
      
      return messageFiles.map(file => {
        const messagePath = path.join(this.messagesDir, file);
        return JSON.parse(fs.readFileSync(messagePath, 'utf-8'));
      }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (error) {
      return [];
    }
  }
  
  markAsRead(messageId) {
    try {
      const files = fs.readdirSync(this.messagesDir);
      const messageFile = files.find(file => file.includes(messageId));
      
      if (messageFile) {
        const messagePath = path.join(this.messagesDir, messageFile);
        const message = JSON.parse(fs.readFileSync(messagePath, 'utf-8'));
        message.read = true;
        fs.writeFileSync(messagePath, JSON.stringify(message, null, 2));
      }
    } catch (error) {
      console.error('❌ Erreur marquage message lu:', error.message);
    }
  }
  
  cleanOldMessages(maxAge = 24 * 60 * 60 * 1000) { // 24h par défaut
    try {
      const files = fs.readdirSync(this.messagesDir);
      const now = Date.now();
      
      files.forEach(file => {
        const filePath = path.join(this.messagesDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
        }
      });
    } catch (error) {
      console.error('❌ Erreur nettoyage messages:', error.message);
    }
  }
}

// ====================================
// AI INFRASTRUCTURE PRINCIPAL
// ====================================

class AIInfrastructure {
  constructor(config = {}) {
    console.log('🚀 Initialisation AI Infrastructure...');
    
    // Initialiser les composants
    this.claudeAPI = new ClaudeAPI(config);
    this.memory = new IntelligentMemory(config.baseDir);
    this.protectedZones = new ProtectedZones(this.memory);
    this.interScript = new InterScript(this.memory);
    
    console.log('✅ AI Infrastructure initialisée avec succès');
  }
  
  // ====================================
  // MÉTHODES PRINCIPALES
  // ====================================
  
  async surgicalFix(problem, context = {}) {
    const startTime = Date.now();
    
    try {
      // Vérifier si on a déjà résolu ce problème
      const problemHash = crypto.createHash('md5').update(problem).digest('hex');
      const knownSolution = this.memory.recall(problemHash, 'successfulFixes');
      
      if (knownSolution && knownSolution.confidence > 0.8) {
        console.log('💾 Solution connue trouvée dans le cache');
        return {
          solution: knownSolution.solution,
          fromCache: true,
          confidence: knownSolution.confidence
        };
      }
      
      // Appeler Claude pour une nouvelle solution
      const prompt = this.buildSurgicalPrompt(problem, context);
      const response = await this.claudeAPI.callClaude(prompt, context);
      
      const result = {
        solution: response.content,
        fromCache: false,
        responseTime: Date.now() - startTime,
        usage: response.usage
      };
      
      return result;
      
    } catch (error) {
      console.error('❌ Erreur surgicalFix:', error.message);
      throw error;
    }
  }
  
  buildSurgicalPrompt(problem, context) {
    return `Tu es un expert en corrections chirurgicales de code.

PROBLÈME À RÉSOUDRE:
${problem}

RÈGLES STRICTES:
- Correction MINIMALE et PRÉCISE seulement
- JAMAIS toucher à la logique métier
- Préserver l'architecture existante
- Modifications ciblées uniquement

CONTEXTE:
${JSON.stringify(context, null, 2)}

RETOURNE la correction exacte à appliquer en format JSON:
{
  "action": "modifier_fichier|ajouter_import|corriger_type",
  "file": "chemin/vers/fichier",
  "line": numero_ligne_ou_null,
  "oldCode": "code_actuel",
  "newCode": "code_corrigé",
  "explanation": "explication_courte"
}`;
  }
  
  // ====================================
  // UTILITAIRES PUBLIQUES
  // ====================================
  
  canModifyFile(filePath) {
    const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
    return this.protectedZones.canModify(filePath, content);
  }
  
  backupFile(filePath) {
    return this.protectedZones.backupFile(filePath);
  }
  
  recordAction(scriptName, action, success, metadata = {}) {
    this.memory.learn(
      `${scriptName}:${action}`,
      metadata,
      success,
      { script: scriptName, action, ...metadata }
    );
  }
  
  sendScriptMessage(from, to, message, data = {}) {
    return this.interScript.sendMessage(from, to, message, data);
  }
  
  getScriptMessages(scriptName) {
    return this.interScript.getMessages(scriptName);
  }
  
  getGlobalState() {
    return this.memory.globalState;
  }
  
  cleanup() {
    // Nettoyage périodique
    this.interScript.cleanOldMessages();
    console.log('🧹 Nettoyage AI Infrastructure terminé');
  }
}

// ====================================
// EXPORT
// ====================================

module.exports = {
  AIInfrastructure,
  ClaudeAPI,
  IntelligentMemory,
  ProtectedZones,
  InterScript
};

// ====================================
// POINT D'ENTRÉE POUR TESTS
// ====================================

if (require.main === module) {
  console.log('🧪 Test AI Infrastructure...');
  
  const config = {
    apiKey: process.env.CLAUDE_API_KEY,
    model: process.env.CLAUDE_MODEL,
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000')
  };
  
  try {
    const ai = new AIInfrastructure(config);
    console.log('✅ Test réussi - AI Infrastructure opérationnelle');
  } catch (error) {
    console.error('❌ Test échoué:', error.message);
    process.exit(1);
  }
}