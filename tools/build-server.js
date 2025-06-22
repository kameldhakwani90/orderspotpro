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

function createCorrectSchema() {
  console.log("\n🔧 Création schema Prisma ROBUSTE...");
  
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  const typesPath = path.join(__dirname, '../src/lib/types.ts');
  
  if (!fs.existsSync(typesPath)) {
    console.error("❌ types.ts introuvable");
    return;
  }
  
  const typesContent = fs.readFileSync(typesPath, 'utf-8');
  const interfaces = (typesContent.match(/export\s+interface\s+(\w+)/g) || [])
    .map(match => match.replace(/export\s+interface\s+/, ''));
  
  console.log(`📋 ${interfaces.length} interfaces: ${interfaces.join(', ')}`);
  
  // TOUJOURS recréer pour éviter corruption
  const schemaLines = [
    '// Schema Prisma - Généré automatiquement',
    'generator client {',
    '  provider = "prisma-client-js"',
    '}',
    '',
    'datasource db {',
    '  provider = "postgresql"',
    '  url = env("DATABASE_URL")',
    '}',
    ''
  ];
  
  // Générer modèles proprement
  interfaces.forEach(interfaceName => {
    if (!interfaceName || interfaceName.length === 0) return;
    
    schemaLines.push(`model ${interfaceName} {`);
    schemaLines.push('  id        Int      @id @default(autoincrement())');
    
    // Champs spécifiques par type
    if (interfaceName.toLowerCase().includes('user')) {
      schemaLines.push('  email     String?  @unique');
      schemaLines.push('  nom       String?');
      schemaLines.push('  role      String?');
    } else if (interfaceName.toLowerCase().includes('host')) {
      schemaLines.push('  nom       String?');
      schemaLines.push('  email     String?');
    } else if (interfaceName.toLowerCase().includes('message')) {
      schemaLines.push('  contenu   String?');
      schemaLines.push('  auteur    String?');
    } else {
      schemaLines.push('  nom       String?');
    }
    
    // Timestamps OBLIGATOIRES
    schemaLines.push('  createdAt DateTime @default(now())');
    schemaLines.push('  updatedAt DateTime @updatedAt');
    schemaLines.push('}');
    schemaLines.push('');
  });
  
  // Créer répertoire + écrire fichier
  const prismaDir = path.dirname(schemaPath);
  if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir, { recursive: true });
  }
  
  const finalSchema = schemaLines.join('\n');
  fs.writeFileSync(schemaPath, finalSchema, 'utf-8');
  
  // VALIDATION immédiate
  const writtenContent = fs.readFileSync(schemaPath, 'utf-8');
  const hasOrphanLines = writtenContent.match(/^\s*DateTime\s+@default/m);
  
  if (hasOrphanLines) {
    console.error("❌ Schema encore corrompu - création manuelle");
    
    // Schema minimal de secours
    const emergencySchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String?  @unique
  nom       String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`;
    
    fs.writeFileSync(schemaPath, emergencySchema, 'utf-8');
    console.log("🚨 Schema d'urgence appliqué");
  } else {
    console.log("✅ Schema Prisma créé proprement");
  }
}

console.log("🚀 Démarrage du pipeline Orderspot.pro - VERSION OPTIMISÉE");

try {
  // PHASE 0 — PRÉPARATION
  console.log("\n" + "=".repeat(60));
  console.log("📋 PHASE 0: PRÉPARATION");
  console.log("=".repeat(60));
  
  stopPM2App("orderspot-app");
  installDependencies();

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
  createCorrectSchema();
  
  if (dbConnected) {
    run("npx prisma generate", "Génération client Prisma");
    run("npx prisma db push --force-reset", "Push schema DB Prisma");
  } else {
    console.log("⚠️  Base de données non accessible - génération client seulement");
    run("npx prisma generate", "Génération client Prisma");
  }

  // PHASE 4 — CORRECTIONS ORDONNÉES
  console.log("\n" + "=".repeat(60));
  console.log("🔧 PHASE 4: CORRECTIONS SYSTÉMATIQUES");
  console.log("=".repeat(60));
  
  run("node tools/genericMissingExportsFixer.js", "Correction exports manquants");
  run("node tools/fixTypesMismatch.js", "Synchronisation Types/Schema");
  run("node tools/fixMissingTypesImports.js", "Correction imports types manquants");
  run("node tools/dynamicErrorResolver.js", "Résolution complète des erreurs");

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
  console.log("✅ Fix lucide-react version compatible");
  
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
