const fs = require('fs');
const path = require('path');

console.log('🔧 Correction des imports lucide-react...');

const srcDir = path.join(__dirname, '../src');

function fixLucideImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let hasChanges = false;
  
  // Pattern pour détecter les imports lucide avec barrel optimization
  const barrelPattern = /"__barrel_optimize__\?names=[^"]+!=!lucide-react"/g;
  
  if (barrelPattern.test(content)) {
    // Remplacer par import normal
    content = content.replace(barrelPattern, "'lucide-react'");
    hasChanges = true;
    console.log(`  ✅ Corrigé: ${path.relative(srcDir, filePath)}`);
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

function scanDirectory(dir) {
  let fixed = 0;
  
  if (!fs.existsSync(dir)) return fixed;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !['node_modules', '.git', '.next'].includes(entry.name)) {
      fixed += scanDirectory(fullPath);
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      if (fixLucideImports(fullPath)) {
        fixed++;
      }
    }
  });
  
  return fixed;
}

try {
  const fixedCount = scanDirectory(srcDir);
  console.log(`✅ ${fixedCount} fichier(s) corrigé(s)`);
  process.exit(0);
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
