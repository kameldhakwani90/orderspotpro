const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 BUILD INTELLIGENT - Corrections automatiques en parallèle');

class SmartBuildWithFix {
  constructor() {
    this.maxRetries = 3;
    this.currentRetry = 0;
    this.fixedFiles = new Set(); // Éviter les corrections en boucle
    this.srcDir = path.join(process.cwd(), 'src');
  }

  // ====================================
  // CORRECTIONS RAPIDES
  // ====================================
  
  quickFixBarrelOptimize(errorLine) {
    const fileMatch = errorLine.match(/\.\/src\/(.+\.tsx?)/);
    if (!fileMatch) return false;

    const filePath = path.join(this.srcDir, fileMatch[1]);
    if (!fs.existsSync(filePath) || this.fixedFiles.has(filePath)) return false;

    console.log(`  🔧 Correction barrel: ${fileMatch[1]}`);
    
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Fix __barrel_optimize__
    content = content.replace(
      /"__barrel_optimize__\?names=[^"]+!=!lucide-react"/g, 
      '"lucide-react"'
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      this.fixedFiles.add(filePath);
      console.log(`    ✅ Barrel corrigé dans ${fileMatch[1]}`);
      return true;
    }
    
    return false;
  }

  quickFixIdentifierConflict(errorLine) {
    const identifierMatch = errorLine.match(/Identifier '(\w+)' has already been declared/);
    const fileMatch = errorLine.match(/\.\/src\/(.+\.tsx?)/);
    
    if (!identifierMatch || !fileMatch) return false;

    const identifier = identifierMatch[1];
    const filePath = path.join(this.srcDir, fileMatch[1]);
    
    if (!fs.existsSync(filePath) || this.fixedFiles.has(filePath)) return false;

    console.log(`  🔧 Correction conflit ${identifier}: ${fileMatch[1]}`);
    
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;
    
    // Trouver les imports en conflit et les aliaser
    let conflictCount = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('import') && lines[i].includes(identifier)) {
        if (conflictCount > 0) {
          const alias = `${identifier}${conflictCount + 1}`;
          lines[i] = lines[i].replace(
            new RegExp(`\\b${identifier}\\b`),
            `${identifier} as ${alias}`
          );
          
          // Remplacer les utilisations
          for (let j = i + 1; j < lines.length; j++) {
            if (!lines[j].includes('import')) {
              lines[j] = lines[j].replace(
                new RegExp(`\\b${identifier}\\b`, 'g'),
                alias
              );
            }
          }
          
          modified = true;
          console.log(`    ✅ ${identifier} → ${alias}`);
        }
        conflictCount++;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
      this.fixedFiles.add(filePath);
      return true;
    }
    
    return false;
  }

  // ====================================
  // BUILD AVEC MONITORING
  // ====================================
  
  async attemptBuild() {
    return new Promise((resolve) => {
      console.log(`\n🔨 Tentative de build ${this.currentRetry + 1}/${this.maxRetries}...`);
      
      const buildProcess = spawn('npm', ['run', 'build'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      let stdout = '';
      let stderr = '';
      let hasErrors = false;
      let fixesApplied = 0;

      // Monitorer la sortie en temps réel
      buildProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output); // Afficher en temps réel
      });

      buildProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        
        // Analyser et corriger les erreurs à la volée
        const lines = output.split('\n');
        lines.forEach(line => {
          if (line.includes('__barrel_optimize__')) {
            if (this.quickFixBarrelOptimize(line)) {
              fixesApplied++;
            }
          }
          
          if (line.includes('has already been declared')) {
            if (this.quickFixIdentifierConflict(line)) {
              fixesApplied++;
            }
          }
        });
        
        if (output.includes('Failed to compile') || output.includes('Build failed')) {
          hasErrors = true;
        }
        
        process.stderr.write(output); // Afficher en temps réel
      });

      buildProcess.on('close', (code) => {
        resolve({
          success: code === 0,
          hasErrors,
          fixesApplied,
          stdout,
          stderr
        });
      });

      buildProcess.on('error', (error) => {
        console.error('❌ Erreur processus build:', error.message);
        resolve({
          success: false,
          hasErrors: true,
          fixesApplied,
          error: error.message
        });
      });
    });
  }

  // ====================================
  // CORRECTIONS POST-BUILD
  // ====================================
  
  analyzeAndFixBuildErrors(stderr) {
    console.log('\n🔍 Analyse des erreurs de build...');
    
    let totalFixes = 0;
    const lines = stderr.split('\n');
    
    // Créer next.config.js anti-barrel s'il n'existe pas
    if (stderr.includes('__barrel_optimize__')) {
      
      totalFixes++;
    }
    
    // Analyser chaque ligne d'erreur
    lines.forEach(line => {
      if (line.includes('__barrel_optimize__')) {
        if (this.quickFixBarrelOptimize(line)) totalFixes++;
      }
      
      if (line.includes('has already been declared')) {
        if (this.quickFixIdentifierConflict(line)) totalFixes++;
      }
    });
    
    return totalFixes;
  }

// ====================================
// CORRECTION POUR NEXT.JS 15.2.3
// ====================================

createAntiBarrelConfig() {
  const configPath = path.join(process.cwd(), 'next.config.js');
  
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf-8');
    
    // CORRECTION: Vérifier si config VALIDE existe (pas juste présente)
    if (content.includes('optimizePackageImports: []') && 
        !content.includes('appDir: true') &&
        !content.includes('optimizePackageImports: false')) {
      console.log('  ✅ next.config.js valide déjà présent');
      return; // Config valide trouvée
    }
  }
  
  console.log('  🔧 Création next.config.js compatible Next.js 15...');
  
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // CORRECTION: Array vide au lieu de false pour Next.js 15
    optimizePackageImports: [],
    // SUPPRIMÉ: appDir obsolète dans Next.js 15
  },
  
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'lucide-react': require.resolve('lucide-react')
    };
    
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /__barrel_optimize__/ }
    ];
    
    return config;
  },
  
  typescript: {
    ignoreBuildErrors: false
  }
}

module.exports = nextConfig`;

  fs.writeFileSync(configPath, nextConfig);
  console.log('    ✅ next.config.js compatible Next.js 15 créé');
}

  // ====================================
  // BOUCLE PRINCIPALE
  // ====================================
  
  async smartBuild() {
    console.log('🚀 Démarrage du build intelligent...\n');
    
    while (this.currentRetry < this.maxRetries) {
      const result = await this.attemptBuild();
      
      if (result.success) {
        console.log('\n🎉 BUILD RÉUSSI !');
        console.log(`📊 ${this.fixedFiles.size} fichier(s) corrigé(s) au total`);
        return true;
      }
      
      console.log(`\n❌ Build échoué (tentative ${this.currentRetry + 1})`);
      
      if (this.currentRetry >= this.maxRetries - 1) {
        console.log('❌ Nombre maximum de tentatives atteint');
        break;
      }
      
      // Analyser et corriger les erreurs
      const additionalFixes = this.analyzeAndFixBuildErrors(result.stderr);
      const totalFixes = result.fixesApplied + additionalFixes;
      
      if (totalFixes === 0) {
        console.log('⚠️ Aucune correction appliquée, arrêt des tentatives');
        break;
      }
      
      console.log(`✅ ${totalFixes} correction(s) appliquée(s)`);
      console.log('🔄 Nouvelle tentative de build...');
      
      this.currentRetry++;
    }
    
    console.log('\n❌ BUILD FINAL ÉCHOUÉ');
    console.log(`📊 ${this.fixedFiles.size} fichier(s) corrigé(s) au total`);
    console.log('💡 Vérifiez les erreurs restantes manuellement');
    
    return false;
  }
}

// ====================================
// EXÉCUTION
// ====================================

if (require.main === module) {
  const smartBuilder = new SmartBuildWithFix();
  smartBuilder.smartBuild().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = SmartBuildWithFix;