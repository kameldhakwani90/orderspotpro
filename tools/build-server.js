
const { execSync } = require("child_process");

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
  execSync(`echo 'export DATABASE_URL="${DATABASE_URL}"' >> ~/.bashrc`, { stdio: "pipe" });

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
      console.error("❌ ERREUR : PostgreSQL inaccessible");
      console.error("Vérifiez que le conteneur orderspot_postgres est bien démarré");
      process.exit(1);
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

console.log("🚀 Démarrage du pipeline Orderspot.pro");

// PHASE 1 — ARRÊT DE L’APPLICATION EXISTANTE
stopPM2App("orderspot-app");

// PHASE 2 — GÉNÉRATION COMPLÈTE DU SYSTÈME
run("node tools/generateCompleteSystem.js", "Génération système complet avec Prisma + API");

// PHASE 3 — BUILD PRISMA
setupDatabaseConnection();
run("npx prisma generate", "Génération client Prisma");
run("npx prisma db push --force-reset", "Push schéma DB Prisma");

// PHASE 4 — BUILD FRONTEND
run("npm run build", "Build Next.js final");
run("pm2 start npm --name orderspot-app -- start", "Démarrage PM2 app");
run("pm2 save", "Sauvegarde configuration PM2");

console.log("\n🎉 BUILD COMPLET TERMINÉ AVEC SUCCÈS");
console.log("🌐 Application opérationnelle sur le port 3001");