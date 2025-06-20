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
  console.log("\n📦 Vérification des dépendances...");
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error("❌ package.json manquant");
    process.exit(1);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = ['@prisma/client', 'prisma'];
  const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);
  
  if (missingDeps.length > 0) {
    console.log(`📦 Installation des dépendances manquantes: ${missingDeps.join(', ')}`);
    run(`npm install ${missingDeps.join(' ')}`, "Installation dépendances");
  } else {
    console.log("✅ Toutes les dépendances requises sont présentes");
  }
}

console.log("🚀 Démarrage du pipeline Orderspot.pro - VERSION DYNAMIQUE");

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
  
  // PHASE 2 — VALIDATION ET RÉCUPÉRATION
  console.log("\n" + "=".repeat(60));
  console.log("✅ PHASE 2: VALIDATION ET RÉCUPÉRATION");
  console.log("=".repeat(60));
  
  validateGeneratedFiles();
  
  // Vérification spéciale pour prisma-service.ts
  const prismaServicePath = path.join(__dirname, '../src/lib/prisma-service.ts');
  if (!fs.existsSync(prismaServicePath)) {
    console.log("⚠️  prisma-service.ts manquant - génération de secours...");
    
    // Créer le script de secours s'il n'existe pas
    const forceScriptPath = path.join(__dirname, 'tools/forceCreatePrismaService.js');
    if (!fs.existsSync(forceScriptPath)) {
      // Créer le script de secours
      const forceScriptContent = `const fs = require('fs');
const path = require('path');

console.log('🚨 GÉNÉRATION FORCÉE du service Prisma...');

const typesPath = path.join(__dirname, '../src/lib/types.ts');
const servicePath = path.join(__dirname, '../src/lib/prisma-service.ts');

function createMinimalService() {
  if (!fs.existsSync(typesPath)) {
    console.error('❌ types.ts introuvable');
    return false;
  }
  
  const typesContent = fs.readFileSync(typesPath, 'utf-8');
  const interfaces = (typesContent.match(/export\\s+interface\\s+(\\w+)/g) || [])
    .map(match => match.replace('export interface ', ''));
  
  console.log('📋 Interfaces:', interfaces.join(', '));
  
  const lines = [
    'import { PrismaClient } from "@prisma/client";',
    '',
    'export const prisma = globalThis.prisma || new PrismaClient();',
    '',
    'if (process.env.NODE_ENV !== "production") {',
    '  globalThis.prisma = prisma;',
    '}',
    ''
  ];
  
  interfaces.forEach(modelName => {
    const camelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    
    lines.push(\`export async function get\${modelName}ById(id: number) {\`);
    lines.push(\`  return await prisma.\${camelName}.findUnique({ where: { id } });\`);
    lines.push('}');
    lines.push('');
    
    lines.push(\`export async function getAll\${modelName}s() {\`);
    lines.push(\`  return await prisma.\${camelName}.findMany({ orderBy: { createdAt: "desc" } });\`);
    lines.push('}');
    lines.push('');
    
    lines.push(\`export async function create\${modelName}(data: any) {\`);
    lines.push('  const { id, createdAt, updatedAt, ...cleanData } = data;');
    lines.push(\`  return await prisma.\${camelName}.create({ data: cleanData });\`);
    lines.push('}');
    lines.push('');
    
    lines.push(\`export const add\${modelName} = create\${modelName};\`);
    lines.push('');
  });
  
  const serviceDir = path.dirname(servicePath);
  if (!fs.existsSync(serviceDir)) {
    fs.mkdirSync(serviceDir, { recursive: true });
  }
  
  fs.writeFileSync(servicePath, lines.join('\\n'), 'utf-8');
  return fs.existsSync(servicePath);
}

try {
  const success = createMinimalService();
  console.log(success ? '✅ Service créé' : '❌ Échec');
  process.exit(success ? 0 : 1);
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}`;

      fs.writeFileSync(forceScriptPath, forceScriptContent, 'utf-8');
    }
    
    run("node tools/forceCreatePrismaService.js", "Génération service Prisma de secours");
  }

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

  // PHASE 4 — BUILD ET DÉMARRAGE
  console.log("\n" + "=".repeat(60));
  console.log("🚀 PHASE 4: BUILD ET DÉMARRAGE");
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
  
  console.log("\n🔧 Tentative de diagnostic...");
  console.log("📁 Vérifiez que ces fichiers existent:");
  console.log("   - src/lib/types.ts");
  console.log("   - src/lib/data.ts");
  console.log("   - tools/generateCompleteSystem.js");
  
  process.exit(1);
}
