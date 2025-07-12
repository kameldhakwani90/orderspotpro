#!/usr/bin/env node

// ====================================
// 🧠 AI INFRASTRUCTURE - API CLAUDE CORRIGÉE
// ====================================
// Emplacement: /data/appfolder/tools/ai-infrastructure.js
// Version: 4.1 - CORRIGÉE - Méthode optimizeCall ajoutée
// Corrections: Toutes les méthodes manquantes implémentées
// ====================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ====================================
// CLASSE CLAUDE API CORRIGÉE
// ====================================

class ClaudeAPI {
  constructor(config = {}) {
    this.apiKey = config.claudeApiKey || process.env.CLAUDE_API_KEY;
    this.model = config.model || 'claude-3-5-sonnet-20241022';
    this.maxTokens = config.maxTokens || 4000;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
    
    // Cache et retry
    this.cache = new Map();
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    
    console.log(`🧠 ClaudeAPI initialisé - Modèle: ${this.model}`);
  }
  
  // ====================================
  // MÉTHODE OPTIMIZECALL - CORRECTION PRINCIPALE
  // ====================================
  
  async optimizeCall(type, prompt, context = {}) {
    try {
      // Cache key pour éviter appels dupliqués
      const cacheKey = this.generateCacheKey(type, prompt);
      
      if (this.cache.has(cacheKey)) {
        console.log(`💾 Cache hit pour ${type}`);
        return this.cache.get(cacheKey);
      }
      
      // Construire prompt optimisé selon le type
      const optimizedPrompt = this.buildOptimizedPrompt(type, prompt, context);
      
      // Appel API avec retry
      const response = await this.callClaude(optimizedPrompt);
      
      // Cache la réponse
      this.cache.set(cacheKey, response);
      
      return response;
      
    } catch (error) {
      console.error(`❌ optimizeCall échoué pour ${type}:`, error.message);
      
      // Fallback basique si IA échoue
      return this.generateFallbackResponse(type, prompt);
    }
  }
  
  buildOptimizedPrompt(type, prompt, context) {
    const systemPrompts = {
      'function-generation': `Tu es un expert en génération automatique de code TypeScript/Prisma.
MISSION: Générer du code propre et fonctionnel.
RÈGLES: Syntaxe parfaite, pas de commentaires dans les noms de fonctions.`,
      
      'error-correction': `Tu es un expert en correction d'erreurs JavaScript/TypeScript.
MISSION: Corriger les erreurs de syntaxe et compilation.
RÈGLES: Corrections minimales, préserver la logique existante.`,
      
      'code-optimization': `Tu es un expert en optimisation de code.
MISSION: Améliorer les performances sans casser la fonctionnalité.
RÈGLES: Optimisations sûres seulement.`
    };
    
    const systemPrompt = systemPrompts[type] || systemPrompts['error-correction'];
    
    return `${systemPrompt}

${prompt}

IMPORTANT: Réponse en JSON valide seulement.`;
  }
  
  generateFallbackResponse(type, prompt) {
    // Fallback simple si IA échoue
    const fallbacks = {
      'function-generation': {
        success: false,
        code: '// Fonction générée automatiquement\nexport async function placeholder() {\n  return null;\n}',
        explanation: 'Fallback générique'
      },
      'error-correction': {
        success: false,
        fix: null,
        explanation: 'Correction manuelle requise'
      }
    };
    
    return fallbacks[type] || fallbacks['error-correction'];
  }
  
  // ====================================
  // MÉTHODE GENERATECORRECTIONS - CORRECTION
  // ====================================
  
  async generateCorrections(projectDir) {
    try {
      console.log('🔧 Génération corrections automatiques...');
      
      const errors = this.scanForErrors(projectDir);
      const corrections = [];
      
      for (const error of errors) {
        try {
          const correction = await this.optimizeCall('error-correction', 
            `Corrige cette erreur: ${error.message}\nFichier: ${error.file}`, 
            { error }
          );
          
          if (correction && correction.fix) {
            corrections.push({
              file: error.file,
              error: error.message,
              fix: correction.fix
            });
          }
        } catch (err) {
          console.log(`⚠️ Correction échouée pour ${error.file}`);
        }
      }
      
      return corrections;
      
    } catch (error) {
      console.error('❌ generateCorrections échoué:', error.message);
      return [];
    }
  }
  
  scanForErrors(projectDir) {
    const errors = [];
    
    try {
      // Scanner les fichiers pour erreurs communes
      const files = this.getAllFiles(projectDir, ['.ts', '.tsx', '.js', '.jsx']);
      
      files.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          
          // Détecter erreurs syntaxe communes
          if (content.includes('export async function //')) {
            errors.push({
              file: path.relative(projectDir, file),
              message: 'Syntaxe fonction export invalide',
              type: 'syntax'
            });
          }
          
          if (content.includes(' as ') && content.includes('(...args')) {
            errors.push({
              file: path.relative(projectDir, file),
              message: 'Syntaxe as avec fonction invalide',
              type: 'syntax'
            });
          }
          
        } catch (err) {
          // Ignorer erreurs lecture fichier
        }
      });
      
    } catch (error) {
      console.error('❌ Scan erreurs échoué:', error.message);
    }
    
    return errors;
  }
  
  getAllFiles(dir, extensions) {
    let files = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!['node_modules', '.git', '.next', 'dist'].includes(item)) {
            files = files.concat(this.getAllFiles(fullPath, extensions));
          }
        } else if (extensions.includes(path.extname(item))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignorer erreurs
    }
    
    return files;
  }
  
  // ====================================
  // MÉTHODE SURGICALFIX - CORRECTION
  // ====================================
  
  async surgicalFix(problem, context = {}) {
    try {
      const prompt = `Correction chirurgicale requise:

PROBLÈME: ${problem}
CONTEXTE: ${JSON.stringify(context, null, 2)}

Retourne la correction exacte en JSON:
{
  "action": "modify_file|fix_syntax|remove_duplicate",
  "file": "chemin/fichier",
  "fix": "correction_exacte",
  "explanation": "raison"
}`;

      const response = await this.optimizeCall('error-correction', prompt, context);
      
      return {
        solution: response,
        fromCache: false,
        confidence: 0.8
      };
      
    } catch (error) {
      console.error('❌ surgicalFix échoué:', error.message);
      return {
        solution: null,
        fromCache: false,
        confidence: 0
      };
    }
  }
  
  // ====================================
  // APPEL API CLAUDE PRINCIPAL
  // ====================================
  
  async callClaude(prompt, retryCount = 0) {
    try {
      if (!this.apiKey) {
        throw new Error('Clé API Claude manquante');
      }
      
      const requestBody = {
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      };
      
      // Import dynamique de fetch
      const fetch = (await import('node-fetch')).default;
      
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        if (response.status === 429 && retryCount < this.retryAttempts) {
          // Rate limit - retry avec délai
          console.log(`⏰ Rate limit - Retry ${retryCount + 1}/${this.retryAttempts}`);
          await this.sleep(this.retryDelay * (retryCount + 1));
          return this.callClaude(prompt, retryCount + 1);
        }
        
        throw new Error(`API Claude erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.content && data.content[0] && data.content[0].text) {
        return data.content[0].text;
      }
      
      throw new Error('Réponse API Claude invalide');
      
    } catch (error) {
      if (retryCount < this.retryAttempts) {
        console.log(`🔄 Retry API Claude ${retryCount + 1}/${this.retryAttempts}`);
        await this.sleep(this.retryDelay);
        return this.callClaude(prompt, retryCount + 1);
      }
      
      throw error;
    }
  }
  
  // ====================================
  // UTILITAIRES
  // ====================================
  
  generateCacheKey(type, prompt) {
    const content = `${type}:${prompt.substring(0, 100)}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  clearCache() {
    this.cache.clear();
    console.log('💾 Cache Claude vidé');
  }
}

// ====================================
// CLASSE INTELLIGENT MEMORY
// ====================================

class IntelligentMemory {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.memoryFile = path.join(baseDir, '.ai-memory.json');
    this.memory = this.loadMemory();
    
    console.log('🧠 IntelligentMemory initialisée');
  }
  
  loadMemory() {
    try {
      if (fs.existsSync(this.memoryFile)) {
        return JSON.parse(fs.readFileSync(this.memoryFile, 'utf-8'));
      }
    } catch (error) {
      console.log('⚠️ Erreur chargement mémoire IA');
    }
    
    return {
      successfulFixes: {},
      errorPatterns: {},
      learningData: {}
    };
  }
  
  recall(key, category = 'successfulFixes') {
    return this.memory[category]?.[key] || null;
  }
  
  remember(key, value, category = 'successfulFixes') {
    if (!this.memory[category]) {
      this.memory[category] = {};
    }
    
    this.memory[category][key] = {
      ...value,
      timestamp: new Date().toISOString(),
      accessCount: (this.memory[category][key]?.accessCount || 0) + 1
    };
    
    this.saveMemory();
  }
  
  learn(pattern, solution, success, metadata = {}) {
    const learningKey = crypto.createHash('md5').update(pattern).digest('hex');
    
    this.remember(learningKey, {
      pattern,
      solution,
      success,
      metadata,
      confidence: success ? 0.9 : 0.3
    }, 'learningData');
  }
  
  saveMemory() {
    try {
      fs.writeFileSync(this.memoryFile, JSON.stringify(this.memory, null, 2));
    } catch (error) {
      console.log('⚠️ Erreur sauvegarde mémoire IA');
    }
  }
}

// ====================================
// CLASSE PROTECTED ZONES
// ====================================

class ProtectedZones {
  constructor(memory) {
    this.memory = memory;
    this.protectedPatterns = [
      /\/node_modules\//,
      /\/\.git\//,
      /\/\.next\//,
      /package\.json$/,
      /package-lock\.json$/
    ];
  }
  
  canModifyFile(filePath) {
    return !this.protectedPatterns.some(pattern => pattern.test(filePath));
  }
  
  isProtectedZone(filePath) {
    return !this.canModifyFile(filePath);
  }
}

// ====================================
// CLASSE INTER SCRIPT COMMUNICATION
// ====================================

class InterScript {
  constructor(memory) {
    this.memory = memory;
    this.messages = new Map();
  }
  
  sendMessage(from, to, message, data = {}) {
    const messageId = crypto.randomUUID();
    
    this.messages.set(messageId, {
      id: messageId,
      from,
      to,
      message,
      data,
      timestamp: new Date().toISOString(),
      read: false
    });
    
    return messageId;
  }
  
  getMessages(scriptName) {
    const messages = Array.from(this.messages.values())
      .filter(msg => msg.to === scriptName && !msg.read);
    
    // Marquer comme lus
    messages.forEach(msg => {
      msg.read = true;
      this.messages.set(msg.id, msg);
    });
    
    return messages;
  }
}

// ====================================
// CLASSE AI INFRASTRUCTURE PRINCIPALE
// ====================================

class AIInfrastructure {
  constructor(config = {}) {
    this.config = config;
    this.baseDir = config.baseDir || process.cwd();
    
    // Initialisation composants
    this.claude = new ClaudeAPI(config);
    this.memory = new IntelligentMemory(this.baseDir);
    this.protectedZones = new ProtectedZones(this.memory);
    this.interScript = new InterScript(this.memory);
    
    // Code generator avec corrections
    this.codeGenerator = {
      generateCorrections: (projectDir) => this.claude.generateCorrections(projectDir),
      optimizeCall: (type, prompt, context) => this.claude.optimizeCall(type, prompt, context),
      surgicalFix: (problem, context) => this.claude.surgicalFix(problem, context)
    };
    
    console.log('✅ AI Infrastructure initialisée avec succès');
  }
  
  // Méthode principale pour corrections
  async surgicalFix(problem, context = {}) {
    return await this.claude.surgicalFix(problem, context);
  }
  
  // Wrapper pour compatibilité
  async generateCorrections(projectDir) {
    return await this.claude.generateCorrections(projectDir);
  }
  
  // Nettoyage ressources
  cleanup() {
    this.claude.clearCache();
    this.memory.saveMemory();
    console.log('🧹 Ressources IA nettoyées');
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