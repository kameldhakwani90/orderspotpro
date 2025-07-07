#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { ClaudeAPI } = require('./ai-infrastructure.js');

/**
 * 🧠 INTELLIGENT PROJECT ANALYZER
 * Analyse globale du projet avec IA pour coordination optimale
 */
class IntelligentProjectAnalyzer {
  constructor() {
    this.claudeAPI = new ClaudeAPI();
    this.projectRoot = process.cwd();
    this.analysisResults = {
      architecture: {},
      problems: [],
      priorities: [],
      executionPlan: [],
      metrics: {}
    };
    this.startTime = Date.now();
  }

  /**
   * 🎯 ANALYSE GLOBALE COMPLÈTE
   */
  async analyzeProject() {
    console.log('🔍 Démarrage analyse globale du projet...');
    
    try {
      // 1. Scan complet codebase
      await this.scanCodebase();
      
      // 2. Cartographie architecture
      await this.mapArchitecture();
      
      // 3. Détection patterns et problèmes
      await this.detectPatterns();
      
      // 4. Priorisation IA
      await this.prioritizeWithAI();
      
      // 5. Plan coordination scripts
      await this.createExecutionPlan();
      
      // 6. Métriques projet
      await this.calculateMetrics();
      
      // 7. Sauvegarde résultats
      await this.saveAnalysis();
      
      console.log('✅ Analyse globale terminée !');
      return this.analysisResults;
      
    } catch (error) {
      console.error('❌ Erreur analyse globale:', error.message);
      throw error;
    }
  }

  /**
   * 📁 SCAN COMPLET CODEBASE
   */
  async scanCodebase() {
    console.log('  📂 Scan codebase...');
    
    const scanResults = {
      files: {
        typescript: [],
        javascript: [],
        react: [],
        config: [],
        data: []
      },
      structure: {},
      dependencies: {}
    };

    // Scan fichiers TypeScript/JavaScript
    const files = this.getAllFiles(this.projectRoot, ['.ts', '.tsx', '.js', '.jsx']);
    
    for (const file of files) {
      const relativePath = path.relative(this.projectRoot, file);
      const extension = path.extname(file);
      const content = fs.readFileSync(file, 'utf-8');
      
      // Catégorisation
      if (extension === '.ts') {
        scanResults.files.typescript.push({ path: relativePath, content, size: content.length });
      } else if (extension === '.tsx') {
        scanResults.files.react.push({ path: relativePath, content, size: content.length });
      } else if (extension === '.js' || extension === '.jsx') {
        scanResults.files.javascript.push({ path: relativePath, content, size: content.length });
      }
      
      // Détection fichiers critiques
      if (relativePath.includes('data.ts') || relativePath.includes('types.ts')) {
        scanResults.files.data.push({ path: relativePath, content, type: 'data' });
      }
      if (relativePath.includes('config') || relativePath.includes('.config.')) {
        scanResults.files.config.push({ path: relativePath, content, type: 'config' });
      }
    }

    // Structure du projet
    scanResults.structure = this.analyzeProjectStructure();
    
    // Dépendances
    scanResults.dependencies = this.analyzeDependencies();
    
    this.analysisResults.codebase = scanResults;
    
    console.log(`    ✓ ${files.length} fichiers analysés`);
    console.log(`    ✓ ${scanResults.files.typescript.length} fichiers TypeScript`);
    console.log(`    ✓ ${scanResults.files.react.length} composants React`);
    console.log(`    ✓ ${scanResults.files.data.length} fichiers de données`);
  }

  /**
   * 🏗️ CARTOGRAPHIE ARCHITECTURE
   */
  async mapArchitecture() {
    console.log('  🏗️ Cartographie architecture...');
    
    // Analyse avec IA
    const architecturePrompt = `
Analyse cette structure de projet Next.js/Firebase et cartographie l'architecture :

FICHIERS CRITIQUES:
${JSON.stringify(this.analysisResults.codebase.files.data, null, 2)}

STRUCTURE:
${JSON.stringify(this.analysisResults.codebase.structure, null, 2)}

DÉPENDANCES:
${JSON.stringify(this.analysisResults.codebase.dependencies, null, 2)}

Cartographie :
1. Architecture générale (pages, components, api, utils)
2. Modèles de données (interfaces, types)
3. Relations entre entités
4. Points d'intégration (API, DB, services)
5. Patterns architecturaux utilisés

Retourne JSON structuré avec cette cartographie.
`;

    const architectureAnalysis = await this.claudeAPI.optimizeCall(
      'architecture-mapping',
      architecturePrompt,
      'Tu es un architecte logiciel expert qui cartographie les projets Next.js/Firebase'
    );

    this.analysisResults.architecture = architectureAnalysis;
    console.log('    ✓ Architecture cartographiée');
  }

  /**
   * 🔍 DÉTECTION PATTERNS ET PROBLÈMES
   */
  async detectPatterns() {
    console.log('  🔍 Détection patterns et problèmes...');
    
    const patternPrompt = `
Analyse ce code pour détecter patterns et problèmes :

ARCHITECTURE:
${JSON.stringify(this.analysisResults.architecture, null, 2)}

FICHIERS TYPESCRIPT:
${this.analysisResults.codebase.files.typescript.slice(0, 5).map(f => 
  `${f.path}:\n${f.content.slice(0, 1000)}...`
).join('\n\n')}

Détecte :
1. Problèmes critiques (erreurs compilation, types manquants)
2. Problèmes de performance (imports non optimisés, re-renders)
3. Problèmes de sécurité (validations manquantes)
4. Anti-patterns (code dupliqué, couplage fort)
5. Opportunités d'amélioration

Classe par priorité : CRITIQUE, ÉLEVÉE, MOYENNE, FAIBLE
Retourne JSON avec problèmes classés.
`;

   const problemsAnalysis = await this.claudeAPI.optimizeCall(
      'problems-detection',
      patternPrompt,
      'Tu es un expert en qualité de code qui détecte tous les problèmes et patterns'
    );

    this.analysisResults.problems = problemsAnalysis;
    console.log(`    ✓ ${problemsAnalysis.length || 0} problèmes détectés`);
  }

  /**
   * 🎯 PRIORISATION IA
   */
  async prioritizeWithAI() {
    console.log('  🎯 Priorisation intelligente...');
    
    const priorityPrompt = `
Priorise ces problèmes pour optimiser l'exécution du pipeline :

PROBLÈMES DÉTECTÉS:
${JSON.stringify(this.analysisResults.problems, null, 2)}

ARCHITECTURE:
${JSON.stringify(this.analysisResults.architecture, null, 2)}

Crée un plan de priorisation :
1. Ordre optimal des corrections
2. Dépendances entre corrections
3. Impact/effort pour chaque problème
4. Groupement des corrections similaires
5. Risques de chaque intervention

Retourne plan JSON avec :
- priorities: [{id, title, impact, effort, risk, dependencies}]
- execution_order: [id1, id2, ...]
- grouping: {type1: [id1, id2], type2: [id3]}
`;

    const prioritization = await this.claudeAPI.optimizeCall(
      'problem-prioritization',
      priorityPrompt,
      'Tu es un chef de projet technique qui optimise l\'ordre des corrections'
    );

    this.analysisResults.priorities = prioritization;
    console.log('    ✓ Priorisation terminée');
  }

  /**
   * 📋 PLAN EXÉCUTION COORDINATION SCRIPTS
   */
  async createExecutionPlan() {
    console.log('  📋 Création plan exécution...');
    
    const planPrompt = `
Crée un plan d'exécution optimal pour ces scripts intelligents :

SCRIPTS DISPONIBLES:
- intelligentTypeFixer.js (corrections TypeScript)
- intelligentErrorSurgeon.js (résolution erreurs)
- intelligentBuildMaster.js (build optimisé)
- intelligentPerformanceOptimizer.js (optimisations)
- intelligentHooksArchitect.js (hooks optimaux)

PROBLÈMES PRIORISÉS:
${JSON.stringify(this.analysisResults.priorities, null, 2)}

ARCHITECTURE:
${JSON.stringify(this.analysisResults.architecture, null, 2)}

Plan d'exécution :
1. Ordre optimal des scripts
2. Paramètres pour chaque script
3. Communication inter-scripts
4. Points de validation
5. Fallbacks en cas d'échec

Retourne JSON avec plan détaillé.
`;

    const executionPlan = await this.claudeAPI.optimizeCall(
      'execution-planning',
      planPrompt,
      'Tu es un orchestrateur de pipeline qui optimise l\'exécution des scripts'
    );

    this.analysisResults.executionPlan = executionPlan;
    console.log('    ✓ Plan d\'exécution créé');
  }

  /**
   * 📊 CALCUL MÉTRIQUES PROJET
   */
  async calculateMetrics() {
    console.log('  📊 Calcul métriques...');
    
    const metrics = {
      codebase: {
        totalFiles: this.analysisResults.codebase.files.typescript.length + 
                   this.analysisResults.codebase.files.react.length + 
                   this.analysisResults.codebase.files.javascript.length,
        totalLines: this.calculateTotalLines(),
        complexity: this.calculateComplexity(),
        typescriptCoverage: this.calculateTypescriptCoverage()
      },
      architecture: {
        components: this.countComponents(),
        pages: this.countPages(),
        apiRoutes: this.countApiRoutes(),
        services: this.countServices()
      },
      quality: {
        criticalIssues: this.countIssuesByPriority('CRITIQUE'),
        highIssues: this.countIssuesByPriority('ÉLEVÉE'),
        mediumIssues: this.countIssuesByPriority('MOYENNE'),
        technicalDebt: this.calculateTechnicalDebt()
      },
      performance: {
        estimatedBuildTime: this.estimateBuildTime(),
        optimizationPotential: this.calculateOptimizationPotential(),
        bundleSize: this.estimateBundleSize()
      },
      timeline: {
        analysisTime: Date.now() - this.startTime,
        estimatedFixTime: this.estimateFixTime()
      }
    };

    this.analysisResults.metrics = metrics;
    console.log('    ✓ Métriques calculées');
  }

  /**
   * 💾 SAUVEGARDE ANALYSE
   */
  async saveAnalysis() {
    console.log('  💾 Sauvegarde analyse...');
    
    try {
      const memoryPath = path.join(process.cwd(), 'data', 'ai-memory');
      if (!fs.existsSync(memoryPath)) {
        fs.mkdirSync(memoryPath, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const analysisFile = path.join(memoryPath, `project-analysis-${timestamp}.json`);
      
      // Sauvegarde complète
      fs.writeFileSync(analysisFile, JSON.stringify(this.analysisResults, null, 2));
      
      // Sauvegarde résumé pour autres scripts
      const summaryFile = path.join(memoryPath, 'latest-analysis.json');
      const summary = {
        timestamp: Date.now(),
        executionPlan: this.analysisResults.executionPlan,
        priorities: this.analysisResults.priorities,
        metrics: this.analysisResults.metrics,
        architecture: this.analysisResults.architecture
      };
      fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
      
      console.log(`    ✓ Analyse sauvegardée : ${analysisFile}`);
      console.log(`    ✓ Résumé disponible : ${summaryFile}`);
      
    } catch (error) {
      console.warn(`    ⚠️ Erreur sauvegarde : ${error.message}`);
    }
  }

  /**
   * 🔧 MÉTHODES UTILITAIRES
   */
  getAllFiles(dir, extensions) {
    let files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && !item.startsWith('node_modules')) {
        files = files.concat(this.getAllFiles(fullPath, extensions));
      } else if (stat.isFile() && extensions.includes(path.extname(item))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  analyzeProjectStructure() {
    const structure = {
      hasPages: fs.existsSync(path.join(this.projectRoot, 'pages')),
      hasApp: fs.existsSync(path.join(this.projectRoot, 'app')),
      hasComponents: fs.existsSync(path.join(this.projectRoot, 'components')),
      hasApi: fs.existsSync(path.join(this.projectRoot, 'pages', 'api')) || 
              fs.existsSync(path.join(this.projectRoot, 'app', 'api')),
      hasUtils: fs.existsSync(path.join(this.projectRoot, 'utils')),
      hasLib: fs.existsSync(path.join(this.projectRoot, 'lib')),
      hasTypes: fs.existsSync(path.join(this.projectRoot, 'types')),
      hasData: fs.existsSync(path.join(this.projectRoot, 'data'))
    };
    
    return structure;
  }

  analyzeDependencies() {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        return {
          dependencies: Object.keys(packageJson.dependencies || {}),
          devDependencies: Object.keys(packageJson.devDependencies || {}),
          scripts: Object.keys(packageJson.scripts || {})
        };
      }
    } catch (error) {
      console.warn('    ⚠️ Erreur lecture package.json');
    }
    return { dependencies: [], devDependencies: [], scripts: [] };
  }

  calculateTotalLines() {
    let totalLines = 0;
    const allFiles = [
      ...this.analysisResults.codebase.files.typescript,
      ...this.analysisResults.codebase.files.react,
      ...this.analysisResults.codebase.files.javascript
    ];
    
    for (const file of allFiles) {
      totalLines += (file.content.match(/\n/g) || []).length + 1;
    }
    
    return totalLines;
  }

  calculateComplexity() {
    // Calcul simplifié de complexité basé sur nombre de fichiers et taille
    const fileCount = this.analysisResults.codebase.files.typescript.length + 
                     this.analysisResults.codebase.files.react.length;
    const avgFileSize = this.calculateTotalLines() / Math.max(fileCount, 1);
    
    if (fileCount > 100 || avgFileSize > 500) return 'ÉLEVÉE';
    if (fileCount > 50 || avgFileSize > 200) return 'MOYENNE';
    return 'FAIBLE';
  }

  calculateTypescriptCoverage() {
    const tsFiles = this.analysisResults.codebase.files.typescript.length + 
                   this.analysisResults.codebase.files.react.length;
    const jsFiles = this.analysisResults.codebase.files.javascript.length;
    const total = tsFiles + jsFiles;
    
    return total > 0 ? Math.round((tsFiles / total) * 100) : 0;
  }

  countComponents() {
    return this.analysisResults.codebase.files.react.filter(f => 
      f.path.includes('components') || f.path.includes('Component')
    ).length;
  }

  countPages() {
    return this.analysisResults.codebase.files.react.filter(f => 
      f.path.includes('pages') || f.path.includes('app')
    ).length;
  }

  countApiRoutes() {
    return this.analysisResults.codebase.files.typescript.filter(f => 
      f.path.includes('api')
    ).length;
  }

  countServices() {
    return this.analysisResults.codebase.files.typescript.filter(f => 
      f.path.includes('service') || f.path.includes('Service')
    ).length;
  }

  countIssuesByPriority(priority) {
    if (!this.analysisResults.problems || !Array.isArray(this.analysisResults.problems)) {
      return 0;
    }
    return this.analysisResults.problems.filter(p => p.priority === priority).length;
  }

  calculateTechnicalDebt() {
    const criticalCount = this.countIssuesByPriority('CRITIQUE');
    const highCount = this.countIssuesByPriority('ÉLEVÉE');
    const mediumCount = this.countIssuesByPriority('MOYENNE');
    
    // Score de dette technique (0-100)
    const score = (criticalCount * 10) + (highCount * 5) + (mediumCount * 2);
    
    if (score > 50) return 'ÉLEVÉE';
    if (score > 20) return 'MOYENNE';
    return 'FAIBLE';
  }

  estimateBuildTime() {
    const fileCount = this.calculateTotalLines();
    // Estimation basée sur la taille du projet
    return Math.max(30, Math.round(fileCount / 100)); // secondes
  }

  calculateOptimizationPotential() {
    const issueCount = this.countIssuesByPriority('CRITIQUE') + 
                      this.countIssuesByPriority('ÉLEVÉE');
    
    if (issueCount > 10) return 'ÉLEVÉ';
    if (issueCount > 5) return 'MOYEN';
    return 'FAIBLE';
  }

  estimateBundleSize() {
    const dependencies = this.analysisResults.codebase?.dependencies?.dependencies || [];
    const fileCount = this.calculateTotalLines();
    
    // Estimation simple basée sur les dépendances et taille
    return Math.round((dependencies.length * 50) + (fileCount / 10)); // KB
  }

  estimateFixTime() {
    const criticalCount = this.countIssuesByPriority('CRITIQUE');
    const highCount = this.countIssuesByPriority('ÉLEVÉE');
    const mediumCount = this.countIssuesByPriority('MOYENNE');
    
    // Estimation en minutes
    return (criticalCount * 5) + (highCount * 3) + (mediumCount * 1);
  }

  /**
   * 📊 RAPPORT FINAL
   */
  generateReport() {
    console.log('\n📊 RAPPORT ANALYSE GLOBALE');
    console.log('=====================================');
    
    const metrics = this.analysisResults.metrics;
    
    console.log(`📁 CODEBASE:`);
    console.log(`   • ${metrics.codebase.totalFiles} fichiers`);
    console.log(`   • ${metrics.codebase.totalLines} lignes`);
    console.log(`   • Complexité: ${metrics.codebase.complexity}`);
    console.log(`   • TypeScript: ${metrics.codebase.typescriptCoverage}%`);
    
    console.log(`\n🏗️ ARCHITECTURE:`);
    console.log(`   • ${metrics.architecture.components} composants`);
    console.log(`   • ${metrics.architecture.pages} pages`);
    console.log(`   • ${metrics.architecture.apiRoutes} routes API`);
    console.log(`   • ${metrics.architecture.services} services`);
    
    console.log(`\n🔍 QUALITÉ:`);
    console.log(`   • ${metrics.quality.criticalIssues} problèmes critiques`);
    console.log(`   • ${metrics.quality.highIssues} problèmes élevés`);
    console.log(`   • ${metrics.quality.mediumIssues} problèmes moyens`);
    console.log(`   • Dette technique: ${metrics.quality.technicalDebt}`);
    
    console.log(`\n⚡ PERFORMANCE:`);
    console.log(`   • Build estimé: ${metrics.performance.estimatedBuildTime}s`);
    console.log(`   • Potentiel optimisation: ${metrics.performance.optimizationPotential}`);
    console.log(`   • Bundle estimé: ${metrics.performance.bundleSize}KB`);
    
    console.log(`\n⏱️ TIMELINE:`);
    console.log(`   • Analyse: ${Math.round(metrics.timeline.analysisTime / 1000)}s`);
    console.log(`   • Corrections estimées: ${metrics.timeline.estimatedFixTime}min`);
    
    console.log('\n✅ ANALYSE TERMINÉE - Coordination optimisée !');
  }
}

/**
 * 🚀 EXÉCUTION SI SCRIPT DIRECT
 */
if (require.main === module) {
  const analyzer = new IntelligentProjectAnalyzer();
  
  analyzer.analyzeProject()
    .then(results => {
      analyzer.generateReport();
      
      // Communication avec build-server
      process.stdout.write(JSON.stringify({
        success: true,
        executionPlan: results.executionPlan,
        priorities: results.priorities,
        metrics: results.metrics
      }));
      
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ ÉCHEC ANALYSE GLOBALE:', error.message);
      
      process.stdout.write(JSON.stringify({
        success: false,
        error: error.message,
        fallback: true
      }));
      
      process.exit(1);
    });
}

module.exports = { IntelligentProjectAnalyzer };