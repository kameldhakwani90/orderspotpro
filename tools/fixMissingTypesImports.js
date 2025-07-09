const fs = require('fs');
const path = require('path');

console.log('🔧 CORRECTEUR IMPORTS TYPES - Version corrigée "use client"');

class TypesImportsFixer {
  constructor() {
    this.srcDir = path.join(process.cwd(), 'src');
    this.fixedFiles = 0;
    this.errors = [];
  }

  // ====================================
  // CORRECTION PRINCIPALE - RESPECT "use client"
  // ====================================
  
  addImportRespectingUseClient(content, importLine) {
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // 1. Détecter "use client" au début
    const useClientRegex = /^["']use client["'];?\s*$/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip lignes vides au début
      if (line === '') continue;
      
      // Si "use client" trouvé, insérer après
      if (useClientRegex.test(line)) {
        insertIndex = i + 1;
        
        // Ajouter ligne vide après "use client" si pas déjà présente
        if (lines[i + 1] && lines[i + 1].trim() !== '') {
          lines.splice(i + 1, 0, '');
          insertIndex = i + 2;
        }
        break;
      }
      
      // Si pas "use client" mais import/code trouvé, insérer avant
      if (line.startsWith('import') || line.startsWith('export') || line.startsWith('const')) {
        insertIndex = i;
        break;
      }
    }
    
    // 2. Insérer l'import à la bonne position
    lines.splice(insertIndex, 0, importLine);
    
    return lines.join('\n');
  }

  // ====================================
  // SCANNER ET CORRECTION FICHIERS
  // ====================================
  
  processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      let newContent = content;
      let hasChanges = false;
      
      // Analyser les imports manquants
      const missingTypes = this.detectMissingTypes(content);
      
      if (missingTypes.length > 0) {
        console.log(`📝 ${path.basename(filePath)}: ${missingTypes.length} type(s) manquant(s)`);
        
        // Ajouter chaque import manquant
        missingTypes.forEach(type => {
          const importLine = `import type { ${type} } from '@/lib/types';`;
          
          // Vérifier si import déjà présent
          if (!newContent.includes(importLine)) {
            newContent = this.addImportRespectingUseClient(newContent, importLine);
            hasChanges = true;
            console.log(`  ✅ Ajouté: ${type}`);
          }
        });
      }
      
      // Sauvegarder si changements
      if (hasChanges) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        this.fixedFiles++;
        console.log(`✅ ${path.relative(this.srcDir, filePath)} corrigé`);
      }
      
    } catch (error) {
      this.errors.push({
        file: path.relative(this.srcDir, filePath),
        error: error.message
      });
      console.error(`❌ Erreur ${path.basename(filePath)}: ${error.message}`);
    }
  }

  // ====================================
  // DÉTECTION TYPES MANQUANTS
  // ====================================
  
  detectMissingTypes(content) {
    const missingTypes = [];
    
    // Types courants à rechercher
    const commonTypes = [
      'User', 'Client', 'Host', 'Order', 'Product', 'Service',
      'UserRole', 'OrderStatus', 'ClientStatus', 'HostStatus'
    ];
    
    // Chercher utilisations de types
    commonTypes.forEach(type => {
      const typeUsageRegex = new RegExp(`\\b${type}\\b`, 'g');
      const importRegex = new RegExp(`import.*${type}.*from.*@/lib/types`);
      
      // Si type utilisé mais pas importé
      if (typeUsageRegex.test(content) && !importRegex.test(content)) {
        missingTypes.push(type);
      }
    });
    
    return missingTypes;
  }

  // ====================================
  // SCANNER RÉCURSIF
  // ====================================
  
  scanAllFiles() {
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
          this.processFile(fullPath);
        }
      });
    };
    
    scanDir(this.srcDir);
  }

  // ====================================
  // MÉTHODE PRINCIPALE
  // ====================================
  
  fixAllMissingTypes() {
    console.log('🚀 Début correction imports types (respect "use client")...\n');
    
    try {
      if (fs.existsSync(this.srcDir)) {
        this.scanAllFiles();
      } else {
        console.log('⚠️ Répertoire src introuvable');
      }
      
      this.printResults();
      return this.errors.length === 0;
      
    } catch (error) {
      console.error('❌ Erreur lors de la correction:', error.message);
      return false;
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 CORRECTION IMPORTS TYPES TERMINÉE !');
    console.log('='.repeat(60));
    console.log(`📊 ${this.fixedFiles} fichier(s) corrigé(s)`);
    console.log(`❌ ${this.errors.length} erreur(s) rencontrée(s)`);
    
    if (this.errors.length > 0) {
      console.log('\n⚠️ Erreurs rencontrées:');
      this.errors.forEach(err => {
        console.log(`   - ${err.file}: ${err.error}`);
      });
    }
    
    console.log('\n✅ Améliorations appliquées:');
    console.log('   🔧 Imports ajoutés APRÈS "use client"');
    console.log('   🔧 Préservation directives Next.js');
    console.log('   🔧 Évitement imports dupliqués');
    
    console.log('\n🚀 Les erreurs "use client" sont maintenant corrigées !');
  }
}

// ====================================
// EXÉCUTION
// ====================================

if (require.main === module) {
  const fixer = new TypesImportsFixer();
  const success = fixer.fixAllMissingTypes();
  process.exit(success ? 0 : 1);
}

module.exports = TypesImportsFixer;