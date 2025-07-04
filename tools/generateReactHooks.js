const fs = require('fs');
const path = require('path');

// ====================================
// GÉNÉRATEUR HOOKS REACT DYNAMIQUE - PIPELINE UNIVERSEL
// ====================================

console.log('🪝 Génération hooks React dynamiques - Pipeline Universel');

class ReactHooksGenerator {
  constructor() {
    this.detectedModels = [];
    this.detectedTypes = [];
    this.config = null;
    this.generatedHooks = [];
    this.errors = [];
    
    this.loadConfiguration();
  }
  
  // ====================================
  // CHARGEMENT CONFIGURATION
  // ====================================
  
  loadConfiguration() {
    try {
      const configPath = path.join(process.cwd(), '.project-config.json');
      if (fs.existsSync(configPath)) {
        this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        console.log(`📋 Configuration chargée: ${this.config.app?.name || 'Projet'}`);
      } else {
        console.log('⚠️ Configuration .project-config.json non trouvée - mode basique');
      }
    } catch (error) {
      console.log('⚠️ Erreur chargement configuration:', error.message);
    }
  }
  
  // ====================================
  // ANALYSE AUTOMATIQUE DES MODÈLES
  // ====================================
  
  analyzeModelsFromProject() {
    console.log('\n🔍 Analyse automatique des modèles du projet...');
    
    // 1. Analyser types.ts pour les interfaces
    const typesModels = this.analyzeTypesFile();
    
    // 2. Analyser data.ts pour les fonctions
    const dataModels = this.analyzeDataFile();
    
    // 3. Analyser prisma-service.ts si disponible
    const prismaModels = this.analyzePrismaService();
    
    // 4. Fusionner et déduplication
    const allModels = [...new Set([...typesModels, ...dataModels, ...prismaModels])];
    
    this.detectedModels = allModels.filter(model => model && model.length > 0);
    
    console.log(`✅ Modèles détectés: ${this.detectedModels.join(', ')}`);
    
    if (this.detectedModels.length === 0) {
      console.log('⚠️ Aucun modèle détecté - utilisation mode fallback');
      this.detectedModels = this.getFallbackModels();
    }
    
    return this.detectedModels;
  }
  
  analyzeTypesFile() {
    console.log('📋 Analyse de types.ts...');
    
    const possiblePaths = [
      'src/lib/types.ts',
      'src/types/index.ts',
      'src/types.ts',
      'types/index.ts',
      'lib/types.ts'
    ];
    
    for (const typesPath of possiblePaths) {
      const fullPath = path.join(process.cwd(), typesPath);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const interfaces = this.extractInterfacesFromContent(content);
          const models = this.inferModelsFromInterfaces(interfaces);
          
          console.log(`   ✅ ${typesPath}: ${models.length} modèles trouvés`);
          return models;
          
        } catch (error) {
          console.log(`   ⚠️ Erreur lecture ${typesPath}:`, error.message);
        }
      }
    }
    
    console.log('   ⚠️ Aucun fichier types trouvé');
    return [];
  }
  
  extractInterfacesFromContent(content) {
    const interfaces = [];
    const interfaceRegex = /export\s+interface\s+(\w+)\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = interfaceRegex.exec(content)) !== null) {
      const interfaceName = match[1];
      const interfaceBody = match[2];
      
      // Extraction des propriétés
      const properties = this.extractPropertiesFromInterface(interfaceBody);
      
      interfaces.push({
        name: interfaceName,
        properties,
        raw: match[0]
      });
      
      // Stocker aussi dans detectedTypes
      this.detectedTypes.push({
        name: interfaceName,
        type: 'interface',
        properties
      });
    }
    
    return interfaces;
  }
  
  extractPropertiesFromInterface(interfaceBody) {
    const properties = [];
    const lines = interfaceBody.split('\n');
    
    lines.forEach(line => {
      const cleanLine = line.trim();
      if (cleanLine && !cleanLine.startsWith('//') && !cleanLine.startsWith('/*')) {
        const propMatch = cleanLine.match(/(\w+)(\?)?:\s*([^;,]+)/);
        if (propMatch) {
          properties.push({
            name: propMatch[1],
            optional: !!propMatch[2],
            type: propMatch[3].trim(),
            raw: cleanLine
          });
        }
      }
    });
    
    return properties;
  }
  
  inferModelsFromInterfaces(interfaces) {
    const models = [];
    
    interfaces.forEach(interface => {
      // Vérifier si c'est probablement un modèle de données
      const hasId = interface.properties.some(prop => 
        prop.name.toLowerCase() === 'id' || 
        prop.name === '_id' ||
        prop.name.endsWith('Id')
      );
      
      // Vérifier si c'est un modèle métier (pas un type utilitaire)
      const isUtilityType = /^(API|Response|Request|Config|Settings|Props)/.test(interface.name);
      
      if (hasId && !isUtilityType) {
        models.push(interface.name);
      }
    });
    
    return models;
  }
  
  analyzeDataFile() {
    console.log('📊 Analyse de data.ts...');
    
    const dataPath = path.join(process.cwd(), 'src/lib/data.ts');
    
    if (!fs.existsSync(dataPath)) {
      console.log('   ⚠️ data.ts non trouvé');
      return [];
    }
    
    try {
      const content = fs.readFileSync(dataPath, 'utf-8');
      const functions = this.extractFunctionsFromContent(content);
      const models = this.inferModelsFromFunctions(functions);
      
      console.log(`   ✅ data.ts: ${models.length} modèles inférés`);
      return models;
      
    } catch (error) {
      console.log('   ⚠️ Erreur lecture data.ts:', error.message);
      return [];
    }
  }
  
  extractFunctionsFromContent(content) {
    const functions = [];
    const functionRegex = /export\s+(?:const|function)\s+(\w+)/g;
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1];
      const functionType = this.categorizeCrudFunction(functionName);
      const model = this.extractModelFromFunctionName(functionName);
      
      if (model) {
        functions.push({
          name: functionName,
          type: functionType,
          model: model
        });
      }
    }
    
    return functions;
  }
  
  categorizeCrudFunction(functionName) {
    const name = functionName.toLowerCase();
    if (name.startsWith('get')) return 'read';
    if (name.startsWith('add') || name.startsWith('create')) return 'create';
    if (name.startsWith('update') || name.startsWith('modify')) return 'update';
    if (name.startsWith('delete') || name.startsWith('remove')) return 'delete';
    return 'other';
  }
  
  extractModelFromFunctionName(functionName) {
    // Patterns pour extraire le nom du modèle
    const patterns = [
      /^get(\w+)s?$/i,           // getHosts -> Host, getUsers -> User
      /^add(\w+)$/i,             // addHost -> Host
      /^update(\w+)$/i,          // updateHost -> Host
      /^delete(\w+)$/i,          // deleteHost -> Host
      /^create(\w+)$/i,          // createHost -> Host
      /^(\w+)Data$/i,            // hostsData -> Host
      /^fetch(\w+)s?$/i,         // fetchUsers -> User
      /^save(\w+)$/i,            // saveUser -> User
      /^remove(\w+)$/i,          // removeUser -> User
    ];
    
    for (const pattern of patterns) {
      const match = functionName.match(pattern);
      if (match) {
        let model = match[1];
        
        // Enlever le 's' final si présent pour les pluriels
        if (model.endsWith('s') && model.length > 1) {
          model = model.slice(0, -1);
        }
        
        // Capitaliser la première lettre
        return model.charAt(0).toUpperCase() + model.slice(1);
      }
    }
    
    return null;
  }
  
  inferModelsFromFunctions(functions) {
    const models = [];
    
    functions.forEach(func => {
      if (func.model && !models.includes(func.model)) {
        models.push(func.model);
      }
    });
    
    return models;
  }
  
  analyzePrismaService() {
    console.log('🗄️ Analyse de prisma-service.ts...');
    
    const prismaPath = path.join(process.cwd(), 'src/lib/prisma-service.ts');
    
    if (!fs.existsSync(prismaPath)) {
      console.log('   ⚠️ prisma-service.ts non trouvé');
      return [];
    }
    
    try {
      const content = fs.readFileSync(prismaPath, 'utf-8');
      const functions = this.extractFunctionsFromContent(content);
      const models = this.inferModelsFromFunctions(functions);
      
      console.log(`   ✅ prisma-service.ts: ${models.length} modèles trouvés`);
      return models;
      
    } catch (error) {
      console.log('   ⚠️ Erreur lecture prisma-service.ts:', error.message);
      return [];
    }
  }
  
  getFallbackModels() {
    console.log('🔄 Mode fallback - modèles génériques...');
    
    // Modèles génériques courants
    const fallbackModels = ['User', 'Item'];
    
    // Essayer de deviner depuis le nom du projet
    if (this.config?.app?.name) {
      const projectName = this.config.app.name.toLowerCase();
      
      if (projectName.includes('shop') || projectName.includes('store') || projectName.includes('commerce')) {
        fallbackModels.push('Product', 'Order', 'Customer');
      } else if (projectName.includes('blog') || projectName.includes('news')) {
        fallbackModels.push('Post', 'Comment', 'Author');
      } else if (projectName.includes('task') || projectName.includes('todo')) {
        fallbackModels.push('Task', 'Project', 'Category');
      } else if (projectName.includes('chat') || projectName.includes('message')) {
        fallbackModels.push('Message', 'Channel', 'Contact');
      }
    }
    
    console.log(`   💡 Modèles fallback: ${fallbackModels.join(', ')}`);
    return fallbackModels;
  }
  
  // ====================================
  // GÉNÉRATION HOOKS REACT
  // ====================================
  
  async generateAllHooks() {
    console.log('\n🪝 Génération des hooks React...');
    
    if (this.detectedModels.length === 0) {
      console.log('❌ Aucun modèle détecté - impossible de générer des hooks');
      return false;
    }
    
    // Créer le répertoire hooks s'il n'existe pas
    const hooksDir = path.join(process.cwd(), 'src/hooks');
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
      console.log('📁 Répertoire src/hooks créé');
    }
    
    let totalGenerated = 0;
    
    // Générer hooks pour chaque modèle
    for (const model of this.detectedModels) {
      try {
        const generated = await this.generateHooksForModel(model);
        if (generated) {
          totalGenerated++;
          this.generatedHooks.push(model);
        }
      } catch (error) {
        console.error(`❌ Erreur génération hooks ${model}:`, error.message);
        this.errors.push(`${model}: ${error.message}`);
      }
    }
    
    // Générer index.ts pour exports
    await this.generateHooksIndex();
    
    console.log(`✅ Hooks générés: ${totalGenerated}/${this.detectedModels.length} modèles`);
    return totalGenerated > 0;
  }
  
  async generateHooksForModel(modelName) {
    console.log(`🔧 Génération hooks pour ${modelName}...`);
    
    const lowerModel = modelName.toLowerCase();
    const pluralModel = this.makePlural(lowerModel);
    const hookFileName = `use${modelName}.ts`;
    const hookFilePath = path.join(process.cwd(), 'src/hooks', hookFileName);
    
    // Vérifier si le hook existe déjà
    if (fs.existsSync(hookFilePath)) {
      console.log(`   ⏭️  Hook ${hookFileName} existe déjà - conservation`);
      return false;
    }
    
    // Générer le contenu du hook
    const hookContent = this.generateHookContent(modelName, lowerModel, pluralModel);
    
    // Écrire le fichier
    fs.writeFileSync(hookFilePath, hookContent);
    console.log(`   ✅ ${hookFileName} créé`);
    
    return true;
  }
  
  generateHookContent(modelName, lowerModel, pluralModel) {
    const projectName = this.config?.app?.name || 'Application';
    const timestamp = new Date().toISOString();
    
    return `// Hook React pour ${modelName} - Généré automatiquement
// Projet: ${projectName}
// Généré le: ${timestamp}

'use client';

import { useState, useEffect, useCallback } from 'react';

// Types
export interface ${modelName} {
  id: string;
  // TODO: Ajouter les propriétés spécifiques à ${modelName}
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Use${modelName}sResult {
  ${pluralModel}: ${modelName}[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (data: Omit<${modelName}, 'id'>) => Promise<${modelName} | null>;
  update: (id: string, data: Partial<${modelName}>) => Promise<${modelName} | null>;
  remove: (id: string) => Promise<boolean>;
}

export interface Use${modelName}Result {
  ${lowerModel}: ${modelName} | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  update: (data: Partial<${modelName}>) => Promise<${modelName} | null>;
  remove: () => Promise<boolean>;
}

// ====================================
// HOOK PRINCIPAL - LISTE DES ${modelName.toUpperCase()}S
// ====================================

export function use${modelName}s(): Use${modelName}sResult {
  const [${pluralModel}, set${modelName}s] = useState<${modelName}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction de récupération des données
  const fetch${modelName}s = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Remplacer par l'appel API réel
      const response = await fetch('/api/${pluralModel}');
      
      if (!response.ok) {
        throw new Error(\`Erreur \${response.status}: \${response.statusText}\`);
      }
      
      const data = await response.json();
      set${modelName}s(data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur récupération ${pluralModel}:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les données au montage
  useEffect(() => {
    fetch${modelName}s();
  }, [fetch${modelName}s]);

  // Fonction de création
  const create = useCallback(async (data: Omit<${modelName}, 'id'>): Promise<${modelName} | null> => {
    try {
      setError(null);
      
      const response = await fetch('/api/${pluralModel}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(\`Erreur création: \${response.statusText}\`);
      }

      const new${modelName} = await response.json();
      
      // Mise à jour optimiste
      set${modelName}s(prev => [...prev, new${modelName}]);
      
      return new${modelName};
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur création';
      setError(errorMessage);
      console.error('Erreur création ${lowerModel}:', err);
      return null;
    }
  }, []);

  // Fonction de mise à jour
  const update = useCallback(async (id: string, data: Partial<${modelName}>): Promise<${modelName} | null> => {
    try {
      setError(null);
      
      const response = await fetch(\`/api/${pluralModel}/\${id}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(\`Erreur mise à jour: \${response.statusText}\`);
      }

      const updated${modelName} = await response.json();
      
      // Mise à jour optimiste
      set${modelName}s(prev => 
        prev.map(item => item.id === id ? updated${modelName} : item)
      );
      
      return updated${modelName};
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur mise à jour';
      setError(errorMessage);
      console.error('Erreur mise à jour ${lowerModel}:', err);
      return null;
    }
  }, []);

  // Fonction de suppression
  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(\`/api/${pluralModel}/\${id}\`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(\`Erreur suppression: \${response.statusText}\`);
      }

      // Mise à jour optimiste
      set${modelName}s(prev => prev.filter(item => item.id !== id));
      
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur suppression';
      setError(errorMessage);
      console.error('Erreur suppression ${lowerModel}:', err);
      return false;
    }
  }, []);

  return {
    ${pluralModel},
    loading,
    error,
    refetch: fetch${modelName}s,
    create,
    update,
    remove,
  };
}

// ====================================
// HOOK INDIVIDUEL - ${modelName.toUpperCase()} UNIQUE
// ====================================

export function use${modelName}(id: string): Use${modelName}Result {
  const [${lowerModel}, set${modelName}] = useState<${modelName} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction de récupération
  const fetch${modelName} = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(\`/api/${pluralModel}/\${id}\`);
      
      if (!response.ok) {
        throw new Error(\`Erreur \${response.status}: \${response.statusText}\`);
      }
      
      const data = await response.json();
      set${modelName}(data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error(\`Erreur récupération ${lowerModel} \${id}:\`, err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Charger au montage et quand l'id change
  useEffect(() => {
    fetch${modelName}();
  }, [fetch${modelName}]);

  // Fonction de mise à jour
  const update = useCallback(async (data: Partial<${modelName}>): Promise<${modelName} | null> => {
    if (!id || !${lowerModel}) return null;

    try {
      setError(null);
      
      const response = await fetch(\`/api/${pluralModel}/\${id}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(\`Erreur mise à jour: \${response.statusText}\`);
      }

      const updated${modelName} = await response.json();
      set${modelName}(updated${modelName});
      
      return updated${modelName};
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur mise à jour';
      setError(errorMessage);
      console.error('Erreur mise à jour ${lowerModel}:', err);
      return null;
    }
  }, [id, ${lowerModel}]);

  // Fonction de suppression
  const remove = useCallback(async (): Promise<boolean> => {
    if (!id) return false;

    try {
      setError(null);
      
      const response = await fetch(\`/api/${pluralModel}/\${id}\`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(\`Erreur suppression: \${response.statusText}\`);
      }

      set${modelName}(null);
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur suppression';
      setError(errorMessage);
      console.error('Erreur suppression ${lowerModel}:', err);
      return false;
    }
  }, [id]);

  return {
    ${lowerModel},
    loading,
    error,
    refetch: fetch${modelName},
    update,
    remove,
  };
}

// ====================================
// HOOKS UTILITAIRES
// ====================================

export function useCreate${modelName}() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: Omit<${modelName}, 'id'>): Promise<${modelName} | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/${pluralModel}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(\`Erreur création: \${response.statusText}\`);
      }

      const new${modelName} = await response.json();
      return new${modelName};
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur création';
      setError(errorMessage);
      console.error('Erreur création ${lowerModel}:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}

export default use${modelName}s;
`;
  }
  
  async generateHooksIndex() {
    console.log('📄 Génération de l\'index des hooks...');
    
    const indexPath = path.join(process.cwd(), 'src/hooks/index.ts');
    
    const imports = this.generatedHooks.map(model => 
      `export { use${model}s, use${model}, useCreate${model} } from './use${model}';`
    ).join('\n');
    
    const indexContent = `// Index des hooks React - Généré automatiquement
// Projet: ${this.config?.app?.name || 'Application'}
// Généré le: ${new Date().toISOString()}

${imports}

// Export par défaut pour compatibilité
export default {
${this.generatedHooks.map(model => `  use${model}s, use${model}, useCreate${model},`).join('\n')}
};
`;
    
    fs.writeFileSync(indexPath, indexContent);
    console.log('✅ src/hooks/index.ts créé');
  }
  
  // ====================================
  // UTILITAIRES
  // ====================================
  
  makePlural(word) {
    // Règles basiques de pluralisation
    if (word.endsWith('y')) {
      return word.slice(0, -1) + 'ies';
    } else if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || word.endsWith('x') || word.endsWith('z')) {
      return word + 'es';
    } else {
      return word + 's';
    }
  }
  
  // ====================================
  // RAPPORT FINAL
  // ====================================
  
  generateReport() {
    console.log('\n📊 RAPPORT GÉNÉRATION HOOKS:');
    console.log('='.repeat(50));
    
    if (this.config) {
      console.log(`📁 Projet: ${this.config.app.name}`);
    }
    
    console.log(`🔍 Modèles détectés: ${this.detectedModels.length}`);
    this.detectedModels.forEach(model => {
      console.log(`   - ${model}`);
    });
    
    console.log(`🪝 Hooks générés: ${this.generatedHooks.length}`);
    this.generatedHooks.forEach(model => {
      console.log(`   + use${model}s, use${model}, useCreate${model}`);
    });
    
    if (this.errors.length > 0) {
      console.log(`❌ Erreurs rencontrées: ${this.errors.length}`);
      this.errors.forEach(error => {
        console.log(`   ! ${error}`);
      });
    }
    
    console.log(`📁 Emplacement: src/hooks/`);
    console.log(`📄 Index: src/hooks/index.ts`);
    
    console.log('='.repeat(50));
  }
}

// ====================================
// POINT D'ENTRÉE
// ====================================

async function main() {
  const generator = new ReactHooksGenerator();
  
  try {
    console.log('🚀 Démarrage génération hooks React dynamiques...\n');
    
    // Analyser les modèles du projet
    const models = generator.analyzeModelsFromProject();
    
    if (models.length === 0) {
      console.log('❌ Aucun modèle détecté - impossible de générer des hooks');
      return false;
    }
    
    // Générer tous les hooks
    const success = await generator.generateAllHooks();
    
    // Générer le rapport
    generator.generateReport();
    
    if (success) {
      console.log(`\n🎉 Génération réussie: ${generator.generatedHooks.length} hooks créés`);
      return true;
    } else {
      console.log('\n💡 Aucun hook généré - fichiers existants conservés');
      return true;
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la génération des hooks:');
    console.error(`   💥 ${error.message}`);
    
    // Informations de debug
    console.log('\n🔍 Informations de debug:');
    console.log(`   📂 Répertoire: ${process.cwd()}`);
    console.log(`   🔧 Node.js: ${process.version}`);
    
    // Vérifier les fichiers critiques
    const criticalFiles = [
      'src/lib/types.ts',
      'src/lib/data.ts',
      'src/lib/prisma-service.ts',
      '.project-config.json'
    ];
    
    criticalFiles.forEach(file => {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    });
    
    console.log('\n💡 Pour résoudre:');
    console.log('   1. Vérifiez que les fichiers types.ts et data.ts existent');
    console.log('   2. Vérifiez la syntaxe des interfaces dans types.ts');
    console.log('   3. Vérifiez que les fonctions sont exportées dans data.ts');
    console.log('   4. Lancez: npm install react react-dom @types/react');
    console.log('   5. Vérifiez la configuration dans .project-config.json');
    
    generator.generateReport();
    return false;
  }
}

// ====================================
// UTILITAIRES SUPPLÉMENTAIRES
// ====================================

function validateReactHook(hookContent) {
  // Validation basique du contenu du hook
  const errors = [];
  
  // Vérifier que c'est un hook valide (commence par 'use')
  if (!hookContent.includes('export function use')) {
    errors.push('Fonction hook manquante (doit commencer par "use")');
  }
  
  // Vérifier les imports React
  if (!hookContent.includes("from 'react'")) {
    errors.push('Imports React manquants');
  }
  
  // Vérifier la directive 'use client'
  if (!hookContent.includes("'use client'")) {
    errors.push("Directive 'use client' manquante");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function generateHookTemplate(modelName) {
  // Template minimal pour un hook
  return `'use client';

import { useState, useEffect } from 'react';

export function use${modelName}s() {
  const [${modelName.toLowerCase()}s, set${modelName}s] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // TODO: Implémenter la logique de récupération
    setLoading(false);
  }, []);
  
  return { ${modelName.toLowerCase()}s, loading };
}

export default use${modelName}s;
`;
}

function createHookBackup(hookPath) {
  // Créer une sauvegarde du hook existant
  if (fs.existsSync(hookPath)) {
    const backupPath = hookPath + '.backup.' + Date.now();
    fs.copyFileSync(hookPath, backupPath);
    console.log(`💾 Backup créé: ${path.basename(backupPath)}`);
    return backupPath;
  }
  return null;
}

function optimizeHookForProduction(hookContent) {
  // Optimisations pour la production
  return hookContent
    .replace(/console\.log\([^)]+\);?\s*/g, '') // Supprimer console.log
    .replace(/\/\/ TODO:[^\n]*/g, '')          // Supprimer TODO
    .replace(/\n\s*\n\s*\n/g, '\n\n')         // Réduire lignes vides multiples
    .trim();
}

// ====================================
// EXPORT ET EXÉCUTION
// ====================================

if (require.main === module) {
  main()
    .then(success => {
      if (success) {
        console.log('\n🎉 Génération hooks React réussie !');
        process.exit(0);
      } else {
        console.log('\n💥 Génération hooks React échouée');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Erreur fatale:', error.message);
      process.exit(1);
    });
}

module.exports = { 
  ReactHooksGenerator, 
  validateReactHook, 
  generateHookTemplate, 
  createHookBackup,
  optimizeHookForProduction 
};
      