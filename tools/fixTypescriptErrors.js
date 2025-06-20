const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Résolveur d\'erreurs ENTIÈREMENT DYNAMIQUE...');

class DynamicErrorResolver {
  constructor() {
    this.srcDir = path.join(__dirname, '../src');
    this.servicePath = path.join(__dirname, '../src/lib/prisma-service.ts');
    this.errors = [];
    this.fixes = [];
  }

  // ====================================
  // EXTRACTION DYNAMIQUE DES ERREURS
  // ====================================
  
  extractCompilationErrors() {
    console.log('🔍 Extraction des erreurs de compilation...');
    
    try {
      // Lancer une compilation pour capturer les erreurs
      execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
      console.log('✅ Aucune erreur détectée');
      return [];
    } catch (error) {
      const output = error.stdout ? error.stdout.toString() : error.stderr.toString();
      return this.parseTypeScriptErrors(output);
    }
  }
  
  parseTypeScriptErrors(output) {
    const errors = [];
    const lines = output.split('\n');
    
    let currentError = null;
    
    lines.forEach(line => {
      // Détecter début d'erreur TypeScript
      const errorMatch = line.match(/^(.+\.tsx?):(\d+):(\d+)$/);
      if (errorMatch) {
        if (currentError) errors.push(currentError);
        currentError = {
          file: errorMatch[1],
          line: parseInt(errorMatch[2]),
          column: parseInt(errorMatch[3]),
          type: 'unknown',
          details: []
        };
      }
      
      // Type d'erreur
      if (line.includes('Type error:') && currentError) {
        currentError.type = 'type_error';
        currentError.message = line.replace('Type error:', '').trim();
      }
      
      // Erreur d'import manquant
      if (line.includes('has no exported member') && currentError) {
        currentError.type = 'missing_export';
        const memberMatch = line.match(/'([^']+)'/g);
        if (memberMatch && memberMatch.length >= 2) {
          currentError.missingMember = memberMatch[1].replace(/'/g, '');
          currentError.module = memberMatch[0].replace(/'/g, '');
        }
      }
      
      // Erreur de variable non trouvée
      if (line.includes('Cannot find name') && currentError) {
        currentError.type = 'undefined_variable';
        const varMatch = line.match(/Cannot find name '([^']+)'/);
        if (varMatch) {
          currentError.undefinedVar = varMatch[1];
          const suggestionMatch = line.match(/Did you mean '([^']+)'/);
          if (suggestionMatch) {
            currentError.suggestion = suggestionMatch[1];
          }
        }
      }
      
      // Conflit de variable
      if (line.includes('Duplicate identifier') && currentError) {
        currentError.type = 'duplicate_identifier';
        const dupMatch = line.match(/Duplicate identifier '([^']+)'/);
        if (dupMatch) {
          currentError.duplicateVar = dupMatch[1];
        }
      }
      
      if (currentError) {
        currentError.details.push(line);
      }
    });
    
    if (currentError) errors.push(currentError);
    
    console.log(`📊 ${errors.length} erreur(s) détectée(s)`);
    errors.forEach(err => {
      console.log(`  - ${err.type}: ${err.file}:${err.line}`);
    });
    
    return errors;
  }

  // ====================================
  // ANALYSE DYNAMIQUE DES FICHIERS
  // ====================================
  
  analyzeFileImports(filePath) {
    if (!fs.existsSync(filePath)) return { imports: [], exports: [] };
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports = [];
    const exports = [];
    
    // Extraire tous les imports
    const importRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importedItems = match[1].split(',').map(item => {
        const trimmed = item.trim();
        const aliasMatch = trimmed.match(/(\w+)\s+as\s+(\w+)/);
        return aliasMatch ? 
          { original: aliasMatch[1], alias: aliasMatch[2] } : 
          { original: trimmed, alias: trimmed };
      });
      
      imports.push({
        module: match[2],
        items: importedItems
      });
    }
    
    // Extraire tous les exports
    const exportRegex = /export\s+(?:async\s+)?(?:function|const|class)\s+(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    return { imports, exports };
  }
  
  analyzePrismaService() {
    console.log('📋 Analyse dynamique de prisma-service.ts...');
    
    if (!fs.existsSync(this.servicePath)) {
      console.error('❌ prisma-service.ts introuvable');
      return { functions: [], models: [] };
    }
    
    const content = fs.readFileSync(this.servicePath, 'utf-8');
    const functions = [];
    const models = new Set();
    
    // Extraire toutes les fonctions exportées
    const functionRegex = /export\s+(?:async\s+)?(?:function|const)\s+(\w+)/g;
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    
    // Détecter les modèles depuis les patterns getAll[Model]s
    functions.forEach(func => {
      const getAllMatch = func.match(/^getAll(\w+)s$/);
      if (getAllMatch) {
        models.add(getAllMatch[1]);
      }
    });
    
    console.log(`  📊 ${functions.length} fonctions, ${models.size} modèles`);
    console.log(`  📋 Modèles: ${Array.from(models).join(', ')}`);
    
    return { functions, models: Array.from(models) };
  }

  // ====================================
  // RÉSOLUTION DYNAMIQUE DES ERREURS
  // ====================================
  
  resolveMissingExportError(error) {
    console.log(`🔧 Résolution: ${error.missingMember} manquant...`);
    
    if (!error.module.includes('prisma-service')) return false;
    
    const { functions, models } = this.analyzePrismaService();
    const missingMember = error.missingMember;
    
    // Stratégies de résolution intelligente
    let resolvedFunction = null;
    
    // 1. Chercher une fonction similaire
    const similarFunction = functions.find(func => 
      func.toLowerCase().includes(missingMember.toLowerCase()) ||
      missingMember.toLowerCase().includes(func.toLowerCase())
    );
    
    if (similarFunction) {
      resolvedFunction = similarFunction;
      console.log(`  💡 Fonction similaire trouvée: ${similarFunction}`);
    }
    
    // 2. Déduire depuis les patterns de modèles
    if (!resolvedFunction) {
      for (const model of models) {
        const patterns = [
          { pattern: `update${model}`, alternatives: [`update${model}`] },
          { pattern: `delete${model}`, alternatives: [`delete${model}`] },
          { pattern: `add${model}`, alternatives: [`create${model}`, `add${model}`] },
          { pattern: `get${model}ById`, alternatives: [`get${model}ById`] }
        ];
        
        const matchingPattern = patterns.find(p => p.pattern === missingMember);
        if (matchingPattern) {
          const availableAlternative = matchingPattern.alternatives.find(alt => 
            functions.includes(alt)
          );
          
          if (availableAlternative) {
            resolvedFunction = availableAlternative;
            console.log(`  🎯 Pattern résolu: ${missingMember} → ${availableAlternative}`);
            break;
          }
        }
      }
    }
    
    // 3. Générer l'alias automatiquement
    if (resolvedFunction && resolvedFunction !== missingMember) {
      return this.addAliasToPrismaService(missingMember, resolvedFunction);
    }
    
    return false;
  }
  
  resolveUndefinedVariableError(error) {
    console.log(`🔧 Résolution variable non définie: ${error.undefinedVar}...`);
    
    if (!fs.existsSync(error.file)) return false;
    
    let content = fs.readFileSync(error.file, 'utf-8');
    const lines = content.split('\n');
    
    // Si une suggestion existe, l'appliquer
    if (error.suggestion) {
      console.log(`  💡 Application suggestion: ${error.undefinedVar} → ${error.suggestion}`);
      
      // Remplacer toutes les occurrences
      const newContent = content.replace(
        new RegExp(`\\b${error.undefinedVar}\\b`, 'g'), 
        error.suggestion
      );
      
      if (newContent !== content) {
        fs.writeFileSync(error.file, newContent, 'utf-8');
        console.log(`  ✅ Variable corrigée dans ${path.relative(this.srcDir, error.file)}`);
        return true;
      }
    }
    
    return false;
  }
  
  resolveDuplicateIdentifierError(error) {
    console.log(`🔧 Résolution conflit: ${error.duplicateVar}...`);
    
    if (!fs.existsSync(error.file)) return false;
    
    let content = fs.readFileSync(error.file, 'utf-8');
    const lines = content.split('\n');
    
    // Stratégie: renommer la deuxième occurrence
    let firstOccurrence = -1;
    let secondOccurrence = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(error.duplicateVar)) {
        if (firstOccurrence === -1) {
          firstOccurrence = i;
        } else if (secondOccurrence === -1) {
          secondOccurrence = i;
          break;
        }
      }
    }
    
    if (secondOccurrence !== -1) {
      const newVarName = error.duplicateVar + 'State';
      
      // Renommer dans useState: const [loading, ...] → const [loadingState, ...]
      if (lines[secondOccurrence].includes('useState')) {
        lines[secondOccurrence] = lines[secondOccurrence].replace(
          new RegExp(`\\b${error.duplicateVar}\\b`),
          newVarName
        );
        
        // Remplacer toutes les utilisations suivantes
        for (let i = secondOccurrence + 1; i < lines.length; i++) {
          if (lines[i].includes(error.duplicateVar) && 
              !lines[i].includes('useAuth') && 
              !lines[i].includes('useState')) {
            lines[i] = lines[i].replace(
              new RegExp(`\\b${error.duplicateVar}\\b`, 'g'),
              newVarName
            );
          }
        }
        
        const newContent = lines.join('\n');
        fs.writeFileSync(error.file, newContent, 'utf-8');
        console.log(`  ✅ Conflit résolu: ${error.duplicateVar} → ${newVarName}`);
        return true;
      }
    }
    
    return false;
  }
  
  addAliasToPrismaService(aliasName, targetFunction) {
    console.log(`🔗 Ajout alias: ${aliasName} → ${targetFunction}`);
    
    let content = fs.readFileSync(this.servicePath, 'utf-8');
    
    // Vérifier si l'alias existe déjà
    if (content.includes(`export const ${aliasName}`)) {
      console.log('  ⏭️  Alias déjà présent');
      return true;
    }
    
    // Ajouter l'alias à la fin
    const aliasLine = `export const ${aliasName} = ${targetFunction};`;
    
    if (!content.includes('// ALIASES DYNAMIQUES')) {
      content += '\n// ALIASES DYNAMIQUES GÉNÉRÉS AUTOMATIQUEMENT\n';
    }
    
    content += aliasLine + '\n';
    
    fs.writeFileSync(this.servicePath, content, 'utf-8');
    console.log(`  ✅ Alias ajouté à prisma-service.ts`);
    
    return true;
  }

  // ====================================
  // EXÉCUTION PRINCIPALE
  // ====================================
  
  async resolveAllErrors() {
    console.log('🚀 Démarrage résolution automatique...\n');
    
    // 1. Extraire toutes les erreurs
    this.errors = this.extractCompilationErrors();
    
    if (this.errors.length === 0) {
      console.log('✅ Aucune erreur à résoudre !');
      return true;
    }
    
    // 2. Résoudre chaque erreur automatiquement
    let resolvedCount = 0;
    
    for (const error of this.errors) {
      console.log(`\n🔧 Traitement: ${error.type} dans ${path.relative(this.srcDir, error.file)}`);
      
      let resolved = false;
      
      switch (error.type) {
        case 'missing_export':
          resolved = this.resolveMissingExportError(error);
          break;
          
        case 'undefined_variable':
          resolved = this.resolveUndefinedVariableError(error);
          break;
          
        case 'duplicate_identifier':
          resolved = this.resolveDuplicateIdentifierError(error);
          break;
          
        default:
          console.log(`  ⚠️  Type d'erreur non géré: ${error.type}`);
      }
      
      if (resolved) {
        resolvedCount++;
        console.log(`  ✅ Erreur résolue automatiquement`);
      } else {
        console.log(`  ❌ Impossible de résoudre automatiquement`);
      }
    }
    
    console.log(`\n📊 Résolution terminée: ${resolvedCount}/${this.errors.length} erreur(s) résolue(s)`);
    
    // 3. Test final
    if (resolvedCount > 0) {
      console.log('\n🔍 Test de compilation final...');
      try {
        execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
        console.log('🎉 Build réussi ! Toutes les erreurs sont résolues.');
        return true;
      } catch (error) {
        console.log('⚠️  Il reste des erreurs après résolution automatique.');
        return false;
      }
    }
    
    return resolvedCount === this.errors.length;
  }
}

// ====================================
// EXÉCUTION SI SCRIPT APPELÉ DIRECTEMENT
// ====================================

if (require.main === module) {
  (async () => {
    try {
      console.log('🛡️ Initialisation résolveur d\'erreurs...');
      
      const resolver = new DynamicErrorResolver();
      const success = await resolver.resolveAllErrors();
      
      if (success) {
        console.log('\n🎉 RÉSOLUTION AUTOMATIQUE RÉUSSIE !');
        console.log('✅ Application prête pour le déploiement');
        process.exit(0);
      } else {
        console.log('\n⚠️  RÉSOLUTION PARTIELLE');
        console.log('📋 Certaines erreurs nécessitent une intervention manuelle');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('\n❌ ERREUR CRITIQUE dans le résolveur dynamique:');
      console.error(`Message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
      
      console.log('\n🔍 Diagnostic:');
      console.log('- Vérifiez que npm/node fonctionne correctement');
      console.log('- Vérifiez les permissions des fichiers');
      console.log('- Vérifiez que src/lib/prisma-service.ts existe');
      
      process.exit(1);
    }
  })();
}

module.exports = DynamicErrorResolver;
