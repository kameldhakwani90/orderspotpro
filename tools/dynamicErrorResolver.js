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
    
    // Générer aliases manquants
    const aliasesToAdd = [];
    
    // addHost = createHost si createHost existe mais pas addHost
    if (functions.includes('createHost') && !functions.includes('addHost')) {
      aliasesToAdd.push('export const addHost = createHost;');
    }
    
    if (functions.includes('createUser') && !functions.includes('addUser')) {
      aliasesToAdd.push('export const addUser = createUser;');
    }
    
    // Ajouter tous les aliases create → add
    functions.forEach(func => {
      if (func.startsWith('create') && !func.includes('create')) {
        const modelName = func.replace('create', '');
        const addFunction = 'add' + modelName;
        if (!functions.includes(addFunction)) {
          aliasesToAdd.push(`export const ${addFunction} = ${func};`);
        }
      }
    });
    
    if (aliasesToAdd.length > 0 && !content.includes('// ALIASES AUTOMATIQUES')) {
      content += '\n// ALIASES AUTOMATIQUES\n' + aliasesToAdd.join('\n') + '\n';
      fs.writeFileSync(servicePath, content, 'utf-8');
      console.log(`  ✅ ${aliasesToAdd.length} alias ajoutés`);
      return true;
    }
    
  } catch (error) {
    console.log('  ⚠️  Erreur:', error.message);
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
