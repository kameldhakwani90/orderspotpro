const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 NETTOYAGE DÉFINITIF des fichiers sources...');

// IMPORTANT: Ce script doit s'exécuter APRÈS la copie dans le conteneur
// mais AVANT toute génération ou build

const srcDir = path.join(__dirname, '../src');

function cleanBarrelOptimize() {
  console.log('🔍 Recherche des fichiers contenant __barrel_optimize__...');
  
  try {
    // Trouver TOUS les fichiers affectés
    const findCommand = `grep -r "__barrel_optimize__" ${srcDir} --include="*.tsx" --include="*.ts" -l || true`;
    const affectedFiles = execSync(findCommand, { encoding: 'utf-8' })
      .split('\n')
      .filter(f => f.trim());
    
    if (affectedFiles.length === 0) {
      console.log('✅ Aucun fichier avec __barrel_optimize__ trouvé');
      return;
    }
    
    console.log(`📋 ${affectedFiles.length} fichier(s) à nettoyer`);
    
    // Nettoyer chaque fichier
    affectedFiles.forEach(filePath => {
      if (!fs.existsSync(filePath)) return;
      
      console.log(`  🔧 Nettoyage: ${path.relative(srcDir, filePath)}`);
      
      let content = fs.readFileSync(filePath, 'utf-8');
      const originalContent = content;
      
      // Méthode 1: Remplacement simple
      content = content.replace(
        /"__barrel_optimize__\?names=[^"]+!=!lucide-react"/g,
        '"lucide-react"'
      );
      content = content.replace(
        /'__barrel_optimize__\?names=[^']+!=!lucide-react'/g,
        "'lucide-react'"
      );
      
      // Méthode 2: Si encore présent, extraction et reconstruction
      if (content.includes('__barrel_optimize__')) {
        const lines = content.split('\n');
        const fixedLines = lines.map(line => {
          if (line.includes('__barrel_optimize__') && line.includes('lucide-react')) {
            // Extraire les icônes
            const match = line.match(/import\s*\{([^}]+)\}\s*from/);
            if (match) {
              const icons = match[1];
              return `import { ${icons} } from 'lucide-react';`;
            }
          }
          return line;
        });
        content = fixedLines.join('\n');
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`    ✅ Nettoyé`);
      }
    });
    
    // Vérification finale
    console.log('\n🔍 Vérification finale...');
    const checkCommand = `grep -r "__barrel_optimize__" ${srcDir} --include="*.tsx" --include="*.ts" || echo "CLEAN"`;
    const result = execSync(checkCommand, { encoding: 'utf-8' }).trim();
    
    if (result === 'CLEAN') {
      console.log('✅ SUCCÈS: Tous les __barrel_optimize__ ont été supprimés !');
    } else {
      console.error('❌ ATTENTION: __barrel_optimize__ encore présent:');
      console.error(result);
      
      // Tentative brutale finale
      console.log('\n🔥 Nettoyage BRUTAL final...');
      execSync(`find ${srcDir} \\( -name "*.tsx" -o -name "*.ts" \\) -exec sed -i 's/__barrel_optimize__[^"'"'"']*!=!lucide-react/lucide-react/g' {} +`, { stdio: 'inherit' });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécution
cleanBarrelOptimize();
console.log('\n✅ Nettoyage terminé !');
