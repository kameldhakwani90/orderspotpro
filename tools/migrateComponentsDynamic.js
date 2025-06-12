const fs = require('fs');
const path = require('path');

console.log('🔧 Migration DYNAMIQUE des composants vers hooks...');

const srcDir = path.join(__dirname, '../src');
const prismaServicePath = path.join(__dirname, '../src/lib/prisma-service.ts');
const excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build'];

function generateDynamicFunctionMapping() {
  console.log('🔍 Génération DYNAMIQUE du mapping depuis prisma-service.ts...');
  
  if (!fs.existsSync(prismaServicePath)) {
    console.error('❌ prisma-service.ts introuvable');
    return {};
  }
  
  const content = fs.readFileSync(prismaServicePath, 'utf-8');
  const mapping = {};
  
  // Extraire tous les modèles dynamiquement
  const getAllRegex = /export async function getAll(\w+)s\(\)/g;
  let match;
  
  while ((match = getAllRegex.exec(content)) !== null) {
    const modelName = match[1];
    const pluralModel = modelName.toLowerCase() + 's';
    const hookName = `use${modelName}s`;
    
    // Générer toutes les fonctions possibles pour ce modèle
    const baseFunctions = [
      `getAll${modelName}s`,
      `get${modelName}ById`, 
      `create${modelName}`,
      `update${modelName}`,
      `delete${modelName}`,
      `add${modelName}`,
    ];
    
    // Ajouter des alias courants
    const aliases = [
      `get${pluralModel}`,
      ...(modelName === 'User' ? [`getUserByEmail`, `getUsers`] : []),
      ...(modelName === 'RoomOrTable' ? [`getRoomsOrTables`] : []),
      ...(modelName === 'Tag' ? [`getTags`] : []),
      ...(modelName === 'Host' ? [`getHosts`] : []),
      ...(modelName === 'Client' ? [`getClients`] : []),
      ...(modelName === 'Order' ? [`getOrders`] : []),
      ...(modelName === 'Service' ? [`getServices`] : []),
      ...(modelName === 'Reservation' ? [`getReservations`] : []),
      ...(modelName === 'Site' ? [`getSites`] : []),
    ];
    
    const allFunctions = [...baseFunctions, ...aliases];
    
    allFunctions.forEach(funcName => {
      let property;
      
      // Détermine dynamiquement la propriété basée sur le pattern de fonction
      if (funcName.startsWith('getAll') || funcName === `get${pluralModel}` || 
          funcName === 'getTags' || funcName === 'getRoomsOrTables' ||
          funcName === 'getHosts' || funcName === 'getClients' ||
          funcName === 'getOrders' || funcName === 'getServices' ||
          funcName === 'getReservations' || funcName === 'getSites' ||
          funcName === 'getUsers') {
        property = pluralModel;
      } else if (funcName.includes('ById') || funcName.includes('ByEmail')) {
        property = `get${modelName}ById`;
      } else if (funcName.startsWith('create') || funcName.startsWith('add')) {
        property = `add${modelName}`;
      } else if (funcName.startsWith('update')) {
        property = `update${modelName}`;
      } else if (funcName.startsWith('delete')) {
        property = `delete${modelName}`;
      } else {
        property = funcName;
      }
      
      mapping[funcName] = { 
        hook: hookName, 
        property: property 
      };
    });
    
    console.log(`  ✅ ${modelName}: ${allFunctions.length} fonctions mappées`);
  }
  
  return mapping;
}

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
}

function shouldSkipDirectory(dirName) {
  return excludeDirs.includes(dirName) || dirName.startsWith('.');
}

function analyzeImports(content) {
  const imports = {
    prismaService: [],
    otherImports: []
  };
  
  const prismaImportRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"][^'"]*prisma-service['"]/g;
  const matches = [...content.matchAll(prismaImportRegex)];
  
  matches.forEach(match => {
    const functions = match[1]
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);
    imports.prismaService.push(...functions);
  });
  
  return imports;
}

function generateHookImports(usedFunctions, functionMapping) {
  const hookImports = new Set();
  const hookUsages = new Map();
  
  usedFunctions.forEach(func => {
    const mapping = functionMapping[func];
    if (mapping) {
      hookImports.add(mapping.hook);
      if (!hookUsages.has(mapping.hook)) {
        hookUsages.set(mapping.hook, new Set());
      }
      hookUsages.get(mapping.hook).add(mapping.property);
    }
  });
  
  return { hookImports: Array.from(hookImports), hookUsages };
}

function transformFileContent(content, filePath, functionMapping) {
  let newContent = content;
  let hasChanges = false;
  
  const imports = analyzeImports(content);
  
  if (imports.prismaService.length === 0) {
    return { content: newContent, changed: false };
  }
  
  console.log(`  🔍 ${path.relative(srcDir, filePath)}: ${imports.prismaService.length} fonctions Prisma`);
  
  const { hookImports, hookUsages } = generateHookImports(imports.prismaService, functionMapping);
  
  if (hookImports.length === 0) {
    return { content: newContent, changed: false };
  }
  
  // 1. Supprimer les imports prisma-service
  const prismaImportRegex = /import\s*\{\s*[^}]+\s*\}\s*from\s*['"][^'"]*prisma-service['"];?\n?/g;
  newContent = newContent.replace(prismaImportRegex, '');
  hasChanges = true;
  
  // 2. Ajouter les imports de hooks
  const hookImportLines = hookImports.map(hook => `import { ${hook} } from '@/hooks';`).join('\n');
  
  const firstImportMatch = newContent.match(/^import\s/m);
  if (firstImportMatch) {
    const insertPosition = firstImportMatch.index;
    newContent = newContent.slice(0, insertPosition) + hookImportLines + '\n' + newContent.slice(insertPosition);
  } else {
    newContent = `'use client';\n\n${hookImportLines}\n\n${newContent}`;
  }
  
  // 3. Ajouter les déclarations de hooks
  hookImports.forEach(hook => {
    const functionRegex = /(export\s+(?:default\s+)?function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|function\s+\w+\s*\([^)]*\))/;
    const match = newContent.match(functionRegex);
    
    if (match) {
      const hookDeclaration = `  const { ${Array.from(hookUsages.get(hook)).join(', ')} } = ${hook}();\n`;
      
      const insertAfter = match.index + match[0].length;
      const nextBraceIndex = newContent.indexOf('{', insertAfter);
      
      if (nextBraceIndex !== -1) {
        newContent = newContent.slice(0, nextBraceIndex + 1) + '\n' + hookDeclaration + newContent.slice(nextBraceIndex + 1);
      }
    }
  });
  
  // 4. Remplacer les appels de fonctions
  imports.prismaService.forEach(func => {
    const mapping = functionMapping[func];
    if (mapping) {
      const functionCallRegex = new RegExp(`\\b${func}\\s*\\(`, 'g');
      newContent = newContent.replace(functionCallRegex, `${mapping.property}(`);
      hasChanges = true;
    }
  });
  
  return { content: newContent, changed: hasChanges };
}

function processDirectory(dirPath, functionMapping) {
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
        const result = processDirectory(fullPath, functionMapping);
        filesProcessed += result.filesProcessed;
        filesChanged += result.filesChanged;
      }
    } else if (entry.isFile() && shouldProcessFile(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const { content: newContent, changed } = transformFileContent(content, fullPath, functionMapping);
        
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

// Exécution principale
try {
  console.log('🔍 Génération du mapping dynamique...');
  const functionMapping = generateDynamicFunctionMapping();
  
  if (Object.keys(functionMapping).length === 0) {
    console.error('❌ Aucun mapping généré');
    process.exit(1);
  }
  
  console.log(`📊 ${Object.keys(functionMapping).length} fonctions mappées dynamiquement`);
  
  const dirsToProcess = [
    path.join(srcDir, 'app'),
    path.join(srcDir, 'components'),
    path.join(srcDir, 'pages')
  ];
  
  let totalFilesProcessed = 0;
  let totalFilesChanged = 0;
  
  dirsToProcess.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`📁 Traitement: ${path.relative(srcDir, dir)}`);
      const result = processDirectory(dir, functionMapping);
      totalFilesProcessed += result.filesProcessed;
      totalFilesChanged += result.filesChanged;
    }
  });
  
  console.log(`\n🎉 Migration DYNAMIQUE terminée !`);
  console.log(`📊 Résultats:`);
  console.log(`   - ${totalFilesProcessed} fichiers analysés`);
  console.log(`   - ${totalFilesChanged} fichiers modifiés`);
  console.log(`   - Migration 100% automatique basée sur prisma-service.ts`);
  
  if (totalFilesChanged > 0) {
    console.log(`\n✅ Actions effectuées automatiquement:`);
    console.log(`   - Remplacement imports prisma-service → hooks`);
    console.log(`   - Ajout déclarations hooks dans composants`);
    console.log(`   - Transformation appels de fonctions`);
    console.log(`   - Mapping généré dynamiquement depuis Prisma`);
  }
  
} catch (error) {
  console.error('❌ Erreur lors de la migration dynamique:', error);
  process.exit(1);
}