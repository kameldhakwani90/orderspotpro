const fs = require('fs');
const path = require('path');

console.log('🚨 GÉNÉRATION FORCÉE du service Prisma...');

const typesPath = path.join(__dirname, '../src/lib/types.ts');
const servicePath = path.join(__dirname, '../src/lib/prisma-service.ts');

function forceCreatePrismaService() {
  console.log('🔧 Diagnostic et génération forcée...');
  
  // Vérifier si types.ts existe
  if (!fs.existsSync(typesPath)) {
    console.error('❌ types.ts introuvable à:', typesPath);
    return false;
  }
  
  // Lire types.ts
  const typesContent = fs.readFileSync(typesPath, 'utf-8');
  console.log('📖 types.ts lu, taille:', typesContent.length, 'caractères');
  
  // Extraire les interfaces de base
  const interfaceMatches = typesContent.match(/export\s+interface\s+(\w+)/g);
  if (!interfaceMatches) {
    console.error('❌ Aucune interface trouvée dans types.ts');
    console.log('📋 Début du contenu:', typesContent.substring(0, 500));
    return false;
  }
  
  const interfaces = interfaceMatches.map(match => match.replace('export interface ', ''));
  console.log('📋 Interfaces détectées:', interfaces.join(', '));
  
  // Créer le service Prisma minimal mais complet
  const serviceContent = createMinimalService(interfaces);
  
  // Créer le répertoire si nécessaire
  const serviceDir = path.dirname(servicePath);
  if (!fs.existsSync(serviceDir)) {
    fs.mkdirSync(serviceDir, { recursive: true });
    console.log('📁 Répertoire créé:', serviceDir);
  }
  
  // Écrire le fichier
  fs.writeFileSync(servicePath, serviceContent, 'utf-8');
  
  // Vérifier
  if (fs.existsSync(servicePath)) {
    const size = fs.statSync(servicePath).size;
    console.log('✅ Service créé:', servicePath);
    console.log('📊 Taille:', size, 'bytes');
    return true;
  } else {
    console.error('❌ Échec création du fichier');
    return false;
  }
}

function createMinimalService(interfaces) {
  const lines = [
    '// Service Prisma généré AUTOMATIQUEMENT - Version de secours',
    'import { PrismaClient } from "@prisma/client";',
    '',
    'declare global {',
    '  var prisma: PrismaClient | undefined;',
    '}',
    '',
    'export const prisma = globalThis.prisma || new PrismaClient({',
    '  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],',
    '});',
    '',
    'if (process.env.NODE_ENV !== "production") {',
    '  globalThis.prisma = prisma;',
    '}',
    '',
    '// ============================================',
    '// FONCTIONS CRUD GÉNÉRÉES AUTOMATIQUEMENT',
    '// ============================================',
    ''
  ];
  
  // Générer CRUD pour chaque interface
  interfaces.forEach(modelName => {
    const camelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    
    lines.push(`// =============== ${modelName.toUpperCase()} ===============`);
    lines.push('');
    
    // GET BY ID
    lines.push(`export async function get${modelName}ById(id: number) {`);
    lines.push('  try {');
    lines.push(`    return await prisma.${camelName}.findUnique({ where: { id } });`);
    lines.push('  } catch (error) {');
    lines.push(`    console.error("Erreur get${modelName}ById:", error);`);
    lines.push('    throw error;');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    
    // GET ALL
    lines.push(`export async function getAll${modelName}s() {`);
    lines.push('  try {');
    lines.push(`    return await prisma.${camelName}.findMany({`);
    lines.push('      orderBy: { createdAt: "desc" }');
    lines.push('    });');
    lines.push('  } catch (error) {');
    lines.push(`    console.error("Erreur getAll${modelName}s:", error);`);
    lines.push('    throw error;');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    
    // CREATE
    lines.push(`export async function create${modelName}(data: any) {`);
    lines.push('  try {');
    lines.push('    const { id, createdAt, updatedAt, ...cleanData } = data;');
    lines.push(`    return await prisma.${camelName}.create({ data: cleanData });`);
    lines.push('  } catch (error) {');
    lines.push(`    console.error("Erreur create${modelName}:", error);`);
    lines.push('    throw error;');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    
    // UPDATE
    lines.push(`export async function update${modelName}(id: number, data: any) {`);
    lines.push('  try {');
    lines.push('    const { id: _, createdAt, updatedAt, ...cleanData } = data;');
    lines.push(`    return await prisma.${camelName}.update({ where: { id }, data: cleanData });`);
    lines.push('  } catch (error) {');
    lines.push(`    console.error("Erreur update${modelName}:", error);`);
    lines.push('    throw error;');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    
    // DELETE
    lines.push(`export async function delete${modelName}(id: number) {`);
    lines.push('  try {');
    lines.push(`    return await prisma.${camelName}.delete({ where: { id } });`);
    lines.push('  } catch (error) {');
    lines.push(`    console.error("Erreur delete${modelName}:", error);`);
    lines.push('    throw error;');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    
    // ALIASES
    lines.push('// Aliases pour compatibilité');
    lines.push(`export const add${modelName} = create${modelName};`);
    lines.push(`export const get${modelName.toLowerCase()}s = getAll${modelName}s;`);
    lines.push('');
  });
  
  // Utilitaires
  lines.push('// ============================================');
  lines.push('// UTILITAIRES');
  lines.push('// ============================================');
  lines.push('');
  lines.push('export async function connectToDatabase() {');
  lines.push('  try {');
  lines.push('    await prisma.$connect();');
  lines.push('    console.log("✅ Connexion DB établie");');
  lines.push('    return true;');
  lines.push('  } catch (error) {');
  lines.push('    console.error("❌ Erreur connexion DB:", error);');
  lines.push('    return false;');
  lines.push('  }');
  lines.push('}');
  lines.push('');
  lines.push('export async function healthCheck() {');
  lines.push('  try {');
  lines.push('    await prisma.$queryRaw`SELECT 1`;');
  lines.push('    return { status: "ok", timestamp: new Date().toISOString() };');
  lines.push('  } catch (error) {');
  lines.push('    return { status: "error", error: error.message, timestamp: new Date().toISOString() };');
  lines.push('  }');
  lines.push('}');
  
  return lines.join('\n');
}

// Exécution
try {
  const success = forceCreatePrismaService();
  if (success) {
    console.log('🎉 Service Prisma créé avec succès !');
    process.exit(0);
  } else {
    console.error('❌ Échec création service Prisma');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
