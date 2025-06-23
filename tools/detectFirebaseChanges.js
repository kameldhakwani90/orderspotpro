const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔍 Détection INTELLIGENTE des changements Firebase...');

class FirebaseChangesDetector {
  constructor() {
    this.typesPath = path.join(__dirname, '../src/lib/types.ts');
    this.dataPath = path.join(__dirname, '../src/lib/data.ts');
    this.historyFile = path.join(__dirname, '../.firebase-history.json');
    this.backupDir = path.join(__dirname, '../backups');
    
    this.ensureDirectories();
    this.history = this.loadHistory();
  }
  
  ensureDirectories() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }
  
  loadHistory() {
    if (fs.existsSync(this.historyFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.historyFile, 'utf-8'));
      } catch (error) {
        console.log('⚠️  Historique corrompu, création nouveau');
      }
    }
    
    return {
      lastScan: null,
      models: {},
      hashes: {},
      changes: []
    };
  }
  
  saveHistory() {
    fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 2));
  }
  
  // ====================================
  // ANALYSE DES INTERFACES ACTUELLES
  // ====================================
  
  analyzeCurrentInterfaces() {
    console.log('📊 Analyse des interfaces actuelles...');
    
    if (!fs.existsSync(this.typesPath)) {
      console.log('⚠️  types.ts introuvable');
      return { interfaces: {}, hash: null };
    }
    
    const content = fs.readFileSync(this.typesPath, 'utf-8');
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    const interfaces = {};
    const interfaceRegex = /export\s+interface\s+(\w+)\s*\{([^}]+)\}/gs;
    let match;
    
    while ((match = interfaceRegex.exec(content)) !== null) {
      const interfaceName = match[1];
      const interfaceBody = match[2];
      
      const fields = this.parseInterfaceFields(interfaceBody);
      interfaces[interfaceName] = {
        fields: fields,
        fieldCount: Object.keys(fields).length,
        rawBody: interfaceBody.trim()
      };
    }
    
    console.log(`📋 ${Object.keys(interfaces).length} interfaces analysées`);
    return { interfaces, hash };
  }
  
  parseInterfaceFields(interfaceBody) {
    const fields = {};
    const lines = interfaceBody.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'));
    
    lines.forEach(line => {
      const fieldMatch = line.match(/(\w+)(\??):\s*([^;,\n]+)/);
      if (fieldMatch) {
        const [, fieldName, optional, fieldType] = fieldMatch;
        fields[fieldName] = {
          type: fieldType.trim().replace(/[;,]$/, ''),
          optional: optional === '?',
          raw: line.trim()
        };
      }
    });
    
    return fields;
  }
  
  // ====================================
  // DÉTECTION DES CHANGEMENTS
  // ====================================
  
  detectChanges() {
    console.log('🔍 Détection des changements depuis le dernier scan...');
    
    const current = this.analyzeCurrentInterfaces();
    
    if (!current.hash) {
      console.log('❌ Impossible d\'analyser les types actuels');
      return { hasChanges: false, changes: [] };
    }
    
    // Premier scan
    if (!this.history.lastScan) {
      console.log('🆕 Premier scan détecté');
      this.history.models = current.interfaces;
      this.history.hashes.types = current.hash;
      this.history.lastScan = new Date().toISOString();
      this.saveHistory();
      
      return {
        hasChanges: true,
        isFirstScan: true,
        changes: [{
          type: 'initial_scan',
          message: 'Premier scan - initialisation historique',
          models: Object.keys(current.interfaces),
          timestamp: new Date().toISOString()
        }]
      };
    }
    
    // Vérifier si le hash a changé
    if (this.history.hashes.types === current.hash) {
      console.log('✅ Aucun changement détecté dans types.ts');
      return { hasChanges: false, changes: [] };
    }
    
    console.log('🔄 Changements détectés ! Analyse détaillée...');
    
    const changes = this.analyzeDetailedChanges(this.history.models, current.interfaces);
    
    // Mettre à jour l'historique
    this.history.models = current.interfaces;
    this.history.hashes.types = current.hash;
    this.history.lastScan = new Date().toISOString();
    this.history.changes.push(...changes);
    
    // Garder seulement les 50 derniers changements
    if (this.history.changes.length > 50) {
      this.history.changes = this.history.changes.slice(-50);
    }
    
    this.saveHistory();
    
    return { hasChanges: true, changes };
  }
  
  analyzeDetailedChanges(oldModels, newModels) {
    const changes = [];
    const timestamp = new Date().toISOString();
    
    // 1. Modèles ajoutés
    Object.keys(newModels).forEach(modelName => {
      if (!oldModels[modelName]) {
        changes.push({
          type: 'model_added',
          model: modelName,
          message: `Nouveau modèle: ${modelName}`,
          fieldCount: newModels[modelName].fieldCount,
          timestamp
        });
        console.log(`  🆕 Nouveau modèle: ${modelName}`);
      }
    });
    
    // 2. Modèles supprimés
    Object.keys(oldModels).forEach(modelName => {
      if (!newModels[modelName]) {
        changes.push({
          type: 'model_removed',
          model: modelName,
          message: `Modèle supprimé: ${modelName}`,
          backup: oldModels[modelName],
          timestamp
        });
        console.log(`  ❌ Modèle supprimé: ${modelName}`);
      }
    });
    
    // 3. Modèles modifiés
    Object.keys(newModels).forEach(modelName => {
      if (oldModels[modelName]) {
        const fieldChanges = this.analyzeFieldChanges(
          oldModels[modelName].fields,
          newModels[modelName].fields,
          modelName
        );
        
        if (fieldChanges.length > 0) {
          changes.push({
            type: 'model_modified',
            model: modelName,
            message: `Modèle modifié: ${modelName}`,
            fieldChanges: fieldChanges,
            timestamp
          });
          console.log(`  🔄 Modèle modifié: ${modelName} (${fieldChanges.length} changements)`);
        }
      }
    });
    
    return changes;
  }
  
  analyzeFieldChanges(oldFields, newFields, modelName) {
    const fieldChanges = [];
    
    // Champs ajoutés
    Object.keys(newFields).forEach(fieldName => {
      if (!oldFields[fieldName]) {
        fieldChanges.push({
          type: 'field_added',
          field: fieldName,
          fieldType: newFields[fieldName].type,
          optional: newFields[fieldName].optional
        });
        console.log(`    ➕ ${modelName}.${fieldName}: ${newFields[fieldName].type}`);
      }
    });
    
    // Champs supprimés
    Object.keys(oldFields).forEach(fieldName => {
      if (!newFields[fieldName]) {
        fieldChanges.push({
          type: 'field_removed',
          field: fieldName,
          oldType: oldFields[fieldName].type,
          backup: oldFields[fieldName]
        });
        console.log(`    ➖ ${modelName}.${fieldName} supprimé`);
      }
    });
    
    // Champs modifiés
    Object.keys(newFields).forEach(fieldName => {
      if (oldFields[fieldName]) {
        const oldField = oldFields[fieldName];
        const newField = newFields[fieldName];
        
        if (oldField.type !== newField.type || oldField.optional !== newField.optional) {
          fieldChanges.push({
            type: 'field_modified',
            field: fieldName,
            oldType: oldField.type,
            newType: newField.type,
            oldOptional: oldField.optional,
            newOptional: newField.optional
          });
          console.log(`    🔄 ${modelName}.${fieldName}: ${oldField.type} → ${newField.type}`);
        }
      }
    });
    
    return fieldChanges;
  }
  
  // ====================================
  // SAUVEGARDE DES CUSTOMISATIONS
  // ====================================
  
  backupCustomizations(changes) {
    if (!changes || changes.length === 0) return null;
    
    console.log('💾 Sauvegarde des customisations avant changements...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `customizations-${timestamp}`);
    
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
    
    // Sauvegarder les fichiers critiques
    const criticalFiles = [
      'src/lib/types.ts',
      'src/lib/data.ts',
      'prisma/schema.prisma',
      'src/lib/prisma-service.ts',
      'src/context/AuthContext.tsx'
    ];
    
    let savedFiles = 0;
    criticalFiles.forEach(file => {
      const fullPath = path.join(__dirname, '..', file);
      if (fs.existsSync(fullPath)) {
        const backupFilePath = path.join(backupPath, file.replace(/\//g, '_'));
        fs.copyFileSync(fullPath, backupFilePath);
        savedFiles++;
      }
    });
    
    // Sauvegarder les composants personnalisés
    const customComponentsDir = path.join(__dirname, '../src/components');
    if (fs.existsSync(customComponentsDir)) {
      const customBackupDir = path.join(backupPath, 'components');
      this.copyDirectory(customComponentsDir, customBackupDir);
    }
    
    // Créer un rapport de changements
    const changeReport = {
      timestamp: new Date().toISOString(),
      changes: changes,
      backupPath: backupPath,
      savedFiles: savedFiles
    };
    
    fs.writeFileSync(
      path.join(backupPath, 'change-report.json'),
      JSON.stringify(changeReport, null, 2)
    );
    
    console.log(`✅ Sauvegarde créée: ${backupPath}`);
    console.log(`📊 ${savedFiles} fichiers sauvegardés`);
    
    return backupPath;
  }
  
  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    entries.forEach(entry => {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }
  
  // ====================================
  // GÉNÉRATION DU RAPPORT
  // ====================================
  
  generateReport(detectionResult) {
    console.log('\n📊 RAPPORT DE DÉTECTION FIREBASE');
    console.log('='.repeat(50));
    
    if (!detectionResult.hasChanges) {
      console.log('✅ Aucun changement détecté');
      console.log('📅 Dernier scan:', this.history.lastScan);
      return;
    }
    
    if (detectionResult.isFirstScan) {
      console.log('🆕 PREMIER SCAN INITIALISÉ');
      console.log(`📋 ${detectionResult.changes[0].models.length} modèles détectés`);
      return;
    }
    
    console.log(`🔄 ${detectionResult.changes.length} changement(s) détecté(s):`);
    
    const changesByType = {
      model_added: [],
      model_removed: [],
      model_modified: []
    };
    
    detectionResult.changes.forEach(change => {
      if (changesByType[change.type]) {
        changesByType[change.type].push(change);
      }
    });
    
    if (changesByType.model_added.length > 0) {
      console.log('\n🆕 NOUVEAUX MODÈLES:');
      changesByType.model_added.forEach(change => {
        console.log(`   ✅ ${change.model} (${change.fieldCount} champs)`);
      });
    }
    
    if (changesByType.model_removed.length > 0) {
      console.log('\n❌ MODÈLES SUPPRIMÉS:');
      changesByType.model_removed.forEach(change => {
        console.log(`   🗑️  ${change.model}`);
      });
    }
    
    if (changesByType.model_modified.length > 0) {
      console.log('\n🔄 MODÈLES MODIFIÉS:');
      changesByType.model_modified.forEach(change => {
        console.log(`   📝 ${change.model} (${change.fieldChanges.length} champs modifiés)`);
        change.fieldChanges.forEach(fieldChange => {
          const symbol = {
            field_added: '➕',
            field_removed: '➖',
            field_modified: '🔄'
          }[fieldChange.type] || '🔄';
          console.log(`      ${symbol} ${fieldChange.field}`);
        });
      });
    }
    
    console.log('\n📋 ACTIONS RECOMMANDÉES:');
    console.log('   1. Régénérer le schema Prisma');
    console.log('   2. Mettre à jour le service Prisma');
    console.log('   3. Régénérer les routes API');
    console.log('   4. Mettre à jour les hooks React');
    console.log('   5. Migrer les composants');
  }
  
  // ====================================
  // INTERFACE PUBLIQUE
  // ====================================
  
  async detect() {
    console.log('🚀 Lancement détection Firebase...\n');
    
    const detectionResult = this.detectChanges();
    
    let backupPath = null;
    if (detectionResult.hasChanges && !detectionResult.isFirstScan) {
      backupPath = this.backupCustomizations(detectionResult.changes);
    }
    
    this.generateReport(detectionResult);
    
    return {
      ...detectionResult,
      backupPath: backupPath,
      needsRegeneration: detectionResult.hasChanges
    };
  }
}

// ====================================
// EXÉCUTION
// ====================================

async function detectFirebaseChanges() {
  try {
    const detector = new FirebaseChangesDetector();
    const result = await detector.detect();
    
    console.log('\n✅ Détection Firebase terminée');
    
    if (result.needsRegeneration) {
      console.log('🔄 Régénération recommandée');
      return { needsRegeneration: true, changes: result.changes, backupPath: result.backupPath };
    } else {
      console.log('✅ Aucune régénération nécessaire');
      return { needsRegeneration: false };
    }
    
  } catch (error) {
    console.error('❌ Erreur détection Firebase:', error.message);
    throw error;
  }
}

// Exécution si script appelé directement
if (require.main === module) {
  detectFirebaseChanges().then(result => {
    console.log('\n📊 Résultat:', result.needsRegeneration ? 'CHANGEMENTS DÉTECTÉS' : 'AUCUN CHANGEMENT');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  });
}

module.exports = { FirebaseChangesDetector, detectFirebaseChanges };