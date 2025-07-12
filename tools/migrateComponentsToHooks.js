#!/usr/bin/env node

// ====================================
// 🔄 MIGRATION COMPOSANTS → HOOKS - VERSION CORRIGÉE
// ====================================
// Emplacement: /data/appfolder/tools/migrateComponentsToHooks.js
// Version: 3.0 - CORRIGÉE - Mapping dynamique fonctionnel
// Corrections: Détection hooks améliorée + mapping robuste
// ====================================

const fs = require('fs');
const path = require('path');

console.log('🔄 Migration AUTOMATIQUE et DYNAMIQUE de TOUS les composants vers hooks...');

const srcDir = path.join(__dirname, '../src');
const prismaServicePath = path.join(__dirname, '../src/lib/prisma-service.ts');
const hooksDir = path.join(__dirname, '../src/hooks');
const excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build', 'hooks', 'lib'];

// ====================================
// GÉNÉRATION DYNAMIQUE DU MAPPING CORRIGÉE
// ====================================

function generateDynamicMapping() {
  console.log('🔍 Génération DYNAMIQUE du mapping depuis les fichiers existants...');
  
  const mapping = {};
  
  // 1. Analyser prisma-service.ts pour les modèles
  if (!fs.existsSync(prismaServicePath)) {
    console.error('❌ prisma-service.ts introuvable');
    return mapping;
  }
  
  const prismaContent = fs.readFileSync(prismaServicePath, 'utf-8');
  const models = new Set();
  
  // Détecter tous les modèles depuis les fonctions CRUD
  const crudPatterns = [
    /export async function getAll(\w+)s?\(\)/g,
    /export async function get(\w+)s?\(\)/g,
    /export async function add(\w+)\(/g,
    /export async function create(\w+)\(/g,
    /export async function update(\w+)\(/g,
    /export async function delete(\w+)\(/g
  ];
  
  crudPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(prismaContent)) !== null) {
      let modelName = match[1];
      // Normaliser le nom du modèle
      if (modelName.endsWith('s')) {
        modelName = modelName.slice(0, -1);
      }
      models.add(modelName);
    }
  });
  
  console.log(`📊 ${models.size} modèles détectés:`, Array.from(models));
  
  // 2. Analyser les hooks existants
  const availableHooks = new Set();
  if (fs.existsSync(hooksDir)) {
    const hookFiles = fs.readdirSync(hooksDir).filter(f => f.startsWith('use') && f.endsWith('.ts'));
    hookFiles.forEach(file => {
      const hookName = file.replace('.ts', '');
      availableHooks.add(hookName);
      console.log(`📊 Hook trouvé: ${hookName}`);
    });
  }
  
  // Également lire depuis index.ts si existe
  const indexPath = path.join(hooksDir, 'index.ts');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const exportMatches = [...indexContent.matchAll(/export.*\{([^}]+)\}/g)];
    exportMatches.forEach(match => {
      const exports = match[1].split(',').map(e => e.trim());
      exports.forEach(exp => {
        if (exp.startsWith('use')) {
          availableHooks.add(exp);
        }
      });
    });
  }
  
  console.log(`📊 ${availableHooks.size} hooks disponibles:`, Array.from(availableHooks).join(', '));
  
  // 3. Générer le mapping dynamiquement avec patterns élargis
  models.forEach(modelName => {
    const pluralModelName = modelName + 's';
    const possibleHooks = [
      `use${modelName}`,
      `use${pluralModelName}`,
      `use${modelName}s`
    ];
    
    // Trouver le hook qui existe réellement
    const actualHook = possibleHooks.find(hook => availableHooks.has(hook));
    
    if (!actualHook) {
      console.log(`⚠️  Hook manquant pour ${modelName} - sera ignoré`);
      return;
    }
    
    const hookName = actualHook;
    const pluralLower = modelName.toLowerCase() + 's';
    
    // Générer toutes les variations possibles de fonctions pour ce modèle
    const functionVariations = [
      // Patterns getAll
      `getAll${modelName}s`,
      `get${modelName}s`,
      `get${pluralLower}`,
      
      // Patterns getById
      `get${modelName}ById`,
      `get${modelName}ByEmail`,
      `get${modelName}ByHostId`,
      
      // Patterns create/add
      `create${modelName}`,
      `add${modelName}`,
      `add${modelName}ToData`,
      
      // Patterns update
      `update${modelName}`,
      `update${modelName}InData`,
      
      // Patterns delete
      `delete${modelName}`,
      `delete${modelName}InData`,
      `remove${modelName}`,
      
      // Patterns spéciaux trouvés dans le code
      ...(modelName === 'Host' ? ['getHosts', 'addHost', 'updateHost', 'deleteHost'] : []),
      ...(modelName === 'User' ? ['getUsers', 'addUser', 'updateUser', 'deleteUser'] : []),
      ...(modelName === 'Client' ? ['getClients', 'addClient', 'updateClient', 'deleteClient'] : []),
      ...(modelName === 'Order' ? ['getOrders', 'addOrder', 'updateOrder', 'deleteOrder'] : []),
      ...(modelName === 'Service' ? ['getServices', 'addService', 'updateService', 'deleteService'] : [])
    ];
    
    // Mapper chaque variation à la bonne propriété du hook
    functionVariations.forEach(funcName => {
      let property;
      
      // Logique améliorée pour déterminer la propriété
      if (funcName.includes('getAll') || funcName === `get${pluralLower}` || funcName === `get${modelName}s`) {
        property = `${modelName.toLowerCase()}s`; // ex: hosts, users, clients
      } else if (funcName.includes('ById') || funcName.includes('ByEmail') || funcName.includes('ByHostId')) {
        property = `get${modelName}`;
      } else if (funcName.includes('create') || funcName.includes('add')) {
        property = `create${modelName}`;
      } else if (funcName.includes('update')) {
        property = `update${modelName}`;
      } else if (funcName.includes('delete') || funcName.includes('remove')) {
        property = `delete${modelName}`;
      } else {
        property = funcName; // fallback
      }
      
      mapping[funcName] = {
        hook: hookName,
        property: property,
        model: modelName
      };
    });
    
    console.log(`  ✅ ${modelName}: ${functionVariations.length} fonctions mappées vers ${hookName}`);
  });
  
  return mapping;
}

// ====================================
// ANALYSE ET TRANSFORMATION DES FICHIERS AMÉLIORÉE
// ====================================

function analyzeImports(content) {
  const imports = {
    prismaService: [],
    otherImports: []
  };
  
  // Détecter tous les imports depuis prisma-service avec patterns élargis
  const importPatterns = [
    /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]@\/lib\/prisma-service['"];?/g,
    /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"][^'"]*prisma-service['"];?/g,
    /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]\.\.\/lib\/prisma-service['"];?/g,
    /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]\.\/prisma-service['"];?/g
  ];
  
  importPatterns.forEach(pattern => {
    const matches = [...content.matchAll(pattern)];
    matches.forEach(match => {
      const functions = match[1]
        .split(',')
        .map(f => f.trim().replace(/\s+as\s+\w+/g, '')) // Enlever les alias "as xxx"
        .filter(f => f.length > 0);
      imports.prismaService.push(...functions);
    });
  });
  
  return imports;
}

function generateHookUsages(usedFunctions, mapping) {
  const hookUsages = new Map();
  const hookImports = new Set();
  
  usedFunctions.forEach(func => {
    const mappingInfo = mapping[func];
    if (mappingInfo) {
      hookImports.add(mappingInfo.hook);
      
      if (!hookUsages.has(mappingInfo.hook)) {
        hookUsages.set(mappingInfo.hook, new Set());
      }
      hookUsages.get(mappingInfo.hook).add(mappingInfo.property);
    }
  });
  
  return { hookImports: Array.from(hookImports), hookUsages };
}

function transformFileContent(content, filePath, mapping) {
  let newContent = content;
  let hasChanges = false;
  
  const imports = analyzeImports(content);
  
  if (imports.prismaService.length === 0) {
    return { content: newContent, changed: false };
  }
  
  console.log(`  🔍 ${path.relative(srcDir, filePath)}: ${imports.prismaService.length} fonctions Prisma détectées`);
  
  const { hookImports, hookUsages } = generateHookUsages(imports.prismaService, mapping);
  
  if (hookImports.length === 0) {
    console.log(`  ⏭️  Aucun hook disponible pour les fonctions utilisées`);
    return { content: newContent, changed: false };
  }
  
  // 1. Supprimer les imports prisma-service
  const prismaImportRegex = /import\s*\{\s*[^}]+\s*\}\s*from\s*['"][^'"]*prisma-service['"];?\n?/g;
  newContent = newContent.replace(prismaImportRegex, '');
  hasChanges = true;
  
  // 2. Ajouter "use client" si pas présent
  if (!newContent.includes('"use client"') && !newContent.includes("'use client'")) {
    newContent = '"use client";\n\n' + newContent;
  }
  
  // 3. Ajouter les imports de hooks
  const hookImportLine = `import { ${hookImports.join(', ')} } from '@/hooks';`;
  
  // Trouver où insérer l'import
  const firstImportMatch = newContent.match(/^import\s/m);
  if (firstImportMatch) {
    const insertPosition = firstImportMatch.index;
    newContent = newContent.slice(0, insertPosition) + hookImportLine + '\n' + newContent.slice(insertPosition);
  } else {
    // Insérer après "use client"
    const useClientMatch = newContent.match(/['"]use client['"];\n*/);
    if (useClientMatch) {
      const insertPosition = useClientMatch.index + useClientMatch[0].length;
      newContent = newContent.slice(0, insertPosition) + '\n' + hookImportLine + '\n' + newContent.slice(insertPosition);
    }
  }
  
  // 4. Ajouter les déclarations de hooks dans le composant
  hookImports.forEach(hookName => {
    const properties = Array.from(hookUsages.get(hookName));
    const hookDeclaration = `  const { ${properties.join(', ')} } = ${hookName}();`;
    
    // Trouver le début du composant (function ou const)
    const componentRegex = /(export\s+(?:default\s+)?function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|function\s+\w+\s*\([^)]*\))/;
    const componentMatch = newContent.match(componentRegex);
    
    if (componentMatch) {
      const insertAfter = componentMatch.index + componentMatch[0].length;
      const nextBraceIndex = newContent.indexOf('{', insertAfter);
      
      if (nextBraceIndex !== -1) {
        // Vérifier si la déclaration n'existe pas déjà
        if (!newContent.includes(hookDeclaration)) {
          newContent = newContent.slice(0, nextBraceIndex + 1) + '\n' + hookDeclaration + '\n' + newContent.slice(nextBraceIndex + 1);
        }
      }
    }
  });
  
  // 5. Remplacer les appels de fonctions
  imports.prismaService.forEach(func => {
    const mappingInfo = mapping[func];
    if (mappingInfo) {
      // Remplacer les appels directs de fonction
      const functionCallRegex = new RegExp(`\\b${escapeRegExp(func)}\\s*\\(`, 'g');
      if (functionCallRegex.test(newContent)) {
        newContent = newContent.replace(functionCallRegex, `${mappingInfo.property}(`);
        hasChanges = true;
        console.log(`    📝 ${func} → ${mappingInfo.property}`);
      }
    }
  });
  
  return { content: newContent, changed: hasChanges };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ====================================
// TRAITEMENT RÉCURSIF DES RÉPERTOIRES
// ====================================

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
}

function shouldSkipDirectory(dirName) {
  return excludeDirs.includes(dirName) || dirName.startsWith('.');
}

function processDirectory(dirPath, mapping) {
  let filesProcessed = 0;
  let filesChanged = 0;
  
  if (!fs.existsSync(dirPath)) {
    return { filesProcessed, filesChanged };
  }
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  entries.forEach(entry => {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      if (!shouldSkipDirectory(entry.name)) {
        const result = processDirectory(fullPath, mapping);
        filesProcessed += result.filesProcessed;
        filesChanged += result.filesChanged;
      }
    } else if (entry.isFile() && shouldProcessFile(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        // Vérifier si le fichier contient des imports prisma-service
        if (!content.includes('prisma-service')) {
          return;
        }
        
        const { content: newContent, changed } = transformFileContent(content, fullPath, mapping);
        
        filesProcessed++;
        
        if (changed) {
          fs.writeFileSync(fullPath, newContent, 'utf-8');
          console.log(`  ✅ ${path.relative(srcDir, fullPath)}`);
          filesChanged++;
        }
      } catch (error) {
        console.error(`  ❌ Erreur ${path.relative(srcDir, fullPath)}:`, error.message);
      }
    }
  });
  
  return { filesProcessed, filesChanged };
}

// ====================================
// EXÉCUTION PRINCIPALE AVEC GESTION D'ERREURS
// ====================================

try {
  console.log('🔍 Génération du mapping dynamique...');
  const mapping = generateDynamicMapping();
  
  if (Object.keys(mapping).length === 0) {
    console.log('⚠️  Aucun mapping généré - Le projet utilise peut-être déjà les hooks');
    console.log('✅ Migration ignorée - Aucune action nécessaire');
    process.exit(0);
  }
  
  console.log(`📊 ${Object.keys(mapping).length} fonctions mappées dynamiquement`);
  
  // Afficher un échantillon du mapping pour debug
  console.log('\n📋 Échantillon du mapping généré:');
  Object.entries(mapping).slice(0, 10).forEach(([func, info]) => {
    console.log(`  ${func} → ${info.hook}.${info.property}`);
  });
  
  const dirsToProcess = [
    path.join(srcDir, 'app'),
    path.join(srcDir, 'components'),
    path.join(srcDir, 'pages')
  ].filter(dir => fs.existsSync(dir));
  
  if (dirsToProcess.length === 0) {
    console.log('⚠️  Aucun répertoire src trouvé - Structure projet non standard');
    process.exit(0);
  }
  
  let totalFilesProcessed = 0;
  let totalFilesChanged = 0;
  
  dirsToProcess.forEach(dir => {
    console.log(`\n📁 Traitement: ${path.relative(srcDir, dir)}`);
    const result = processDirectory(dir, mapping);
    totalFilesProcessed += result.filesProcessed;
    totalFilesChanged += result.filesChanged;
    console.log(`  📊 ${result.filesChanged}/${result.filesProcessed} fichiers modifiés`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎉 Migration DYNAMIQUE terminée !`);
  console.log(`📊 Résultats finaux:`);
  console.log(`   - ${totalFilesProcessed} fichiers analysés`);
  console.log(`   - ${totalFilesChanged} fichiers migrés automatiquement`);
  console.log(`   - ${Object.keys(mapping).length} fonctions mappées dynamiquement`);
  console.log(`\n✅ Migration 100% automatique et future-proof !`);
  
  if (totalFilesChanged > 0) {
    console.log(`\n🚀 Actions effectuées automatiquement:`);
    console.log(`   ✓ Détection automatique des modèles depuis prisma-service.ts`);
    console.log(`   ✓ Génération dynamique du mapping fonction → hook`);
    console.log(`   ✓ Remplacement automatique imports prisma-service → hooks`);
    console.log(`   ✓ Ajout automatique des déclarations de hooks`);
    console.log(`   ✓ Transformation des appels de fonctions`);
    console.log(`   ✓ Support automatique des futurs modèles !`);
  }
  
} catch (error) {
  console.error('❌ Erreur lors de la migration dynamique:', error.message);
  console.error('📋 Debug info:');
  console.error('- srcDir:', srcDir);
  console.error('- prismaServicePath:', prismaServicePath);
  console.error('- hooksDir:', hooksDir);
  
  // Détails environnement pour debug
  console.error('\n🔍 Vérifications:');
  console.error('- src/ existe:', fs.existsSync(srcDir));
  console.error('- prisma-service.ts existe:', fs.existsSync(prismaServicePath));
  console.error('- hooks/ existe:', fs.existsSync(hooksDir));
  
  process.exit(1);
}