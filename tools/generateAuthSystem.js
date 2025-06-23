const fs = require('fs');
const path = require('path');

console.log('🔐 Génération AUTOMATIQUE du système d\'authentification...');

class AuthSystemGenerator {
  constructor() {
    this.typesPath = path.join(__dirname, '../src/lib/types.ts');
    this.contextDir = path.join(__dirname, '../src/context');
    this.apiDir = path.join(__dirname, '../src/app/api');
    
    this.ensureDirectories();
    this.userModel = this.detectUserModel();
  }
  
  ensureDirectories() {
    [this.contextDir, this.apiDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  // ====================================
  // DÉTECTION AUTOMATIQUE DU MODÈLE USER
  // ====================================
  
  detectUserModel() {
    console.log('🔍 Détection automatique du modèle User...');
    
    if (!fs.existsSync(this.typesPath)) {
      console.log('⚠️  types.ts introuvable');
      return null;
    }
    
    const content = fs.readFileSync(this.typesPath, 'utf-8');
    
    // Chercher les modèles qui pourraient être des utilisateurs
    const userPatterns = [
      /export\s+interface\s+(User)\s*\{([^}]+)\}/s,
      /export\s+interface\s+(Utilisateur)\s*\{([^}]+)\}/s,
      /export\s+interface\s+(Auth)\s*\{([^}]+)\}/s,
      /export\s+interface\s+(Account)\s*\{([^}]+)\}/s
    ];
    
    for (const pattern of userPatterns) {
      const match = content.match(pattern);
      if (match) {
        const modelName = match[1];
        const modelBody = match[2];
        const fields = this.parseUserFields(modelBody);
        
        console.log(`✅ Modèle User détecté: ${modelName}`);
        console.log(`📊 ${Object.keys(fields).length} champs analysés`);
        
        return {
          name: modelName,
          fields: fields,
          hasEmail: !!fields.email,
          hasPassword: !!(fields.password || fields.motDePasse || fields.pass),
          hasRole: !!fields.role,
          hasId: !!fields.id
        };
      }
    }
    
    console.log('❌ Aucun modèle User détecté');
    return null;
  }
  
  parseUserFields(modelBody) {
    const fields = {};
    const lines = modelBody.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'));
    
    lines.forEach(line => {
      const fieldMatch = line.match(/(\w+)(\??):\s*([^;,\n]+)/);
      if (fieldMatch) {
        const [, fieldName, optional, fieldType] = fieldMatch;
        fields[fieldName] = {
          type: fieldType.trim().replace(/[;,]$/, ''),
          optional: optional === '?',
          raw: line.trim()
        };
      }
    });
    
    return fields;
  }
  
  // ====================================
  // GÉNÉRATION AUTHCONTEXT INTELLIGENT
  // ====================================
  
  generateAuthContext() {
    console.log('📝 Génération AuthContext intelligent...');
    
    if (!this.userModel) {
      console.log('⚠️  Pas de modèle User - AuthContext générique');
      return this.generateGenericAuthContext();
    }
    
    const passwordField = this.userModel.fields.motDePasse ? 'motDePasse' : 'password';
    const userTypeName = this.userModel.name;
    
    const authContextContent = `'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Interface User générée automatiquement depuis ${userTypeName}
interface User {
  id: string | number;
  email: string;
  ${Object.entries(this.userModel.fields)
    .filter(([name]) => !['id', 'email', passwordField].includes(name))
    .map(([name, field]) => `${name}${field.optional ? '?' : ''}: ${field.type};`)
    .join('\n  ')}
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, userData?: Partial<User>) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialisation depuis localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse: password, action: 'login' })
      });
      
      const data = await response.json();
      
      if (!response.ok || data.error) {
        setError(data.error || 'Erreur de connexion');
        return false;
      }
      
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return true;
      }
      
      return false;
    } catch (error) {
      setError('Erreur de connexion');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, userData: Partial<User> = {}): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          motDePasse: password, 
          action: 'register',
          ...userData
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || data.error) {
        setError(data.error || 'Erreur d\\'inscription');
        return false;
      }
      
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return true;
      }
      
      return false;
    } catch (error) {
      setError('Erreur de connexion');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('auth_user');
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      register,
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;`;

    const authContextPath = path.join(this.contextDir, 'AuthContext.tsx');
    fs.writeFileSync(authContextPath, genericAuthContent);
    
    console.log(`✅ AuthContext générique généré: ${authContextPath}`);
    return authContextPath;
  }
  
  // ====================================
  // GÉNÉRATION API AUTH INTELLIGENTE
  // ====================================
  
  generateAuthApi() {
    console.log('🔗 Génération API Auth intelligente...');
    
    if (!this.userModel) {
      console.log('⚠️  Génération API Auth générique');
      return this.generateGenericAuthApi();
    }
    
    const passwordField = this.userModel.fields.motDePasse ? 'motDePasse' : 'password';
    const userModel = this.userModel.name.toLowerCase();
    
    const authApiContent = `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-service';

// API Auth générée automatiquement pour modèle ${this.userModel.name}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, ${passwordField}, action, ...userData } = body;
    
    if (!email || !${passwordField}) {
      return NextResponse.json({ 
        error: 'Email et mot de passe requis' 
      }, { status: 400 });
    }
    
    if (action === 'login') {
      // CONNEXION
      const user = await prisma.${userModel}.findUnique({
        where: { email: email }${this.generateIncludeClause()}
      });
      
      if (!user || user.${passwordField} !== ${passwordField}) {
        return NextResponse.json({ 
          error: 'Email ou mot de passe incorrect' 
        }, { status: 401 });
      }
      
      // Retourner sans mot de passe
      const { ${passwordField}: _, ...userWithoutPassword } = user;
      
      return NextResponse.json({ 
        user: userWithoutPassword,
        message: 'Connexion réussie'
      });
    }
    
    if (action === 'register') {
      // INSCRIPTION
      const existingUser = await prisma.${userModel}.findUnique({
        where: { email: email }
      });
      
      if (existingUser) {
        return NextResponse.json({ 
          error: 'Un utilisateur avec cet email existe déjà' 
        }, { status: 400 });
      }
      
      // Données par défaut + données fournies
      const defaultData = {
        email: email,
        ${passwordField}: ${passwordField},
        ${this.generateDefaultFields()}
      };
      
      const finalData = { ...defaultData, ...userData };
      
      const newUser = await prisma.${userModel}.create({
        data: finalData${this.generateIncludeClause()}
      });
      
      // Retourner sans mot de passe
      const { ${passwordField}: _, ...userWithoutPassword } = newUser;
      
      return NextResponse.json({ 
        user: userWithoutPassword,
        message: 'Inscription réussie'
      }, { status: 201 });
    }
    
    return NextResponse.json({ 
      error: 'Action non reconnue' 
    }, { status: 400 });
    
  } catch (error) {
    console.error('Erreur API auth:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Route GET pour vérifier le statut d'authentification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ 
        error: 'Email requis' 
      }, { status: 400 });
    }
    
    const user = await prisma.${userModel}.findUnique({
      where: { email: email },
      select: {
        id: true,
        email: true,
        ${Object.keys(this.userModel.fields)
          .filter(name => !['id', 'email', passwordField].includes(name))
          .map(name => `${name}: true`)
          .join(',\n        ')}
      }
    });
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Utilisateur non trouvé' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ user });
    
  } catch (error) {
    console.error('Erreur GET auth:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 });
  }
}`;

    const authApiPath = path.join(this.apiDir, 'auth', 'route.ts');
    
    // Créer le dossier auth s'il n'existe pas
    const authDir = path.join(this.apiDir, 'auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    fs.writeFileSync(authApiPath, authApiContent);
    console.log(`✅ API Auth générée: ${authApiPath}`);
    
    return authApiPath;
  }
  
  generateIncludeClause() {
    // Générer automatiquement les includes pour les relations
    const relations = Object.keys(this.userModel.fields).filter(field => 
      field.endsWith('Id') || 
      this.userModel.fields[field].type.includes('[]') ||
      ['host', 'client', 'role', 'profile'].includes(field.toLowerCase())
    );
    
    if (relations.length === 0) return '';
    
    const includes = relations.map(rel => {
      const fieldName = rel.replace(/Id$/, '');
      return `${fieldName}: true`;
    }).join(',\n        ');
    
    return `,\n        include: {\n        ${includes}\n        }`;
  }
  
  generateDefaultFields() {
    const defaults = [];
    
    Object.entries(this.userModel.fields).forEach(([name, field]) => {
      if (['id', 'email', 'password', 'motDePasse'].includes(name)) return;
      
      if (name === 'nom' && field.optional) {
        defaults.push('nom: email.split("@")[0]');
      } else if (name === 'role' && field.optional) {
        defaults.push('role: "user"');
      } else if (name === 'isActive' && field.type === 'boolean') {
        defaults.push('isActive: true');
      }
    });
    
    return defaults.join(',\n        ');
  }
  
  generateGenericAuthApi() {
    const genericAuthContent = `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-service';

// API Auth générique

export async function POST(request: NextRequest) {
  try {
    const { email, motDePasse, password, action } = await request.json();
    const finalPassword = motDePasse || password;
    
    if (!email || !finalPassword) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }
    
    if (action === 'login') {
      // Essayer différents modèles possibles
      let user = null;
      
      try {
        user = await prisma.user.findUnique({ where: { email } });
      } catch (e) {
        try {
          user = await prisma.utilisateur.findUnique({ where: { email } });
        } catch (e2) {
          console.log('Modèle user non trouvé');
        }
      }
      
      if (!user || (user.motDePasse !== finalPassword && user.password !== finalPassword)) {
        return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
      }
      
      const { motDePasse: _, password: __, ...userWithoutPassword } = user;
      return NextResponse.json({ user: userWithoutPassword, message: 'Connexion réussie' });
    }
    
    if (action === 'register') {
      const newUser = {
        email,
        motDePasse: finalPassword,
        nom: email.split('@')[0],
        role: 'user'
      };
      
      try {
        const created = await prisma.user.create({ data: newUser });
        const { motDePasse: _, ...userWithoutPassword } = created;
        return NextResponse.json({ user: userWithoutPassword, message: 'Inscription réussie' }, { status: 201 });
      } catch (error) {
        return NextResponse.json({ error: 'Erreur création utilisateur' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
    
  } catch (error) {
    console.error('Erreur API auth:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}`;

    const authApiPath = path.join(this.apiDir, 'auth', 'route.ts');
    const authDir = path.join(this.apiDir, 'auth');
    
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    fs.writeFileSync(authApiPath, genericAuthContent);
    console.log(`✅ API Auth générique générée: ${authApiPath}`);
    
    return authApiPath;
  }
  
  // ====================================
  // GÉNÉRATION MIDDLEWARE DE PROTECTION
  // ====================================
  
  generateMiddleware() {
    console.log('🛡️ Génération middleware de protection...');
    
    const middlewareContent = `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes protégées - ajoutez vos routes ici
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/profile',
  '/settings'
];

// Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/api/auth',
  '/api/status'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Vérifier si la route est publique
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Vérifier si la route est protégée
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (!isProtectedRoute) {
    return NextResponse.next();
  }
  
  // Vérifier l'authentification via header ou cookie
  const authHeader = request.headers.get('authorization');
  const authCookie = request.cookies.get('auth_token');
  
  if (!authHeader && !authCookie) {
    // Rediriger vers login si pas authentifié
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

// Configuration des routes à protéger
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - api/status (status routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|api/status|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};`;

    const middlewarePath = path.join(__dirname, '../middleware.ts');
    fs.writeFileSync(middlewarePath, middlewareContent);
    
    console.log(`✅ Middleware généré: ${middlewarePath}`);
    return middlewarePath;
  }
  
  // ====================================
  // INTERFACE PUBLIQUE
  // ====================================
  
  generateAuthSystem() {
    console.log('🚀 Génération complète du système d\'authentification...\n');
    
    const results = {
      userModel: this.userModel,
      authContext: null,
      authApi: null,
      middleware: null,
      success: false
    };
    
    try {
      // 1. Générer AuthContext
      results.authContext = this.generateAuthContext();
      
      // 2. Générer API Auth
      results.authApi = this.generateAuthApi();
      
      // 3. Générer Middleware
      results.middleware = this.generateMiddleware();
      
      results.success = true;
      
      console.log('\n✅ Système d\'authentification généré avec succès !');
      console.log('\n📋 Composants générés:');
      console.log(`   🔐 AuthContext: ${results.authContext}`);
      console.log(`   🔗 API Auth: ${results.authApi}`);
      console.log(`   🛡️ Middleware: ${results.middleware}`);
      
      if (this.userModel) {
        console.log(`\n📊 Basé sur le modèle: ${this.userModel.name}`);
        console.log(`   📧 Email: ${this.userModel.hasEmail ? '✅' : '❌'}`);
        console.log(`   🔑 Password: ${this.userModel.hasPassword ? '✅' : '❌'}`);
        console.log(`   👤 Role: ${this.userModel.hasRole ? '✅' : '❌'}`);
      } else {
        console.log('\n⚠️  Système générique généré (aucun modèle User détecté)');
      }
      
      console.log('\n🚀 Prochaines étapes:');
      console.log('   1. Wrapper votre app avec <AuthProvider>');
      console.log('   2. Utiliser useAuth() dans vos composants');
      console.log('   3. Tester les routes /api/auth');
      console.log('   4. Configurer les routes protégées dans middleware.ts');
      
    } catch (error) {
      console.error('❌ Erreur génération auth système:', error.message);
      results.success = false;
      results.error = error.message;
    }
    
    return results;
  }
}

// ====================================
// EXÉCUTION
// ====================================

function generateAuthSystem() {
  try {
    const generator = new AuthSystemGenerator();
    const results = generator.generateAuthSystem();
    
    if (results.success) {
      console.log('\n🎉 Système d\'authentification prêt !');
      return results;
    } else {
      console.error('❌ Échec génération système auth');
      return results;
    }
    
  } catch (error) {
    console.error('❌ Erreur critique:', error.message);
    throw error;
  }
}

// Exécution si script appelé directement
if (require.main === module) {
  generateAuthSystem();
}

module.exports = { AuthSystemGenerator, generateAuthSystem };

// ====================================
// FONCTIONS UTILITAIRES SUPPLÉMENTAIRES
// ====================================

function createLoginPage() {
  console.log('📄 Génération page de connexion...');
  
  const loginPageContent = `'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const { login, register, loading, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = isRegister 
      ? await register(email, password)
      : await login(email, password);
    
    if (success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegister ? 'Créer un compte' : 'Connexion'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Chargement...' : (isRegister ? 'S\\'inscrire' : 'Se connecter')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              className="text-indigo-600 hover:text-indigo-500"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\\'inscrire'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}`;

  const loginPagePath = path.join(__dirname, '../src/app/login/page.tsx');
  const loginDir = path.join(__dirname, '../src/app/login');
  
  if (!fs.existsSync(loginDir)) {
    fs.mkdirSync(loginDir, { recursive: true });
  }
  
  fs.writeFileSync(loginPagePath, loginPageContent);
  console.log(`✅ Page de connexion générée: ${loginPagePath}`);
  
  return loginPagePath;
}

function createDashboardPage() {
  console.log('📄 Génération page dashboard protégée...');
  
  const dashboardContent = `'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Bonjour, {user.email}</span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Bienvenue dans votre dashboard !
              </h2>
              <p className="text-gray-600 mb-4">
                Vous êtes connecté en tant que: {user.email}
              </p>
              {user.role && (
                <p className="text-gray-600 mb-4">
                  Rôle: {user.role}
                </p>
              )}
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                🎉 Système d\\'authentification fonctionnel !
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}`;

  const dashboardPath = path.join(__dirname, '../src/app/dashboard/page.tsx');
  const dashboardDir = path.join(__dirname, '../src/app/dashboard');
  
  if (!fs.existsSync(dashboardDir)) {
    fs.mkdirSync(dashboardDir, { recursive: true });
  }
  
  fs.writeFileSync(dashboardPath, dashboardContent);
  console.log(`✅ Page dashboard générée: ${dashboardPath}`);
  
  return dashboardPath;
}

function createRootLayout() {
  console.log('📄 Mise à jour du layout racine avec AuthProvider...');
  
  const layoutPath = path.join(__dirname, '../src/app/layout.tsx');
  
  // Vérifier si le layout existe déjà
  let existingLayout = '';
  if (fs.existsSync(layoutPath)) {
    existingLayout = fs.readFileSync(layoutPath, 'utf-8');
  }
  
  // Si AuthProvider déjà présent, ne pas écraser
  if (existingLayout.includes('AuthProvider')) {
    console.log('⏭️  AuthProvider déjà présent dans layout.tsx');
    return layoutPath;
  }
  
  const layoutContent = `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OrderSpot Pro',
  description: 'Application de gestion intelligente',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}`;

  fs.writeFileSync(layoutPath, layoutContent);
  console.log(`✅ Layout racine mis à jour: ${layoutPath}`);
  
  return layoutPath;
}

function createGlobalStyles() {
  console.log('🎨 Création des styles globaux de base...');
  
  const stylesPath = path.join(__dirname, '../src/app/globals.css');
  
  const stylesContent = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Styles de base pour l'authentification */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Utilitaires pour les formulaires */
.form-input {
  @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500;
}

.btn-primary {
  @apply inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500;
}

.btn-secondary {
  @apply inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500;
}

/* Animations de chargement */
.loading-spinner {
  @apply animate-spin rounded-full h-4 w-4 border-b-2 border-current;
}`;

  fs.writeFileSync(stylesPath, stylesContent);
  console.log(`✅ Styles globaux créés: ${stylesPath}`);
  
  return stylesPath;
}

function updatePackageJson() {
  console.log('📦 Mise à jour package.json avec dépendances auth...');
  
  const packagePath = path.join(__dirname, '../package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('⚠️  package.json introuvable');
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    
    // Ajouter les dépendances nécessaires si elles ne sont pas présentes
    const requiredDeps = {
      'next': '^14.0.0',
      'react': '^18.0.0',
      'react-dom': '^18.0.0',
      'tailwindcss': '^3.0.0',
      'autoprefixer': '^10.0.0',
      'postcss': '^8.0.0'
    };
    
    let updated = false;
    
    Object.entries(requiredDeps).forEach(([dep, version]) => {
      if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
        if (!packageJson.dependencies) packageJson.dependencies = {};
        packageJson.dependencies[dep] = version;
        updated = true;
        console.log(`  ➕ Ajouté: ${dep}@${version}`);
      }
    });
    
    if (updated) {
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      console.log('✅ package.json mis à jour');
    } else {
      console.log('⏭️  package.json déjà à jour');
    }
    
    return true;
  } catch (error) {
    console.log('⚠️  Erreur mise à jour package.json:', error.message);
    return false;
  }
}

// ====================================
// FONCTION PRINCIPALE AMÉLIORÉE
// ====================================

function generateCompleteAuthSystem() {
  console.log('🚀 Génération COMPLÈTE du système d\'authentification...\n');
  
  const generator = new AuthSystemGenerator();
  const results = generator.generateAuthSystem();
  
  if (results.success) {
    console.log('\n🎨 Génération des pages et composants supplémentaires...');
    
    // Générer les pages supplémentaires
    results.loginPage = createLoginPage();
    results.dashboardPage = createDashboardPage();
    results.rootLayout = createRootLayout();
    results.globalStyles = createGlobalStyles();
    
    // Mettre à jour package.json
    updatePackageJson();
    
    console.log('\n🎉 SYSTÈME D\'AUTHENTIFICATION COMPLET GÉNÉRÉ !');
    console.log('\n📋 Composants générés:');
    console.log(`   🔐 AuthContext: ${results.authContext}`);
    console.log(`   🔗 API Auth: ${results.authApi}`);
    console.log(`   🛡️ Middleware: ${results.middleware}`);
    console.log(`   📄 Page Login: ${results.loginPage}`);
    console.log(`   📄 Page Dashboard: ${results.dashboardPage}`);
    console.log(`   🎨 Layout racine: ${results.rootLayout}`);
    console.log(`   🎨 Styles globaux: ${results.globalStyles}`);
    
    console.log('\n🚀 SYSTÈME PRÊT À UTILISER:');
    console.log('   1. ✅ AuthProvider wrappé dans layout.tsx');
    console.log('   2. ✅ Page de connexion: /login');
    console.log('   3. ✅ Page protégée: /dashboard');
    console.log('   4. ✅ API auth: /api/auth');
    console.log('   5. ✅ Middleware de protection activé');
    console.log('   6. ✅ Styles Tailwind configurés');
    
    console.log('\n💡 TESTER LE SYSTÈME:');
    console.log('   npm run dev');
    console.log('   → Aller sur http://localhost:3000/dashboard');
    console.log('   → Sera redirigé vers /login');
    console.log('   → Créer un compte et se connecter');
    console.log('   → Accéder au dashboard protégé');
    
    if (results.userModel) {
      console.log(`\n📊 Basé sur le modèle: ${results.userModel.name}`);
      console.log(`   📧 Email: ${results.userModel.hasEmail ? '✅' : '❌'}`);
      console.log(`   🔑 Password: ${results.userModel.hasPassword ? '✅' : '❌'}`);
      console.log(`   👤 Role: ${results.userModel.hasRole ? '✅' : '❌'}`);
    }
  }
  
  return results;
}

// Mise à jour de l'export pour inclure la fonction complète
module.exports = { 
  AuthSystemGenerator, 
  generateAuthSystem, 
  generateCompleteAuthSystem 
};

// ====================================
// EXÉCUTION SI SCRIPT APPELÉ DIRECTEMENT
// ====================================

if (require.main === module) {
  const command = process.argv[2] || 'complete';
  
  console.log('🔐 GÉNÉRATION SYSTÈME AUTHENTIFICATION...\n');
  
  try {
    switch (command) {
      case 'complete':
      case 'full':
        console.log('🚀 Génération système complet...');
        generateCompleteAuthSystem();
        break;
        
      case 'basic':
        console.log('🔧 Génération système de base...');
        generateAuthSystem();
        break;
        
      case 'detect':
        console.log('🔍 Détection modèle User seulement...');
        const generator = new AuthSystemGenerator();
        if (generator.userModel) {
          console.log(`✅ Modèle User détecté: ${generator.userModel.name}`);
          console.log(`📊 Champs: ${Object.keys(generator.userModel.fields).join(', ')}`);
          console.log(`📧 Email: ${generator.userModel.hasEmail ? '✅' : '❌'}`);
          console.log(`🔑 Password: ${generator.userModel.hasPassword ? '✅' : '❌'}`);
          console.log(`👤 Role: ${generator.userModel.hasRole ? '✅' : '❌'}`);
        } else {
          console.log('❌ Aucun modèle User détecté');
        }
        break;
        
      case 'help':
      case '--help':
        console.log(`
🔐 Générateur de Système d'Authentification - Utilisation:

node generateAuthSystem.js [command]

Commandes disponibles:
  complete    - Génération complète (AuthContext + API + Pages + Styles)
  basic       - Génération de base (AuthContext + API seulement)
  detect      - Détection du modèle User seulement
  help        - Afficher cette aide

Exemples:
  node generateAuthSystem.js complete     # Système complet
  node generateAuthSystem.js basic        # Base seulement
  node generateAuthSystem.js detect       # Juste détecter le modèle

📋 Le système généré inclut:
  ✅ AuthContext intelligent basé sur votre modèle User
  ✅ API /auth avec login/register
  ✅ Middleware de protection des routes
  ✅ Pages login et dashboard (mode complete)
  ✅ Layout avec AuthProvider (mode complete)
  ✅ Styles Tailwind (mode complete)

🎯 Prérequis:
  - Fichier src/lib/types.ts avec interface User
  - Next.js configuré
  - Prisma configuré (pour l'API)
        `);
        break;
        
      default:
        console.error(`❌ Commande inconnue: ${command}`);
        console.log('💡 Utilisez "help" pour voir les commandes disponibles');
        process.exit(1);
    }
    
    console.log('\n✅ Génération système authentification terminée !');
    
  } catch (error) {
    console.error('\n❌ ERREUR lors de la génération:', error.message);
    console.error('Stack:', error.stack);
    
    console.log('\n🔍 Diagnostic:');
    console.log('- Vérifiez que src/lib/types.ts existe');
    console.log('- Vérifiez qu\'il contient une interface User/Utilisateur');
    console.log('- Vérifiez les permissions d\'écriture des dossiers');
    
    process.exit(1);
  }
}(() => {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Erreur parsing user sauvegardé:', error);
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          ${passwordField}: password, 
          action: 'login' 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || data.error) {
        setError(data.error || 'Erreur de connexion');
        return false;
      }
      
      if (data.user) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          ${Object.keys(this.userModel.fields)
            .filter(name => !['id', 'email', passwordField].includes(name))
            .map(name => `${name}: data.user.${name}`)
            .join(',\n          ')}
        };
        
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        return true;
      }
      
      setError('Réponse invalide du serveur');
      return false;
    } catch (error) {
      setError('Erreur de connexion réseau');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, userData: Partial<User> = {}): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          ${passwordField}: password, 
          action: 'register',
          ...userData
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || data.error) {
        setError(data.error || 'Erreur d\\'inscription');
        return false;
      }
      
      if (data.user) {
        const newUserData = {
          id: data.user.id,
          email: data.user.email,
          ${Object.keys(this.userModel.fields)
            .filter(name => !['id', 'email', passwordField].includes(name))
            .map(name => `${name}: data.user.${name}`)
            .join(',\n          ')}
        };
        
        setUser(newUserData);
        localStorage.setItem('auth_user', JSON.stringify(newUserData));
        return true;
      }
      
      setError('Réponse invalide du serveur');
      return false;
    } catch (error) {
      setError('Erreur de connexion réseau');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) {
      setError('Utilisateur non connecté');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(\`/api/users?id=\${user.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok || data.error) {
        setError(data.error || 'Erreur de mise à jour');
        return false;
      }
      
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      return true;
    } catch (error) {
      setError('Erreur de connexion réseau');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('auth_user');
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      register,
      logout,
      clearError,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook pour vérifier les rôles (si champ role existe)
${this.userModel.hasRole ? `
export function useRole() {
  const { user } = useAuth();
  
  const hasRole = (role: string | string[]) => {
    if (!user || !user.role) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role as string);
    }
    
    return user.role === role;
  };
  
  const isAdmin = () => hasRole(['admin', 'administrator']);
  const isUser = () => hasRole('user');
  
  return { hasRole, isAdmin, isUser, userRole: user?.role };
}
` : ''}

export default AuthContext;`;

    const authContextPath = path.join(this.contextDir, 'AuthContext.tsx');
    fs.writeFileSync(authContextPath, authContextContent);
    
    console.log(`✅ AuthContext généré: ${authContextPath}`);
    return authContextPath;
  }
  
  generateGenericAuthContext() {
    console.log('📝 Génération AuthContext générique...');
    
    const genericAuthContent = `'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string | number;
  email: string;
  nom?: string;
  role?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, userData?: Partial<User>) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse: password, action: 'login' })
      });
      
      const data = await response.json();
      
      if (!response.ok || data.error) {
        setError(data.error || 'Erreur de connexion');
        return false;
      }
      
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return true;
      }
      
      return false;
    } catch (error) {
      setError('Erreur de connexion');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, userData: Partial<User> = {}): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          motDePasse: password, 
          action: 'register',
          ...userData
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || data.error) {
        setError(data.error || 'Erreur d\\'inscription');
        return false;
      }
      
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return true;
      }
      
      return false;
    } catch (error) {
      setError('Erreur de connexion');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('auth_user');
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      register,
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;`