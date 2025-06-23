const fs = require('fs');
const path = require('path');

console.log('🔧 CORRECTEUR AUTOMATIQUE - Erreurs Build Next.js');
console.log('================================================');

class NextJsBuildErrorsFixer {
  constructor() {
    this.srcDir = path.join(process.cwd(), 'src');
    this.fixedFiles = 0;
    this.errors = [];
  }

  // ====================================
  // 1. FIX __barrel_optimize__ LUCIDE
  // ====================================
  
  fixBarrelOptimizeImports(content, filePath) {
    let hasChanges = false;
    let newContent = content;
    
    // Pattern 1: __barrel_optimize__?names=...!=!lucide-react
    const barrelPattern = /"__barrel_optimize__\?names=[^"]+!=!lucide-react"/g;
    if (barrelPattern.test(newContent)) {
      newContent = newContent.replace(barrelPattern, '"lucide-react"');
      hasChanges = true;
      console.log(`  🔧 Corrigé __barrel_optimize__ dans ${path.basename(filePath)}`);
    }
    
    // Pattern 2: avec guillemets simples
    const barrelPatternSingle = /'__barrel_optimize__\?names=[^']+!=!lucide-react'/g;
    if (barrelPatternSingle.test(newContent)) {
      newContent = newContent.replace(barrelPatternSingle, "'lucide-react'");
      hasChanges = true;
      console.log(`  🔧 Corrigé __barrel_optimize__ (simple quotes) dans ${path.basename(filePath)}`);
    }
    
    return { content: newContent, hasChanges };
  }

  // ====================================
  // 2. FIX DUPLICATE IDENTIFIERS
  // ====================================
  
  fixDuplicateImports(content, filePath) {
    let hasChanges = false;
    let newContent = content;
    
    // Détecter les imports de Dialog qui causent des conflits
    const dialogImportPattern = /import\s*\{\s*([^}]*Dialog[^}]*)\s*\}\s*from\s*["']@\/components\/ui\/dialog["'];/g;
    const matches = [];
    let match;
    
    while ((match = dialogImportPattern.exec(content)) !== null) {
      matches.push({
        fullMatch: match[0],
        imports: match[1],
        index: match.index
      });
    }
    
    if (matches.length > 1) {
      console.log(`  ⚠️  Détection de ${matches.length} imports Dialog dans ${path.basename(filePath)}`);
      
      // Fusionner tous les imports Dialog en un seul
      const allDialogImports = new Set();
      matches.forEach(m => {
        const imports = m.imports.split(',').map(i => i.trim()).filter(i => i);
        imports.forEach(imp => allDialogImports.add(imp));
      });
      
      // Supprimer tous les imports Dialog
      matches.forEach(m => {
        newContent = newContent.replace(m.fullMatch, '');
      });
      
      // Ajouter un seul import Dialog fusionné au début
      const mergedImport = `import { ${Array.from(allDialogImports).join(', ')} } from "@/components/ui/dialog";`;
      
      // Trouver où insérer (après 'use client' ou autres imports)
      const firstImportMatch = newContent.match(/^import\s/m);
      if (firstImportMatch) {
        const insertPos = firstImportMatch.index;
        newContent = newContent.slice(0, insertPos) + mergedImport + '\n' + newContent.slice(insertPos);
      } else {
        newContent = mergedImport + '\n' + newContent;
      }
      
      hasChanges = true;
      console.log(`  ✅ Fusionné ${matches.length} imports Dialog en 1 seul`);
    }
    
    return { content: newContent, hasChanges };
  }

  // ====================================
  // 3. FIX LUCIDE ICONS CONFLICTS
  // ====================================
  
  fixLucideIconConflicts(content, filePath) {
    let hasChanges = false;
    let newContent = content;
    
    // Rechercher les imports lucide-react multiples ou problématiques
    const lucideImportPattern = /import\s*\{\s*([^}]+)\s*\}\s*from\s*["']lucide-react["'];/g;
    const lucideMatches = [];
    let match;
    
    while ((match = lucideImportPattern.exec(content)) !== null) {
      lucideMatches.push({
        fullMatch: match[0],
        imports: match[1],
        index: match.index
      });
    }
    
    if (lucideMatches.length > 1) {
      console.log(`  🔧 Fusion de ${lucideMatches.length} imports lucide-react`);
      
      const allLucideImports = new Set();
      lucideMatches.forEach(m => {
        const imports = m.imports.split(',').map(i => i.trim()).filter(i => i);
        imports.forEach(imp => {
          // Nettoyer les alias (User as UserIcon)
          const cleanImport = imp.includes(' as ') ? imp : imp;
          allLucideImports.add(cleanImport);
        });
      });
      
      // Supprimer tous les imports lucide
      lucideMatches.forEach(m => {
        newContent = newContent.replace(m.fullMatch, '');
      });
      
      // Diviser en chunks de 10 pour éviter les lignes trop longues
      const importsArray = Array.from(allLucideImports);
      const chunks = [];
      for (let i = 0; i < importsArray.length; i += 10) {
        chunks.push(importsArray.slice(i, i + 10));
      }
      
      // Créer les imports
      const importLines = chunks.map(chunk => 
        `import { ${chunk.join(', ')} } from "lucide-react";`
      ).join('\n');
      
      // Insérer au bon endroit
      const firstImportMatch = newContent.match(/^import\s/m);
      if (firstImportMatch) {
        const insertPos = firstImportMatch.index;
        newContent = newContent.slice(0, insertPos) + importLines + '\n' + newContent.slice(insertPos);
      } else {
        newContent = importLines + '\n' + newContent;
      }
      
      hasChanges = true;
      console.log(`  ✅ Fusionné en ${chunks.length} import(s) lucide-react`);
    }
    
    return { content: newContent, hasChanges };
  }

  // ====================================
  // 4. FIX NEXT.JS CONFIG
  // ====================================
  
  createFixedNextConfig() {
    console.log('📝 Création next.config.js anti-barrel...');
    
    const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // DÉSACTIVER complètement barrel optimization
    optimizePackageImports: false
  },
  
  webpack: (config, { isServer }) => {
    // Configuration spéciale pour lucide-react
    config.resolve.alias = {
      ...config.resolve.alias,
      'lucide-react': require.resolve('lucide-react')
    };
    
    // Ignorer les warnings barrel
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /__barrel_optimize__/ },
      { module: /lucide-react/ }
    ];
    
    // Désactiver les transformations SWC problématiques
    config.module.rules.push({
      test: /node_modules\\/lucide-react/,
      type: 'javascript/auto'
    });
    
    return config;
  },
  
  typescript: {
    ignoreBuildErrors: false
  },
  
  // Désactiver l'optimisation des packages
  transpilePackages: [],
  
  // Configuration SWC
  swcMinify: true,
  
  compiler: {
    // Désactiver les optimisations qui causent des problèmes
    removeConsole: false
  }
}

module.exports = nextConfig`;

    fs.writeFileSync('next.config.js', nextConfigContent);
    console.log('✅ next.config.js anti-barrel créé');
  }

  // ====================================
  // 5. TRAITEMENT RÉCURSIF
  // ====================================
  
  processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      let newContent = content;
      let totalChanges = false;
      
      // 1. Fix barrel optimize
      const result1 = this.fixBarrelOptimizeImports(newContent, filePath);
      if (result1.hasChanges) {
        newContent = result1.content;
        totalChanges = true;
      }
      
      // 2. Fix duplicate imports
      const result2 = this.fixDuplicateImports(newContent, filePath);
      if (result2.hasChanges) {
        newContent = result2.content;
        totalChanges = true;
      }
      
      // 3. Fix lucide conflicts
      const result3 = this.fixLucideIconConflicts(newContent, filePath);
      if (result3.hasChanges) {
        newContent = result3.content;
        totalChanges = true;
      }
      
      // Sauvegarder si des changements
      if (totalChanges) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        this.fixedFiles++;
        console.log(`✅ Corrigé: ${path.relative(this.srcDir, filePath)}`);
      }
      
    } catch (error) {
      console.error(`❌ Erreur ${filePath}: ${error.message}`);
      this.errors.push({ file: filePath, error: error.message });
    }
  }
  
  processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (!['node_modules', '.git', '.next', 'dist'].includes(entry.name)) {
          this.processDirectory(fullPath);
        }
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
        this.processFile(fullPath);
      }
    });
  }

  // ====================================
  // 6. EXÉCUTION PRINCIPALE
  // ====================================
  
  fixAllBuildErrors() {
    console.log('🚀 Correction automatique des erreurs de build Next.js...\n');
    
    // 1. Corriger next.config.js
    this.createFixedNextConfig();
    
    // 2. Scanner et corriger tous les fichiers
    console.log('🔍 Scan et correction des fichiers...');
    this.processDirectory(this.srcDir);
    
    // 3. Corrections spéciales pour les fichiers problématiques mentionnés
    const problematicFiles = [
      'src/app/(app)/admin/hosts/page.tsx',
      'src/app/(app)/admin/sites/page.tsx', 
      'src/app/(app)/admin/users/page.tsx',
      'src/app/(app)/host/clients/file/[clientId]/page.tsx',
      'src/app/(app)/host/clients/page.tsx'
    ];
    
    console.log('\n🎯 Correction spéciale des fichiers problématiques...');
    problematicFiles.forEach(file => {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        this.processFile(fullPath);
      }
    });
    
    // 4. Résultats
    console.log('\n' + '='.repeat(60));
    console.log('🎉 CORRECTION AUTOMATIQUE TERMINÉE !');
    console.log('='.repeat(60));
    console.log(`📊 ${this.fixedFiles} fichier(s) corrigé(s)`);
    console.log(`❌ ${this.errors.length} erreur(s) rencontrée(s)`);
    
    if (this.errors.length > 0) {
      console.log('\n⚠️  Erreurs rencontrées:');
      this.errors.forEach(err => {
        console.log(`   - ${err.file}: ${err.error}`);
      });
    }
    
    console.log('\n✅ Corrections appliquées:');
    console.log('   🔧 __barrel_optimize__ supprimés');
    console.log('   🔧 Imports Dialog fusionnés');
    console.log('   🔧 Imports lucide-react optimisés');
    console.log('   🔧 next.config.js anti-barrel créé');
    
    console.log('\n🚀 Tentez maintenant: npm run build');
    
    return this.fixedFiles > 0;
  }
}

// ====================================
// EXÉCUTION
// ====================================

if (require.main === module) {
  const fixer = new NextJsBuildErrorsFixer();
  const success = fixer.fixAllBuildErrors();
  process.exit(success ? 0 : 1);
}

module.exports = NextJsBuildErrorsFixer;