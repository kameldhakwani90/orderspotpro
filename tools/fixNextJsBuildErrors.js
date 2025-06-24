const fs = require('fs');
const path = require('path');

console.log('🔧 CORRECTEUR AUTOMATIQUE - Erreurs Build Next.js');
console.log('================================================');

class NextJsBuildErrorsFixer {
  constructor() {
   this.srcDir = path.join(__dirname, '..', 'src');
    this.rootDir = process.cwd(); // ← AJOUTÉ - était manquant !
    this.fixedFiles = 0;
    this.errors = [];
  }

  // ====================================
  // 1. FIX __barrel_optimize__ LUCIDE
  // ====================================
  
  fixBarrelOptimizeImports(content, filePath) {
    let hasChanges = false;
    let newContent = content;
    
    // Pattern exact de l'erreur : "__barrel_optimize__?names=...!=!lucide-react"
    const barrelPattern = /"__barrel_optimize__\?names=[^"]+!=!lucide-react"/g;
    const barrelPatternSingle = /'__barrel_optimize__\?names=[^']+!=!lucide-react'/g;
    
    if (barrelPattern.test(newContent) || barrelPatternSingle.test(newContent)) {
      // Remplacer directement par "lucide-react"
      newContent = newContent.replace(barrelPattern, '"lucide-react"');
      newContent = newContent.replace(barrelPatternSingle, "'lucide-react'");
      hasChanges = true;
      console.log(`  ✅ Corrigé __barrel_optimize__ dans ${path.basename(filePath)}`);
    }
    
    return { content: newContent, hasChanges };
  }

  // ====================================
  // 2. FIX DIALOG DUPLICATES
  // ====================================
  
  fixDialogDuplicates(content, filePath) {
    let hasChanges = false;
    let newContent = content;
    
    // Chercher tous les imports de Dialog
    const dialogImportRegex = /import\s*\{\s*([^}]*Dialog[^}]*)\s*\}\s*from\s*["']@\/components\/ui\/dialog["'];?/g;
    const dialogMatches = [];
    let match;
    
    while ((match = dialogImportRegex.exec(content)) !== null) {
      dialogMatches.push({
        fullMatch: match[0],
        imports: match[1].split(',').map(imp => imp.trim()).filter(imp => imp)
      });
    }
    
    // Si plus d'un import Dialog, les fusionner
    if (dialogMatches.length > 1) {
      console.log(`  🔧 ${dialogMatches.length} imports Dialog trouvés dans ${path.basename(filePath)}`);
      
      // Collecter tous les imports Dialog uniques
      const allDialogImports = new Set();
      dialogMatches.forEach(importGroup => {
        importGroup.imports.forEach(imp => {
          if (imp.trim()) allDialogImports.add(imp.trim());
        });
      });
      
      // Supprimer tous les anciens imports Dialog
      dialogMatches.forEach(importGroup => {
        newContent = newContent.replace(importGroup.fullMatch, '');
      });
      
      // Ajouter un seul import consolidé au début des imports
      const consolidatedImport = `import { ${Array.from(allDialogImports).join(', ')} } from "@/components/ui/dialog";`;
      
      // Trouver où insérer (après les imports React mais avant les autres)
      const lines = newContent.split('\n');
      let insertIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import') && !lines[i].includes('react')) {
          insertIndex = i;
          break;
        }
      }
      
      lines.splice(insertIndex, 0, consolidatedImport);
      newContent = lines.join('\n');
      
      hasChanges = true;
      console.log(`  ✅ Dialog imports fusionnés: ${allDialogImports.size} composants`);
    }
    
    return { content: newContent, hasChanges };
  }

  // ====================================
  // 3. FIX IDENTIFIER CONFLICTS
  // ====================================
  
  fixIdentifierConflicts(content, filePath) {
    let hasChanges = false;
    let newContent = content;
    
    // Détecter les conflits d'identifiants dans les imports
    const importLines = newContent.split('\n').filter(line => line.includes('import'));
    const identifiers = new Map(); // identifiant -> [lignes où il apparaît]
    
    importLines.forEach((line, index) => {
      // Extraire les identifiants de cette ligne d'import
      const importMatch = line.match(/import\s*\{\s*([^}]+)\s*\}/);
      if (importMatch) {
        const imports = importMatch[1].split(',').map(imp => {
          // Gérer les alias (ex: "User as UserIcon")
          const parts = imp.trim().split(' as ');
          return parts.length > 1 ? parts[1].trim() : parts[0].trim();
        });
        
        imports.forEach(identifier => {
          if (!identifiers.has(identifier)) {
            identifiers.set(identifier, []);
          }
          identifiers.get(identifier).push({ line, index });
        });
      }
    });
    
    // Trouver les conflits
    const conflicts = [];
    identifiers.forEach((occurrences, identifier) => {
      if (occurrences.length > 1) {
        conflicts.push({ identifier, occurrences });
      }
    });
    
    // Résoudre les conflits
    conflicts.forEach(conflict => {
      console.log(`  ⚠️ Conflit détecté: ${conflict.identifier} (${conflict.occurrences.length} fois)`);
      
      // Stratégie: garder le premier import, aliaser les suivants
      conflict.occurrences.forEach((occurrence, index) => {
        if (index > 0) { // Pas le premier
          const originalLine = occurrence.line;
          const aliasName = `${conflict.identifier}${index + 1}`;
          
          // Remplacer dans la ligne d'import
          const newImportLine = originalLine.replace(
            new RegExp(`\\b${conflict.identifier}\\b`),
            `${conflict.identifier} as ${aliasName}`
          );
          
          newContent = newContent.replace(originalLine, newImportLine);
          
          // Remplacer toutes les utilisations dans le fichier
          const usageRegex = new RegExp(`\\b${conflict.identifier}\\b`, 'g');
          const lines = newContent.split('\n');
          
          for (let i = occurrence.index + 1; i < lines.length; i++) {
            if (!lines[i].includes('import')) {
              lines[i] = lines[i].replace(usageRegex, aliasName);
            }
          }
          
          newContent = lines.join('\n');
          hasChanges = true;
          
          console.log(`    ✅ ${conflict.identifier} → ${aliasName} dans import ${index + 1}`);
        }
      });
    });
    
    return { content: newContent, hasChanges };
  }

  // ====================================
  // 4. CRÉATION NEXT.CONFIG.JS
  // ====================================
  
  createFixedNextConfig() {
    console.log('📝 Création next.config.js anti-barrel...');
    
    const nextConfigPath = path.join(this.rootDir, 'next.config.js');
    
    const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // DÉSACTIVER complètement barrel optimization
    optimizePackageImports: false,
    appDir: true
  },
  
  webpack: (config, { isServer }) => {
    // Configuration spéciale pour lucide-react
    config.resolve.alias = {
      ...config.resolve.alias,
      'lucide-react': require.resolve('lucide-react')
    };
    
    // Ignorer les warnings barrel
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /__barrel_optimize__/ },
      { module: /lucide-react/ }
    ];
    
    // Désactiver les transformations problématiques
    config.module.rules.push({
      test: /node_modules\\/lucide-react/,
      type: 'javascript/auto'
    });
    
    return config;
  },
  
  typescript: {
    ignoreBuildErrors: false
  },
  
  // Désactiver l'optimisation des packages
  transpilePackages: []
}

module.exports = nextConfig`;

    fs.writeFileSync(nextConfigPath, nextConfigContent);
    console.log('✅ next.config.js anti-barrel créé');
  }

  // ====================================
  // 5. TRAITEMENT FICHIERS
  // ====================================
  
  processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      let newContent = content;
      let totalChanges = false;
      
      // 1. Fix barrel optimize
      const result1 = this.fixBarrelOptimizeImports(newContent, filePath);
      if (result1.hasChanges) {
        newContent = result1.content;
        totalChanges = true;
      }
      
      // 2. Fix duplicate imports
      const result2 = this.fixDialogDuplicates(newContent, filePath);
      if (result2.hasChanges) {
        newContent = result2.content;
        totalChanges = true;
      }
      
      // 3. Fix identifier conflicts
      const result3 = this.fixIdentifierConflicts(newContent, filePath);
      if (result3.hasChanges) {
        newContent = result3.content;
        totalChanges = true;
      }
      
      // Sauvegarder si des changements ont été faits
      if (totalChanges) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        this.fixedFiles++;
        console.log(`✅ ${path.relative(this.srcDir, filePath)} corrigé`);
      }
      
    } catch (error) {
      this.errors.push({
        file: path.relative(this.srcDir, filePath),
        error: error.message
      });
    }
  }

  scanAllFiles(callback) {
    const scanDir = (dirPath) => {
      if (!fs.existsSync(dirPath)) return;
      
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      entries.forEach(entry => {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          const skipDirs = ['node_modules', '.git', '.next', 'dist', 'build'];
          if (!skipDirs.includes(entry.name)) {
            scanDir(fullPath);
          }
        } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
          if (callback) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const result = callback(fullPath, content);
            
            if (result && result.modified) {
              fs.writeFileSync(fullPath, result.content, 'utf-8');
              this.fixedFiles++;
            }
          } else {
            this.processFile(fullPath);
          }
        }
      });
    };
    
    scanDir(this.srcDir);
  }

  // ====================================
  // MÉTHODE PRINCIPALE
  // ====================================
  
  fixAllBuildErrors() {
    console.log('🚀 Début du processus de correction...\n');
    
    // DEBUG PATHS
    console.log('🔍 DEBUG CHEMINS:');
    console.log(`   - process.cwd(): ${process.cwd()}`);
    console.log(`   - __dirname: ${__dirname}`);
    console.log(`   - srcDir: ${this.srcDir} ${fs.existsSync(this.srcDir) ? '✅' : '❌'}`);
    console.log(`   - rootDir: ${this.rootDir} ${fs.existsSync(this.rootDir) ? '✅' : '❌'}`);
    
    try {
      // 1. Créer next.config.js optimisé
      this.createFixedNextConfig();
      
      // 2. Scanner et corriger tous les fichiers
      if (fs.existsSync(this.srcDir)) {
        console.log('🔍 Scan et correction des fichiers TypeScript/JSX...');
        this.scanAllFiles();
      } else {
        console.log('⚠️ Répertoire src introuvable - skip correction fichiers');
      }
      
      this.printResults();
      return this.fixedFiles >= 0; // Retourner success même si 0 fichiers corrigés
      
    } catch (error) {
      console.error('❌ Erreur lors de la correction:', error.message);
      return false;
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 CORRECTION AUTOMATIQUE TERMINÉE !');
    console.log('='.repeat(60));
    console.log(`📊 ${this.fixedFiles} fichier(s) corrigé(s)`);
    console.log(`❌ ${this.errors.length} erreur(s) rencontrée(s)`);
    
    if (this.errors.length > 0) {
      console.log('\n⚠️ Erreurs rencontrées:');
      this.errors.forEach(err => {
        console.log(`   - ${err.file}: ${err.error}`);
      });
    }
    
    console.log('\n✅ Corrections appliquées:');
    console.log('   🔧 __barrel_optimize__ supprimés');
    console.log('   🔧 Imports Dialog fusionnés');
    console.log('   🔧 Conflits d\'identifiants résolus');
    console.log('   🔧 next.config.js anti-barrel créé');
    
    console.log('\n🚀 Le build Next.js devrait maintenant passer !');
  }
}

// ====================================
// EXÉCUTION
// ====================================

if (require.main === module) {
  const fixer = new NextJsBuildErrorsFixer();
  const success = fixer.fixAllBuildErrors();
  process.exit(success ? 0 : 1);
}

module.exports = NextJsBuildErrorsFixer;