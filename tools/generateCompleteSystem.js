const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 DÉMARRAGE - Génération SYSTÈME COMPLET 100% DYNAMIQUE');

// ====================================
// VALIDATION PRÉALABLE
// ====================================

function validateSourceFiles() {
  console.log('🔍 Validation des fichiers source...');
  
  const requiredFiles = [
    { path: 'src/lib/types.ts', description: 'Interfaces TypeScript' },
    { path: 'src/lib/data.ts', description: 'Données de test' }
  ];
  
  let allValid = true;
  
  requiredFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file.path);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Fichier manquant: ${file.path} (${file.description})`);
      allValid = false;
    } else {
      console.log(`✅ ${file.path}`);
    }
  });
  
  if (!allValid) {
    console.error('❌ Fichiers source manquants - Arrêt du processus');
    process.exit(1);
  }
  
  console.log('✅ Tous les fichiers source sont présents');
}

function runScript(scriptName, description) {
  console.log(`\n🔧 ${description}...`);
  
  const scriptPath = path.join(__dirname, scriptName);
  
  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ Script manquant: ${scriptName}`);
    process.exit(1);
  }
  
  try {
    execSync(`node ${scriptPath}`, { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log(`✅ ${description} terminé`);
  } catch (error) {
    console.error(`❌ Erreur pendant : ${description}`);
    console.error(`Script: ${scriptName}`);
    console.error(`Erreur: ${error.message}`);
    process.exit(1);
  }
}

function createSimpleAuthMigration() {
  const authContextPath = path.join(__dirname, '../src/context/AuthContext.tsx');
  const nextConfigPath = path.join(__dirname, '../next.config.js');
  
  // Créer le répertoire context s'il n'existe pas
  const contextDir = path.dirname(authContextPath);
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }
  
  // Contenu AuthContext simple
  const authContent = "'use client';\n\nimport React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';\n\ninterface User {\n  id: string;\n  email: string;\n  nom: string;\n  role: string;\n  hostId?: string;\n  host?: any;\n  [key: string]: any;\n}\n\ninterface AuthContextType {\n  user: User | null;\n  loading: boolean;\n  error: string | null;\n  login: (email: string, password: string) => Promise<boolean>;\n  logout: () => void;\n  clearError: () => void;\n}\n\nconst AuthContext = createContext<AuthContextType | undefined>(undefined);\n\nexport function AuthProvider({ children }: { children: ReactNode }) {\n  const [user, setUser] = useState<User | null>(null);\n  const [loading, setLoading] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n\n  useEffect(() => {\n    const savedUser = localStorage.getItem('user');\n    if (savedUser) {\n      try {\n        setUser(JSON.parse(savedUser));\n      } catch (error) {\n        localStorage.removeItem('user');\n      }\n    }\n  }, []);\n\n  const login = async (email: string, password: string) => {\n    try {\n      setLoading(true);\n      setError(null);\n      \n      const response = await fetch('/api/auth', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ email, motDePasse: password, action: 'login' })\n      });\n      \n      const data = await response.json();\n      \n      if (!response.ok || data.error) {\n        setError(data.error || 'Erreur de connexion');\n        return false;\n      }\n      \n      if (data.user) {\n        setUser(data.user);\n        localStorage.setItem('user', JSON.stringify(data.user));\n        return true;\n      }\n      \n      setError('Réponse invalide du serveur');\n      return false;\n    } catch (error) {\n      setError('Erreur de connexion');\n      return false;\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  const logout = () => {\n    setUser(null);\n    setError(null);\n    localStorage.removeItem('user');\n  };\n\n  const clearError = () => {\n    setError(null);\n  };\n\n  return (\n    <AuthContext.Provider value={{\n      user,\n      loading,\n      error,\n      login,\n      logout,\n      clearError\n    }}>\n      {children}\n    </AuthContext.Provider>\n  );\n}\n\nexport function useAuth() {\n  const context = useContext(AuthContext);\n  if (context === undefined) {\n    throw new Error('useAuth must be used within an AuthProvider');\n  }\n  return context;\n}";
  
  fs.writeFileSync(authContextPath, authContent, 'utf-8');
  console.log('✅ AuthContext créé avec API');
  
  // Nettoyer next.config.js
  if (fs.existsSync(nextConfigPath)) {
    let content = fs.readFileSync(nextConfigPath, 'utf-8');
    content = content.replace(/experimental:\s*\{\s*appDir:\s*true\s*,?\s*\},?\s*/g, '');
    content = content.replace(/,\s*\}/g, '\n}');
    fs.writeFileSync(nextConfigPath, content, 'utf-8');
    console.log('✅ next.config.js nettoyé');
  }
}

function createMissingDirectories() {
  console.log('📁 Création des répertoires nécessaires...');
  
  const directories = [
    'prisma',
    'src/app/api',
    'src/context',
    'src/hooks',
    'src/lib'
  ];
  
  directories.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`  📁 Créé: ${dir}`);
    }
  });
}

function createMigrateAuthScript() {
  console.log('📝 Création du script migrateAuthToApi.js...');
  
  const scriptContent = `const fs = require('fs');
const path = require('path');

console.log('🔐 Migration DYNAMIQUE de l\\'authentification vers API...');

const authContextPath = path.join(__dirname, '../src/context/AuthContext.tsx');
const loginPagePath = path.join(__dirname, '../src/app/login/page.tsx');

function updateAuthContext() {
  if (!fs.existsSync(authContextPath)) {
    console.warn('⚠️  AuthContext.tsx non trouvé - création automatique...');
    createAuthContext();
    return;
  }
  
  console.log('🔄 Mise à jour AuthContext pour utiliser l\\'API...');
  
  let content = fs.readFileSync(authContextPath, 'utf-8');
  
  // Supprimer les imports de data statique
  content = content.replace(/import\\s+\\{[^}]*\\}\\s+from\\s+['"]@\\/lib\\/data['"];?\\s*/g, '');
  content = content.replace(/import\\s+\\{[^}]*\\}\\s+from\\s+['"][^'"]*data['"];?\\s*/g, '');
  
  // Ajouter l'import de l'API client
  if (!content.includes('api-utils')) {
    const firstImportIndex = content.indexOf('import');
    if (firstImportIndex !== -1) {
      content = content.slice(0, firstImportIndex) + 
               "import { authenticate, apiClient } from '@/lib/api-utils';\\n" +
               content.slice(firstImportIndex);
    }
  }
  
  fs.writeFileSync(authContextPath, content, 'utf-8');
  console.log('✅ AuthContext mis à jour pour utiliser l\\'API');
}

function createAuthContext() {
  const authContextContent = \\`'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authenticate, apiClient } from '@/lib/api-utils';

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
}\\`;

  const contextDir = path.dirname(authContextPath);
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  fs.writeFileSync(authContextPath, authContextContent, 'utf-8');
  console.log('✅ AuthContext créé avec connexion API');
}

try {
  updateAuthContext();
  console.log('✅ Migration auth terminée');
} catch (error) {
  console.error('❌ Erreur migration auth:', error.message);
  process.exit(1);
}`;

  const scriptPath = path.join(__dirname, 'migrateAuthToApi.js');
  fs.writeFileSync(scriptPath, scriptContent, 'utf-8');
  console.log('✅ Script migrateAuthToApi.js créé');
}

function setupEnvironmentVariables() {
  console.log('🔧 Configuration des variables d\'environnement...');
  
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  let envContent = '';
  
  // Lire .env.example s'il existe
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf-8');
  }
  
  // Ajouter DATABASE_URL si pas présent
  if (!envContent.includes('DATABASE_URL')) {
    envContent += '\n# Base de données PostgreSQL\n';
    envContent += 'DATABASE_URL="postgresql://orderspot_user:orderspot_pass@orderspot_postgres:5432/orderspot_db?schema=public"\n';
  }
  
  // Ajouter NEXTAUTH_SECRET si pas présent
  if (!envContent.includes('NEXTAUTH_SECRET')) {
    envContent += '\n# Secret pour l\'authentification\n';
    envContent += 'NEXTAUTH_SECRET="your-secret-key-here"\n';
  }
  
  // Créer .env s'il n'existe pas
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('✅ Fichier .env créé');
  } else {
    console.log('⏭️  Fichier .env existe déjà');
  }
}

// ====================================
// EXÉCUTION SÉQUENTIELLE DES SCRIPTS
// ====================================

try {
  console.log('=' * 60);
  console.log('🚀 GÉNÉRATION SYSTÈME COMPLET - 100% DYNAMIQUE');
  console.log('=' * 60);
  
  // PHASE 0 - Préparation
  validateSourceFiles();
  createMissingDirectories();
  setupEnvironmentVariables();
  
  console.log('\n📋 Plan d\'exécution:');
  console.log('  1. Génération schema Prisma (dynamique)');
  console.log('  2. Génération service Prisma (dynamique)');
  console.log('  3. Génération routes API (dynamique)');
  console.log('  4. Migration authentification vers API');
  console.log('  5. Génération hooks React (dynamique)');
  console.log('  6. Migration composants vers hooks');
  console.log('  7. Migration data vers prisma-service');
  console.log('  8. Validation finale\n');
  
  // PHASE 1 - Génération Prisma (BASE)
  runScript('generatePrismaSchema.js', 'Génération schema Prisma DYNAMIQUE');
  runScript('generatePrismaServiceFromData.js', 'Génération service Prisma DYNAMIQUE');
  
  // PHASE 2 - Génération API
  runScript('generateApiRoutes.js', 'Génération routes API DYNAMIQUES');
  
  // PHASE 3 - Migration Auth - Solution simple
  console.log('\n🔐 Migration authentification vers API...');
  createSimpleAuthMigration();
  
  // PHASE 4 - Hooks et Components
  runScript('generateReactHooks.js', 'Génération hooks React DYNAMIQUES');
  runScript('migrateComponentsToHooks.js', 'Migration composants vers hooks');
  
  // PHASE 5 - Migration données
  runScript('migrateDataToPrisma.js', 'Migration imports data vers prisma-service');
  
  // PHASE 6 - Nettoyage et organisation
  if (fs.existsSync(path.join(__dirname, 'fixPrismaServiceLocation.js'))) {
    runScript('fixPrismaServiceLocation.js', 'Organisation fichiers Prisma');
  }
  
  // PHASE 7 - Validation finale
  console.log('\n🔍 Validation du système généré...');
  
  const generatedFiles = [
    'prisma/schema.prisma',
    'src/lib/prisma-service.ts',
    'src/app/api/users/route.ts',
    'src/app/api/auth/route.ts',
    'src/lib/api-utils.ts'
  ];
  
  let allGenerated = true;
  generatedFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
    } else {
      console.error(`❌ Manquant: ${file}`);
      allGenerated = false;
    }
  });
  
  if (!allGenerated) {
    console.error('❌ Certains fichiers n\'ont pas été générés correctement');
    process.exit(1);
  }
  
  console.log('\n' + '=' * 60);
  console.log('🎉 SYSTÈME COMPLET GÉNÉRÉ AVEC SUCCÈS !');
  console.log('=' * 60);
  
  console.log('\n📊 Résumé de la génération:');
  console.log('✅ Schema Prisma généré DYNAMIQUEMENT depuis types.ts');
  console.log('✅ Service Prisma avec CRUD complet pour tous les modèles');
  console.log('✅ Routes API Next.js pour tous les modèles détectés');
  console.log('✅ Authentification migrée vers API');
  console.log('✅ Hooks React générés pour tous les modèles');
  console.log('✅ Composants migrés vers hooks automatiquement');
  console.log('✅ Imports data.ts migrés vers prisma-service.ts');
  
  console.log('\n🚀 Prochaines étapes:');
  console.log('1. npm install (si pas déjà fait)');
  console.log('2. Démarrer PostgreSQL');
  console.log('3. npx prisma db push');
  console.log('4. npm run dev');
  
  console.log('\n💡 Le système est 100% dynamique et s\'adaptera automatiquement');
  console.log('   à tous les futurs changements dans types.ts !');
  
} catch (error) {
  console.error('\n❌ ERREUR CRITIQUE dans generateCompleteSystem:');
  console.error(`Message: ${error.message}`);
  console.error(`Stack: ${error.stack}`);
  process.exit(1);
}
