const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// ====================================
// START APP DYNAMIQUE - PIPELINE UNIVERSEL
// ====================================

console.log('🚀 Démarrage application dynamique - Pipeline Universel');

class AppStarter {
  constructor() {
    this.config = null;
    this.port = 3000;
    this.appName = 'Application';
    this.baseUrl = 'http://localhost:3000';
    this.environment = 'development';
    this.processes = [];
    
    this.loadConfiguration();
  }
  
  // ====================================
  // CHARGEMENT CONFIGURATION DYNAMIQUE
  // ====================================
  
  loadConfiguration() {
    try {
      const configPath = path.join(process.cwd(), '.project-config.json');
      const envPath = path.join(process.cwd(), '.env');
      
      if (!fs.existsSync(configPath)) {
        console.log('⚠️ Configuration .project-config.json manquante - utilisation valeurs par défaut');
        this.useDefaultConfiguration();
        return;
      }
      
      this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      
      // Extraire les valeurs de configuration
      this.port = this.config.app?.port || 3000;
      this.appName = this.config.app?.name || 'Application';
      this.baseUrl = this.config.app?.baseUrl || `http://localhost:${this.port}`;
      this.environment = this.config.app?.environment || 'development';
      
      // Charger les variables d'environnement si disponibles
      if (fs.existsSync(envPath)) {
        this.loadEnvironmentVariables(envPath);
      }
      
      console.log(`📋 Configuration chargée: ${this.appName}`);
      console.log(`🚀 Port configuré: ${this.port}`);
      console.log(`🌐 URL: ${this.baseUrl}`);
      console.log(`🔧 Environnement: ${this.environment}`);
      
    } catch (error) {
      console.error('❌ Erreur chargement configuration:', error.message);
      console.log('💡 Utilisation configuration par défaut');
      this.useDefaultConfiguration();
    }
  }
  
  useDefaultConfiguration() {
    this.port = 3000;
    this.appName = 'Next.js Application';
    this.baseUrl = `http://localhost:${this.port}`;
    this.environment = 'development';
    
    console.log('📋 Configuration par défaut:');
    console.log(`   🚀 Port: ${this.port}`);
    console.log(`   📁 App: ${this.appName}`);
    console.log(`   🌐 URL: ${this.baseUrl}`);
  }
  
  loadEnvironmentVariables(envPath) {
    try {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const envVars = {};
      
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          const cleanKey = key.trim();
          const cleanValue = value.trim().replace(/['"]/g, '');
          envVars[cleanKey] = cleanValue;
          process.env[cleanKey] = cleanValue;
        }
      });
      
      // Override avec les variables d'environnement si définies
      if (envVars.PORT) {
        this.port = parseInt(envVars.PORT) || this.port;
      }
      if (envVars.BASE_URL) {
        this.baseUrl = envVars.BASE_URL;
      }
      if (envVars.NODE_ENV) {
        this.environment = envVars.NODE_ENV;
      }
      
      console.log('✅ Variables d\'environnement chargées');
      
    } catch (error) {
      console.log('⚠️ Erreur chargement .env:', error.message);
    }
  }
  
  // ====================================
  // VÉRIFICATION PORT DISPONIBLE
  // ====================================
  
  async checkPortAvailability() {
    console.log(`\n🔍 Vérification disponibilité port ${this.port}...`);
    
    return new Promise((resolve) => {
      const server = http.createServer();
      
      server.listen(this.port, () => {
        server.close(() => {
          console.log(`✅ Port ${this.port} disponible`);
          resolve(true);
        });
      });
      
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`⚠️ Port ${this.port} déjà utilisé`);
          resolve(false);
        } else {
          console.log(`❌ Erreur port ${this.port}:`, error.message);
          resolve(false);
        }
      });
    });
  }
  
  // ====================================
  // GESTION PROCESSUS EXISTANTS
  // ====================================
  
  async handleExistingProcesses() {
    console.log('\n🔍 Vérification processus existants...');
    
    try {
      // Vérifier les processus Next.js existants
      const processes = execSync('ps aux | grep -E "(next|node.*start)" | grep -v grep', { 
        encoding: 'utf-8' 
      }).trim();
      
      if (processes) {
        console.log('📊 Processus Next.js détectés:');
        processes.split('\n').forEach(proc => {
          if (proc.includes(':' + this.port) || proc.includes('next')) {
            console.log(`   🔄 ${proc.substring(0, 80)}...`);
          }
        });
        
        const shouldKill = await this.askUserConfirmation(
          `Arrêter les processus existants sur le port ${this.port} ? (y/N): `
        );
        
        if (shouldKill) {
          await this.killExistingProcesses();
        }
      } else {
        console.log('✅ Aucun processus conflictuel détecté');
      }
      
    } catch (error) {
      console.log('⚠️ Impossible de vérifier les processus existants');
    }
  }
  
  async killExistingProcesses() {
    try {
      // Tuer les processus utilisant le port
      execSync(`lsof -ti:${this.port} | xargs kill -9 2>/dev/null || true`);
      
      // Attendre un peu
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`✅ Processus sur port ${this.port} arrêtés`);
      
    } catch (error) {
      console.log('⚠️ Erreur arrêt processus:', error.message);
    }
  }
  
  askUserConfirmation(question) {
    return new Promise((resolve) => {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question(question, (answer) => {
        readline.close();
        resolve(answer.toLowerCase() === 'y');
      });
    });
  }
  
  // ====================================
  // DÉMARRAGE APPLICATION
  // ====================================
  
  async startApplication() {
    console.log(`\n🚀 Démarrage ${this.appName}...`);
    
    // Vérifier que les fichiers nécessaires existent
    if (!this.checkRequiredFiles()) {
      return false;
    }
    
    // Définir les variables d'environnement
    const env = {
      ...process.env,
      PORT: this.port.toString(),
      NODE_ENV: this.environment,
      APP_NAME: this.appName,
      BASE_URL: this.baseUrl
    };
    
    // Définir la commande de démarrage selon l'environnement
    const startCommand = this.getStartCommand();
    
    console.log(`📋 Commande: ${startCommand.cmd} ${startCommand.args.join(' ')}`);
    console.log(`🔧 Environnement: ${this.environment}`);
    console.log(`🚀 Port: ${this.port}`);
    
    try {
      // Démarrer l'application
      const app = spawn(startCommand.cmd, startCommand.args, {
        stdio: ['inherit', 'pipe', 'pipe'],
        env: env,
        cwd: process.cwd()
      });
      
      this.processes.push(app);
      
      // Gérer la sortie
      app.stdout.on('data', (data) => {
        const output = data.toString();
        
        // Filtrer et afficher les messages importants
        if (output.includes('ready') || 
            output.includes('started') || 
            output.includes('listening') ||
            output.includes('Local:') ||
            output.includes(`${this.port}`)) {
          console.log(`📟 ${output.trim()}`);
        }
      });
      
      app.stderr.on('data', (data) => {
        const error = data.toString();
        
        // Filtrer les erreurs importantes
        if (!error.includes('warn') && !error.includes('[WARN]')) {
          console.error(`⚠️ ${error.trim()}`);
        }
      });
      
      // Gérer la fin du processus
      app.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${this.appName} arrêté proprement`);
        } else {
          console.log(`❌ ${this.appName} arrêté avec erreur (code: ${code})`);
        }
      });
      
      app.on('error', (error) => {
        console.error(`❌ Erreur démarrage ${this.appName}:`, error.message);
      });
      
      // Attendre que l'application soit prête
      const isReady = await this.waitForAppReady();
      
      if (isReady) {
        this.displaySuccessMessage();
        return true;
      } else {
        console.log('⚠️ Application démarrée mais pas de confirmation de disponibilité');
        return true;
      }
      
    } catch (error) {
      console.error('❌ Erreur démarrage application:', error.message);
      return false;
    }
  }
  
  checkRequiredFiles() {
    const requiredFiles = [
      'package.json'
    ];
    
    const optionalFiles = [
      'next.config.js',
      'src/app/layout.tsx',
      'src/app/page.tsx'
    ];
    
    // Vérifier fichiers requis
    const missingRequired = requiredFiles.filter(file => !fs.existsSync(file));
    if (missingRequired.length > 0) {
      console.error(`❌ Fichiers requis manquants: ${missingRequired.join(', ')}`);
      return false;
    }
    
    // Vérifier fichiers optionnels
    const missingOptional = optionalFiles.filter(file => !fs.existsSync(file));
    if (missingOptional.length > 0) {
      console.log(`⚠️ Fichiers optionnels manquants: ${missingOptional.join(', ')}`);
    }
    
    console.log('✅ Fichiers requis présents');
    return true;
  }
  
  getStartCommand() {
    // Vérifier le package.json pour les scripts disponibles
    let packageJson = {};
    try {
      packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    } catch (error) {
      console.log('⚠️ Erreur lecture package.json');
    }
    
    const scripts = packageJson.scripts || {};
    
    // Choisir la commande selon l'environnement et les scripts disponibles
    if (this.environment === 'production') {
      if (scripts.start) {
        return { cmd: 'npm', args: ['start'] };
      } else {
        return { cmd: 'npx', args: ['next', 'start', '-p', this.port.toString()] };
      }
    } else {
      if (scripts.dev) {
        return { cmd: 'npm', args: ['run', 'dev', '--', '-p', this.port.toString()] };
      } else {
        return { cmd: 'npx', args: ['next', 'dev', '-p', this.port.toString()] };
      }
    }
  }
  
  async waitForAppReady() {
    console.log('⏳ Attente disponibilité application...');
    
    const maxAttempts = 30; // 30 secondes
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test de connexion HTTP
        const response = await this.testHttpConnection();
        if (response) {
          console.log('✅ Application prête et accessible');
          return true;
        }
        
        attempts++;
        process.stdout.write('.');
        
      } catch (error) {
        attempts++;
        process.stdout.write('.');
      }
    }
    
    console.log('\n⏱️ Timeout atteint - application peut être en cours de démarrage');
    return false;
  }
  
  testHttpConnection() {
    return new Promise((resolve) => {
      const request = http.get(this.baseUrl, (res) => {
        resolve(res.statusCode < 500);
      });
      
      request.on('error', () => {
        resolve(false);
      });
      
      request.setTimeout(2000, () => {
        request.destroy();
        resolve(false);
      });
    });
  }
  
  displaySuccessMessage() {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 APPLICATION DÉMARRÉE AVEC SUCCÈS !');
    console.log('='.repeat(60));
    console.log(`📁 Application: ${this.appName}`);
    console.log(`🌐 URL locale: ${this.baseUrl}`);
    console.log(`🚀 Port: ${this.port}`);
    console.log(`🔧 Environnement: ${this.environment}`);
    
    if (this.config) {
      console.log(`👤 Admin: ${this.config.admin?.email || 'Non configuré'}`);
      console.log(`🗄️ Base: ${this.config.database?.name || 'Non configurée'}`);
    }
    
    console.log('\n📋 Commandes utiles:');
    console.log(`   🔗 Ouvrir: open ${this.baseUrl}`);
    console.log('   🛑 Arrêter: Ctrl+C ou pkill -f next');
    console.log(`   📊 Processus: lsof -i :${this.port}`);
    
    console.log('\n💡 Prochaines étapes:');
    console.log('   1. Ouvrez votre navigateur');
    console.log(`   2. Accédez à ${this.baseUrl}`);
    console.log('   3. Connectez-vous avec les credentials admin');
    
    console.log('='.repeat(60));
  }
  
  // ====================================
  // GESTION ARRÊT PROPRE
  // ====================================
  
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n🛑 Signal ${signal} reçu - Arrêt en cours...`);
      
      // Arrêter tous les processus
      for (const proc of this.processes) {
        if (proc && !proc.killed) {
          console.log('🔄 Arrêt processus application...');
          proc.kill('SIGTERM');
          
          // Forcer l'arrêt si nécessaire
          setTimeout(() => {
            if (!proc.killed) {
              console.log('💥 Arrêt forcé du processus');
              proc.kill('SIGKILL');
            }
          }, 5000);
        }
      }
      
      console.log('✅ Arrêt terminé');
      process.exit(0);
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGQUIT', () => shutdown('SIGQUIT'));
  }
  
  // ====================================
  // MONITORING ET SANTÉ
  // ====================================
  
  async startHealthMonitoring() {
    console.log('\n📊 Démarrage monitoring santé application...');
    
    const healthCheck = setInterval(async () => {
      const isHealthy = await this.checkApplicationHealth();
      
      if (!isHealthy) {
        console.log('⚠️ Application non responsive - Vérification en cours...');
        
        // Tentative de redémarrage automatique en développement
        if (this.environment === 'development') {
          console.log('🔄 Tentative redémarrage automatique...');
          clearInterval(healthCheck);
          setTimeout(() => this.startApplication(), 5000);
        }
      }
    }, 60000); // Vérification toutes les minutes
    
    // Arrêter le monitoring après 30 minutes en développement
    if (this.environment === 'development') {
      setTimeout(() => {
        clearInterval(healthCheck);
        console.log('📊 Monitoring santé arrêté');
      }, 30 * 60 * 1000);
    }
  }
  
  async checkApplicationHealth() {
    try {
      const response = await this.testHttpConnection();
      return response;
    } catch (error) {
      return false;
    }
  }
}

// ====================================
// POINT D'ENTRÉE
// ====================================

async function main() {
  const starter = new AppStarter();
  
  try {
    console.log('🚀 Démarrage application Next.js...\n');
    
    // Configuration arrêt propre
    starter.setupGracefulShutdown();
    
    // Vérifier disponibilité du port
    const portAvailable = await starter.checkPortAvailability();
    
    if (!portAvailable) {
      await starter.handleExistingProcesses();
      
      // Revérifier après gestion des processus
      const nowAvailable = await starter.checkPortAvailability();
      if (!nowAvailable) {
        console.error(`❌ Port ${starter.port} toujours occupé - Arrêt`);
        process.exit(1);
      }
    }
    
    // Démarrer l'application
    const success = await starter.startApplication();
    
    if (success) {
      // Démarrer le monitoring en arrière-plan
      if (starter.environment === 'development') {
        setTimeout(() => starter.startHealthMonitoring(), 10000);
      }
      
      // Maintenir le processus actif
      console.log('\n💫 Application en cours d\'exécution...');
      console.log('   💡 Utilisez Ctrl+C pour arrêter\n');
      
      // Boucle principale
      const keepAlive = setInterval(() => {
        // Le processus reste actif
      }, 1000);
      
    } else {
      console.error('❌ Échec démarrage application');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Erreur fatale:');
    console.error(`   💥 ${error.message}`);
    
    // Informations de debug
    console.log('\n🔍 Informations de debug:');
    console.log(`   📂 Répertoire: ${process.cwd()}`);
    console.log(`   🔧 Node.js: ${process.version}`);
    console.log(`   🚀 Port configuré: ${starter.port}`);
    
    // Vérifier les fichiers critiques
    const criticalFiles = [
      'package.json',
      '.project-config.json',
      '.env'
    ];
    
    criticalFiles.forEach(file => {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    });
    
    console.log('\n💡 Pour résoudre:');
    console.log('   1. Vérifiez la configuration dans .project-config.json');
    console.log('   2. Vérifiez que le port est disponible');
    console.log('   3. Lancez: npm install');
    console.log('   4. Vérifiez que Next.js est installé');
    console.log('   5. Tentez: npx next build');
    
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
  AppStarter, 
  main 
};