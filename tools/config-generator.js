const readline = require('readline');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ====================================
// CONFIGURATION GENERATOR - PIPELINE UNIVERSEL
// Architecture Restructurée - Version 3.0
// ====================================

class ConfigGenerator {
  constructor() {
    this.config = {};
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // 🎯 NOUVEAUX CHEMINS - ARCHITECTURE RESTRUCTURÉE
    this.baseDir = '/data';
    this.configPath = path.join(this.baseDir, '.project-config.json');
    this.envPath = path.join(this.baseDir, '.env');
    this.envExamplePath = path.join(this.baseDir, '.env.example');
    this.logsDir = path.join(this.baseDir, 'logs');
    this.toolsDir = path.join(this.baseDir, 'tools');
    this.projectSourceDir = path.join(this.baseDir, 'project-source');
    
    console.log('🚀 Configuration Pipeline Universel Next.js/Firebase - Architecture Restructurée');
    console.log('📁 Configuration sera créée dans:', this.baseDir);
    console.log('🔧 Scripts seront placés dans:', this.toolsDir);
    console.log('📂 Projet sera cloné dans:', this.projectSourceDir);
    console.log('');
    
    // Créer les répertoires nécessaires
    this.createDirectories();
  }
  
  // ====================================
  // CRÉATION RÉPERTOIRES ARCHITECTURE
  // ====================================
  
  createDirectories() {
    const dirs = [this.baseDir, this.toolsDir, this.logsDir];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Répertoire créé: ${dir}`);
      }
    });
  }
  
  // ====================================
  // INTERFACE INTERACTIVE
  // ====================================
  
  async startConfiguration() {
    try {
      // Vérifier si config existe déjà dans /data/
      if (fs.existsSync(this.configPath)) {
        const useExisting = await this.askQuestion('📁 Configuration existante détectée dans /data/. Utiliser la config sauvegardée ? (y/N): ');
        if (useExisting.toLowerCase() === 'y') {
          this.loadExistingConfig();
          console.log('✅ Configuration existante chargée depuis /data/ !');
          this.rl.close();
          return;
        }
      }
      
      console.log('📋 Configuration du projet - Veuillez remplir les informations suivantes:\n');
      
      // 1. Configuration Repository
      await this.configureRepository();
      
      // 2. Configuration Base de données
      await this.configureDatabase();
      
      // 3. Configuration Admin
      await this.configureAdmin();
      
      // 4. Configuration Application
      await this.configureApplication();
      
      // 5. Configuration IA
      await this.configureAI();
      
      // 6. Configuration Déploiement
      await this.configureDeployment();
      
      // Génération des fichiers dans /data/
      await this.generateConfigFiles();
      
      console.log('\n🎉 Configuration terminée avec succès !');
      console.log('📁 Fichiers générés dans /data/:');
      console.log('   ✅ .project-config.json');
      console.log('   ✅ .env');
      console.log('   ✅ .env.example');
      console.log('\n🚀 Vous pouvez maintenant lancer: cd /data && ./run-build-git.sh');
      
    } catch (error) {
      console.error('❌ Erreur lors de la configuration:', error.message);
    } finally {
      this.rl.close();
    }
  }
  
  // ====================================
  // UTILITAIRES
  // ====================================
  
  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
  
  // ====================================
  // CONFIGURATION REPOSITORY
  // ====================================
  
  async configureRepository() {
    console.log('🔗 1. CONFIGURATION REPOSITORY');
    console.log('   ──────────────────────────');
    
    this.config.repository = {};
    
    // URL Repository
    let repoUrl = await this.askQuestion('URL du repository GitHub (https://github.com/user/repo.git): ');
    this.config.repository.url = this.validateRepositoryUrl(repoUrl);
    
    // Branch
    const branch = await this.askQuestion('Branch principale [main]: ') || 'main';
    this.config.repository.branch = branch;
    
    // Token GitHub (optionnel)
    const hasToken = await this.askQuestion('Utiliser un token GitHub pour l\'authentification ? (y/N): ');
    if (hasToken.toLowerCase() === 'y') {
      const token = await this.askQuestion('Token GitHub (sera stocké de manière sécurisée): ');
      this.config.repository.token = token;
    }
    
    console.log('   ✅ Repository configuré\n');
  }
  
  // ====================================
  // CONFIGURATION BASE DE DONNÉES
  // ====================================
  
  async configureDatabase() {
    console.log('🗄️ 2. CONFIGURATION BASE DE DONNÉES');
    console.log('   ──────────────────────────────');
    
    this.config.database = {};
    
    // Type de base de données
    const dbType = await this.askQuestion('Type de base de données (sqlite/postgresql/mysql) [sqlite]: ') || 'sqlite';
    this.config.database.type = dbType;
    
    if (dbType === 'sqlite') {
      // SQLite - chemin dans /data/
      const dbPath = await this.askQuestion('Chemin base SQLite [/data/app.db]: ') || '/data/app.db';
      this.config.database.path = dbPath;
      this.config.database.url = `file:${dbPath}`;
    } else {
      // PostgreSQL ou MySQL
      const dbHost = await this.askQuestion('Hôte base de données [localhost]: ') || 'localhost';
      const dbPort = await this.askQuestion(`Port [${dbType === 'postgresql' ? '5432' : '3306'}]: `) || (dbType === 'postgresql' ? '5432' : '3306');
      const dbName = await this.askQuestion('Nom de la base de données: ');
      const dbUser = await this.askQuestion('Utilisateur base de données: ');
      const dbPassword = await this.askQuestion('Mot de passe base de données: ');
      
      this.config.database.host = dbHost;
      this.config.database.port = dbPort;
      this.config.database.name = dbName;
      this.config.database.user = dbUser;
      this.config.database.password = dbPassword;
      
      // Construire URL de connexion
      const protocol = dbType === 'postgresql' ? 'postgresql' : 'mysql';
      this.config.database.url = `${protocol}://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
    }
    
    console.log('   ✅ Base de données configurée\n');
  }
  
  // ====================================
  // CONFIGURATION ADMIN
  // ====================================
  
  async configureAdmin() {
    console.log('👤 3. CONFIGURATION ADMINISTRATEUR');
    console.log('   ────────────────────────────');
    
    this.config.admin = {};
    
    // Email admin
    let adminEmail = await this.askQuestion('Email administrateur: ');
    this.config.admin.email = this.validateEmail(adminEmail);
    
    // Mot de passe admin
    const adminPassword = await this.askQuestion('Mot de passe administrateur: ');
    this.config.admin.password = adminPassword;
    
    // Nom complet
    const adminName = await this.askQuestion('Nom complet administrateur: ');
    this.config.admin.name = adminName;
    
    console.log('   ✅ Administrateur configuré\n');
  }
  
  // ====================================
  // CONFIGURATION APPLICATION
  // ====================================
  
  async configureApplication() {
    console.log('🚀 4. CONFIGURATION APPLICATION');
    console.log('   ──────────────────────────');
    
    this.config.app = {};
    
    // Nom de l'application
    const appName = await this.askQuestion('Nom de l\'application: ');
    this.config.app.name = appName;
    
    // Description
    const appDescription = await this.askQuestion('Description de l\'application: ');
    this.config.app.description = appDescription;
    
    // Port
    const port = await this.askQuestion('Port d\'écoute [3001]: ') || '3001';
    this.config.app.port = port;
    
    // Environnement
    const environment = await this.askQuestion('Environnement (development/production) [development]: ') || 'development';
    this.config.app.environment = environment;
    
    // URL de base
    const baseUrl = await this.askQuestion(`URL de base [http://localhost:${port}]: `) || `http://localhost:${port}`;
    this.config.app.baseUrl = baseUrl;
    
    console.log('   ✅ Application configurée\n');
  }
  
  // ====================================
  // CONFIGURATION IA
  // ====================================
  
  async configureAI() {
    console.log('🧠 5. CONFIGURATION IA (OPTIONNEL)');
    console.log('   ──────────────────────────────');
    
    this.config.ai = {};
    
    const enableAI = await this.askQuestion('Activer l\'analyse IA du code ? (y/N): ');
    this.config.ai.enabled = enableAI.toLowerCase() === 'y';
    
    if (this.config.ai.enabled) {
      console.log('   💡 IA activée - Fonctionnalités:');
      console.log('      • Analyse automatique du code');
      console.log('      • Suggestions d\'amélioration');
      console.log('      • Détection d\'erreurs avancée');
      
      // Sauvegarde des analyses
      const backupAnalyses = await this.askQuestion('Sauvegarder les analyses IA ? (Y/n): ');
      this.config.ai.backupAnalyses = backupAnalyses.toLowerCase() !== 'n';
      
      // Répertoire de sauvegarde dans /data/
      if (this.config.ai.backupAnalyses) {
        this.config.ai.backupDir = path.join(this.baseDir, 'ai-analyses');
        if (!fs.existsSync(this.config.ai.backupDir)) {
          fs.mkdirSync(this.config.ai.backupDir, { recursive: true });
        }
      }
    } else {
      console.log('   ⚠️  IA désactivée - Pipeline fonctionnera en mode basique');
    }
    
    console.log('   ✅ IA configurée\n');
  }
  
  // ====================================
  // CONFIGURATION DÉPLOIEMENT
  // ====================================
  
  async configureDeployment() {
    console.log('📁 6. CONFIGURATION DÉPLOIEMENT');
    console.log('   ──────────────────────────────');
    
    this.config.deployment = {};
    
    // Répertoire de déploiement (déjà défini dans l'architecture)
    this.config.deployment.directory = this.projectSourceDir;
    
    // Stratégie de déploiement
    const strategy = await this.askQuestion('Stratégie déploiement (pm2/systemd/docker) [pm2]: ') || 'pm2';
    this.config.deployment.strategy = strategy;
    
    // Nom du processus PM2
    if (strategy === 'pm2') {
      const processName = await this.askQuestion('Nom du processus PM2 [app-name]: ') || this.config.app.name?.replace(/\s+/g, '-').toLowerCase() || 'app';
      this.config.deployment.processName = processName;
    }
    
    console.log('   ✅ Déploiement configuré\n');
  }
  
  // ====================================
  // GÉNÉRATION FICHIERS CONFIGURATION
  // ====================================
  
  async generateConfigFiles() {
    console.log('📝 Génération des fichiers de configuration dans /data/...');
    
    // Ajouter métadonnées
    this.config.metadata = {
      generatedAt: new Date().toISOString(),
      version: '3.0.0',
      pipelineVersion: 'universal-restructured',
      architecture: 'restructured',
      baseDirectory: this.baseDir,
      toolsDirectory: this.toolsDir,
      projectSourceDirectory: this.projectSourceDir
    };
    
    // Générer secrets automatiquement
    this.config.secrets = {
      nextauthSecret: crypto.randomBytes(32).toString('hex'),
      jwtSecret: crypto.randomBytes(32).toString('hex'),
      databaseEncryptionKey: crypto.randomBytes(32).toString('hex')
    };
    
    // Écrire .project-config.json dans /data/
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    console.log('   ✅ .project-config.json créé dans /data/');
    
    // Générer .env dans /data/
    this.generateEnvFile();
    console.log('   ✅ .env créé dans /data/');
    
    // Générer .env.example dans /data/
    this.generateEnvExample();
    console.log('   ✅ .env.example créé dans /data/');
    
    // Créer fichier de log initial
    this.createInitialLogFile();
    console.log('   ✅ Fichier de log initial créé');
  }
  
  generateEnvFile() {
    const envContent = `# Configuration générée automatiquement - ${new Date().toISOString()}
# Architecture Restructurée - Tous les fichiers dans /data/

# REPOSITORY
REPO_URL=${this.config.repository.url}
REPO_BRANCH=${this.config.repository.branch}
${this.config.repository.token ? `GITHUB_TOKEN=${this.config.repository.token}` : '# GITHUB_TOKEN=your_token_here'}

# APPLICATION
APP_NAME="${this.config.app.name}"
APP_DESCRIPTION="${this.config.app.description}"
PORT=${this.config.app.port}
NODE_ENV=${this.config.app.environment}
BASE_URL=${this.config.app.baseUrl}

# DATABASE
DATABASE_URL="${this.config.database.url}"
DB_TYPE=${this.config.database.type}
${this.config.database.name ? `DB_NAME=${this.config.database.name}` : ''}
${this.config.database.host ? `DB_HOST=${this.config.database.host}` : ''}
${this.config.database.port ? `DB_PORT=${this.config.database.port}` : ''}
${this.config.database.user ? `DB_USER=${this.config.database.user}` : ''}
${this.config.database.password ? `DB_PASSWORD=${this.config.database.password}` : ''}

# ADMIN
ADMIN_EMAIL=${this.config.admin.email}
ADMIN_PASSWORD=${this.config.admin.password}
ADMIN_NAME="${this.config.admin.name}"

# SECRETS
NEXTAUTH_SECRET=${this.config.secrets.nextauthSecret}
JWT_SECRET=${this.config.secrets.jwtSecret}
DATABASE_ENCRYPTION_KEY=${this.config.secrets.databaseEncryptionKey}

# ARCHITECTURE PATHS
BASE_DIR=${this.baseDir}
TOOLS_DIR=${this.toolsDir}
PROJECT_SOURCE_DIR=${this.projectSourceDir}
LOGS_DIR=${this.logsDir}

# AI CONFIGURATION
AI_ANALYSIS_ENABLED=${this.config.ai.enabled}
${this.config.ai.backupDir ? `AI_BACKUP_DIR=${this.config.ai.backupDir}` : ''}

# DEPLOYMENT
DEPLOYMENT_STRATEGY=${this.config.deployment.strategy}
${this.config.deployment.processName ? `PM2_PROCESS_NAME=${this.config.deployment.processName}` : ''}
`;

    fs.writeFileSync(this.envPath, envContent);
  }
  
  generateEnvExample() {
    const envExampleContent = `# Configuration Pipeline Universel - Architecture Restructurée
# Copiez ce fichier en .env et remplissez les valeurs

# REPOSITORY
REPO_URL=https://github.com/username/repository.git
REPO_BRANCH=main
GITHUB_TOKEN=your_github_token_here

# APPLICATION
APP_NAME="Mon Application"
APP_DESCRIPTION="Description de mon application"
PORT=3001
NODE_ENV=development
BASE_URL=http://localhost:3001

# DATABASE
DATABASE_URL="file:/data/app.db"
DB_TYPE=sqlite

# ADMIN
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure_password
ADMIN_NAME="Administrateur"

# SECRETS (générés automatiquement)
NEXTAUTH_SECRET=your_nextauth_secret
JWT_SECRET=your_jwt_secret
DATABASE_ENCRYPTION_KEY=your_encryption_key

# ARCHITECTURE PATHS
BASE_DIR=/data
TOOLS_DIR=/data/tools
PROJECT_SOURCE_DIR=/data/project-source
LOGS_DIR=/data/logs

# AI CONFIGURATION
AI_ANALYSIS_ENABLED=false

# DEPLOYMENT
DEPLOYMENT_STRATEGY=pm2
PM2_PROCESS_NAME=my-app
`;

    fs.writeFileSync(this.envExamplePath, envExampleContent);
  }
  
  createInitialLogFile() {
    const logContent = `# Pipeline Universel - Architecture Restructurée
# Log initial généré le ${new Date().toISOString()}

Configuration créée avec succès:
- Base directory: ${this.baseDir}
- Tools directory: ${this.toolsDir}
- Project source: ${this.projectSourceDir}
- Application: ${this.config.app.name}
- Database: ${this.config.database.type}
- AI enabled: ${this.config.ai.enabled}

Prêt pour le déploiement !
`;

    const logFile = path.join(this.logsDir, 'config-generation.log');
    fs.writeFileSync(logFile, logContent);
  }
  
  // ====================================
  // VALIDATION
  // ====================================
  
  validateRepositoryUrl(url) {
    if (!url) throw new Error('URL du repository requise');
    
    // Nettoyer et valider l'URL
    url = url.trim();
    
    // Vérifier format GitHub
    const githubPattern = /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+\.git$/;
    if (!githubPattern.test(url) && !url.includes('github.com')) {
      console.log('   ⚠️  Format URL non standard - vérifiez l\'URL');
    }
    
    return url;
  }
  
  validateEmail(email) {
    if (!email) throw new Error('Email administrateur requis');
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      throw new Error('Format email invalide');
    }
    
    return email;
  }
  
  loadExistingConfig() {
    try {
      const configContent = fs.readFileSync(this.configPath, 'utf-8');
      this.config = JSON.parse(configContent);
      
      // Afficher résumé config existante
      console.log('\n📋 Configuration existante chargée depuis /data/:');
      console.log(`   📁 Projet: ${this.config.app?.name || 'N/A'}`);
      console.log(`   🔗 Repository: ${this.config.repository?.url || 'N/A'}`);
      console.log(`   🗄️  Base de données: ${this.config.database?.type || 'N/A'}`);
      console.log(`   🚀 Port: ${this.config.app?.port || 'N/A'}`);
      console.log(`   🧠 IA: ${this.config.ai?.enabled ? '✅ Activée' : '❌ Désactivée'}`);
      console.log(`   📂 Architecture: ${this.config.metadata?.architecture || 'standard'}`);
      
    } catch (error) {
      throw new Error('Impossible de charger la configuration existante depuis /data/');
    }
  }
}

// ====================================
// POINT D'ENTRÉE
// ====================================

async function main() {
  const generator = new ConfigGenerator();
  
  // Vérifier arguments ligne de commande
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔧 Configuration Generator - Pipeline Universel (Architecture Restructurée)

Usage:
  node config-generator.js              # Configuration interactive
  node config-generator.js --use-saved  # Utiliser config sauvegardée
  node config-generator.js --reset      # Supprimer config existante

Options:
  --help, -h     Afficher cette aide
  --use-saved    Utiliser la configuration sauvegardée depuis /data/
  --reset        Supprimer la configuration existante dans /data/

Architecture:
  📁 /data/                    # Répertoire de base
  ├── .project-config.json     # Configuration centrale
  ├── .env                     # Variables d'environnement
  ├── .env.example            # Exemple de configuration
  ├── run-build-git.sh        # Script principal
  ├── logs/                   # Logs du pipeline
  ├── tools/                  # Scripts centralisés
  └── project-source/         # Code source du projet
`);
    return;
  }
  
  if (args.includes('--reset')) {
    const filesToRemove = [
      generator.configPath,
      generator.envPath,
      generator.envExamplePath
    ];
    
    let removed = false;
    filesToRemove.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`✅ Supprimé: ${file}`);
        removed = true;
      }
    });
    
    if (!removed) {
      console.log('ℹ️  Aucun fichier de configuration trouvé dans /data/');
    }
    return;
  }
  
  if (args.includes('--use-saved')) {
    if (fs.existsSync(generator.configPath)) {
      generator.loadExistingConfig();
      console.log('✅ Configuration existante utilisée depuis /data/');
    } else {
      console.log('❌ Aucune configuration sauvegardée trouvée dans /data/');
    }
    return;
  }
  
  // Configuration interactive par défaut
  await generator.startConfiguration();
}

// Exécution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  });
}

module.exports = ConfigGenerator;