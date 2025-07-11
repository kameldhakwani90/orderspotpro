#!/usr/bin/env node

// ====================================
// 🪝 GENERATE REACT HOOKS - VERSION UNIVERSELLE DYNAMIQUE
// ====================================
// Auto-détection modèles depuis types.ts
// Compatible avec TOUT projet Next.js
// Génération hooks contextuels selon domaine
// ====================================

const fs = require('fs');
const path = require('path');

class UniversalReactHooksGenerator {
  constructor() {
    this.projectDir = process.cwd();
    this.srcDir = path.join(this.projectDir, 'src');
    this.hooksDir = path.join(this.srcDir, 'hooks');
    this.typesPath = path.join(this.srcDir, 'lib', 'types.ts');
    this.dataPath = path.join(this.srcDir, 'lib', 'data.ts');
    
    // Configuration dynamique
    this.detectedModels = [];
    this.projectDomain = 'generic';
    this.generatedHooks = [];
    this.errors = [];
    
    console.log('🪝 Universal React Hooks Generator - Version Dynamique');
    console.log(`📁 Projet: ${path.basename(this.projectDir)}`);
  }

  // ====================================
  // 🧠 AUTO-DÉTECTION MODÈLES DYNAMIQUE
  // ====================================
  
  async analyzeModelsFromProject() {
    console.log('\n🔍 Auto-détection des modèles du projet...');
    
    try {
      // 1. Lecture types.ts
      if (!fs.existsSync(this.typesPath)) {
        console.log('⚠️  types.ts introuvable');
        return this.createFallbackModels();
      }
      
      const typesContent = fs.readFileSync(this.typesPath, 'utf-8');
      
      // 2. Extraction interfaces principales
      const interfaceMatches = typesContent.matchAll(/export\s+interface\s+(\w+)\s*{([^}]+)}/g);
      const models = [];
      
      for (const match of interfaceMatches) {
        const modelName = match[1];
        const modelBody = match[2];
        
        // Analyser si c'est un modèle principal (a un id et d'autres propriétés)
        if (modelBody.includes('id:') || modelBody.includes('id ')) {
          models.push({
            name: modelName,
            properties: this.parseModelProperties(modelBody),
            category: this.categorizeModel(modelName)
          });
        }
      }
      
      this.detectedModels = models;
      this.projectDomain = this.detectProjectDomain(models);
      
      console.log(`✅ ${models.length} modèles détectés automatiquement:`);
      models.forEach(model => {
        console.log(`   📋 ${model.name} (${model.category})`);
      });
      console.log(`🎯 Domaine projet: ${this.projectDomain}`);
      
      return models;
      
    } catch (error) {
      console.error('❌ Erreur analyse modèles:', error.message);
      return this.createFallbackModels();
    }
  }
  
  // ====================================
  // 🎯 DÉTECTION DOMAINE & CATÉGORISATION
  // ====================================
  
  detectProjectDomain(models) {
    const modelNames = models.map(m => m.name.toLowerCase());
    
    // E-commerce patterns
    if (modelNames.some(name => ['product', 'order', 'customer', 'cart', 'payment'].includes(name))) {
      return 'e-commerce';
    }
    
    // Blog patterns
    if (modelNames.some(name => ['post', 'article', 'comment', 'author', 'category'].includes(name))) {
      return 'blog';
    }
    
    // CRM patterns
    if (modelNames.some(name => ['client', 'contact', 'deal', 'lead', 'company'].includes(name))) {
      return 'crm';
    }
    
    // OrderSpot/Booking patterns
    if (modelNames.some(name => ['host', 'service', 'booking', 'reservation'].includes(name))) {
      return 'booking';
    }
    
    // SaaS patterns
    if (modelNames.some(name => ['subscription', 'plan', 'organization', 'workspace', 'team'].includes(name))) {
      return 'saas';
    }
    
    return 'generic';
  }
  
  categorizeModel(modelName) {
    const name = modelName.toLowerCase();
    
    // Entités principales business
    if (['product', 'post', 'client', 'host', 'user', 'company'].includes(name)) {
      return 'main-entity';
    }
    
    // Relations/transactions
    if (['order', 'comment', 'deal', 'booking', 'subscription'].includes(name)) {
      return 'transaction';
    }
    
    // Configuration/metadata
    if (['category', 'tag', 'setting', 'plan', 'role'].includes(name)) {
      return 'metadata';
    }
    
    return 'general';
  }
  
  parseModelProperties(modelBody) {
    const properties = [];
    const lines = modelBody.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//')) {
        const propMatch = trimmed.match(/(\w+)(\??):\s*([^;,]+)/);
        if (propMatch) {
          properties.push({
            name: propMatch[1],
            optional: propMatch[2] === '?',
            type: propMatch[3].trim()
          });
        }
      }
    });
    
    return properties;
  }
  
  // ====================================
  // 🪝 GÉNÉRATION HOOKS UNIVERSELS
  // ====================================
  
  async generateAllHooks() {
    console.log('\n🚀 Génération hooks React universels...');
    
    try {
      // 1. Analyser modèles projet
      const models = await this.analyzeModelsFromProject();
      
      if (models.length === 0) {
        console.log('⚠️  Aucun modèle détecté, génération hooks génériques...');
        return await this.generateGenericHooks();
      }
      
      // 2. Créer répertoire hooks
      if (!fs.existsSync(this.hooksDir)) {
        fs.mkdirSync(this.hooksDir, { recursive: true });
        console.log('📁 Répertoire hooks créé');
      }
      
      // 3. Générer hooks pour chaque modèle
      for (const model of models) {
        await this.generateHooksForModel(model);
      }
      
      // 4. Générer index hooks
      await this.generateHooksIndex();
      
      // 5. Générer hooks spécialisés selon domaine
      await this.generateDomainSpecificHooks();
      
      console.log('\n✅ Génération hooks terminée !');
      this.generateReport();
      
      return this.errors.length === 0;
      
    } catch (error) {
      console.error('❌ Erreur génération hooks:', error.message);
      return false;
    }
  }
  
  // ====================================
  // 🏗️ GÉNÉRATION HOOKS PAR MODÈLE
  // ====================================
  
  async generateHooksForModel(model) {
    const modelName = model.name;
    const hookFileName = `use${modelName}.ts`;
    const hookPath = path.join(this.hooksDir, hookFileName);
    
    console.log(`🪝 Génération hooks pour ${modelName}...`);
    
    // Template hook adaptatif selon domaine
    const hookContent = this.generateAdaptiveHookTemplate(model);
    
    try {
      fs.writeFileSync(hookPath, hookContent);
      this.generatedHooks.push(modelName);
      console.log(`   ✅ ${hookFileName} créé`);
    } catch (error) {
      this.errors.push({ model: modelName, error: error.message });
      console.error(`   ❌ Erreur ${hookFileName}: ${error.message}`);
    }
  }
  
  generateAdaptiveHookTemplate(model) {
    const modelName = model.name;
    const lowerModel = modelName.toLowerCase();
    const pluralModel = this.makePlural(lowerModel);
    
    // Hook contextuel selon domaine
    const domainContext = this.getDomainContext(model);
    
    return `'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ${modelName} } from '@/lib/types';

// ====================================
// 🪝 ${modelName.toUpperCase()} HOOKS - Auto-généré pour ${this.projectDomain}
// ====================================

// Hook principal - Liste des ${pluralModel}
export function use${modelName}s() {
  const [${pluralModel}, set${modelName}s] = useState<${modelName}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch${modelName}s = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Implémentation dynamique selon votre API
      const response = await fetch('/api/${pluralModel}');
      if (!response.ok) throw new Error('Erreur chargement ${pluralModel}');
      
      const data = await response.json();
      set${modelName}s(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur fetch${modelName}s:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch${modelName}s();
  }, [fetch${modelName}s]);

  const refresh = useCallback(() => {
    fetch${modelName}s();
  }, [fetch${modelName}s]);

  return {
    ${pluralModel},
    loading,
    error,
    refresh,
    count: ${pluralModel}.length
  };
}

// Hook individuel - Single ${modelName}
export function use${modelName}(id: string | null) {
  const [${lowerModel}, set${modelName}] = useState<${modelName} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch${modelName} = useCallback(async (${lowerModel}Id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(\`/api/${pluralModel}/\${${lowerModel}Id}\`);
      if (!response.ok) throw new Error('${modelName} introuvable');
      
      const data = await response.json();
      set${modelName}(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur chargement ${lowerModel}';
      setError(errorMessage);
      console.error('Erreur fetch${modelName}:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetch${modelName}(id);
    }
  }, [id, fetch${modelName}]);

  return {
    ${lowerModel},
    loading,
    error,
    refresh: () => id && fetch${modelName}(id)
  };
}

// Hook mutation - Créer ${modelName}
export function useCreate${modelName}() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create${modelName} = useCallback(async (${lowerModel}Data: Omit<${modelName}, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/${pluralModel}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(${lowerModel}Data)
      });
      
      if (!response.ok) throw new Error('Erreur création ${lowerModel}');
      
      const created${modelName} = await response.json();
      return created${modelName};
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur création ${lowerModel}';
      setError(errorMessage);
      console.error('Erreur create${modelName}:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    create${modelName},
    loading,
    error
  };
}

// Hook mutation - Modifier ${modelName}
export function useUpdate${modelName}() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update${modelName} = useCallback(async (id: string, updates: Partial<${modelName}>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(\`/api/${pluralModel}/\${id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error('Erreur modification ${lowerModel}');
      
      const updated${modelName} = await response.json();
      return updated${modelName};
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur modification ${lowerModel}';
      setError(errorMessage);
      console.error('Erreur update${modelName}:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    update${modelName},
    loading,
    error
  };
}

// Hook mutation - Supprimer ${modelName}
export function useDelete${modelName}() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const delete${modelName} = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(\`/api/${pluralModel}/\${id}\`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Erreur suppression ${lowerModel}');
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur suppression ${lowerModel}';
      setError(errorMessage);
      console.error('Erreur delete${modelName}:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    delete${modelName},
    loading,
    error
  };
}

${domainContext.specialHooks}

// Export par défaut
export default use${modelName}s;
`;
  }
  
  // ====================================
  // 🎯 HOOKS SPÉCIALISÉS PAR DOMAINE
  // ====================================
  
  getDomainContext(model) {
    const modelName = model.name;
    const lowerModel = modelName.toLowerCase();
    
    switch (this.projectDomain) {
      case 'e-commerce':
        return this.getEcommerceHooks(model);
      case 'blog':
        return this.getBlogHooks(model);
      case 'crm':
        return this.getCrmHooks(model);
      case 'booking':
        return this.getBookingHooks(model);
      case 'saas':
        return this.getSaasHooks(model);
      default:
        return { specialHooks: '' };
    }
  }
  
  getEcommerceHooks(model) {
    const modelName = model.name;
    const lowerModel = modelName.toLowerCase();
    
    if (lowerModel === 'product') {
      return {
        specialHooks: `
// Hook spécialisé E-commerce - Recherche produits
export function useProductSearch() {
  const [results, setResults] = useState<${modelName}[]>([]);
  const [loading, setLoading] = useState(false);
  
  const searchProducts = useCallback(async (query: string, filters?: any) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query, ...filters });
      const response = await fetch(\`/api/products/search?\${params}\`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erreur recherche produits:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { results, loading, searchProducts };
}

// Hook spécialisé E-commerce - Produits par catégorie
export function useProductsByCategory(categoryId: string) {
  const [products, setProducts] = useState<${modelName}[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (categoryId) {
      fetch(\`/api/products/category/\${categoryId}\`)
        .then(res => res.json())
        .then(setProducts)
        .finally(() => setLoading(false));
    }
  }, [categoryId]);
  
  return { products, loading };
}`
      };
    }
    
    if (lowerModel === 'order') {
      return {
        specialHooks: `
// Hook spécialisé E-commerce - Commandes par statut
export function useOrdersByStatus(status: string) {
  const [orders, setOrders] = useState<${modelName}[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(\`/api/orders?status=\${status}\`)
      .then(res => res.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [status]);
  
  return { orders, loading };
}`
      };
    }
    
    return { specialHooks: '' };
  }
  
  getBlogHooks(model) {
    const modelName = model.name;
    const lowerModel = modelName.toLowerCase();
    
    if (lowerModel === 'post') {
      return {
        specialHooks: `
// Hook spécialisé Blog - Posts publiés
export function usePublishedPosts() {
  const [posts, setPosts] = useState<${modelName}[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/posts?status=published')
      .then(res => res.json())
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);
  
  return { posts, loading };
}`
      };
    }
    
    return { specialHooks: '' };
  }
  
  getCrmHooks(model) {
    const modelName = model.name;
    const lowerModel = modelName.toLowerCase();
    
    if (lowerModel === 'client') {
      return {
        specialHooks: `
// Hook spécialisé CRM - Clients actifs
export function useActiveClients() {
  const [clients, setClients] = useState<${modelName}[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/clients?status=active')
      .then(res => res.json())
      .then(setClients)
      .finally(() => setLoading(false));
  }, []);
  
  return { clients, loading };
}`
      };
    }
    
    return { specialHooks: '' };
  }
  
  getBookingHooks(model) {
    return { specialHooks: '// Hooks booking spécialisés à implémenter' };
  }
  
  getSaasHooks(model) {
    return { specialHooks: '// Hooks SaaS spécialisés à implémenter' };
  }
  
  // ====================================
  // 📄 GÉNÉRATION INDEX HOOKS
  // ====================================
  
  async generateHooksIndex() {
    console.log('\n📄 Génération index hooks...');
    
    const indexPath = path.join(this.hooksDir, 'index.ts');
    
    const imports = this.generatedHooks.map(model => {
      const hooks = [
        `use${model}s`,
        `use${model}`,
        `useCreate${model}`,
        `useUpdate${model}`,
        `useDelete${model}`
      ];
      
      return `export { ${hooks.join(', ')} } from './use${model}';`;
    }).join('\n');
    
    const indexContent = `// ====================================
// 📄 INDEX HOOKS - Auto-généré pour ${this.projectDomain}
// ====================================
// Export de tous les hooks du projet
// Généré automatiquement le ${new Date().toISOString()}

${imports}

// Export groupé par modèle
export const hooks = {
${this.generatedHooks.map(model => `  ${model}: {
    list: use${model}s,
    single: use${model},
    create: useCreate${model},
    update: useUpdate${model},
    delete: useDelete${model}
  }`).join(',\n')}
};

// Export par défaut
export default hooks;
`;
    
    fs.writeFileSync(indexPath, indexContent);
    console.log('✅ src/hooks/index.ts créé');
  }
  
  // ====================================
  // 🎯 HOOKS SPÉCIALISÉS DOMAINE
  // ====================================
  
  async generateDomainSpecificHooks() {
    console.log('\n🎯 Génération hooks spécialisés...');
    
    switch (this.projectDomain) {
      case 'e-commerce':
        await this.generateEcommerceSpecialHooks();
        break;
      case 'blog':
        await this.generateBlogSpecialHooks();
        break;
      case 'crm':
        await this.generateCrmSpecialHooks();
        break;
      default:
        console.log('   📝 Hooks génériques suffisants');
    }
  }
  
  async generateEcommerceSpecialHooks() {
    const specialHooksContent = `'use client';

import { useState, useEffect, useCallback } from 'react';

// ====================================
// 🛒 HOOKS E-COMMERCE SPÉCIALISÉS
// ====================================

// Hook panier
export function useCart() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  
  const addToCart = useCallback((product, quantity = 1) => {
    setItems(prev => [...prev, { ...product, quantity }]);
  }, []);
  
  const removeFromCart = useCallback((productId) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  }, []);
  
  useEffect(() => {
    const newTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
  }, [items]);
  
  return { items, total, addToCart, removeFromCart };
}

export default useCart;
`;
    
    const specialPath = path.join(this.hooksDir, 'useCart.ts');
    fs.writeFileSync(specialPath, specialHooksContent);
    console.log('   ✅ useCart.ts créé (E-commerce)');
  }
  
  async generateBlogSpecialHooks() {
    // Hooks spécialisés blog à implémenter
    console.log('   📝 Hooks blog à implémenter');
  }
  
  async generateCrmSpecialHooks() {
    // Hooks spécialisés CRM à implémenter
    console.log('   📝 Hooks CRM à implémenter');
  }
  
  // ====================================
  // 🔧 UTILITAIRES
  // ====================================
  
  createFallbackModels() {
    return [
      { name: 'User', category: 'main-entity', properties: [] },
      { name: 'Item', category: 'general', properties: [] }
    ];
  }
  
  makePlural(word) {
    if (word.endsWith('y')) return word.slice(0, -1) + 'ies';
    if (word.endsWith('s')) return word + 'es';
    return word + 's';
  }
  
  // ====================================
  // 📊 RAPPORT FINAL
  // ====================================
  
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT GÉNÉRATION HOOKS UNIVERSELS');
    console.log('='.repeat(60));
    
    console.log(`🎯 Domaine projet: ${this.projectDomain}`);
    console.log(`📋 Modèles détectés: ${this.detectedModels.length}`);
    this.detectedModels.forEach(model => {
      console.log(`   📄 ${model.name} (${model.category})`);
    });
    
    console.log(`\n🪝 Hooks générés: ${this.generatedHooks.length}`);
    this.generatedHooks.forEach(model => {
      console.log(`   ✅ use${model}s, use${model}, useCreate${model}, useUpdate${model}, useDelete${model}`);
    });
    
    if (this.errors.length > 0) {
      console.log(`\n❌ Erreurs: ${this.errors.length}`);
      this.errors.forEach(error => {
        console.log(`   ⚠️  ${error.model}: ${error.error}`);
      });
    }
    
    console.log('\n🚀 HOOKS MAINTENANT UNIVERSELS !');
    console.log('✅ Auto-détection modèles automatique');
    console.log('✅ Hooks adaptatifs selon domaine');
    console.log('✅ Compatible tout projet Next.js');
    console.log('✅ Plus de hard-coding OrderSpot');
  }
}

// ====================================
// 🚀 EXÉCUTION
// ====================================

if (require.main === module) {
  const generator = new UniversalReactHooksGenerator();
  
  generator.generateAllHooks()
    .then(success => {
      if (success) {
        console.log('\n🎉 SUCCÈS - generateReactHooks.js est maintenant UNIVERSEL !');
        process.exit(0);
      } else {
        console.log('\n⚠️  Terminé avec avertissements');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ ERREUR FATALE:', error.message);
      process.exit(1);
    });
}

module.exports = UniversalReactHooksGenerator;