const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('💾 Système INTELLIGENT de préservation des customisations...');

class CustomizationPreserver {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups/customizations');
    this.metadataFile = path.join(this.backupDir, 'metadata.json');
    this.srcDir = path.join(__dirname, '../src');
    
    this.ensureDirectories();
    this.metadata = this.loadMetadata();
  }
  
  ensureDirectories() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }
  
  loadMetadata() {
    if (fs.existsSync(this.metadataFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.metadataFile, 'utf-8'));
      } catch (error) {
        console.log('⚠️  Métadonnées corrompues, création nouvelles');
      }
    }
    
    return {
      backups: [],
      customFiles: new Map(),
      preserveRules: this.getDefaultPreserveRules()
    };
  }
  
  saveMetadata() {
    // Convertir Map en objet pour JSON
    const metadataToSave = {
      ...this.metadata,
      customFiles: Object.fromEntries(this.metadata.customFiles)
    };
    
    fs.writeFileSync(this.metadataFile, JSON.stringify(metadataToSave, null, 2));
  }
  
  getDefaultPreserveRules() {
    return {
      // Fichiers à toujours préserver (customisations utilisateur)
      alwaysPreserve: [
        'src/components/custom/**/*',
        'src/styles/**/*',
        'src/utils/custom/**/*',
        'src/hooks/custom/**/*',
        'public/**/*',
        '.env*',
        'next.config.js'
      ],
      
      // Fichiers à préserver partiellement (merge intelligent)
      mergeIntelligent: [
        'src/context/AuthContext.tsx',
        'src/app/layout.tsx',
        'src/app/page.tsx',
        'package.json'
      ],
      
      // Fichiers générés à ne jamais préserver (écrasés à chaque fois)
      neverPreserve: [
        'src/lib/prisma-service.ts',
        'src/app/api/**/*',
        'prisma/schema.prisma',
        'src/hooks/use*.ts'
      ],
      
      // Patterns de customisation à détecter
      customizationMarkers: [
        '// CUSTOM:',
        '/* CUSTOM:',
        '// USER:',
        '/* USER:',
        '@custom',
        'CUSTOMIZATION_START',
        'CUSTOMIZATION_END'
      ]
    };
  }
  
  // ====================================
  // DÉTECTION DES CUSTOMISATIONS
  // ====================================
  
  detectCustomizations() {
    console.log('🔍 Détection des customisations utilisateur...');
    
    const customizations = {
      customFiles: [],
      modifiedGenerated: [],
      markedCustomizations: [],
      totalFiles: 0
    };
    
    this.scanDirectory(this.srcDir, customizations);
    
    console.log(`📊 Analyse terminée:`);
    console.log(`   📁 ${customizations.totalFiles} fichiers analysés`);
    console.log(`   🎨 ${customizations.customFiles.length} fichiers custom détectés`);
    console.log(`   🔧 ${customizations.modifiedGenerated.length} fichiers générés modifiés`);
    console.log(`   🏷️  ${customizations.markedCustomizations.length} marqueurs custom trouvés`);
    
    return customizations;
  }
  
  scanDirectory(dirPath, customizations) {
    if (!fs.existsSync(dirPath)) return;
    
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(this.srcDir, fullPath);
      
      if (entry.isDirectory()) {
        // Éviter certains dossiers
        if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(entry.name)) {
          this.scanDirectory(fullPath, customizations);
        }
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx|css|scss|json)$/.test(entry.name)) {
        customizations.totalFiles++;
        
        const analysis = this.analyzeFile(fullPath, relativePath);
        
        if (analysis.isCustom) {
          customizations.customFiles.push({
            path: relativePath,
            type: analysis.type,
            hash: analysis.hash,
            customMarkers: analysis.customMarkers
          });
        }
        
        if (analysis.isModifiedGenerated) {
          customizations.modifiedGenerated.push({
            path: relativePath,
            originalHash: analysis.originalHash,
            currentHash: analysis.hash,
            modifications: analysis.modifications
          });
        }
        
        if (analysis.customMarkers.length > 0) {
          customizations.markedCustomizations.push({
            path: relativePath,
            markers: analysis.customMarkers
          });
        }
      }
    });
  }
  
  analyzeFile(filePath, relativePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    const analysis = {
      hash: hash,
      isCustom: false,
      isModifiedGenerated: false,
      type: 'unknown',
      customMarkers: [],
      modifications: []
    };
    
    // 1. Vérifier les règles de préservation
    const rules = this.metadata.preserveRules;
    
    if (this.matchesPattern(relativePath, rules.alwaysPreserve)) {
      analysis.isCustom = true;
      analysis.type = 'always_preserve';
    } else if (this.matchesPattern(relativePath, rules.neverPreserve)) {
      analysis.type = 'never_preserve';
    } else if (this.matchesPattern(relativePath, rules.mergeIntelligent)) {
      analysis.type = 'merge_intelligent';
    }
    
    // 2. Détecter les marqueurs de customisation
    rules.customizationMarkers.forEach(marker => {
      if (content.includes(marker)) {
        analysis.customMarkers.push(marker);
        analysis.isCustom = true;
        analysis.type = 'marked_custom';
      }
    });
    
    // 3. Détecter les fichiers custom par nom
    if (relativePath.includes('custom') || 
        relativePath.includes('user') ||
        relativePath.includes('override')) {
      analysis.isCustom = true;
      analysis.type = 'custom_path';
    }
    
    // 4. Vérifier si c'est un fichier généré modifié
    if (content.includes('// Généré automatiquement') || 
        content.includes('// Generated automatically')) {
      
      // Vérifier s'il a des modifications custom
      if (analysis.customMarkers.length > 0 || 
          content.includes('// MODIFICATION:')) {
        analysis.isModifiedGenerated = true;
        analysis.modifications = this.extractModifications(content);
      }
    }
    
    return analysis;
  }
  
  matchesPattern(filePath, patterns) {
    return patterns.some(pattern => {
      const regex = new RegExp(
        pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
      );
      return regex.test(filePath);
    });
  }
  
  extractModifications(content) {
    const modifications = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Détecter les lignes avec modifications
      if (line.includes('// MODIFICATION:') || 
          line.includes('// CUSTOM:') ||
          line.includes('/* CUSTOM:')) {
        modifications.push({
          line: index + 1,
          content: line.trim(),
          context: lines.slice(Math.max(0, index - 2), index + 3)
        });
      }
    });
    
    return modifications;
  }
  
  // ====================================
  // SAUVEGARDE INTELLIGENTE
  // ====================================
  
  backup(reason = 'manual') {
    console.log(`💾 Sauvegarde intelligente des customisations (${reason})...`);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup-${timestamp}`;
    const backupPath = path.join(this.backupDir, backupId);
    
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
    
    const customizations = this.detectCustomizations();
    
    const backupInfo = {
      id: backupId,
      timestamp: new Date().toISOString(),
      reason: reason,
      files: [],
      stats: {
        totalFiles: 0,
        customFiles: customizations.customFiles.length,
        modifiedGenerated: customizations.modifiedGenerated.length,
        markedCustomizations: customizations.markedCustomizations.length
      }
    };
    
    // Sauvegarder les fichiers custom
    customizations.customFiles.forEach(file => {
      this.backupFile(file.path, backupPath, backupInfo);
    });
    
    // Sauvegarder les fichiers générés modifiés
    customizations.modifiedGenerated.forEach(file => {
      this.backupFile(file.path, backupPath, backupInfo, 'modified_generated');
    });
    
    // Sauvegarder les fichiers avec marqueurs
    customizations.markedCustomizations.forEach(file => {
      if (!backupInfo.files.some(f => f.path === file.path)) {
        this.backupFile(file.path, backupPath, backupInfo, 'marked_custom');
      }
    });
    
    // Sauvegarder les métadonnées de la sauvegarde
    fs.writeFileSync(
      path.join(backupPath, 'backup-info.json'),
      JSON.stringify(backupInfo, null, 2)
    );
    
    // Mettre à jour les métadonnées globales
    this.metadata.backups.push(backupInfo);
    
    // Garder seulement les 10 dernières sauvegardes
    if (this.metadata.backups.length > 10) {
      const oldBackup = this.metadata.backups.shift();
      this.cleanupOldBackup(oldBackup.id);
    }
    
    this.saveMetadata();
    
    console.log(`✅ Sauvegarde créée: ${backupId}`);
    console.log(`📊 ${backupInfo.stats.totalFiles} fichiers sauvegardés`);
    
    return { backupId, backupPath, backupInfo };
  }
  
  backupFile(relativePath, backupPath, backupInfo, type = 'custom') {
    const srcPath = path.join(this.srcDir, relativePath);
    const destPath = path.join(backupPath, relativePath);
    
    if (!fs.existsSync(srcPath)) return;
    
    // Créer les dossiers nécessaires
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copier le fichier
    fs.copyFileSync(srcPath, destPath);
    
    backupInfo.files.push({
      path: relativePath,
      type: type,
      size: fs.statSync(srcPath).size,
      hash: crypto.createHash('sha256').update(fs.readFileSync(srcPath)).digest('hex')
    });
    
    backupInfo.stats.totalFiles++;
  }
  
  cleanupOldBackup(backupId) {
    const oldBackupPath = path.join(this.backupDir, backupId);
    if (fs.existsSync(oldBackupPath)) {
      fs.rmSync(oldBackupPath, { recursive: true, force: true });
      console.log(`🗑️  Ancienne sauvegarde supprimée: ${backupId}`);
    }
  }
  
  // ====================================
  // RESTAURATION INTELLIGENTE
  // ====================================
  
  restore(backupId = 'latest', options = {}) {
    console.log(`🔄 Restauration intelligente des customisations (${backupId})...`);
    
    const backup = this.findBackup(backupId);
    if (!backup) {
      console.error(`❌ Sauvegarde '${backupId}' introuvable`);
      return false;
    }
    
    const backupPath = path.join(this.backupDir, backup.id);
    if (!fs.existsSync(backupPath)) {
      console.error(`❌ Dossier de sauvegarde introuvable: ${backupPath}`);
      return false;
    }
    
    const backupInfo = JSON.parse(fs.readFileSync(path.join(backupPath, 'backup-info.json'), 'utf-8'));
    
    console.log(`📋 Restauration depuis: ${backup.timestamp}`);
    console.log(`📊 ${backupInfo.files.length} fichiers à restaurer`);
    
    const results = {
      restored: [],
      skipped: [],
      conflicts: [],
      errors: []
    };
    
    backupInfo.files.forEach(file => {
      try {
        const result = this.restoreFile(file, backupPath, options);
        results[result.status].push({ ...file, result: result.message });
        
        if (result.status === 'restored') {
          console.log(`✅ Restauré: ${file.path}`);
        } else if (result.status === 'skipped') {
          console.log(`⏭️  Ignoré: ${file.path} (${result.message})`);
        } else if (result.status === 'conflicts') {
          console.log(`⚠️  Conflit: ${file.path} (${result.message})`);
        }
      } catch (error) {
        results.errors.push({ ...file, error: error.message });
        console.error(`❌ Erreur: ${file.path} - ${error.message}`);
      }
    });
    
    console.log(`\n📊 Résultats de la restauration:`);
    console.log(`   ✅ Restaurés: ${results.restored.length}`);
    console.log(`   ⏭️  Ignorés: ${results.skipped.length}`);
    console.log(`   ⚠️  Conflits: ${results.conflicts.length}`);
    console.log(`   ❌ Erreurs: ${results.errors.length}`);
    
    return results;
  }
  
  findBackup(backupId) {
    if (backupId === 'latest') {
      return this.metadata.backups[this.metadata.backups.length - 1];
    }
    
    return this.metadata.backups.find(b => b.id === backupId || b.id.includes(backupId));
  }
  
  restoreFile(fileInfo, backupPath, options = {}) {
    const backupFilePath = path.join(backupPath, fileInfo.path);
    const targetPath = path.join(this.srcDir, fileInfo.path);
    
    if (!fs.existsSync(backupFilePath)) {
      return { status: 'errors', message: 'Fichier de sauvegarde introuvable' };
    }
    
    // Vérifier si le fichier cible existe
    if (fs.existsSync(targetPath)) {
      const currentHash = crypto.createHash('sha256').update(fs.readFileSync(targetPath)).digest('hex');
      
      // Si le fichier n'a pas changé, on ignore
      if (currentHash === fileInfo.hash) {
        return { status: 'skipped', message: 'Identique à la sauvegarde' };
      }
      
      // Si c'est un fichier généré, on le restaure quand même
      if (fileInfo.type === 'modified_generated' && !options.preserveGenerated) {
        fs.copyFileSync(backupFilePath, targetPath);
        return { status: 'restored', message: 'Fichier généré restauré' };
      }
      
      // Si c'est un fichier custom et qu'il a été modifié, c'est un conflit
      if (fileInfo.type === 'custom' || fileInfo.type === 'marked_custom') {
        if (options.resolveConflicts === 'backup') {
          fs.copyFileSync(backupFilePath, targetPath);
          return { status: 'restored', message: 'Conflit résolu en faveur de la sauvegarde' };
        } else if (options.resolveConflicts === 'current') {
          return { status: 'skipped', message: 'Conflit résolu en faveur de la version actuelle' };
        } else {
          // Mode merge intelligent
          const mergeResult = this.mergeFiles(backupFilePath, targetPath, fileInfo);
          if (mergeResult.success) {
            return { status: 'restored', message: 'Fusionné intelligemment' };
          } else {
            return { status: 'conflicts', message: 'Conflit nécessitant intervention manuelle' };
          }
        }
      }
    }
    
    // Créer les dossiers nécessaires
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Restaurer le fichier
    fs.copyFileSync(backupFilePath, targetPath);
    return { status: 'restored', message: 'Fichier restauré' };
  }
  
  mergeFiles(backupFilePath, currentFilePath, fileInfo) {
    console.log(`🔄 Fusion intelligente: ${fileInfo.path}`);
    
    const backupContent = fs.readFileSync(backupFilePath, 'utf-8');
    const currentContent = fs.readFileSync(currentFilePath, 'utf-8');
    
    // Si c'est un fichier JSON (comme package.json), fusion des objets
    if (fileInfo.path.endsWith('.json')) {
      return this.mergeJsonFiles(backupContent, currentContent, currentFilePath);
    }
    
    // Si c'est un fichier de code avec marqueurs, extraction des customisations
    if (fileInfo.type === 'marked_custom') {
      return this.mergeMarkedCustomizations(backupContent, currentContent, currentFilePath);
    }
    
    // Pour les autres fichiers, créer un fichier de conflit
    const conflictPath = currentFilePath + '.conflict';
    fs.writeFileSync(conflictPath, `<<<<<<< CURRENT\n${currentContent}\n=======\n${backupContent}\n>>>>>>> BACKUP\n`);
    
    return { 
      success: false, 
      message: `Conflit créé dans ${conflictPath}` 
    };
  }
  
  mergeJsonFiles(backupContent, currentContent, targetPath) {
    try {
      const backupObj = JSON.parse(backupContent);
      const currentObj = JSON.parse(currentContent);
      
      // Fusion intelligente des objets JSON
      const merged = this.deepMerge(currentObj, backupObj);
      
      fs.writeFileSync(targetPath, JSON.stringify(merged, null, 2));
      return { success: true, message: 'JSON fusionné' };
    } catch (error) {
      return { success: false, message: 'Erreur fusion JSON: ' + error.message };
    }
  }
  
  mergeMarkedCustomizations(backupContent, currentContent, targetPath) {
    const customBlocks = this.extractCustomBlocks(backupContent);
    let mergedContent = currentContent;
    
    customBlocks.forEach(block => {
      if (!mergedContent.includes(block.content)) {
        // Insérer le bloc custom à la fin du fichier
        mergedContent += '\n\n' + block.marker + '\n' + block.content + '\n// END CUSTOM\n';
      }
    });
    
    fs.writeFileSync(targetPath, mergedContent);
    return { success: true, message: 'Customisations fusionnées' };
  }
  
  extractCustomBlocks(content) {
    const blocks = [];
    const lines = content.split('\n');
    let inCustomBlock = false;
    let currentBlock = { marker: '', content: '', lines: [] };
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.includes('// CUSTOM:') || trimmed.includes('/* CUSTOM:')) {
        inCustomBlock = true;
        currentBlock = { marker: trimmed, content: '', lines: [] };
      } else if (inCustomBlock && (trimmed.includes('// END CUSTOM') || trimmed.includes('/* END CUSTOM'))) {
        currentBlock.content = currentBlock.lines.join('\n');
        blocks.push(currentBlock);
        inCustomBlock = false;
      } else if (inCustomBlock) {
        currentBlock.lines.push(line);
      }
    });
    
    return blocks;
  }
  
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  // ====================================
  // INTERFACE PUBLIQUE
  // ====================================
  
  listBackups() {
    console.log('📋 Liste des sauvegardes:');
    this.metadata.backups.forEach((backup, index) => {
      console.log(`   ${index + 1}. ${backup.id}`);
      console.log(`      📅 ${backup.timestamp}`);
      console.log(`      📊 ${backup.stats.totalFiles} fichiers`);
      console.log(`      💡 Raison: ${backup.reason}`);
    });
  }
  
  analyze() {
    console.log('🔍 Analyse des customisations actuelles...');
    return this.detectCustomizations();
  }
}

// ====================================
// FONCTIONS PUBLIQUES
// ====================================

function preserveCustomizations(reason = 'before_regeneration') {
  try {
    const preserver = new CustomizationPreserver();
    const result = preserver.backup(reason);
    
    console.log('✅ Customisations préservées avec succès');
    return result;
  } catch (error) {
    console.error('❌ Erreur préservation:', error.message);
    throw error;
  }
}

function restoreCustomizations(backupId = 'latest', options = {}) {
  try {
    const preserver = new CustomizationPreserver();
    const result = preserver.restore(backupId, options);
    
    console.log('✅ Restauration terminée');
    return result;
  } catch (error) {
    console.error('❌ Erreur restauration:', error.message);
    throw error;
  }
}

function analyzeCustomizations() {
  try {
    const preserver = new CustomizationPreserver();
    return preserver.analyze();
  } catch (error) {
    console.error('❌ Erreur analyse:', error.message);
    throw error;
  }
}

// ====================================
// INTERFACE CLI
// ====================================

if (require.main === module) {
  const command = process.argv[2] || 'backup';
  const arg = process.argv[3];
  
  const preserver = new CustomizationPreserver();
  
  switch (command) {
    case 'backup':
      preserver.backup(arg || 'manual');
      break;
      
    case 'restore':
      preserver.restore(arg || 'latest');
      break;
      
    case 'list':
      preserver.listBackups();
      break;
      
    case 'analyze':
      preserver.analyze();
      break;
      
    default:
      console.log(`
💾 Préservation des customisations - Utilisation:

node preserveCustomizations.js backup [raison]     - Créer une sauvegarde
node preserveCustomizations.js restore [id]        - Restaurer une sauvegarde  
node preserveCustomizations.js list                - Lister les sauvegardes
node preserveCustomizations.js analyze             - Analyser les customisations

Exemples:
  node preserveCustomizations.js backup "avant mise à jour"
  node preserveCustomizations.js restore latest
  node preserveCustomizations.js restore backup-2024-01-15
      `);
  }
}

module.exports = { 
  CustomizationPreserver, 
  preserveCustomizations, 
  restoreCustomizations, 
  analyzeCustomizations 
};