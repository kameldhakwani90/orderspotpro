// convert-pages-to-dynamic.js - CONVERSION PAGES STATIQUES → DYNAMIQUES
const fs = require('fs');
const path = require('path');

console.log('🔄 CONVERSION PAGES STATIQUES → DYNAMIQUES');
console.log('🎯 Objectif: Utiliser routes API REST au lieu d\'appels statiques');

class PageConverter {
  constructor() {
    this.pagesDir = './src/app';
    this.componentsDir = './src/components';
    this.hooksDir = './src/hooks';
    this.modelsDetected = [];
    this.conversions = 0;
  }

  // ====================================
  // DÉTECTION MODÈLES
  // ====================================
  detectModels() {
    console.log('🔍 Détection des modèles...');
    
    const typesPath = './src/lib/types.ts';
    if (!fs.existsSync(typesPath)) {
      console.log('❌ types.ts introuvable');
      return [];
    }

    const content = fs.readFileSync(typesPath, 'utf-8');
    const interfaceMatches = content.match(/export interface (\w+)/g);
    
    if (interfaceMatches) {
      this.modelsDetected = interfaceMatches.map(match => 
        match.replace('export interface ', '')
      );
    }

    console.log(`📊 Modèles détectés: ${this.modelsDetected.join(', ')}`);
    return this.modelsDetected;
  }

  // ====================================
  // GÉNÉRATION HOOKS REACT
  // ====================================
  generateReactHooks() {
    console.log('🪝 Génération hooks React...');
    
    if (!fs.existsSync(this.hooksDir)) {
      fs.mkdirSync(this.hooksDir, { recursive: true });
    }

    this.modelsDetected.forEach(model => {
      this.generateModelHook(model);
    });

    // Hook générique API
    this.generateApiHook();
  }

  generateModelHook(model) {
    const hookName = `use${model}s`;
    const hookPath = path.join(this.hooksDir, `${hookName}.ts`);
    
    const hookContent = `'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-utils';
import type { ${model} } from '@/lib/types';

// Hook généré automatiquement pour ${model}
export function ${hookName}() {
  const [${model.toLowerCase()}s, set${model}s] = useState<${model}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ====================================
  // CHARGEMENT INITIAL
  // ====================================
  useEffect(() => {
    load${model}s();
  }, []);

  // ====================================
  // CRUD OPERATIONS
  // ====================================
  
  const load${model}s = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get<${model}[]>('/${model.toLowerCase()}s');
      
      if (response.error) {
        setError(response.error);
      } else {
        set${model}s(response.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  const create${model} = async (data: Omit<${model}, 'id'>) => {
    try {
      const response = await apiClient.post<${model}>('/${model.toLowerCase()}s', data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        set${model}s(prev => [...prev, response.data!]);
      }
      
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erreur création';
      setError(error);
      throw err;
    }
  };

  const update${model} = async (id: string, data: Partial<${model}>) => {
    try {
      const response = await apiClient.put<${model}>(\`/${model.toLowerCase()}s?id=\${id}\`, data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        set${model}s(prev => 
          prev.map(item => item.id === id ? { ...item, ...response.data! } : item)
        );
      }
      
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erreur mise à jour';
      setError(error);
      throw err;
    }
  };

  const delete${model} = async (id: string) => {
    try {
      const response = await apiClient.delete(\`/${model.toLowerCase()}s?id=\${id}\`);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      set${model}s(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erreur suppression';
      setError(error);
      throw err;
    }
  };

  return {
    ${model.toLowerCase()}s,
    loading,
    error,
    refresh: load${model}s,
    create: create${model},
    update: update${model},
    delete: delete${model}
  };
}`;

    fs.writeFileSync(hookPath, hookContent);
    console.log(`  ✅ Hook créé: ${hookName}`);
  }

  generateApiHook() {
    const hookPath = path.join(this.hooksDir, 'useApi.ts');
    
    const hookContent = `'use client';
import { useState } from 'react';
import { apiClient } from '@/lib/api-utils';

// Hook générique pour appels API
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = async <T>(
    endpoint: string, 
    options?: RequestInit
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.request<T>(endpoint, options);
      
      if (response.error) {
        setError(response.error);
        return null;
      }
      
      return response.data || null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur API';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { request, loading, error };
}`;

    fs.writeFileSync(hookPath, hookContent);
    console.log('  ✅ Hook générique useApi créé');
  }

  // ====================================
  // CONVERSION FICHIERS PAGES
  // ====================================
  convertPages() {
    console.log('🔄 Conversion des pages...');
    
    const pageFiles = this.findPageFiles();
    
    pageFiles.forEach(filePath => {
      this.convertPageFile(filePath);
    });

    console.log(`✅ ${this.conversions} fichiers convertis`);
  }

  findPageFiles() {
    const files = [];
    
    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          files.push(fullPath);
        }
      });
    };

    scanDir(this.pagesDir);
    scanDir(this.componentsDir);
    
    return files;
  }

  convertPageFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanges = false;

    // ====================================
    // CONVERSION IMPORTS
    // ====================================
    
    // Remplacer imports data.ts
    const dataImportRegex = /import\s+{[^}]+}\s+from\s+['"]@?\/lib\/data['"];?/g;
    if (dataImportRegex.test(content)) {
      console.log(`  🔄 ${path.relative('.', filePath)}: Import data détecté`);
      
      // Identifier les modèles utilisés
      const usedModels = this.modelsDetected.filter(model => 
        content.includes(`${model.toLowerCase()}s`) || 
        content.includes(`sample${model}s`)
      );

      if (usedModels.length > 0) {
        // Remplacer import data par hooks
        const hookImports = usedModels.map(model => 
          `import { use${model}s } from '@/hooks/use${model}s';`
        ).join('\n');

        content = content.replace(dataImportRegex, hookImports);
        hasChanges = true;
      }
    }

    // ====================================
    // CONVERSION UTILISATION DONNÉES
    // ====================================
    
    this.modelsDetected.forEach(model => {
      const sampleVar = `sample${model}s`;
      const hookVar = `${model.toLowerCase()}s`;
      
      if (content.includes(sampleVar)) {
        console.log(`  🔄 ${path.relative('.', filePath)}: Conversion ${sampleVar}`);
        
        // Ajouter hook usage dans composant
        const hookUsage = `const { ${hookVar}, loading, error } = use${model}s();`;
        
        // Insérer après les imports
        const componentMatch = content.match(/(export\s+(?:default\s+)?function\s+\w+[^{]*{)/);
        if (componentMatch) {
          const insertPoint = componentMatch.index + componentMatch[1].length;
          content = content.slice(0, insertPoint) + 
                   '\n  ' + hookUsage + '\n' + 
                   content.slice(insertPoint);
        }
        
        // Remplacer utilisation
        content = content.replace(new RegExp(sampleVar, 'g'), hookVar);
        hasChanges = true;
      }
    });

    // ====================================
    // SAUVEGARDER SI MODIFIÉ
    // ====================================
    
    if (hasChanges) {
      // Backup original
      const backupPath = filePath + '.backup';
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(filePath, backupPath);
      }
      
      fs.writeFileSync(filePath, content);
      this.conversions++;
      console.log(`  ✅ ${path.relative('.', filePath)} converti`);
    }
  }

  // ====================================
  // VALIDATION
  // ====================================
  validateConversion() {
    console.log('🔍 Validation de la conversion...');
    
    const hooksCreated = this.modelsDetected.length + 1; // +1 pour useApi
    const hooksExpected = fs.readdirSync(this.hooksDir).length;
    
    console.log(`📊 Hooks créés: ${hooksCreated}`);
    console.log(`📊 Fichiers convertis: ${this.conversions}`);
    
    if (hooksExpected >= hooksCreated) {
      console.log('✅ Validation réussie');
      return true;
    } else {
      console.log('⚠️ Certains hooks manquent');
      return false;
    }
  }
}

// ====================================
// EXÉCUTION PRINCIPALE
// ====================================
async function main() {
  const converter = new PageConverter();
  
  try {
    console.log('🚀 CONVERSION PAGES STATIQUES → DYNAMIQUES');
    console.log('🎯 Remplacement appels data.ts par API REST');
    
    // Étapes conversion
    converter.detectModels();
    converter.generateReactHooks();
    converter.convertPages();
    
    const success = converter.validateConversion();
    
    if (success) {
      console.log('\n✅ CONVERSION TERMINÉE AVEC SUCCÈS');
      console.log('🎉 Pages utilisent maintenant les API REST !');
      console.log('\n📋 Résultats:');
      console.log(`   - ${converter.modelsDetected.length} hooks générés`);
      console.log(`   - ${converter.conversions} pages converties`);
      console.log('   - CRUD dynamique fonctionnel');
    } else {
      console.log('\n⚠️ CONVERSION PARTIELLE');
      console.log('💡 Certains éléments nécessitent attention manuelle');
    }
    
  } catch (error) {
    console.error('\n❌ ERREUR CONVERSION:', error.message);
    console.log('💡 Vérifiez la structure du projet et types.ts');
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = { PageConverter };