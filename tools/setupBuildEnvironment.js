const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏗️ Configuration ENTERPRISE - Structure robuste...');

// ====================================
// CONFIGURATION STRUCTURE ENTERPRISE
// ====================================

function setupDirectoryStructure() {
  console.log('📁 Création structure enterprise...');
  
  const directories = [
    './src-template',           // Source Firebase (tracké par Git)
    './src',                   // Environnement de build (ignoré par Git)
    './src/generated',         // Code généré automatiquement
    './src/business',          // Logique métier
    './src/custom',           // Customisations utilisateur
    './backups',              // Sauvegardes automatiques
    './build-logs'            // Logs de build
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  ✅ ${dir}/`);
    } else {
      console.log(`  ⏭️  ${dir}/ (existe déjà)`);
    }
  });
}

function updateGitignore() {
  console.log('📝 Configuration .gitignore enterprise...');
  
  const gitignoreContent = `
# ====================================
# ENTERPRISE BUILD CONFIGURATION
# ====================================

# Environnement de build (généré automatiquement)
/src/
!src-template/

# Code généré
/src/generated/
*.generated.ts
*.generated.tsx
*.generated.js

# Sauvegardes automatiques
/backups/
*.backup
*.bak

# Logs de build
/build-logs/
build-*.log

# Environnement Prisma
/prisma/migrations/
.env.local
.env.production

# Next.js build
/.next/
/out/
/.vercel

# Dependencies
/node_modules/
/.pnp
.pnp.js

# Testing
/coverage/
*.tsbuildinfo

# Misc
.DS_Store
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDEs
.vscode/
.idea/
*.swp
*.swo

# Temporary files
/tmp/
*.tmp
*.temp
`;

  const gitignorePath = './.gitignore';
  
  if (fs.existsSync(gitignorePath)) {
    const existingContent = fs.readFileSync(gitignorePath, 'utf-8');
    if (!existingContent.includes('ENTERPRISE BUILD CONFIGURATION')) {
      fs.appendFileSync(gitignorePath, gitignoreContent);
      console.log('  ✅ .gitignore mis à jour');
    } else {
      console.log('  ⏭️  .gitignore déjà configuré');
    }
  } else {
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('  ✅ .gitignore créé');
  }
}

function createBuildEnvironmentSetup() {
  console.log('🔧 Création script setup environnement...');
  
  const setupScript = `const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Setup environnement de build...');

function setupBuildEnvironment() {
  // Vérifier si /src existe et a du contenu
  const srcExists = fs.existsSync('./src');
  const srcEmpty = !srcExists || fs.readdirSync('./src').length === 0;
  
  if (srcEmpty) {
    console.log('📁 Initialisation environnement depuis template...');
    
    // Créer /src si nécessaire
    if (!fs.existsSync('./src')) {
      fs.mkdirSync('./src', { recursive: true });
    }
    
    // Copier src-template → src
    try {
      execSync('cp -r ./src-template/* ./src/ 2>/dev/null || xcopy .\\\\src-template\\\\* .\\\\src\\\\ /E /I /Q', { stdio: 'pipe' });
      console.log('✅ Template copié vers environnement de build');
    } catch (error) {
      console.log('⚠️  Copie manuelle nécessaire: src-template → src');
    }
  } else {
    console.log('⏭️  Environnement de build existe déjà');
  }
  
  // Synchroniser les NOUVEAUX fichiers uniquement
  synchronizeNewFiles();
}

function synchronizeNewFiles() {
  console.log('🔄 Synchronisation des nouveaux fichiers...');
  
  const templateDir = './src-template';
  const buildDir = './src';
  
  if (!fs.existsSync(templateDir)) {
    console.log('⏭️  Pas de template à synchroniser');
    return;
  }
  
  syncDirectory(templateDir, buildDir);
}

function syncDirectory(templateDir, buildDir) {
  const templateFiles = fs.readdirSync(templateDir, { withFileTypes: true });
  
  templateFiles.forEach(entry => {
    const templatePath = path.join(templateDir, entry.name);
    const buildPath = path.join(buildDir, entry.name);
    
    if (entry.isDirectory()) {
      if (!fs.existsSync(buildPath)) {
        fs.mkdirSync(buildPath, { recursive: true });
      }
      syncDirectory(templatePath, buildPath);
    } else if (entry.isFile()) {
      // Copier SEULEMENT si le fichier n'existe PAS dans build
      if (!fs.existsSync(buildPath)) {
        fs.copyFileSync(templatePath, buildPath);
        console.log(\`  ✅ Nouveau: \${entry.name}\`);
      } else {
        // Fichier existe déjà = customisé, ne pas toucher
        console.log(\`  🔒 Préservé: \${entry.name}\`);
      }
    }
  });
}

// Exécution
setupBuildEnvironment();

module.exports = { setupBuildEnvironment, synchronizeNewFiles };`;

  fs.writeFileSync('./tools/setupBuildEnvironment.js', setupScript);
  console.log('  ✅ tools/setupBuildEnvironment.js créé');
}

function createCleanupScript() {
  console.log('🧹 Création script de nettoyage...');
  
  const cleanupScript = `const fs = require('fs');
const path = require('path');

console.log('🧹 Nettoyage environnement de build...');

const command = process.argv[2] || 'help';

switch (command) {
  case 'reset':
    // Supprimer /src complètement
    if (fs.existsSync('./src')) {
      fs.rmSync('./src', { recursive: true, force: true });
      console.log('✅ Environnement de build supprimé');
    }
    break;
    
  case 'generated':
    // Supprimer seulement le code généré
    if (fs.existsSync('./src/generated')) {
      fs.rmSync('./src/generated', { recursive: true, force: true });
      console.log('✅ Code généré supprimé');
    }
    break;
    
  case 'backup':
    // Créer une sauvegarde
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = \`./backups/backup-\${timestamp}\`;
    
    if (fs.existsSync('./src')) {
      fs.mkdirSync(backupDir, { recursive: true });
      require('child_process').execSync(\`cp -r ./src/* \${backupDir}/\`);
      console.log(\`✅ Sauvegarde créée: \${backupDir}\`);
    }
    break;
    
  default:
    console.log(\`
🧹 Script de nettoyage - Utilisation:

node tools/cleanup.js reset     - Supprimer tout l'environnement de build
node tools/cleanup.js generated - Supprimer seulement le code généré  
node tools/cleanup.js backup    - Créer une sauvegarde complète

⚠️  ATTENTION: Ces opérations sont irréversibles !
    \`);
}`;

  fs.writeFileSync('./tools/cleanup.js', cleanupScript);
  console.log('  ✅ tools/cleanup.js créé');
}

function createDeploymentStrategy() {
  console.log('🚀 Création stratégie de déploiement...');
  
  const deployScript = `const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Déploiement ENTERPRISE...');

const environment = process.env.NODE_ENV || process.argv[2] || 'development';

function deployForEnvironment(env) {
  console.log(\`📦 Déploiement pour: \${env}\`);
  
  switch (env) {
    case 'development':
      // DEV: Utiliser /src (avec customisations)
      console.log('🔧 Mode DEV: Environnement complet avec customisations');
      process.env.BUILD_SOURCE = './src';
      break;
      
    case 'staging':
      // STAGING: Environnement hybride
      console.log('🔄 Mode STAGING: Test avec customisations');
      process.env.BUILD_SOURCE = './src';
      break;
      
    case 'production':
      // PROD: Décision basée sur la stratégie
      if (process.env.PROD_STRATEGY === 'template-only') {
        console.log('🏭 Mode PROD: Template pur (sans customisations)');
        process.env.BUILD_SOURCE = './src-template';
      } else {
        console.log('🏭 Mode PROD: Environnement complet');
        process.env.BUILD_SOURCE = './src';
      }
      break;
  }
  
  // Build avec la source appropriée
  const buildCommand = \`npm run build -- --source=\${process.env.BUILD_SOURCE}\`;
  console.log(\`Commande: \${buildCommand}\`);
  
  try {
    execSync(buildCommand, { stdio: 'inherit' });
    console.log(\`✅ Déploiement \${env} réussi\`);
  } catch (error) {
    console.error(\`❌ Erreur déploiement \${env}:\`, error.message);
    process.exit(1);
  }
}

deployForEnvironment(environment);`;

  fs.writeFileSync('./tools/deploy.js', deployScript);
  console.log('  ✅ tools/deploy.js créé');
}

function createConflictResolver() {
  console.log('⚔️ Création résolveur de conflits...');
  
  const conflictScript = `const fs = require('fs');
const path = require('path');

console.log('⚔️ Résolution des conflits Firebase...');

class ConflictResolver {
  constructor() {
    this.conflictLog = './build-logs/conflicts.json';
    this.conflicts = this.loadConflicts();
  }
  
  loadConflicts() {
    if (fs.existsSync(this.conflictLog)) {
      return JSON.parse(fs.readFileSync(this.conflictLog, 'utf-8'));
    }
    return { resolved: [], pending: [] };
  }
  
  saveConflicts() {
    fs.writeFileSync(this.conflictLog, JSON.stringify(this.conflicts, null, 2));
  }
  
  detectDeletedModel(modelName) {
    const templatePath = \`./src-template/lib/types.ts\`;
    const buildPath = \`./src/lib/types.ts\`;
    
    if (!fs.existsSync(templatePath)) return false;
    
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const buildContent = fs.readFileSync(buildPath, 'utf-8');
    
    const templateHasModel = templateContent.includes(\`interface \${modelName}\`);
    const buildHasModel = buildContent.includes(\`interface \${modelName}\`);
    
    if (!templateHasModel && buildHasModel) {
      console.log(\`⚠️  Conflit détecté: Modèle '\${modelName}' supprimé de Firebase mais customisé localement\`);
      
      this.conflicts.pending.push({
        type: 'deleted_model',
        model: modelName,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });
      
      return true;
    }
    
    return false;
  }
  
  detectRenamedField(modelName, oldField, newField) {
    console.log(\`⚠️  Conflit détecté: Champ '\${oldField}' renommé en '\${newField}' dans modèle '\${modelName}'\`);
    
    this.conflicts.pending.push({
      type: 'renamed_field',
      model: modelName,
      oldField: oldField,
      newField: newField,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });
    
    // Auto-résolution simple
    this.autoResolveFieldRename(modelName, oldField, newField);
  }
  
  autoResolveFieldRename(modelName, oldField, newField) {
    console.log(\`🔧 Auto-résolution: \${oldField} → \${newField}\`);
    
    // Rechercher et remplacer dans tous les fichiers customisés
    const customFiles = this.findCustomFiles();
    
    customFiles.forEach(filePath => {
      let content = fs.readFileSync(filePath, 'utf-8');
      const oldPattern = new RegExp(\`\\\\b\${oldField}\\\\b\`, 'g');
      
      if (oldPattern.test(content)) {
        content = content.replace(oldPattern, newField);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(\`  ✅ Mis à jour: \${filePath}\`);
      }
    });
    
    // Marquer comme résolu
    const conflict = this.conflicts.pending.find(c => c.oldField === oldField);
    if (conflict) {
      conflict.status = 'resolved';
      this.conflicts.resolved.push(conflict);
      this.conflicts.pending = this.conflicts.pending.filter(c => c !== conflict);
    }
  }
  
  findCustomFiles() {
    const customFiles = [];
    
    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && entry.name !== 'generated') {
          scanDir(fullPath);
        } else if (entry.isFile() && /\\.(ts|tsx)$/.test(entry.name)) {
          customFiles.push(fullPath);
        }
      });
    };
    
    scanDir('./src');
    return customFiles;
  }
  
  generateReport() {
    console.log(\`
📊 Rapport des conflits:
   - Résolus: \${this.conflicts.resolved.length}
   - En attente: \${this.conflicts.pending.length}
    \`);
    
    if (this.conflicts.pending.length > 0) {
      console.log('⚠️  Conflits en attente:');
      this.conflicts.pending.forEach(conflict => {
        console.log(\`   - \${conflict.type}: \${conflict.model || 'N/A'}\`);
      });
    }
  }
}

const resolver = new ConflictResolver();
resolver.generateReport();

module.exports = ConflictResolver;`;

  fs.writeFileSync('./tools/conflictResolver.js', conflictScript);
  console.log('  ✅ tools/conflictResolver.js créé');
}

// ====================================
// EXÉCUTION CONFIGURATION ENTERPRISE
// ====================================

try {
  console.log('🚀 Configuration ENTERPRISE en cours...\n');
  
  setupDirectoryStructure();
  updateGitignore();
  createBuildEnvironmentSetup();
  createCleanupScript();
  createDeploymentStrategy();
  createConflictResolver();
  
  console.log('\n✅ Configuration ENTERPRISE terminée !');
  console.log(`
📋 Scripts créés:
   - tools/setupBuildEnvironment.js  (Setup automatique)
   - tools/cleanup.js                 (Nettoyage)
   - tools/deploy.js                  (Déploiement)
   - tools/conflictResolver.js        (Résolution conflits)

🏗️ Structure:
   - /src-template/  (Source Firebase - tracké Git)
   - /src/          (Environnement build - ignoré Git)
   - /backups/      (Sauvegardes automatiques)
   - /build-logs/   (Logs détaillés)

🚀 Prochaine étape: Modifier build-server.js pour utiliser setupBuildEnvironment.js
  `);
  
} catch (error) {
  console.error('❌ Erreur configuration enterprise:', error.message);
  process.exit(1);
}