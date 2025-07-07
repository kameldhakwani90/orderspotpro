#!/usr/bin/env node

// ====================================
// 🔍 DEPLOYMENT VALIDATOR IA - Version Intelligente
// ====================================
// Validateur déploiement avec rapports IA et métriques intelligentes
// Intégration: ai-infrastructure.js + monitoring continu
// Fonctions: Validation + Reporting + Recommandations IA

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentValidator {
  constructor() {
    // Configuration dynamique depuis fichiers config
    this.config = this.loadConfiguration();
    
    // État validation
    this.validationResults = [];
    this.criticalIssues = [];
    this.warnings = [];
    this.aiRecommendations = [];
    
    // Métriques performance
    this.performanceMetrics = {
      validationTime: 0,
      checksExecuted: 0,
      aiCallsUsed: 0,
      memoryUsed: 0
    };
    
    // Infrastructure IA (si disponible)
    this.aiInfrastructure = this.initializeAI();
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
        name: 'Application Next.js',
        port: process.env.PORT || 3000,
        baseUrl: `http://localhost:${process.env.PORT || 3000}`,
        environment: process.env.NODE_ENV || 'development'
      },
      database: {
        url: process.env.DATABASE_URL,
        name: process.env.DB_NAME || 'app_db'
      },
      deployment: {
        directory: process.env.DEPLOY_DIR || process.cwd(),
        target: process.env.DEPLOY_TARGET || 'local'
      },
      ai: {
        enabled: process.env.AI_ENABLED === 'true',
        model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
        maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 4000
      }
    };
    
    // Charger config projet si existe
    for (const configFile of configs) {
      if (fs.existsSync(configFile)) {
        try {
          const fileConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
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
        console.log('🤖 IA désactivée - Mode validation classique');
        return null;
      }
      
      // Charger infrastructure IA si disponible
      const aiPath = path.join(process.cwd(), 'ai-infrastructure.js');
      if (fs.existsSync(aiPath)) {
        const { ClaudeAPI } = require('./ai-infrastructure');
        return new ClaudeAPI(process.env.CLAUDE_API_KEY, this.config.ai.model);
      }
      
      console.log('📋 Infrastructure IA non trouvée - Mode classique');
      return null;
    } catch (error) {
      console.warn('⚠️  Erreur initialisation IA:', error.message);
      return null;
    }
  }
  
  // ====================================
  // VALIDATIONS ENVIRONNEMENT
  // ====================================
  
  async validateEnvironment() {
    const startTime = Date.now();
    
    const checks = [
      this.checkNodeVersion(),
      this.checkPackageManager(),
      this.checkEnvironmentVariables(),
      this.checkEssentialDirectories(),
      this.checkPermissions(),
      this.checkGitRepository(),
      this.checkDiskSpace()
    ];
    
    this.validationResults.push({
      category: 'Environnement',
      checks: checks,
      timestamp: new Date().toISOString()
    });
    
    // Analyse IA si disponible
    if (this.aiInfrastructure) {
      await this.analyzeEnvironmentWithAI(checks);
    }
    
    this.performanceMetrics.validationTime += Date.now() - startTime;
    this.performanceMetrics.checksExecuted += checks.length;
  }
  
  checkNodeVersion() {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      this.criticalIssues.push(`Node.js ${nodeVersion} trop ancien (requis: 18+)`);
      return {
        name: 'Version Node.js',
        status: 'failed',
        message: `${nodeVersion} (requis: 18+)`,
        solution: 'Mettez à jour Node.js vers la version 18 ou supérieure'
      };
    }
    
    return {
      name: 'Version Node.js',
      status: 'success',
      message: `${nodeVersion} ✓`,
      details: { version: nodeVersion, majorVersion }
    };
  }
  
  checkPackageManager() {
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      let yarnVersion = null;
      
      try {
        yarnVersion = execSync('yarn --version', { encoding: 'utf8' }).trim();
      } catch (error) {
        // Yarn pas installé
      }
      
      return {
        name: 'Gestionnaire paquets',
        status: 'success',
        message: `npm ${npmVersion}${yarnVersion ? `, yarn ${yarnVersion}` : ''}`,
        details: { npm: npmVersion, yarn: yarnVersion }
      };
    } catch (error) {
      return {
        name: 'Gestionnaire paquets',
        status: 'failed',
        message: 'npm non disponible',
        solution: 'Installez Node.js et npm'
      };
    }
  }
  
  checkEnvironmentVariables() {
    const requiredVars = [
      'DATABASE_URL',
      'APP_NAME'
    ];
    
    // Variables conditionnelles selon config
    if (this.config.ai.enabled) {
      requiredVars.push('CLAUDE_API_KEY');
    }
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.warnings.push(`Variables d'environnement manquantes: ${missingVars.join(', ')}`);
      return {
        name: 'Variables d\'environnement',
        status: 'warning',
        message: `Variables manquantes: ${missingVars.join(', ')}`,
        solution: 'Exécutez: node tools/config-generator.js'
      };
    }
    
    return {
      name: 'Variables d\'environnement',
      status: 'success',
      message: `${requiredVars.length} variables requises présentes`
    };
  }
  
  checkEssentialDirectories() {
    const requiredDirs = [
      'src',
      'src/app', 
      'src/lib',
      'tools',
      'prisma'
    ];
    
    // Ajouter dossiers IA si nécessaires
    if (this.config.ai.enabled) {
      requiredDirs.push('ai-memory');
    }
    
    const missingDirs = requiredDirs.filter(dir => !fs.existsSync(dir));
    
    if (missingDirs.length > 0) {
      return {
        name: 'Répertoires essentiels',
        status: 'warning',
        message: `Répertoires manquants: ${missingDirs.join(', ')}`,
        solution: 'Les répertoires seront créés automatiquement'
      };
    }
    
    return {
      name: 'Répertoires essentiels',
      status: 'success',
      message: `${requiredDirs.length} répertoires présents`
    };
  }
  
  checkPermissions() {
    try {
      const testFile = path.join(process.cwd(), '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      return {
        name: 'Permissions fichiers',
        status: 'success',
        message: 'Lecture/écriture OK'
      };
    } catch (error) {
      this.criticalIssues.push('Permissions insuffisantes pour écriture');
      return {
        name: 'Permissions fichiers',
        status: 'failed',
        message: 'Écriture impossible',
        solution: 'Vérifiez les permissions du répertoire'
      };
    }
  }
  
  checkGitRepository() {
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      
      if (gitStatus.trim()) {
        this.warnings.push('Modifications non commitées détectées');
        return {
          name: 'Repository Git',
          status: 'warning',
          message: 'Modifications non commitées',
          solution: 'Committez vos changements avant déploiement'
        };
      }
      
      return {
        name: 'Repository Git',
        status: 'success',
        message: 'Repository propre'
      };
    } catch (error) {
      return {
        name: 'Repository Git',
        status: 'warning',
        message: 'Git non initialisé',
        solution: 'Initialisez git: git init'
      };
    }
  }
  
  checkDiskSpace() {
    try {
      const stats = fs.statSync(process.cwd());
      const available = stats.size || 0;
      
      // Estimation espace requis (en bytes)
      const requiredSpace = 500 * 1024 * 1024; // 500MB
      
      if (available < requiredSpace) {
        this.warnings.push('Espace disque limité');
        return {
          name: 'Espace disque',
          status: 'warning', 
          message: 'Espace limité',
          solution: 'Libérez de l\'espace disque'
        };
      }
      
      return {
        name: 'Espace disque',
        status: 'success',
        message: 'Espace suffisant'
      };
    } catch (error) {
      return {
        name: 'Espace disque',
        status: 'warning',
        message: 'Vérification impossible',
        solution: 'Vérifiez manuellement l\'espace disponible'
      };
    }
  }
  
  // ====================================
  // VALIDATIONS DÉPENDANCES
  // ====================================
  
  async validateDependencies() {
    const checks = [
      this.checkPackageJson(),
      this.checkNodeModules(),
      this.checkCriticalDependencies(),
      this.checkSecurityVulnerabilities(),
      this.checkDependencyVersions()
    ];
    
    this.validationResults.push({
      category: 'Dépendances',
      checks: checks,
      timestamp: new Date().toISOString()
    });
    
    this.performanceMetrics.checksExecuted += checks.length;
  }
  
  checkPackageJson() {
    const packagePath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packagePath)) {
      this.criticalIssues.push('package.json manquant');
      return {
        name: 'Package.json',
        status: 'failed',
        message: 'Fichier manquant',
        solution: 'Créez package.json: npm init'
      };
    }
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Vérifier scripts essentiels
      const requiredScripts = ['dev', 'build', 'start'];
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts?.[script]);
      
      if (missingScripts.length > 0) {
        this.warnings.push(`Scripts manquants: ${missingScripts.join(', ')}`);
        return {
          name: 'Package.json',
          status: 'warning',
          message: `Scripts manquants: ${missingScripts.join(', ')}`,
          solution: 'Ajoutez les scripts manquants'
        };
      }
      
      return {
        name: 'Package.json',
        status: 'success',
        message: `${packageJson.name || 'Sans nom'} - Scripts OK`
      };
    } catch (error) {
      this.criticalIssues.push('package.json invalide');
      return {
        name: 'Package.json',
        status: 'failed',
        message: 'Format JSON invalide',
        solution: 'Corrigez la syntaxe JSON'
      };
    }
  }
  
  checkNodeModules() {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
      this.criticalIssues.push('Dépendances non installées');
      return {
        name: 'Node modules',
        status: 'failed',
        message: 'Dépendances non installées',
        solution: 'Exécutez: npm install'
      };
    }
    
    // Calculer taille node_modules
    const size = this.getDirSize(nodeModulesPath);
    
    return {
      name: 'Node modules',
      status: 'success',
      message: `Installées (${this.formatBytes(size)})`,
      details: { size: size }
    };
  }
  
  checkCriticalDependencies() {
    const criticalDeps = [
      'next',
      'react',
      'react-dom',
      '@prisma/client'
    ];
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const missingDeps = criticalDeps.filter(dep => !allDeps[dep]);
      
      if (missingDeps.length > 0) {
        this.criticalIssues.push(`Dépendances critiques manquantes: ${missingDeps.join(', ')}`);
        return {
          name: 'Dépendances critiques',
          status: 'failed',
          message: `Manquantes: ${missingDeps.join(', ')}`,
          solution: `Installez: npm install ${missingDeps.join(' ')}`
        };
      }
      
      return {
        name: 'Dépendances critiques',
        status: 'success',
        message: `${criticalDeps.length} dépendances présentes`
      };
    } catch (error) {
      return {
        name: 'Dépendances critiques',
        status: 'failed',
        message: 'Impossible de vérifier',
        solution: 'Vérifiez package.json'
      };
    }
  }
  
  checkSecurityVulnerabilities() {
    try {
      // Utiliser npm audit pour détecter vulnérabilités
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);
      
      const highVulns = audit.metadata?.vulnerabilities?.high || 0;
      const criticalVulns = audit.metadata?.vulnerabilities?.critical || 0;
      
      if (criticalVulns > 0 || highVulns > 5) {
        this.warnings.push(`Vulnérabilités sécurité: ${criticalVulns} critiques, ${highVulns} élevées`);
        return {
          name: 'Sécurité dépendances',
          status: 'warning',
          message: `${criticalVulns} critiques, ${highVulns} élevées`,
          solution: 'Exécutez: npm audit fix'
        };
      }
      
      return {
        name: 'Sécurité dépendances',
        status: 'success',
        message: 'Aucune vulnérabilité critique'
      };
    } catch (error) {
      return {
        name: 'Sécurité dépendances',
        status: 'warning',
        message: 'Audit impossible',
        solution: 'Vérifiez manuellement: npm audit'
      };
    }
  }
  
  checkDependencyVersions() {
    try {
      const outdatedResult = execSync('npm outdated --json', { encoding: 'utf8' });
      const outdated = JSON.parse(outdatedResult || '{}');
      
      const outdatedCount = Object.keys(outdated).length;
      
      if (outdatedCount > 10) {
        this.warnings.push(`${outdatedCount} dépendances obsolètes`);
        return {
          name: 'Versions dépendances',
          status: 'warning',
          message: `${outdatedCount} obsolètes`,
          solution: 'Mettez à jour: npm update'
        };
      }
      
      return {
        name: 'Versions dépendances',
        status: 'success',
        message: outdatedCount > 0 ? `${outdatedCount} mineures obsolètes` : 'À jour'
      };
    } catch (error) {
      return {
        name: 'Versions dépendances',
        status: 'success',
        message: 'Vérification impossible'
      };
    }
  }
  
  // ====================================
  // VALIDATIONS DATABASE
  // ====================================
  
  async validateDatabase() {
    const checks = [
      this.checkDatabaseConnection(),
      this.checkPrismaSchema(),
      this.checkMigrations(),
      this.checkDatabaseHealth()
    ];
    
    this.validationResults.push({
      category: 'Base de données',
      checks: checks,
      timestamp: new Date().toISOString()
    });
    
    this.performanceMetrics.checksExecuted += checks.length;
  }
  
  checkDatabaseConnection() {
    if (!this.config.database.url) {
      this.criticalIssues.push('URL base de données manquante');
      return {
        name: 'Connexion DB',
        status: 'failed',
        message: 'DATABASE_URL manquante',
        solution: 'Configurez DATABASE_URL dans .env'
      };
    }
    
    try {
      // Test simple de format URL
      new URL(this.config.database.url);
      
      return {
        name: 'Connexion DB',
        status: 'success',
        message: 'Configuration présente',
        details: { url: this.config.database.url.replace(/:[^:@]*@/, ':***@') }
      };
    } catch (error) {
      this.criticalIssues.push('Format DATABASE_URL invalide');
      return {
        name: 'Connexion DB',
        status: 'failed',
        message: 'Format URL invalide',
        solution: 'Vérifiez le format DATABASE_URL'
      };
    }
  }
  
  checkPrismaSchema() {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    
    if (!fs.existsSync(schemaPath)) {
      this.criticalIssues.push('Schema Prisma manquant');
      return {
        name: 'Schema Prisma',
        status: 'failed',
        message: 'schema.prisma manquant',
        solution: 'Initialisez Prisma: npx prisma init'
      };
    }
    
    try {
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      // Vérifier modèles essentiels
      const hasUserModel = schemaContent.includes('model User');
      const hasAdminModel = schemaContent.includes('model Admin');
      
      if (!hasUserModel && !hasAdminModel) {
        this.warnings.push('Aucun modèle utilisateur trouvé dans schema');
        return {
          name: 'Schema Prisma',
          status: 'warning',
          message: 'Modèles utilisateur manquants',
          solution: 'Ajoutez modèles User/Admin'
        };
      }
      
      return {
        name: 'Schema Prisma',
        status: 'success',
        message: 'Schema présent avec modèles'
      };
    } catch (error) {
      return {
        name: 'Schema Prisma',
        status: 'warning',
        message: 'Erreur lecture schema',
        solution: 'Vérifiez prisma/schema.prisma'
      };
    }
  }
  
  checkMigrations() {
    const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
    
    if (!fs.existsSync(migrationsPath)) {
      this.warnings.push('Aucune migration trouvée');
      return {
        name: 'Migrations DB',
        status: 'warning',
        message: 'Aucune migration',
        solution: 'Créez migration: npx prisma migrate dev'
      };
    }
    
    try {
      const migrations = fs.readdirSync(migrationsPath)
        .filter(dir => fs.statSync(path.join(migrationsPath, dir)).isDirectory());
      
      return {
        name: 'Migrations DB',
        status: 'success',
        message: `${migrations.length} migration(s) présente(s)`
      };
    } catch (error) {
      return {
        name: 'Migrations DB',
        status: 'warning',
        message: 'Erreur lecture migrations',
        solution: 'Vérifiez prisma/migrations/'
      };
    }
  }
  
  checkDatabaseHealth() {
    try {
      // Tentative de test Prisma simple
      execSync('npx prisma db push --accept-data-loss --preview-feature', { 
        stdio: 'pipe', 
        timeout: 10000 
      });
      
      return {
        name: 'Santé DB',
        status: 'success',
        message: 'Base accessible'
      };
    } catch (error) {
      this.warnings.push('Test connexion DB échoué');
      return {
        name: 'Santé DB',
        status: 'warning',
        message: 'Connexion non testée',
        solution: 'Testez: npx prisma db push'
      };
    }
  }
  
  // ====================================
  // VALIDATIONS APPLICATION
  // ====================================
  
  async validateApplication() {
    const checks = [
      this.checkProjectStructure(),
      this.checkConfigurationFiles(),
      this.checkBuildOutput(),
      this.checkPortAvailability(),
      this.checkApplicationHealth()
    ];
    
    this.validationResults.push({
      category: 'Application',
      checks: checks,
      timestamp: new Date().toISOString()
    });
    
    this.performanceMetrics.checksExecuted += checks.length;
  }
  
  checkProjectStructure() {
    const essentialFiles = [
      'next.config.js',
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'src/lib/prisma.ts'
    ];
    
    const missingFiles = essentialFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
      this.warnings.push(`Fichiers essentiels manquants: ${missingFiles.join(', ')}`);
      return {
        name: 'Structure projet',
        status: 'warning',
        message: `Fichiers manquants: ${missingFiles.length}`,
        solution: 'Vérifiez la structure Next.js'
      };
    }
    
    return {
      name: 'Structure projet',
      status: 'success',
      message: 'Structure Next.js complète'
    };
  }
  
  checkConfigurationFiles() {
    const configFiles = [
      { file: '.env', required: true },
      { file: '.env.local', required: false },
      { file: 'tailwind.config.js', required: false },
      { file: 'tsconfig.json', required: true }
    ];
    
    const issues = [];
    
    configFiles.forEach(({ file, required }) => {
      if (required && !fs.existsSync(file)) {
        issues.push(file);
      }
    });
    
    if (issues.length > 0) {
      this.warnings.push(`Fichiers config manquants: ${issues.join(', ')}`);
      return {
        name: 'Fichiers configuration',
        status: 'warning',
        message: `Manquants: ${issues.join(', ')}`,
        solution: 'Créez les fichiers de configuration'
      };
    }
    
    return {
      name: 'Fichiers configuration',
      status: 'success',
      message: 'Configuration complète'
    };
  }
  
  checkBuildOutput() {
    const buildPath = path.join(process.cwd(), '.next');
    
    if (!fs.existsSync(buildPath)) {
      this.warnings.push('Application non buildée');
      return {
        name: 'Build application',
        status: 'warning',
        message: 'Build requis',
        solution: 'Exécutez: npm run build'
      };
    }
    
    // Vérifier âge du build
    const buildStats = fs.statSync(buildPath);
    const buildAge = Date.now() - buildStats.mtime.getTime();
    const hoursOld = Math.floor(buildAge / (1000 * 60 * 60));
    
    if (hoursOld > 24) {
      this.warnings.push(`Build obsolète (${hoursOld}h)`);
      return {
        name: 'Build application',
        status: 'warning',
        message: `Build obsolète (${hoursOld}h)`,
        solution: 'Rebuild: npm run build'
      };
    }
    
    return {
      name: 'Build application',
      status: 'success',
      message: `Build récent (${hoursOld}h)`
    };
  }
  
  checkPortAvailability() {
    const port = this.config.app.port;
    
    try {
      // Test simple de disponibilité port
      const net = require('net');
      const server = net.createServer();
      
      return new Promise((resolve) => {
        server.listen(port, () => {
          server.close();
          resolve({
            name: 'Port application',
            status: 'success',
            message: `Port ${port} disponible`
          });
        });
        
        server.on('error', () => {
          this.warnings.push(`Port ${port} occupé`);
          resolve({
            name: 'Port application',
            status: 'warning',
            message: `Port ${port} occupé`,
            solution: `Changez le port ou arrêtez l'application sur ${port}`
          });
        });
      });
    } catch (error) {
      return {
        name: 'Port application',
        status: 'warning',
        message: 'Test port impossible',
        solution: `Vérifiez manuellement le port ${port}`
      };
    }
  }
  
  checkApplicationHealth() {
    // Test basique de santé application
    const healthChecks = [
      fs.existsSync('src/app/api') ? 'API routes présentes' : null,
      fs.existsSync('src/components') ? 'Composants présents' : null,
      fs.existsSync('src/lib') ? 'Utilitaires présents' : null
    ].filter(Boolean);
    
    return {
      name: 'Santé application',
      status: 'success',
      message: `${healthChecks.length} éléments OK`
    };
  }
  
  // ====================================
  // VALIDATIONS PERFORMANCE
  // ====================================
  
  async validatePerformance() {
    const checks = [
      this.checkBuildSize(),
      this.checkDependencySize(),
      this.checkMemoryUsage(),
      this.checkBuildTime()
    ];
    
    this.validationResults.push({
      category: 'Performance',
      checks: checks,
      timestamp: new Date().toISOString()
    });
    
    this.performanceMetrics.checksExecuted += checks.length;
  }
  
  checkBuildSize() {
    const buildPath = path.join(process.cwd(), '.next');
    
    if (!fs.existsSync(buildPath)) {
      return {
        name: 'Taille build',
        status: 'warning',
        message: 'Build non disponible',
        solution: 'Exécutez: npm run build'
      };
    }
    
    const buildSize = this.getDirSize(buildPath);
    const sizeMB = Math.round(buildSize / (1024 * 1024));
    
    if (sizeMB > 200) {
      this.warnings.push(`Build volumineux: ${sizeMB}MB`);
      return {
        name: 'Taille build',
        status: 'warning',
        message: `${sizeMB}MB (volumineux)`,
        solution: 'Optimisez avec tree-shaking et code splitting'
      };
    }
    
    return {
      name: 'Taille build',
      status: 'success',
      message: `${sizeMB}MB (optimal)`,
      details: { size: buildSize }
    };
  }
  
  checkDependencySize() {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
      return {
        name: 'Taille dépendances',
        status: 'warning',
        message: 'Dépendances non installées'
      };
    }
    
    const depSize = this.getDirSize(nodeModulesPath);
    const sizeMB = Math.round(depSize / (1024 * 1024));
    
    if (sizeMB > 1000) {
      this.warnings.push(`Dépendances volumineuses: ${sizeMB}MB`);
      return {
        name: 'Taille dépendances',
        status: 'warning',
        message: `${sizeMB}MB (volumineux)`,
        solution: 'Auditez et supprimez dépendances inutiles'
      };
    }
    
    return {
      name: 'Taille dépendances',
      status: 'success',
      message: `${sizeMB}MB (acceptable)`
    };
  }
  
  checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const memMB = Math.round(memUsage.heapUsed / (1024 * 1024));
    
    this.performanceMetrics.memoryUsed = memMB;
    
    if (memMB > 500) {
      this.warnings.push(`Utilisation mémoire élevée: ${memMB}MB`);
      return {
        name: 'Utilisation mémoire',
        status: 'warning',
        message: `${memMB}MB (élevé)`,
        solution: 'Optimisez le code ou augmentez RAM'
      };
    }
    
    return {
      name: 'Utilisation mémoire',
      status: 'success',
      message: `${memMB}MB (normal)`
    };
  }
  
  checkBuildTime() {
    // Simulation temps de build basé sur taille projet
    const srcSize = fs.existsSync('src') ? this.getDirSize('src') : 0;
    const estimatedBuildTime = Math.max(10, Math.round(srcSize / (1024 * 1024) * 2));
    
    if (estimatedBuildTime > 300) { // 5 minutes
      this.warnings.push(`Temps build estimé élevé: ${estimatedBuildTime}s`);
      return {
        name: 'Temps build estimé',
        status: 'warning',
        message: `~${estimatedBuildTime}s (lent)`,
        solution: 'Optimisez avec cache et parallélisation'
      };
    }
    
    return {
      name: 'Temps build estimé',
      status: 'success',
      message: `~${estimatedBuildTime}s (rapide)`
    };
  }
  
  // ====================================
  // ANALYSE IA AVANCÉE
  // ====================================
  
  async analyzeEnvironmentWithAI(checks) {
    if (!this.aiInfrastructure) return;
    
    try {
      this.performanceMetrics.aiCallsUsed++;
      
      const prompt = `
Analyse cet environnement de déploiement:

CONTEXTE:
- Application: ${this.config.app.name}
- Port: ${this.config.app.port}
- Environnement: ${this.config.app.environment}

RÉSULTATS VALIDATION:
${checks.map(check => `${check.name}: ${check.status} - ${check.message}`).join('\n')}

PROBLÈMES CRITIQUES:
${this.criticalIssues.join('\n')}

AVERTISSEMENTS:
${this.warnings.join('\n')}

Fournis 3 recommandations spécifiques pour optimiser ce déploiement.
Format: [PRIORITÉ] Action précise - Bénéfice attendu
`;

      const response = await this.aiInfrastructure.optimizeCall(prompt, {
        maxTokens: 500,
        context: 'deployment-validation'
      });
      
      if (response) {
        this.aiRecommendations = response.split('\n')
          .filter(line => line.trim().startsWith('['))
          .slice(0, 3);
      }
    } catch (error) {
      console.warn('⚠️  Analyse IA échouée:', error.message);
    }
  }
  
  // ====================================
  // GÉNÉRATION RAPPORT FINAL
  // ====================================
  
  async generateReport() {
    const endTime = Date.now();
    this.performanceMetrics.validationTime = endTime - (this.performanceMetrics.validationTime || endTime);
    
    console.log('\n' + '='.repeat(80));
    console.log('🔍 RAPPORT VALIDATION DÉPLOIEMENT');
    console.log('='.repeat(80));
    
    // Informations projet
    console.log(`📋 PROJET: ${this.config.app.name}`);
    console.log(`🌐 URL: ${this.config.app.baseUrl}`);
    console.log(`🏗️  ENVIRONNEMENT: ${this.config.app.environment}`);
    console.log(`⚡ IA: ${this.config.ai.enabled ? 'Activée' : 'Désactivée'}`);
    console.log(`⏱️  DURÉE: ${Math.round(this.performanceMetrics.validationTime / 1000)}s`);
    
    // Métriques performance
    console.log(`\n📊 MÉTRIQUES:`);
    console.log(`   ✅ Vérifications: ${this.performanceMetrics.checksExecuted}`);
    console.log(`   🧠 Appels IA: ${this.performanceMetrics.aiCallsUsed}`);
    console.log(`   💾 Mémoire: ${this.performanceMetrics.memoryUsed}MB`);
    
    // Calcul statut global
    let totalChecks = 0;
    let successfulChecks = 0;
    let failedChecks = 0;
    let warningChecks = 0;
    
    // Affichage résultats par catégorie
    this.validationResults.forEach(category => {
      console.log(`\n📁 ${category.category.toUpperCase()}:`);
      
      if (category.checks && category.checks.length > 0) {
        category.checks.forEach(check => {
          totalChecks++;
          
          if (check.status === 'success') successfulChecks++;
          else if (check.status === 'failed') failedChecks++;
          else if (check.status === 'warning') warningChecks++;
          
          const icon = check.status === 'success' ? '✅' : 
                      check.status === 'warning' ? '⚠️' : '❌';
          console.log(`   ${icon} ${check.name}: ${check.message}`);
          
          if (check.solution && check.status !== 'success') {
            console.log(`      💡 ${check.solution}`);
          }
        });
      }
    });
    
    // Issues critiques
    if (this.criticalIssues.length > 0) {
      console.log('\n🚨 PROBLÈMES CRITIQUES:');
      this.criticalIssues.forEach(issue => {
        console.log(`   ❌ ${issue}`);
      });
    }
    
    // Avertissements
    if (this.warnings.length > 0) {
      console.log('\n⚠️  AVERTISSEMENTS:');
      this.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning}`);
      });
    }
    
    // Recommandations IA
    if (this.aiRecommendations.length > 0) {
      console.log('\n🧠 RECOMMANDATIONS IA:');
      this.aiRecommendations.forEach(rec => {
        console.log(`   🎯 ${rec}`);
      });
    }
    
    // Statut global
    const globalStatus = failedChecks > 0 ? 'FAILED' : 
                        warningChecks > 5 ? 'WARNING' : 'SUCCESS';
    
    console.log('\n' + '='.repeat(80));
    console.log(`📈 RÉSULTAT: ${successfulChecks}/${totalChecks} vérifications réussies`);
    
    // Recommandations finales
    console.log('\n💡 ACTIONS RECOMMANDÉES:');
    if (globalStatus === 'SUCCESS') {
      console.log('   🎉 Déploiement prêt !');
      console.log(`   🚀 Démarrage: npm start`);
      console.log(`   🌐 Accès: ${this.config.app.baseUrl}`);
      
      if (this.config.ai.enabled) {
        console.log('   🧠 Pipeline IA activé pour optimisations futures');
      }
    } else if (globalStatus === 'WARNING') {
      console.log('   ⚠️  Déploiement possible avec avertissements');
      console.log('   🔧 Corrigez les avertissements pour optimiser');
      console.log('   🚀 Démarrage possible: npm start --force');
    } else {
      console.log('   ❌ Déploiement non recommandé');
      console.log('   🛠️  Corrigez les erreurs critiques d\'abord');
      console.log('   🔧 Utilisez: node tools/config-generator.js');
      
      if (this.criticalIssues.length > 0) {
        console.log(`   🆘 ${this.criticalIssues.length} problème(s) critique(s) à résoudre`);
      }
    }
    
    // Prochaines étapes
    console.log('\n🎯 PROCHAINES ÉTAPES:');
    if (globalStatus === 'SUCCESS') {
      console.log('   1. Exécuter: npm start');
      console.log('   2. Tester l\'application');
      console.log('   3. Configurer monitoring');
      
      if (this.config.ai.enabled) {
        console.log('   4. Activer pipeline IA: npm run ai-build');
      }
    } else {
      console.log('   1. Corriger problèmes critiques');
      console.log('   2. Relancer validation');
      console.log('   3. Tester déploiement');
    }
    
    console.log('\n' + '='.repeat(80));
    
    return {
      status: globalStatus,
      totalChecks,
      successfulChecks,
      failedChecks,
      warningChecks,
      criticalIssues: this.criticalIssues,
      warnings: this.warnings,
      aiRecommendations: this.aiRecommendations,
      performanceMetrics: this.performanceMetrics,
      config: this.config
    };
  }
  
  // ====================================
  // UTILITAIRES
  // ====================================
  
  getDirSize(dir) {
    let totalSize = 0;
    
    const calculateSize = (dirPath) => {
      try {
        const files = fs.readdirSync(dirPath);
        
        files.forEach(file => {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          
          if (stats.isDirectory()) {
            // Éviter node_modules dans node_modules pour performance
            if (file !== 'node_modules' || !dirPath.includes('node_modules')) {
              calculateSize(filePath);
            }
          } else {
            totalSize += stats.size;
          }
        });
      } catch (error) {
        // Ignorer erreurs d'accès
      }
    };
    
    calculateSize(dir);
    return totalSize;
  }
  
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// ====================================
// POINT D'ENTRÉE PRINCIPAL
// ====================================

async function main() {
  const validator = new DeploymentValidator();
  
  try {
    console.log('🔍 Démarrage validation déploiement intelligent...\n');
    
    // Message IA si activée
    if (validator.config.ai.enabled) {
      console.log('🧠 Mode IA activé - Analyse avancée en cours...\n');
    }
    
    // Exécuter toutes les validations séquentiellement
    await validator.validateEnvironment();
    await validator.validateDependencies();
    await validator.validateDatabase();
    await validator.validateApplication();
    await validator.validatePerformance();
    
    // Générer le rapport final
    const report = await validator.generateReport();
    
    // Sauvegarde rapport pour pipeline IA
    if (validator.config.ai.enabled) {
      try {
        const reportPath = path.join(process.cwd(), 'ai-memory', 'deployment-report.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📝 Rapport sauvegardé: ${reportPath}`);
      } catch (error) {
        console.warn('⚠️  Sauvegarde rapport IA échouée:', error.message);
      }
    }
    
    // Code de sortie selon le statut
    if (report.status === 'FAILED') {
      console.log('\n💥 Validation échouée - Déploiement non recommandé');
      process.exit(1);
    } else if (report.status === 'WARNING') {
      console.log('\n⚠️ Validation avec avertissements - Déploiement possible');
      process.exit(0);
    } else {
      console.log('\n🎉 Validation réussie - Déploiement prêt !');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la validation:');
    console.error(`   💥 ${error.message}`);
    
    // Informations de debug
    console.log('\n🔍 Informations de debug:');
    console.log(`   📂 Répertoire: ${process.cwd()}`);
    console.log(`   🔧 Node.js: ${process.version}`);
    console.log(`   ⚡ IA: ${validator.config.ai.enabled ? 'Activée' : 'Désactivée'}`);
    
    console.log('\n💡 Pour résoudre:');
    console.log('   1. Vérifiez la configuration dans .project-config.json');
    console.log('   2. Vérifiez que tous les fichiers requis sont présents');
    console.log('   3. Lancez: node tools/config-generator.js');
    console.log('   4. Vérifiez les permissions du répertoire');
    
    if (validator.config.ai.enabled) {
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
  DeploymentValidator,
  main
};