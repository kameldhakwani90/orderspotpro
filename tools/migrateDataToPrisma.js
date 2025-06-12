const fs = require('fs');
const path = require('path');

console.log('🔄 Migration des imports data.ts vers prisma-service.ts...');

// Mapping des fonctions data.ts → prisma-service.ts
const functionMappings = {
  // Users
  'getUsers': 'getAllUsers',
  'getUserById': 'getUserById', 
  'addUser': 'createUser',
  'updateUser': 'updateUser',
  'deleteUser': 'deleteUser',
  
  // Hosts
  'getHosts': 'getAllHosts',
  'getHostById': 'getHostById',
  'addHost': 'createHost',
  'updateHost': 'updateHost',
  
  // Clients
  'getClients': 'getAllClients',
  'getClientById': 'getClientById', 
  'addClient': 'createClient',
  'updateClient': 'updateClient',
  'deleteClient': 'deleteClient',
  
  // Orders
  'getOrders': 'getAllOrders',
  'getOrderById': 'getOrderById',
  'addOrder': 'createOrder',
  'updateOrder': 'updateOrder',
  'getOrdersByClientName': 'getAllOrders', // À filtrer côté app
  'getOrdersByUserId': 'getAllOrders', // À filtrer côté app
  'getOrdersByClientId': 'getAllOrders', // À filtrer côté app
  
  // Services
  'getServices': 'getAllServices',
  'getServiceById': 'getServiceById',
  'addService': 'createService',
  'updateService': 'updateService',
  
  // Reservations
  'getReservations': 'getAllReservations',
  'getReservationById': 'getReservationById',
  'addReservation': 'createReservation',
  'updateReservation': 'updateReservation',
  'cancelReservation': 'updateReservation', // Avec status cancelled
  
  // Sites
  'getSites': 'getAllSites',
  'getSiteById': 'getSiteById',
  
  // RoomOrTable
  'getRoomsOrTables': 'getAllRoomOrTables',
  'getRoomOrTableById': 'getRoomOrTableById',
  
  // Tags
  'getTags': 'getAllTags',
  'getTagById': 'getTagById',
  
  // MenuCards
  'getMenuCards': 'getAllMenuCards',
  'getMenuCardById': 'getMenuCardById'
};

function migrateFileContent(content) {
  let changed = false;
  let newContent = content;
  
  // 1. Remplacer l'import principal
  if (newContent.includes("from '@/lib/data'") || newContent.includes('from "./data"') || newContent.includes('from "../lib/data"')) {
    // Extraire les fonctions importées
    const importRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"][^'"]*data['"]/g;
    const matches = [...newContent.matchAll(importRegex)];
    
    matches.forEach(match => {
      const importedFunctions = match[1]
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);
      
      // Mapper les fonctions
      const mappedFunctions = importedFunctions.map(func => {
        return functionMappings[func] || func;
      });
      
      // Créer le nouvel import
      const newImport = `import { ${mappedFunctions.join(', ')} } from '@/lib/prisma-service'`;
      
      // Remplacer dans le contenu
      newContent = newContent.replace(match[0], newImport);
      changed = true;
    });
  }
  
  // 2. Remplacer les appels de fonctions dans le code
  Object.entries(functionMappings).forEach(([oldFunc, newFunc]) => {
    if (oldFunc !== newFunc) {
      const regex = new RegExp(`\\b${oldFunc}\\(`, 'g');
      if (regex.test(newContent)) {
        newContent = newContent.replace(regex, `${newFunc}(`);
        changed = true;
      }
    }
  });
  
  return { content: newContent, changed };
}

function processDirectory(dirPath) {
  let totalChanges = 0;
  
  if (!fs.existsSync(dirPath)) {
    console.log(`⏭️ Répertoire ${dirPath} introuvable`);
    return totalChanges;
  }
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  entries.forEach(entry => {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Récursion dans les sous-dossiers
      totalChanges += processDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      // Traiter les fichiers TypeScript/React
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const { content: newContent, changed } = migrateFileContent(content);
        
        if (changed) {
          fs.writeFileSync(fullPath, newContent, 'utf-8');
          console.log(`✅ Migré: ${path.relative(process.cwd(), fullPath)}`);
          totalChanges++;
        }
      } catch (error) {
        console.error(`❌ Erreur lors du traitement de ${fullPath}:`, error.message);
      }
    }
  });
  
  return totalChanges;
}

// Traiter tous les répertoires source
const dirsToProcess = [
  path.join(__dirname, '../src/app'),
  path.join(__dirname, '../src/components'),
  path.join(__dirname, '../src/pages'),
  path.join(__dirname, '../src/lib'),
];

let totalChanges = 0;
dirsToProcess.forEach(dir => {
  console.log(`🔍 Traitement du répertoire: ${dir}`);
  totalChanges += processDirectory(dir);
});

if (totalChanges > 0) {
  console.log(`✅ Migration terminée: ${totalChanges} fichier(s) modifié(s)`);
  console.log('📋 Actions effectuées:');
  console.log('   - Remplacement des imports @/lib/data → @/lib/prisma-service');
  console.log('   - Mapping des noms de fonctions vers les équivalents Prisma');
  console.log('   - Traitement récursif de /src/app, /src/components, /src/pages');
} else {
  console.log('⏭️ Aucune migration nécessaire - tous les fichiers sont déjà à jour');
}
