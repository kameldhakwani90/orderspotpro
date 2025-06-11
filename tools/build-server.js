const { execSync } = require('child_process');

function run(cmd, desc) {
  console.log('\n🔧 ' + desc + '...');
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log('✅ ' + desc + ' terminé.');
  } catch (err) {
    console.error('❌ Erreur pendant : ' + desc);
    process.exit(1);
  }
}

function stopPM2App(appName) {
  try {
    console.log('\n🛑 Arrêt de l\'application PM2: ' + appName + '...');
    execSync('pm2 delete ' + appName, { stdio: 'pipe' });
    console.log('✅ Application ' + appName + ' stoppée.');
  } catch (err) {
    console.log('ℹ️ Application ' + appName + ' n\'était pas active ou déjà stoppée.');
  }
  
  console.log('⏳ Attente de 2 secondes pour libérer le port...');
  try {
    execSync('sleep 2');
  } catch (err) {
    // Ignore
  }
}

console.log('🚀 Démarrage du process de build complet Orderspot.pro');

stopPM2App('orderspot-app');

run('node tools/generatePrismaSchema.js', '1. Génération du schema.prisma');
run('npx prisma generate', '2. Génération du client Prisma');
run('npx prisma migrate dev --name auto', '3. Migration de la base de données');
run('node tools/generatePrismaServiceFromData.js', '4. Génération des fonctions Prisma');
run('node tools/cleanDataFile.js', '5. Nettoyage du fichier data.ts');
run('node tools/fixApiCustomImports.js', '6. Correction des imports API');
run('node tools/patchNextConfigRedirects.js', '7. Patch next.config.ts');
run('node tools/fixApiFolder.js', '8. Fix API routes');
run('npm run build', '9. Build final de l\'application');
run('pm2 start npm --name orderspot-app -- start', '10. Démarrage avec PM2');
run('pm2 save', '11. Sauvegarde PM2');
run('pm2 startup', '12. Configuration auto-restart');

console.log('\n🎉 Build complet terminé avec succès !');
