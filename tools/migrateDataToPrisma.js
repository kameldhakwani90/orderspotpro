const fs = require('fs');
const path = require('path');

console.log('🔄 Migration FORCÉE data.ts → prisma-service.ts');

const prismaServicePath = path.join(__dirname, '../src/lib/prisma-service.ts');

function forceMigration() {
  console.log('🔍 Scan COMPLET des fichiers sources...');
  
  let totalFiles = 0;
  let migratedFiles = 0;
  
  // Fonction récursive pour scanner tous les fichiers
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !['node_modules', '.git', '.next', 'dist'].includes(entry.name)) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
        totalFiles++;
        
        try {
          let content = fs.readFileSync(fullPath, 'utf-8');
          let changed = false;
          
          // Migration FORCÉE de tous les patterns d'import
          const patterns = [
            /from\s+['"]@\/lib\/data['"]/g,
            /from\s+['"]\.\/data['"]/g,
            /from\s+['"]\.\.\/lib\/data['"]/g,
            /from\s+['"]\.\.\/\.\.\/lib\/data['"]/g,
            /import\s+.*\s+from\s+['"]@\/lib\/data['"]/g
          ];
          
          patterns.forEach(pattern => {
            if (pattern.test(content)) {
              content = content.replace(pattern, match => {
                changed = true;
                return match.replace(/data['"]/, 'prisma-service"');
              });
            }
          });
          
          // Migration des noms de fonctions
          const functionMappings = {
            'addHostToData': 'addHost',
            'updateHostInData': 'updateHost',
            'deleteHostInData': 'deleteHost',
            'addClientData': 'addClient',
            'updateClientData': 'updateClient',
            'deleteClientData': 'deleteClient',
            'getHostsData': 'getHosts',
            'getClientsData': 'getClients'
          };
          
          Object.entries(functionMappings).forEach(([oldName, newName]) => {
            const regex = new RegExp(`\\b${oldName}\\b`, 'g');
            if (regex.test(content)) {
              content = content.replace(regex, newName);
              changed = true;
            }
          });
          
          if (changed) {
            fs.writeFileSync(fullPath, content, 'utf-8');
            console.log(`✅ Migré: ${path.relative(process.cwd(), fullPath)}`);
            migratedFiles++;
          }
          
        } catch (error) {
          console.error(`❌ Erreur ${fullPath}:`, error.message);
        }
      }
    });
  }
  
  // Scanner tous les dossiers sources
  const dirsToScan = [
    path.join(__dirname, '../src/app'),
    path.join(__dirname, '../src/components'),
    path.join(__dirname, '../src/pages'),
    path.join(__dirname, '../src/lib')
  ];
  
  dirsToScan.forEach(dir => {
    console.log(`🔍 Scan: ${path.basename(dir)}/`);
    scanDirectory(dir);
  });
  
  console.log('\n📊 RÉSULTAT MIGRATION:');
  console.log(`   📄 Fichiers scannés: ${totalFiles}`);
  console.log(`   ✅ Fichiers migrés: ${migratedFiles}`);
  
  // Validation post-migration
  console.log('\n🔍 Validation post-migration...');
  let remainingImports = 0;
  
  dirsToScan.forEach(dir => {
    scanDirectory(dir);
    function validateDirectory(dir) {
      if (!fs.existsSync(dir)) return;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !['node_modules', '.git', '.next'].includes(entry.name)) {
          validateDirectory(fullPath);
        } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            if (content.includes('@/lib/data')) {
              console.log(`⚠️  Import restant: ${path.relative(process.cwd(), fullPath)}`);
              remainingImports++;
            }
          } catch (error) {
            // Ignorer erreurs de lecture
          }
        }
      });
    }
    validateDirectory(dir);
  });
  
  if (remainingImports === 0) {
    console.log('✅ Migration COMPLÈTE - Aucun import @/lib/data restant');
    return true;
  } else {
    console.log(`⚠️  ${remainingImports} import(s) @/lib/data restant(s)`);
    return false;
  }
}

// Vérifier que prisma-service.ts existe
if (!fs.existsSync(prismaServicePath)) {
  console.error('❌ prisma-service.ts introuvable - Génération requise');
  process.exit(1);
}

// Exécution
try {
  const success = forceMigration();
  if (!success) {
    console.log('⚠️  Migration partielle - Vérifiez les imports restants');
  }
  console.log('🎉 Migration terminée !');
} catch (error) {
  console.error('❌ Erreur migration:', error.message);
  process.exit(1);
}