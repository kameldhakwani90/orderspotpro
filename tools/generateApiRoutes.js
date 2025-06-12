const fs = require('fs');
const path = require('path');

console.log('🔧 Génération DYNAMIQUE des routes API Next.js...');

const prismaServicePath = path.join(__dirname, '../src/lib/prisma-service.ts');
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
    getAll: availableFunctions.find(f => f === `getAll${modelName}s`),
    getById: availableFunctions.find(f => f === `get${modelName}ById`),
    create: availableFunctions.find(f => f === `create${modelName}`),
    update: availableFunctions.find(f => f === `update${modelName}`),
    delete: availableFunctions.find(f => f === `delete${modelName}`)
  };
  
  const imports = Object.values(functions).filter(Boolean);
  const importStatement = imports.length > 0 ? 
    `import {\n  ${imports.join(',\n  ')}\n} from '@/lib/prisma-service';` : '';
  
  return `import { NextRequest, NextResponse } from 'next/server';
${importStatement}

// Routes API générées DYNAMIQUEMENT pour ${modelName}

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
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  ${functions.create ? `
  try {
    const data = await request.json();
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    const new${modelName} = await ${functions.create}(data);
    return NextResponse.json(new${modelName}, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/${pluralModel}:', error);
    return NextResponse.json({ error: 'Erreur création' }, { status: 500 });
  }` : `
  return NextResponse.json({ error: 'create non disponible' }, { status: 501 });`}
}

export async function PUT(request: NextRequest) {
  ${functions.update ? `
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }
    const data = await request.json();
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    const updated${modelName} = await ${functions.update}(id, data);
    return NextResponse.json(updated${modelName});
  } catch (error) {
    console.error('Erreur PUT /api/${pluralModel}:', error);
    return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 });
  }` : `
  return NextResponse.json({ error: 'update non disponible' }, { status: 501 });`}
}

export async function DELETE(request: NextRequest) {
  ${functions.delete ? `
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }
    await ${functions.delete}(id);
    return NextResponse.json({ message: '${modelName} supprimé' });
  } catch (error) {
    console.error('Erreur DELETE /api/${pluralModel}:', error);
    return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 });
  }` : `
  return NextResponse.json({ error: 'delete non disponible' }, { status: 501 });`}
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
    fs.writeFileSync(routeFile, routeContent, 'utf-8');
    console.log(`✅ Route créée: /api/${pluralModel}`);
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
      
      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.error || 'Erreur inconnue',
        status: response.status,
      };
    } catch (error) {
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

export const apiClient = new ApiClient();`;

  fs.writeFileSync(utilsPath, utilsContent, 'utf-8');
  console.log(`✅ Utilitaires API créés`);
}

try {
  const { models, allFunctions } = extractDynamicModelsAndFunctions(prismaServiceContent);
  
  if (models.length === 0) {
    console.error('❌ Aucun modèle trouvé');
    process.exit(1);
  }
  
  console.log(`🔍 ${models.length} modèles détectés: ${models.join(', ')}`);
  
  const routesCreated = createDynamicApiRoutes(models, allFunctions);
  createApiUtils();
  
  console.log(`\n🎉 Génération DYNAMIQUE terminée !`);
  console.log(`📊 ${routesCreated} routes API créées automatiquement`);
  
} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}
