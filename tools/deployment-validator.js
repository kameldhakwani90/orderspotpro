const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const https = require('https');

// ====================================
// DEPLOYMENT VALIDATOR DYNAMIQUE - PIPELINE UNIVERSEL
// ====================================

console.log('🔍 Validation déploiement dynamique - Pipeline Universel');

class DeploymentValidator {
  constructor() {
    this.config = null;
    this.validationResults = {
      environment: { status: 'pending', checks: [] },
      dependencies: { status: 'pending', checks: [] },
      database: { status: 'pending', checks: [] },
      application: { status: 'pending', checks: [] },
      performance: { status: 'pending', checks: [] }
    };
    this.criticalIssues = [];
    this.warnings = [];
    
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
        throw new Error('Fichier .project-config.json manquant');
      }
      
      if (!fs.existsSync(envPath)) {
        throw new Error('Fichier .env manquant');
      }
      
      this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      
      // Charger aussi les variables d'environnement
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim().replace(/['"]/g, '');
        }
      });
      
      console.log(`📋 Configuration chargée: ${this.config.app?.name || 'Projet'}`);
      console.log(`🚀 Port configuré: ${this.config.app?.port || 'Non défini'}`);
      console.log(`🌐 URL base: ${this.config.app?.baseUrl || 'Non définie'}`);
      
      // Valider la configuration
      this.validateConfiguration();
      
    } catch (error) {
      console.error('❌ Erreur chargement configuration:', error.message);
      console.log('💡 Lancez d\'abord: node tools/config-generator.js');
      process.exit(1);
    }
  }
  
  validateConfiguration() {
    const required = [
      'app.name',
      'app.port', 
      'app.baseUrl',
      'database.url',
      'admin.email'
    ];
    
    const missing = required.filter(path => {
      const keys = path.split('.');
      let obj = this.config;
      for (const key of keys) {
        if (!obj || obj[key] === undefined) return true;
        obj = obj[key];
      }
      return false;
    });
    
    if (missing.length > 0) {
      throw new Error(`Configuration incomplète: ${missing.join(', ')}`);
    }
  }
  
  // ====================================
  // VALIDATION ENVIRONNEMENT
  // ====================================
  
  async validateEnvironment() {
    console.log('\n🔧 Validation environnement système...');
    
    const checks = [];
    
    // 1. Version Node.js
    const nodeCheck = this.checkNodeVersion();
    checks.push(nodeCheck);
    
    // 2. Gestionnaire de paquets
    const packageManagerCheck = this.checkPackageManager();
    checks.push(packageManagerCheck);
    
    // 3. Variables d'environnement critiques
    const envVarsCheck = this.checkEnvironmentVariables();
    checks.push(envVarsCheck);
    
    // 4. Répertoires essentiels
    const dirsCheck = this.checkEssentialDirectories();
    checks.push(dirsCheck);
    
    // 5. Permissions
    const permissionsCheck = this.checkPermissions();
    checks.push(permissionsCheck);
    
    // 6. Espace disque
    const diskSpaceCheck = this.checkDiskSpace();
    checks.push(diskSpaceCheck);
    
    this.validationResults.environment = {
      status: checks.every(c => c.status === 'success') ? 'success' : 'failed',
      checks: checks,
      summary: `${checks.filter(c => c.status === 'success').length}/${checks.length} vérifications réussies`
    };
    
    return this.validationResults.environment;
  }
  
  checkNodeVersion() {
    try {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
      
      if (majorVersion < 16) {
        this.criticalIssues.push(`Version Node.js trop ancienne: ${nodeVersion}`);
        return {
          name: 'Version Node.js',
          status: 'failed',
          message: `Version ${nodeVersion} non supportée (minimum: 16.x)`,
          solution: 'Mettez à jour Node.js vers une version 16+ ou 18+'
        };
      }
      
      if (majorVersion >= 18) {
        return {
          name: 'Version Node.js',
          status: 'success',
          message: `Version ${nodeVersion} (recommandée)`
        };
      }
      
      return {
        name: 'Version Node.js',
        status: 'success',
        message: `Version ${nodeVersion} (supportée)`
      };
    } catch (error) {
      return {
        name: 'Version Node.js',
        status: 'failed',
        message: 'Impossible de déterminer la version Node.js',
        solution: 'Vérifiez que Node.js est correctement installé'
      };
    }
  }
  
  checkPackageManager() {
    try {
      // Vérifier npm
      const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
      
      // Vérifier yarn (optionnel)
      let yarnVersion = null;
      try {
        yarnVersion = execSync('yarn --version', { encoding: 'utf-8' }).trim();
      } catch {}
      
      return {
        name: 'Gestionnaire de paquets',
        status: 'success',
        message: `npm ${npmVersion}${yarnVersion ? `, yarn ${yarnVersion}` : ''}`,
        details: { npm: npmVersion, yarn: yarnVersion }
      };
    } catch (error) {
      return {
        name: 'Gestionnaire de paquets',
        status: 'failed',
        message: 'npm non disponible',
        solution: 'Installez Node.js et npm'
      };
    }
  }
  
  checkEnvironmentVariables() {
    const requiredVars = [
      'DATABASE_URL',
      'PORT',
      'APP_NAME',
      'ADMIN_EMAIL'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.warnings.push(`Variables d'environnement manquantes: ${missingVars.join(', ')}`);
      return {
        name: 'Variables d\'environnement',
        status: 'warning',
        message: `Variables manquantes: ${missingVars.join(', ')}`,
        solution: 'Vérifiez le fichier .env'
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
      // Tester écriture dans le répertoire courant
      const testFile = path.join(process.cwd(), '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      return {
        name: 'Permissions fichiers',
        status: 'success',
        message: 'Permissions lecture/écriture OK'
      };
    } catch (error) {
      return {
        name: 'Permissions fichiers',
        status: 'failed',
        message: 'Permissions insuffisantes',
        solution: 'Vérifiez les permissions du répertoire'
      };
    }
  }
  
  checkDiskSpace() {
    try {
      const stats = fs.statSync(process.cwd());
      
      // Estimation basique (pas de vérification espace libre réelle)
      return {
        name: 'Espace disque',
        status: 'success',
        message: 'Répertoire accessible'
      };
    } catch (error) {
      return {
        name: 'Espace disque',
        status: 'warning',
        message: 'Impossible de vérifier l\'espace disque'
      };
    }
  }
  
  // ====================================
  // VALIDATION DÉPENDANCES
  // ====================================
  
  async validateDependencies() {
    console.log('\n📦 Validation des dépendances...');
    
    const checks = [];
    
    // 1. Fichier package.json
    const packageJsonCheck = this.checkPackageJson();
    checks.push(packageJsonCheck);
    
    // 2. node_modules
    const nodeModulesCheck = this.checkNodeModules();
    checks.push(nodeModulesCheck);
    
    // 3. Dépendances critiques
    const criticalDepsCheck = this.checkCriticalDependencies();
    checks.push(criticalDepsCheck);
    
    this.validationResults.dependencies = {
      status: checks.every(c => c.status === 'success') ? 'success' : 'failed',
      checks: checks,
      summary: `${checks.filter(c => c.status === 'success').length}/${checks.length} vérifications réussies`
    };
    
    return this.validationResults.dependencies;
  }
  
  checkPackageJson() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return {
        name: 'package.json',
        status: 'failed',
        message: 'Fichier package.json manquant',
        solution: 'Le fichier sera créé par le pipeline'
      };
    }
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const hasScripts = packageJson.scripts && packageJson.scripts.build;
      
      return {
        name: 'package.json',
        status: 'success',
        message: `Nom: ${packageJson.name || 'Non défini'}${hasScripts ? ', scripts OK' : ''}`,
        details: { name: packageJson.name, version: packageJson.version }
      };
    } catch (error) {
      return {
        name: 'package.json',
        status: 'failed',
        message: 'package.json invalide',
        solution: 'Vérifiez la syntaxe JSON'
      };
    }
  }
  
  checkNodeModules() {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
      return {
        name: 'node_modules',
        status: 'failed',
        message: 'Dépendances non installées',
        solution: 'Lancez: npm install'
      };
    }
    
    try {
      const stats = fs.statSync(nodeModulesPath);
      const nodeModulesSize = this.getDirSize(nodeModulesPath);
      
      return {
        name: 'node_modules',
        status: 'success',
        message: `Dépendances installées (${this.formatBytes(nodeModulesSize)})`,
        details: { size: nodeModulesSize }
      };
    } catch (error) {
      return {
        name: 'node_modules',
        status: 'warning',
        message: 'Erreur vérification node_modules'
      };
    }
  }
  
  checkCriticalDependencies() {
    const criticalDeps = [
      'react',
      'next',
      '@prisma/client',
      'typescript'
    ];
    
    const missing = [];
    const installed = [];
    
    criticalDeps.forEach(dep => {
      try {
        require.resolve(dep);
        installed.push(dep);
      } catch {
        missing.push(dep);
      }
    });
    
    if (missing.length > 0) {
      return {
        name: 'Dépendances critiques',
        status: 'failed',
        message: `Manquantes: ${missing.join(', ')}`,
        solution: `Lancez: npm install ${missing.join(' ')}`
      };
    }
    
    return {
      name: 'Dépendances critiques',
      status: 'success',
      message: `${installed.length} dépendances critiques installées`
    };
  }
  
  // ====================================
  // VALIDATION BASE DE DONNÉES
  // ====================================
  
  async validateDatabase() {
    console.log('\n🗄️ Validation base de données...');
    
    const checks = [];
    
    // 1. Configuration connexion
    const connectionCheck = this.checkDatabaseConnectionConfig();
    checks.push(connectionCheck);
    
    // 2. Test connexion
    if (connectionCheck.status === 'success') {
      const connectivityCheck = await this.checkDatabaseConnectivity();
      checks.push(connectivityCheck);
    }
    
    // 3. Schema Prisma
    const schemaCheck = this.checkPrismaSchema();
    checks.push(schemaCheck);
    
    // 4. Client Prisma
    const clientCheck = this.checkPrismaClient();
    checks.push(clientCheck);
    
    // 5. Tables/migrations
    if (connectionCheck.status === 'success') {
      const tablesCheck = await this.checkDatabaseTables();
      checks.push(tablesCheck);
    }
    
    this.validationResults.database = {
      status: checks.every(c => c.status === 'success') ? 'success' : 
              checks.some(c => c.status === 'failed') ? 'failed' : 'warning',
      checks: checks,
      summary: `${checks.filter(c => c.status === 'success').length}/${checks.length} vérifications réussies`
    };
    
    return this.validationResults.database;
  }
  
  checkDatabaseConnectionConfig() {
    const databaseUrl = this.config.database?.url || process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      this.criticalIssues.push('DATABASE_URL non définie');
      return {
        name: 'Configuration DATABASE_URL',
        status: 'failed',
        message: 'Variable DATABASE_URL non définie',
        solution: 'Définissez DATABASE_URL dans le fichier .env'
      };
    }
    
    // Validation basique de l'URL
    try {
      const url = new URL(databaseUrl);
      
      if (!['postgresql:', 'postgres:', 'mysql:', 'file:'].includes(url.protocol)) {
        return {
          name: 'Format DATABASE_URL',
          status: 'warning',
          message: `Protocole non reconnu: ${url.protocol}`,
          solution: 'Vérifiez le format de DATABASE_URL'
        };
      }
      
      // Masquer le mot de passe pour l'affichage
      const maskedUrl = databaseUrl.replace(/:[^:]*@/, ':***@');
      
      return {
        name: 'Configuration DATABASE_URL',
        status: 'success',
        message: `URL configurée: ${maskedUrl}`,
        details: { 
          protocol: url.protocol,
          host: url.hostname,
          port: url.port,
          database: url.pathname.substring(1)
        }
      };
    } catch (error) {
      return {
        name: 'Format DATABASE_URL',
        status: 'failed',
        message: 'Format DATABASE_URL invalide',
        solution: 'Corrigez le format de DATABASE_URL'
      };
    }
  }
  
  async checkDatabaseConnectivity() {
    console.log('   🔌 Test de connectivité base de données...');
    
    try {
      // Test avec Prisma si disponible
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      await prisma.$connect();
      await prisma.$disconnect();
      
      return {
        name: 'Connectivité base de données',
        status: 'success',
        message: 'Connexion réussie'
      };
    } catch (error) {
      if (error.message.includes('Cannot find module')) {
        return {
          name: 'Connectivité base de données',
          status: 'warning',
          message: 'Client Prisma non disponible pour test',
          solution: 'Lancez: npx prisma generate'
        };
      }
      
      return {
        name: 'Connectivité base de données',
        status: 'failed',
        message: `Connexion échouée: ${error.message}`,
        solution: 'Vérifiez que la base de données est démarrée et accessible'
      };
    }
  }
  
  checkPrismaSchema() {
    const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
    
    if (!fs.existsSync(schemaPath)) {
      return {
        name: 'Schema Prisma',
        status: 'warning',
        message: 'Schema Prisma manquant',
        solution: 'Sera généré par generateCompleteSystem.js'
      };
    }
    
    try {
      const content = fs.readFileSync(schemaPath, 'utf-8');
      const hasGenerator = content.includes('generator client');
      const hasDataSource = content.includes('datasource db');
      const modelCount = (content.match(/model\s+\w+/g) || []).length;
      
      if (!hasGenerator || !hasDataSource) {
        return {
          name: 'Schema Prisma',
          status: 'failed',
          message: 'Schema Prisma invalide',
          solution: 'Vérifiez la syntaxe du schema'
        };
      }
      
      return {
        name: 'Schema Prisma',
        status: 'success',
        message: `Schema valide (${modelCount} modèles)`,
        details: { models: modelCount }
      };
    } catch (error) {
      return {
        name: 'Schema Prisma',
        status: 'failed',
        message: 'Erreur lecture schema',
        solution: 'Vérifiez les permissions du fichier'
      };
    }
  }
  
  checkPrismaClient() {
    try {
      require('@prisma/client');
      
      // Vérifier si le client est généré
      const generatedPath = path.join(process.cwd(), 'node_modules/.prisma/client');
      const clientExists = fs.existsSync(generatedPath);
      
      if (!clientExists) {
        return {
          name: 'Client Prisma',
          status: 'warning',
          message: 'Client Prisma non généré',
          solution: 'Lancez: npx prisma generate'
        };
      }
      
      return {
        name: 'Client Prisma',
        status: 'success',
        message: 'Client Prisma généré et disponible'
      };
    } catch (error) {
      return {
        name: 'Client Prisma',
        status: 'failed',
        message: '@prisma/client non installé',
        solution: 'Lancez: npm install @prisma/client'
      };
    }
  }
  
  async checkDatabaseTables() {
    console.log('   📊 Vérification tables base de données...');
    
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Test simple avec une requête
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      
      return {
        name: 'Tables base de données',
        status: 'success',
        message: 'Base de données accessible'
      };
    } catch (error) {
      return {
        name: 'Tables base de données',
        status: 'warning',
        message: 'Impossible de vérifier les tables',
        details: { error: error.message }
      };
    }
  }
  
  // ====================================
  // VALIDATION APPLICATION
  // ====================================
  
  async validateApplication() {
    console.log('\n🚀 Validation application...');
    
    const checks = [];
    
    // 1. Port disponible
    const portCheck = await this.checkPortAvailability();
    checks.push(portCheck);
    
    // 2. Fichiers Next.js
    const nextCheck = this.checkNextJsFiles();
    checks.push(nextCheck);
    
    // 3. Build possible
    const buildCheck = this.checkBuildReadiness();
    checks.push(buildCheck);
    
    // 4. Configuration Next.js
    const configCheck = this.checkNextConfiguration();
    checks.push(configCheck);
    
    this.validationResults.application = {
      status: checks.every(c => c.status === 'success') ? 'success' : 'failed',
      checks: checks,
      summary: `${checks.filter(c => c.status === 'success').length}/${checks.length} vérifications réussies`
    };
    
    return this.validationResults.application;
  }
  
  async checkPortAvailability() {
    const port = this.config.app?.port || 3000;
    
    return new Promise((resolve) => {
      const server = http.createServer();
      
      server.listen(port, () => {
        server.close(() => {
          resolve({
            name: 'Disponibilité port',
            status: 'success',
            message: `Port ${port} disponible`
          });
        });
      });
      
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          resolve({
            name: 'Disponibilité port',
            status: 'warning',
            message: `Port ${port} déjà utilisé`,
            solution: `Arrêtez le processus utilisant le port ${port} ou changez de port`
          });
        } else {
          resolve({
            name: 'Disponibilité port',
            status: 'failed',
            message: `Erreur port ${port}: ${error.message}`
          });
        }
      });
    });
  }
  
  checkNextJsFiles() {
    const essentialFiles = [
      'src/app/layout.tsx',
      'src/app/page.tsx'
    ];
    
    const missingFiles = essentialFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
      return {
        name: 'Fichiers Next.js',
        status: 'warning',
        message: `Fichiers manquants: ${missingFiles.join(', ')}`,
        solution: 'Seront créés par le pipeline'
      };
    }
    
    return {
      name: 'Fichiers Next.js',
      status: 'success',
      message: 'Fichiers essentiels présents'
    };
  }
  
  checkBuildReadiness() {
    const requiredForBuild = [
      'package.json',
      'tsconfig.json'
    ];
    
    const missing = requiredForBuild.filter(file => !fs.existsSync(file));
    
    if (missing.length > 0) {
      return {
        name: 'Préparation build',
        status: 'warning',
        message: `Fichiers build manquants: ${missing.join(', ')}`,
        solution: 'Seront créés par build-server.js'
      };
    }
    
    return {
      name: 'Préparation build',
      status: 'success',
      message: 'Prêt pour le build'
    };
  }
  
  checkNextConfiguration() {
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    
    if (!fs.existsSync(nextConfigPath)) {
      return {
        name: 'Configuration Next.js',
        status: 'success',
        message: 'Configuration par défaut (aucun next.config.js)'
      };
    }
    
    try {
      const config = require(nextConfigPath);
      return {
        name: 'Configuration Next.js',
        status: 'success',
        message: 'Configuration personnalisée trouvée'
      };
    } catch (error) {
      return {
        name: 'Configuration Next.js',
        status: 'warning',
        message: 'Erreur lecture next.config.js',
        solution: 'Vérifiez la syntaxe du fichier'
      };
    }
  }
  
  // ====================================
  // VALIDATION PERFORMANCE
  // ====================================
  
  async validatePerformance() {
    console.log('\n⚡ Validation performance...');
    
    const checks = [];
    
    // 1. Taille du build
    const buildSizeCheck = this.checkBuildSize();
    checks.push(buildSizeCheck);
    
    // 2. Dépendances
    const depsPerformanceCheck = this.checkDependenciesPerformance();
    checks.push(depsPerformanceCheck);
    
    // 3. Configuration Next.js
    const nextConfigCheck = this.checkNextJsConfiguration();
    checks.push(nextConfigCheck);
    
    // 4. Temps de réponse (si app accessible)
    const responseTimeCheck = await this.checkResponseTime();
    checks.push(responseTimeCheck);
    
    this.validationResults.performance = {
      status: checks.every(c => c.status === 'success') ? 'success' : 
              checks.some(c => c.status === 'failed') ? 'failed' : 'warning',
      checks: checks,
      summary: `${checks.filter(c => c.status === 'success').length}/${checks.length} vérifications réussies`
    };
    
    return this.validationResults.performance;
  }
  
  checkBuildSize() {
    const nextBuildPath = path.join(process.cwd(), '.next');
    
    if (!fs.existsSync(nextBuildPath)) {
      return {
        name: 'Taille du build',
        status: 'warning',
        message: 'Build non disponible pour l\'analyse',
        solution: 'Exécutez "npm run build" d\'abord'
      };
    }
    
    try {
      const buildSize = this.getDirSize(nextBuildPath);
      const buildSizeMB = (buildSize / (1024 * 1024)).toFixed(2);
      
      let status = 'success';
      let message = `Taille du build: ${buildSizeMB} MB`;
      
      if (buildSize > 100 * 1024 * 1024) { // > 100MB
        status = 'warning';
        message += ' (volumineux)';
        this.warnings.push(`Build volumineux: ${buildSizeMB} MB`);
      }
      
      return {
        name: 'Taille du build',
        status,
        message,
        details: { size: buildSize, sizeMB: buildSizeMB }
      };
    } catch (error) {
      return {
        name: 'Taille du build',
        status: 'warning',
        message: 'Impossible d\'analyser la taille'
      };
    }
  }
  
  checkDependenciesPerformance() {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
      return {
        name: 'Performance dépendances',
        status: 'warning',
        message: 'node_modules non disponible'
      };
    }
    
    try {
      const size = this.getDirSize(nodeModulesPath);
      const sizeMB = (size / (1024 * 1024)).toFixed(2);
      
      let status = 'success';
      let message = `node_modules: ${sizeMB} MB`;
      
      if (size > 500 * 1024 * 1024) { // > 500MB
        status = 'warning';
        message += ' (très volumineux)';
        this.warnings.push(`node_modules volumineux: ${sizeMB} MB`);
      }
      
      return {
        name: 'Performance dépendances',
        status,
        message,
        details: { size: size, sizeMB: sizeMB }
      };
    } catch (error) {
      return {
        name: 'Performance dépendances',
        status: 'warning',
        message: 'Impossible d\'analyser la taille'
      };
    }
  }
  
  async checkResponseTime() {
    const url = this.config.app?.baseUrl || `http://localhost:${this.config.app?.port || 3000}`;
    
    console.log(`   🌐 Test temps de réponse: ${url}`);
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const timeout = setTimeout(() => {
        resolve({
          name: 'Temps de réponse',
          status: 'warning',
          message: 'Timeout - application non accessible',
          solution: 'Démarrez l\'application d\'abord'
        });
      }, 10000);
      
      const protocol = url.startsWith('https') ? https : http;
      const request = protocol.get(url, (res) => {
        clearTimeout(timeout);
        const responseTime = Date.now() - startTime;
        
        let status = 'success';
        let message = `${responseTime}ms`;
        
        if (responseTime > 2000) {
          status = 'warning';
          message += ' (lent)';
          this.warnings.push(`Temps de réponse élevé: ${responseTime}ms`);
        } else if (responseTime > 5000) {
          status = 'failed';
          message += ' (très lent)';
        }
        
        resolve({
          name: 'Temps de réponse',
          status,
          message,
          details: { responseTime, url }
        });
      });
      
      request.on('error', () => {
        clearTimeout(timeout);
        resolve({
          name: 'Temps de réponse',
          status: 'warning',
          message: 'Application non accessible',
          solution: 'Démarrez l\'application d\'abord'
        });
      });
    });
  }
  
  // ====================================
  // GÉNÉRATION DU RAPPORT FINAL
  // ====================================
  
  async generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 RAPPORT DE VALIDATION DU DÉPLOIEMENT');
    console.log(`📁 Projet: ${this.config.app.name}`);
    console.log(`🌐 URL: ${this.config.app.baseUrl}`);
    console.log(`🚀 Port: ${this.config.app.port}`);
    console.log('='.repeat(80));
    
    const allResults = Object.values(this.validationResults);
    const totalChecks = allResults.reduce((sum, result) => sum + (result.checks?.length || 0), 0);
    const successfulChecks = allResults.reduce((sum, result) => 
      sum + (result.checks?.filter(c => c.status === 'success')?.length || 0), 0);
    const failedChecks = allResults.reduce((sum, result) => 
      sum + (result.checks?.filter(c => c.status === 'failed')?.length || 0), 0);
    const warningChecks = totalChecks - successfulChecks - failedChecks;
    
    // Statut global
    let globalStatus = 'SUCCESS';
    if (this.criticalIssues.length > 0 || failedChecks > 0) {
      globalStatus = 'FAILED';
    } else if (this.warnings.length > 0 || warningChecks > 0) {
      globalStatus = 'WARNING';
    }
    
    console.log(`\n📊 RÉSUMÉ GLOBAL: ${globalStatus}`);
    console.log(`   ✅ Succès: ${successfulChecks}/${totalChecks}`);
    console.log(`   ⚠️  Avertissements: ${warningChecks}`);
    console.log(`   ❌ Échecs: ${failedChecks}`);
    
    // Détails par catégorie
    Object.entries(this.validationResults).forEach(([category, result]) => {
      if (result.checks && result.checks.length > 0) {
        console.log(`\n🔍 ${category.toUpperCase()}: ${result.status.toUpperCase()}`);
        console.log(`   ${result.summary}`);
        
        result.checks.forEach(check => {
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
    
    // Recommandations
    console.log('\n💡 RECOMMANDATIONS:');
    if (globalStatus === 'SUCCESS') {
      console.log('   🎉 Déploiement prêt !');
      console.log(`   🚀 Démarrage: npm start (port ${this.config.app.port})`);
      console.log(`   🌐 Accès: ${this.config.app.baseUrl}`);
    } else if (globalStatus === 'WARNING') {
      console.log('   ⚠️  Déploiement possible avec avertissements');
      console.log('   🔧 Corrigez les avertissements pour optimiser');
    } else {
      console.log('   ❌ Déploiement non recommandé');
      console.log('   🛠️  Corrigez les erreurs critiques d\'abord');
    }
    
    console.log('\n' + '='.repeat(80));
    
    return {
      status: globalStatus,
      totalChecks,
      successfulChecks,
      failedChecks,
      warningChecks,
      criticalIssues: this.criticalIssues,
      warnings: this.warnings
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
            calculateSize(filePath);
          } else {
            totalSize += stats.size;
          }
        });
      } catch (error) {
        // Ignorer les erreurs d'accès
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
// POINT D'ENTRÉE
// ====================================

async function main() {
  const validator = new DeploymentValidator();
  
  try {
    console.log('🔍 Démarrage validation déploiement...\n');
    
    // Exécuter toutes les validations
    await validator.validateEnvironment();
    await validator.validateDependencies();
    await validator.validateDatabase();
    await validator.validateApplication();
    await validator.validatePerformance();
    
    // Générer le rapport final
    const report = await validator.generateReport();
    
    // Code de sortie selon le statut
    if (report.status === 'FAILED') {
      console.log('\n💥 Validation échouée - Des problèmes critiques empêchent le déploiement');
      process.exit(1);
    } else if (report.status === 'WARNING') {
      console.log('\n⚠️ Validation avec avertissements - Déploiement possible mais non optimal');
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
    
    console.log('\n💡 Pour résoudre:');
    console.log('   1. Vérifiez la configuration dans .project-config.json');
    console.log('   2. Vérifiez que tous les fichiers requis sont présents');
    console.log('   3. Lancez: node tools/config-generator.js');
    console.log('   4. Vérifiez les permissions du répertoire');
    
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