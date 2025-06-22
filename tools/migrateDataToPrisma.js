const fs = require('fs');
const path = require('path');

console.log('🔄 Migration DYNAMIQUE des imports data.ts vers prisma-service.ts...');

const prismaServicePath = path.join(__dirname, '../src/lib/prisma-service.ts');

if (!fs.existsSync(prismaServicePath)) {
  console.error('❌ prisma-service.ts introuvable');
  process.exit(1);
}

// ====================================
// GÉNÉRATION DYNAMIQUE DU MAPPING
// ====================================

function generateDynamicMapping() {
  console.log('🔍 Génération DYNAMIQUE du mapping depuis prisma-service.ts...');
  
  try {
    const content = fs.readFileSync(prismaServicePath, 'utf-8');
    const mapping = {};
    
    // ✅ REGEX AMÉLIORÉES
    const functionRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
    const constRegex = /export\s+const\s+(\w+)\s*=\s*(\w+)[;\s]/g;
    
    const prismaFunctions = new Set();
    let match;
    
    // ✅ EXTRACTION ROBUSTE DES FONCTIONS
    while ((match = functionRegex.exec(content)) !== null) {
      prismaFunctions.add(match[1]);
      console.log(`  📝 Fonction: ${match[1]}`);
    }
    
    // Reset regex pour les alias
    constRegex.lastIndex = 0;
    while ((match = constRegex.exec(content)) !== null) {
      mapping[match[1]] = match[2];
      prismaFunctions.add(match[1]);
      console.log(`  🔗 Alias: ${match[1]} → ${match[2]}`);
    }
    
    console.log(`📊 ${prismaFunctions.size} fonctions détectées dans prisma-service.ts`);
    
    // ✅ GÉNÉRATION DE MAPPING CORRIGÉE
    prismaFunctions.forEach(func => {
      if (mapping[func]) return; // Déjà mappé via alias
      
      // Pattern: getAll + Model + s
      const getAllMatch = func.match(/^getAll(\w+)s$/);
      if (getAllMatch) {
        const model = getAllMatch[1];
        const pluralLower = model.toLowerCase() + 's';
        
        // ✅ CORRECTION - Éviter template literals imbriqués
        mapping['get' + pluralLower] = func;
        mapping['get' + model + 's'] = func;
        mapping['getAll' + model + 's'] = func;
        
        console.log(`  🔗 ${model}: get${pluralLower} → ${func}`);
      }
      
      // Pattern: create + Model
      const createMatch = func.match(/^create(\w+)$/);
      if (createMatch) {
        const model = createMatch[1];
        mapping['add' + model] = func;
        mapping['create' + model] = func;
        console.log(`  🔗 ${model}: add${model} → ${func}`);
      }
      
      // Autres patterns restent identiques
      if (func.startsWith('get') && func.endsWith('ById')) {
        mapping[func] = func;
      }
      
      if (func.startsWith('update') || func.startsWith('delete')) {
        mapping[func] = func;
      }
      
      if (func.includes('By') && !func.includes('ById')) {
        mapping[func] = func;
      }
    });
    
    return mapping;
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du mapping:', error.message);
    return {};
  }
}

// ✅ FONCTION COMPATIBLE POUR REMPLACER matchAll
function getAllMatches(str, regex) {
  const matches = [];
  let match;
  
  // Reset regex
  regex.lastIndex = 0;
  
  while ((match = regex.exec(str)) !== null) {
    matches.push(match);
    // Éviter boucle infinie si regex n'a pas le flag 'g'
    if (!regex.global) break;
  }
  
  return matches;
}

function migrateFileContent(content, functionMapping) {
  let changed = false;
  let newContent = content;
  
  try {
    // ✅ PATTERNS D'IMPORT AMÉLIORÉS
    const importPatterns = [
      /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]@\/lib\/data['"];?\s*/g,
      /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]\.\.?\/?.?\.?\/lib\/data['"];?\s*/g,
      /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]\.\/data['"];?\s*/g
    ];
    
    importPatterns.forEach(pattern => {
      // ✅ UTILISATION DE LA FONCTION COMPATIBLE
      const matches = getAllMatches(newContent, pattern);
      
      matches.forEach(match => {
        const importedFunctions = match[1]
          .split(',')
          .map(f => f.trim())
          .filter(f => f.length > 0);
        
        // Mapper les fonctions
        const mappedFunctions = importedFunctions.map(func => {
          const mapped = functionMapping[func];
          if (mapped && mapped !== func) {
            console.log(`    📝 ${func} → ${mapped}`);
          }
          return mapped || func;
        });
        
        // ✅ NOUVEL IMPORT SÉCURISÉ
        const newImport = `import { ${mappedFunctions.join(', ')} } from '@/lib/prisma-service';`;
        
        newContent = newContent.replace(match[0], newImport + '\n');
        changed = true;
        
        console.log(`  📝 Import modifié: ${importedFunctions.length} fonctions`);
      });
    });
    
    // ✅ REMPLACEMENT DE FONCTIONS PLUS SÉCURISÉ
    Object.entries(functionMapping).forEach(([oldFunc, newFunc]) => {
      if (oldFunc !== newFunc) {
        // Éviter les remplacements dans les commentaires et strings
        const lines = newContent.split('\n');
        let hasChanges = false;
        
        const processedLines = lines.map(line => {
          // Ignorer les commentaires
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
            return line;
          }
          
          // Remplacer seulement les appels de fonction
          const funcCallRegex = new RegExp(`\\b${escapeRegExp(oldFunc)}\\s*\\(`, 'g');
          if (funcCallRegex.test(line)) {
            hasChanges = true;
            return line.replace(funcCallRegex, `${newFunc}(`);
          }
          
          return line;
        });
        
        if (hasChanges) {
          newContent = processedLines.join('\n');
          changed = true;
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration du contenu:', error.message);
  }
  
  return { content: newContent, changed };
}

// ✅ FONCTION UTILITAIRE POUR ÉCHAPPER REGEX
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processDirectory(dirPath, functionMapping) {
  let totalChanges = 0;
  
  if (!fs.existsSync(dirPath)) {
    console.log(`⏭️ Répertoire ${dirPath} introuvable`);
    return totalChanges;
  }
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Éviter certains répertoires
        const skipDirs = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage'];
        if (!skipDirs.includes(entry.name)) {
          totalChanges += processDirectory(fullPath, functionMapping);
        }
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          // ✅ VÉRIFIER SI LE FICHIER CONTIENT DES IMPORTS DATA
          if (!content.includes('from \'@/lib/data\'') && 
              !content.includes('from "@/lib/data"') &&
              !content.includes('from \'./data\'') &&
              !content.includes('from "../lib/data"')) {
            return; // Pas d'import data, passer au suivant
          }
          
          const { content: newContent, changed } = migrateFileContent(content, functionMapping);
          
          if (changed) {
            fs.writeFileSync(fullPath, newContent, 'utf-8');
            console.log(`✅ Migré: ${path.relative(process.cwd(), fullPath)}`);
            totalChanges++;
          }
        } catch (error) {
          console.error(`❌ Erreur ${fullPath}:`, error.message);
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur lecture répertoire ${dirPath}:`, error.message);
  }
  
  return totalChanges;
}

// ====================================
// EXÉCUTION PRINCIPALE AVEC GESTION D'ERREURS
// ====================================

try {
  console.log('🔍 Génération du mapping dynamique...');
  const functionMapping = generateDynamicMapping();
  
  if (Object.keys(functionMapping).length === 0) {
    console.log('⏭️ Aucune fonction à mapper - Migration non nécessaire');
    process.exit(0);
  }
  
  console.log(`📊 ${Object.keys(functionMapping).length} mappings générés`);
  
  // ✅ AFFICHER LE MAPPING POUR DEBUG
  console.log('\n📋 Mapping généré:');
  Object.entries(functionMapping).forEach(([old, newFunc]) => {
    if (old !== newFunc) {
      console.log(`  ${old} → ${newFunc}`);
    }
  });
  
  // Traiter tous les répertoires source
  const dirsToProcess = [
    path.join(__dirname, '../src/app'),
    path.join(__dirname, '../src/components'), 
    path.join(__dirname, '../src/pages'),
    path.join(__dirname, '../src/lib')
  ];
  
  let totalChanges = 0;
  
  dirsToProcess.forEach(dir => {
    const dirName = path.basename(dir);
    console.log(`\n🔍 Traitement: ${dirName}/`);
    const changes = processDirectory(dir, functionMapping);
    totalChanges += changes;
    console.log(`  📊 ${changes} fichier(s) modifié(s) dans ${dirName}/`);
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (totalChanges > 0) {
    console.log(`✅ Migration DYNAMIQUE terminée: ${totalChanges} fichier(s) modifié(s)`);
    console.log('\n📋 Actions effectuées:');
    console.log('   ✓ Analyse automatique de prisma-service.ts');
    console.log('   ✓ Mapping intelligent des fonctions');
    console.log('   ✓ Remplacement imports @/lib/data → @/lib/prisma-service');
    console.log('   ✓ Migration sécurisée des appels de fonctions');
    console.log('\n🚀 Votre application utilise maintenant Prisma !');
  } else {
    console.log('✅ Tous les fichiers sont déjà à jour');
    console.log('💡 Aucun import @/lib/data trouvé dans le projet');
  }
  
} catch (error) {
  console.error('❌ Erreur critique lors de la migration:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
