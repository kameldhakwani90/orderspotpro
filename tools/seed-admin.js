#!/usr/bin/env node

// ====================================
// 👤 SEED ADMIN - CRÉATION ADMINISTRATEUR CORRIGÉE
// ====================================
// Emplacement: /data/appfolder/tools/seed-admin.js
// Version: 4.0 - Configuration dynamique + rôle corrigé
// Corrections: Variables hard-codées OrderSpot remplacées + rôle 'admin' minuscules
// Compatible: AppShell avec user?.role?.toLowerCase()
// ====================================

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// ====================================
// CLASSE SEED ADMIN CORRIGÉE
// ====================================

class SeedAdmin {
  constructor() {
    // Chemins dans tools/
    this.toolsDir = __dirname;                                    // /data/appfolder/tools/
    this.projectRoot = path.resolve(__dirname, '..');            // /data/appfolder/
    this.configPath = path.join(this.toolsDir, '.project-config.json');
    
    // Configuration et Prisma
    this.config = null;
    this.prisma = null;
    
    console.log('👤 Seed Admin - Création Administrateur (Configuration Dynamique)');
    console.log('🔧 Corrections: Variables hard-codées OrderSpot remplacées');
    console.log('✅ Rôle admin en minuscules (compatible AppShell)');
  }
  
  // ====================================
  // CHARGEMENT CONFIGURATION DYNAMIQUE
  // ====================================
  
  loadConfig() {
    console.log('\n📋 Chargement configuration depuis tools/...');
    
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`Configuration manquante: ${this.configPath}`);
    }
    
    try {
      const configContent = fs.readFileSync(this.configPath, 'utf-8');
      this.config = JSON.parse(configContent);
      
      // Validation configuration admin
      if (!this.config.admin) {
        throw new Error('Configuration admin manquante');
      }
      
      if (!this.config.admin.email) {
        throw new Error('Email admin manquant dans configuration');
      }
      
      if (!this.config.admin.password) {
        throw new Error('Mot de passe admin manquant dans configuration');
      }
      
      console.log('✅ Configuration chargée depuis tools/');
      console.log(`   📧 Email: ${this.config.admin.email}`);
      console.log(`   👤 Nom: ${this.config.admin.name || 'Administrateur'}`);
      console.log(`   🎭 Rôle: admin (corrigé en minuscules)`);
      
    } catch (error) {
      throw new Error(`Erreur lecture configuration: ${error.message}`);
    }
  }
  
  // ====================================
  // INITIALISATION PRISMA CLIENT
  // ====================================
  
  async initializePrisma() {
    console.log('\n🗄️ Initialisation client Prisma...');
    
    try {
      // Import dynamique de Prisma Client
      const { PrismaClient } = require('@prisma/client');
      
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: this.config.database?.url || process.env.DATABASE_URL
          }
        }
      });
      
      // Test de connexion
      await this.prisma.$connect();
      console.log('✅ Connexion Prisma réussie');
      
    } catch (error) {
      console.error('❌ Erreur Prisma:', error.message);
      
      // Informations de debug
      console.log('\n🔍 Vérifications:');
      console.log('   1. La base de données est-elle démarrée ?');
      console.log('   2. Le schema Prisma est-il généré ? (npx prisma generate)');
      console.log('   3. Les migrations sont-elles appliquées ? (npx prisma db push)');
      console.log('   4. L\'URL de DB est-elle correcte ?');
      
      throw new Error('Impossible d\'initialiser Prisma');
    }
  }
  
  // ====================================
  // VÉRIFICATION MODÈLE USER
  // ====================================
  
  async validateUserModel() {
    console.log('\n📋 Vérification modèle User...');
    
    try {
      // Test d'accès au modèle User
      await this.prisma.user.findFirst();
      console.log('✅ Modèle User disponible');
      
    } catch (error) {
      console.log('⚠️ Problème avec le modèle User');
      
      if (error.message.includes('Unknown arg') || error.message.includes('Invalid')) {
        console.log('💡 Le schema Prisma doit être généré/migré');
        console.log('   Exécutez: npx prisma db push');
        console.log('   Puis: npx prisma generate');
      }
      
      throw new Error(`Modèle User inaccessible: ${error.message}`);
    }
  }
  
  // ====================================
  // VÉRIFICATION ADMIN EXISTANT
  // ====================================
  
  async checkExistingAdmin() {
    console.log('\n🔍 Vérification administrateur existant...');
    
    try {
      const existingAdmin = await this.prisma.user.findUnique({
        where: { 
          email: this.config.admin.email 
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          isActive: true
        }
      });
      
      if (existingAdmin) {
        console.log(`✅ Administrateur existant trouvé: ${existingAdmin.email}`);
        console.log(`   📅 Créé le: ${existingAdmin.createdAt || 'Date inconnue'}`);
        console.log(`   🎭 Rôle actuel: ${existingAdmin.role || 'Non défini'}`);
        console.log(`   ✅ Actif: ${existingAdmin.isActive ? 'Oui' : 'Non'}`);
        
        return existingAdmin;
      } else {
        console.log('💡 Aucun administrateur existant avec cet email');
        return null;
      }
      
    } catch (error) {
      console.log('⚠️ Impossible de vérifier l\'admin existant');
      console.log(`   💥 ${error.message}`);
      return null;
    }
  }
  
  // ====================================
  // PRÉPARATION DONNÉES ADMIN CORRIGÉES
  // ====================================
  
  async prepareAdminData() {
    console.log('\n🔐 Préparation données administrateur...');
    
    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.config.admin.email)) {
      throw new Error('Format email administrateur invalide');
    }
    
    // Hachage mot de passe
    const saltRounds = 12;
    console.log(`🔒 Hachage mot de passe (${saltRounds} rounds)...`);
    const hashedPassword = await bcrypt.hash(this.config.admin.password, saltRounds);
    console.log('✅ Mot de passe haché avec succès');
    
    // Données admin avec RÔLE CORRIGÉ
    const adminData = {
      email: this.config.admin.email,
      password: hashedPassword,
      name: this.config.admin.name || 'Administrateur',
      role: 'admin', // ✅ CORRECTION MAJEURE: minuscules pour AppShell
      emailVerified: new Date(),
      isActive: true
    };
    
    // Champs optionnels
    const optionalFields = ['firstName', 'lastName', 'phone', 'avatar'];
    optionalFields.forEach(field => {
      if (this.config.admin[field]) {
        adminData[field] = this.config.admin[field];
      }
    });
    
    console.log('✅ Données administrateur préparées');
    console.log(`   🎭 Rôle: ${adminData.role} (corrigé en minuscules)`);
    
    return adminData;
  }
  
  // ====================================
  // CRÉATION/MISE À JOUR ADMIN
  // ====================================
  
  async createOrUpdateAdmin(adminData) {
    console.log('\n👤 Création/mise à jour administrateur...');
    
    try {
      const admin = await this.prisma.user.upsert({
        where: { 
          email: this.config.admin.email 
        },
        update: {
          password: adminData.password,
          name: adminData.name,
          role: adminData.role, // ✅ 'admin' en minuscules
          isActive: true,
          // Mise à jour optionnelle des autres champs
          ...(this.config.admin.firstName && { firstName: this.config.admin.firstName }),
          ...(this.config.admin.lastName && { lastName: this.config.admin.lastName }),
          ...(this.config.admin.phone && { phone: this.config.admin.phone })
        },
        create: adminData,
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
      
      console.log('🎉 Administrateur créé/mis à jour avec succès !');
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   📝 Nom: ${admin.name}`);
      console.log(`   🎭 Rôle: ${admin.role}`);
      console.log(`   🆔 ID: ${admin.id}`);
      console.log(`   ✅ Actif: ${admin.isActive ? 'Oui' : 'Non'}`);
      
      return admin;
      
    } catch (error) {
      console.error('❌ Erreur création administrateur:');
      console.error(`   💥 ${error.message}`);
      
      // Diagnostic d'erreur
      if (error.message.includes('Unique constraint')) {
        console.log('💡 Un utilisateur avec cet email existe déjà');
      } else if (error.message.includes('Foreign key constraint')) {
        console.log('💡 Vérifiez les relations dans le schema Prisma');
      } else if (error.message.includes('required')) {
        console.log('💡 Des champs requis sont manquants dans le schema');
      }
      
      throw error;
    }
  }
  
  // ====================================
  // VÉRIFICATION FINALE
  // ====================================
  
  async verifyAdminCreation() {
    console.log('\n🔍 Vérification finale...');
    
    try {
      const verifyAdmin = await this.prisma.user.findUnique({
        where: { email: this.config.admin.email },
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
      
      if (verifyAdmin && verifyAdmin.role === 'admin') {
        console.log('✅ Vérification réussie - Admin bien créé');
        console.log(`   🔑 Connexion possible avec: ${verifyAdmin.email}`);
        console.log(`   🎭 Rôle: ${verifyAdmin.role} (compatible AppShell)`);
        console.log(`   ✅ Actif: ${verifyAdmin.isActive ? 'Oui' : 'Non'}`);
        
        return true;
      } else {
        throw new Error('Admin créé mais vérification échouée');
      }
      
    } catch (error) {
      console.error('❌ Erreur vérification:', error.message);
      return false;
    }
  }
  
  // ====================================
  // NETTOYAGE RESSOURCES
  // ====================================
  
  async cleanup() {
    if (this.prisma) {
      await this.prisma.$disconnect();
      console.log('🧹 Connexion Prisma fermée');
    }
  }
  
  // ====================================
  // MÉTHODE PRINCIPALE
  // ====================================
  
  async createAdmin() {
    let success = false;
    
    try {
      // Étapes du processus
      this.loadConfig();
      await this.initializePrisma();
      await this.validateUserModel();
      
      const existingAdmin = await this.checkExistingAdmin();
      const adminData = await this.prepareAdminData();
      
      await this.createOrUpdateAdmin(adminData);
      success = await this.verifyAdminCreation();
      
      if (success) {
        console.log('\n' + '='.repeat(60));
        console.log('🎉 CRÉATION ADMINISTRATEUR RÉUSSIE !');
        console.log('='.repeat(60));
        
        console.log('\n✅ Corrections appliquées:');
        console.log('   🔧 Variables hard-codées OrderSpot remplacées');
        console.log('   🎭 Rôle admin en minuscules (compatible AppShell)');
        console.log('   📋 Configuration depuis tools/.project-config.json');
        
        console.log('\n🔑 Informations de connexion:');
        console.log(`   📧 Email: ${this.config.admin.email}`);
        console.log(`   🎭 Rôle: admin`);
        console.log(`   🔐 Mot de passe: [celui configuré]`);
        
        console.log('\n🎯 Compatibilité AppShell:');
        console.log('   ✅ user?.role?.toLowerCase() === "admin" → TRUE');
        console.log('   ✅ Accès routes /admin/* → AUTORISÉ');
        console.log('   ✅ Navigation admin → FONCTIONNELLE');
        
        console.log('\n🚀 Prêt pour authentification !');
      }
      
    } catch (error) {
      console.error('\n❌ ÉCHEC CRÉATION ADMINISTRATEUR');
      console.error(`💥 Erreur: ${error.message}`);
      
      console.log('\n🔧 Actions recommandées:');
      console.log('   1. Vérifier configuration dans tools/.project-config.json');
      console.log('   2. Vérifier base de données (connexion + schema)');
      console.log('   3. Exécuter: npx prisma generate && npx prisma db push');
      console.log('   4. Relancer ce script');
      
      success = false;
      
    } finally {
      await this.cleanup();
    }
    
    return success;
  }
  
  // ====================================
  // MÉTHODES UTILITAIRES
  // ====================================
  
  static async validateConfig(configPath) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      
      const required = ['admin.email', 'admin.password'];
      const missing = required.filter(path => {
        const keys = path.split('.');
        let current = config;
        for (const key of keys) {
          if (!current || !current[key]) return true;
          current = current[key];
        }
        return false;
      });
      
      if (missing.length > 0) {
        throw new Error(`Configuration incomplète: ${missing.join(', ')}`);
      }
      
      return true;
      
    } catch (error) {
      throw new Error(`Configuration invalide: ${error.message}`);
    }
  }
  
  static showHelp() {
    console.log(`
👤 Seed Admin - Création Administrateur (Version Corrigée)

Usage:
  node seed-admin.js                    # Création admin depuis configuration
  node seed-admin.js --validate         # Valider configuration seulement
  node seed-admin.js --help             # Afficher cette aide

Fonctionnalités:
  ✅ Configuration dynamique (remplace hard-coding OrderSpot)
  ✅ Rôle admin en minuscules (compatible AppShell)
  ✅ Hachage sécurisé mot de passe (bcrypt)
  ✅ Gestion erreurs complète
  ✅ Validation configuration

Corrections appliquées:
  🔧 ADMIN_EMAIL hard-codé → config.admin.email
  🔧 role: 'ADMIN' → role: 'admin' (minuscules)
  🔧 Compatible avec user?.role?.toLowerCase()

Fichiers requis:
  📋 tools/.project-config.json (configuration)
  🗄️ @prisma/client (client Prisma)
  📦 bcryptjs (hachage mots de passe)
`);
  }
}

// ====================================
// POINT D'ENTRÉE
// ====================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    SeedAdmin.showHelp();
    process.exit(0);
  }
  
  if (args.includes('--validate')) {
    try {
      const configPath = path.join(__dirname, '.project-config.json');
      await SeedAdmin.validateConfig(configPath);
      console.log('✅ Configuration valide');
      process.exit(0);
    } catch (error) {
      console.error('❌ Configuration invalide:', error.message);
      process.exit(1);
    }
  }
  
  // Création admin principal
  const seedAdmin = new SeedAdmin();
  const success = await seedAdmin.createAdmin();
  
  process.exit(success ? 0 : 1);
}

// Gestion des erreurs globales
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Erreur non gérée:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exception non gérée:', error.message);
  process.exit(1);
});

// Lancement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SeedAdmin;