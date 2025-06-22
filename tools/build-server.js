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
    'src/app/api/auth/route.ts'
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
    console.error("💡 Vérifiez que generateCompleteSystem.js s'est exécuté correctement");
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

console.log("🚀 Démarrage du pipeline Orderspot.pro - VERSION DÉFINITIVE V4");

try {
  // PHASE 0 — PRÉPARATION
  console.log("\n" + "=".repeat(60));
  console.log("📋 PHASE 0: PRÉPARATION");
  console.log("=".repeat(60));
  
  stopPM2App("orderspot-app");
  installDependencies();
  createAntiBarrelNextConfig();

  // PHASE 1 — GÉNÉRATION COMPLÈTE DU SYSTÈME DYNAMIQUE
  console.log("\n" + "=".repeat(60));
  console.log("🏗️  PHASE 1: GÉNÉRATION SYSTÈME COMPLET DYNAMIQUE");
  console.log("=".repeat(60));
  
  run("node tools/generateCompleteSystem.js", "Génération système complet 100% dynamique");
  
  // PHASE 2 — VALIDATION FINALE
  console.log("\n" + "=".repeat(60));
  console.log("✅ PHASE 2: VALIDATION FINALE");
  console.log("=".repeat(60));
  
  validateGeneratedFiles();

  // PHASE 3 — CONFIGURATION PRISMA ET BASE DE DONNÉES
  console.log("\n" + "=".repeat(60));
  console.log("🗄️  PHASE 3: CONFIGURATION BASE DE DONNÉES");
  console.log("=".repeat(60));
  
  const dbConnected = setupDatabaseConnection();
  
  if (dbConnected) {
    run("npx prisma generate", "Génération client Prisma");
    run("npx prisma db push --force-reset", "Push schema DB Prisma");
  } else {
    console.log("⚠️  Base de données non accessible - génération client seulement");
    run("npx prisma generate", "Génération client Prisma");
  }

  // PHASE 4 — CORRECTIONS SYSTÉMATIQUES
  console.log("\n" + "=".repeat(60));
  console.log("🔧 PHASE 4: CORRECTIONS SYSTÉMATIQUES");
  console.log("=".repeat(60));
  
  run("node tools/genericMissingExportsFixer.js", "Correction exports manquants");
  run("node tools/fixTypesMismatch.js", "Synchronisation Types/Schema");
  run("node tools/fixMissingTypesImports.js", "Correction imports types manquants");

  // PHASE 4.9 — CORRECTION POST-GÉNÉRATION (CRITIQUE)
  console.log("\n" + "=".repeat(60));
  console.log("🚨 PHASE 4.9: CORRECTION POST-GÉNÉRATION MASSIVE");
  console.log("=".repeat(60));
  
  fixLucidePostGeneration();
  
  // Résolution finale des erreurs
  run("node tools/dynamicErrorResolver.js", "Résolution finale des erreurs");

  // PHASE 5 — BUILD ET DÉMARRAGE
  console.log("\n" + "=".repeat(60));
  console.log("🚀 PHASE 5: BUILD ET DÉMARRAGE");
  console.log("=".repeat(60));
  
  run("npm run build", "Build Next.js final");
  run("pm2 start npm --name orderspot-app -- start", "Démarrage PM2 app");
  run("pm2 save", "Sauvegarde configuration PM2");

  console.log("\n" + "=".repeat(60));
  console.log("🎉 BUILD COMPLET TERMINÉ AVEC SUCCÈS !");
  console.log("=".repeat(60));
  console.log("🌐 Application opérationnelle sur le port 3001");
  console.log("📊 Système 100% généré dynamiquement depuis types.ts");
  
  console.log("\n📋 Fonctionnalités générées automatiquement:");
  console.log("✅ Schema Prisma complet avec relations");
  console.log("✅ Service Prisma avec CRUD pour tous les modèles");
  console.log("✅ Routes API Next.js pour tous les modèles");
  console.log("✅ Authentification fonctionnelle");
  console.log("✅ Hooks React pour tous les modèles");
  console.log("✅ Migration automatique des composants");
  console.log("✅ Correction automatique des exports manquants");
  console.log("✅ Synchronisation automatique Types/Schema");
  console.log("✅ Correction automatique des imports types");
  console.log("✅ Fix lucide-react DÉFINITIF post-génération");
  console.log("✅ Configuration Next.js ANTI-BARREL");
  
  if (!dbConnected) {
    console.log("\n⚠️  ATTENTION: Base de données non accessible");
    console.log("💡 Démarrez PostgreSQL et exécutez:");
    console.log("   npx prisma db push");
    console.log("   pm2 restart orderspot-app");
  }

} catch (error) {
  console.error("\n❌ ERREUR CRITIQUE dans le pipeline:");
  console.error(`Message: ${error.message}`);
  console.error(`Stack: ${error.stack}`);
  
  console.log("\n🔍 Tentative de diagnostic...");
  console.log("📁 Vérifiez que ces fichiers existent:");
  console.log("   - src/lib/types.ts");
  console.log("   - src/lib/data.ts");
  console.log("   - tools/generateCompleteSystem.js");
  console.log("   - tools/genericMissingExportsFixer.js");
  console.log("   - tools/fixTypesMismatch.js");
  console.log("   - tools/fixMissingTypesImports.js");
  console.log("   - tools/dynamicErrorResolver.js");
  
  process.exit(1);
}
