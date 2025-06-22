const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 CORRECTEUR GÉNÉRIQUE - Exports manquants');

class GenericMissingExportsFixer {
  constructor() {
    this.srcDir = path.join(__dirname, '../src');
    this.servicePath = path.join(__dirname, '../src/lib/prisma-service.ts');
  }

  // ====================================
  // EXTRACTION DYNAMIQUE DES IMPORTS MANQUANTS
  // ====================================
  
  extractMissingImportsFromErrors() {
    console.log('🔍 Extraction des imports manquants depuis les erreurs...');
    
    try {
      execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
      return []; // Pas d'erreurs
    } catch (error) {
      const output = error.stdout ? error.stdout.toString() : error.stderr.toString();
      return this.parseMissingExports(output);
    }
  }
  
  parseMissingExports(output) {
    const missingExports = [];
    const lines = output.split('\n');
    
    lines.forEach(line => {
      // Pattern: Module '"@/lib/prisma-service"' has no exported member 'updateHost'
      const match = line.match(/Module\s+['"]([^'"]+)['"]\s+has no exported member\s+['"]([^'"]+)['"]/);
      if (match) {
        missingExports.push({
          module: match[1],
          member: match[2]
        });
      }
    });
    
    console.log(`📊 ${missingExports.length} export(s) manquant(s) détecté(s):`);
    missingExports.forEach(exp => {
      console.log(`  - ${exp.member} depuis ${exp.module}`);
    });
    
    return missingExports;
  }

  // ====================================
  // ANALYSE GÉNÉRIQUE DU SERVICE PRISMA
  // ====================================
  
  analyzePrismaService() {
    if (!fs.existsSync(this.servicePath)) {
      console.error('❌ prisma-service.ts introuvable');
      return { functions: [], models: [], patterns: {} };
    }
    
    const content = fs.readFileSync(this.servicePath, 'utf-8');
    const functions = [];
    const models = new Set();
    const patterns = {};
    
    // Extraire toutes les fonctions
    const functionRegex = /export\s+(?:async\s+)?(?:function|const)\s+(\w+)/g;
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    
    // Détecter les modèles et patterns
    functions.forEach(func => {
      // Pattern getAll[Model]s
      const getAllMatch = func.match(/^getAll(\w+)s$/);
      if (getAllMatch) {
        const model = getAllMatch[1];
        models.add(model);
        
        if (!patterns[model]) patterns[model] = {};
        patterns[model].getAll = func;
      }
      
      // Pattern create[Model]
      const createMatch = func.match(/^create(\w+)$/);
      if (createMatch) {
        const model = createMatch[1];
        models.add(model);
        
        if (!patterns[model]) patterns[model] = {};
        patterns[model].create = func;
      }
      
      // Pattern update[Model]
      const updateMatch = func.match(/^update(\w+)$/);
      if (updateMatch) {
        const model = updateMatch[1];
        models.add(model);
        
        if (!patterns[model]) patterns[model] = {};
        patterns[model].update = func;
      }
      
      // Pattern delete[Model]
      const deleteMatch = func.match(/^delete(\w+)$/);
      if (deleteMatch) {
        const model = deleteMatch[1];
        models.add(model);
        
        if (!patterns[model]) patterns[model] = {};
        patterns[model].delete = func;
      }
      
      // Pattern get[Model]ById
      const getByIdMatch = func.match(/^get(\w+)ById$/);
      if (getByIdMatch) {
        const model = getByIdMatch[1];
        models.add(model);
        
        if (!patterns[model]) patterns[model] = {};
        patterns[model].getById = func;
      }
    });
    
    console.log(`📋 Analyse prisma-service: ${functions.length} fonctions, ${models.size} modèles`);
    console.log(`📊 Modèles: ${Array.from(models).join(', ')}`);
    
    return { functions, models: Array.from(models), patterns };
  }

  // ====================================
  // GÉNÉRATION INTELLIGENTE DES EXPORTS MANQUANTS
  // ====================================
  
  generateMissingExport(missingMember, analysis) {
    console.log(`🔧 Génération intelligente: ${missingMember}...`);
    
    const { functions, models, patterns } = analysis;
    
    // Stratégie 1: Chercher une fonction exacte mais avec pattern différent
    for (const model of models) {
      const modelPatterns = patterns[model] || {};
      
      // update[Model] manquant
      if (missingMember === `update${model}` && !functions.includes(`update${model}`)) {
        if (modelPatterns.create) {
          return this.generateUpdateFunction(model, modelPatterns.create);
        }
      }
      
      // delete[Model] manquant
      if (missingMember === `delete${model}` && !functions.includes(`delete${model}`)) {
        if (modelPatterns.create) {
          return this.generateDeleteFunction(model);
        }
      }
      
      // add[Model] manquant mais create[Model] existe
      if (missingMember === `add${model}` && modelPatterns.create) {
        return `export const add${model} = create${model};`;
      }
      
      // get[Model]s manquant mais getAll[Model]s existe
      if (missingMember === `get${model}s` && modelPatterns.getAll) {
        return `export const get${model}s = getAll${model}s;`;
      }
    }
    
    // Stratégie 2: Inférer le modèle depuis le nom de fonction
    const inferredModel = this.inferModelFromFunction(missingMember);
    if (inferredModel && models.includes(inferredModel)) {
      const modelPatterns = patterns[inferredModel] || {};
      
      if (missingMember.startsWith('update') && modelPatterns.create) {
        return this.generateUpdateFunction(inferredModel, modelPatterns.create);
      }
      
      if (missingMember.startsWith('delete')) {
        return this.generateDeleteFunction(inferredModel);
      }
      
      if (missingMember.startsWith('add') && modelPatterns.create) {
        return `export const ${missingMember} = create${inferredModel};`;
      }
    }
    
    // Stratégie 3: Alias générique si fonction similaire existe
    const similarFunction = functions.find(func => 
      func.toLowerCase().includes(missingMember.toLowerCase()) ||
      missingMember.toLowerCase().includes(func.toLowerCase())
    );
    
    if (similarFunction) {
      return `export const ${missingMember} = ${similarFunction};`;
    }
    
    console.log(`⚠️  Impossible de générer: ${missingMember}`);
    return null;
  }
  
  inferModelFromFunction(functionName) {
    // updateHost → Host
    // deleteUser → User
    // addClient → Client
    const patterns = [
      { regex: /^update(\w+)$/, model: 1 },
      { regex: /^delete(\w+)$/, model: 1 },
      { regex: /^add(\w+)$/, model: 1 },
      { regex: /^get(\w+)s?$/, model: 1 }
    ];
    
    for (const pattern of patterns) {
      const match = functionName.match(pattern.regex);
      if (match) {
        return match[pattern.model];
      }
    }
    
    return null;
  }
  
  generateUpdateFunction(model, createFunctionTemplate) {
    const camelModel = model.charAt(0).toLowerCase() + model.slice(1);
    
    return `export async function update${model}(id: number, data: any) {
  try {
    const cleanData = { ...data };
    delete cleanData.id;
    delete cleanData.createdAt;
    delete cleanData.updatedAt;
    
    return await prisma.${camelModel}.update({
      where: { id: id },
      data: cleanData
    });
  } catch (error) {
    console.error("Erreur update${model}:", error);
    throw error;
  }
}`;
  }
  
  generateDeleteFunction(model) {
    const camelModel = model.charAt(0).toLowerCase() + model.slice(1);
    
    return `export async function delete${model}(id: number) {
  try {
    return await prisma.${camelModel}.delete({
      where: { id: id }
    });
  } catch (error) {
    console.error("Erreur delete${model}:", error);
    throw error;
  }
}`;
  }

  // ====================================
  // APPLICATION DES CORRECTIONS
  // ====================================
  
  applyMissingExports(missingExports, analysis) {
    if (missingExports.length === 0) return false;
    
    let content = fs.readFileSync(this.servicePath, 'utf-8');
    const generatedExports = [];
    
    missingExports.forEach(missing => {
      if (missing.module.includes('prisma-service')) {
        const generatedExport = this.generateMissingExport(missing.member, analysis);
        if (generatedExport) {
          generatedExports.push(generatedExport);
          console.log(`  ✅ Généré: ${missing.member}`);
        }
      }
    });
    
    if (generatedExports.length > 0) {
      // Ajouter les exports générés
      if (!content.includes('// EXPORTS GÉNÉRÉS AUTOMATIQUEMENT')) {
        content += '\n// EXPORTS GÉNÉRÉS AUTOMATIQUEMENT\n';
      }
      
      generatedExports.forEach(exportCode => {
        if (!content.includes(exportCode.split('\n')[0])) {
          content += exportCode + '\n\n';
        }
      });
      
      fs.writeFileSync(this.servicePath, content, 'utf-8');
      console.log(`💾 ${generatedExports.length} export(s) ajouté(s) à prisma-service.ts`);
      return true;
    }
    
    return false;
  }

  // ====================================
  // EXÉCUTION PRINCIPALE
  // ====================================
  
  async fixAllMissingExports() {
    console.log('🚀 Correction générique des exports manquants...\n');
    
    // 1. Détecter les exports manquants depuis les erreurs
    const missingExports = this.extractMissingImportsFromErrors();
    
    if (missingExports.length === 0) {
      console.log('✅ Aucun export manquant détecté !');
      return true;
    }
    
    // 2. Analyser le service Prisma
    const analysis = this.analyzePrismaService();
    
    // 3. Générer et appliquer les corrections
    const applied = this.applyMissingExports(missingExports, analysis);
    
    if (!applied) {
      console.log('❌ Aucune correction générée');
      return false;
    }
    
    // 4. Test final
    console.log('\n🔍 Test après corrections...');
    try {
      execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
      console.log('🎉 BUILD RÉUSSI ! Tous les exports sont corrigés.');
      return true;
    } catch (error) {
      console.log('⚠️  Il reste des erreurs après correction des exports');
      return false;
    }
  }
}

// ====================================
// EXÉCUTION
// ====================================

if (require.main === module) {
  (async () => {
    try {
      const fixer = new GenericMissingExportsFixer();
      const success = await fixer.fixAllMissingExports();
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('❌ Erreur critique:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = GenericMissingExportsFixer;
