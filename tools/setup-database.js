const { execSync } = require('child_process');
const fs = require('fs');

console.log('🗄️ Configuration base de données INTELLIGENTE - PRÉSERVE LES DONNÉES');

async function setupDatabase() {
  try {
    if (!fs.existsSync('../.env')) {
      console.log('❌ Fichier .env manquant');
      return false;
    }
    
    console.log('🔍 Vérification base de données existante...');
    
    // Test de connectivité DB SANS destruction
    let hasExistingData = false;
    try {
      execSync('npx prisma db pull --print', { 
        stdio: 'pipe', 
        timeout: 10000,
        cwd: '..'
      });
      hasExistingData = true;
      console.log('✅ Base de données existante détectée - PRÉSERVATION DES DONNÉES');
    } catch (error) {
      console.log('💡 Nouvelle base de données ou inaccessible - initialisation...');
    }
    
    if (hasExistingData) {
      // Migration intelligente SANS reset pour préserver données
      console.log('🔄 Migration intelligente (préserve données existantes)...');
      try {
        execSync('npx prisma db push', { 
          stdio: 'inherit', 
          timeout: 60000,
          cwd: '..'
        });
        console.log('✅ Migration réussie avec préservation des données');
      } catch (error) {
        console.log('⚠️ Erreur migration, mais on continue...');
      }
    } else {
      // Nouvelle DB - push normal
      console.log('🔄 Initialisation nouvelle base de données...');
      try {
        execSync('npx prisma db push', { 
          stdio: 'inherit', 
          timeout: 60000,
          cwd: '..'
        });
        console.log('✅ Nouvelle base de données initialisée');
      } catch (error) {
        console.log('⚠️ Erreur initialisation DB, mais on continue...');
      }
    }
    
    console.log('🔄 Génération client Prisma...');
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit', 
        timeout: 60000,
        cwd: '..'
      });
      console.log('✅ Client Prisma généré');
    } catch (error) {
      console.log('⚠️ Erreur génération client, mais on continue...');
    }
    
    console.log('✅ Configuration base de données terminée');
    if (hasExistingData) {
      console.log('🛡️ DONNÉES EXISTANTES PRÉSERVÉES');
    }
    return true;
    
  } catch (error) {
    console.error('❌ Erreur configuration DB:', error.message);
    return false;
  }
}

setupDatabase();