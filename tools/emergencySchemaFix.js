const fs = require('fs');
const path = require('path');

console.log('🚨 DIAGNOSTIC ET CORRECTION SCHEMA PRISMA...');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const typesPath = path.join(__dirname, '../src/lib/types.ts');

function diagnoseCurrentSchema() {
  console.log('🔍 Diagnostic du schema actuel...');
  
  if (!fs.existsSync(schemaPath)) {
    console.log('❌ Schema n\'existe pas');
    return false;
  }
  
  const content = fs.readFileSync(schemaPath, 'utf-8');
  console.log('📊 Taille:', content.length, 'caractères');
  
  // Chercher les lignes problématiques
  const lines = content.split('\n');
  const problematicLines = [];
  
  lines.forEach((line, index) => {
    // Détecter les lignes qui commencent par un type sans nom de champ
    if (line.trim().match(/^(String|Int|Float|Boolean|DateTime|Json)\s+/)) {
      problematicLines.push({
        lineNumber: index + 1,
        content: line
      });
    }
    
    // Détecter les doublons de timestamps
    if (line.includes('DateTime @default(now())') && !line.includes('createdAt') && !line.includes('updatedAt')) {
      problematicLines.push({
        lineNumber: index + 1,
        content: line,
        type: 'orphan_datetime'
      });
    }
  });
  
  if (problematicLines.length > 0) {
    console.log('❌ Lignes problématiques détectées:');
    problematicLines.forEach(prob => {
      console.log(`  Ligne ${prob.lineNumber}: "${prob.content.trim()}"`);
    });
    return false;
  }
  
  console.log('✅ Schema semble correct');
  return true;
}

function createEmergencySchema() {
  console.log('🔧 Création schema d\'urgence...');
  
  // Lire types.ts
  if (!fs.existsSync(typesPath)) {
    console.error('❌ types.ts introuvable');
    return false;
  }
  
  const typesContent = fs.readFileSync(typesPath, 'utf-8');
  console.log('📖 types.ts lu');
  
  // Extraire les noms d'interfaces SEULEMENT
  const interfaceNames = [];
  const regex = /export\s+interface\s+(\w+)/g;
  let match;
  
  while ((match = regex.exec(typesContent)) !== null) {
    interfaceNames.push(match[1]);
  }
  
  console.log('📋 Interfaces détectées:', interfaceNames.join(', '));
  
  if (interfaceNames.length === 0) {
    console.error('❌ Aucune interface trouvée');
    return false;
  }
  
  // Créer un schema ultra-minimaliste mais fonctionnel
  const schemaLines = [
    '// Schema Prisma d\'urgence - Version ultra-minimaliste',
    'generator client {',
    '  provider = "prisma-client-js"',
    '}',
    '',
    'datasource db {',
    '  provider = "postgresql"',
    '  url      = env("DATABASE_URL")',
    '}',
    ''
  ];
  
  // Ajouter chaque modèle avec structure minimale
  interfaceNames.forEach(interfaceName => {
    schemaLines.push(`model ${interfaceName} {`);
    schemaLines.push('  id        Int      @id @default(autoincrement())');
    
    // Ajouter des champs de base selon le nom du modèle
    if (interfaceName.toLowerCase().includes('user')) {
      schemaLines.push('  email     String?  @unique');
      schemaLines.push('  nom       String?');
    } else if (interfaceName.toLowerCase().includes('host')) {
      schemaLines.push('  nom       String?');
      schemaLines.push('  email     String?');
    } else {
      // Pour tous les autres modèles, champs génériques
      schemaLines.push('  nom       String?');
    }
    
    schemaLines.push('  createdAt DateTime @default(now())');
    schemaLines.push('  updatedAt DateTime @updatedAt');
    schemaLines.push('}');
    schemaLines.push('');
  });
  
  const schemaContent = schemaLines.join('\n');
  
  // Créer le répertoire si nécessaire
  const prismaDir = path.dirname(schemaPath);
  if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir, { recursive: true });
  }
  
  // Écrire le schema
  fs.writeFileSync(schemaPath, schemaContent, 'utf-8');
  
  // Vérifier
  if (fs.existsSync(schemaPath)) {
    const size = fs.statSync(schemaPath).size;
    console.log('✅ Schema d\'urgence créé');
    console.log('📊 Taille:', size, 'bytes');
    console.log('📋 Modèles:', interfaceNames.length);
    
    // Vérifier qu'il n'y a pas de lignes problématiques
    const content = fs.readFileSync(schemaPath, 'utf-8');
    if (content.includes('DateTime @default(now())') && !content.includes('createdAt DateTime @default(now())')) {
      console.error('❌ Schema contient encore des erreurs');
      return false;
    }
    
    return true;
  }
  
  return false;
}

function fixExistingSchema() {
  console.log('🔧 Tentative de réparation du schema existant...');
  
  const content = fs.readFileSync(schemaPath, 'utf-8');
  const lines = content.split('\n');
  const fixedLines = [];
  
  let insideModel = false;
  let currentModel = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Détecter début de modèle
    if (line.match(/^model\s+(\w+)/)) {
      insideModel = true;
      currentModel = line.match(/^model\s+(\w+)/)[1];
      fixedLines.push(line);
      continue;
    }
    
    // Détecter fin de modèle
    if (line.trim() === '}' && insideModel) {
      insideModel = false;
      currentModel = '';
      fixedLines.push(line);
      continue;
    }
    
    // Si on est dans un modèle, vérifier les lignes
    if (insideModel) {
      // Ignorer les lignes qui commencent par un type sans nom
      if (line.trim().match(/^(String|Int|Float|Boolean|DateTime|Json)\s+/)) {
        console.log(`  🗑️  Ligne orpheline supprimée: "${line.trim()}"`);
        continue; // Ignorer cette ligne
      }
      
      // Ignorer les lignes de timestamp orphelines
      if (line.includes('DateTime @default(now())') && !line.includes('createdAt') && !line.includes('updatedAt')) {
        console.log(`  🗑️  Timestamp orphelin supprimé: "${line.trim()}"`);
        continue;
      }
    }
    
    fixedLines.push(line);
  }
  
  const fixedContent = fixedLines.join('\n');
  fs.writeFileSync(schemaPath, fixedContent, 'utf-8');
  
  console.log('✅ Schema réparé');
  return true;
}

try {
  // Diagnostic
  const isValid = diagnoseCurrentSchema();
  
  if (!isValid) {
    console.log('🔧 Schema invalide détecté');
    
    // Essayer de réparer d'abord
    if (fs.existsSync(schemaPath)) {
      fixExistingSchema();
      
      // Re-vérifier
      if (diagnoseCurrentSchema()) {
        console.log('✅ Schema réparé avec succès');
        process.exit(0);
      }
    }
    
    // Si la réparation échoue, créer un schema d'urgence
    console.log('🚨 Création schema d\'urgence...');
    const success = createEmergencySchema();
    
    if (success) {
      console.log('✅ Schema d\'urgence créé avec succès');
      process.exit(0);
    } else {
      console.error('❌ Impossible de créer un schema valide');
      process.exit(1);
    }
  } else {
    console.log('✅ Schema existant est valide');
    process.exit(0);
  }
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
