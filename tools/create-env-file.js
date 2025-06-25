// create-env-file.js - Génération automatique du fichier .env
// Compatible avec Firebase Studio et OrderSpot Pro

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔧 Génération automatique du fichier .env...');

class EnvFileGenerator {
  constructor() {
    this.envPath = path.join(__dirname, '../.env');
    this.envLocalPath = path.join(__dirname, '../.env.local');
    this.backupPath = path.join(__dirname, '../backups');
    
    this.ensureDirectories();
  }
  
  ensureDirectories() {
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }
  }
  
  // ====================================
  // GÉNÉRATION DES SECRETS
  // ====================================
  
  generateSecrets() {
    console.log('🔐 Génération des secrets sécurisés...');
    
    const secrets = {
      nextAuthSecret: crypto.randomBytes(32).toString('hex'),
      jwtSecret: crypto.randomBytes(32).toString('hex'),
      encryptionKey: crypto.randomBytes(32).toString('hex'),
      sessionSecret: crypto.randomBytes(32).toString('hex')
    };
    
    console.log('✅ Secrets générés avec succès');
    return secrets;
  }
  
  // ====================================
  // CONFIGURATION DATABASE
  // ====================================
  
  getDatabaseConfig() {
    console.log('🗄️ Configuration base de données...');
    
    // Configuration par défaut pour OrderSpot Pro
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'orderspot_db',
      username: process.env.DB_USER || 'orderspot_user',
      password: process.env.DB_PASS || 'orderspot_pass'
    };
    
    // Construction de l'URL de connexion
    const databaseUrl = `postgresql://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}?schema=public`;
    
    console.log(`📊 Database URL: ${databaseUrl.replace(dbConfig.password, '***')}`);
    
    return {
      ...dbConfig,
      databaseUrl
    };
  }
  
  // ====================================
  // CONFIGURATION FIREBASE
  // ====================================
  
  getFirebaseConfig() {
    console.log('🔥 Configuration Firebase...');
    
    // Configuration Firebase pour OrderSpot Pro
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY || 'demo-api-key',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'orderspot-pro.firebaseapp.com',
      projectId: process.env.FIREBASE_PROJECT_ID || 'orderspot-pro',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'orderspot-pro.appspot.com',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '123456789',
      appId: process.env.FIREBASE_APP_ID || '1:123456789:web:abcdef123456'
    };
    
    console.log('🔥 Configuration Firebase définie');
    return firebaseConfig;
  }
  
  // ====================================
  // CONFIGURATION APPLICATION
  // ====================================
  
  getAppConfig() {
    console.log('⚙️ Configuration application...');
    
    const appConfig = {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || '3001',
      appName: 'OrderSpot Pro',
      appVersion: '1.0.0',
      appUrl: process.env.APP_URL || 'http://localhost:3001',
      adminEmail: process.env.ADMIN_EMAIL || 'medkamel.dhakwani@gmail.com',
      adminPassword: process.env.ADMIN_PASSWORD || 'Admin1920'
    };
    
    console.log(`🚀 Application configurée sur le port ${appConfig.port}`);
    return appConfig;
  }
  
  // ====================================
  // SAUVEGARDE EXISTANT
  // ====================================
  
  backupExistingEnv() {
    const existingFiles = [this.envPath, this.envLocalPath];
    let backupCount = 0;
    
    existingFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const filename = path.basename(filePath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFilePath = path.join(this.backupPath, `${filename}.backup.${timestamp}`);
        
        fs.copyFileSync(filePath, backupFilePath);
        console.log(`💾 Sauvegarde: ${filename} → ${backupFilePath}`);
        backupCount++;
      }
    });
    
    if (backupCount > 0) {
      console.log(`✅ ${backupCount} fichier(s) .env sauvegardé(s)`);
    }
    
    return backupCount;
  }
  
  // ====================================
  // GÉNÉRATION DU CONTENU .ENV
  // ====================================
  
  generateEnvContent() {
    console.log('📝 Génération du contenu .env...');
    
    const secrets = this.generateSecrets();
    const dbConfig = this.getDatabaseConfig();
    const firebaseConfig = this.getFirebaseConfig();
    const appConfig = this.getAppConfig();
    
    const envContent = `# ====================================
# ORDERSPOT PRO - Configuration Environment
# Généré automatiquement le ${new Date().toISOString()}
# ====================================

# ====================================
# APPLICATION
# ====================================
NODE_ENV=${appConfig.nodeEnv}
PORT=${appConfig.port}
APP_NAME="${appConfig.appName}"
APP_VERSION=${appConfig.appVersion}
APP_URL=${appConfig.appUrl}

# ====================================
# DATABASE POSTGRESQL
# ====================================
DATABASE_URL="${dbConfig.databaseUrl}"
DB_HOST=${dbConfig.host}
DB_PORT=${dbConfig.port}
DB_NAME=${dbConfig.database}
DB_USER=${dbConfig.username}
DB_PASS=${dbConfig.password}

# ====================================
# AUTHENTIFICATION & SÉCURITÉ
# ====================================
NEXTAUTH_URL=${appConfig.appUrl}
NEXTAUTH_SECRET=${secrets.nextAuthSecret}
JWT_SECRET=${secrets.jwtSecret}
ENCRYPTION_KEY=${secrets.encryptionKey}
SESSION_SECRET=${secrets.sessionSecret}

# ====================================
# FIREBASE CONFIGURATION
# ====================================
FIREBASE_API_KEY=${firebaseConfig.apiKey}
FIREBASE_AUTH_DOMAIN=${firebaseConfig.authDomain}
FIREBASE_PROJECT_ID=${firebaseConfig.projectId}
FIREBASE_STORAGE_BUCKET=${firebaseConfig.storageBucket}
FIREBASE_MESSAGING_SENDER_ID=${firebaseConfig.messagingSenderId}
FIREBASE_APP_ID=${firebaseConfig.appId}

# ====================================
# UTILISATEUR ADMINISTRATEUR
# ====================================
ADMIN_EMAIL=medkamel.dhakwani@gmail.com
ADMIN_PASSWORD=Admin1920

# ====================================
# CONFIGURATION AVANCÉE
# ====================================
# Timeout de session (24 heures)
SESSION_TIMEOUT=86400

# Limite de taille d'upload (50MB)
MAX_FILE_SIZE=52428800

# Logs
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# API Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# ====================================
# DEVELOPMENT ONLY
# ====================================
${appConfig.nodeEnv === 'development' ? `
# Debug mode
DEBUG=true
VERBOSE_LOGGING=true

# Development database override
# DATABASE_URL="postgresql://postgres:password@localhost:5432/orderspot_dev?schema=public"
` : ''}

# ====================================
# PRODUCTION ONLY
# ====================================
${appConfig.nodeEnv === 'production' ? `
# Production optimizations
OPTIMIZATION_ENABLED=true
CACHE_ENABLED=true
COMPRESSION_ENABLED=true

# SSL/TLS
FORCE_HTTPS=true
SECURE_COOKIES=true
` : ''}
`;

    return envContent;
  }
  
  // ====================================
  // VALIDATION
  // ====================================
  
  validateEnvFile(filePath) {
    console.log(`🔍 Validation du fichier ${path.basename(filePath)}...`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Fichier non trouvé: ${filePath}`);
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Variables critiques à vérifier
    const criticalVars = [
      'PORT',
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'ADMIN_EMAIL'
    ];
    
    let isValid = true;
    criticalVars.forEach(varName => {
      if (!content.includes(`${varName}=`)) {
        console.error(`❌ Variable manquante: ${varName}`);
        isValid = false;
      } else {
        console.log(`✅ Variable présente: ${varName}`);
      }
    });
    
    // Vérification de la syntaxe
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.includes('=')) {
        console.warn(`⚠️ Ligne ${index + 1} suspecte: ${trimmed}`);
      }
    });
    
    console.log(`${isValid ? '✅' : '❌'} Validation ${isValid ? 'réussie' : 'échouée'}`);
    return isValid;
  }
  
  // ====================================
  // CRÉATION DU FICHIER
  // ====================================
  
  createEnvFiles() {
    console.log('📝 Création des fichiers d\'environnement...');
    
    // Sauvegarde des fichiers existants
    this.backupExistingEnv();
    
    // Génération du contenu
    const envContent = this.generateEnvContent();
    
    // Écriture du fichier .env principal
    fs.writeFileSync(this.envPath, envContent);
    console.log(`✅ Fichier créé: ${this.envPath}`);
    
    // Écriture du fichier .env.local (pour Next.js)
    fs.writeFileSync(this.envLocalPath, envContent);
    console.log(`✅ Fichier créé: ${this.envLocalPath}`);
    
    // Validation
    const isValid = this.validateEnvFile(this.envPath);
    
    if (!isValid) {
      console.error('❌ Erreur lors de la validation du fichier .env');
      return false;
    }
    
    // Permissions sécurisées
    try {
      fs.chmodSync(this.envPath, 0o600);
      fs.chmodSync(this.envLocalPath, 0o600);
      console.log('🔒 Permissions sécurisées appliquées');
    } catch (error) {
      console.warn('⚠️ Impossible de modifier les permissions:', error.message);
    }
    
    return true;
  }
  
  // ====================================
  // RAPPORT FINAL
  // ====================================
  
  generateReport() {
    console.log('\n📊 RAPPORT DE GÉNÉRATION .ENV');
    console.log('='.repeat(50));
    
    const stats = {
      envFile: fs.existsSync(this.envPath),
      envLocalFile: fs.existsSync(this.envLocalPath),
      fileSize: 0,
      variableCount: 0
    };
    
    if (stats.envFile) {
      const content = fs.readFileSync(this.envPath, 'utf-8');
      stats.fileSize = Buffer.byteLength(content, 'utf8');
      stats.variableCount = (content.match(/^[A-Z_]+=.+$/gm) || []).length;
    }
    
    console.log(`📁 Fichier .env: ${stats.envFile ? '✅ Créé' : '❌ Échec'}`);
    console.log(`📁 Fichier .env.local: ${stats.envLocalFile ? '✅ Créé' : '❌ Échec'}`);
    console.log(`📊 Taille: ${stats.fileSize} bytes`);
    console.log(`📊 Variables: ${stats.variableCount}`);
    console.log(`🚀 Port configuré: 3001`);
    console.log(`🗄️ Base de données: PostgreSQL`);
    console.log(`🔥 Firebase: Configuré`);
    console.log(`👤 Admin: admin@orderspot.com`);
    
    return stats;
  }
}

// ====================================
// FONCTION PRINCIPALE
// ====================================

async function createEnvFile() {
  try {
    console.log('🚀 Démarrage génération fichier .env...\n');
    
    const generator = new EnvFileGenerator();
    const success = generator.createEnvFiles();
    
    if (!success) {
      console.error('❌ Échec de la génération du fichier .env');
      process.exit(1);
    }
    
    const report = generator.generateReport();
    
    console.log('\n✅ GÉNÉRATION .ENV TERMINÉE AVEC SUCCÈS !');
    console.log('🎯 L\'application est prête à démarrer sur le port 3001');
    
    return {
      success: true,
      envFile: generator.envPath,
      envLocalFile: generator.envLocalPath,
      stats: report
    };
    
  } catch (error) {
    console.error('❌ ERREUR lors de la génération .env:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// ====================================
// EXÉCUTION
// ====================================

// Exécution si script appelé directement
if (require.main === module) {
  createEnvFile().then(result => {
    console.log('\n🎉 Script terminé avec succès !');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  });
}

module.exports = { EnvFileGenerator, createEnvFile };