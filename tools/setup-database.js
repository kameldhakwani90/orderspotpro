// setup-database.js - CORRIGÉ
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🗄️ Configuration base de données...');

async function setupDatabase() {
  try {
    // Vérifier .env
    if (!fs.existsSync('.env')) {
      console.log('❌ Fichier .env manquant');
      return false;
    }
    
    console.log('🔄 Push schema vers DB...');
    execSync('npx prisma db push --force-reset', { 
      stdio: 'inherit',
      timeout: 60000 
    });
    
    console.log('🔄 Génération client Prisma...');
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      timeout: 60000 
    });
    
    console.log('✅ Base de données configurée');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur DB:', error.message);
    return false;
  }
}

setupDatabase();