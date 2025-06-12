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
  } catch (err) {
    console.log("❌ Connexion échouée - tentative de résolution réseau...");
    
    try {
      execSync("docker network create orderspot-network 2>/dev/null || true", { stdio: "pipe" });
      execSync("docker network connect orderspot-network orderspot_postgres 2>/dev/null || true", { stdio: "pipe" });
      execSync("docker network connect orderspot-network orderspot-app 2>/dev/null || true", { stdio: "pipe" });
      
      console.log("🔗 Réseau Docker configuré");
      
      execSync(`DATABASE_URL="${DATABASE_URL}" npx prisma db pull --force`, { stdio: "pipe" });
      console.log("✅ Base de données accessible après configuration réseau");
      return true;
      
    } catch (err2) {
      console.log("🔧 Tentative de push/reset de la base...");
      
      try {
        execSync(`DATABASE_URL="${DATABASE_URL}" npx prisma db push --force-reset`, { stdio: "pipe" });
        console.log("✅ Base de données réinitialisée avec succès");
        return true;
      } catch (err3) {
        console.error("❌ ERREUR CRITIQUE : Impossible d'accéder à PostgreSQL");
        console.error("URL utilisée:", DATABASE_URL);
        console.error("Vérifiez que le conteneur orderspot_postgres est démarré");
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

// 4. Reset et migration de la base de données (OBLIGATOIRE)
run("npx prisma db push --force-reset", "3. Reset et migration de la base de données");

// 5. Génération des services Prisma (OBLIGATOIRE) 
run("node tools/generatePrismaServiceFromData.js", "4. Génération des fonctions Prisma");

// 6. Scripts de nettoyage et préparation
run("node tools/cleanDataFile.js", "5. Nettoyage du fichier data.ts");

// ✨ NOUVELLES ÉTAPES DYNAMIQUES ✨
// 7. Génération DYNAMIQUE des routes API
run("node tools/generateApiRoutes.js", "6. Génération DYNAMIQUE des routes API");

// 8. Génération DYNAMIQUE des hooks React
run("node tools/generateReactHooks.js", "7. Génération DYNAMIQUE des hooks React");

// 9. Migration DYNAMIQUE des composants
run("node tools/migrateComponentsToHooks.js", "8. Migration DYNAMIQUE vers hooks");

// 10. Migration data.ts vers prisma-service.ts
run("node tools/migrateDataToPrisma.js", "9. Migration data.ts vers prisma-service.ts");

// 11. Configuration Next.js
run("node tools/patchNextConfigRedirects.js", "10. Patch next.config.ts");

// 12. Organisation des routes API
run("node tools/fixApiFolder.js", "11. Fix API routes");

// 13. Build Next.js (critique)
run("npm run build", "12. Build final de l'application");

// 14-16. Démarrage et configuration PM2
run("pm2 start npm --name orderspot-app -- start", "13. Démarrage avec PM2");
run("pm2 save", "14. Sauvegarde PM2");

console.log("\n🎉 Build complet terminé avec succès !");
console.log("🌐 Application disponible sur port 3001");
console.log("✨ Interface 100% fonctionnelle avec hooks dynamiques");
console.log("🔄 Migration automatique des composants effectuée");
console.log("🚀 Routes API générées dynamiquement");
console.log("💾 Données maintenant persistées en PostgreSQL");

process.exit(0);
