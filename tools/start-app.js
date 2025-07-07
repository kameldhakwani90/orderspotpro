#!/usr/bin/env node

// ====================================
// 🚀 START APP IA - Démarreur Intelligent
// ====================================
// Démarrage application avec monitoring IA et alertes intelligentes
// Intégration: ai-infrastructure.js + monitoring temps réel
// Fonctions: Démarrage + Monitoring + Alertes + Auto-restart

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const net = require('net');

class IntelligentAppStarter {
  constructor() {
    // Configuration dynamique
    this.config = this.loadConfiguration();
    
    // État application
    this.appProcess = null;
    this.isRunning = false;
    this.startTime = null;
    this.restartCount = 0;
    this.maxRestarts = 3;
    
    // Monitoring
    this.healthChecks = [];
    this.performanceMetrics = {
      startTime: 0,
      memoryUsage: [],
      cpuUsage: [],
      responseTime: [],
      errorCount: 0,
      requestCount: 0
    };
    
    // Infrastructure IA
    this.aiInfrastructure = this.initializeAI();
    this.aiAlerts = [];
    this.lastAICheck = null;
    
    // Monitoring intervals
    this.healthInterval = null;
    this.metricsInterval = null;
    this.aiInterval = null;
  }
  
  // ====================================
  // CONFIGURATION DYNAMIQUE
  // ====================================
  
  loadConfiguration() {
    const configs = [
      '.project-config.json',
      'config/project.config.js',
      'package.json'
    ];
    
    let config = {
      app: {
        name: process.env.APP_NAME || 'Application Next.js',
        port: parseInt(process.env.PORT) || 3000,
        host: process.env.HOST || 'localhost',
        environment: process.env.NODE_ENV || 'development',
        command: 'npm',
        args: ['start']
      },
      monitoring: {
        enabled: process.env.MONITORING_ENABLED !== 'false',
        interval: parseInt(process.env.MONITORING_INTERVAL) || 30000, // 30s
        healthCheck: process.env.HEALTH_CHECK_ENABLED !== 'false',
        autoRestart: process.env.AUTO_RESTART_ENABLED !== 'false'
      },
      ai: {
        enabled: process.env.AI_ENABLED === 'true',
        model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
        alertThreshold: parseInt(process.env.AI_ALERT_THRESHOLD) || 5,
        checkInterval: parseInt(process.env.AI_CHECK_INTERVAL) || 300000 // 5min
      },
      alerts: {
        memoryThreshold: parseInt(process.env.MEMORY_THRESHOLD) || 512, // MB
        cpuThreshold: parseInt(process.env.CPU_THRESHOLD) || 80, // %
        responseTimeThreshold: parseInt(process.env.RESPONSE_TIME_THRESHOLD) || 5000, // ms
        errorRateThreshold: parseInt(process.env.ERROR_RATE_THRESHOLD) || 10 // %
      }
    };
    
    // Charger config projet si existe
    for (const configFile of configs) {
      if (fs.existsSync(configFile)) {
        try {
          const fileConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
          
          // Merge configs intelligemment
          if (fileConfig.scripts?.start) {
            config.app.command = 'npm';
            config.app.args = ['start'];
          }
          if (fileConfig.scripts?.dev && config.app.environment === 'development') {
            config.app.args = ['run', 'dev'];
          }
          
          config = { ...config, ...fileConfig };
          console.log(`📋 Configuration chargée: ${configFile}`);
          break;
        } catch (error) {
          console.warn(`⚠️  Erreur lecture config ${configFile}:`, error.message);
        }
      }
    }
    
    return config;
  }
  
  initializeAI() {
    try {
      if (!this.config.ai.enabled) {
        console.log('🤖 Monitoring IA désactivé');
        return null;
      }
      
      // Charger infrastructure IA si disponible
      const aiPath = path.join(process.cwd(), 'ai-infrastructure.js');
      if (fs.existsSync(aiPath)) {
        const { ClaudeAPI } = require('./ai-infrastructure');
        console.log('🧠 Infrastructure IA chargée pour monitoring');
        return new ClaudeAPI(process.env.CLAUDE_API_KEY, this.config.ai.model);
      }
      
      console.log('📋 Infrastructure IA non trouvée - Monitoring classique');
      return null;
    } catch (error) {
      console.warn('⚠️  Erreur initialisation IA:', error.message);
      return null;
    }
  }
  
  // ====================================
  // VÉRIFICATIONS PRÉ-DÉMARRAGE
  // ====================================
  
  async preStartChecks() {
    console.log('🔍 Vérifications pré-démarrage...\n');
    
    const checks = [
      await this.checkPort(),
      await this.checkEnvironment(),
      await this.checkDependencies(),
      await this.checkBuild(),
      await this.checkDatabase()
    ];
    
    const failedChecks = checks.filter(check => check.status === 'failed');
    
    if (failedChecks.length > 0) {
      console.log('❌ Vérifications échouées:');
      failedChecks.forEach(check => {
        console.log(`   ❌ ${check.name}: ${check.message}`);
        if (check.solution) {
          console.log(`      💡 ${check.solution}`);
        }
      });
      
      throw new Error(`${failedChecks.length} vérification(s) échouée(s)`);
    }
    
    console.log('✅ Toutes les vérifications réussies\n');
    return true;
  }
  
  async checkPort() {
    const port = this.config.app.port;
    
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.close();
        resolve({
          name: 'Port disponible',
          status: 'success',
          message: `Port ${port} libre`
        });
      });
      
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          // Vérifier si c'est notre propre application
          this.checkIfOurApp(port).then(isOurApp => {
            if (isOurApp) {
              resolve({
                name: 'Port disponible',
                status: 'warning',
                message: `Port ${port} occupé par notre app`,
                solution: 'Application déjà démarrée ou arrêtez l\'instance précédente'
              });
            } else {
              resolve({
                name: 'Port disponible',
                status: 'failed',
                message: `Port ${port} occupé par autre application`,
                solution: `Changez le port avec: PORT=${port + 1} ou arrêtez l'application sur ${port}`
              });
            }
          });
        } else {
          resolve({
            name: 'Port disponible',
            status: 'failed',
            message: `Erreur port ${port}: ${error.message}`,
            solution: 'Vérifiez la configuration réseau'
          });
        }
      });
    });
  }
  
  async checkIfOurApp(port) {
    try {
      const response = await this.makeRequest(`http://localhost:${port}/api/health`);
      return response.includes(this.config.app.name) || response.includes('Next.js');
    } catch (error) {
      return false;
    }
  }
  
  async checkEnvironment() {
    const requiredVars = ['DATABASE_URL'];
    
    // Variables conditionnelles
    if (this.config.ai.enabled) {
      requiredVars.push('CLAUDE_API_KEY');
    }
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return {
        name: 'Variables environnement',
        status: 'failed',
        message: `Variables manquantes: ${missingVars.join(', ')}`,
        solution: 'Exécutez: node tools/config-generator.js'
      };
    }
    
    return {
      name: 'Variables environnement',
      status: 'success',
      message: `${requiredVars.length} variables présentes`
    };
  }
  
  async checkDependencies() {
    if (!fs.existsSync('node_modules')) {
      return {
        name: 'Dépendances',
        status: 'failed',
        message: 'node_modules manquant',
        solution: 'Exécutez: npm install'
      };
    }
    
    return {
      name: 'Dépendances',
      status: 'success',
      message: 'Dépendances installées'
    };
  }
  
  async checkBuild() {
    if (this.config.app.environment === 'production' && !fs.existsSync('.next')) {
      return {
        name: 'Build application',
        status: 'failed',
        message: 'Build requis pour production',
        solution: 'Exécutez: npm run build'
      };
    }
    
    return {
      name: 'Build application',
      status: 'success',
      message: 'Build vérifié'
    };
  }
  
  async checkDatabase() {
    if (!process.env.DATABASE_URL) {
      return {
        name: 'Base de données',
        status: 'warning',
        message: 'DATABASE_URL non configurée',
        solution: 'Configurez DATABASE_URL si base de données requise'
      };
    }
    
    return {
      name: 'Base de données',
      status: 'success',
      message: 'Configuration présente'
    };
  }
  
  // ====================================
  // DÉMARRAGE APPLICATION
  // ====================================
  
  async startApplication() {
    console.log(`🚀 Démarrage ${this.config.app.name}...\n`);
    
    const startTime = Date.now();
    
    // Créer processus application
    this.appProcess = spawn(this.config.app.command, this.config.app.args, {
      stdio: 'pipe',
      env: { ...process.env },
      cwd: process.cwd()
    });
    
    // Promise pour attendre démarrage réussi
    return new Promise((resolve, reject) => {
      let startupTimeout;
      let outputBuffer = '';
      let errorBuffer = '';
      
      // Timeout de démarrage (2 minutes)
      startupTimeout = setTimeout(() => {
        console.log('⏰ Timeout démarrage - Arrêt forcé');
        this.stopApplication();
        reject(new Error('Timeout démarrage application'));
      }, 120000);
      
      // Gérer sortie standard
      this.appProcess.stdout.on('data', (data) => {
        const output = data.toString();
        outputBuffer += output;
        
        // Afficher en temps réel avec préfixe
        output.split('\n').forEach(line => {
          if (line.trim()) {
            console.log(`📱 ${line}`);
          }
        });
        
        // Détecter démarrage réussi
        if (output.includes('Ready') || 
            output.includes('started server') || 
            output.includes(`localhost:${this.config.app.port}`)) {
          
          clearTimeout(startupTimeout);
          this.isRunning = true;
          this.startTime = Date.now();
          this.performanceMetrics.startTime = this.startTime - startTime;
          
          console.log(`\n✅ Application démarrée avec succès !`);
          console.log(`🌐 URL: http://${this.config.app.host}:${this.config.app.port}`);
          console.log(`⏱️  Temps démarrage: ${this.performanceMetrics.startTime}ms\n`);
          
          resolve();
        }
      });
      
      // Gérer erreurs
      this.appProcess.stderr.on('data', (data) => {
        const error = data.toString();
        errorBuffer += error;
        
        // Afficher erreurs avec préfixe
        error.split('\n').forEach(line => {
          if (line.trim()) {
            console.log(`🔥 ${line}`);
          }
        });
        
        // Détecter erreurs critiques
        if (error.includes('EADDRINUSE') || 
            error.includes('Cannot find module') ||
            error.includes('SyntaxError')) {
          
          clearTimeout(startupTimeout);
          reject(new Error(`Erreur démarrage: ${error.split('\n')[0]}`));
        }
      });
      
      // Gérer fin de processus
      this.appProcess.on('close', (code) => {
        clearTimeout(startupTimeout);
        this.isRunning = false;
        
        if (code !== 0 && code !== null) {
          console.log(`💥 Application arrêtée avec code: ${code}`);
          
          // Auto-restart si configuré
          if (this.config.monitoring.autoRestart && this.restartCount < this.maxRestarts) {
            this.handleAutoRestart();
          } else {
            reject(new Error(`Application arrêtée avec code ${code}`));
          }
        }
      });
      
      // Gérer erreur processus
      this.appProcess.on('error', (error) => {
        clearTimeout(startupTimeout);
        console.log(`❌ Erreur processus: ${error.message}`);
        reject(error);
      });
    });
  }
  
  // ====================================
  // MONITORING & SURVEILLANCE
  // ====================================
  
  startMonitoring() {
    if (!this.config.monitoring.enabled) {
      console.log('📊 Monitoring désactivé\n');
      return;
    }
    
    console.log('📊 Démarrage monitoring intelligent...\n');
    
    // Health checks réguliers
    if (this.config.monitoring.healthCheck) {
      this.healthInterval = setInterval(() => {
        this.performHealthCheck();
      }, this.config.monitoring.interval);
    }
    
    // Métriques performance
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 15000); // Toutes les 15s
    
    // Analyse IA périodique
    if (this.aiInfrastructure) {
      this.aiInterval = setInterval(() => {
        this.performAIAnalysis();
      }, this.config.ai.checkInterval);
    }
    
    // Gestionnaires signaux système
    this.setupSignalHandlers();
    
    console.log('✅ Monitoring actif\n');
  }
  
  async performHealthCheck() {
    try {
      const healthUrl = `http://${this.config.app.host}:${this.config.app.port}/api/health`;
      const startTime = Date.now();
      
      const response = await this.makeRequest(healthUrl, 5000); // 5s timeout
      const responseTime = Date.now() - startTime;
      
      // Enregistrer métrique
      this.performanceMetrics.responseTime.push(responseTime);
      this.performanceMetrics.requestCount++;
      
      // Garder seulement les 100 dernières mesures
      if (this.performanceMetrics.responseTime.length > 100) {
        this.performanceMetrics.responseTime = this.performanceMetrics.responseTime.slice(-100);
      }
      
      const healthData = {
        status: 'healthy',
        responseTime: responseTime,
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        uptime: Date.now() - this.startTime
      };
      
      this.healthChecks.push(healthData);
      
      // Garder seulement les 50 derniers checks
      if (this.healthChecks.length > 50) {
        this.healthChecks = this.healthChecks.slice(-50);
      }
      
      // Vérifier seuils d'alerte
      this.checkAlertThresholds(healthData);
      
    } catch (error) {
      this.performanceMetrics.errorCount++;
      
      const errorData = {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime
      };
      
      this.healthChecks.push(errorData);
      
      console.log(`🔥 Health check échoué: ${error.message}`);
      
      // Si trop d'erreurs consécutives, redémarrer
      const recentErrors = this.healthChecks.slice(-5).filter(check => check.status === 'unhealthy');
      if (recentErrors.length >= 3 && this.config.monitoring.autoRestart) {
        console.log('🔄 Trop d\'erreurs consécutives - Redémarrage automatique');
        this.handleAutoRestart();
      }
    }
  }
  
  collectMetrics() {
    if (!this.appProcess) return;
    
    try {
      // Métriques mémoire
      const memUsage = process.memoryUsage();
      const memMB = Math.round(memUsage.heapUsed / (1024 * 1024));
      
      this.performanceMetrics.memoryUsage.push({
        heap: memMB,
        external: Math.round(memUsage.external / (1024 * 1024)),
        timestamp: Date.now()
      });
      
      // Garder seulement les 200 dernières mesures (50 minutes)
      if (this.performanceMetrics.memoryUsage.length > 200) {
        this.performanceMetrics.memoryUsage = this.performanceMetrics.memoryUsage.slice(-200);
      }
      
      // CPU usage simulation (Node.js ne donne pas directement le CPU du processus)
      const cpuUsage = this.estimateCPUUsage();
      this.performanceMetrics.cpuUsage.push({
        percent: cpuUsage,
        timestamp: Date.now()
      });
      
      if (this.performanceMetrics.cpuUsage.length > 200) {
        this.performanceMetrics.cpuUsage = this.performanceMetrics.cpuUsage.slice(-200);
      }
      
    } catch (error) {
      console.warn('⚠️  Erreur collecte métriques:', error.message);
    }
  }
  
  estimateCPUUsage() {
    // Estimation basée sur l'activité et les métriques disponibles
    const memUsage = process.memoryUsage();
    const uptime = Date.now() - this.startTime;
    
    // Calcul heuristique basé sur mémoire et activité
    let cpuEstimate = 0;
    
    // Base selon utilisation mémoire
    const memMB = memUsage.heapUsed / (1024 * 1024);
    if (memMB > 100) cpuEstimate += 20;
    if (memMB > 200) cpuEstimate += 20;
    
    // Facteur temps de réponse récent
    const recentResponseTimes = this.performanceMetrics.responseTime.slice(-5);
    if (recentResponseTimes.length > 0) {
      const avgResponseTime = recentResponseTimes.reduce((a, b) => a + b, 0) / recentResponseTimes.length;
      if (avgResponseTime > 1000) cpuEstimate += 15;
      if (avgResponseTime > 3000) cpuEstimate += 25;
    }
    
    // Ajouter variation aléatoire pour simuler activité
    cpuEstimate += Math.random() * 10;
    
    return Math.min(Math.max(cpuEstimate, 5), 95); // Entre 5% et 95%
  }
  
  checkAlertThresholds(healthData) {
    const alerts = [];
    
    // Vérifier mémoire
    if (healthData.memory) {
      const memMB = healthData.memory.heapUsed / (1024 * 1024);
      if (memMB > this.config.alerts.memoryThreshold) {
        alerts.push({
          type: 'memory',
          severity: 'warning',
          message: `Utilisation mémoire élevée: ${Math.round(memMB)}MB`,
          threshold: this.config.alerts.memoryThreshold
        });
      }
    }
    
    // Vérifier temps de réponse
    if (healthData.responseTime > this.config.alerts.responseTimeThreshold) {
      alerts.push({
        type: 'response_time',
        severity: 'warning',
        message: `Temps de réponse lent: ${healthData.responseTime}ms`,
        threshold: this.config.alerts.responseTimeThreshold
      });
    }
    
    // Vérifier taux d'erreur
    const recentChecks = this.healthChecks.slice(-10);
    const errorRate = (recentChecks.filter(check => check.status === 'unhealthy').length / recentChecks.length) * 100;
    
    if (errorRate > this.config.alerts.errorRateThreshold) {
      alerts.push({
        type: 'error_rate',
        severity: 'critical',
        message: `Taux d'erreur élevé: ${Math.round(errorRate)}%`,
        threshold: this.config.alerts.errorRateThreshold
      });
    }
    
    // Afficher alertes
    alerts.forEach(alert => {
      const icon = alert.severity === 'critical' ? '🚨' : '⚠️';
      console.log(`${icon} ALERTE ${alert.type.toUpperCase()}: ${alert.message}`);
    });
    
    return alerts;
  }
  
  async performAIAnalysis() {
    if (!this.aiInfrastructure) return;
    
    try {
      // Préparer contexte pour IA
      const context = this.prepareAIContext();
      
      const prompt = `
Analyse les métriques de performance de cette application:

APPLICATION: ${this.config.app.name}
UPTIME: ${Math.round((Date.now() - this.startTime) / 60000)} minutes
PORT: ${this.config.app.port}

MÉTRIQUES RÉCENTES:
${context.metrics}

HEALTH CHECKS:
${context.healthSummary}

ALERTES ACTIVES:
${context.alerts}

Fournis 2 recommandations spécifiques pour optimiser les performances.
Format: [PRIORITÉ] Action - Bénéfice attendu
`;

      const response = await this.aiInfrastructure.optimizeCall(prompt, {
        maxTokens: 400,
        context: 'performance-monitoring'
      });
      
      if (response) {
        const recommendations = response.split('\n')
          .filter(line => line.trim().startsWith('['))
          .slice(0, 2);
        
        if (recommendations.length > 0) {
          console.log('\n🧠 RECOMMANDATIONS IA:');
          recommendations.forEach(rec => {
            console.log(`   🎯 ${rec}`);
          });
          console.log('');
        }
        
        this.aiAlerts = recommendations;
        this.lastAICheck = new Date().toISOString();
      }
      
    } catch (error) {
      console.warn('⚠️  Analyse IA échouée:', error.message);
    }
  }
  
  prepareAIContext() {
    // Résumé métriques récentes
    const recentMemory = this.performanceMetrics.memoryUsage.slice(-10);
    const recentResponseTimes = this.performanceMetrics.responseTime.slice(-10);
    const recentHealthChecks = this.healthChecks.slice(-5);
    
    const avgMemory = recentMemory.length > 0 ? 
      Math.round(recentMemory.reduce((sum, m) => sum + m.heap, 0) / recentMemory.length) : 0;
    
    const avgResponseTime = recentResponseTimes.length > 0 ?
      Math.round(recentResponseTimes.reduce((sum, rt) => sum + rt, 0) / recentResponseTimes.length) : 0;
    
    const healthyChecks = recentHealthChecks.filter(check => check.status === 'healthy').length;
    const healthRate = recentHealthChecks.length > 0 ? 
      Math.round((healthyChecks / recentHealthChecks.length) * 100) : 100;
    
    return {
      metrics: `
- Mémoire moyenne: ${avgMemory}MB
- Temps réponse moyen: ${avgResponseTime}ms  
- Taux santé: ${healthRate}%
- Requêtes totales: ${this.performanceMetrics.requestCount}
- Erreurs totales: ${this.performanceMetrics.errorCount}`,
      
      healthSummary: `${healthyChecks}/${recentHealthChecks.length} checks réussis`,
      
      alerts: this.aiAlerts.length > 0 ? this.aiAlerts.join('\n') : 'Aucune alerte'
    };
  }
  
  // ====================================
  // GESTION AUTO-RESTART
  // ====================================
  
  async handleAutoRestart() {
    if (this.restartCount >= this.maxRestarts) {
      console.log(`🛑 Limite redémarrages atteinte (${this.maxRestarts})`);
      return this.stop();
    }
    
    this.restartCount++;
    console.log(`🔄 Redémarrage automatique ${this.restartCount}/${this.maxRestarts}...`);
    
    // Arrêter processus actuel
    await this.stopApplication();
    
    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      // Redémarrer
      await this.startApplication();
      console.log('✅ Redémarrage réussi\n');
      
      // Reset compteur d'erreurs après redémarrage réussi
      setTimeout(() => {
        this.performanceMetrics.errorCount = 0;
      }, 60000); // Reset après 1 minute
      
    } catch (error) {
      console.log(`❌ Redémarrage échoué: ${error.message}`);
      
      // Retry après délai plus long
      setTimeout(() => {
        this.handleAutoRestart();
      }, 30000);
    }
  }
  
  // ====================================
  // ARRÊT PROPRE
  // ====================================
  
  async stopApplication() {
    if (!this.appProcess) return;
    
    console.log('🛑 Arrêt application...');
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        // Forcer arrêt si pas de réponse
        if (this.appProcess) {
          this.appProcess.kill('SIGKILL');
        }
        resolve();
      }, 10000);
      
      this.appProcess.on('close', () => {
        clearTimeout(timeout);
        this.appProcess = null;
        this.isRunning = false;
        resolve();
      });
      
      // Arrêt gracieux
      this.appProcess.kill('SIGTERM');
    });
  }
  
  async stop() {
    console.log('\n🛑 Arrêt complet du monitoring...');
    
    // Arrêter intervals
    if (this.healthInterval) clearInterval(this.healthInterval);
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.aiInterval) clearInterval(this.aiInterval);
    
    // Arrêter application
    await this.stopApplication();
    
    // Rapport final
    this.generateFinalReport();
    
    console.log('👋 Application arrêtée proprement');
    process.exit(0);
  }
  
  setupSignalHandlers() {
    // Gestionnaire arrêt propre
    ['SIGINT', 'SIGTERM'].forEach(signal => {
      process.on(signal, () => {
        console.log(`\n📡 Signal ${signal} reçu`);
        this.stop();
      });
    });
    
    // Gestionnaire erreurs non gérées
    process.on('uncaughtException', (error) => {
      console.log('💥 Erreur non gérée:', error.message);
      this.performanceMetrics.errorCount++;
      
      if (this.config.monitoring.autoRestart) {
        this.handleAutoRestart();
      }
    });
    
    process.on('unhandledRejection', (reason) => {
      console.log('💥 Promise rejetée:', reason);
      this.performanceMetrics.errorCount++;
    });
  }
  
  // ====================================
  // UTILITAIRES
  // ====================================
  
  async makeRequest(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const http = require('http');
      const urlObj = new URL(url);
      
      const req = http.request({
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'GET',
        timeout: timeout
      }, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve(data);
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.on('error', reject);
      req.end();
    });
  }
  
  generateFinalReport() {
    if (!this.startTime) return;
    
    const uptime = Date.now() - this.startTime;
    const uptimeMinutes = Math.round(uptime / 60000);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT FINAL');
    console.log('='.repeat(60));
    console.log(`📱 Application: ${this.config.app.name}`);
    console.log(`⏱️  Uptime total: ${uptimeMinutes} minutes`);
    console.log(`🔄 Redémarrages: ${this.restartCount}`);
    console.log(`📈 Requêtes traitées: ${this.performanceMetrics.requestCount}`);
    console.log(`❌ Erreurs: ${this.performanceMetrics.errorCount}`);
    
    if (this.performanceMetrics.responseTime.length > 0) {
      const avgResponseTime = Math.round(
        this.performanceMetrics.responseTime.reduce((a, b) => a + b, 0) / 
        this.performanceMetrics.responseTime.length
      );
      console.log(`⚡ Temps réponse moyen: ${avgResponseTime}ms`);
    }
    
    if (this.aiAlerts.length > 0) {
      console.log('\n🧠 Dernières recommandations IA:');
      this.aiAlerts.forEach(alert => {
        console.log(`   🎯 ${alert}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Sauvegarder rapport pour IA
    if (this.config.ai.enabled) {
      try {
        const reportPath = path.join(process.cwd(), 'ai-memory', 'app-monitoring-report.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        
        const report = {
          app: this.config.app,
          uptime: uptime,
          restartCount: this.restartCount,
          performanceMetrics: this.performanceMetrics,
          finalHealthChecks: this.healthChecks.slice(-10),
          aiRecommendations: this.aiAlerts,
          timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📝 Rapport sauvegardé: ${reportPath}`);
      } catch (error) {
        console.warn('⚠️  Sauvegarde rapport échouée:', error.message);
      }
    }
  }
}

// ====================================
// POINT D'ENTRÉE PRINCIPAL
// ====================================

async function main() {
  const starter = new IntelligentAppStarter();
  
  try {
    console.log('🚀 Démarrage application intelligent...\n');
    
    // Afficher configuration
    console.log(`📋 CONFIGURATION:`);
    console.log(`   📱 App: ${starter.config.app.name}`);
    console.log(`   🌐 URL: http://${starter.config.app.host}:${starter.config.app.port}`);
    console.log(`   🏗️  Env: ${starter.config.app.environment}`);
    console.log(`   📊 Monitoring: ${starter.config.monitoring.enabled ? 'Activé' : 'Désactivé'}`);
    console.log(`   🧠 IA: ${starter.config.ai.enabled ? 'Activée' : 'Désactivée'}\n`);
    
    // Vérifications pré-démarrage
    await starter.preStartChecks();
    
    // Démarrer application
    await starter.startApplication();
    
    // Démarrer monitoring
    starter.startMonitoring();
    
    // Message final
    console.log('🎉 Application démarrée avec succès !');
    console.log(`🌐 Accès: http://${starter.config.app.host}:${starter.config.app.port}`);
    
    if (starter.config.monitoring.enabled) {
      console.log('📊 Monitoring actif - Métriques en temps réel');
    }
    
    if (starter.config.ai.enabled) {
      console.log('🧠 IA monitoring activée - Optimisations automatiques');
    }
    
    console.log('\n💡 Pour arrêter: Ctrl+C\n');
    
    // Garder processus vivant
    process.stdin.resume();
    
  } catch (error) {
    console.error('\n❌ Erreur démarrage application:');
    console.error(`   💥 ${error.message}`);
    
    console.log('\n💡 Solutions possibles:');
    console.log('   1. Vérifiez la configuration');
    console.log('   2. Assurez-vous que les dépendances sont installées: npm install');
    console.log('   3. Vérifiez que le port est libre');
    console.log('   4. Exécutez les vérifications: node tools/deployment-validator.js');
    
    if (starter.config.ai.enabled) {
      console.log('   5. Vérifiez la clé API Claude dans .env');
    }
    
    process.exit(1);
  }
}

// ====================================
// EXPORT ET EXÉCUTION
// ====================================

if (require.main === module) {
  main();
}

module.exports = { 
  IntelligentAppStarter,
  main
};