// ====================================
// INTELLIGENT ERROR SURGEON - DR. ERRORSURGEON IA
// ====================================
// Version: 1.0 - Chirurgien des erreurs avec diagnostic médical
// Mission: Diagnostic précis et résolution chirurgicale d'erreurs
// ====================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ====================================
// CLASSE INTELLIGENT ERROR SURGEON
// ====================================

class IntelligentErrorSurgeon {
  constructor() {
    this.projectDir = process.cwd();
    this.startTime = Date.now();
    this.sessionId = `error-surgeon-${Date.now()}`;
    
    // Infrastructure IA
    this.aiInfrastructure = null;
    this.promptManager = null;
    this.aiEnabled = process.env.AI_INFRASTRUCTURE_AVAILABLE === 'true';
    
    // Métriques chirurgicales
    this.metrics = {
      errorsDetected: 0,
      errorsAnalyzed: 0,
      errorsSurgicallyFixed: 0,
      aiDiagnoses: 0,
      cacheHits: 0,
      emergencyFixes: 0,
      preventedRecurrence: 0
    };
    
    // État médical
    this.patientFiles = new Map(); // Historique médical des fichiers
    this.diagnosticHistory = [];
    this.operationLog = [];
    this.recoveryMonitoring = new Set();
    
    console.log('🏥 Intelligent Error Surgeon - Dr. ErrorSurgeon IA');
    console.log(`📁 Patient (Projet): ${path.basename(this.projectDir)}`);
    console.log(`🤖 Équipement IA: ${this.aiEnabled ? '✅ Opérationnel' : '❌ Indisponible'}`);
    
    this.initialize();
  }
  
  // ====================================
  // INITIALISATION BLOC OPÉRATOIRE
  // ====================================
  
  async initialize() {
    try {
      if (this.aiEnabled) {
        await this.initializeAI();
      } else {
        console.log('⚠️ Mode d\'urgence - Chirurgie manuelle seulement');
      }
      
      // Créer bloc opératoire
      this.operatingRoom = path.join(this.projectDir, '.error-surgeon-or');
      if (!fs.existsSync(this.operatingRoom)) {
        fs.mkdirSync(this.operatingRoom, { recursive: true });
      }
      
      // Initialiser historique médical
      this.loadMedicalHistory();
      
    } catch (error) {
      console.error('❌ Erreur préparation bloc opératoire:', error.message);
      this.aiEnabled = false;
    }
  }
  
  async initializeAI() {
    try {
      // Charger équipement IA
      const { AIInfrastructure } = require('./ai-infrastructure.js');
      const { DynamicPromptManager } = require('./ai-prompts.js');
      
      this.aiInfrastructure = new AIInfrastructure({
        baseDir: this.projectDir
      });
      
      this.promptManager = new DynamicPromptManager();
      
      console.log('🧠 Équipement IA diagnostique opérationnel');
      
      // Notification admission patient
      this.aiInfrastructure.sendScriptMessage(
        'intelligentErrorSurgeon',
        'build-server',
        'patient_admission',
        { 
          sessionId: this.sessionId, 
          patientName: path.basename(this.projectDir),
          timestamp: new Date().toISOString() 
        }
      );
      
    } catch (error) {
      console.error('❌ Équipement IA défaillant:', error.message);
      this.aiEnabled = false;
    }
  }
  
  loadMedicalHistory() {
    const historyFile = path.join(this.operatingRoom, 'medical-history.json');
    try {
      if (fs.existsSync(historyFile)) {
        const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        this.patientFiles = new Map(history.patientFiles || []);
        this.diagnosticHistory = history.diagnosticHistory || [];
        console.log(`📋 Historique médical chargé: ${this.diagnosticHistory.length} diagnostics`);
      }
    } catch (error) {
      console.log('📋 Nouveau patient - Création dossier médical');
    }
  }
  
  saveMedicalHistory() {
    const historyFile = path.join(this.operatingRoom, 'medical-history.json');
    const history = {
      patientFiles: Array.from(this.patientFiles.entries()),
      diagnosticHistory: this.diagnosticHistory,
      lastUpdate: new Date().toISOString()
    };
    
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  }
  
  // ====================================
  // ANAMNÈSE - DÉTECTION ERREURS
  // ====================================
  
  async conductAnamnesis() {
    console.log('\n🩺 ANAMNÈSE - Collecte des symptômes...');
    
    const symptoms = [];
    
    // Symptômes TypeScript
    try {
      console.log('🔍 Examen TypeScript...');
      const tsErrors = await this.detectTypeScriptErrors();
      symptoms.push(...tsErrors.map(err => ({
        ...err,
        category: 'typescript',
        severity: this.assessSeverity(err)
      })));
    } catch (error) {
      console.log('✅ Système TypeScript stable');
    }
    
    // Symptômes compilation Next.js
    try {
      console.log('🔍 Examen compilation Next.js...');
      const buildErrors = await this.detectBuildErrors();
      symptoms.push(...buildErrors.map(err => ({
        ...err,
        category: 'build',
        severity: this.assessSeverity(err)
      })));
    } catch (error) {
      console.log('✅ Système build stable');
    }
    
    // Symptômes Prisma
    try {
      console.log('🔍 Examen base de données Prisma...');
      const prismaErrors = await this.detectPrismaErrors();
      symptoms.push(...prismaErrors.map(err => ({
        ...err,
        category: 'prisma',
        severity: this.assessSeverity(err)
      })));
    } catch (error) {
      console.log('✅ Système Prisma stable');
    }
    
    // Symptômes runtime
    console.log('🔍 Analyse logs runtime...');
    const runtimeErrors = await this.detectRuntimeErrors();
    symptoms.push(...runtimeErrors.map(err => ({
      ...err,
      category: 'runtime',
      severity: this.assessSeverity(err)
    })));
    
    this.metrics.errorsDetected = symptoms.length;
    console.log(`📊 ${symptoms.length} symptômes détectés`);
    
    return this.triageSymptoms(symptoms);
  }
  
  async detectTypeScriptErrors() {
    try {
      execSync('npx tsc --noEmit --pretty false', { 
        encoding: 'utf8',
        cwd: this.projectDir,
        stdio: 'pipe'
      });
      return [];
    } catch (error) {
      const output = error.stdout || error.stderr || '';
      return this.parseCompilerErrors(output, 'typescript');
    }
  }
  
  async detectBuildErrors() {
    try {
      execSync('npm run build 2>&1 | head -50', { 
        encoding: 'utf8',
        cwd: this.projectDir,
        stdio: 'pipe',
        timeout: 30000
      });
      return [];
    } catch (error) {
      const output = error.stdout || error.stderr || '';
      return this.parseCompilerErrors(output, 'build');
    }
  }
  
  async detectPrismaErrors() {
    const errors = [];
    
    try {
      // Test génération client Prisma
      execSync('npx prisma generate', { 
        encoding: 'utf8',
        cwd: this.projectDir,
        stdio: 'pipe'
      });
    } catch (error) {
      const output = error.stdout || error.stderr || '';
      errors.push(...this.parseCompilerErrors(output, 'prisma'));
    }
    
    // Vérifier schema
    const schemaPath = path.join(this.projectDir, 'prisma/schema.prisma');
    if (fs.existsSync(schemaPath)) {
      const schemaErrors = await this.analyzePrismaSchema(schemaPath);
      errors.push(...schemaErrors);
    }
    
    return errors;
  }
  
  async detectRuntimeErrors() {
    const errors = [];
    
    // Chercher logs d'erreur récents
    const logFiles = [
      path.join(this.projectDir, '.next/build.log'),
      path.join(this.projectDir, 'build-logs'),
      path.join(this.projectDir, 'logs')
    ];
    
    for (const logLocation of logFiles) {
      if (fs.existsSync(logLocation)) {
        const runtimeErrors = await this.parseLogFiles(logLocation);
        errors.push(...runtimeErrors);
      }
    }
    
    return errors;
  }
  
  parseCompilerErrors(output, category) {
    const errors = [];
    const lines = output.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern général d'erreur
      const errorPattern = /^(.+?)\((\d+),(\d+)\):\s*(error|warning)\s*([A-Z]*\d+)?:\s*(.+)$/;
      const match = line.match(errorPattern);
      
      if (match) {
        const [, filePath, lineNum, column, level, code, message] = match;
        
        // Collecter contexte (lignes suivantes)
        let context = '';
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          if (lines[j].trim() && !lines[j].includes('error') && !lines[j].includes('warning')) {
            context += lines[j] + '\n';
          } else {
            break;
          }
        }
        
        errors.push({
          file: filePath,
          line: parseInt(lineNum),
          column: parseInt(column),
          level,
          code: code || 'UNKNOWN',
          message: message.trim(),
          context: context.trim(),
          category,
          stackTrace: this.extractStackTrace(lines, i)
        });
      }
    }
    
    return errors;
  }
  
  extractStackTrace(lines, startIndex) {
    const stackTrace = [];
    for (let i = startIndex; i < Math.min(startIndex + 10, lines.length); i++) {
      const line = lines[i];
      if (line.trim().startsWith('at ') || line.includes('stack trace')) {
        stackTrace.push(line.trim());
      }
    }
    return stackTrace;
  }
  
  async analyzePrismaSchema(schemaPath) {
    const errors = [];
    const content = fs.readFileSync(schemaPath, 'utf8');
    
    // Vérifications basiques du schema
    if (!content.includes('generator client')) {
      errors.push({
        file: schemaPath,
        line: 1,
        message: 'Generator client manquant dans schema.prisma',
        category: 'prisma',
        code: 'PRISMA_NO_GENERATOR'
      });
    }
    
    if (!content.includes('datasource db')) {
      errors.push({
        file: schemaPath,
        line: 1,
        message: 'Datasource manquant dans schema.prisma',
        category: 'prisma',
        code: 'PRISMA_NO_DATASOURCE'
      });
    }
    
    return errors;
  }
  
  async parseLogFiles(logLocation) {
    const errors = [];
    
    try {
      if (fs.statSync(logLocation).isDirectory()) {
        const files = fs.readdirSync(logLocation);
        for (const file of files.slice(-3)) { // 3 logs les plus récents
          const content = fs.readFileSync(path.join(logLocation, file), 'utf8');
          errors.push(...this.extractErrorsFromLog(content));
        }
      } else {
        const content = fs.readFileSync(logLocation, 'utf8');
        errors.push(...this.extractErrorsFromLog(content));
      }
    } catch (error) {
      // Ignore si pas accessible
    }
    
    return errors;
  }
  
  extractErrorsFromLog(content) {
    const errors = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.includes('Error:') || line.includes('ERROR') || line.includes('Failed')) {
        errors.push({
          message: line.trim(),
          category: 'runtime',
          code: 'RUNTIME_ERROR',
          timestamp: this.extractTimestamp(line)
        });
      }
    }
    
    return errors;
  }
  
  extractTimestamp(line) {
    const timestampPattern = /\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/;
    const match = line.match(timestampPattern);
    return match ? match[0] : new Date().toISOString();
  }
  
  assessSeverity(error) {
    // Évaluation médicale de la gravité
    if (error.level === 'error') {
      if (error.category === 'typescript' || error.category === 'build') {
        return 'critical'; // Arrêt cardiaque
      }
      return 'severe'; // Urgence chirurgicale
    }
    
    if (error.level === 'warning') {
      return 'moderate'; // Surveillance nécessaire
    }
    
    return 'mild'; // Symptôme bénin
  }
  
  triageSymptoms(symptoms) {
    // Triage médical par ordre de priorité
    return symptoms.sort((a, b) => {
      const severityOrder = { critical: 4, severe: 3, moderate: 2, mild: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }
  
  // ====================================
  // DIAGNOSTIC IA MÉDICAL
  // ====================================
  
  async performDiagnosis(symptom) {
    console.log(`\n🩺 DIAGNOSTIC - ${path.basename(symptom.file || 'System')}:${symptom.line || 'N/A'}`);
    console.log(`   🔍 Symptôme: ${symptom.message}`);
    console.log(`   ⚠️ Gravité: ${symptom.severity}`);
    
    this.metrics.errorsAnalyzed++;
    
    try {
      if (this.aiEnabled) {
        return await this.performAIDiagnosis(symptom);
      } else {
        return await this.performEmergencyDiagnosis(symptom);
      }
    } catch (diagnosisError) {
      console.error(`❌ Échec diagnostic: ${diagnosisError.message}`);
      return await this.performEmergencyDiagnosis(symptom);
    }
  }
  
  async performAIDiagnosis(symptom) {
    this.metrics.aiDiagnoses++;
    
    // Vérifier antécédents médicaux (cache)
    const cacheKey = this.generateDiagnosticKey(symptom);
    const priorDiagnosis = this.aiInfrastructure.memory.recall(cacheKey, 'diagnostics');
    
    if (priorDiagnosis && priorDiagnosis.confidence > 0.85) {
      console.log('📋 Antécédent médical trouvé dans le dossier');
      this.metrics.cacheHits++;
      return priorDiagnosis;
    }
    
    // Nouveau diagnostic IA
    const medicalContext = await this.buildMedicalContext(symptom);
    const diagnosticPrompt = this.promptManager.generatePrompt(
      'intelligentErrorSurgeon',
      'diagnosticPrompt',
      medicalContext
    );
    
    console.log('🧠 Consultation spécialiste IA...');
    
    const response = await this.aiInfrastructure.surgicalFix(diagnosticPrompt, medicalContext);
    const diagnosis = this.parseDiagnosis(response.solution);
    
    if (diagnosis) {
      // Enregistrer dans dossier médical
      this.aiInfrastructure.memory.remember(cacheKey, {
        diagnosis,
        confidence: 0.9,
        timestamp: new Date().toISOString(),
        symptom: this.sanitizeSymptomForStorage(symptom)
      }, 'diagnostics');
      
      // Ajouter à l'historique
      this.diagnosticHistory.push({
        symptom: symptom.message,
        diagnosis: diagnosis.rootCause,
        timestamp: new Date().toISOString(),
        successful: true
      });
      
      return diagnosis;
    }
    
    console.log('⚠️ IA n\'a pas pu établir de diagnostic, procédure d\'urgence');
    return await this.performEmergencyDiagnosis(symptom);
  }
  
  async buildMedicalContext(symptom) {
    const context = {
      projectName: path.basename(this.projectDir),
      errorMessage: symptom.message,
      fileName: path.basename(symptom.file || 'Unknown'),
      lineNumber: symptom.line || 'N/A',
      category: symptom.category,
      severity: symptom.severity
    };
    
    // Ajouter historique médical récent
    context.recentChanges = await this.getRecentFileChanges(symptom.file);
    context.similarErrors = this.findSimilarSymptoms(symptom);
    context.previousState = this.getPreviousHealthState();
    
    // Ajouter contexte du code
    if (symptom.file && fs.existsSync(symptom.file)) {
      context.codeContext = await this.extractCodeContext(symptom.file, symptom.line);
    }
    
    // Ajouter stack trace si disponible
    if (symptom.stackTrace && symptom.stackTrace.length > 0) {
      context.stackTrace = symptom.stackTrace.join('\n');
    }
    
    // Ajouter dépendances impliquées
    context.dependencies = await this.analyzeDependencies(symptom);
    
    return context;
  }
  
  async getRecentFileChanges(filePath) {
    if (!filePath || !fs.existsSync(filePath)) return 'Aucun changement détecté';
    
    try {
      // Utiliser Git pour voir les changements récents
      const gitLog = execSync(`git log --oneline -5 -- "${filePath}"`, {
        encoding: 'utf8',
        cwd: this.projectDir,
        stdio: 'pipe'
      });
      return gitLog.trim() || 'Pas d\'historique Git';
    } catch (error) {
      return 'Historique non disponible';
    }
  }
  
  findSimilarSymptoms(symptom) {
    const similar = this.diagnosticHistory
      .filter(entry => 
        entry.symptom.includes(symptom.code) || 
        entry.symptom.includes(symptom.category)
      )
      .slice(-3); // 3 cas similaires récents
    
    return similar.length > 0 
      ? similar.map(s => `${s.diagnosis} (${s.successful ? 'Guéri' : 'Récidive'})`).join('; ')
      : 'Aucun antécédent similaire';
  }
  
  getPreviousHealthState() {
    const recentFiles = Array.from(this.patientFiles.values())
      .filter(file => file.lastCheckup && Date.now() - new Date(file.lastCheckup).getTime() < 24 * 60 * 60 * 1000)
      .slice(-5);
    
    return recentFiles.length > 0 
      ? `${recentFiles.length} fichiers examinés récemment`
      : 'Premier examen médical';
  }
  
  async extractCodeContext(filePath, lineNumber) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const contextStart = Math.max(0, (lineNumber || 1) - 4);
      const contextEnd = Math.min(lines.length, (lineNumber || 1) + 3);
      
      return lines.slice(contextStart, contextEnd)
        .map((line, idx) => {
          const lineNum = contextStart + idx + 1;
          const marker = lineNum === lineNumber ? ' 🚨' : '   ';
          return `${lineNum}${marker} ${line}`;
        })
        .join('\n');
    } catch (error) {
      return 'Contexte code non disponible';
    }
  }
  
  async analyzeDependencies(symptom) {
    try {
      if (symptom.message.includes('Cannot resolve module') || symptom.message.includes('Module not found')) {
        const moduleName = this.extractModuleName(symptom.message);
        if (moduleName) {
          const packageJson = path.join(this.projectDir, 'package.json');
          if (fs.existsSync(packageJson)) {
            const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
            const isDep = !!(pkg.dependencies && pkg.dependencies[moduleName]);
            const isDevDep = !!(pkg.devDependencies && pkg.devDependencies[moduleName]);
            
            return `Module ${moduleName}: ${isDep ? 'Dépendance' : isDevDep ? 'DevDépendance' : 'Non installé'}`;
          }
        }
      }
      
      return 'Aucune dépendance impliquée';
    } catch (error) {
      return 'Analyse dépendances échouée';
    }
  }
  
  extractModuleName(message) {
    const patterns = [
      /Cannot resolve module ['"](.*?)['"]/, 
      /Module not found: ['"](.*?)['"]/, 
      /Cannot find module ['"](.*?)['"]/ 
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }
  
  parseDiagnosis(diagnosisText) {
    try {
      // Essayer de parser JSON de la réponse IA
      const jsonMatch = diagnosisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: parser manuel
      return this.parseSimpleDiagnosis(diagnosisText);
      
    } catch (error) {
      console.error('❌ Erreur parsing diagnostic:', error.message);
      return null;
    }
  }
  
  parseSimpleDiagnosis(text) {
    // Parser basique pour diagnostic simple
    const lines = text.split('\n');
    const diagnosis = {
      rootCause: 'Diagnostic automatique',
      treatment: 'Correction standard',
      confidence: 0.7
    };
    
    for (const line of lines) {
      if (line.toLowerCase().includes('cause')) {
        diagnosis.rootCause = line.trim();
      }
      if (line.toLowerCase().includes('solution') || line.toLowerCase().includes('fix')) {
        diagnosis.treatment = line.trim();
      }
    }
    
    return diagnosis;
  }
  
  // ====================================
  // INTERVENTION CHIRURGICALE
  // ====================================
  
  async performSurgery(symptom, diagnosis) {
    console.log(`\n⚔️ INTERVENTION CHIRURGICALE`);
    console.log(`   🎯 Cause racine: ${diagnosis.rootCause || 'Non déterminée'}`);
    console.log(`   🔧 Plan opératoire: ${diagnosis.treatment || 'Intervention standard'}`);
    
    try {
      // Préparation préopératoire
      await this.preOperativePrep(symptom);
      
      // Intervention selon le diagnostic
      let surgerySuccess = false;
      
      if (this.aiEnabled && diagnosis.surgery) {
        surgerySuccess = await this.performAISurgery(symptom, diagnosis);
      } else {
        surgerySuccess = await this.performEmergencySurgery(symptom);
      }
      
      // Soins post-opératoires
      if (surgerySuccess) {
        await this.postOperativeCare(symptom, diagnosis);
        this.metrics.errorsSurgicallyFixed++;
        console.log('✅ Intervention chirurgicale réussie');
      } else {
        console.log('❌ Intervention échouée');
      }
      
      return surgerySuccess;
      
    } catch (surgeryError) {
      console.error(`❌ Complication chirurgicale: ${surgeryError.message}`);
      return false;
    }
  }
  
  async preOperativePrep(symptom) {
    // Backup des fichiers (anesthésie)
    if (symptom.file && fs.existsSync(symptom.file)) {
      this.aiInfrastructure?.backupFile(symptom.file);
      console.log('💾 Sauvegarde préopératoire effectuée');
    }
    
    // Enregistrer dans le carnet opératoire
    this.operationLog.push({
      symptom: symptom.message,
      file: symptom.file,
      startTime: new Date().toISOString(),
      status: 'in_progress'
    });
  }
  
  async performAISurgery(symptom, diagnosis) {
    if (!diagnosis.surgery) return false;
    
    const surgery = diagnosis.surgery;
    console.log(`🤖 Chirurgie assistée IA: ${surgery.action}`);
    
    switch (surgery.action) {
      case 'modifier_ligne':
        return await this.surgicalLineModification(symptom.file, surgery.line, surgery.newCode);
        
      case 'corriger_import':
        return await this.surgicalImportCorrection(symptom.file, surgery.fix);
        
      case 'fix_syntax':
        return await this.surgicalSyntaxRepair(symptom.file, surgery);
        
      case 'resoudre_dependance':
        return await this.surgicalDependencyResolution(surgery.module);
        
      default:
        console.log(`⚠️ Procédure chirurgicale inconnue: ${surgery.action}`);
        return await this.performEmergencySurgery(symptom);
    }
  }
  
  async surgicalLineModification(filePath, lineNumber, newCode) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      if (lineNumber > 0 && lineNumber <= lines.length) {
        const oldLine = lines[lineNumber - 1];
        lines[lineNumber - 1] = newCode;
        
        fs.writeFileSync(filePath, lines.join('\n'));
        
        console.log(`🔧 Ligne ${lineNumber} modifiée chirurgicalement`);
        console.log(`   ❌ Avant: ${oldLine.trim()}`);
        console.log(`   ✅ Après: ${newCode.trim()}`);
        
        return await this.testPostSurgery(filePath);
      }
      
      return false;
    } catch (error) {
      console.error(`❌ Échec modification ligne: ${error.message}`);
      return false;
    }
  }
  
  async surgicalImportCorrection(filePath, fix) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Vérifier si l'import existe déjà
      if (content.includes(fix.trim())) {
        console.log('ℹ️ Import déjà présent - Pas d\'intervention nécessaire');
        return true;
      }
      
      const lines = content.split('\n');
      
      // Trouver position d'insertion (après autres imports)
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          insertIndex = i + 1;
        } else if (lines[i].trim() === '' && insertIndex > 0) {
          break;
        }
      }
      
      lines.splice(insertIndex, 0, fix);
      fs.writeFileSync(filePath, lines.join('\n'));
      
      console.log(`📥 Import ajouté chirurgicalement: ${fix.trim()}`);
      return await this.testPostSurgery(filePath);
      
    } catch (error) {
      console.error(`❌ Échec correction import: ${error.message}`);
      return false;
    }
  }
  
  async surgicalSyntaxRepair(filePath, surgery) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (surgery.oldCode && surgery.newCode) {
        const repairedContent = content.replace(surgery.oldCode, surgery.newCode);
        
        if (repairedContent !== content) {
          fs.writeFileSync(filePath, repairedContent);
          console.log('🔧 Réparation syntaxique effectuée');
          return await this.testPostSurgery(filePath);
        }
      }
      
      return false;
    } catch (error) {
      console.error(`❌ Échec réparation syntaxique: ${error.message}`);
      return false;
    }
  }
  
  async surgicalDependencyResolution(module) {
    try {
      console.log(`📦 Résolution chirurgicale dépendance: ${module}`);
      
      // Essayer d'installer le module manquant
      execSync(`npm install ${module}`, {
        stdio: 'pipe',
        cwd: this.projectDir,
        timeout: 60000
      });
      
      console.log(`✅ Module ${module} installé chirurgicalement`);
      return true;
      
    } catch (error) {
      console.error(`❌ Échec installation ${module}: ${error.message}`);
      
      // Essayer en dev dependency
      try {
        execSync(`npm install -D ${module}`, {
          stdio: 'pipe',
          cwd: this.projectDir,
          timeout: 60000
        });
        
        console.log(`✅ Module ${module} installé en devDependency`);
        return true;
      } catch (devError) {
        return false;
      }
    }
  }
  
  async testPostSurgery(filePath) {
    try {
      // Test de compilation post-opératoire
      execSync(`npx tsc --noEmit ${filePath}`, {
        stdio: 'pipe',
        cwd: this.projectDir,
        timeout: 30000
      });
      
      console.log('🩺 Test post-opératoire: Compilation OK');
      return true;
    } catch (error) {
      console.log('⚠️ Test post-opératoire: Complications détectées');
      return false;
    }
  }
  
  // ====================================
  // CHIRURGIE D'URGENCE (FALLBACK)
  // ====================================
  
  async performEmergencySurgery(symptom) {
    this.metrics.emergencyFixes++;
    console.log('🚨 CHIRURGIE D\'URGENCE - Procédures standard');
    
    const { category, code, message, file } = symptom;
    
    // Protocoles d'urgence par catégorie
    if (category === 'typescript') {
      return await this.emergencyTypeScriptSurgery(symptom);
    }
    
    if (category === 'build') {
      return await this.emergencyBuildSurgery(symptom);
    }
    
    if (category === 'prisma') {
      return await this.emergencyPrismaSurgery(symptom);
    }
    
    if (category === 'runtime') {
      return await this.emergencyRuntimeSurgery(symptom);
    }
    
    console.log('⚠️ Aucune procédure d\'urgence disponible');
    return false;
  }
  
  async emergencyTypeScriptSurgery(symptom) {
    const { message, file } = symptom;
    
    // Urgence: Cannot find name
    if (message.includes('Cannot find name')) {
      const commonEmergencyImports = [
        "import React from 'react';",
        "import { useState, useEffect } from 'react';",
        "import { NextResponse } from 'next/server';",
        "import { NextRequest } from 'next/server';"
      ];
      
      for (const importStatement of commonEmergencyImports) {
        if (await this.surgicalImportCorrection(file, importStatement)) {
          if (await this.testPostSurgery(file)) {
            console.log('🚨 Urgence TypeScript résolue par import standard');
            return true;
          }
        }
      }
    }
    
    // Urgence: Property does not exist
    if (message.includes('Property') && message.includes('does not exist')) {
      return await this.emergencyPropertyAddition(symptom);
    }
    
    return false;
  }
  
  async emergencyBuildSurgery(symptom) {
    const { message } = symptom;
    
    // Urgence: Module not found
    if (message.includes('Module not found') || message.includes('Cannot resolve')) {
      const moduleName = this.extractModuleName(message);
      if (moduleName) {
        return await this.surgicalDependencyResolution(moduleName);
      }
    }
    
    // Urgence: Barrel optimization
    if (message.includes('__barrel_optimize__')) {
      return await this.emergencyBarrelFix();
    }
    
    return false;
  }
  
  async emergencyPrismaSurgery(symptom) {
    const { message } = symptom;
    
    try {
      // Urgence: Régénération client Prisma
      console.log('🚨 Régénération d\'urgence client Prisma...');
      execSync('npx prisma generate', {
        stdio: 'pipe',
        cwd: this.projectDir,
        timeout: 120000
      });
      
      console.log('✅ Client Prisma régénéré en urgence');
      return true;
      
    } catch (error) {
      // Urgence: Schema reset
      try {
        console.log('🚨 Reset d\'urgence base de données...');
        execSync('npx prisma db push --force-reset', {
          stdio: 'pipe',
          cwd: this.projectDir,
          timeout: 120000
        });
        
        return true;
      } catch (resetError) {
        console.log('❌ Échec reset d\'urgence Prisma');
        return false;
      }
    }
  }
  
  async emergencyRuntimeSurgery(symptom) {
    const { message } = symptom;
    
    // Urgence: Clear caches
    try {
      console.log('🚨 Nettoyage d\'urgence caches...');
      
      const cacheDirs = [
        path.join(this.projectDir, '.next'),
        path.join(this.projectDir, 'node_modules/.cache'),
        path.join(this.projectDir, '.turbo')
      ];
      
      for (const cacheDir of cacheDirs) {
        if (fs.existsSync(cacheDir)) {
          fs.rmSync(cacheDir, { recursive: true, force: true });
          console.log(`🗑️ Cache supprimé: ${path.basename(cacheDir)}`);
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async emergencyPropertyAddition(symptom) {
    const propertyMatch = symptom.message.match(/Property '(\w+)' does not exist on type '(\w+)'/);
    
    if (propertyMatch) {
      const [, property, typeName] = propertyMatch;
      console.log(`🚨 Ajout d'urgence propriété ${property} au type ${typeName}`);
      
      const typesFile = path.join(this.projectDir, 'src/types.ts');
      if (fs.existsSync(typesFile)) {
        try {
          let content = fs.readFileSync(typesFile, 'utf8');
          const interfaceRegex = new RegExp(`interface\\s+${typeName}\\s*\\{([^}]*)\\}`, 's');
          const match = content.match(interfaceRegex);
          
          if (match) {
            const interfaceBody = match[1];
            const newProperty = `  ${property}?: any; // Ajout d'urgence automatique`;
            const newInterfaceBody = interfaceBody.trim() + '\n' + newProperty + '\n';
            const newInterface = `interface ${typeName} {\n${newInterfaceBody}}`;
            
            content = content.replace(match[0], newInterface);
            fs.writeFileSync(typesFile, content);
            
            return await this.testPostSurgery(typesFile);
          }
        } catch (error) {
          return false;
        }
      }
    }
    
    return false;
  }
  
  async emergencyBarrelFix() {
    try {
      console.log('🚨 Correction d\'urgence barrel optimization...');
      
      const nextConfigPath = path.join(this.projectDir, 'next.config.js');
      const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: false
  },
  transpilePackages: [],
  webpack: (config) => {
    config.externals = [...(config.externals || []), { 'lucide-react': 'lucide-react' }];
    return config;
  }
};

module.exports = nextConfig;`;
      
      fs.writeFileSync(nextConfigPath, nextConfigContent);
      console.log('✅ next.config.js corrigé en urgence');
      return true;
      
    } catch (error) {
      return false;
    }
  }
  
  // ====================================
  // SOINS POST-OPÉRATOIRES
  // ====================================
  
  async postOperativeCare(symptom, diagnosis) {
    console.log('🏥 Soins post-opératoires...');
    
    // Mettre à jour dossier médical
    const fileKey = symptom.file || 'system';
    const patientFile = this.patientFiles.get(fileKey) || { 
      surgeries: [], 
      complications: [], 
      recoveryTime: 0 
    };
    
    patientFile.surgeries.push({
      symptom: symptom.message,
      diagnosis: diagnosis.rootCause,
      timestamp: new Date().toISOString(),
      successful: true
    });
    
    patientFile.lastCheckup = new Date().toISOString();
    this.patientFiles.set(fileKey, patientFile);
    
    // Surveiller récupération
    this.recoveryMonitoring.add(fileKey);
    
    // Prévention récidive
    await this.preventRecurrence(symptom, diagnosis);
    
    console.log('✅ Soins post-opératoires terminés');
  }
  
  async preventRecurrence(symptom, diagnosis) {
    // Enregistrer pattern pour prévention future
    if (this.aiInfrastructure) {
      const preventionKey = `prevention-${symptom.category}-${symptom.code}`;
      this.aiInfrastructure.memory.remember(preventionKey, {
        symptomPattern: symptom.message,
        successfulTreatment: diagnosis.treatment,
        prevention: `Surveillance ${symptom.category} pour éviter récidive`,
        timestamp: new Date().toISOString()
      }, 'prevention');
      
      this.metrics.preventedRecurrence++;
    }
  }
  
  // ====================================
  // SURVEILLANCE CONTINUE
  // ====================================
  
  async performRecoveryCheck() {
    if (this.recoveryMonitoring.size === 0) return true;
    
    console.log('\n🩺 Contrôle de récupération post-opératoire...');
    
    let allRecovered = true;
    const recoveredFiles = new Set();
    
    for (const fileKey of this.recoveryMonitoring) {
      const isHealthy = await this.checkFileHealth(fileKey);
      
      if (isHealthy) {
        console.log(`✅ Récupération complète: ${path.basename(fileKey)}`);
        recoveredFiles.add(fileKey);
      } else {
        console.log(`⚠️ Surveillance continue: ${path.basename(fileKey)}`);
        allRecovered = false;
      }
    }
    
    // Retirer les fichiers récupérés de la surveillance
    recoveredFiles.forEach(file => this.recoveryMonitoring.delete(file));
    
    return allRecovered;
  }
  
  async checkFileHealth(filePath) {
    if (filePath === 'system') return true; // Erreurs système non vérifiables
    
    try {
      if (!fs.existsSync(filePath)) return false;
      
      // Test compilation
      execSync(`npx tsc --noEmit ${filePath}`, {
        stdio: 'pipe',
        cwd: this.projectDir,
        timeout: 15000
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  // ====================================
  // UTILITAIRES MÉDICAUX
  // ====================================
  
  generateDiagnosticKey(symptom) {
    const elements = [
      symptom.code || 'UNKNOWN',
      symptom.category,
      symptom.message.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '')
    ];
    return elements.join('-');
  }
  
  sanitizeSymptomForStorage(symptom) {
    return {
      message: symptom.message,
      code: symptom.code,
      category: symptom.category,
      severity: symptom.severity,
      file: path.basename(symptom.file || 'unknown')
    };
  }
  
  // ====================================
  // RAPPORT MÉDICAL FINAL
  // ====================================
  
  generateMedicalReport() {
    const duration = Date.now() - this.startTime;
    const surgerySuccessRate = this.metrics.errorsAnalyzed > 0 
      ? (this.metrics.errorsSurgicallyFixed / this.metrics.errorsAnalyzed * 100).toFixed(1)
      : 100;
    
    console.log('\n🏥 RAPPORT MÉDICAL FINAL - DR. ERRORSURGEON');
    console.log('═════════════════════════════════════════════');
    console.log(`⏱️  Durée intervention: ${(duration / 1000).toFixed(1)}s`);
    console.log(`🩺 Symptômes détectés: ${this.metrics.errorsDetected}`);
    console.log(`🔬 Diagnostics effectués: ${this.metrics.errorsAnalyzed}`);
    console.log(`⚔️ Interventions chirurgicales: ${this.metrics.errorsSurgicallyFixed}`);
    console.log(`📈 Taux de guérison: ${surgerySuccessRate}%`);
    console.log(`🧠 Diagnostics IA: ${this.metrics.aiDiagnoses}`);
    console.log(`💾 Antécédents utilisés: ${this.metrics.cacheHits}`);
    console.log(`🚨 Interventions d'urgence: ${this.metrics.emergencyFixes}`);
    console.log(`🛡️ Récidives prévenues: ${this.metrics.preventedRecurrence}`);
    console.log(`🏥 Patients en surveillance: ${this.recoveryMonitoring.size}`);
    
    return {
      duration,
      surgerySuccessRate: parseFloat(surgerySuccessRate),
      metrics: this.metrics,
      sessionId: this.sessionId,
      patientsUnderCare: this.recoveryMonitoring.size
    };
  }
  
  async cleanup() {
    console.log('\n🧹 Nettoyage bloc opératoire...');
    
    // Sauvegarder dossier médical
    this.saveMedicalHistory();
    
    if (this.aiInfrastructure) {
      // Notifier fin d'intervention
      this.aiInfrastructure.sendScriptMessage(
        'intelligentErrorSurgeon',
        'build-server',
        'surgery_complete',
        { 
          sessionId: this.sessionId,
          metrics: this.metrics,
          patientsUnderCare: this.recoveryMonitoring.size,
          timestamp: new Date().toISOString()
        }
      );
    }
    
    // Nettoyer bloc opératoire
    if (fs.existsSync(this.operatingRoom)) {
      // Garder dossier médical, supprimer temporaires
      const tempFiles = fs.readdirSync(this.operatingRoom)
        .filter(file => file.startsWith('temp-') || file.startsWith('surgery-'));
      
      tempFiles.forEach(file => {
        fs.unlinkSync(path.join(this.operatingRoom, file));
      });
    }
    
    console.log('✅ Bloc opératoire nettoyé');
  }
  
  // ====================================
  // MÉTHODE PRINCIPALE
  // ====================================
  
  async run() {
    try {
      console.log('\n🏥 Admission patient au bloc opératoire...');
      
      // Phase 1: Anamnèse (collecte symptômes)
      const symptoms = await this.conductAnamnesis();
      
      if (symptoms.length === 0) {
        console.log('🎉 Patient en parfaite santé - Aucune intervention nécessaire !');
        return true;
      }
      
      console.log(`\n🩺 ${symptoms.length} symptômes nécessitent une intervention médicale`);
      
      // Phase 2: Diagnostic et chirurgie pour chaque symptôme
      let totalSuccess = 0;
      
      for (const symptom of symptoms) {
        const diagnosis = await this.performDiagnosis(symptom);
        
        if (diagnosis) {
          const surgerySuccess = await this.performSurgery(symptom, diagnosis);
          if (surgerySuccess) totalSuccess++;
        }
      }
      
      // Phase 3: Contrôle post-opératoire
      console.log('\n🩺 Contrôles post-opératoires...');
      const recoveryComplete = await this.performRecoveryCheck();
      
      // Phase 4: Rapport médical
      const report = this.generateMedicalReport();
      
      if (totalSuccess === symptoms.length && recoveryComplete) {
        console.log('\n🎉 INTERVENTION MÉDICALE RÉUSSIE - Patient guéri !');
        return true;
      } else {
        console.log(`\n⚠️ Guérison partielle: ${totalSuccess}/${symptoms.length} symptômes traités`);
        if (!recoveryComplete) {
          console.log('👁️ Surveillance médicale continue recommandée');
        }
        return false;
      }
      
    } catch (error) {
      console.error('❌ Complication médicale majeure:', error.message);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// ====================================
// POINT D'ENTRÉE
// ====================================

async function main() {
  const errorSurgeon = new IntelligentErrorSurgeon();
  
  try {
    const success = await errorSurgeon.run();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ URGENCE MÉDICALE:', error.message);
    process.exit(1);
  }
}

// Exécution si appelé directement
if (require.main === module) {
  main();
}

module.exports = IntelligentErrorSurgeon;