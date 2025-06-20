const fs = require('fs');
const path = require('path');

console.log('🔧 Génération 100% DYNAMIQUE des routes API Next.js...');

const typesPath = path.join(__dirname, '../src/lib/types.ts');
const dataPath = path.join(__dirname, '../src/lib/data.ts');
const apiDir = path.join(__dirname, '../src/app/api');

function extractAllModelsFromTypes() {
  if (!fs.existsSync(typesPath)) {
    console.error('❌ types.ts introuvable');
    return [];
  }
  
  const content = fs.readFileSync(typesPath, 'utf-8');
  const models = [];
  
  const interfaceRegex = /export\s+interface\s+(\w+)\s*\{/g;
  let match;
  
  while ((match = interfaceRegex.exec(content)) !== null) {
    const modelName = match[1];
    models.push(modelName);
    console.log(`  ✅ Modèle API détecté: ${modelName}`);
  }
  
  return models;
}

function extractAvailableDataArrays() {
  if (!fs.existsSync(dataPath)) {
    console.warn('⚠️  data.ts introuvable - API sans données initiales');
    return new Map();
  }
  
  const content = fs.readFileSync(dataPath, 'utf-8');
  const dataArrays = new Map();
  
  // Détecter tous les patterns d'arrays de données
  const patterns = [
    /export\s+(?:let|const)\s+(\w+)InMemory\s*:\s*(\w+)\[\]/g,
    /export\s+(?:let|const)\s+(\w+)Data\s*:\s*(\w+)\[\]/g,
    /export\s+(?:let|const)\s+(\w+)\s*:\s*(\w+)\[\]/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const arrayName = match[1];
      const typeName = match[2];
      dataArrays.set(typeName, arrayName);
      console.log(`  📦 Array de données: ${arrayName} → ${typeName}`);
    }
  });
  
  return dataArrays;
}

function generateDynamicApiRoute(modelName) {
  const camelModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const pluralModel = modelName.toLowerCase() + 's';
  
  return `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-service';

// API Route 100% DYNAMIQUE pour ${modelName}
// Généré automatiquement depuis types.ts

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      // Récupérer un ${modelName} par ID
      const ${camelModel} = await prisma.${camelModel}.findUnique({ 
        where: { id: id }
      });
      
      if (!${camelModel}) {
        return NextResponse.json({ error: '${modelName} non trouvé' }, { status: 404 });
      }
      
      return NextResponse.json(${camelModel});
    } else {
      // Récupérer tous les ${pluralModel}
      const ${pluralModel} = await prisma.${camelModel}.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return NextResponse.json(${pluralModel});
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
    
    const new${modelName} = await prisma.${camelModel}.create({ 
      data: cleanData 
    });
    
    return NextResponse.json(new${modelName}, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/${pluralModel}:', error);
    return NextResponse.json({ 
      error: 'Erreur création',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
    
    const updated${modelName} = await prisma.${camelModel}.update({
      where: { id: id },
      data: cleanData
    });
    
    return NextResponse.json(updated${modelName});
  } catch (error) {
    console.error('Erreur PUT /api/${pluralModel}:', error);
    return NextResponse.json({ 
      error: 'Erreur mise à jour',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requis pour la suppression' }, { status: 400 });
    }
    
    await prisma.${camelModel}.delete({
      where: { id: id }
    });
    
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
  }
}`;
}

function createAuthApiRoute() {
  const authContent = `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-service';

// API Route d'authentification - Généré dynamiquement

export async function POST(request: NextRequest) {
  try {
    const { email, motDePasse, action } = await request.json();
    
    if (action === 'login') {
      // Connexion
      const user = await prisma.user.findUnique({
        where: { email: email },
        include: {
          host: true
        }
      });
      
      if (!user || user.motDePasse !== motDePasse) {
        return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
      }
      
      // Retourner les infos utilisateur sans le mot de passe
      const { motDePasse: _, ...userWithoutPassword } = user;
      
      return NextResponse.json({ 
        user: userWithoutPassword,
        message: 'Connexion réussie'
      });
    }
    
    if (action === 'register') {
      // Inscription
      const existingUser = await prisma.user.findUnique({
        where: { email: email }
      });
      
      if (existingUser) {
        return NextResponse.json({ error: 'Un utilisateur avec cet email existe déjà' }, { status: 400 });
      }
      
      const newUser = await prisma.user.create({
        data: {
          email: email,
          motDePasse: motDePasse,
          nom: email.split('@')[0], // Nom par défaut
          role: 'client' // Rôle par défaut
        }
      });
      
      const { motDePasse: _, ...userWithoutPassword } = newUser;
      
      return NextResponse.json({ 
        user: userWithoutPassword,
        message: 'Inscription réussie'
      }, { status: 201 });
    }
    
    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
    
  } catch (error) {
    console.error('Erreur API auth:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}`;

  return authContent;
}

function createStatusApiRoute() {
  const statusContent = `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-service';

// API Route de status - Généré dynamiquement

export async function GET(request: NextRequest) {
  try {
    // Test de connexion à la base de données
    await prisma.$queryRaw\`SELECT 1\`;
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      message: 'API fonctionnelle'
    });
  } catch (error) {
    console.error('Erreur status:', error);
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
}`;

  return statusContent;
}

function createAllApiRoutes(models) {
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
    console.log(`📁 Répertoire API créé: ${apiDir}`);
  }
  
  let routesCreated = 0;
  
  // Créer les routes pour chaque modèle
  models.forEach(modelName => {
    const pluralModel = modelName.toLowerCase() + 's';
    const routeDir = path.join(apiDir, pluralModel);
    const routeFile = path.join(routeDir, 'route.ts');
    
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    
    const routeContent = generateDynamicApiRoute(modelName);
    fs.writeFileSync(routeFile, routeContent, 'utf-8');
    
    console.log(`✅ API Route créée: /api/${pluralModel}`);
    routesCreated++;
  });
  
  // Créer la route d'authentification
  const authDir = path.join(apiDir, 'auth');
  const authFile = path.join(authDir, 'route.ts');
  
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  fs.writeFileSync(authFile, createAuthApiRoute(), 'utf-8');
  console.log(`✅ API Route créée: /api/auth`);
  routesCreated++;
  
  // Créer la route de status
  const statusDir = path.join(apiDir, 'status');
  const statusFile = path.join(statusDir, 'route.ts');
  
  if (!fs.existsSync(statusDir)) {
    fs.mkdirSync(statusDir, { recursive: true });
  }
  
  fs.writeFileSync(statusFile, createStatusApiRoute(), 'utf-8');
  console.log(`✅ API Route créée: /api/status`);
  routesCreated++;
  
  return routesCreated;
}

function createApiUtils() {
  const utilsPath = path.join(__dirname, '../src/lib/api-utils.ts');
  
  const utilsContent = `'use client';

// Utilitaires API - Généré automatiquement

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

// Fonction d'authentification
export async function authenticate(email: string, motDePasse: string, action: 'login' | 'register' = 'login') {
  return apiClient.post('/auth', { email, motDePasse, action });
}`;

  fs.writeFileSync(utilsPath, utilsContent, 'utf-8');
  console.log(`✅ Utilitaires API créés`);
}

try {
  const models = extractAllModelsFromTypes();
  const dataArrays = extractAvailableDataArrays();
  
  if (models.length === 0) {
    console.error('❌ Aucun modèle trouvé dans types.ts');
    process.exit(1);
  }
  
  console.log(`🔍 ${models.length} modèles détectés: ${models.join(', ')}`);
  console.log(`📦 ${dataArrays.size} arrays de données disponibles`);
  
  const routesCreated = createAllApiRoutes(models);
  createApiUtils();
  
  console.log(`\n🎉 Génération API 100% DYNAMIQUE terminée !`);
  console.log(`📊 ${routesCreated} routes API créées automatiquement`);
  console.log(`🎯 Toutes basées sur vos interfaces TypeScript !`);
  console.log(`\n📋 Routes créées:`);
  models.forEach(model => {
    console.log(`   - /api/${model.toLowerCase()}s (CRUD complet)`);
  });
  console.log(`   - /api/auth (authentification)`);
  console.log(`   - /api/status (health check)`);
  
} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}
