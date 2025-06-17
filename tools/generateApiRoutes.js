const fs = require('fs');
const path = require('path');

console.log('🔧 Génération DYNAMIQUE des routes API Next.js (SERVER-SIDE)...');

const prismaServicePath = path.join(__dirname, '../src/server/prisma-service.ts');
const apiDir = path.join(__dirname, '../src/app/api');

if (!fs.existsSync(prismaServicePath)) {
  console.error('❌ Fichier prisma-service.ts introuvable');
  process.exit(1);
}

const prismaServiceContent = fs.readFileSync(prismaServicePath, 'utf-8');

function extractDynamicModelsAndFunctions(content) {
  console.log('🔍 Extraction DYNAMIQUE des modèles et fonctions...');
  
  const result = {
    models: new Set(),
    allFunctions: new Set()
  };
  
  // Extraire TOUS les exports de fonctions
  const exportRegex = /export async function (\w+)\(/g;
  let match;
  
  while ((match = exportRegex.exec(content)) !== null) {
    const funcName = match[1];
    result.allFunctions.add(funcName);
    
    // Détecter les modèles depuis getAll[Model]s
    const getAllMatch = funcName.match(/^getAll(\w+)s$/);
    if (getAllMatch) {
      const modelName = getAllMatch[1];
      result.models.add(modelName);
      console.log(`  ✅ Modèle détecté: ${modelName}`);
    }
  }
  
  // Extraire aussi les alias exports
  const aliasRegex = /export const (\w+) = /g;
  while ((match = aliasRegex.exec(content)) !== null) {
    result.allFunctions.add(match[1]);
  }
  
  console.log(`📊 ${result.models.size} modèles, ${result.allFunctions.size} fonctions totales`);
  return { 
    models: Array.from(result.models), 
    allFunctions: Array.from(result.allFunctions) 
  };
}

function generateDynamicRouteContent(modelName, availableFunctions) {
  const camelModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const pluralModel = modelName.toLowerCase() + 's';
  
  // Détecter dynamiquement les fonctions disponibles pour ce modèle
  const functions = {
    getAll: availableFunctions.find(f => f === `getAll${modelName}s`) || availableFunctions.find(f => f === `get${pluralModel}`),
    getById: availableFunctions.find(f => f === `get${modelName}ById`),
    create: availableFunctions.find(f => f === `create${modelName}`) || availableFunctions.find(f => f === `add${modelName}`),
    update: availableFunctions.find(f => f === `update${modelName}`),
    delete: availableFunctions.find(f => f === `delete${modelName}`)
  };
  
  const imports = Object.values(functions).filter(Boolean);
  const importStatement = imports.length > 0 ? 
    `import {\n  ${imports.join(',\n  ')}\n} from '@/server/prisma-service';` : '';
  
  // ✅ CORRECTION MAJEURE - API Routes CÔTÉ SERVEUR (pas de "use client")
  return `import { NextRequest, NextResponse } from 'next/server';
${importStatement}

// API Route côté SERVEUR - Généré DYNAMIQUEMENT pour ${modelName}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id && ${functions.getById ? 'true' : 'false'}) {
      ${functions.getById ? `
      const ${camelModel} = await ${functions.getById}(id);
      if (!${camelModel}) {
        return NextResponse.json({ error: '${modelName} non trouvé' }, { status: 404 });
      }
      return NextResponse.json(${camelModel});` : 
      `return NextResponse.json({ error: 'getById non disponible' }, { status: 501 });`}
    } else if (${functions.getAll ? 'true' : 'false'}) {
      ${functions.getAll ? `
      const ${pluralModel} = await ${functions.getAll}();
      return NextResponse.json(${pluralModel});` :
      `return NextResponse.json({ error: 'getAll non disponible' }, { status: 501 });`}
    } else {
      return NextResponse.json({ error: 'Aucune fonction de lecture disponible' }, { status: 501 });
    }
  } catch (error) {
    console.error('Erreur GET /api/${pluralModel}:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  ${functions.create ? `
  try {
    const data = await request.json();
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    
    // Nettoyer les données (supprimer les champs auto-générés)
    const cleanData = { ...data };
    delete cleanData.id;
    delete cleanData.createdAt;
    delete cleanData.updatedAt;
    
    const new${modelName} = await ${functions.create}(cleanData);
    return NextResponse.json(new${modelName}, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/${pluralModel}:', error);
    return NextResponse.json({ 
      error: 'Erreur création',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }` : `
  return NextResponse.json({ error: 'Création non disponible pour ${modelName}' }, { status: 501 });`}
}

export async function PUT(request: NextRequest) {
  ${functions.update ? `
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID requis pour la mise à jour' }, { status: 400 });
    }
    
    const data = await request.json();
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    
    // Nettoyer les données
    const cleanData = { ...data };
    delete cleanData.id;
    delete cleanData.createdAt;
    delete cleanData.updatedAt;
    
    const updated${modelName} = await ${functions.update}(id, cleanData);
    return NextResponse.json(updated${modelName});
  } catch (error) {
    console.error('Erreur PUT /api/${pluralModel}:', error);
    return NextResponse.json({ 
      error: 'Erreur mise à jour',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }` : `
  return NextResponse.json({ error: 'Mise à jour non disponible pour ${modelName}' }, { status: 501 });`}
}

export async function DELETE(request: NextRequest) {
  ${functions.delete ? `
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID requis pour la suppression' }, { status: 400 });
    }
    
    await ${functions.delete}(id);
    return NextResponse.json({ 
      message: '${modelName} supprimé avec succès',
      id: id
    });
  } catch (error) {
    console.error('Erreur DELETE /api/${pluralModel}:', error);
    return NextResponse.json({ 
      error: 'Erreur suppression',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }` : `
  return NextResponse.json({ error: 'Suppression non disponible pour ${modelName}' }, { status: 501 });`}
}`;
}

function createDynamicApiRoutes(models, availableFunctions) {
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
    console.log(`📁 Répertoire créé: ${apiDir}`);
  }
  
  let routesCreated = 0;
  
  models.forEach(modelName => {
    const pluralModel = modelName.toLowerCase() + 's';
    const routeDir = path.join(apiDir, pluralModel);
    const routeFile = path.join(routeDir, 'route.ts');
    
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    
    const routeContent = generateDynamicRouteContent(modelName, availableFunctions);
    
    // ✅ VÉRIFIER SI LE FICHIER EXISTE DÉJÀ
    if (fs.existsSync(routeFile)) {
      const existingContent = fs.readFileSync(routeFile, 'utf-8');
      
      // Si le fichier contient des customisations (pas généré automatiquement)
      if (!existingContent.includes('// API Route côté SERVEUR - Généré DYNAMIQUEMENT')) {
        console.log(`⏭️  Route personnalisée préservée: /api/${pluralModel}`);
        return; // Ne pas écraser
      }
      
      console.log(`🔄 Route mise à jour: /api/${pluralModel} (SERVER-SIDE)`);
    } else {
      console.log(`✅ API Route créée: /api/${pluralModel} (SERVER-SIDE)`);
    }
    
    fs.writeFileSync(routeFile, routeContent, 'utf-8');
    routesCreated++;
  });
  
  return routesCreated;
}

function createApiUtils() {
  const utilsPath = path.join(__dirname, '../src/lib/api-utils.ts');
  
  const utilsContent = `'use client';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: string;
  status: number;
}

export class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }
  
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = \`\${this.baseUrl}\${endpoint}\`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error(\`API Error [\${response.status}] \${url}:\`, data);
      }
      
      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.error || 'Erreur inconnue',
        details: data.details,
        status: response.status,
      };
    } catch (error) {
      console.error('Network Error:', error);
      return {
        error: error instanceof Error ? error.message : 'Erreur réseau',
        status: 0,
      };
    }
  }
  
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }
  
  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

// Utilitaires pour debugging
export const debugApi = {
  logRequest: (method: string, url: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(\`🔍 API \${method} \${url}\`, data ? data : '');
    }
  },
  
  logResponse: (method: string, url: string, response: ApiResponse<any>) => {
    if (process.env.NODE_ENV === 'development') {
      const status = response.status;
      const emoji = status >= 200 && status < 300 ? '✅' : '❌';
      console.log(\`\${emoji} API \${method} \${url} [\${status}]\`, response.error || 'OK');
    }
  }
};`;

  fs.writeFileSync(utilsPath, utilsContent, 'utf-8');
  console.log(`✅ Utilitaires API créés avec debugging`);
}

try {
  const { models, allFunctions } = extractDynamicModelsAndFunctions(prismaServiceContent);
  
  if (models.length === 0) {
    console.error('❌ Aucun modèle trouvé dans prisma-service.ts');
    process.exit(1);
  }
  
  console.log(`🔍 ${models.length} modèles détectés: ${models.join(', ')}`);
  
  const routesCreated = createDynamicApiRoutes(models, allFunctions);
  createApiUtils();
  
  console.log(`\n🎉 Génération DYNAMIQUE terminée !`);
  console.log(`📊 ${routesCreated} API routes SERVER-SIDE créées automatiquement`);
  console.log(`✅ Toutes les routes utilisent Prisma côté SERVEUR (pas côté client)`);
  
} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}
