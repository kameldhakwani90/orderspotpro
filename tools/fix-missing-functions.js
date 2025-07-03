// fix-missing-functions.js - Correction automatique des fonctions manquantes
const fs = require('fs');
const path = require('path');

console.log('🔧 FIX MISSING FUNCTIONS - Correction automatique');

// Chemins
const generateSystemPath = path.join(__dirname, 'generateCompleteSystem.js');
const prismaServicePath = path.join(__dirname, '../src/lib/prisma-service.ts');

function extractFunctionsFromGenerateSystem() {
  console.log('📤 Extraction des fonctions depuis generateCompleteSystem.js...');
  
  if (!fs.existsSync(generateSystemPath)) {
    console.error('❌ generateCompleteSystem.js introuvable');
    return null;
  }
  
  const content = fs.readFileSync(generateSystemPath, 'utf-8');
  const lines = content.split('\n');
  
  // Trouver le début et la fin des fonctions
  let startLine = -1;
  let endLine = -1;
  
  for (let i = 0; i < lines.length; i++) {
    // Début : première ligne avec "export async function"
    if (startLine === -1 && lines[i].includes('export async function')) {
      startLine = i;
    }
    
    // Fin : ligne avec "// ============================================"
    // après avoir trouvé les fonctions
    if (startLine !== -1 && lines[i].includes('// ALIASES POUR COMPATIBILITÉ')) {
      // Chercher la fin des aliases
      for (let j = i; j < lines.length; j++) {
        if (lines[j].includes('// ============================================') && 
            j > i + 10) { // S'assurer qu'on prend tous les aliases
          endLine = j;
          break;
        }
      }
      break;
    }
  }
  
  if (startLine === -1 || endLine === -1) {
    console.error('❌ Impossible de trouver les fonctions dans generateCompleteSystem.js');
    console.log(`Debug: startLine=${startLine}, endLine=${endLine}`);
    return null;
  }
  
  const extractedFunctions = lines.slice(startLine, endLine).join('\n');
  console.log(`✅ Fonctions extraites (lignes ${startLine}-${endLine})`);
  console.log(`📊 Taille: ${extractedFunctions.length} caractères`);
  
  return extractedFunctions;
}

function addFunctionsToPrismaService(functionsToAdd) {
  console.log('📥 Ajout des fonctions dans prisma-service.ts...');
  
  if (!fs.existsSync(prismaServicePath)) {
    console.error('❌ prisma-service.ts introuvable');
    return false;
  }
  
  let content = fs.readFileSync(prismaServicePath, 'utf-8');
  
  // Vérifier si les fonctions sont déjà présentes
  if (content.includes('export async function getHosts')) {
    console.log('⚠️ Fonctions déjà présentes dans prisma-service.ts');
    return true;
  }
  
  // Ajouter les fonctions à la fin du fichier
  const separator = '\n\n// ============================================\n// FONCTIONS GÉNÉRÉES AUTOMATIQUEMENT\n// ============================================\n\n';
  
  content += separator + functionsToAdd;
  
  // Backup de l'ancien fichier
  const backupPath = prismaServicePath + '.backup.' + Date.now();
  fs.writeFileSync(backupPath, fs.readFileSync(prismaServicePath));
  console.log(`💾 Backup créé: ${path.basename(backupPath)}`);
  
  // Écrire le nouveau contenu
  fs.writeFileSync(prismaServicePath, content);
  console.log('✅ Fonctions ajoutées dans prisma-service.ts');
  
  return true;
}

function validateFunctions() {
  console.log('🔍 Validation des fonctions ajoutées...');
  
  const content = fs.readFileSync(prismaServicePath, 'utf-8');
  
  const requiredFunctions = [
    'getHosts', 'addHost', 'updateHost', 'deleteHost',
    'getUsers', 'addUser', 'updateUser', 'deleteUser', 
    'getClients', 'addClient', 'updateClient', 'deleteClient',
    'getOrders', 'addOrder', 'updateOrder', 'deleteOrder',
    'getSites', 'addSite', 'updateSite', 'deleteSite'
  ];
  
  const missingFunctions = [];
  const presentFunctions = [];
  
  requiredFunctions.forEach(func => {
    if (content.includes(`export async function ${func}`) || 
        content.includes(`export const ${func}`) ||
        content.includes(`function ${func}`)) {
      presentFunctions.push(func);
      console.log(`✅ ${func}`);
    } else {
      missingFunctions.push(func);
      console.log(`❌ ${func} manquante`);
    }
  });
  
  console.log(`\n📊 Résultats:`);
  console.log(`✅ Fonctions présentes: ${presentFunctions.length}`);
  console.log(`❌ Fonctions manquantes: ${missingFunctions.length}`);
  
  return missingFunctions.length === 0;
}

function generateReport() {
  const stats = {
    prismaServiceSize: fs.statSync(prismaServicePath).size,
    timestamp: new Date().toISOString(),
    success: true
  };
  
  console.log('\n🎉 CORRECTION TERMINÉE AVEC SUCCÈS !');
  console.log('📊 Rapport:');
  console.log(`   📁 prisma-service.ts: ${stats.prismaServiceSize} bytes`);
  console.log(`   🕐 Timestamp: ${stats.timestamp}`);
  console.log('✅ Toutes les fonctions sont maintenant disponibles !');
  console.log('💡 Vous pouvez maintenant lancer: npm run build');
  
  return stats;
}

// ====================================
// FONCTION PRINCIPALE
// ====================================

async function fixMissingFunctions() {
  try {
    console.log('🚀 Démarrage correction des fonctions manquantes...\n');
    
    // 1. Extraire les fonctions
    const extractedFunctions = extractFunctionsFromGenerateSystem();
    if (!extractedFunctions) {
      console.error('❌ Échec extraction des fonctions');
      process.exit(1);
    }
    
    // 2. Ajouter dans prisma-service.ts
    const addSuccess = addFunctionsToPrismaService(extractedFunctions);
    if (!addSuccess) {
      console.error('❌ Échec ajout des fonctions');
      process.exit(1);
    }
    
    // 3. Valider
    const validationSuccess = validateFunctions();
    if (!validationSuccess) {
      console.error('❌ Validation échouée - fonctions manquantes');
      process.exit(1);
    }
    
    // 4. Rapport final
    const report = generateReport();
    
    console.log('\n🎯 CORRECTION RÉUSSIE !');
    console.log('Prochaines étapes:');
    console.log('1. npm run build');
    console.log('2. pm2 restart orderspot-app');
    console.log('3. Vérifier http://localhost:3001');
    
    return {
      success: true,
      report: report
    };
    
  } catch (error) {
    console.error('\n❌ ERREUR lors de la correction:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// ====================================
// EXÉCUTION
// ====================================

// Exécution si script appelé directement
if (require.main === module) {
  fixMissingFunctions().then(result => {
    console.log('\n🎉 Script terminé avec succès !');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  });
}

module.exports = { fixMissingFunctions };