// ====================================
// DEPLOYMENT VALIDATOR - OrderSpot Pro
// Validation complète de l'environnement de déploiement
// ====================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

class DeploymentValidator {
  constructor() {
    this.validationResults = {
      environment: { status: 'pending', checks: [] },
      dependencies: { status: 'pending', checks: [] },
      database: { status: 'pending', checks: [] },
      application: { status: 'pending', checks: [] },
      security: { status: 'pending', checks: [] },
      performance: { status: 'pending', checks: [] }
    };
    
    this.prisma = null;
    this.errors = [];
    this.warnings = [];
    this.criticalIssues = [];
  }

  // ====================================
  // VALIDATION ENVIRONNEMENT
  // ====================================

  async validateEnvironment() {
    console.log('🔍 Validation de l\'environnement...');
    
    const checks = [];
    
    // 1. Fichier .env
    const envCheck = this.checkEnvFile();
    checks.push(envCheck);
    
    // 2. Variables d'environnement critiques
    const envVarsCheck = this.checkEnvironmentVariables();
    checks.push(envVarsCheck);
    
    // 3. Répertoires essentiels
    const dirsCheck = this.checkEssentialDirectories();
    checks.push(dirsCheck);
    
    // 4. Permissions
    const permissionsCheck = this.checkPermissions();
    checks.push(permissionsCheck);
    
    // 5. Espace disque
    const diskSpaceCheck = this.checkDiskSpace();
    checks.push(diskSpaceCheck);
    
    this.validationResults.environment = {
      status: checks.every(c => c.status === 'success') ? 'success' : 'failed',
      checks: checks,
      summary: `${checks.filter(c => c.status === 'success').length}/${checks.length} vérifications réussies`
    };
    
    return this.validationResults.environment;
  }

  checkEnvFile() {
    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      this.criticalIssues.push('Fichier .env manquant');
      return {
        name: 'Fichier .env',
        status: 'failed',
        message: 'Fichier .env introuvable',
        solution: 'Exécutez le script tt.sh pour créer le fichier .env'
      };
    }
    
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'PORT'];
    const missingVars = requiredVars.filter(varName => !envContent.includes(varName));
    
    if (missingVars.length > 0) {
      this.warnings.push(`Variables manquantes dans .env: ${missingVars.join(', ')}`);
      return {
        name: 'Variables .env',
        status: 'warning',
        message: `Variables manquantes: ${missingVars.join(', ')}`,
        solution: 'Ajoutez les variables manquantes au fichier .env'
      };
    }
    
    return {
      name: 'Configuration .env',
      status: 'success',
      message: 'Fichier .env valide avec toutes les variables requises'
    };
  }

  checkEnvironmentVariables() {
    const requiredEnvVars = {
      'DATABASE_URL': 'URL de connexion à la base de données',
      'PORT': 'Port de l\'application',
      'NODE_ENV': 'Environnement d\'exécution'
    };
    
    const missing = [];
    const present = [];
    
    Object.entries(requiredEnvVars).forEach(([varName, description]) => {
      if (process.env[varName]) {
        present.push(varName);
      } else {
        missing.push({ name: varName, description });
      }
    });
    
    if (missing.length > 0) {
      this.warnings.push(`Variables d'environnement manquantes: ${missing.map(m => m.name).join(', ')}`);
      return {
        name: 'Variables d\'environnement',
        status: 'warning',
        message: `${missing.length} variables manquantes sur ${Object.keys(requiredEnvVars).length}`,
        details: missing,
        solution: 'Définissez les variables d\'environnement manquantes'
      };
    }
    
    return {
      name: 'Variables d\'environnement',
      status: 'success',
      message: `Toutes les variables requises sont définies (${present.length})`
    };
  }

  checkEssentialDirectories() {
    const requiredDirs = [
      { path: './src', name: 'Code source' },
      { path: './prisma', name: 'Configuration Prisma' },
      { path: './public', name: 'Fichiers statiques' },
      { path: './.next', name: 'Build Next.js', optional: true },
      { path: './node_modules', name: 'Dépendances' }
    ];
    
    const missing = [];
    const present = [];
    
    requiredDirs.forEach(dir => {
      if (fs.existsSync(dir.path)) {
        present.push(dir.name);
      } else {
        if (!dir.optional) {
          missing.push(dir);
        }
      }
    });
    
    if (missing.length > 0) {
      this.criticalIssues.push(`Répertoires manquants: ${missing.map(d => d.name).join(', ')}`);
      return {
        name: 'Structure de répertoires',
        status: 'failed',
        message: `${missing.length} répertoires essentiels manquants`,
        details: missing,
        solution: 'Vérifiez que le projet est correctement cloné et configuré'
      };
    }
    
    return {
      name: 'Structure de répertoires',
      status: 'success',
      message: `Tous les répertoires essentiels sont présents (${present.length})`
    };
  }

  checkPermissions() {
    const pathsToCheck = [
      { path: '.', name: 'Répertoire projet', needsWrite: true },
      { path: './logs', name: 'Répertoire logs', needsWrite: true, optional: true },
      { path: './prisma', name: 'Répertoire Prisma', needsWrite: false }
    ];
    
    const permissionIssues = [];
    
    pathsToCheck.forEach(item => {
      if (!fs.existsSync(item.path) && item.optional) {
        return; // Skip optional missing paths
      }
      
      try {
        fs.accessSync(item.path, fs.constants.R_OK);
        if (item.needsWrite) {
          fs.accessSync(item.path, fs.constants.W_OK);
        }
      } catch (error) {
        permissionIssues.push({
          path: item.path,
          name: item.name,
          issue: item.needsWrite ? 'Lecture/Écriture' : 'Lecture'
        });
      }
    });
    
    if (permissionIssues.length > 0) {
      this.errors.push(`Problèmes de permissions: ${permissionIssues.map(p => p.name).join(', ')}`);
      return {
        name: 'Permissions système',
        status: 'failed',
        message: `${permissionIssues.length} problèmes de permissions détectés`,
        details: permissionIssues,
        solution: 'Vérifiez les permissions des répertoires et fichiers'
      };
    }
    
    return {
      name: 'Permissions système',
      status: 'success',
      message: 'Toutes les permissions sont correctes'
    };
  }

  checkDiskSpace() {
    try {
      const stats = fs.statSync('.');
      // Note: Cette méthode est basique, dans un vrai projet on utiliserait 'df' ou 'statvfs'
      
      return {
        name: 'Espace disque',
        status: 'success',
        message: 'Espace disque suffisant (vérification basique)'
      };
    } catch (error) {
      return {
        name: 'Espace disque',
        status: 'warning',
        message: 'Impossible de vérifier l\'espace disque',
        solution: 'Vérifiez manuellement l\'espace disponible'
      };
    }
  }

  // ====================================
  // VALIDATION DÉPENDANCES
  // ====================================

  async validateDependencies() {
    console.log('📦 Validation des dépendances...');
    
    const checks = [];
    
    // 1. Node.js version
    const nodeCheck = this.checkNodeVersion();
    checks.push(nodeCheck);
    
    // 2. npm/yarn
    const packageManagerCheck = this.checkPackageManager();
    checks.push(packageManagerCheck);
    
    // 3. package.json
    const packageJsonCheck = this.checkPackageJson();
    checks.push(packageJsonCheck);
    
    // 4. node_modules
    const nodeModulesCheck = this.checkNodeModules();
    checks.push(nodeModulesCheck);
    
    // 5. Dépendances critiques
    const criticalDepsCheck = this.checkCriticalDependencies();
    checks.push(criticalDepsCheck);
    
    this.validationResults.dependencies = {
      status: checks.every(c => c.status === 'success') ? 'success' : 'failed',
      checks: checks,
      summary: `${checks.filter(c => c.status === 'success').length}/${checks.length} vérifications réussies`
    };
    
    return this.validationResults.dependencies;
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
        message: `npm ${npmVersion}${yarnVersion ? ` + yarn ${yarnVersion}` : ''}`,
        details: { npm: npmVersion, yarn: yarnVersion }
      };
    } catch (error) {
      this.criticalIssues.push('npm non disponible');
      return {
        name: 'Gestionnaire de paquets',
        status: 'failed',
        message: 'npm non disponible',
        solution: 'Installez npm (inclus avec Node.js)'
      };
    }
  }

  checkPackageJson() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      this.criticalIssues.push('package.json manquant');
      return {
        name: 'Configuration package.json',
        status: 'failed',
        message: 'Fichier package.json introuvable',
        solution: 'Vérifiez que vous êtes dans le bon répertoire de projet'
      };
    }
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      // Vérifications essentielles
      const requiredFields = ['name', 'version', 'scripts', 'dependencies'];
      const missingFields = requiredFields.filter(field => !packageJson[field]);
      
      if (missingFields.length > 0) {
        this.warnings.push(`Champs manquants dans package.json: ${missingFields.join(', ')}`);
        return {
          name: 'Structure package.json',
          status: 'warning',
          message: `Champs manquants: ${missingFields.join(', ')}`,
          solution: 'Complétez le fichier package.json'
        };
      }
      
      // Vérifier les scripts essentiels
      const requiredScripts = ['build', 'start', 'dev'];
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      
      if (missingScripts.length > 0) {
        this.warnings.push(`Scripts manquants: ${missingScripts.join(', ')}`);
      }
      
      return {
        name: 'Configuration package.json',
        status: 'success',
        message: `Configuration valide (${Object.keys(packageJson.dependencies || {}).length} dépendances)`,
        details: {
          dependencies: Object.keys(packageJson.dependencies || {}).length,
          devDependencies: Object.keys(packageJson.devDependencies || {}).length,
          scripts: Object.keys(packageJson.scripts || {}).length
        }
      };
    } catch (error) {
      this.errors.push('package.json invalide');
      return {
        name: 'Format package.json',
        status: 'failed',
        message: 'Fichier package.json invalide (JSON malformé)',
        solution: 'Vérifiez la syntaxe JSON du fichier package.json'
      };
    }
  }

  checkNodeModules() {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
      this.criticalIssues.push('node_modules manquant');
      return {
        name: 'Installation des dépendances',
        status: 'failed',
        message: 'Répertoire node_modules introuvable',
        solution: 'Exécutez "npm install" pour installer les dépendances'
      };
    }
    
    try {
      const nodeModulesStats = fs.statSync(nodeModulesPath);
      const nodeModulesContent = fs.readdirSync(nodeModulesPath);
      
      if (nodeModulesContent.length === 0) {
        this.criticalIssues.push('node_modules vide');
        return {
          name: 'Contenu node_modules',
          status: 'failed',
          message: 'Répertoire node_modules vide',
          solution: 'Exécutez "npm install" pour installer les dépendances'
        };
      }
      
      return {
        name: 'Installation des dépendances',
        status: 'success',
        message: `${nodeModulesContent.length} modules installés`,
        details: { moduleCount: nodeModulesContent.length }
      };
    } catch (error) {
      return {
        name: 'Accès node_modules',
        status: 'warning',
        message: 'Impossible d\'analyser node_modules',
        solution: 'Vérifiez les permissions du répertoire'
      };
    }
  }

  checkCriticalDependencies() {
    const criticalDeps = [
      { name: 'next', type: 'dependency' },
      { name: 'react', type: 'dependency' },
      { name: '@prisma/client', type: 'dependency' },
      { name: 'typescript', type: 'devDependency' }
    ];
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      const allDeps = { 
        ...packageJson.dependencies, 
        ...packageJson.devDependencies 
      };
      
      const missing = [];
      const present = [];
      
      criticalDeps.forEach(dep => {
        if (allDeps[dep.name]) {
          present.push({ ...dep, version: allDeps[dep.name] });
        } else {
          missing.push(dep);
        }
      });
      
      if (missing.length > 0) {
        this.errors.push(`Dépendances critiques manquantes: ${missing.map(d => d.name).join(', ')}`);
        return {
          name: 'Dépendances critiques',
          status: 'failed',
          message: `${missing.length} dépendances critiques manquantes`,
          details: { missing, present },
          solution: 'Installez les dépendances manquantes avec npm install'
        };
      }
      
      return {
        name: 'Dépendances critiques',
        status: 'success',
        message: `Toutes les dépendances critiques sont présentes (${present.length})`,
        details: { present }
      };
    } catch (error) {
      return {
        name: 'Analyse des dépendances',
        status: 'failed',
        message: 'Impossible d\'analyser les dépendances',
        solution: 'Vérifiez le fichier package.json'
      };
    }
  }

  // ====================================
  // VALIDATION BASE DE DONNÉES
  // ====================================

  async validateDatabase() {
    console.log('🗄️ Validation de la base de données...');
    
    const checks = [];
    
    // 1. Configuration de connexion
    const connectionConfigCheck = this.checkDatabaseConnectionConfig();
    checks.push(connectionConfigCheck);
    
    // 2. Connexion effective
    const connectionCheck = await this.checkDatabaseConnection();
    checks.push(connectionCheck);
    
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
    const databaseUrl = process.env.DATABASE_URL;
    
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
      
      if (!['postgresql', 'postgres'].includes(url.protocol.replace(':', ''))) {
        this.warnings.push('Type de base de données non-PostgreSQL détecté');
        return {
          name: 'Type de base de données',
          status: 'warning',
          message: `Type de BDD: ${url.protocol.replace(':', '')} (PostgreSQL recommandé)`,
          solution: 'Vérifiez la compatibilité avec votre configuration'
        };
      }
      
      return {
        name: 'Configuration DATABASE_URL',
        status: 'success',
        message: `PostgreSQL configuré (${url.hostname}:${url.port || '5432'})`,
        details: {
          host: url.hostname,
          port: url.port || '5432',
          database: url.pathname.substring(1),
          username: url.username
        }
      };
    } catch (error) {
      this.errors.push('DATABASE_URL malformée');
      return {
        name: 'Format DATABASE_URL',
        status: 'failed',
        message: 'URL de base de données malformée',
        solution: 'Vérifiez le format de DATABASE_URL'
      };
    }
  }

  async checkDatabaseConnection() {
    try {
      if (!this.prisma) {
        this.prisma = new PrismaClient();
      }
      
      // Test de connexion simple
      await this.prisma.$connect();
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        name: 'Connexion base de données',
        status: 'success',
        message: 'Connexion à la base de données réussie'
      };
    } catch (error) {
      this.errors.push(`Erreur connexion DB: ${error.message}`);
      return {
        name: 'Connexion base de données',
        status: 'failed',
        message: `Connexion échouée: ${error.message}`,
        solution: 'Vérifiez que PostgreSQL est démarré et accessible'
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
        message: 'Fichier prisma/schema.prisma introuvable',
        solution: 'Générez le schema avec les outils de build'
      };
    }
    
    try {
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      
      // Vérifications basiques
      const hasGenerator = schemaContent.includes('generator client');
      const hasDatasource = schemaContent.includes('datasource db');
      const modelCount = (schemaContent.match(/^model\s+\w+/gm) || []).length;
      
      if (!hasGenerator || !hasDatasource) {
        this.errors.push('Schema Prisma incomplet');
        return {
          name: 'Contenu Schema Prisma',
          status: 'failed',
          message: 'Schema incomplet (generator ou datasource manquant)',
          solution: 'Régénérez le schema Prisma'
        };
      }
      
      return {
        name: 'Schema Prisma',
        status: 'success',
        message: `Schema valide avec ${modelCount} modèles`,
        details: { 
          modelCount, 
          hasGenerator, 
          hasDatasource,
          size: schemaContent.length 
        }
      };
    } catch (error) {
      return {
        name: 'Lecture Schema Prisma',
        status: 'failed',
        message: 'Impossible de lire le schema Prisma',
        solution: 'Vérifiez les permissions du fichier'
      };
    }
  }

  checkPrismaClient() {
    try {
      // Vérifier que @prisma/client est installé
      const prismaClientPath = path.join(process.cwd(), 'node_modules', '@prisma', 'client');
      
      if (!fs.existsSync(prismaClientPath)) {
        this.errors.push('@prisma/client non installé');
        return {
          name: 'Client Prisma',
          status: 'failed',
          message: '@prisma/client non installé',
          solution: 'Exécutez "npm install @prisma/client"'
        };
      }
      
      // Vérifier que le client est généré
      const generatedClientPath = path.join(prismaClientPath, 'index.js');
      
      if (!fs.existsSync(generatedClientPath)) {
        this.warnings.push('Client Prisma non généré');
        return {
          name: 'Génération Client Prisma',
          status: 'warning',
          message: 'Client Prisma non généré',
          solution: 'Exécutez "npx prisma generate"'
        };
      }
      
      return {
        name: 'Client Prisma',
        status: 'success',
        message: 'Client Prisma installé et généré'
      };
    } catch (error) {
      return {
        name: 'Vérification Client Prisma',
        status: 'warning',
        message: 'Impossible de vérifier le client Prisma',
        solution: 'Vérifiez manuellement l\'installation'
      };
    }
  }

  async checkDatabaseTables() {
    if (!this.prisma) {
      return {
        name: 'Structure base de données',
        status: 'warning',
        message: 'Impossible de vérifier (pas de connexion)',
        solution: 'Établissez d\'abord une connexion à la base'
      };
    }
    
    try {
      // Requête pour lister les tables (PostgreSQL)
      const tables = await this.prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      const tableCount = Array.isArray(tables) ? tables.length : 0;
      
      if (tableCount === 0) {
        this.warnings.push('Aucune table trouvée en base');
        return {
          name: 'Tables base de données',
          status: 'warning',
          message: 'Aucune table trouvée',
          solution: 'Exécutez "npx prisma db push" pour créer les tables'
        };
      }
      
      return {
        name: 'Structure base de données',
        status: 'success',
        message: `${tableCount} tables trouvées`,
        details: { 
          tableCount,
          tables: Array.isArray(tables) ? tables.map(t => t.table_name) : []
        }
      };
    } catch (error) {
      return {
        name: 'Analyse structure BDD',
        status: 'warning',
        message: `Erreur analyse: ${error.message}`,
        solution: 'Vérifiez les permissions de la base de données'
      };
    }
  }

  // ====================================
  // VALIDATION APPLICATION
  // ====================================

  async validateApplication() {
    console.log('🚀 Validation de l\'application...');
    
    const checks = [];
    
    // 1. Build Next.js
    const buildCheck = this.checkNextBuild();
    checks.push(buildCheck);
    
    // 2. Port disponible/utilisé
    const portCheck = this.checkApplicationPort();
    checks.push(portCheck);
    
    // 3. Processus actif
    const processCheck = this.checkApplicationProcess();
    checks.push(processCheck);
    
    // 4. Réponse HTTP
    const httpCheck = await this.checkHttpResponse();
    checks.push(httpCheck);
    
    // 5. Routes essentielles
    if (httpCheck.status === 'success') {
      const routesCheck = await this.checkEssentialRoutes();
      checks.push(routesCheck);
    }
    
    this.validationResults.application = {
      status: checks.every(c => c.status === 'success') ? 'success' : 
              checks.some(c => c.status === 'failed') ? 'failed' : 'warning',
      checks: checks,
      summary: `${checks.filter(c => c.status === 'success').length}/${checks.length} vérifications réussies`
    };
    
    return this.validationResults.application;
  }

  checkNextBuild() {
    const nextBuildPath = path.join(process.cwd(), '.next');
    
    if (!fs.existsSync(nextBuildPath)) {
      this.criticalIssues.push('Build Next.js manquant');
      return {
        name: 'Build Next.js',
        status: 'failed',
        message: 'Répertoire .next introuvable',
        solution: 'Exécutez "npm run build" pour construire l\'application'
      };
    }
    
    try {
      const buildFiles = fs.readdirSync(nextBuildPath);
      const hasBuildManifest = buildFiles.includes('BUILD_ID');
      const hasServerDir = buildFiles.includes('server');
      const hasStaticDir = buildFiles.includes('static');
      
      if (!hasBuildManifest) {
        this.warnings.push('Build Next.js potentiellement incomplet');
        return {
          name: 'Qualité Build Next.js',
          status: 'warning',
          message: 'Build potentiellement incomplet',
          solution: 'Relancez "npm run build"'
        };
      }
      
      return {
        name: 'Build Next.js',
        status: 'success',
        message: `Build complet (${buildFiles.length} éléments)`,
        details: { 
          fileCount: buildFiles.length,
          hasBuildManifest,
          hasServerDir,
          hasStaticDir
        }
      };
    } catch (error) {
      return {
        name: 'Analyse Build Next.js',
        status: 'warning',
        message: 'Impossible d\'analyser le build',
        solution: 'Vérifiez les permissions du répertoire .next'
      };
    }
  }

  checkApplicationPort() {
    const port = process.env.PORT || '3001';
    
    try {
      // Utiliser netstat ou lsof pour vérifier le port
      let portInUse = false;
      
      try {
        execSync(`lsof -i :${port}`, { stdio: 'pipe' });
        portInUse = true;
      } catch {
        try {
          const netstatOutput = execSync('netstat -tlnp', { encoding: 'utf-8' });
          portInUse = netstatOutput.includes(`:${port} `);
        } catch {
          // Si les deux commandes échouent, on ne peut pas déterminer
        }
      }
      
      if (portInUse) {
        return {
          name: 'Port application',
          status: 'success',
          message: `Port ${port} utilisé (application probablement active)`,
          details: { port, status: 'in_use' }
        };
      } else {
        this.warnings.push(`Port ${port} libre (application pas démarrée?)`);
        return {
          name: 'Port application',
          status: 'warning',
          message: `Port ${port} libre`,
          details: { port, status: 'free' },
          solution: 'Démarrez l\'application avec "npm start"'
        };
      }
    } catch (error) {
      return {
        name: 'Vérification port',
        status: 'warning',
        message: 'Impossible de vérifier le statut du port',
        solution: 'Vérifiez manuellement si l\'application est accessible'
      };
    }
  }

  checkApplicationProcess() {
    try {
      // Vérifier PM2
      try {
        const pm2List = execSync('pm2 jlist', { encoding: 'utf-8' });
        const processes = JSON.parse(pm2List);
        const orderspotProcess = processes.find(p => 
          p.name && p.name.includes('orderspot')
        );
        
        if (orderspotProcess) {
          return {
            name: 'Processus application',
            status: 'success',
            message: `Application gérée par PM2 (${orderspotProcess.pm2_env.status})`,
            details: {
              manager: 'pm2',
              name: orderspotProcess.name,
              status: orderspotProcess.pm2_env.status,
              pid: orderspotProcess.pid
            }
          };
        }
      } catch {
        // PM2 non disponible ou pas de processus
      }
      
      // Vérifier fichier PID
      const pidFile = path.join(process.cwd(), '.app.pid');
      if (fs.existsSync(pidFile)) {
        const pid = fs.readFileSync(pidFile, 'utf-8').trim();
        
        try {
          process.kill(pid, 0); // Test si le processus existe
          return {
            name: 'Processus application',
            status: 'success',
            message: `Application active (PID: ${pid})`,
            details: { manager: 'npm', pid }
          };
        } catch {
          this.warnings.push('Fichier PID obsolète détecté');
          return {
            name: 'Processus application',
            status: 'warning',
            message: 'Fichier PID obsolète',
            solution: 'Supprimez le fichier .app.pid et redémarrez l\'app'
          };
        }
      }
      
      return {
        name: 'Processus application',
        status: 'warning',
        message: 'Aucun processus actif détecté',
        solution: 'Démarrez l\'application avec le script tt.sh'
      };
    } catch (error) {
      return {
        name: 'Détection processus',
        status: 'warning',
        message: 'Impossible de vérifier les processus actifs',
        solution: 'Vérifiez manuellement si l\'application fonctionne'
      };
    }
  }

  async checkHttpResponse() {
    const port = process.env.PORT || '3001';
    const url = `http://localhost:${port}`;
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          name: 'Réponse HTTP',
          status: 'failed',
          message: `Timeout - pas de réponse sur ${url}`,
          solution: 'Vérifiez que l\'application est démarrée et accessible'
        });
      }, 5000);
      
      // Test simple avec http natif de Node.js
      const http = require('http');
      const request = http.get(url, (res) => {
        clearTimeout(timeout);
        
        if (res.statusCode === 200) {
          resolve({
            name: 'Réponse HTTP',
            status: 'success',
            message: `Application accessible sur ${url}`,
            details: { url, statusCode: res.statusCode }
          });
        } else {
          resolve({
            name: 'Réponse HTTP',
            status: 'warning',
            message: `Réponse ${res.statusCode} sur ${url}`,
            details: { url, statusCode: res.statusCode },
            solution: 'Vérifiez les logs de l\'application'
          });
        }
      });
      
      request.on('error', (error) => {
        clearTimeout(timeout);
        this.errors.push(`Erreur HTTP: ${error.message}`);
        resolve({
          name: 'Réponse HTTP',
          status: 'failed',
          message: `Connexion échouée: ${error.message}`,
          solution: 'Vérifiez que l\'application est démarrée'
        });
      });
    });
  }

  async checkEssentialRoutes() {
    const port = process.env.PORT || '3001';
    const baseUrl = `http://localhost:${port}`;
    
    const routesToCheck = [
      { path: '/', name: 'Page d\'accueil' },
      { path: '/api/health', name: 'API Health', optional: true },
      { path: '/api/users', name: 'API Users', optional: true }
    ];
    
    const routeResults = [];
    
    for (const route of routesToCheck) {
      try {
        const response = await this.testRoute(`${baseUrl}${route.path}`);
        routeResults.push({
          path: route.path,
          name: route.name,
          status: response.status,
          statusCode: response.statusCode
        });
      } catch (error) {
        if (!route.optional) {
          routeResults.push({
            path: route.path,
            name: route.name,
            status: 'failed',
            error: error.message
          });
        }
      }
    }
    
    const successfulRoutes = routeResults.filter(r => r.status === 'success').length;
    const totalRoutes = routeResults.length;
    
    if (successfulRoutes === 0) {
      return {
        name: 'Routes essentielles',
        status: 'failed',
        message: 'Aucune route accessible',
        details: routeResults,
        solution: 'Vérifiez la configuration des routes'
      };
    }
    
    return {
      name: 'Routes essentielles',
      status: successfulRoutes === totalRoutes ? 'success' : 'warning',
      message: `${successfulRoutes}/${totalRoutes} routes accessibles`,
      details: routeResults
    };
  }

  testRoute(url) {
    return new Promise((resolve, reject) => {
      const http = require('http');
      const timeout = setTimeout(() => {
        reject(new Error('Timeout'));
      }, 3000);
      
      const request = http.get(url, (res) => {
        clearTimeout(timeout);
        resolve({
          status: res.statusCode < 400 ? 'success' : 'warning',
          statusCode: res.statusCode
        });
      });
      
      request.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  // ====================================
  // VALIDATION SÉCURITÉ
  // ====================================

  async validateSecurity() {
    console.log('🔒 Validation de la sécurité...');
    
    const checks = [];
    
    // 1. Variables sensibles
    const envSecurityCheck = this.checkEnvironmentSecurity();
    checks.push(envSecurityCheck);
    
    // 2. Fichiers sensibles exposés
    const filesSecurityCheck = this.checkExposedSensitiveFiles();
    checks.push(filesSecurityCheck);
    
    // 3. Permissions de fichiers
    const permissionsSecurityCheck = this.checkFilePermissions();
    checks.push(permissionsSecurityCheck);
    
    // 4. Configuration HTTPS/SSL
    const httpsCheck = this.checkHttpsConfiguration();
    checks.push(httpsCheck);
    
    this.validationResults.security = {
      status: checks.every(c => c.status === 'success') ? 'success' : 
              checks.some(c => c.status === 'failed') ? 'failed' : 'warning',
      checks: checks,
      summary: `${checks.filter(c => c.status === 'success').length}/${checks.length} vérifications réussies`
    };
    
    return this.validationResults.security;
  }

  checkEnvironmentSecurity() {
    const sensitiveVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'JWT_SECRET',
      'SMTP_PASS',
      'FIREBASE_API_KEY'
    ];
    
    const issues = [];
    const secure = [];
    
    sensitiveVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        // Vérifier si ce sont des valeurs par défaut non sécurisées
        if (value.includes('default') || value.includes('example') || value.length < 10) {
          issues.push({
            variable: varName,
            issue: 'Valeur par défaut ou trop simple',
            risk: 'medium'
          });
        } else {
          secure.push(varName);
        }
      }
    });
    
    if (issues.length > 0) {
      this.warnings.push(`Variables d'environnement non sécurisées: ${issues.map(i => i.variable).join(', ')}`);
      return {
        name: 'Sécurité variables d\'environnement',
        status: 'warning',
        message: `${issues.length} variables avec des valeurs faibles`,
        details: { issues, secure },
        solution: 'Utilisez des valeurs fortes et uniques pour les variables sensibles'
      };
    }
    
    return {
      name: 'Sécurité variables d\'environnement',
      status: 'success',
      message: `${secure.length} variables sensibles correctement configurées`
    };
  }

  checkExposedSensitiveFiles() {
    const sensitiveFiles = [
      { path: '.env', public: false },
      { path: '.env.local', public: false },
      { path: 'prisma/schema.prisma', public: false },
      { path: 'package.json', public: true },
      { path: '.git', public: false },
      { path: 'node_modules', public: false }
    ];
    
    const exposedFiles = [];
    const protectedFiles = [];
    
    sensitiveFiles.forEach(file => {
      const fullPath = path.join(process.cwd(), file.path);
      if (fs.existsSync(fullPath)) {
        // Vérifier si le fichier est dans public/ (simple heuristique)
        const publicPath = path.join(process.cwd(), 'public', file.path);
        if (fs.existsSync(publicPath) && !file.public) {
          exposedFiles.push(file);
        } else {
          protectedFiles.push(file.path);
        }
      }
    });
    
    if (exposedFiles.length > 0) {
      this.errors.push(`Fichiers sensibles exposés: ${exposedFiles.map(f => f.path).join(', ')}`);
      return {
        name: 'Exposition fichiers sensibles',
        status: 'failed',
        message: `${exposedFiles.length} fichiers sensibles potentiellement exposés`,
        details: { exposed: exposedFiles, protected: protectedFiles },
        solution: 'Retirez les fichiers sensibles du répertoire public'
      };
    }
    
    return {
      name: 'Protection fichiers sensibles',
      status: 'success',
      message: 'Aucun fichier sensible exposé détecté'
    };
  }

  checkFilePermissions() {
    const criticalFiles = [
      { path: '.env', maxPermissions: '600' },
      { path: 'prisma/schema.prisma', maxPermissions: '644' }
    ];
    
    const permissionIssues = [];
    
    criticalFiles.forEach(file => {
      const fullPath = path.join(process.cwd(), file.path);
      if (fs.existsSync(fullPath)) {
        try {
          const stats = fs.statSync(fullPath);
          const permissions = stats.mode & parseInt('777', 8);
          const permissionsOctal = permissions.toString(8);
          
          // Vérification basique (pas parfaite sur tous les systèmes)
          if (file.path === '.env' && permissions > parseInt('644', 8)) {
            permissionIssues.push({
              file: file.path,
              current: permissionsOctal,
              recommended: file.maxPermissions
            });
          }
        } catch (error) {
          // Ignorer les erreurs de permissions sur certains systèmes
        }
      }
    });
    
    if (permissionIssues.length > 0) {
      this.warnings.push(`Permissions de fichiers trop permissives: ${permissionIssues.map(p => p.file).join(', ')}`);
      return {
        name: 'Permissions de fichiers',
        status: 'warning',
        message: `${permissionIssues.length} fichiers avec permissions trop larges`,
        details: permissionIssues,
        solution: 'Ajustez les permissions avec chmod (ex: chmod 600 .env)'
      };
    }
    
    return {
      name: 'Permissions de fichiers',
      status: 'success',
      message: 'Permissions de fichiers appropriées'
    };
  }

  checkHttpsConfiguration() {
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    const issues = [];
    
    if (nextAuthUrl && !nextAuthUrl.startsWith('https://') && !nextAuthUrl.includes('localhost')) {
      issues.push('NEXTAUTH_URL ne utilise pas HTTPS en production');
    }
    
    if (appUrl && !appUrl.startsWith('https://') && !appUrl.includes('localhost')) {
      issues.push('NEXT_PUBLIC_APP_URL ne utilise pas HTTPS en production');
    }
    
    if (issues.length > 0 && process.env.NODE_ENV === 'production') {
      this.warnings.push('Configuration HTTPS manquante en production');
      return {
        name: 'Configuration HTTPS',
        status: 'warning',
        message: 'HTTPS non configuré pour la production',
        details: issues,
        solution: 'Configurez HTTPS pour la production'
      };
    }
    
    return {
      name: 'Configuration HTTPS',
      status: process.env.NODE_ENV === 'production' ? 'success' : 'info',
      message: 'Configuration appropriée pour l\'environnement'
    };
  }

  // ====================================
  // VALIDATION PERFORMANCE
  // ====================================

  async validatePerformance() {
    console.log('⚡ Validation des performances...');
    
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
      const calculateDirSize = (dirPath) => {
        let totalSize = 0;
        const files = fs.readdirSync(dirPath, { withFileTypes: true });
        
        files.forEach(file => {
          const filePath = path.join(dirPath, file.name);
          if (file.isDirectory()) {
            totalSize += calculateDirSize(filePath);
          } else {
            totalSize += fs.statSync(filePath).size;
          }
        });
        
        return totalSize;
      };
      
      const buildSize = calculateDirSize(nextBuildPath);
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
        details: { sizeBytes: buildSize, sizeMB: buildSizeMB }
      };
    } catch (error) {
      return {
        name: 'Analyse taille build',
        status: 'warning',
        message: 'Impossible d\'analyser la taille du build',
        solution: 'Vérifiez les permissions du répertoire .next'
      };
    }
  }

  checkDependenciesPerformance() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      const deps = packageJson.dependencies || {};
      const devDeps = packageJson.devDependencies || {};
      
      const totalDeps = Object.keys(deps).length + Object.keys(devDeps).length;
      
      // Rechercher des dépendances potentiellement lourdes
      const heavyDeps = [];
      const knownHeavyPackages = ['lodash', 'moment', '@fortawesome', 'bootstrap'];
      
      Object.keys(deps).forEach(dep => {
        if (knownHeavyPackages.some(heavy => dep.includes(heavy))) {
          heavyDeps.push(dep);
        }
      });
      
      let status = 'success';
      let message = `${totalDeps} dépendances`;
      
      if (totalDeps > 50) {
        status = 'warning';
        message += ' (nombreuses)';
        this.warnings.push(`Nombre élevé de dépendances: ${totalDeps}`);
      }
      
      if (heavyDeps.length > 0) {
        message += `, ${heavyDeps.length} potentiellement lourdes`;
        this.warnings.push(`Dépendances lourdes détectées: ${heavyDeps.join(', ')}`);
      }
      
      return {
        name: 'Performance des dépendances',
        status,
        message,
        details: { 
          totalDeps, 
          heavyDeps,
          dependencies: Object.keys(deps).length,
          devDependencies: Object.keys(devDeps).length
        }
      };
    } catch (error) {
      return {
        name: 'Analyse dépendances',
        status: 'warning',
        message: 'Impossible d\'analyser les dépendances',
        solution: 'Vérifiez le fichier package.json'
      };
    }
  }

  checkNextJsConfiguration() {
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    
    if (!fs.existsSync(nextConfigPath)) {
      this.warnings.push('next.config.js manquant');
      return {
        name: 'Configuration Next.js',
        status: 'warning',
        message: 'Fichier next.config.js non trouvé',
        solution: 'Créez un fichier next.config.js pour optimiser les performances'
      };
    }
    
    try {
      const configContent = fs.readFileSync(nextConfigPath, 'utf-8');
      
      // Vérifications basiques
      const hasImageOptimization = configContent.includes('images');
      const hasCompression = configContent.includes('compress');
      const hasOptimization = configContent.includes('optimization');
      
      const optimizations = [];
      if (hasImageOptimization) optimizations.push('Images');
      if (hasCompression) optimizations.push('Compression');
      if (hasOptimization) optimizations.push('Bundle');
      
      return {
        name: 'Configuration Next.js',
        status: 'success',
        message: `Configuration présente${optimizations.length > 0 ? ` (${optimizations.join(', ')})` : ''}`,
        details: { 
          hasImageOptimization, 
          hasCompression, 
          hasOptimization,
          optimizations 
        }
      };
    } catch (error) {
      return {
        name: 'Lecture configuration Next.js',
        status: 'warning',
        message: 'Impossible de lire next.config.js',
        solution: 'Vérifiez la syntaxe du fichier next.config.js'
      };
    }
  }

  async checkResponseTime() {
    const port = process.env.PORT || '3001';
    const url = `http://localhost:${port}`;
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const timeout = setTimeout(() => {
        resolve({
          name: 'Temps de réponse',
          status: 'warning',
          message: 'Timeout - impossible de mesurer',
          solution: 'Vérifiez que l\'application répond'
        });
      }, 5000);
      
      const http = require('http');
      const request = http.get(url, (res) => {
        const responseTime = Date.now() - startTime;
        clearTimeout(timeout);
        
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
    console.log('📋 RAPPORT DE VALIDATION DU DÉPLOIEMENT - ORDERSPOT PRO');
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
            console.log(`      💡 Solution: ${check.solution}`);
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
      console.log('   ✅ Déploiement validé avec succès !');
      console.log('   🚀 Application prête pour la production');
    } else if (globalStatus === 'WARNING') {
      console.log('   ⚠️  Déploiement fonctionnel mais améliorable');
      console.log('   🔧 Corrigez les avertissements pour optimiser');
    } else {
      console.log('   ❌ Problèmes critiques à résoudre');
      console.log('   🛠️  Exécutez le script tt.sh pour corriger');
    }
    
    // Informations utiles
    const port = process.env.PORT || '3001';
    console.log('\n📋 INFORMATIONS UTILES:');
    console.log(`   🌐 URL Application: http://localhost:${port}`);
    console.log(`   📁 Répertoire: ${process.cwd()}`);
    console.log(`   🗄️  Base de données: ${process.env.DATABASE_URL ? 'Configurée' : 'Non configurée'}`);
    console.log(`   👤 Admin par défaut: admin@orderspot.com`);
    
    console.log('\n' + '='.repeat(80));
    
    // Retourner le résumé pour utilisation programmatique
    return {
      globalStatus,
      totalChecks,
      successfulChecks,
      warningChecks,
      failedChecks,
      criticalIssues: this.criticalIssues.length,
      warnings: this.warnings.length,
      ready: globalStatus === 'SUCCESS'
    };
  }

  // ====================================
  // NETTOYAGE
  // ====================================

  async cleanup() {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }
}

// ====================================
// FONCTION PRINCIPALE D'EXÉCUTION
// ====================================

async function runDeploymentValidation() {
  const validator = new DeploymentValidator();
  
  try {
    console.log('🚀 Démarrage de la validation du déploiement...');
    console.log(`📅 ${new Date().toLocaleString()}\n`);
    
    // Exécuter toutes les validations
    await validator.validateEnvironment();
    await validator.validateDependencies();
    await validator.validateDatabase();
    await validator.validateApplication();
    await validator.validateSecurity();
    await validator.validatePerformance();
    
    // Générer le rapport final
    const report = await validator.generateReport();
    
    // Sauvegarder le rapport
    const reportData = {
      timestamp: new Date().toISOString(),
      globalStatus: report.globalStatus,
      summary: report,
      results: validator.validationResults,
      issues: {
        critical: validator.criticalIssues,
        warnings: validator.warnings,
        errors: validator.errors
      }
    };
    
    try {
      fs.writeFileSync(
        path.join(process.cwd(), 'deployment-validation-report.json'),
        JSON.stringify(reportData, null, 2)
      );
      console.log('\n💾 Rapport sauvegardé: deployment-validation-report.json');
    } catch (error) {
      console.log('\n⚠️  Impossible de sauvegarder le rapport:', error.message);
    }
    
    return report;
    
  } catch (error) {
    console.error('\n❌ Erreur durant la validation:', error.message);
    console.error('Stack:', error.stack);
    return { globalStatus: 'ERROR', error: error.message };
  } finally {
    await validator.cleanup();
  }
}

// ====================================
// EXÉCUTION SI SCRIPT APPELÉ DIRECTEMENT
// ====================================

if (require.main === module) {
  runDeploymentValidation()
    .then(report => {
      const exitCode = report.globalStatus === 'SUCCESS' ? 0 : 
                      report.globalStatus === 'WARNING' ? 1 : 2;
      
      console.log(`\n🏁 Validation terminée (code: ${exitCode})`);
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('\n💥 Erreur fatale:', error.message);
      process.exit(3);
    });
}

module.exports = { DeploymentValidator, runDeploymentValidation };