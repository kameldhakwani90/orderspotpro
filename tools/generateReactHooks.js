const fs = require('fs');
const path = require('path');

console.log('🔧 Génération DYNAMIQUE des hooks React...');

const prismaServicePath = path.join(__dirname, '../src/lib/prisma-service.ts');
const hooksDir = path.join(__dirname, '../src/hooks');

if (!fs.existsSync(prismaServicePath)) {
  console.error('❌ Fichier prisma-service.ts introuvable');
  process.exit(1);
}

const prismaServiceContent = fs.readFileSync(prismaServicePath, 'utf-8');

function extractDynamicModels(content) {
  console.log('🔍 Extraction DYNAMIQUE des modèles...');
  const models = new Set();
  
  const getAllRegex = /export async function getAll(\w+)s\(\)/g;
  let match;
  
  while ((match = getAllRegex.exec(content)) !== null) {
    const modelName = match[1];
    models.add(modelName);
    console.log(`  ✅ ${modelName}`);
  }
  
  return Array.from(models);
}

function generateDynamicHookContent(modelName) {
  const camelModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const pluralModel = modelName.toLowerCase() + 's';
  
  return `'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-utils';

export interface ${modelName} {
  id: string;
  [key: string]: any;
}

interface Use${modelName}sReturn {
  ${pluralModel}: ${modelName}[];
  loading: boolean;
  error: string | null;
  fetch${modelName}s: () => Promise<void>;
  get${modelName}ById: (id: string) => Promise<${modelName} | null>;
  add${modelName}: (data: Partial<${modelName}>) => Promise<${modelName} | null>;
  update${modelName}: (id: string, data: Partial<${modelName}>) => Promise<${modelName} | null>;
  delete${modelName}: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function use${modelName}s(): Use${modelName}sReturn {
  const [${pluralModel}, set${modelName}s] = useState<${modelName}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch${modelName}s = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<${modelName}[]>('/${pluralModel}');
      
      if (response.error) {
        setError(response.error);
      } else {
        set${modelName}s(response.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  const get${modelName}ById = useCallback(async (id: string): Promise<${modelName} | null> => {
    setError(null);
    
    try {
      const response = await apiClient.get<${modelName}>(\`/${pluralModel}?id=\${id}\`);
      
      if (response.error) {
        setError(response.error);
        return null;
      }
      
      return response.data || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    }
  }, []);

  const add${modelName} = useCallback(async (data: Partial<${modelName}>): Promise<${modelName} | null> => {
    setError(null);
    
    try {
      const response = await apiClient.post<${modelName}>('/${pluralModel}', data);
      
      if (response.error) {
        setError(response.error);
        return null;
      }
      
      const new${modelName} = response.data;
      if (new${modelName}) {
        set${modelName}s(prev => [...prev, new${modelName}]);
      }
      
      return new${modelName} || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    }
  }, []);

  const update${modelName} = useCallback(async (id: string, data: Partial<${modelName}>): Promise<${modelName} | null> => {
    setError(null);
    
    try {
      const response = await apiClient.put<${modelName}>(\`/${pluralModel}?id=\${id}\`, data);
      
      if (response.error) {
        setError(response.error);
        return null;
      }
      
      const updated${modelName} = response.data;
      if (updated${modelName}) {
        set${modelName}s(prev => 
          prev.map(item => item.id === id ? updated${modelName} : item)
        );
      }
      
      return updated${modelName} || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    }
  }, []);

  const delete${modelName} = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    
    try {
      const response = await apiClient.delete(\`/${pluralModel}?id=\${id}\`);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      set${modelName}s(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetch${modelName}s();
  }, [fetch${modelName}s]);

  useEffect(() => {
    fetch${modelName}s();
  }, [fetch${modelName}s]);

  return {
    ${pluralModel},
    loading,
    error,
    fetch${modelName}s,
    get${modelName}ById,
    add${modelName},
    update${modelName},
    delete${modelName},
    refresh,
  };
}`;
}

function createDynamicHooks(models) {
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
    console.log(`📁 Répertoire créé: ${hooksDir}`);
  }
  
  let hooksCreated = 0;
  
  models.forEach(modelName => {
    const hookFile = path.join(hooksDir, `use${modelName}s.ts`);
    const hookContent = generateDynamicHookContent(modelName);
    
    fs.writeFileSync(hookFile, hookContent, 'utf-8');
    console.log(`✅ Hook créé: use${modelName}s`);
    hooksCreated++;
  });
  
  return hooksCreated;
}

function createDynamicIndexFile(models) {
  const indexPath = path.join(hooksDir, 'index.ts');
  
  let indexContent = '// Export de tous les hooks - Généré automatiquement\n\n';
  
  models.forEach(modelName => {
    indexContent += `export { use${modelName}s } from './use${modelName}s';\n`;
  });
  
  fs.writeFileSync(indexPath, indexContent, 'utf-8');
  console.log(`✅ Index créé`);
}

try {
  const models = extractDynamicModels(prismaServiceContent);
  
  if (models.length === 0) {
    console.error('❌ Aucun modèle trouvé');
    process.exit(1);
  }
  
  console.log(`🔍 ${models.length} modèles détectés`);
  
  const hooksCreated = createDynamicHooks(models);
  createDynamicIndexFile(models);
  
  console.log(`\n🎉 ${hooksCreated} hooks React créés DYNAMIQUEMENT !`);
  
} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}
