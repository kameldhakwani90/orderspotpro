const fs = require('fs');
const path = require('path');

console.log('🚀 SERVICE PRISMA - Génération CRUD COMPLÈTE et robuste...');

const typesPath = path.join(__dirname, '../src/lib/types.ts');
const servicePath = path.join(__dirname, '../src/lib/prisma-service.ts');

try {
  console.log('📖 Lecture de types.ts...');
  
  if (!fs.existsSync(typesPath)) {
    console.error('❌ types.ts introuvable:', typesPath);
    process.exit(1);
  }
  
  const typesContent = fs.readFileSync(typesPath, 'utf-8');
  console.log('✅ types.ts lu, taille:', typesContent.length, 'caractères');
  
  // Extraction simple et robuste des interfaces
  const interfaceMatches = typesContent.match(/export\s+interface\s+(\w+)/g);
  if (!interfaceMatches || interfaceMatches.length === 0) {
    console.error('❌ Aucune interface trouvée dans types.ts');
    console.log('📋 Aperçu du contenu:');
    console.log(typesContent.substring(0, 1000));
    process.exit(1);
  }
  
  const interfaces = interfaceMatches.map(match => match.replace(/export\s+interface\s+/, ''));
  console.log('📋 ' + interfaces.length + ' interfaces détectées: ' + interfaces.join(', '));
  
  // Génération du service - Version CRUD COMPLÈTE
  console.log('🔧 Génération du service CRUD complet...');
  
  const serviceLines = [];
  
  // Header
  serviceLines.push('// Service Prisma généré automatiquement avec CRUD COMPLET depuis types.ts');
  serviceLines.push('import { PrismaClient } from "@prisma/client";');
  serviceLines.push('');
  serviceLines.push('declare global {');
  serviceLines.push('  var prisma: PrismaClient | undefined;');
  serviceLines.push('}');
  serviceLines.push('');
  serviceLines.push('export const prisma = globalThis.prisma || new PrismaClient({');
  serviceLines.push('  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],');
  serviceLines.push('});');
  serviceLines.push('');
  serviceLines.push('if (process.env.NODE_ENV !== "production") {');
  serviceLines.push('  globalThis.prisma = prisma;');
  serviceLines.push('}');
  serviceLines.push('');
  serviceLines.push('// ============================================');
  serviceLines.push('// FONCTIONS CRUD COMPLÈTES POUR TOUS LES MODÈLES');
  serviceLines.push('// ============================================');
  serviceLines.push('');
  
  // Générer CRUD COMPLET pour chaque interface
  interfaces.forEach(modelName => {
    const camelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const pluralName = modelName.toLowerCase() + 's';
    
    serviceLines.push('// =============== ' + modelName.toUpperCase() + ' - CRUD COMPLET ===============');
    serviceLines.push('');
    
    // 1. GET BY ID
    serviceLines.push('export async function get' + modelName + 'ById(id: number) {');
    serviceLines.push('  try {');
    serviceLines.push('    return await prisma.' + camelName + '.findUnique({');
    serviceLines.push('      where: { id: id }');
    serviceLines.push('    });');
    serviceLines.push('  } catch (error) {');
    serviceLines.push('    console.error("Erreur get' + modelName + 'ById:", error);');
    serviceLines.push('    throw error;');
    serviceLines.push('  }');
    serviceLines.push('}');
    serviceLines.push('');
    
    // 2. GET ALL
    serviceLines.push('export async function getAll' + modelName + 's() {');
    serviceLines.push('  try {');
    serviceLines.push('    return await prisma.' + camelName + '.findMany({');
    serviceLines.push('      orderBy: { createdAt: "desc" }');
    serviceLines.push('    });');
    serviceLines.push('  } catch (error) {');
    serviceLines.push('    console.error("Erreur getAll' + modelName + 's:", error);');
    serviceLines.push('    throw error;');
    serviceLines.push('  }');
    serviceLines.push('}');
    serviceLines.push('');
    
    // 3. CREATE
    serviceLines.push('export async function create' + modelName + '(data: any) {');
    serviceLines.push('  try {');
    serviceLines.push('    const cleanData = { ...data };');
    serviceLines.push('    delete cleanData.id;');
    serviceLines.push('    delete cleanData.createdAt;');
    serviceLines.push('    delete cleanData.updatedAt;');
    serviceLines.push('    ');
    serviceLines.push('    return await prisma.' + camelName + '.create({');
    serviceLines.push('      data: cleanData');
    serviceLines.push('    });');
    serviceLines.push('  } catch (error) {');
    serviceLines.push('    console.error("Erreur create' + modelName + ':", error);');
    serviceLines.push('    throw error;');
    serviceLines.push('  }');
    serviceLines.push('}');
    serviceLines.push('');
    
    // 4. UPDATE - NOUVELLE FONCTION
    serviceLines.push('export async function update' + modelName + '(id: number, data: any) {');
    serviceLines.push('  try {');
    serviceLines.push('    const cleanData = { ...data };');
    serviceLines.push('    delete cleanData.id;');
    serviceLines.push('    delete cleanData.createdAt;');
    serviceLines.push('    delete cleanData.updatedAt;');
    serviceLines.push('    ');
    serviceLines.push('    return await prisma.' + camelName + '.update({');
    serviceLines.push('      where: { id: id },');
    serviceLines.push('      data: cleanData');
    serviceLines.push('    });');
    serviceLines.push('  } catch (error) {');
    serviceLines.push('    console.error("Erreur update' + modelName + ':", error);');
    serviceLines.push('    throw error;');
    serviceLines.push('  }');
    serviceLines.push('}');
    serviceLines.push('');
    
    // 5. DELETE - NOUVELLE FONCTION
    serviceLines.push('export async function delete' + modelName + '(id: number) {');
    serviceLines.push('  try {');
    serviceLines.push('    return await prisma.' + camelName + '.delete({');
    serviceLines.push('      where: { id: id }');
    serviceLines.push('    });');
    serviceLines.push('  } catch (error) {');
    serviceLines.push('    console.error("Erreur delete' + modelName + ':", error);');
    serviceLines.push('    throw error;');
    serviceLines.push('  }');
    serviceLines.push('}');
    serviceLines.push('');
    
    // 6. ALIASES pour compatibilité
    serviceLines.push('// Aliases pour compatibilité');
    serviceLines.push('export const add' + modelName + ' = create' + modelName + ';');
    serviceLines.push('export const get' + pluralName + ' = getAll' + modelName + 's;');
    serviceLines.push('');
  });
  
  // Utilitaires
  serviceLines.push('// ============================================');
  serviceLines.push('// UTILITAIRES DE BASE');
  serviceLines.push('// ============================================');
  serviceLines.push('');
  serviceLines.push('export async function connectToDatabase() {');
  serviceLines.push('  try {');
  serviceLines.push('    await prisma.$connect();');
  serviceLines.push('    console.log("✅ Connexion DB établie");');
  serviceLines.push('    return true;');
  serviceLines.push('  } catch (error) {');
  serviceLines.push('    console.error("❌ Erreur connexion DB:", error);');
  serviceLines.push('    return false;');
  serviceLines.push('  }');
  serviceLines.push('}');
  serviceLines.push('');
  serviceLines.push('export async function healthCheck() {');
  serviceLines.push('  try {');
  serviceLines.push('    const result = await prisma.$queryRaw`SELECT 1`;');
  serviceLines.push('    return { status: "ok", timestamp: new Date().toISOString() };');
  serviceLines.push('  } catch (error) {');
  serviceLines.push('    return { status: "error", error: error.message, timestamp: new Date().toISOString() };');
  serviceLines.push('  }');
  serviceLines.push('}');
  
  // Écriture du fichier
  const serviceContent = serviceLines.join('\n');
  
  // Créer le répertoire si nécessaire
  const serviceDir = path.dirname(servicePath);
  if (!fs.existsSync(serviceDir)) {
    fs.mkdirSync(serviceDir, { recursive: true });
    console.log('📁 Répertoire créé:', serviceDir);
  }
  
  fs.writeFileSync(servicePath, serviceContent, 'utf-8');
  
  // Vérification finale avec résumé détaillé
  if (fs.existsSync(servicePath)) {
    const size = fs.statSync(servicePath).size;
    console.log('✅ Service généré avec succès:', servicePath);
    console.log('📊 Taille:', size, 'bytes');
    console.log('📋 Modèles traités:', interfaces.length);
    
    console.log('\n🎯 RÉSUMÉ - Fonctions générées par modèle:');
    interfaces.forEach(modelName => {
      console.log(`  ${modelName}:`);
      console.log(`    ✅ get${modelName}ById()`);
      console.log(`    ✅ getAll${modelName}s()`);
      console.log(`    ✅ create${modelName}()`);
      console.log(`    ✅ update${modelName}() ← NOUVEAU`);
      console.log(`    ✅ delete${modelName}() ← NOUVEAU`);
      console.log(`    ✅ add${modelName}() (alias)`);
    });
    
    console.log('\n📊 Total:', interfaces.length * 5, 'fonctions CRUD générées automatiquement !');
    
    if (size < 1000) {
      console.warn('⚠️  Fichier semble petit, vérifiez le contenu');
    }
    
    console.log('\n🎉 Génération CRUD COMPLÈTE terminée avec succès !');
    console.log('🔥 TOUTES les opérations CRUD sont maintenant disponibles !');
  } else {
    console.error('❌ Erreur: fichier non créé');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ ERREUR CRITIQUE:', error.message);
  console.error('Stack:', error.stack);
  console.log('\n🔍 Diagnostic:');
  console.log('- Répertoire courant:', __dirname);
  console.log('- types.ts path:', typesPath);
  console.log('- service.ts path:', servicePath);
  console.log('- types.ts existe:', fs.existsSync(typesPath));
  process.exit(1);
}
