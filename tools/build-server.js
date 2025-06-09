const { execSync } = require('child_process');

function run(cmd, desc) {
  console.log(`\n🔧 ${desc}...`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ ${desc} terminé.`);
  } catch (err) {
    console.error(`❌ Erreur pendant : ${desc}`);
    process.exit(1);
  }
}

function killPortIfOccupied(port) {
  try {
    const pid = execSync(`lsof -t -i:${port} || true`).toString().trim();
    if (pid) {
      console.log(`\n❗ Le port ${port} est déjà utilisé (PID: ${pid}), arrêt du processus...`);
      execSync(`kill -9 ${pid}`);
      console.log(`✅ Processus ${pid} stoppé.`);
    } else {
      console.log(`✅ Port ${port} libre.`);
    }
  } catch (err) {
    console.error(`❌ Erreur lors de la vérification du port ${port}:`, err.message);
  }
}

console.log('🚀 Démarrage du process de build complet Orderspot.pro');

// 0. Sécurité : libération du port 3000
killPortIfOccupied(3000);

// 1 → 12 : Workflow R&D complet
run('node tools/generatePrismaSchema.js', '1. Génération du schema.prisma');
run('npx prisma generate', '2. Génération du client Prisma');
run('npx prisma migrate dev --name auto', '3. Migration de la base de données');
run('node tools/generatePrismaServiceFromData.js', '4. Génération des fonctions Prisma (getXxxById)');
run('node tools/cleanDataFile.js', '5. Nettoyage du fichier data.ts (suppression des doublons)');
run('node tools/fixApiCustomImports.js', '6. Correction des imports dans les routes API');
run('node tools/patchNextConfigRedirects.js', '7. Patch next.config.ts pour ignorer prerender API');
run('node tools/fixApiFolder.js', '8. Fix API routes (déplacement api-custom → app)');
run('npm run build', '9. Build final de l’application');
run('pm2 start npm --name orderspot-app -- start', '10. Démarrage de l’app avec PM2');
run('pm2 save', '11. Sauvegarde de la configuration PM2');
run('pm2 startup', '12. Configuration du redémarrage automatique');

console.log('\n🎉 Build complet terminé avec succès !');
