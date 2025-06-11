const { execSync } = require("child_process");

function run(cmd, desc, optional = false) {
  console.log("\n🔧 " + desc + "...");
  try {
    execSync(cmd, { stdio: "inherit" });
    console.log("✅ " + desc + " terminé.");
  } catch (err) {
    if (optional) {
      console.log("⚠️ " + desc + " échoué (optionnel, continuer)");
      return false;
    } else {
      console.error("❌ Erreur pendant : " + desc);
      process.exit(1);
    }
  }
  return true;
}

function setupDatabaseConnection() {
  console.log("\n🔍 Configuration de la connexion base de données...");
  
  // Variables d'environnement pour PostgreSQL
  const DB_HOST = "orderspot_postgres";
  const DB_USER = "orderspot_user";  
  const DB_PASS = "orderspot_pass";
  const DB_NAME = "orderspot_db";
  const DB_PORT = "5432";
  
  const DATABASE_URL = `postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`;
  
  // Définir la variable d'environnement
  process.env.DATABASE_URL = DATABASE_URL;
  console.log("🔗 DATABASE_URL configurée");
  
  try {
    // Test de connexion
    execSync("npx prisma db pull --force", { stdio: "pipe" });
    console.log("✅ Base de données accessible");
    return true;
  } catch (err) {
    console.log("❌ Connexion échouée - tentative de résolution réseau...");
    
    try {
      // Essayer de connecter les conteneurs au même réseau
      execSync("docker network create orderspot-network 2>/dev/null || true", { stdio: "pipe" });
      execSync("docker network connect orderspot-network orderspot_postgres 2>/dev/null || true", { stdio: "pipe" });
      execSync("docker network connect orderspot-network orderspot-app 2>/dev/null || true", { stdio: "pipe" });
      
      console.log("🔗 Réseau Docker configuré");
      
      // Nouveau test après connexion réseau
      execSync("npx prisma db pull --force", { stdio: "pipe" });
      console.log("✅ Base de données accessible après configuration réseau");
      return true;
      
    } catch (err2) {
      console.log("🔧 Tentative de push/reset de la base...");
      
      try {
        execSync("npx prisma db push --force-reset", { stdio: "pipe" });
        console.log("✅ Base de données réinitialisée avec succès");
        return true;
      } catch (err3) {
        console.error("❌ ERREUR CRITIQUE : Impossible d'accéder à PostgreSQL");
        console.error("Vérifiez que le conteneur orderspot_postgres est démarré");
        console.error("Commande : docker ps | grep orderspot_postgres");
        process.exit(1);
      }
    }
  }
}

function stopPM2App(appName) {
  try {
    console.log("\n🛑 Arrêt de l'application PM2: " + appName + "...");
    execSync("pm2 delete " + appName, { stdio: "pipe" });
    console.log("✅ Application " + appName + " stoppée.");
  } catch (err) {
    console.log("ℹ Application " + appName + " n'était pas active ou déjà stoppée.");
  }
  console.log("⏳ Attente de 2 secondes pour libérer le port...");
  try {
    execSync("sleep 2");
  } catch (err) {
    // Ignore
  }
}

console.log("🚀 Démarrage du process de build complet Orderspot.pro");

// 0. Sécurité : arrêt propre de l'app existante
stopPM2App("orderspot-app");

// 1. Génération du schema Prisma (toujours nécessaire)
run("node tools/generatePrismaSchema.js", "1. Génération du schema.prisma");

// 2. Génération du client Prisma (toujours nécessaire)
run("npx prisma generate", "2. Génération du client Prisma");

// 3. Configuration et connexion obligatoire à la base de données
setupDatabaseConnection();

// 4. Migration de la base de données (OBLIGATOIRE)
run("npx prisma migrate dev --name auto", "3. Migration de la base de données");

// 5. Génération des services Prisma (OBLIGATOIRE) 
run("node tools/generatePrismaServiceFromData.js", "4. Génération des fonctions Prisma");

// 5-8. Scripts de nettoyage et préparation (toujours nécessaires)
run("node tools/cleanDataFile.js", "5. Nettoyage du fichier data.ts", true);
run("node tools/fixApiCustomImports.js", "6. Correction des imports API", true);
run("node tools/patchNextConfigRedirects.js", "7. Patch next.config.ts", true);
run("node tools/fixApiFolder.js", "8. Fix API routes", true);

// 9. Build Next.js (critique)
run("npm run build", "9. Build final de l application");

// 10-12. Démarrage et configuration PM2
run("pm2 start npm --name orderspot-app -- start", "10. Démarrage avec PM2");
run("pm2 save", "11. Sauvegarde PM2", true);
run("pm2 startup", "12. Configuration auto-restart", true);

console.log("\n🎉 Build complet terminé avec succès !");
console.log("🌐 Application disponible sur port 3001");

// Exit explicite pour éviter les codes d'erreur
process.exit(0);
