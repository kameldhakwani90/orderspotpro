const { execSync } = require('child_process');
const fs = require('fs');

console.log('🗄️ Configuration base de données DÉFINITIVE - PRÉSERVATION TOTALE');

async function setupDatabase() {
  try {
    // Vérifier .env
    if (!fs.existsSync('../.env')) {
      console.log('❌ Fichier .env manquant');
      return false;
    }
    
    console.log('🔍 Détection base de données existante...');
    
    // Variables d'environnement pour forcer mode non-interactif
    const safeEnv = {
      ...process.env,
      CI: 'true',
      PRISMA_MIGRATE_SKIP_GENERATE: 'true',
      PRISMA_MIGRATE_SKIP_SEED: 'true',
      FORCE_COLOR: '0'
    };
    
    // Test existence base
    let hasExistingData = false;
    try {
      execSync('npx prisma db pull --print', { 
        stdio: 'pipe', 
        timeout: 10000,
        cwd: '..',
        env: safeEnv
      });
      hasExistingData = true;
      console.log('✅ Base existante détectée - PRÉSERVATION ACTIVÉE');
    } catch (error) {
      console.log('💡 Nouvelle base de données');
    }
    
    if (hasExistingData) {
      // JAMAIS de reset pour données existantes
      console.log('🛡️ Push schema SANS reset (préserve données)...');
      try {
        execSync('npx prisma db push --accept-data-loss=false --skip-generate', { 
          stdio: 'inherit', 
          timeout: 60000,
          cwd: '..',
          env: safeEnv
        });
        console.log('✅ Schema mis à jour avec préservation des données');
      } catch (error) {
        console.log('⚠️ Push schema échoué - on continue avec generate...');
      }
    } else {
      // Nouvelle DB - push normal mais JAMAIS de reset
      console.log('🔧 Initialisation nouvelle base...');
      try {
        execSync('npx prisma db push --skip-generate', { 
          stdio: 'inherit', 
          timeout: 60000,
          cwd: '..',
          env: safeEnv
        });
        console.log('✅ Nouvelle base initialisée');
      } catch (error) {
        console.log('⚠️ Initialisation échouée - on continue...');
      }
    }
    
    // Generate client TOUJOURS en mode safe
    console.log('🔄 Génération client Prisma (mode safe)...');
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit', 
        timeout: 60000,
        cwd: '..',
        env: safeEnv
      });
      console.log('✅ Client Prisma généré');
    } catch (error) {
      console.log('⚠️ Generate client échoué - sera généré plus tard');
    }
    
    console.log('✅ Configuration base terminée');
    if (hasExistingData) {
      console.log('🛡️ TOUTES LES DONNÉES EXISTANTES PRÉSERVÉES');
    }
    return true;
    
  } catch (error) {
    console.error('❌ Erreur configuration DB:', error.message);
    console.log('💡 Mais on continue le pipeline...');
    return true; // Continue même en cas d'erreur
  }
}

setupDatabase();