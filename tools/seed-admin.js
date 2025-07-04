const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ====================================
// SEED ADMIN DYNAMIQUE - PIPELINE UNIVERSEL
// ====================================

console.log('👤 Création administrateur dynamique - Pipeline Universel');

async function seedAdmin() {
  let prisma;
  
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
    
    // Validation configuration admin
    if (!config.admin?.email) {
      console.error('❌ Email administrateur manquant dans .project-config.json');
      return false;
    }
    
    if (!config.admin?.password) {
      console.error('❌ Mot de passe administrateur manquant dans .project-config.json');
      return false;
    }
    
    if (!config.app?.name) {
      console.error('❌ Nom de l\'application manquant dans .project-config.json');
      return false;
    }
    
    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.admin.email)) {
      console.error('❌ Format email administrateur invalide');
      return false;
    }
    
    // Affichage configuration chargée (sans mot de passe)
    console.log('✅ Configuration admin chargée:');
    console.log(`   📁 Projet: ${config.app.name}`);
    console.log(`   👤 Admin: ${config.admin.email}`);
    console.log(`   📝 Nom: ${config.admin.name || 'Admin'}`);
    console.log(`   🔐 Mot de passe: ${'*'.repeat(config.admin.password.length)} caractères`);
    
    // ====================================
    // INITIALISATION PRISMA CLIENT
    // ====================================
    
    console.log('\n🔧 Initialisation client Prisma...');
    
    // Vérifier que Prisma est disponible
    try {
      prisma = new PrismaClient({
        datasources: {
          db: {
            url: config.database?.url || process.env.DATABASE_URL
          }
        }
      });
      
      // Test de connexion
      await prisma.$connect();
      console.log('✅ Connexion à la base de données réussie');
      
    } catch (error) {
      console.error('❌ Impossible de se connecter à la base de données');
      console.error(`   💥 ${error.message}`);
      
      // Informations de debug
      console.log('\n🔍 Vérifications:');
      console.log('   1. La base de données est-elle démarrée ?');
      console.log('   2. Les credentials sont-ils corrects ?');
      console.log('   3. Le schema Prisma est-il généré ?');
      console.log('   4. Lancez: npx prisma generate');
      
      return false;
    }
    
    // ====================================
    // VÉRIFICATION MODÈLE USER
    // ====================================
    
    console.log('\n📋 Vérification du modèle User...');
    
    try {
      // Tenter d'accéder au modèle User
      await prisma.user.findFirst();
      console.log('✅ Modèle User disponible');
      
    } catch (error) {
      console.log('⚠️ Modèle User non disponible ou schema non généré');
      
      if (error.message.includes('Unknown arg `where`') || error.message.includes('Invalid `prisma.user`')) {
        console.log('💡 Le schema Prisma doit être généré/migré d\'abord');
        console.log('   Lancez: npx prisma db push ou npx prisma migrate dev');
        return false;
      }
      
      // Autres erreurs
      console.error(`   💥 ${error.message}`);
      return false;
    }
    
    // ====================================
    // VÉRIFICATION ADMIN EXISTANT
    // ====================================
    
    console.log('\n🔍 Vérification administrateur existant...');
    
    let existingAdmin;
    try {
      existingAdmin = await prisma.user.findUnique({
        where: { 
          email: config.admin.email 
        }
      });
      
      if (existingAdmin) {
        console.log(`✅ Administrateur existant trouvé: ${config.admin.email}`);
        console.log(`   📅 Créé le: ${existingAdmin.createdAt || 'Date inconnue'}`);
        console.log(`   🎭 Rôle: ${existingAdmin.role || 'Non défini'}`);
      } else {
        console.log('💡 Aucun administrateur existant avec cet email');
      }
      
    } catch (error) {
      console.log('⚠️ Impossible de vérifier l\'admin existant');
      console.log(`   💥 ${error.message}`);
    }
    
    // ====================================
    // PRÉPARATION DONNÉES ADMIN
    // ====================================
    
    console.log('\n🔐 Préparation des données administrateur...');
    
    // Hachage du mot de passe
    const saltRounds = 12;
    console.log(`🔒 Hachage du mot de passe (${saltRounds} rounds)...`);
    const hashedPassword = await bcrypt.hash(config.admin.password, saltRounds);
    console.log('✅ Mot de passe haché avec succès');
    
    // Préparation des données
    const adminData = {
      email: config.admin.email,
      password: hashedPassword,
      name: config.admin.name || 'Admin',
      role: 'admin', // Rôle par défaut
      emailVerified: new Date(), // Considérer comme vérifié
      isActive: true
    };
    
    // Ajouter des champs optionnels selon le schema
    const optionalFields = ['firstName', 'lastName', 'phone', 'avatar'];
    optionalFields.forEach(field => {
      if (config.admin[field]) {
        adminData[field] = config.admin[field];
      }
    });
    
    console.log('✅ Données administrateur préparées');
    
    // ====================================
    // CRÉATION/MISE À JOUR ADMIN
    // ====================================
    
    console.log('\n👤 Création/mise à jour administrateur...');
    
    try {
      const admin = await prisma.user.upsert({
        where: { 
          email: config.admin.email 
        },
        update: {
          password: hashedPassword,
          name: adminData.name,
          role: adminData.role,
          isActive: true,
          // Mettre à jour seulement les champs fournis
          ...(config.admin.firstName && { firstName: config.admin.firstName }),
          ...(config.admin.lastName && { lastName: config.admin.lastName }),
          ...(config.admin.phone && { phone: config.admin.phone })
        },
        create: adminData
      });
      
      console.log('🎉 Administrateur créé/mis à jour avec succès !');
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   📝 Nom: ${admin.name}`);
      console.log(`   🎭 Rôle: ${admin.role}`);
      console.log(`   🆔 ID: ${admin.id}`);
      
      if (existingAdmin) {
        console.log('   🔄 Mot de passe mis à jour');
      } else {
        console.log('   🆕 Nouveau compte créé');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'administrateur');
      console.error(`   💥 ${error.message}`);
      
      // Informations spécifiques selon l'erreur
      if (error.message.includes('Unique constraint')) {
        console.log('💡 Un utilisateur avec cet email existe déjà');
      } else if (error.message.includes('Foreign key constraint')) {
        console.log('💡 Vérifiez les relations dans le schema Prisma');
      } else if (error.message.includes('required')) {
        console.log('💡 Des champs requis sont manquants dans le schema');
      }
      
      return false;
    }
    
    // ====================================
    // VÉRIFICATION FINALE
    // ====================================
    
    console.log('\n🔍 Vérification finale...');
    
    try {
      const verifyAdmin = await prisma.user.findUnique({
        where: { email: config.admin.email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      if (verifyAdmin) {
        console.log('✅ Vérification réussie - Admin bien créé');
        console.log(`   🔑 Connexion possible avec: ${verifyAdmin.email}`);
        console.log(`   🎭 Rôle: ${verifyAdmin.role}`);
        console.log(`   ✅ Actif: ${verifyAdmin.isActive ? 'Oui' : 'Non'}`);
      } else {
        console.log('⚠️ Admin non trouvé après création');
        return false;
      }
      
    } catch (error) {
      console.log('⚠️ Impossible de vérifier la création');
      console.log(`   💥 ${error.message}`);
      return false;
    }
    
    // ====================================
    // RÉSUMÉ ET INFORMATIONS CONNEXION
    // ====================================
    
    console.log('\n📊 Résumé seed administrateur:');
    console.log(`   📁 Projet: ${config.app.name}`);
    console.log(`   👤 Admin: ${config.admin.email}`);
    console.log(`   🔐 Mot de passe: ${'*'.repeat(config.admin.password.length)} caractères`);
    console.log(`   🌐 URL connexion: ${config.app.baseUrl}/login`);
    console.log(`   🎭 Rôle: ADMIN`);
    
    console.log('\n💡 Informations de connexion:');
    console.log(`   📧 Email: ${config.admin.email}`);
    console.log(`   🔑 Mot de passe: [configuré dans .project-config.json]`);
    
    console.log('\n✅ Seed administrateur terminé avec succès');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Erreur lors du seed administrateur:');
    console.error(`   💥 ${error.message}`);
    
    // Informations de debug
    console.log('\n🔍 Informations de debug:');
    console.log(`   📂 Répertoire: ${process.cwd()}`);
    console.log(`   🔧 Node.js: ${process.version}`);
    
    // Vérifier les dépendances
    try {
      require('@prisma/client');
      console.log('   ✅ @prisma/client disponible');
    } catch {
      console.log('   ❌ @prisma/client manquant');
    }
    
    try {
      require('bcryptjs');
      console.log('   ✅ bcryptjs disponible');
    } catch {
      console.log('   ❌ bcryptjs manquant');
    }
    
    console.log('\n💡 Pour résoudre:');
    console.log('   1. Vérifiez la configuration dans .project-config.json');
    console.log('   2. Vérifiez que la base de données est accessible');
    console.log('   3. Lancez: npx prisma generate');
    console.log('   4. Lancez: npm install @prisma/client bcryptjs');
    console.log('   5. Vérifiez que le modèle User existe dans schema.prisma');
    
    return false;
    
  } finally {
    // Nettoyage connexion Prisma
    if (prisma) {
      try {
        await prisma.$disconnect();
        console.log('\n🔌 Connexion Prisma fermée');
      } catch (error) {
        console.log('⚠️ Erreur fermeture connexion Prisma');
      }
    }
  }
}

// ====================================
// UTILITAIRES
// ====================================

function validatePassword(password) {
  // Validation basique du mot de passe
  if (!password || password.length < 6) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins 6 caractères' };
  }
  
  if (password.length > 100) {
    return { valid: false, message: 'Le mot de passe est trop long (max 100 caractères)' };
  }
  
  return { valid: true };
}

function generateSecurePassword(length = 12) {
  // Générateur de mot de passe sécurisé si besoin
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// ====================================
// POINT D'ENTRÉE
// ====================================

if (require.main === module) {
  seedAdmin()
    .then(success => {
      if (success) {
        console.log('\n🎉 Seed administrateur réussi !');
        process.exit(0);
      } else {
        console.log('\n💥 Seed administrateur échoué');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Erreur fatale:', error.message);
      process.exit(1);
    });
}

module.exports = { seedAdmin, validatePassword, generateSecurePassword };