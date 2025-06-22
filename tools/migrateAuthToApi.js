const fs = require('fs');
const path = require('path');

console.log('🔐 Migration authentification vers API...');

const authContextPath = path.join(__dirname, '../src/context/AuthContext.tsx');
const nextConfigPath = path.join(__dirname, '../next.config.js');

function createAuthContext() {
  console.log('📝 Création AuthContext avec API...');
  
  const authContextContent = `'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
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
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
      }
      
      setError('Réponse invalide du serveur');
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

  const contextDir = path.dirname(authContextPath);
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  fs.writeFileSync(authContextPath, authContextContent, 'utf-8');
  console.log('✅ AuthContext créé');
}

function updateNextConfig() {
  if (!fs.existsSync(nextConfigPath)) {
    console.log('⚠️  next.config.js non trouvé');
    return;
  }
  
  console.log('🔄 Nettoyage next.config.js...');
  
  let content = fs.readFileSync(nextConfigPath, 'utf-8');
  
  // Supprimer experimental.appDir
  content = content.replace(/experimental:\s*\{\s*appDir:\s*true\s*,?\s*\},?\s*/g, '');
  content = content.replace(/,\s*\}/g, '\n}');
  content = content.replace(/\{\s*,/g, '{');
  
  fs.writeFileSync(nextConfigPath, content, 'utf-8');
  console.log('✅ next.config.js nettoyé');
}

try {
  createAuthContext();
  updateNextConfig();
  console.log('✅ Migration auth terminée');
} catch (error) {
  console.error('❌ Erreur migration auth:', error.message);
  process.exit(1);
}
