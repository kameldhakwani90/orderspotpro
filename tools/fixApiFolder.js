const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fix API Folder - VERSION INTELLIGENTE AMÉLIORÉE...');

// ====================================
// GARDE LA LOGIQUE EXISTANTE DE DÉPLACEMENT
// ====================================

const oldDir = path.join(__dirname, '../src/pages/api-custom');
const newDir = path.join(__dirname, '../src/app/api');

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// GARDE LA FONCTION moveFiles EXISTANTE
function moveFiles() {
  if (!fs.existsSync(oldDir)) {
    console.log('⏭️ Dossier src/pages/api-custom introuvable.');
    return false;
  }

  ensureDirSync(newDir);

  const files = fs.readdirSync(oldDir).filter(file => file.endsWith('.ts'));

  if (files.length === 0) {
    console.log('⏭️ Aucun fichier .ts à déplacer depuis api-custom.');
    return false;
  }

  let filesMoved = 0;
  files.forEach(file => {
    const src = path.join(oldDir, file);
    const dest = path.join(newDir, file);
    
    try {
      fs.renameSync(src, dest);
      console.log(`✅ Déplacé : ${file}`);
      filesMoved++;
    } catch (error) {
      console.log(`⚠️  Erreur déplacement ${file}:`, error.message);
    }
  });

  // Supprimer l'ancien dossier si vide
  try {
    if (fs.readdirSync(oldDir).length === 0) {
      fs.rmdirSync(oldDir);
      console.log('🗑️ Ancien dossier api-custom supprimé.');
    }
  } catch (error) {
    console.log('⚠️  Impossible de supprimer l\'ancien dossier');
  }
  
  return filesMoved > 0;
}

// ====================================
// NOUVEAUTÉ: DÉTECTION DES ROUTES MANQUANTES
// ====================================

function detectMissingRoutes() {
  console.log('🔍 Détection des routes API manquantes...');
  
  const typesPath = path.join(__dirname, '../src/lib/types.ts');
  
  if (!fs.existsSync(typesPath)) {
    console.log('⚠️  types.ts introuvable - impossible de détecter les modèles');
    return [];
  }
  
  // Extraire les modèles depuis types.ts
  const content = fs.readFileSync(typesPath, 'utf-8');
  const models = [];
  const interfaceRegex = /export\s+interface\s+(\w+)\s*\{/g;
  let match;
  
  while ((match = interfaceRegex.exec(content)) !== null) {
    models.push(match[1]);
  }
  
  console.log(`📋 ${models.length} modèles détectés: ${models.join(', ')}`);
  
  // Vérifier quelles routes existent déjà
  const missingRoutes = [];
  const requiredRoutes = ['auth', 'status']; // Routes systématiques
  
  // Ajouter routes pour chaque modèle
  models.forEach(model => {
    const pluralModel = model.toLowerCase() + 's';
    requiredRoutes.push(pluralModel);
    
    // Route spéciale pour User → users
    if (model.toLowerCase() === 'user') {
      requiredRoutes.push('users');
    }
  });
  
  requiredRoutes.forEach(route => {
    const routePath = path.join(newDir, route, 'route.ts');
    if (!fs.existsSync(routePath)) {
      missingRoutes.push(route);
      console.log(`❌ Route manquante: /api/${route}`);
    } else {
      console.log(`✅ Route existante: /api/${route}`);
    }
  });
  
  return missingRoutes;
}

// ====================================
// NOUVEAUTÉ: GÉNÉRATION INTELLIGENTE DES ROUTES MANQUANTES
// ====================================

function generateMissingRoutes(missingRoutes) {
  if (missingRoutes.length === 0) {
    console.log('✅ Toutes les routes API sont présentes !');
    return true;
  }
  
  console.log(`🔧 Génération de ${missingRoutes.length} route(s) manquante(s)...`);
  
  // Appeler le script de génération des routes API amélioré
  const generateApiScript = path.join(__dirname, 'generateApiRoutes.js');
  
  if (!fs.existsSync(generateApiScript)) {
    console.error('❌ Script generateApiRoutes.js introuvable');
    return false;
  }
  
  try {
    console.log('🚀 Exécution de generateApiRoutes.js amélioré...');
    execSync(`node "${generateApiScript}"`, { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    
    // Vérifier que les routes ont été créées
    let allCreated = true;
    missingRoutes.forEach(route => {
      const routePath = path.join(newDir, route, 'route.ts');
      if (fs.existsSync(routePath)) {
        console.log(`✅ Route créée: /api/${route}`);
      } else {
        console.log(`❌ Échec création: /api/${route}`);
        allCreated = false;
      }
    });
    
    return allCreated;
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération des routes:', error.message);
    return false;
  }
}

// ====================================
// NOUVEAUTÉ: VALIDATION DE LA STRUCTURE API
// ====================================

function validateApiStructure() {
  console.log('🔍 Validation de la structure API...');
  
  if (!fs.existsSync(newDir)) {
    console.log('❌ Dossier /src/app/api manquant');
    return false;
  }
  
  const routeFiles = [];
  
  // Scanner récursivement pour trouver tous les route.ts
  function scanForRoutes(dir) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanForRoutes(fullPath);
      } else if (entry.name === 'route.ts') {
        const relativePath = path.relative(newDir, fullPath);
        const routeName = path.dirname(relativePath);
        routeFiles.push(routeName);
      }
    });
  }
  
  scanForRoutes(newDir);
  
  console.log(`📊 ${routeFiles.length} route(s) API trouvée(s):`);
  routeFiles.forEach(route => {
    console.log(`   ✅ /api/${route}`);
  });
  
  // Vérifier les routes critiques
  const criticalRoutes = ['auth', 'status'];
  const missingCritical = criticalRoutes.filter(route => !routeFiles.includes(route));
  
  if (missingCritical.length > 0) {
    console.log(`⚠️  Routes critiques manquantes: ${missingCritical.join(', ')}`);
    return false;
  }
  
  return routeFiles.length > 0;
}

// ====================================
// FONCTION PRINCIPALE AMÉLIORÉE
// ====================================

function fixApiFolder() {
  console.log('🚀 Fix API Folder - Processus intelligent...\n');
  
  // ÉTAPE 1: Déplacer les fichiers existants (GARDE)
  console.log('📁 ÉTAPE 1: Déplacement des fichiers api-custom...');
  const filesMoved = moveFiles();
  
  if (filesMoved) {
    console.log('✅ Fichiers déplacés avec succès');
  } else {
    console.log('⏭️  Aucun fichier à déplacer');
  }
  
  // ÉTAPE 2: Détecter les routes manquantes (NOUVEAUTÉ)
  console.log('\n🔍 ÉTAPE 2: Détection des routes manquantes...');
  const missingRoutes = detectMissingRoutes();
  
  // ÉTAPE 3: Générer les routes manquantes (NOUVEAUTÉ)
  console.log('\n🔧 ÉTAPE 3: Génération intelligente des routes...');
  const allGenerated = generateMissingRoutes(missingRoutes);
  
  // ÉTAPE 4: Validation finale (NOUVEAUTÉ)
  console.log('\n✅ ÉTAPE 4: Validation de la structure...');
  const structureValid = validateApiStructure();
  
  // RÉSUMÉ FINAL
  console.log('\n' + '='.repeat(50));
  console.log('📊 RÉSUMÉ FIX API FOLDER:');
  console.log('='.repeat(50));
  console.log(`📁 Fichiers déplacés: ${filesMoved ? 'OUI' : 'NON'}`);
  console.log(`🔧 Routes générées: ${allGenerated ? 'OUI' : 'NON'}`);
  console.log(`✅ Structure valide: ${structureValid ? 'OUI' : 'NON'}`);
  
  if (structureValid) {
    console.log('\n🎉 FIX API FOLDER RÉUSSI !');
    console.log('🔗 Structure API complète et fonctionnelle');
    console.log('📡 Routes accessibles sur http://localhost:3000/api/*');
  } else {
    console.log('\n⚠️  FIX API FOLDER PARTIEL');
    console.log('💡 Vérifiez manuellement la structure /src/app/api/');
  }
  
  return structureValid;
}

// ====================================
// EXÉCUTION SI SCRIPT APPELÉ DIRECTEMENT
// ====================================

if (require.main === module) {
  try {
    const success = fixApiFolder();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Erreur critique dans fixApiFolder:', error.message);
    process.exit(1);
  }
}

module.exports = { fixApiFolder, detectMissingRoutes, generateMissingRoutes };