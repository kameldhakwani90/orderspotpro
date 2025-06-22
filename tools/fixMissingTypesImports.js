const fs = require('fs');
const path = require('path');

console.log('🔧 Correction des imports de types manquants...');

const srcDir = path.join(__dirname, '../src');
const typesPath = path.join(__dirname, '../src/lib/types.ts');

// Extraire tous les types disponibles
function getAllAvailableTypes() {
  if (!fs.existsSync(typesPath)) return new Set();
  
  const content = fs.readFileSync(typesPath, 'utf-8');
  const types = new Set();
  
  // Interfaces
  const interfaceMatches = content.match(/export\s+interface\s+(\w+)/g) || [];
  interfaceMatches.forEach(match => {
    types.add(match.replace(/export\s+interface\s+/, ''));
  });
  
  return types;
}

// Scanner et corriger les fichiers
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let hasChanges = false;
  
  // Trouver les types utilisés mais non importés
  const usedTypes = new Set();
  const availableTypes = getAllAvailableTypes();
  
  // Pattern pour détecter l'utilisation de types
  availableTypes.forEach(typeName => {
    const patterns = [
      new RegExp(`:\\s*${typeName}(?:[\\[\\]\\s<>]|$)`, 'g'),
      new RegExp(`extends\\s+(?:Omit<)?${typeName}`, 'g'),
      new RegExp(`<${typeName}[\\[\\]>]`, 'g'),
      new RegExp(`as\\s+${typeName}`, 'g')
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        usedTypes.add(typeName);
      }
    }
  });
  
  // Vérifier les imports existants
  const importMatch = content.match(/import\s*(?:type\s*)?\{\s*([^}]+)\s*\}\s*from\s*['"]@\/lib\/types['"]/);
  const currentImports = importMatch ? 
    importMatch[1].split(',').map(i => i.trim()).filter(i => i) : 
    [];
  
  // Trouver les types manquants
  const missingTypes = [];
  usedTypes.forEach(type => {
    if (!currentImports.includes(type) && !content.includes(`interface ${type} `)) {
      missingTypes.push(type);
    }
  });
  
  if (missingTypes.length > 0) {
    console.log(`  📝 ${path.relative(srcDir, filePath)}: +${missingTypes.join(', ')}`);
    
    if (importMatch) {
      // Ajouter aux imports existants
      const allImports = [...currentImports, ...missingTypes].sort();
      const newImport = `import { ${allImports.join(', ')} } from '@/lib/types'`;
      content = content.replace(importMatch[0], newImport);
    } else {
      // Créer nouvel import après 'use client'
      const newImport = `import { ${missingTypes.sort().join(', ')} } from '@/lib/types';`;
      const useClientMatch = content.match(/['"]use client['"];?\s*/);
      
      if (useClientMatch) {
        const insertPos = useClientMatch.index + useClientMatch[0].length;
        content = content.slice(0, insertPos) + '\n' + newImport + '\n' + content.slice(insertPos);
      } else {
        content = newImport + '\n\n' + content;
      }
    }
    
    hasChanges = true;
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

// Scanner tous les fichiers
function scanDirectory(dir) {
  let fixed = 0;
  
  if (!fs.existsSync(dir)) return fixed;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !['node_modules', '.git', '.next'].includes(entry.name)) {
      fixed += scanDirectory(fullPath);
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      if (fixFile(fullPath)) {
        fixed++;
      }
    }
  });
  
  return fixed;
}

// Exécution
try {
  console.log('🔍 Types disponibles:', Array.from(getAllAvailableTypes()).join(', '));
  const fixedCount = scanDirectory(srcDir);
  console.log(`✅ ${fixedCount} fichier(s) corrigé(s)`);
  process.exit(0);
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
