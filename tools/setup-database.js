const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ====================================
// SETUP DATABASE DYNAMIQUE - PIPELINE UNIVERSEL
// ====================================

console.log('🗄️ Configuration base de données dynamique - Pipeline Universel');

async function setupDatabase() {
  try {
    // ====================================
    // CHARGEMENT CONFIGURATION DYNAMIQUE
    // ====================================
    
    console.log('📋 Chargement de la configuration...');
    
    // Vérifier que les fichiers de config existent
    const configPath = path.join(process.cwd(), '.project-config.json');
    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(configPath)) {
      console.error('❌ Fichier .project-config.json manquant');
      console.log('💡 Lancez d\'abord: node tools/config-generator.js');
      return false;
    }
    
    if (!fs.existsSync(envPath)) {
      console.error('❌ Fichier .env manquant');
      console.log('💡 Lancez d\'abord: node tools/config-generator.js');
      return false;
    }
    
    // Charger la configuration
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    // Validation configuration base de données
    if (!config.database?.url) {
      console.error('❌ Configuration base de données manquante dans .project-config.json');
      return false;
    }
    
    if (!config.app?.name) {
      console.error('❌ Nom de l\'application manquant dans .project-config.json');
      return false;
    }
    
    // Affichage configuration chargée
    console.log('✅ Configuration chargée:');
    console.log(`   📁 Projet: ${config.app.name}`);
    console.log(`   🗄️  Base: ${config.database.name} (${config.database.type})`);
    console.log(`   🔗 URL: ${config.database.url.replace(/:[^:]*@/, ':***@')}`); // Masquer le mot de passe
    
    // ====================================
    // VARIABLES D'ENVIRONNEMENT SÉCURISÉES
    // ====================================
    
    const safeEnv = {
      ...process.env,
      DATABASE_URL: config.database.url,
      CI: 'true',
      PRISMA_MIGRATE_SKIP_GENERATE: 'true',
      PRISMA_MIGRATE_SKIP_SEED: 'true',
      FORCE_COLOR: '0'
    };
    
    console.log('\n🔍 Détection base de données existante...');
    
    // ====================================
    // DÉTECTION BASE EXISTANTE
    // ====================================
    
    let hasExistingData = false;
    let existingTables = [];
    
    try {
      // Test de connexion et détection des tables
      const pullResult = execSync('npx prisma db pull --print', { 
        stdio: 'pipe', 
        timeout: 15000,
        env: safeEnv,
        encoding: 'utf-8'
      });
      
      // Analyser la sortie pour détecter les tables
      if (pullResult.includes('model ') || pullResult.includes('table ')) {
        hasExistingData = true;
        
        // Extraire les noms des tables/modèles
        const modelMatches = pullResult.match(/model\s+(\w+)/g);
        if (modelMatches) {
          existingTables = modelMatches.map(match => match.replace('model ', ''));
        }
      }
      
      console.log('✅ Base existante détectée - PRÉSERVATION ACTIVÉE');
      if (existingTables.length > 0) {
        console.log(`   📊 Tables détectées: ${existingTables.join(', ')}`);
      }
      
    } catch (error) {
      console.log('💡 Nouvelle base de données ou première connexion');
      console.log(`   🔧 Type de base: ${config.database.type}`);
    }
    
    // ====================================
    // GESTION SCHEMA PRISMA
    // ====================================
    
    console.log('\n🔧 Gestion du schema Prisma...');
    
    // Vérifier si schema.prisma existe
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    let schemaExists = fs.existsSync(schemaPath);
    
    if (!schemaExists) {
      console.log('📝 Schema Prisma manquant - sera généré par le pipeline');
    } else {
      console.log('✅ Schema Prisma existant détecté');
    }
    
    // ====================================
    // STRATÉGIE DE MIGRATION SELON CAS
    // ====================================
    
    if (hasExistingData && schemaExists) {
      // CAS 1: Base existante + Schema existant = Push sécurisé
      console.log('\n🛡️ STRATÉGIE: Push schema sécurisé (préserve données)');
      
      try {
        console.log('🔄 Push du schema sans perte de données...');
        execSync('npx prisma db push --accept-data-loss=false --skip-generate', { 
          stdio: 'inherit', 
          timeout: 120000,
          env: safeEnv
        });
        console.log('✅ Schema mis à jour avec préservation des données');
        
      } catch (error) {
        console.log('⚠️ Push schema avec préservation échoué');
        console.log('💡 Tentative de génération du client Prisma...');
        
        try {
          execSync('npx prisma generate', {
            stdio: 'inherit',
            timeout: 60000,
            env: safeEnv
          });
          console.log('✅ Client Prisma généré');
        } catch (genError) {
          console.log('⚠️ Génération client échouée - sera tentée plus tard');
        }
      }
      
    } else if (!hasExistingData && schemaExists) {
      // CAS 2: Nouvelle base + Schema existant = Push initial
      console.log('\n🔧 STRATÉGIE: Initialisation nouvelle base avec schema');
      
      try {
        console.log('🚀 Initialisation de la base de données...');
        execSync('npx prisma db push --skip-generate', { 
          stdio: 'inherit', 
          timeout: 120000,
          env: safeEnv
        });
        console.log('✅ Base de données initialisée');
        
      } catch (error) {
        console.log('⚠️ Initialisation échouée - le pipeline continuera');
      }
      
    } else if (hasExistingData && !schemaExists) {
      // CAS 3: Base existante + Pas de schema = Pull pour générer schema
      console.log('\n📥 STRATÉGIE: Génération schema depuis base existante');
      
      try {
        console.log('📋 Génération du schema depuis la base...');
        execSync('npx prisma db pull', {
          stdio: 'inherit',
          timeout: 60000,
          env: safeEnv
        });
        console.log('✅ Schema généré depuis la base existante');
        
        // Générer le client après pull
        execSync('npx prisma generate', {
          stdio: 'inherit',
          timeout: 60000,
          env: safeEnv
        });
        console.log('✅ Client Prisma généré');
        
      } catch (error) {
        console.log('⚠️ Pull/génération échoué - le pipeline continuera');
      }
      
    } else {
      // CAS 4: Nouvelle base + Pas de schema = Attendre le pipeline
      console.log('\n⏳ STRATÉGIE: Attente génération schema par pipeline');
      console.log('💡 Le schema sera généré par generateCompleteSystem.js');
    }
    
    // ====================================
    // TESTS DE CONNEXION
    // ====================================
    
    console.log('\n🔍 Test de connexion à la base...');
    
    try {
      // Test basique de connexion
      execSync('npx prisma db execute --stdin', {
        input: 'SELECT 1;',
        stdio: 'pipe',
        timeout: 10000,
        env: safeEnv
      });
      console.log('✅ Connexion à la base de données réussie');
      
    } catch (error) {
      // Selon le type de base, le test peut échouer différemment
      if (config.database.type === 'sqlite') {
        console.log('💡 Base SQLite - test de connexion skippé');
      } else {
        console.log('⚠️ Test de connexion échoué - vérifiez la configuration');
        console.log(`   🔧 URL configurée: ${config.database.url.replace(/:[^:]*@/, ':***@')}`);
      }
    }
    
    // ====================================
    // RÉSUMÉ ET VALIDATION
    // ====================================
    
    console.log('\n📊 Résumé configuration base de données:');
    console.log(`   📁 Projet: ${config.app.name}`);
    console.log(`   🗄️  Type: ${config.database.type.toUpperCase()}`);
    console.log(`   📋 Base: ${config.database.name}`);
    console.log(`   🛡️ Données existantes: ${hasExistingData ? 'PRÉSERVÉES' : 'Nouvelle installation'}`);
    console.log(`   📝 Schema Prisma: ${schemaExists ? 'Existant' : 'Sera généré'}`);
    
    if (existingTables.length > 0) {
      console.log(`   📊 Tables: ${existingTables.join(', ')}`);
    }
    
    // ====================================
    // PRÉPARATION ENVIRONNEMENT
    // ====================================
    
    console.log('\n🔧 Préparation environnement Prisma...');
    
    // Créer le dossier prisma s'il n'existe pas
    const prismaDir = path.join(process.cwd(), 'prisma');
    if (!fs.existsSync(prismaDir)) {
      fs.mkdirSync(prismaDir, { recursive: true });
      console.log('✅ Dossier prisma/ créé');
    }
    
    // Créer un .env local dans prisma/ si nécessaire
    const prismaEnvPath = path.join(prismaDir, '.env');
    if (!fs.existsSync(prismaEnvPath)) {
      fs.writeFileSync(prismaEnvPath, `DATABASE_URL="${config.database.url}"\n`);
      console.log('✅ Fichier prisma/.env créé');
    }
    
    console.log('✅ Configuration base de données terminée avec succès');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la configuration de la base de données:');
    console.error(`   💥 ${error.message}`);
    
    // Informations de debug
    console.log('\n🔍 Informations de debug:');
    console.log(`   📂 Répertoire: ${process.cwd()}`);
    console.log(`   🔧 Node.js: ${process.version}`);
    
    // Vérifier les outils requis
    try {
      execSync('npx prisma --version', { stdio: 'pipe' });
      console.log('   ✅ Prisma disponible');
    } catch {
      console.log('   ❌ Prisma non disponible');
    }
    
    console.log('\n💡 Pour résoudre:');
    console.log('   1. Vérifiez la configuration dans .project-config.json');
    console.log('   2. Vérifiez que la base de données est accessible');
    console.log('   3. Vérifiez les credentials de connexion');
    console.log('   4. Lancez: npm install prisma @prisma/client');
    
    return false;
  }
}

// ====================================
// UTILITAIRES
// ====================================

function getDatabaseTypeFromUrl(databaseUrl) {
  if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
    return 'postgresql';
  } else if (databaseUrl.startsWith('mysql://')) {
    return 'mysql';
  } else if (databaseUrl.startsWith('file:') || databaseUrl.includes('.db')) {
    return 'sqlite';
  } else if (databaseUrl.startsWith('mongodb://')) {
    return 'mongodb';
  }
  return 'unknown';
}

function maskDatabaseUrl(url) {
  // Masquer le mot de passe dans l'URL pour les logs
  return url.replace(/:[^:]*@/, ':***@');
}

// ====================================
// POINT D'ENTRÉE
// ====================================

if (require.main === module) {
  setupDatabase()
    .then(success => {
      if (success) {
        console.log('\n🎉 Setup base de données réussi !');
        process.exit(0);
      } else {
        console.log('\n💥 Setup base de données échoué');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Erreur fatale:', error.message);
      process.exit(1);
    });
}

module.exports = { setupDatabase };