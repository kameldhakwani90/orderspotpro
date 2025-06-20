const fs = require('fs');
const path = require('path');

console.log('🚀 Génération SERVICE PRISMA - Version ultra-simple...');

const typesPath = path.join(__dirname, '../src/lib/types.ts');
const servicePath = path.join(__dirname, '../src/lib/prisma-service.ts');

function extractInterfaces() {
  if (!fs.existsSync(typesPath)) {
    console.error('❌ types.ts introuvable');
    return [];
  }
  
  const content = fs.readFileSync(typesPath, 'utf-8');
  const interfaces = [];
  
  const regex = /export\s+interface\s+(\w+)\s*\{/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    interfaces.push(match[1]);
    console.log('  📋 Interface: ' + match[1]);
  }
  
  return interfaces;
}

function generateSimpleService(models) {
  console.log('🔧 Génération service simple...');
  
  const lines = [
    '// Service Prisma généré automatiquement',
    "import { PrismaClient } from '@prisma/client';",
    '',
    'declare global {',
    '  var prisma: PrismaClient | undefined;',
    '}',
    '',
    'export const prisma = globalThis.prisma || new PrismaClient();',
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
  
  // Générer CRUD pour chaque modèle
  models.forEach(modelName => {
    const camelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const pluralName = modelName.toLowerCase() + 's';
    
    lines.push('// =============== ' + modelName.toUpperCase() + ' ===============');
    lines.push('');
    
    // GET BY ID
    lines.push('export async function get' + modelName + 'ById(id: string) {');
    lines.push('  try {');
    lines.push('    const ' + camelName + ' = await prisma.' + camelName + '.findUnique({');
    lines.push('      where: { id: id }');
    lines.push('    });');
    lines.push('    return ' + camelName + ';');
    lines.push('  } catch (error) {');
    lines.push('    console.error("Erreur get' + modelName + 'ById:", error);');
    lines.push('    throw error;');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    
    // GET ALL
    lines.push('export async function getAll' + modelName + 's() {');
    lines.push('  try {');
    lines.push('    const ' + pluralName + ' = await prisma.' + camelName + '.findMany({');
    lines.push('      orderBy: { createdAt: "desc" }');
    lines.push('    });');
    lines.push('    return ' + pluralName + ';');
    lines.push('  } catch (error) {');
    lines.push('    console.error("Erreur getAll' + modelName + 's:", error);');
    lines.push('    throw error;');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    
    // CREATE
    lines.push('export async function create' + modelName + '(data: any) {');
    lines.push('  try {');
    lines.push('    const cleanData = { ...data };');
    lines.push('    delete cleanData.id;');
    lines.push('    delete cleanData.createdAt;');
    lines.push('    delete cleanData.updatedAt;');
    lines.push('    ');
    lines.push('    const new' + modelName + ' = await prisma.' + camelName + '.create({');
    lines.push('      data: cleanData');
    lines.push('    });');
    lines.push('    return new' + modelName + ';');
    lines.push('  } catch (error) {');
    lines.push('    console.error("Erreur create' + modelName + ':", error);');
    lines.push('    throw error;');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    
    // UPDATE
    lines.push('export async function update' + modelName + '(id: string, data: any) {');
    lines.push('  try {');
    lines.push('    const cleanData = { ...data };');
    lines.push('    delete cleanData.id;');
    lines.push('    delete cleanData.createdAt;');
    lines.push('    delete cleanData.updatedAt;');
    lines.push('    ');
    lines.push('    const updated' + modelName + ' = await prisma.' + camelName + '.update({');
    lines.push('      where: { id: id },');
    lines.push('      data: cleanData');
    lines.push('    });');
    lines.push('    return updated' + modelName + ';');
    lines.push('  } catch (error) {');
    lines.push('    console.error("Erreur update' + modelName + ':", error);');
    lines.push('    throw error;');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    
    // DELETE
    lines.push('export async function delete' + modelName + '(id: string) {');
    lines.push('  try {');
    lines.push('    const deleted' + modelName + ' = await prisma.' + camelName + '.delete({');
    lines.push('      where: { id: id }');
    lines.push('    });');
    lines.push('    return deleted' + modelName + ';');
    lines.push('  } catch (error) {');
    lines.push('    console.error("Erreur delete' + modelName + ':", error);');
    lines.push('    throw error;');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    
    // ALIASES
    lines.push('// Aliases pour compatibilité');
    lines.push('export const get' + pluralName + ' = getAll' + modelName + 's;');
    lines.push('export const add' + modelName + ' = create' + modelName + ';');
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
  lines.push('    console.log("Connexion DB établie");');
  lines.push('    return true;');
  lines.push('  } catch (error) {');
  lines.push('    console.error("Erreur connexion DB:", error);');
  lines.push('    return false;');
  lines.push('  }');
  lines.push('}');
  lines.push('');
  lines.push('export async function healthCheck() {');
  lines.push('  try {');
  lines.push('    const result = await prisma.$queryRaw`SELECT 1`;');
  lines.push('    return { status: "ok", timestamp: new Date().toISOString() };');
  lines.push('  } catch (error) {');
  lines.push('    return { status: "error", error: error.message, timestamp: new Date().toISOString() };');
  lines.push('  }');
  lines.push('}');
  
  return lines.join('\n');
}

try {
  const models = extractInterfaces();
  
  if (models.length === 0) {
    console.error('❌ Aucune interface trouvée');
    process.exit(1);
  }
  
  console.log('📊 ' + models.length + ' interfaces détectées: ' + models.join(', '));
  
  const serviceContent = generateSimpleService(models);
  
  // Créer répertoire si nécessaire
  const serviceDir = path.dirname(servicePath);
  if (!fs.existsSync(serviceDir)) {
    fs.mkdirSync(serviceDir, { recursive: true });
  }
  
  fs.writeFileSync(servicePath, serviceContent, 'utf-8');
  
  // Vérification
  if (fs.existsSync(servicePath)) {
    const size = fs.statSync(servicePath).size;
    console.log('✅ Service généré: ' + servicePath);
    console.log('📊 Taille: ' + size + ' bytes');
  } else {
    console.error('❌ Erreur: fichier non créé');
    process.exit(1);
  }
  
  console.log('🎉 Service Prisma généré avec succès !');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
