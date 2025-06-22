const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 ANALYSE INTELLIGENTE - Trouver la vraie cause du problème\n');

class RootCauseAnalyzer {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.srcDir = path.join(this.rootDir, 'src');
    this.problematicFiles = [];
  }

  // ====================================
  // 1. IDENTIFIER QUAND LE PROBLÈME APPARAÎT
  // ====================================
  
  findWhenProblemStarts() {
    console.log('📊 1. Identification du moment où le problème apparaît...');
    
    // Vérifier si les fichiers ont __barrel_optimize__ AVANT les scripts
    const checkBeforeScripts = () => {
      try {
        const result = execSync(
          `grep -r "__barrel_optimize__" ${this.srcDir} --include="*.tsx" --include="*.ts" || echo "CLEAN"`,
          { encoding: 'utf-8' }
        );
        return result.trim() !== 'CLEAN';
      } catch (e) {
        return false;
      }
    };
    
    const hasBarrelBefore = checkBeforeScripts();
    console.log(`  ▶️ __barrel_optimize__ présent AVANT les scripts: ${hasBarrelBefore ? '❌ OUI' : '✅ NON'}`);
    
    if (!hasBarrelBefore) {
      console.log('  🎯 Le problème est CRÉÉ par nos scripts !');
      return 'created_by_scripts';
    } else {
      console.log('  🎯 Le problème existe déjà dans le code source');
      return 'exists_in_source';
    }
  }

  // ====================================
  // 2. ANALYSER QUEL SCRIPT CAUSE LE PROBLÈME
  // ====================================
  
  analyzeScriptImpact() {
    console.log('\n📊 2. Analyse de l\'impact des scripts...');
    
    const scripts = [
      'generateCompleteSystem.js',
      'migrateComponentsToHooks.js',
      'migrateDataToPrisma.js',
      'generateReactHooks.js',
      'generateApiRoutes.js'
    ];
    
    scripts.forEach(script => {
      const scriptPath = path.join(this.rootDir, 'tools', script);
      if (!fs.existsSync(scriptPath)) {
        console.log(`  ⏭️ ${script} - Non trouvé`);
        return;
      }
      
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Vérifier si le script modifie des imports
      const modifiesImports = 
        content.includes('import {') || 
        content.includes('from \'') ||
        content.includes('from "') ||
        content.includes('.replace(');
      
      // Vérifier si le script touche aux fichiers TSX
      const modifiesTSX = 
        content.includes('.tsx') ||
        content.includes('transformFileContent') ||
        content.includes('fixFile');
      
      if (modifiesImports && modifiesTSX) {
        console.log(`  ⚠️ ${script} - MODIFIE les imports dans les TSX !`);
        this.analyzeScriptSpecifically(scriptPath, script);
      } else {
        console.log(`  ✅ ${script} - Ne modifie pas les imports`);
      }
    });
  }

  analyzeScriptSpecifically(scriptPath, scriptName) {
    const content = fs.readFileSync(scriptPath, 'utf-8');
    
    // Chercher les transformations d'imports
    if (scriptName === 'migrateComponentsToHooks.js') {
      console.log(`    🔍 Analyse détaillée de ${scriptName}:`);
      
      // Ce script remplace les imports prisma-service par des hooks
      if (content.includes('prisma-service') && content.includes('@/hooks')) {
        console.log('    ❗ Ce script remplace les imports prisma → hooks');
        console.log('    ❗ Peut déclencher la ré-optimisation Next.js');
      }
    }
  }

  // ====================================
  // 3. CRÉER UN FIX INTELLIGENT
  // ====================================
  
  createIntelligentFix() {
    console.log('\n📊 3. Création d\'un fix intelligent...');
    
    const fixPath = path.join(this.rootDir, 'tools', 'intelligentLucideFix.js');
    
    const fixContent = `const fs = require('fs');
const path = require('path');

console.log('🔧 Fix intelligent lucide-react - Version définitive');

// Ce fix doit s'exécuter APRÈS TOUS les autres scripts
// mais AVANT le build Next.js

const srcDir = path.join(__dirname, '../src');

function fixLucideImports() {
  console.log('🔍 Recherche et correction des imports lucide-react...');
  
  let fixedCount = 0;
  
  const scanDir = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !['node_modules', '.git', '.next'].includes(entry.name)) {
        scanDir(fullPath);
      } else if (entry.isFile() && /\\.(tsx?|jsx?)$/.test(entry.name)) {
        let content = fs.readFileSync(fullPath, 'utf-8');
        const originalContent = content;
        
        // IMPORTANT: Ne PAS toucher aux autres imports !
        // Seulement corriger lucide-react
        
        // Pattern spécifique pour lucide-react avec barrel optimize
        const lucideBarrelPattern = /from\\s+["']__barrel_optimize__[^"']*lucide-react["']/g;
        
        if (lucideBarrelPattern.test(content)) {
          // Remplacer UNIQUEMENT la partie from
          content = content.replace(lucideBarrelPattern, 'from "lucide-react"');
          
          // Double vérification ligne par ligne
          const lines = content.split('\\n');
          const fixedLines = lines.map(line => {
            if (line.includes('__barrel_optimize__') && line.includes('lucide-react')) {
              // Garder les imports mais changer seulement la source
              return line.replace(/__barrel_optimize__[^"']+/, 'lucide-react');
            }
            return line;
          });
          
          content = fixedLines.join('\\n');
        }
        
        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content);
          fixedCount++;
          console.log(\`  ✅ Corrigé: \${path.relative(srcDir, fullPath)}\`);
        }
      }
    });
  };
  
  scanDir(srcDir);
  console.log(\`\\n✅ \${fixedCount} fichier(s) corrigé(s)\`);
}

// Configuration Next.js pour désactiver l'optimisation
function updateNextConfig() {
  console.log('\\n🔧 Mise à jour next.config.js...');
  
  const configPath = path.join(__dirname, '../next.config.js');
  const configContent = \`/** @type {import('next').NextConfig} */
const nextConfig = {
  // Désactiver l'optimisation des barrels
  experimental: {
    optimizePackageImports: []
  },
  
  // Webpack config pour éviter la ré-optimisation
  webpack: (config) => {
    config.module.rules.push({
      test: /lucide-react/,
      sideEffects: false
    });
    return config;
  }
}

module.exports = nextConfig\`;
  
  fs.writeFileSync(configPath, configContent);
  console.log('  ✅ next.config.js mis à jour');
}

// Exécution
fixLucideImports();
updateNextConfig();

console.log('\\n✅ Fix intelligent terminé !');
`;

    fs.writeFileSync(fixPath, fixContent);
    console.log('  ✅ Script de fix intelligent créé');
    
    return fixPath;
  }

  // ====================================
  // 4. RECOMMANDATIONS
  // ====================================
  
  generateRecommendations() {
    console.log('\n📊 4. Recommandations pour build-server.js:');
    
    console.log(`
  1. Ajouter le fix APRÈS tous les scripts de migration:
     - Après migrateComponentsToHooks.js
     - Après tous les correcteurs
     - JUSTE AVANT npm run build
  
  2. Ordre recommandé:
     PHASE 1: Génération système
     PHASE 2: Validation
     PHASE 3: Configuration DB
     PHASE 4: Corrections (exports, types, etc.)
     PHASE 4.8: run("node tools/intelligentLucideFix.js", "Fix final lucide-react")
     PHASE 5: Build
  
  3. Le fix doit:
     - Corriger SEULEMENT lucide-react
     - NE PAS toucher aux autres imports
     - Désactiver l'optimisation dans next.config.js
`);
  }

  // ====================================
  // EXÉCUTION PRINCIPALE
  // ====================================
  
  analyze() {
    console.log('🚀 Analyse complète du problème lucide-react\n');
    
    // 1. Identifier quand le problème apparaît
    const problemOrigin = this.findWhenProblemStarts();
    
    // 2. Analyser l'impact des scripts
    this.analyzeScriptImpact();
    
    // 3. Créer le fix
    this.createIntelligentFix();
    
    // 4. Recommandations
    this.generateRecommendations();
    
    console.log('\n✅ Analyse terminée !');
    console.log('🎯 Le script intelligentLucideFix.js a été créé');
    console.log('📝 Ajoutez-le dans build-server.js comme indiqué');
  }
}

// Exécution
const analyzer = new RootCauseAnalyzer();
analyzer.analyze();
