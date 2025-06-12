const fs = require('fs');
const path = require('path');

console.log('🔧 Génération des routes API Next.js...');

const prismaServicePath = path.join(__dirname, '../src/lib/prisma-service.ts');
const apiDir = path.join(__dirname, '../src/app/api');

// Vérifier que prisma-service.ts existe
if (!fs.existsSync(prismaServicePath)) {
  console.error('❌ Fichier prisma-service.ts introuvable');
  process.exit(1);
}

// Lire le contenu de prisma-service.ts
const prismaServiceContent = fs.readFileSync(prismaServicePath, 'utf-8');

// Extraire tous les modèles depuis les fonctions exportées
function extractModelsFromPrismaService(content) {
  console.log('🔍 Extraction des modèles depuis prisma-service.ts...');
  
  // Regex pour capturer les fonctions getAll[Model]s
  const getAllRegex = /export async function getAll(\w+)s\(\)/g;
  const models = new Set();
  let match;
  
  while ((match = getAllRegex.exec(content)) !== null) {
    const modelName = match[1];
    models.add(modelName);
    console.log(`  ✅ Modèle détecté: ${modelName}`);
  }
  
  return Array.from(models);
}

// Générer le contenu d'une route API
function generateRouteContent(modelName) {
  const camelModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const pluralModel = modelName.toLowerCase() + 's';
  
  return `import { NextRequest, NextResponse } from 'next/server';
import { 
  getAll${modelName}s,
  get${modelName}ById,
  create${modelName},
  update${modelName},
  delete${modelName}
} from '@/lib/prisma-service';

// GET /api/${pluralModel} - Récupérer tous les ${pluralModel}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      // Récupérer un ${camelModel} spécifique
      const ${camelModel} = await get${modelName}ById(id);
      if (!${camelModel}) {
        return NextResponse.json(
          { error: '${modelName} non trouvé' },
          { status: 404 }
        );
      }
      return NextResponse.json(${camelModel});
    } else {
      // Récupérer tous les ${pluralModel}
      const ${pluralModel} = await getAll${modelName}s();
      return NextResponse.json(${pluralModel});
    }
  } catch (error) {
    console.error('Erreur GET /api/${pluralModel}:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des ${pluralModel}' },
      { status: 500 }
    );
  }
}

// POST /api/${pluralModel} - Créer un nouveau ${camelModel}
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validation basique
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }
    
    const new${modelName} = await create${modelName}(data);
    return NextResponse.json(new${modelName}, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/${pluralModel}:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du ${camelModel}' },
      { status: 500 }
    );
  }
}

// PUT /api/${pluralModel} - Mettre à jour un ${camelModel}
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID requis pour la mise à jour' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }
    
    const updated${modelName} = await update${modelName}(id, data);
    return NextResponse.json(updated${modelName});
  } catch (error) {
    console.error('Erreur PUT /api/${pluralModel}:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du ${camelModel}' },
      { status: 500 }
    );
  }
}

// DELETE /api/${pluralModel} - Supprimer un ${camelModel}
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID requis pour la suppression' },
        { status: 400 }
      );
    }
    
    await delete${modelName}(id);
    return NextResponse.json(
      { message: '${modelName} supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur DELETE /api/${pluralModel}:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du ${camelModel}' },
      { status: 500 }
    );
  }
}`;
}

// Créer les répertoires et fichiers de routes
function createApiRoutes(models) {
  // Créer le répertoire api s'il n'existe pas
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
    console.log(`📁 Répertoire créé: ${apiDir}`);
  }
  
  let routesCreated = 0;
  
  models.forEach(modelName => {
    const pluralModel = modelName.toLowerCase() + 's';
    const routeDir = path.join(apiDir, pluralModel);
    const routeFile = path.join(routeDir, 'route.ts');
    
    // Créer le répertoire du modèle
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    
    // Générer le contenu de la route
    const routeContent = generateRouteContent(modelName);
    
    // Écrire le fichier
    fs.writeFileSync(routeFile, routeContent, 'utf-8');
    console.log(`✅ Route créée: /api/${pluralModel} → ${routeFile}`);
    routesCreated++;
  });
  
  return routesCreated;
}

// Créer un fichier utilitaire pour les appels API côté client
function createApiUtils() {
  const utilsPath = path.join(__dirname, '../src/lib/api-utils.ts');
  
  const utilsContent = `// Utilitaires pour les appels API côté client
// Généré automatiquement - Ne pas modifier manuellement

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
  
  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
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
  
  // Méthodes de convenance
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

// Instance par défaut
export const apiClient = new ApiClient();

// Fonctions spécialisées pour chaque modèle
export const api = {
  // Ces fonctions seront générées dynamiquement par generateReactHooks.js
};`;

  fs.writeFileSync(utilsPath, utilsContent, 'utf-8');
  console.log(`✅ Utilitaires API créés: ${utilsPath}`);
}

// Exécution principale
try {
  const models = extractModelsFromPrismaService(prismaServiceContent);
  
  if (models.length === 0) {
    console.error('❌ Aucun modèle trouvé dans prisma-service.ts');
    process.exit(1);
  }
  
  console.log(`🔍 ${models.length} modèles détectés: ${models.join(', ')}`);
  
  const routesCreated = createApiRoutes(models);
  createApiUtils();
  
  console.log(`\n🎉 Génération terminée avec succès !`);
  console.log(`📊 Résultats:`);
  console.log(`   - ${routesCreated} routes API créées`);
  console.log(`   - Utilitaires API générés`);
  console.log(`   - Répertoire: ${apiDir}`);
  
  console.log(`\n📋 Routes disponibles:`);
  models.forEach(model => {
    const plural = model.toLowerCase() + 's';
    console.log(`   - GET/POST /api/${plural}`);
    console.log(`   - GET/PUT/DELETE /api/${plural}?id=xxx`);
  });
  
} catch (error) {
  console.error('❌ Erreur lors de la génération des routes API:', error);
  process.exit(1);
}