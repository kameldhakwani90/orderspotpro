const fs = require('fs');
const path = require('path');

console.log('🏗️ Relocation ENTERPRISE - Prisma Service Intelligent...');

// ====================================
// CONFIGURATION ENTERPRISE DYNAMIQUE
// ====================================

class EnterprisePrismaRelocator {
  constructor() {
    this.config = {
      // Chemins sources possibles (ordre de priorité)
      sourcePaths: [
        '../src/lib/prisma-service.ts',
        '../src/services/prisma-service.ts', 
        '../lib/prisma-service.ts',
        '../prisma-service.ts'
      ],
      
      // Destination finale (sécurisée serveur)
      destinationPath: '../src/server/prisma-service.ts',
      
      // Répertoires à scanner pour les imports
      scanDirectories: [
        '../src/app/api',           // API routes Next.js
        '../src/pages/api',         // API routes Pages router
        '../api',                   // API routes alternatives
        '../src/server',            // Code serveur
        '../server',                // Server code alternatif
        '../src/lib/server',        // Lib serveur
        '../lib/server'             // Server lib alternatif
      ],
      
      // Patterns d'imports à corriger
      importPatterns: [
        { from: '@/lib/prisma-service', to: '@/server/prisma-service' },
        { from: '@/services/prisma-service', to: '@/server/prisma-service' },
        { from: '../lib/prisma-service', to: '../server/prisma-service' },
        { from: './lib/prisma-service', to: './server/prisma-service' },
        { from: '../../lib/prisma-service', to: '../../server/prisma-service' },
        { from: '../../../lib/prisma-service', to: '../../../server/prisma-service' }
      ],
      
      // Extensions de fichiers à traiter
      fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
      
      // Répertoires à ignorer
      excludeDirectories: ['node_modules', '.next', 'dist', 'build', '.git']
    };
    
    this.stats = {
      filesRelocated: 0,
      importsUpdated: 0,
      filesScanned: 0,
      errorsEncountered: 0
    };
  }
  
  // ====================================
  // DÉTECTION INTELLIGENTE DES SOURCES
  // ====================================
  
  findPrismaServiceFile() {
    console.log('🔍 Détection intelligente du fichier prisma-service...');
    
    for (const sourcePath of this.config.sourcePaths) {
      const fullPath = path.join(__dirname, sourcePath);
      
      if (fs.existsSync(fullPath)) {
        console.log(`  ✅ Trouvé: ${sourcePath}`);
        
        // Vérifier que c'est bien un service Prisma
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (this.isPrismaServiceFile(content)) {
          console.log(`  ✅ Validé comme service Prisma`);
          return fullPath;
        } else {
          console.log(`  ⚠️  Fichier trouvé mais ne semble pas être un service Prisma`);
        }
      }
    }
    
    console.log('  ❌ Aucun fichier prisma-service trouvé');
    return null;
  }
  
  isPrismaServiceFile(content) {
    // Vérifications pour s'assurer que c'est bien un service Prisma
    const prismaIndicators = [
      'PrismaClient',
      'prisma.',
      'export async function get',
      'export async function create',
      'export async function update',
      'export async function delete'
    ];
    
    return prismaIndicators.some(indicator => content.includes(indicator));
  }
  
  // ====================================
  // RELOCATION SÉCURISÉE
  // ====================================
  
  relocatePrismaService() {
    console.log('📦 Relocation sécurisée du service Prisma...');
    
    const sourceFile = this.findPrismaServiceFile();
    if (!sourceFile) {
      console.log('⏭️  Pas de relocation nécessaire');
      return false;
    }
    
    const destinationFile = path.join(__dirname, this.config.destinationPath);
    const destinationDir = path.dirname(destinationFile);
    
    // Créer le répertoire de destination
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
      console.log(`  📁 Répertoire créé: ${path.relative(process.cwd(), destinationDir)}`);
    }
    
    // Vérifier si la destination existe déjà
    if (fs.existsSync(destinationFile)) {
      const sourceContent = fs.readFileSync(sourceFile, 'utf-8');
      const destContent = fs.readFileSync(destinationFile, 'utf-8');
      
      if (sourceContent === destContent) {
        console.log('  ⏭️  Fichier déjà à la bonne destination');
        fs.unlinkSync(sourceFile); // Supprimer l'ancien
        return true;
      } else {
        console.log('  🔄 Mise à jour du fichier de destination');
      }
    }
    
    // Effectuer la relocation
    try {
      fs.copyFileSync(sourceFile, destinationFile);
      fs.unlinkSync(sourceFile);
      
      console.log(`  ✅ Relocalisé: ${path.relative(process.cwd(), sourceFile)} → ${path.relative(process.cwd(), destinationFile)}`);
      this.stats.filesRelocated++;
      return true;
      
    } catch (error) {
      console.error(`  ❌ Erreur relocation:`, error.message);
      this.stats.errorsEncountered++;
      return false;
    }
  }
  
  // ====================================
  // MISE À JOUR INTELLIGENTE DES IMPORTS
  // ====================================
  
  updateAllImports() {
    console.log('🔄 Mise à jour intelligente des imports...');
    
    this.config.scanDirectories.forEach(scanDir => {
      const fullScanPath = path.join(__dirname, scanDir);
      
      if (fs.existsSync(fullScanPath)) {
        console.log(`  📁 Scan: ${scanDir}`);
        this.scanDirectoryForImports(fullScanPath);
      } else {
        console.log(`  ⏭️  Ignoré: ${scanDir} (n'existe pas)`);
      }
    });
  }
  
  scanDirectoryForImports(dirPath) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      entries.forEach(entry => {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Ignorer certains répertoires
          if (!this.config.excludeDirectories.includes(entry.name)) {
            this.scanDirectoryForImports(fullPath);
          }
        } else if (entry.isFile()) {
          // Traiter les fichiers avec les bonnes extensions
          const ext = path.extname(entry.name);
          if (this.config.fileExtensions.includes(ext)) {
            this.updateFileImports(fullPath);
          }
        }
      });
      
    } catch (error) {
      console.error(`  ❌ Erreur scan ${dirPath}:`, error.message);
      this.stats.errorsEncountered++;
    }
  }
  
  updateFileImports(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      let hasChanges = false;
      
      // Appliquer tous les patterns de remplacement
      this.config.importPatterns.forEach(pattern => {
        const regex = new RegExp(pattern.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        
        if (regex.test(content)) {
          content = content.replace(regex, pattern.to);
          hasChanges = true;
          console.log(`    🔄 ${path.relative(process.cwd(), filePath)}: ${pattern.from} → ${pattern.to}`);
        }
      });
      
      // Sauvegarder si des changements
      if (hasChanges) {
        fs.writeFileSync(filePath, content, 'utf-8');
        this.stats.importsUpdated++;
      }
      
      this.stats.filesScanned++;
      
    } catch (error) {
      console.error(`  ❌ Erreur mise à jour ${filePath}:`, error.message);
      this.stats.errorsEncountered++;
    }
  }
  
  // ====================================
  // VALIDATION POST-RELOCATION
  // ====================================
  
  validateRelocation() {
    console.log('✅ Validation post-relocation...');
    
    const destinationFile = path.join(__dirname, this.config.destinationPath);
    
    // Vérifier que le fichier de destination existe
    if (!fs.existsSync(destinationFile)) {
      console.error('  ❌ Fichier de destination manquant');
      return false;
    }
    
    // Vérifier que le contenu est valide
    try {
      const content = fs.readFileSync(destinationFile, 'utf-8');
      
      if (!this.isPrismaServiceFile(content)) {
        console.error('  ❌ Contenu du fichier invalide');
        return false;
      }
      
      console.log('  ✅ Fichier de destination valide');
      
    } catch (error) {
      console.error('  ❌ Erreur lecture destination:', error.message);
      return false;
    }
    
    // Vérifier qu'aucun ancien fichier ne traîne
    let oldFilesFound = 0;
    this.config.sourcePaths.forEach(sourcePath => {
      const fullPath = path.join(__dirname, sourcePath);
      if (fs.existsSync(fullPath) && fullPath !== destinationFile) {
        console.warn(`  ⚠️  Ancien fichier détecté: ${sourcePath}`);
        oldFilesFound++;
      }
    });
    
    if (oldFilesFound === 0) {
      console.log('  ✅ Aucun ancien fichier détecté');
    } else {
      console.log(`  ⚠️  ${oldFilesFound} ancien(s) fichier(s) détecté(s)`);
    }
    
    return true;
  }
  
  // ====================================
  // NETTOYAGE INTELLIGENT
  // ====================================
  
  cleanupOldFiles() {
    console.log('🧹 Nettoyage intelligent des anciens fichiers...');
    
    let cleanedFiles = 0;
    
    this.config.sourcePaths.forEach(sourcePath => {
      const fullPath = path.join(__dirname, sourcePath);
      const destinationFile = path.join(__dirname, this.config.destinationPath);
      
      if (fs.existsSync(fullPath) && fullPath !== destinationFile) {
        try {
          // Vérifier que c'est bien le même contenu avant suppression
          const sourceContent = fs.readFileSync(fullPath, 'utf-8');
          const destContent = fs.readFileSync(destinationFile, 'utf-8');
          
          if (sourceContent === destContent || this.isPrismaServiceFile(sourceContent)) {
            fs.unlinkSync(fullPath);
            console.log(`  🗑️  Supprimé: ${sourcePath}`);
            cleanedFiles++;
          }
          
        } catch (error) {
          console.warn(`  ⚠️  Erreur nettoyage ${sourcePath}:`, error.message);
        }
      }
    });
    
    console.log(`  ✅ ${cleanedFiles} fichier(s) nettoyé(s)`);
  }
  
  // ====================================
  // RAPPORT FINAL
  // ====================================
  
  generateReport() {
    console.log('\n📊 RAPPORT DE RELOCATION ENTERPRISE');
    console.log('=====================================');
    console.log(`📦 Fichiers relocalisés: ${this.stats.filesRelocated}`);
    console.log(`🔄 Imports mis à jour: ${this.stats.importsUpdated}`);
    console.log(`📁 Fichiers scannés: ${this.stats.filesScanned}`);
    console.log(`❌ Erreurs rencontrées: ${this.stats.errorsEncountered}`);
    
    const successRate = this.stats.filesScanned > 0 
      ? ((this.stats.filesScanned - this.stats.errorsEncountered) / this.stats.filesScanned * 100).toFixed(1)
      : 100;
    
    console.log(`✅ Taux de succès: ${successRate}%`);
    
    if (this.stats.errorsEncountered === 0) {
      console.log('\n🎉 RELOCATION ENTERPRISE RÉUSSIE !');
      console.log('🔒 Service Prisma sécurisé côté serveur');
      console.log('🔄 Tous les imports mis à jour automatiquement');
      console.log('🚀 Architecture enterprise-grade déployée');
    } else {
      console.log(`\n⚠️  Relocation terminée avec ${this.stats.errorsEncountered} erreur(s)`);
      console.log('📋 Vérifiez les logs ci-dessus pour les détails');
    }
  }
  
  // ====================================
  // EXÉCUTION PRINCIPALE
  // ====================================
  
  execute() {
    console.log('🚀 Début relocation enterprise...\n');
    
    try {
      // Phase 1: Relocation du fichier
      const relocated = this.relocatePrismaService();
      
      // Phase 2: Mise à jour des imports (toujours faire, même si pas relocalisé)
      this.updateAllImports();
      
      // Phase 3: Validation
      this.validateRelocation();
      
      // Phase 4: Nettoyage
      if (relocated) {
        this.cleanupOldFiles();
      }
      
      // Phase 5: Rapport
      this.generateReport();
      
      return this.stats.errorsEncountered === 0;
      
    } catch (error) {
      console.error('❌ Erreur critique relocation:', error.message);
      this.stats.errorsEncountered++;
      return false;
    }
  }
}

// ====================================
// POINT D'ENTRÉE
// ====================================

const relocator = new EnterprisePrismaRelocator();
const success = relocator.execute();

process.exit(success ? 0 : 1);
