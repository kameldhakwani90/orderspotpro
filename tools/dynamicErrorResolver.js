const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Résolveur d\'erreurs ENTIÈREMENT DYNAMIQUE...');

// Résolution immédiate de l'erreur isLoading
function quickFixIsLoadingError() {
  console.log('🎯 Correction rapide: isLoading → loading...');
  
  const srcDir = path.join(__dirname, '../src');
  let fixedFiles = 0;
  
  function scanAndFix(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !['node_modules', '.git', '.next'].includes(entry.name)) {
        scanAndFix(fullPath);
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
        let content = fs.readFileSync(fullPath, 'utf-8');
        const originalContent = content;
        
        // 1. Corriger dans la destructuration useAuth
        content = content.replace(
          /(const\s*\{\s*[^}]*?)isLoading([^}]*\}\s*=\s*useAuth\(\))/g,
          '$1loading$2'
        );
        
        // 2. Corriger toutes les utilisations de isLoading
        content = content.replace(/\bisLoading\b/g, 'loading');
        
        // 3. Résoudre les conflits de variables
        const lines = content.split('\n');
        const authVars = new Set();
        const stateVars = new Set();
        
        // Détecter variables useAuth et useState
        lines.forEach(line => {
          const authMatch = line.match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*useAuth\(\)/);
          if (authMatch) {
            authMatch[1].split(',').forEach(v => {
              const varName = v.trim().split(':').pop().trim();
              authVars.add(varName);
            });
          }
          
          const stateMatch = line.match(/const\s*\[\s*(\w+)\s*,/);
          if (stateMatch) {
            stateVars.add(stateMatch[1]);
          }
        });
        
        // Résoudre conflits
        const conflicts = [...authVars].filter(v => stateVars.has(v));
        conflicts.forEach(conflictVar => {
          const newVarName = conflictVar + 'State';
          
          // Renommer la variable useState
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('useState') && lines[i].includes(`[${conflictVar},`)) {
              lines[i] = lines[i].replace(
                new RegExp(`\\[\\s*${conflictVar}\\s*,\\s*(\\w+)\\s*\\]`),
                `[${newVarName}, $1]`
              );
              
              // Remplacer les utilisations suivantes
              for (let j = i + 1; j < lines.length; j++) {
                if (lines[j].includes(conflictVar) && 
                    !lines[j].includes('useAuth') && 
                    !lines[j].includes('useState')) {
                  lines[j] = lines[j].replace(new RegExp(`\\b${conflictVar}\\b`, 'g'), newVarName);
                }
              }
            }
          }
        });
        
        content = lines.join('\n');
        
        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content, 'utf-8');
          fixedFiles++;
          console.log(`  ✅ ${path.relative(srcDir, fullPath)}`);
        }
      }
    });
  }
  
  scanAndFix(srcDir);
  console.log(`✅ ${fixedFiles} fichier(s) corrigé(s)`);
  return fixedFiles > 0;
}

// Correction des exports manquants
function fixMissingExports() {
  console.log('🔧 Correction exports manquants...');
  
  const servicePath = path.join(__dirname, '../src/lib/prisma-service.ts');
  if (!fs.existsSync(servicePath)) return false;
  
  try {
    let content = fs.readFileSync(servicePath, 'utf-8');
    
    // Extraire les fonctions existantes
    const functions = [];
    const functionRegex = /export\s+(?:async\s+)?(?:function|const)\s+(\w+)/g;
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    
    console.log('📋 Fonctions existantes:', functions.slice(0, 10).join(', ') + '...');
    
    // Détecter les modèles depuis getAll[Model]s
    const models = new Set();
    functions.forEach(func => {
      const getAllMatch = func.match(/^getAll(\w+)s$/);
      if (getAllMatch) {
        models.add(getAllMatch[1]);
      }
    });
    
    console.log('📊 Modèles détectés:', Array.from(models).join(', '));
    
    // Générer TOUS les aliases nécessaires pour chaque modèle
    const aliasesToAdd = [];
    
    models.forEach(modelName => {
      const expectedFunctions = [
        { expected: `update${modelName}`, actual: `update${modelName}` },
        { expected: `delete${modelName}`, actual: `delete${modelName}` },
        { expected: `add${modelName}`, actual: `create${modelName}` },
        { expected: `get${modelName}ById`, actual: `get${modelName}ById` }
      ];
      
      expectedFunctions.forEach(({ expected, actual }) => {
        // Si la fonction attendue n'existe pas mais l'actuelle oui
        if (!functions.includes(expected) && functions.includes(actual)) {
          aliasesToAdd.push(`export const ${expected} = ${actual};`);
          console.log(`  🔗 Alias généré: ${expected} → ${actual}`);
        }
      });
    });
    
    // Ajouter les aliases au service
    if (aliasesToAdd.length > 0) {
      if (!content.includes('// ALIASES AUTOMATIQUES GÉNÉRÉS')) {
        content += '\n// ALIASES AUTOMATIQUES GÉNÉRÉS\n';
      }
      
      // Éviter les doublons
      aliasesToAdd.forEach(alias => {
        if (!content.includes(alias)) {
          content += alias + '\n';
        }
      });
      
      fs.writeFileSync(servicePath, content, 'utf-8');
      console.log(`  ✅ ${aliasesToAdd.length} alias ajoutés à prisma-service.ts`);
      return true;
    } else {
      console.log('  ⏭️  Tous les exports sont déjà présents');
    }
    
  } catch (error) {
    console.log('  ❌ Erreur:', error.message);
  }
  
  return false;
}

// Test de compilation
function testCompilation() {
  console.log('🔍 Test de compilation...');
  
  try {
    execSync('npm run build', { 
      cwd: path.join(__dirname, '..'), 
      stdio: 'pipe' 
    });
    console.log('✅ Build réussi !');
    return true;
  } catch (error) {
    const output = error.stdout ? error.stdout.toString() : error.stderr.toString();
    console.log('❌ Erreurs restantes:');
    
    // Afficher seulement les premières erreurs
    const lines = output.split('\n');
    const errorLines = lines.filter(line => 
      line.includes('Type error:') || 
      line.includes('Property') ||
      line.includes('Cannot find')
    ).slice(0, 3);
    
    errorLines.forEach(line => console.log('  ', line));
    
    return false;
  }
}

// Exécution principale
(async () => {
  try {
    console.log('🛡️ Résolution rapide des erreurs courantes...\n');
    
    // 1. Correction rapide isLoading
    const fixedIsLoading = quickFixIsLoadingError();
    
    // 2. Correction exports
    const fixedExports = fixMissingExports();
    
    // 3. Test final
    if (fixedIsLoading || fixedExports) {
      console.log('\n🔍 Test après corrections...');
      const success = testCompilation();
      
      if (success) {
        console.log('\n🎉 TOUTES LES ERREURS RÉSOLUES !');
        process.exit(0);
      } else {
        console.log('\n⚠️  Il reste des erreurs à résoudre manuellement');
        process.exit(1);
      }
    } else {
      console.log('\n⏭️  Aucune correction nécessaire');
      const success = testCompilation();
      process.exit(success ? 0 : 1);
    }
    
  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE:', error.message);
    process.exit(1);
  }
})();
