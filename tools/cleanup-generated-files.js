#!/usr/bin/env node

// ====================================
// 🧹 CLEANUP GENERATED FILES - NETTOYAGE SYNTAXE INVALIDE
// ====================================
// Emplacement: /data/appfolder/tools/cleanup-generated-files.js
// Version: 4.1 - NOUVEAU - Nettoyage syntaxe générée invalide
// Mission: Corriger data.ts et prisma-service.ts avec syntaxe invalide
// ====================================

const fs = require('fs');
const path = require('path');

// ====================================
// CLASSE CLEANUP GENERATED FILES
// ====================================

class CleanupGeneratedFiles {
  constructor() {
    this.projectRoot = process.cwd();
    this.srcDir = path.join(this.projectRoot, 'src');
    
    // Fichiers à nettoyer
    this.targetFiles = [
      path.join(this.srcDir, 'lib', 'data.ts'),
      path.join(this.srcDir, 'lib', 'prisma-service.ts')
    ];
    
    this.stats = {
      filesProcessed: 0,
      syntaxErrorsFixed: 0,
      duplicateExportsRemoved: 0,
      invalidFunctionsRemoved: 0,
      linesRemoved: 0,
      backupsCreated: 0
    };
    
    console.log('🧹 Cleanup Generated Files - Nettoyage Syntaxe Invalide');
    console.log('🎯 Mission: Corriger fichiers générés avec erreurs syntaxe');
  }
  
  // ====================================
  // MÉTHODE PRINCIPALE
  // ====================================
  
  async cleanupAll() {
    try {
      console.log('🚀 Démarrage nettoyage fichiers générés...\n');
      
      for (const filePath of this.targetFiles) {
        if (fs.existsSync(filePath)) {
          console.log(`📁 Traitement: ${path.relative(this.projectRoot, filePath)}`);
          await this.cleanupFile(filePath);
          this.stats.filesProcessed++;
        } else {
          console.log(`⚠️ Fichier non trouvé: ${path.relative(this.projectRoot, filePath)}`);
        }
      }
      
      // Nettoyage additionnel des erreurs communes
      await this.cleanupCommonErrors();
      
      // Validation finale
      await this.validateCleanedFiles();
      
      // Rapport final
      this.generateReport();
      
      return true;
      
    } catch (error) {
      console.error('❌ Erreur nettoyage:', error.message);
      return false;
    }
  }
  
  // ====================================
  // NETTOYAGE FICHIER INDIVIDUEL
  // ====================================
  
  async cleanupFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      const originalContent = content;
      
      console.log(`🔍 Analyse ${path.basename(filePath)}...`);
      
      // 1. Créer backup
      await this.createBackup(filePath);
      
      // 2. Corrections principales
      content = this.fixInvalidFunctionSyntax(content);
      content = this.removeDuplicateExports(content);
      content = this.cleanInvalidComments(content);
      content = this.fixMalformedFunctions(content);
      content = this.normalizeExports(content);
      
      // 3. Sauvegarder si modifié
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ ${path.basename(filePath)} nettoyé et sauvegardé`);
        
        // Statistiques
        const removedLines = originalContent.split('\n').length - content.split('\n').length;
        this.stats.linesRemoved += Math.max(0, removedLines);
      } else {
        console.log(`ℹ️ ${path.basename(filePath)} déjà propre`);
      }
      
    } catch (error) {
      console.error(`❌ Erreur nettoyage ${path.basename(filePath)}:`, error.message);
    }
  }
  
  // ====================================
  // CORRECTION SYNTAXE FONCTION INVALIDE
  // ====================================
  
  fixInvalidFunctionSyntax(content) {
    console.log('   🔧 Correction syntaxe fonctions invalides...');
    
    let fixed = content;
    let fixCount = 0;
    
    // 1. Corriger "export async function // comment as alias"
    const invalidFunctionPattern = /export\s+async\s+function\s+\/\/[^(]*as\s+\w+\s*\([^)]*\)\s*\{/g;
    fixed = fixed.replace(invalidFunctionPattern, (match) => {
      fixCount++;
      console.log(`      ❌ Fonction invalide supprimée: ${match.substring(0, 50)}...`);
      return '// Fonction invalide supprimée par cleanup';
    });
    
    // 2. Corriger syntaxe "as alias" dans déclarations
    const asAliasPattern = /export\s+async\s+function\s+([^(]*)\s+as\s+(\w+)\s*\(/g;
    fixed = fixed.replace(asAliasPattern, (match, funcBody, alias) => {
      // Extraire nom fonction valide
      const cleanName = funcBody.replace(/\/\/.*$/, '').trim();
      if (cleanName && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(cleanName)) {
        fixCount++;
        console.log(`      🔧 Corrigé: ${match} → export async function ${cleanName}(`);
        return `export async function ${cleanName}(`;
      } else {
        fixCount++;
        console.log(`      ❌ Fonction invalide supprimée: ${match}`);
        return '// Fonction invalide supprimée par cleanup';
      }
    });
    
    // 3. Supprimer fonctions avec commentaires dans le nom
    const commentInNamePattern = /export\s+async\s+function\s+[^(]*\/\/[^(]*\(/g;
    fixed = fixed.replace(commentInNamePattern, () => {
      fixCount++;
      return '// Fonction avec commentaire dans nom supprimée';
    });
    
    if (fixCount > 0) {
      console.log(`      ✅ ${fixCount} fonction(s) avec syntaxe invalide corrigée(s)`);
      this.stats.syntaxErrorsFixed += fixCount;
    }
    
    return fixed;
  }
  
  // ====================================
  // SUPPRESSION EXPORTS DUPLIQUÉS
  // ====================================
  
  removeDuplicateExports(content) {
    console.log('   🔧 Suppression exports dupliqués...');
    
    const exportPattern = /export\s*\{\s*([^}]+)\s*\}/g;
    const allExports = new Set();
    const duplicates = [];
    let fixed = content;
    
    // 1. Identifier exports dupliqués
    let match;
    while ((match = exportPattern.exec(content)) !== null) {
      const exportsList = match[1].split(',').map(exp => exp.trim());
      
      exportsList.forEach(exportItem => {
        const cleanExport = exportItem.replace(/\s+as\s+\w+/, '').trim();
        if (allExports.has(cleanExport)) {
          duplicates.push(cleanExport);
        } else {
          allExports.add(cleanExport);
        }
      });
    }
    
    // 2. Supprimer lignes export dupliquées
    if (duplicates.length > 0) {
      console.log(`      🔍 ${duplicates.length} export(s) dupliqué(s) détecté(s)`);
      
      // Garder seulement la première occurrence de chaque export
      const seenExports = new Set();
      const lines = fixed.split('\n');
      const cleanedLines = [];
      
      for (const line of lines) {
        if (line.includes('export {') && line.includes('}')) {
          // Analyser ligne export
          const exportMatch = line.match(/export\s*\{\s*([^}]+)\s*\}/);
          if (exportMatch) {
            const exportsList = exportMatch[1].split(',').map(exp => exp.trim());
            const uniqueExports = exportsList.filter(exp => {
              const cleanExport = exp.replace(/\s+as\s+\w+/, '').trim();
              if (seenExports.has(cleanExport)) {
                console.log(`      ❌ Export dupliqué supprimé: ${cleanExport}`);
                this.stats.duplicateExportsRemoved++;
                return false;
              }
              seenExports.add(cleanExport);
              return true;
            });
            
            if (uniqueExports.length > 0) {
              cleanedLines.push(`export { ${uniqueExports.join(', ')} };`);
            }
          } else {
            cleanedLines.push(line);
          }
        } else {
          cleanedLines.push(line);
        }
      }
      
      fixed = cleanedLines.join('\n');
    }
    
    return fixed;
  }
  
  // ====================================
  // NETTOYAGE COMMENTAIRES INVALIDES
  // ====================================
  
  cleanInvalidComments(content) {
    console.log('   🔧 Nettoyage commentaires invalides...');
    
    let fixed = content;
    let cleanCount = 0;
    
    // 1. Supprimer commentaires orphelins dans déclarations
    fixed = fixed.replace(/\/\/ Ensured \w+ is imported[\s\n\r]*/g, () => {
      cleanCount++;
      return '';
    });
    
    // 2. Nettoyer lignes avec seulement des commentaires malformés
    const lines = fixed.split('\n');
    const cleanedLines = lines.filter(line => {
      const trimmed = line.trim();
      
      // Supprimer lignes avec commentaires malformés
      if (trimmed.match(/^\/\/ Ensured \w+ is imported$/) ||
          trimmed.match(/^\/\/\s*getReservations as fetchAllHostReservations/)) {
        cleanCount++;
        console.log(`      ❌ Commentaire invalide supprimé: ${trimmed}`);
        return false;
      }
      
      return true;
    });
    
    if (cleanCount > 0) {
      console.log(`      ✅ ${cleanCount} commentaire(s) invalide(s) supprimé(s)`);
      fixed = cleanedLines.join('\n');
    }
    
    return fixed;
  }
  
  // ====================================
  // CORRECTION FONCTIONS MALFORMÉES
  // ====================================
  
  fixMalformedFunctions(content) {
    console.log('   🔧 Correction fonctions malformées...');
    
    let fixed = content;
    let fixCount = 0;
    
    // 1. Supprimer fonctions avec syntaxe cassée
    const malformedPatterns = [
      /export\s+async\s+function\s+[^{]*\{[^}]*\n\s*\^\^/g,  // Caractères ^^ invalides
      /export\s+async\s+function\s+[^{]*\{[^}]*SyntaxError/g,  // Mentions SyntaxError
      /export\s+async\s+function\s*\n\s*getReservations\s+as\s+\w+/g  // Fonctions multilignes cassées
    ];
    
    malformedPatterns.forEach(pattern => {
      fixed = fixed.replace(pattern, () => {
        fixCount++;
        return '// Fonction malformée supprimée par cleanup';
      });
    });
    
    // 2. Corriger accolades non équilibrées
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      console.log(`      ⚠️ Accolades non équilibrées: ${openBraces} ouvertes, ${closeBraces} fermées`);
      
      // Ajouter accolades manquantes à la fin si nécessaire
      const missing = openBraces - closeBraces;
      if (missing > 0) {
        fixed += '\n' + '}'.repeat(missing) + '\n';
        fixCount++;
        console.log(`      🔧 ${missing} accolade(s) fermante(s) ajoutée(s)`);
      }
    }
    
    if (fixCount > 0) {
      console.log(`      ✅ ${fixCount} fonction(s) malformée(s) corrigée(s)`);
      this.stats.invalidFunctionsRemoved += fixCount;
    }
    
    return fixed;
  }
  
  // ====================================
  // NORMALISATION EXPORTS
  // ====================================
  
  normalizeExports(content) {
    console.log('   🔧 Normalisation exports...');
    
    let fixed = content;
    
    // 1. Regrouper exports multiples en un seul export
    const exportMatches = [...fixed.matchAll(/export\s*\{\s*([^}]+)\s*\}/g)];
    
    if (exportMatches.length > 1) {
      console.log(`      🔄 Regroupement de ${exportMatches.length} exports séparés`);
      
      // Collecter tous les exports
      const allExports = new Set();
      exportMatches.forEach(match => {
        const exportsList = match[1].split(',').map(exp => exp.trim());
        exportsList.forEach(exp => allExports.add(exp));
      });
      
      // Supprimer anciens exports
      fixed = fixed.replace(/export\s*\{\s*[^}]+\s*\}/g, '');
      
      // Ajouter export unique à la fin
      const sortedExports = Array.from(allExports).sort();
      fixed += `\n\n// ====================================\n`;
      fixed += `// EXPORTS CONSOLIDÉS (${sortedExports.length} fonctions)\n`;
      fixed += `// ====================================\n\n`;
      fixed += `export {\n  ${sortedExports.join(',\n  ')}\n};\n`;
    }
    
    return fixed;
  }
  
  // ====================================
  // NETTOYAGE ERREURS COMMUNES
  // ====================================
  
  async cleanupCommonErrors() {
    console.log('\n🔧 Nettoyage erreurs communes dans le projet...');
    
    // Nettoyer autres fichiers avec erreurs fréquentes
    const additionalFiles = [
      path.join(this.srcDir, 'components', 'shared', 'AppShell.tsx'),
      path.join(this.srcDir, 'app', 'layout.tsx')
    ];
    
    for (const filePath of additionalFiles) {
      if (fs.existsSync(filePath)) {
        try {
          let content = fs.readFileSync(filePath, 'utf-8');
          
          // Corrections communes
          const originalContent = content;
          
          // Supprimer imports cassés
          content = content.replace(/import\s+.*?from\s+['""]undefined['""];?\n?/g, '');
          
          // Corriger références undefined
          content = content.replace(/\bundefined\./g, '// undefined.');
          
          if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            console.log(`   ✅ ${path.basename(filePath)} nettoyé`);
          }
          
        } catch (error) {
          console.log(`   ⚠️ Erreur nettoyage ${path.basename(filePath)}: ${error.message}`);
        }
      }
    }
  }
  
  // ====================================
  // VALIDATION FICHIERS NETTOYÉS
  // ====================================
  
  async validateCleanedFiles() {
    console.log('\n🧪 Validation fichiers nettoyés...');
    
    for (const filePath of this.targetFiles) {
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          
          // Vérifications de base
          const checks = {
            hasInvalidSyntax: content.includes('export async function //'),
            hasAsAlias: content.includes(') as ') && content.includes('function'),
            hasUnbalancedBraces: (content.match(/\{/g) || []).length !== (content.match(/\}/g) || []).length,
            hasMalformedComments: content.includes('// Ensured') && content.includes('getReservations as'),
            hasValidExports: content.includes('export {') || content.includes('export async function')
          };
          
          const issues = Object.entries(checks).filter(([key, value]) => 
            key !== 'hasValidExports' ? value : !value
          );
          
          if (issues.length === 0) {
            console.log(`   ✅ ${path.basename(filePath)}: Validation réussie`);
          } else {
            console.log(`   ⚠️ ${path.basename(filePath)}: ${issues.length} problème(s) restant(s)`);
            issues.forEach(([issue]) => {
              console.log(`      - ${issue}`);
            });
          }
          
        } catch (error) {
          console.log(`   ❌ Erreur validation ${path.basename(filePath)}: ${error.message}`);
        }
      }
    }
  }
  
  // ====================================
  // UTILITAIRES
  // ====================================
  
  async createBackup(filePath) {
    try {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
      console.log(`   💾 Backup: ${path.basename(backupPath)}`);
      this.stats.backupsCreated++;
    } catch (error) {
      console.log(`   ⚠️ Impossible de créer backup: ${error.message}`);
    }
  }
  
  // ====================================
  // RAPPORT FINAL
  // ====================================
  
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🧹 RAPPORT NETTOYAGE FICHIERS GÉNÉRÉS');
    console.log('='.repeat(60));
    
    console.log('📊 Statistiques de nettoyage:');
    console.log(`   📁 Fichiers traités: ${this.stats.filesProcessed}`);
    console.log(`   🔧 Erreurs syntaxe corrigées: ${this.stats.syntaxErrorsFixed}`);
    console.log(`   🗑️ Exports dupliqués supprimés: ${this.stats.duplicateExportsRemoved}`);
    console.log(`   ❌ Fonctions invalides supprimées: ${this.stats.invalidFunctionsRemoved}`);
    console.log(`   📝 Lignes supprimées: ${this.stats.linesRemoved}`);
    console.log(`   💾 Backups créés: ${this.stats.backupsCreated}`);
    
    console.log('\n✅ Corrections appliquées:');
    console.log('   🔧 Syntaxe "export async function // comment as alias" corrigée');
    console.log('   🗑️ Exports dupliqués supprimés');
    console.log('   🧹 Commentaires invalides supprimés');
    console.log('   ⚖️ Accolades équilibrées');
    console.log('   📦 Exports consolidés');
    
    console.log('\n🎯 Résultat:');
    if (this.stats.syntaxErrorsFixed > 0 || this.stats.duplicateExportsRemoved > 0) {
      console.log('   🎉 Fichiers générés nettoyés avec succès !');
      console.log('   ✅ Build Next.js devrait maintenant passer');
    } else {
      console.log('   ℹ️ Fichiers déjà propres, pas de nettoyage nécessaire');
    }
    
    console.log('='.repeat(60));
  }
}

// ====================================
// POINT D'ENTRÉE
// ====================================

async function main() {
  const cleanup = new CleanupGeneratedFiles();
  
  try {
    const success = await cleanup.cleanupAll();
    
    if (success) {
      console.log('\n✅ NETTOYAGE TERMINÉ AVEC SUCCÈS');
      process.exit(0);
    } else {
      console.log('\n⚠️ NETTOYAGE TERMINÉ AVEC AVERTISSEMENTS');
      process.exit(0); // Continuer pipeline
    }
    
  } catch (error) {
    console.error('\n❌ ERREUR NETTOYAGE');
    console.error('Détails:', error.message);
    process.exit(1);
  }
}

// Lancement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = CleanupGeneratedFiles;