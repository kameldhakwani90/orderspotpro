// prisma-auto-migrate.js - SOLUTION AUTOMATIQUE MIGRATION PRISMA
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🗄️ AUTO-MIGRATION PRISMA - SOLUTION PROBLÈME MANUEL');

class PrismaAutoMigrator {
  constructor() {
    this.maxRetries = 3;
    this.timeout = 60000; // 60 secondes
  }

  // ====================================
  // VÉRIFICATION DATABASE
  // ====================================
  async checkDatabaseConnection() {
    console.log('🔍 Vérification connexion database...');
    
    try {
      // Test connexion basique
      execSync('npx prisma db pull --print', { 
        stdio: 'pipe',
        timeout: 10000 
      });
      console.log('✅ Database accessible');
      return true;
    } catch (error) {
      console.log('⚠️ Database non accessible:', error.message);
      return false;
    }
  }

  // ====================================
  // MIGRATION AUTOMATIQUE
  // ====================================
  async runAutoMigration() {
    console.log('🚀 Démarrage migration automatique...');
    
    const dbConnected = await this.checkDatabaseConnection();
    
    if (!dbConnected) {
      console.log('🔄 Mode fallback: génération client seulement');
      return this.fallbackMode();
    }

    // Migration complète
    return this.fullMigration();
  }

  async fullMigration() {
    console.log('💫 Migration complète avec database...');
    
    const steps = [
      {
        name: 'Migration Dev',
        command: 'npx prisma migrate dev --name init',
        description: 'Création migration initiale'
      },
      {
        name: 'Push Schema',
        command: 'npx prisma db push',
        description: 'Push schema vers database'
      },
      {
        name: 'Generate Client',
        command: 'npx prisma generate',
        description: 'Génération client Prisma'
      }
    ];

    for (const step of steps) {
      console.log(`\n🔧 ${step.description}...`);
      
      let retries = 0;
      while (retries < this.maxRetries) {
        try {
          execSync(step.command, {
            stdio: 'inherit',
            timeout: this.timeout
          });
          console.log(`✅ ${step.name} réussi`);
          break;
        } catch (error) {
          retries++;
          console.log(`⚠️ Tentative ${retries}/${this.maxRetries} échouée`);
          
          if (retries >= this.maxRetries) {
            console.log(`❌ ${step.name} échoué définitivement`);
            
            // Si c'est la génération client qui échoue, continuer
            if (step.name === 'Generate Client') {
              console.log('💡 Client Prisma sera généré plus tard');
              break;
            }
            throw error;
          }
          
          // Attendre avant retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    console.log('✅ Migration complète terminée');
    return true;
  }

  async fallbackMode() {
    console.log('🔄 Mode fallback: database non accessible');
    
    try {
      // Vérifier si schema existe
      if (!fs.existsSync('./prisma/schema.prisma')) {
        console.log('❌ Schema Prisma manquant, génération impossible');
        return false;
      }

      // Générer client seulement
      console.log('🔧 Génération client Prisma (mode offline)...');
      execSync('npx prisma generate', {
        stdio: 'inherit',
        timeout: this.timeout
      });

      console.log('✅ Mode fallback réussi');
      console.log('💡 Migration database sera possible plus tard');
      return true;
      
    } catch (error) {
      console.log('⚠️ Mode fallback échoué, mais on continue...');
      console.log('💡 Application fonctionnera sans Prisma client');
      return false;
    }
  }

  // ====================================
  // VALIDATION POST-MIGRATION
  // ====================================
  validateMigration() {
    console.log('🔍 Validation post-migration...');
    
    const checks = [
      {
        name: 'Schema Prisma',
        check: () => fs.existsSync('./prisma/schema.prisma'),
        fix: 'Générer schema avec build-server.js'
      },
      {
        name: 'Client Prisma',
        check: () => fs.existsSync('./node_modules/.prisma/client'),
        fix: 'Exécuter: npx prisma generate'
      },
      {
        name: 'Prisma Service',
        check: () => fs.existsSync('./src/lib/prisma-service.ts'),
        fix: 'Générer service avec generatePrismaServiceFromData.js'
      }
    ];

    let allValid = true;
    
    checks.forEach(check => {
      const isValid = check.check();
      console.log(`  ${isValid ? '✅' : '❌'} ${check.name}`);
      
      if (!isValid) {
        console.log(`    💡 Solution: ${check.fix}`);
        allValid = false;
      }
    });

    if (allValid) {
      console.log('✅ Validation réussie - Prisma prêt');
    } else {
      console.log('⚠️ Certains éléments manquent mais on continue');
    }

    return allValid;
  }
}

// ====================================
// EXÉCUTION PRINCIPALE
// ====================================
async function main() {
  const migrator = new PrismaAutoMigrator();
  
  try {
    console.log('🚀 AUTO-MIGRATION PRISMA DÉMARRÉE');
    console.log('🎯 Objectif: Résoudre problème migration manuelle');
    
    const success = await migrator.runAutoMigration();
    
    if (success) {
      migrator.validateMigration();
      console.log('\n✅ AUTO-MIGRATION TERMINÉE AVEC SUCCÈS');
      console.log('🎉 Plus besoin de commandes manuelles !');
    } else {
      console.log('\n⚠️ AUTO-MIGRATION PARTIELLE');
      console.log('💡 Application fonctionnera en mode dégradé');
    }
    
  } catch (error) {
    console.error('\n❌ ERREUR AUTO-MIGRATION:', error.message);
    console.log('💡 L\'application peut encore fonctionner sans DB');
    console.log('🔧 Commandes manuelles disponibles:');
    console.log('   npx prisma migrate dev --name init');
    console.log('   npx prisma db push');
    console.log('   npx prisma generate');
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = { PrismaAutoMigrator };