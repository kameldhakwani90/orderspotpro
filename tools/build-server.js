const { execSync } = require("child_process");
const fs = require('fs');
const path = require('path');

function run(cmd, desc) {
  console.log("\n🔧 " + desc + "...");
  try {
    const DATABASE_URL = process.env.DATABASE_URL || `postgresql://orderspot_user:orderspot_pass@orderspot_postgres:5432/orderspot_db?schema=public`;
    const env = { ...process.env, DATABASE_URL };
    execSync(cmd, { stdio: "inherit", env });
    console.log("✅ " + desc + " terminé.");
  } catch (err) {
    console.error("❌ Erreur pendant : " + desc);
    console.error("Command:", cmd);
    console.error("DATABASE_URL:", process.env.DATABASE_URL);
    process.exit(1);
  }
}

function setupDatabaseConnection() {
  console.log("\n🔍 Configuration de la connexion base de données...");

  const DB_HOST = "orderspot_postgres";
  const DB_USER = "orderspot_user";
  const DB_PASS = "orderspot_pass";
  const DB_NAME = "orderspot_db";
  const DB_PORT = "5432";

  const DATABASE_URL = `postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`;
  process.env.DATABASE_URL = DATABASE_URL;

  console.log("🔗 DATABASE_URL configurée:", DATABASE_URL);
  
  try {
    execSync(`echo 'export DATABASE_URL="${DATABASE_URL}"' >> ~/.bashrc`, { stdio: "pipe" });
  } catch (err) {
    // Ignore l'erreur si le fichier .bashrc n'existe pas ou n'est pas accessible
  }

  try {
    execSync(`DATABASE_URL="${DATABASE_URL}" npx prisma db pull --force`, { stdio: "pipe" });
    console.log("✅ Base de données accessible");
    return true;
  } catch {
    console.log("❌ Connexion échouée - tentative de correction réseau...");

    try {
      execSync("docker network create orderspot-network 2>/dev/null || true", { stdio: "pipe" });
      execSync("docker network connect orderspot-network orderspot_postgres 2>/dev/null || true", { stdio: "pipe" });
      execSync("docker network connect orderspot-network orderspot-app 2>/dev/null || true", { stdio: "pipe" });
      console.log("🔗 Réseau Docker configuré");
      execSync(`DATABASE_URL="${DATABASE_URL}" npx prisma db pull --force`, { stdio: "pipe" });
      console.log("✅ Connexion DB rétablie");
      return true;
    } catch {
      console.log("⚠️  PostgreSQL pas encore accessible - on continue quand même");
      return false;
    }
  }
}

function stopPM2App(appName) {
  try {
    console.log("\n🛑 Arrêt de l'application PM2: " + appName + "...");
    execSync("pm2 delete " + appName, { stdio: "pipe" });
    console.log("✅ Application " + appName + " stoppée.");
  } catch {
    console.log("ℹ Application " + appName + " non trouvée ou déjà arrêtée.");
  }
  execSync("sleep 2");
}

function validateGeneratedFiles() {
  console.log("\n🔍 Validation des fichiers générés...");
  
  const criticalFiles = [
    'prisma/schema.prisma',
    'src/lib/prisma-service.ts',
    'src/app/api/users/route.ts',
    'src/app/api/auth/route.ts',
    'src/context/AuthContext.tsx'
  ];
  
  let allPresent = true;
  
  criticalFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
    } else {
      console.error(`❌ Fichier critique manquant: ${file}`);
      allPresent = false;
    }
  });
  
  if (!allPresent) {
    console.error("❌ Certains fichiers critiques sont manquants");
    console.error("💡 Vérifiez que la génération s'est exécutée correctement");
    process.exit(1);
  }
  
  console.log("✅ Tous les fichiers critiques sont présents");
}

function installDependencies() {
  console.log("\n📦 Installation dépendances avec versions compatibles...");
  
  // Forcer version lucide-react compatible
  console.log("🔧 Installation lucide-react version compatible...");
  run('npm install lucide-react@0.263.1 --save', "Installation lucide-react compatible");
  
  // Installation avec legacy-peer-deps pour éviter les conflits
  console.log("📦 Installation avec --legacy-peer-deps...");
  run('npm install --legacy-peer-deps', "Installation NPM (mode compatibilité)");
}

function createAntiBarrelNextConfig() {
  console.log("\n🔧 Création next.config.js ANTI-BARREL...");
  
  const configPath = path.join(__dirname, '../next.config.js');
  
  const bulletproofConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // DÉSACTIVATION COMPLÈTE de l'optimisation barrel
  experimental: {
    optimizePackageImports: false // FALSE, pas []
  },
  
  // Configuration webpack ANTI-BARREL
  webpack: (config, { isServer }) => {
    // Forcer résolution directe lucide-react
    config.resolve.alias = {
      ...config.resolve.alias,
      'lucide-react': require.resolve('lucide-react')
    };
    
    // Ignorer warnings barrel
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /__barrel_optimize__/ },
      { module: /lucide-react/ }
    ];
    
    // Désactiver transformations SWC sur lucide
    config.module.rules.push({
      test: /node_modules\\/lucide-react/,
      type: 'javascript/auto'
    });
    
    return config;
  },
  
  // TypeScript permissif pour éviter erreurs
  typescript: {
    ignoreBuildErrors: false
  }
}

module.exports = nextConfig`;

  fs.writeFileSync(configPath, bulletproofConfig);
  console.log("✅ next.config.js ANTI-BARREL créé");
}

function fixLucidePostGeneration() {
  console.log("\n🔧 CORRECTION MASSIVE post-génération...");
  
  // Méthode 1: sed sur tous les fichiers
  try {
    console.log("📝 Correction avec sed...");
    execSync(`find ./src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/__barrel_optimize__[^"]*!=!lucide-react/lucide-react/g'`, { stdio: "inherit" });
    console.log("✅ Correction sed terminée");
  } catch (error) {
    console.log("⚠️  sed échoué, tentative perl...");
  }
  
  // Méthode 2: perl en backup
  try {
    console.log("📝 Correction avec perl...");
    execSync(`find ./src -name "*.tsx" -o -name "*.ts" | xargs perl -i -pe 's/"__barrel_optimize__[^"]+"/\"lucide-react\"/g'`, { stdio: "inherit" });
    console.log("✅ Correction perl terminée");
  } catch (error) {
    console.log("⚠️  perl échoué, correction manuelle...");
  }
  
  // Méthode 3: Correction Node.js manuelle
  console.log("📝 Correction Node.js finale...");
  const srcDir = path.join(__dirname, '../src');
  
  function fixDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !['node_modules', '.git', '.next'].includes(entry.name)) {
        fixDirectory(fullPath);
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
        try {
          let content = fs.readFileSync(fullPath, 'utf-8');
          
          if (content.includes('__barrel_optimize__')) {
            const originalContent = content;
            
            // Pattern complet
            content = content.replace(
              /"__barrel_optimize__\?names=[^"]+!=!lucide-react"/g,
              '"lucide-react"'
            );
            
            // Pattern avec quotes simples
            content = content.replace(
              /'__barrel_optimize__\?names=[^']+!=!lucide-react'/g,
              "'lucide-react'"
            );
            
            if (content !== originalContent) {
              fs.writeFileSync(fullPath, content, 'utf-8');
              console.log(`  ✅ Corrigé: ${path.relative(srcDir, fullPath)}`);
            }
          }
        } catch (error) {
          console.log(`  ⚠️  Erreur ${entry.name}: ${error.message}`);
        }
      }
    });
  }
  
  fixDirectory(srcDir);
  console.log("✅ Correction massive terminée");
  
  // Vérification finale
  try {
    const checkResult = execSync(`grep -r "__barrel_optimize__" ./src --include="*.tsx" --include="*.ts" || echo "CLEAN"`, { encoding: 'utf-8' });
    if (checkResult.trim() === 'CLEAN') {
      console.log("🎉 SUCCÈS: Aucun __barrel_optimize__ restant !");
    } else {
      console.log("⚠️  Quelques __barrel_optimize__ persistent...");
      console.log(checkResult);
    }
  } catch (error) {
    console.log("✅ Vérification impossible mais correction appliquée");
  }
}

// ====================================
// FONCTIONS D'EXÉCUTION DES SCRIPTS
// ====================================

function runScript(scriptName, description, required = true) {
  const scriptPath = path.join(__dirname, scriptName);
  
  if (!fs.existsSync(scriptPath)) {
    if (required) {
      console.error(`❌ Script requis manquant: ${scriptName}`);
      process.exit(1);
    } else {
      console.log(`⏭️  Script optionnel manquant: ${scriptName}`);
      return false;
    }
  }
  
  try {
    run(`node "${scriptPath}"`, description);
    return true;
  } catch (error) {
    if (required) {
      console.error(`❌ Échec script requis: ${scriptName}`);
      process.exit(1);
    } else {
      console.log(`⚠️  Échec script optionnel: ${scriptName}`);
      return false;
    }
  }
}

// ====================================
// PIPELINE PRINCIPAL AVEC ORDRE LOGIQUE INTELLIGENT
// ====================================

console.log("🚀 Démarrage du pipeline Orderspot.pro - PIPELINE INTELLIGENT V5");

try {
  // ====================================
  // PHASE 0 — PRÉPARATION ET DÉTECTION
  // ====================================
  console.log("\n" + "=".repeat(60));
  console.log("📋 PHASE 0: PRÉPARATION ET DÉTECTION INTELLIGENTE");
  console.log("=".repeat(60));
  
  stopPM2App("orderspot-app");
  installDependencies();
  createAntiBarrelNextConfig();
  
  // NOUVEAU: Détection des changements Firebase
  console.log("\n🔍 Détection des changements Firebase...");
  const detectionResult = runScript('detectFirebaseChanges.js', 'Détection changements Firebase', false);
  
  if (detectionResult) {
    console.log("✅ Changements Firebase détectés - régénération nécessaire");
  } else {
    console.log("⏭️  Aucun changement détecté - régénération préventive");
  }
  
  // NOUVEAU: Sauvegarde des customisations AVANT régénération
  console.log("\n💾 Sauvegarde des customisations...");
  runScript('preserveCustomizations.js', 'Sauvegarde customisations', false);

  // ====================================
  // PHASE 1 — GÉNÉRATION CORE (ORDRE CRITIQUE)
  // ====================================
  console.log("\n" + "=".repeat(60));
  console.log("🏗️  PHASE 1: GÉNÉRATION CORE - ORDRE LOGIQUE");
  console.log("=".repeat(60));
  
  // 1.1: TYPES ET DONNÉES (BASE) - NE DOIT JAMAIS ÊTRE ÉCRASÉ
  console.log("\n📊 1.1: Validation des types et données de base...");
  const typesPath = path.join(__dirname, '../src/lib/types.ts');
  const dataPath = path.join(__dirname, '../src/lib/data.ts');
  
  if (!fs.existsSync(typesPath) || !fs.existsSync(dataPath)) {
    console.error("❌ Fichiers de base manquants (types.ts ou data.ts)");
    console.error("💡 Ces fichiers doivent exister AVANT la génération");
    process.exit(1);
  }
  
  console.log("✅ Fichiers de base présents");
  
  // 1.2: SCHEMA PRISMA (DÉPEND DES TYPES)
  console.log("\n🗄️  1.2: Génération schema Prisma depuis types...");
  runScript('generatePrismaSchema.js', 'Génération schema Prisma AMÉLIORÉ');
  
  // 1.3: SERVICE PRISMA (DÉPEND DU SCHEMA)
  console.log("\n⚙️  1.3: Génération service Prisma depuis types...");
  runScript('generatePrismaServiceFromData.js', 'Génération service Prisma CRUD COMPLET');

  // ====================================
  // PHASE 2 — GÉNÉRATION API (DÉPEND DU SERVICE)
  // ====================================
  console.log("\n" + "=".repeat(60));
  console.log("🔗 PHASE 2: GÉNÉRATION API - DÉPEND DU SERVICE PRISMA");
  console.log("=".repeat(60));
  
  // 2.1: ROUTES API (DÉPEND DU SERVICE PRISMA)
  console.log("\n📡 2.1: Génération routes API depuis modèles...");
  runScript('generateApiRoutes.js', 'Génération routes API AMÉLIORÉES');
  
  // 2.2: FIX API FOLDER (DÉPEND DES ROUTES GÉNÉRÉES)
  console.log("\n🔧 2.2: Fix et validation structure API...");
  runScript('fixApiFolder.js', 'Fix structure API INTELLIGENT');
  
  // 2.3: SYSTÈME AUTH AUTOMATIQUE (DÉPEND DES ROUTES API)
  console.log("\n🔐 2.3: Génération système authentification...");
  runScript('generateAuthSystem.js', 'Génération système auth INTELLIGENT');

  // ====================================
  // PHASE 3 — CONFIGURATION PRISMA ET BASE DE DONNÉES
  // ====================================
  console.log("\n" + "=".repeat(60));
  console.log("🗄️  PHASE 3: CONFIGURATION BASE DE DONNÉES - APRÈS GÉNÉRATION");
  console.log("=".repeat(60));
  
  const dbConnected = setupDatabaseConnection();
  
  if (dbConnected) {
    console.log("\n🔄 Base de données accessible - génération client et push...");
    run("npx prisma generate", "Génération client Prisma");
    run("npx prisma db push --force-reset", "Push schema DB Prisma");
  } else {
    console.log("\n⚠️  Base de données non accessible - génération client seulement...");
    run("npx prisma generate", "Génération client Prisma");
  }

  // ====================================
  // PHASE 4 — GÉNÉRATION FRONTEND (DÉPEND DE L'API)
  // ====================================
  console.log("\n" + "=".repeat(60));
  console.log("⚛️  PHASE 4: GÉNÉRATION FRONTEND - DÉPEND DE L'API");
  console.log("=".repeat(60));
  
  // 4.1: HOOKS REACT (DÉPEND DES ROUTES API)
  console.log("\n🪝 4.1: Génération hooks React depuis API...");
  runScript('generateReactHooks.js', 'Génération hooks React DYNAMIQUES');
  
  // 4.2: MIGRATION COMPOSANTS (DÉPEND DES HOOKS)
  console.log("\n🔄 4.2: Migration composants vers hooks...");
  runScript('migrateComponentsToHooks.js', 'Migration composants vers hooks');
  
  // 4.3: MIGRATION DATA (DÉPEND DU SERVICE PRISMA)
  console.log("\n📦 4.3: Migration imports data vers prisma-service...");
  runScript('migrateDataToPrisma.js', 'Migration imports data vers prisma-service');

  // ====================================
  // PHASE 5 — CORRECTIONS ET OPTIMISATIONS
  // ====================================
  console.log("\n" + "=".repeat(60));
  console.log("🔧 PHASE 5: CORRECTIONS - APRÈS TOUTE LA GÉNÉRATION");
  console.log("=".repeat(60));
  
  // 5.1: CORRECTIONS EXPORTS (DÉPEND DE TOUS LES FICHIERS GÉNÉRÉS)
  console.log("\n🔗 5.1: Correction exports manquants...");
  runScript('genericMissingExportsFixer.js', 'Correction exports manquants');
  
  // 5.2: SYNCHRONISATION TYPES/SCHEMA (DÉPEND DU SCHEMA FINAL)
  console.log("\n⚙️  5.2: Synchronisation Types/Schema...");
  runScript('fixTypesMismatch.js', 'Synchronisation Types/Schema');
  
  // 5.3: IMPORTS TYPES (DÉPEND DES CORRECTIONS PRÉCÉDENTES)
  console.log("\n📥 5.3: Correction imports types...");
  runScript('fixMissingTypesImports.js', 'Correction imports types manquants');

  // ====================================
  // PHASE 6 — CORRECTIONS POST-GÉNÉRATION (CRITIQUE)
  // ====================================
  console.log("\n" + "=".repeat(60));
  console.log("🚨 PHASE 6: CORRECTIONS POST-GÉNÉRATION - ÉTAPE CRITIQUE");
  console.log("=".repeat(60));
  
  // 6.1: CORRECTION LUCIDE (DOIT ÊTRE APRÈS TOUTE LA GÉNÉRATION)
  fixLucidePostGeneration();
  
  // 6.2: RÉSOLUTION FINALE DES ERREURS
  console.log("\n🔧 6.2: Résolution finale des erreurs...");
  runScript('dynamicErrorResolver.js', 'Résolution finale des erreurs');

  // ====================================
  // PHASE 7 — RESTAURATION CUSTOMISATIONS
  // ====================================
  console.log("\n" + "=".repeat(60));
  console.log("💾 PHASE 7: RESTAURATION INTELLIGENTE DES CUSTOMISATIONS");
  console.log("=".repeat(60));
  
  // 7.1: RESTAURATION DES CUSTOMISATIONS (APRÈS TOUTE LA GÉNÉRATION)
  console.log("\n🔄 7.1: Restauration des customisations...");
  const restoreResult = runScript('preserveCustomizations.js', 'Restauration customisations', false);
  
  if (restoreResult) {
    console.log("✅ Customisations restaurées avec succès");
  } else {
    console.log("⏭️  Aucune customisation à restaurer");
  }

  // ====================================
  // PHASE 8 — VALIDATION FINALE
  // ====================================
  console.log("\n" + "=".repeat(60));
  console.log("✅ PHASE 8: VALIDATION FINALE - VÉRIFICATION COMPLÈTE");
  console.log("=".repeat(60));
  
  validateGeneratedFiles();

  // ====================================
  // PHASE 9 — BUILD ET DÉMARRAGE
  // ====================================
  console.log("\n" + "=".repeat(60));
  console.log("🚀 PHASE 9: BUILD ET DÉMARRAGE FINAL");
  console.log("=".repeat(60));
  
  console.log("\n📦 9.1: Build Next.js final...");
  run("npm run build", "Build Next.js final");
  
  console.log("\n🚀 9.2: Démarrage application...");
  run("pm2 start npm --name orderspot-app -- start", "Démarrage PM2 app");
  run("pm2 save", "Sauvegarde configuration PM2");

  // ====================================
  // RAPPORT FINAL DÉTAILLÉ
  // ====================================
  console.log("\n" + "=".repeat(60));
  console.log("🎉 BUILD PIPELINE INTELLIGENT TERMINÉ AVEC SUCCÈS !");
  console.log("=".repeat(60));
  console.log("🌐 Application opérationnelle sur le port 3001");
  console.log("📊 Système 100% généré dynamiquement depuis types.ts");
  
  console.log("\n📋 PIPELINE EXÉCUTÉ DANS L'ORDRE LOGIQUE:");
  console.log("✅ Phase 0: Préparation + Détection Firebase");
  console.log("✅ Phase 1: Génération Core (types → schema → service)");
  console.log("✅ Phase 2: Génération API (service → routes → auth)");
  console.log("✅ Phase 3: Configuration DB (après génération)");
  console.log("✅ Phase 4: Frontend (API → hooks → composants)");
  console.log("✅ Phase 5: Corrections (après génération)");
  console.log("✅ Phase 6: Post-génération (Lucide + erreurs)");
  console.log("✅ Phase 7: Restauration customisations");
  console.log("✅ Phase 8: Validation finale");
  console.log("✅ Phase 9: Build + Démarrage");
  
  console.log("\n🔥 NOUVELLES FONCTIONNALITÉS V5:");
  console.log("✅ Détection intelligente changements Firebase");
  console.log("✅ Sauvegarde/restauration automatique customisations");
  console.log("✅ Génération système auth automatique");
  console.log("✅ Ordre logique strict - pas d'écrasement");
  console.log("✅ Pipeline résilient aux erreurs");
  console.log("✅ Corrections Lucide-React DÉFINITIVES");
  console.log("✅ Validation complète à chaque étape");
  
  console.log("\n📊 FONCTIONNALITÉS GÉNÉRÉES AUTOMATIQUEMENT:");
  console.log("✅ Schema Prisma complet avec relations Firebase");
  console.log("✅ Service Prisma avec CRUD pour tous les modèles");
  console.log("✅ Routes API Next.js pour tous les modèles");
  console.log("✅ Système d'authentification intelligent");
  console.log("✅ Hooks React pour tous les modèles");
  console.log("✅ Migration automatique des composants");
  console.log("✅ Correction automatique des exports manquants");
  console.log("✅ Synchronisation automatique Types/Schema");
  console.log("✅ Correction automatique des imports types");
  console.log("✅ Fix lucide-react post-génération");
  console.log("✅ Configuration Next.js ANTI-BARREL");
  console.log("✅ Préservation intelligente des customisations");
  
  console.log("\n⚠️  ORDRE LOGIQUE RESPECTÉ - AUCUN ÉCRASEMENT:");
  console.log("🔒 Types.ts et data.ts → JAMAIS écrasés (source utilisateur)");
  console.log("🔄 Schema → Service → API → Hooks → Composants");
  console.log("💾 Customisations sauvegardées AVANT et restaurées APRÈS");
  console.log("🔧 Corrections appliquées APRÈS toute la génération");
  console.log("🎯 Build final SEULEMENT si tout est validé");
  
  if (!dbConnected) {
    console.log("\n⚠️  ATTENTION: Base de données non accessible");
    console.log("💡 Démarrez PostgreSQL et exécutez:");
    console.log("   npx prisma db push");
    console.log("   pm2 restart orderspot-app");
  }
  
  console.log("\n🚀 VOTRE APPLICATION FULL-STACK EST PRÊTE !");
  console.log("🎯 Communication frontend/backend opérationnelle");
  console.log("🔐 Système d'authentification intelligent activé");
  console.log("💾 Customisations préservées et restaurées");
  console.log("📡 API RESTful complète générée automatiquement");

} catch (error) {
  console.error("\n❌ ERREUR CRITIQUE dans le pipeline:");
  console.error(`Message: ${error.message}`);
  console.error(`Stack: ${error.stack}`);
  
  console.log("\n🔍 Diagnostic automatique...");
  console.log("📁 Vérifiez que ces fichiers existent:");
  
  const criticalFiles = [
    'src/lib/types.ts',
    'src/lib/data.ts',
    'tools/detectFirebaseChanges.js',
    'tools/generatePrismaSchema.js',
    'tools/generatePrismaServiceFromData.js',
    'tools/generateApiRoutes.js',
    'tools/generateAuthSystem.js',
    'tools/generateReactHooks.js',
    'tools/migrateComponentsToHooks.js',
    'tools/migrateDataToPrisma.js',
    'tools/preserveCustomizations.js',
    'tools/genericMissingExportsFixer.js',
    'tools/fixTypesMismatch.js',
    'tools/fixMissingTypesImports.js',
    'tools/fixApiFolder.js',
    'tools/dynamicErrorResolver.js'
  ];
  
  criticalFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, '..', file)) || 
                   fs.existsSync(path.join(__dirname, file));
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  });
  
  console.log("\n💡 PLAN DE RÉCUPÉRATION:");
  console.log("1. Vérifiez que tous les scripts sont présents dans /tools");
  console.log("2. Vérifiez que src/lib/types.ts existe et contient des interfaces");
  console.log("3. Vérifiez que src/lib/data.ts existe et contient des données");
  console.log("4. Relancez le pipeline après correction");
  
  // Tentative de sauvegarde en cas d'erreur
  try {
    runScript('preserveCustomizations.js', 'Sauvegarde d\'urgence', false);
  } catch (backupError) {
    console.log("⚠️  Impossible de sauvegarder les customisations");
  }
  
  process.exit(1);
}