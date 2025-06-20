const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 DÉMARRAGE - Génération SYSTÈME COMPLET 100% DYNAMIQUE');

// ====================================
// VALIDATION PRÉALABLE
// ====================================

function validateSourceFiles() {
  console.log('🔍 Validation des fichiers source...');
  
  const requiredFiles = [
    { path: 'src/lib/types.ts', description: 'Interfaces TypeScript' },
    { path: 'src/lib/data.ts', description: 'Données de test' }
  ];
  
  let allValid = true;
  
  requiredFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file.path);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Fichier manquant: ${file.path} (${file.description})`);
      allValid = false;
    } else {
      console.log(`✅ ${file.path}`);
    }
  });
  
  if (!allValid) {
    console.error('❌ Fichiers source manquants - Arrêt du processus');
    process.exit(1);
  }
  
  console.log('✅ Tous les fichiers source sont présents');
}

function runScript(scriptName, description) {
  console.log(`\n🔧 ${description}...`);
  
  const scriptPath = path.join(__dirname, scriptName);
  
  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ Script manquant: ${scriptName}`);
    process.exit(1);
  }
  
  try {
    execSync(`node ${scriptPath}`, { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log(`✅ ${description} terminé`);
  } catch (error) {
    console.error(`❌ Erreur pendant : ${description}`);
    console.error(`Script: ${scriptName}`);
    console.error(`Erreur: ${error.message}`);
    process.exit(1);
  }
}

function createMissingDirectories() {
  console.log('📁 Création des répertoires nécessaires...');
  
  const directories = [
    'prisma',
    'src/app/api',
    'src/context',
    'src/hooks',
    'src/lib'
  ];
  
  directories.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`  📁 Créé: ${dir}`);
    }
  });
}

function setupEnvironmentVariables() {
  console.log('🔧 Configuration des variables d\'environnement...');
  
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  let envContent = '';
  
  // Lire .env.example s'il existe
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf-8');
  }
  
  // Ajouter DATABASE_URL si pas présent
  if (!envContent.includes('DATABASE_URL')) {
    envContent += '\n# Base de données PostgreSQL\n';
    envContent += 'DATABASE_URL="postgresql://orderspot_user:orderspot_pass@orderspot_postgres:5432/orderspot_db?schema=public"\n';
  }
  
  // Ajouter NEXTAUTH_SECRET si pas présent
  if (!envContent.includes('NEXTAUTH_SECRET')) {
    envContent += '\n# Secret pour l\'authentification\n';
    envContent += 'NEXTAUTH_SECRET="your-secret-key-here"\n';
  }
  
  // Créer .env s'il n'existe pas
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('✅ Fichier .env créé');
  } else {
    console.log('⏭️  Fichier .env existe déjà');
  }
}

// ====================================
// EXÉCUTION SÉQUENTIELLE DES SCRIPTS
// ====================================

try {
  console.log('=' * 60);
  console.log('🚀 GÉNÉRATION SYSTÈME COMPLET - 100% DYNAMIQUE');
  console.log('=' * 60);
  
  // PHASE 0 - Préparation
  validateSourceFiles();
  createMissingDirectories();
  setupEnvironmentVariables();
  
  console.log('\n📋 Plan d\'exécution:');
  console.log('  1. Génération schema Prisma (dynamique)');
  console.log('  2. Génération service Prisma (dynamique)');
  console.log('  3. Génération routes API (dynamique)');
  console.log('  4. Migration authentification vers API');
  console.log('  5. Génération hooks React (dynamique)');
  console.log('  6. Migration composants vers hooks');
  console.log('  7. Migration data vers prisma-service');
  console.log('  8. Validation finale\n');
  
  // PHASE 1 - Génération Prisma (BASE)
  runScript('generatePrismaSchema.js', 'Génération schema Prisma DYNAMIQUE');
  runScript('generatePrismaServiceFromData.js', 'Génération service Prisma DYNAMIQUE');
  
  // PHASE 2 - Génération API
  runScript('generateApiRoutes.js', 'Génération routes API DYNAMIQUES');
  
  // PHASE 3 - Migration Auth
  runScript('migrateAuthToApi.js', 'Migration authentification vers API');
  
  // PHASE 4 - Hooks et Components
  runScript('generateReactHooks.js', 'Génération hooks React DYNAMIQUES');
  runScript('migrateComponentsToHooks.js', 'Migration composants vers hooks');
  
  // PHASE 5 - Migration données
  runScript('migrateDataToPrisma.js', 'Migration imports data vers prisma-service');
  
  // PHASE 6 - Nettoyage et organisation
  if (fs.existsSync(path.join(__dirname, 'fixPrismaServiceLocation.js'))) {
    runScript('fixPrismaServiceLocation.js', 'Organisation fichiers Prisma');
  }
  
  // PHASE 7 - Validation finale
  console.log('\n🔍 Validation du système généré...');
  
  const generatedFiles = [
    'prisma/schema.prisma',
    'src/lib/prisma-service.ts',
    'src/app/api/users/route.ts',
    'src/app/api/auth/route.ts',
    'src/lib/api-utils.ts'
  ];
  
  let allGenerated = true;
  generatedFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
    } else {
      console.error(`❌ Manquant: ${file}`);
      allGenerated = false;
    }
  });
  
  if (!allGenerated) {
    console.error('❌ Certains fichiers n\'ont pas été générés correctement');
    process.exit(1);
  }
  
  console.log('\n' + '=' * 60);
  console.log('🎉 SYSTÈME COMPLET GÉNÉRÉ AVEC SUCCÈS !');
  console.log('=' * 60);
  
  console.log('\n📊 Résumé de la génération:');
  console.log('✅ Schema Prisma généré DYNAMIQUEMENT depuis types.ts');
  console.log('✅ Service Prisma avec CRUD complet pour tous les modèles');
  console.log('✅ Routes API Next.js pour tous les modèles détectés');
  console.log('✅ Authentification migrée vers API');
  console.log('✅ Hooks React générés pour tous les modèles');
  console.log('✅ Composants migrés vers hooks automatiquement');
  console.log('✅ Imports data.ts migrés vers prisma-service.ts');
  
  console.log('\n🚀 Prochaines étapes:');
  console.log('1. npm install (si pas déjà fait)');
  console.log('2. Démarrer PostgreSQL');
  console.log('3. npx prisma db push');
  console.log('4. npm run dev');
  
  console.log('\n💡 Le système est 100% dynamique et s\'adaptera automatiquement');
  console.log('   à tous les futurs changements dans types.ts !');
  
} catch (error) {
  console.error('\n❌ ERREUR CRITIQUE dans generateCompleteSystem:');
  console.error(`Message: ${error.message}`);
  console.error(`Stack: ${error.stack}`);
  process.exit(1);
}
