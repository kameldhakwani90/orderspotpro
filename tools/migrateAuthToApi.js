const fs = require('fs');
const path = require('path');

console.log('🔐 Migration DYNAMIQUE de l\'authentification vers API...');

const authContextPath = path.join(__dirname, '../src/context/AuthContext.tsx');
const loginPagePath = path.join(__dirname, '../src/app/login/page.tsx');

function updateAuthContext() {
  if (!fs.existsSync(authContextPath)) {
    console.warn('⚠️  AuthContext.tsx non trouvé - création automatique...');
    createAuthContext();
    return;
  }
  
  console.log('🔄 Mise à jour AuthContext pour utiliser l\'API...');
  
  let content = fs.readFileSync(authContextPath, 'utf-8');
  
  // Supprimer les imports de data statique
  content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"]@\/lib\/data['"];?\s*/g, '');
  content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"][^'"]*data['"];?\s*/g, '');
  
  // Ajouter l'import de l'API client
  if (!content.includes('api-utils')) {
    const firstImportIndex = content.indexOf('import');
    if (firstImportIndex !== -1) {
      content = content.slice(0, firstImportIndex) + 
               `import { authenticate, apiClient } from '@/lib/api-utils';\n` +
               content.slice(firstImportIndex);
    }
  }
  
  // Remplacer la logique de login statique par un appel API
  const loginFunctionPattern = /const\s+login\s*=\s*async\s*\([^)]*\)\s*=>\s*\{[^}]*\}/gs;
  const newLoginFunction = `const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authenticate(email, password, 'login');
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      if (response.data?.user) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return true;
      }
      
      setError('Réponse invalide du serveur');
      return false;
    } catch (error) {
      setError('Erreur de connexion');
      console.error('Erreur login:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }`;
  
  content = content.replace(loginFunctionPattern, newLoginFunction);
  
  // Remplacer la logique de register si elle existe
  const registerFunctionPattern = /const\s+register\s*=\s*async\s*\([^)]*\)\s*=>\s*\{[^}]*\}/gs;
  const newRegisterFunction = `const register = async (email: string, password: string, nom?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authenticate(email, password, 'register');
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      if (response.data?.user) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return true;
      }
      
      setError('Erreur lors de l\'inscription');
      return false;
    } catch (error) {
      setError('Erreur de connexion');
      console.error('Erreur register:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }`;
  
  if (content.includes('register')) {
    content = content.replace(registerFunctionPattern, newRegisterFunction);
  }
  
  fs.writeFileSync(authContextPath, content, 'utf-8');
  console.log('✅ AuthContext mis à jour pour utiliser l\'API');
}

function createAuthContext() {
  const authContextContent = `'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authenticate, apiClient } from '@/lib/api-utils';

// Interface utilisateur générée dynamiquement
interface User {
  id: string;
  email: string;
  nom: string;
  role: string;
  hostId?: string;
  host?: any;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, nom?: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restaurer l'utilisateur depuis le localStorage au démarrage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Erreur parsing user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authenticate(email, password, 'login');
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      if (response.data?.user) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return true;
      }
      
      setError('Réponse invalide du serveur');
      return false;
    } catch (error) {
      setError('Erreur de connexion');
      console.error('Erreur login:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, nom?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authenticate(email, password, 'register');
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      if (response.data?.user) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return true;
      }
      
      setError('Erreur lors de l\\'inscription');
      return false;
    } catch (error) {
      setError('Erreur de connexion');
      console.error('Erreur register:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('user');
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
}`;

  // Créer le répertoire context s'il n'existe pas
  const contextDir = path.dirname(authContextPath);
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  fs.writeFileSync(authContextPath, authContextContent, 'utf-8');
  console.log('✅ AuthContext créé avec connexion API');
}

function updateLoginPage() {
  if (!fs.existsSync(loginPagePath)) {
    console.warn('⚠️  Page de login non trouvée - création automatique...');
    createLoginPage();
    return;
  }
  
  console.log('🔄 Mise à jour de la page de login...');
  
  let content = fs.readFileSync(loginPagePath, 'utf-8');
  
  // Supprimer les imports de data statique
  content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"]@\/lib\/data['"];?\s*/g, '');
  content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"][^'"]*data['"];?\s*/g, '');
  
  // S'assurer qu'on utilise useAuth
  if (!content.includes('useAuth')) {
    const firstImportIndex = content.indexOf('import');
    if (firstImportIndex !== -1) {
      content = content.slice(0, firstImportIndex) + 
               `import { useAuth } from '@/context/AuthContext';\n` +
               content.slice(firstImportIndex);
    }
  }
  
  // Remplacer la logique de soumission statique
  const submitHandlerPattern = /const\s+handleSubmit\s*=\s*async\s*\([^)]*\)\s*=>\s*\{[^}]*\}/gs;
  const newSubmitHandler = `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    const success = await login(email, password);
    
    if (success) {
      router.push('/dashboard');
    }
    // L'erreur est gérée automatiquement par le contexte Auth
  }`;
  
  if (submitHandlerPattern.test(content)) {
    content = content.replace(submitHandlerPattern, newSubmitHandler);
  }
  
  // S'assurer qu'on utilise les bonnes variables du contexte
  if (!content.includes('const { login, error, loading }')) {
    content = content.replace(
      /const\s*\{[^}]*\}\s*=\s*useAuth\(\);?/,
      'const { login, error, loading, clearError } = useAuth();'
    );
  }
  
  fs.writeFileSync(loginPagePath, content, 'utf-8');
  console.log('✅ Page de login mise à jour pour utiliser l\'API');
}

function createLoginPage() {
  const loginPageContent = `'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  
  const { login, register, error, loading, clearError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    clearError();
  }, [isRegister, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }
    
    let success = false;
    
    if (isRegister) {
      success = await register(email, password);
    } else {
      success = await login(email, password);
    }
    
    if (success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegister ? 'Créer un compte' : 'Se connecter'}
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Chargement...' : (isRegister ? 'S\\'inscrire' : 'Se connecter')}
            </button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-blue-600 hover:text-blue-500"
            >
              {isRegister ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\\'inscrire'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}`;

  // Créer le répertoire login s'il n'existe pas
  const loginDir = path.dirname(loginPagePath);
  if (!fs.existsSync(loginDir)) {
    fs.mkdirSync(loginDir, { recursive: true });
  }

  fs.writeFileSync(loginPagePath, loginPageContent, 'utf-8');
  console.log('✅ Page de login créée avec connexion API');
}

function updateNextConfig() {
  const nextConfigPath = path.join(__dirname, '../next.config.js');
  
  if (!fs.existsSync(nextConfigPath)) {
    console.warn('⚠️  next.config.js non trouvé');
    return;
  }
  
  console.log('🔄 Mise à jour de next.config.js...');
  
  let content = fs.readFileSync(nextConfigPath, 'utf-8');
  
  // Supprimer la partie experimental: { appDir: true } si elle existe
  content = content.replace(/experimental:\s*\{\s*appDir:\s*true\s*,?\s*\},?\s*/g, '');
  
  // Nettoyer les virgules orphelines
  content = content.replace(/,\s*\}/g, '\n}');
  content = content.replace(/\{\s*,/g, '{');
  
  fs.writeFileSync(nextConfigPath, content, 'utf-8');
  console.log('✅ next.config.js nettoyé (experimental.appDir supprimé)');
}

// ====================================
// EXÉCUTION PRINCIPALE
// ====================================

try {
  console.log('🚀 Début de la migration auth vers API...');
  
  updateAuthContext();
  updateLoginPage();
  updateNextConfig();
  
  console.log('\n✅ Migration auth terminée avec succès !');
  console.log('📋 Actions effectuées:');
  console.log('   ✓ AuthContext migré vers API');
  console.log('   ✓ Page de login mise à jour');
  console.log('   ✓ next.config.js nettoyé');
  console.log('🔐 L\'authentification utilise maintenant l\'API !');
  
} catch (error) {
  console.error('❌ Erreur migration auth:', error.message);
  process.exit(1);
}
