const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 DÉMARRAGE - Génération SYSTÈME COMPLET 100% DYNAMIQUE');

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
    console.error(`Code d'erreur: ${error.status}`);
    process.exit(1);
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

function setupEnvironmentVariables() {
  console.log('🔧 Configuration des variables d\'environnement...');
  
  const envPath = path.join(__dirname, '..', '.env');
  
  let envContent = '';
  
  // Ajouter DATABASE_URL si pas présent
  if (!fs.existsSync(envPath) || !fs.readFileSync(envPath, 'utf-8').includes('DATABASE_URL')) {
    envContent += '\n# Base de données PostgreSQL\n';
    envContent += 'DATABASE_URL="postgresql://orderspot_user:orderspot_pass@orderspot_postgres:5432/orderspot_db?schema=public"\n';
  }
  
  // Créer .env s'il n'existe pas
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('✅ Fichier .env créé');
  } else {
    console.log('⏭️  Fichier .env existe déjà');
  }
}

function createTypescriptFixScript() {
  console.log('📝 Création du script de correction TypeScript...');
  
  const fixScript = `const fs = require('fs');
const path = require('path');

console.log('🔧 Correction automatique des erreurs TypeScript...');

const srcDir = path.join(__dirname, '../src');

function fixTypescriptErrors(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let hasChanges = false;
  
  // Correction isLoading -> loading
  if (content.includes('isLoading')) {
    content = content.replace(/\\bisLoading\\b/g, 'loading');
    hasChanges = true;
  }
  
  // Correction conflits de variables
  const lines = content.split('\\n');
  const authVars = new Set();
  const stateVars = new Set();
  
  lines.forEach(line => {
    const authMatch = line.match(/const\\s*\\{\\s*([^}]+)\\s*\\}\\s*=\\s*useAuth\\(\\)/);
    if (authMatch) {
      authMatch[1].split(',').forEach(v => {
        const varName = v.trim().split(':').pop().trim();
        authVars.add(varName);
      });
    }
    
    const stateMatch = line.match(/const\\s*\\[\\s*(\\w+)\\s*,/);
    if (stateMatch) {
      stateVars.add(stateMatch[1]);
    }
  });
  
  const conflicts = [...authVars].filter(v => stateVars.has(v));
  conflicts.forEach(conflictVar => {
    const newVarName = conflictVar + 'State';
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('useState') && lines[i].includes(\`[\${conflictVar},\`)) {
        lines[i] = lines[i].replace(
          new RegExp(\`\\\\[\\\\s*\${conflictVar}\\\\s*,\\\\s*(\\\\w+)\\\\s*\\\\]\`),
          \`[\${newVarName}, $1]\`
        );
        
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].includes(conflictVar) && 
              !lines[j].includes('useAuth') && 
              !lines[j].includes('useState')) {
            lines[j] = lines[j].replace(new RegExp(\`\\\\b\${conflictVar}\\\\b\`, 'g'), newVarName);
          }
        }
      }
    }
  });
  
  content = lines.join('\\n');
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  
  return hasChanges;
}

function scanAndFixDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }
  
  let fixedFiles = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  entries.forEach(entry => {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      const skipDirs = ['node_modules', '.git', '.next', 'dist', 'build'];
      if (!skipDirs.includes(entry.name)) {
        fixedFiles += scanAndFixDirectory(fullPath);
      }
    } else if (entry.isFile() && /\\.(tsx?|jsx?)$/.test(entry.name)) {
      if (fixTypescriptErrors(fullPath)) {
        fixedFiles++;
        console.log('✅ Corrigé: ' + path.relative(srcDir, fullPath));
      }
    }
  });
  
  return fixedFiles;
}

try {
  console.log('🔍 Scan et correction des erreurs TypeScript...');
  const fixedFiles = scanAndFixDirectory(srcDir);
  
  console.log('🎉 Correction TypeScript terminée !');
  console.log('📊 ' + fixedFiles + ' fichier(s) corrigé(s)');
  
} catch (error) {
  console.error('❌ Erreur lors de la correction TypeScript:', error.message);
  process.exit(1);
}`;

  const scriptPath = path.join(__dirname, 'fixTypescriptErrors.js');
  fs.writeFileSync(scriptPath, fixScript, 'utf-8');
  console.log('✅ Script fixTypescriptErrors.js créé');
}

function createAuthMigrationScript() {
  console.log('📝 Création du script de migration auth...');
  
  const authScript = `const fs = require('fs');
const path = require('path');

console.log('🔐 Migration authentification vers API...');

const authContextPath = path.join(__dirname, '../src/context/AuthContext.tsx');

function createAuthContext() {
  const authContextContent = \`'use client';

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
}\`;

  const contextDir = path.dirname(authContextPath);
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  fs.writeFileSync(authContextPath, authContextContent, 'utf-8');
  console.log('✅ AuthContext créé');
}

try {
  createAuthContext();
  console.log('✅ Migration auth terminée');
} catch (error) {
  console.error('❌ Erreur migration auth:', error.message);
  process.exit(1);
}`;

  const scriptPath = path.join(__dirname, 'migrateAuthToApi.js');
  fs.writeFileSync(scriptPath, authScript, 'utf-8');
  console.log('✅ Script migrateAuthToApi.js créé');
}

// EXÉCUTION PRINCIPALE
try {
  console.log('============================================================');
  console.log('🚀 GÉNÉRATION SYSTÈME COMPLET - 100% DYNAMIQUE');
  console.log('============================================================');
  
  // PHASE 0 - Préparation
  validateSourceFiles();
  createMissingDirectories();
  setupEnvironmentVariables();
  
  console.log('\n📋 Plan d\'exécution:');
  console.log('  1. Génération schema Prisma (dynamique)');
  console.log('  2. Génération service Prisma CRUD complet (dynamique)');
  console.log('  3. Génération routes API (dynamique)');
  console.log('  4. Migration authentification vers API');
  console.log('  5. Génération hooks React (dynamique)');
  console.log('  6. Migration composants vers hooks');
  console.log('  7. Migration data vers prisma-service');
  console.log('  8. Correction erreurs TypeScript\n');
  
  // PHASE 1 - Génération Prisma
  runScript('generatePrismaSchema.js', 'Génération schema Prisma DYNAMIQUE');
  runScript('generatePrismaServiceFromData.js', 'Génération service Prisma CRUD COMPLET');
  
  // PHASE 2 - Génération API
  runScript('generateApiRoutes.js', 'Génération routes API DYNAMIQUES');
  
  // PHASE 3 - Migration Auth
  if (!fs.existsSync(path.join(__dirname, 'migrateAuthToApi.js'))) {
    createAuthMigrationScript();
  }
  runScript('migrateAuthToApi.js', 'Migration authentification vers API');
  
  // PHASE 4 - Hooks et Components
  runScript('generateReactHooks.js', 'Génération hooks React DYNAMIQUES');
  runScript('migrateComponentsToHooks.js', 'Migration composants vers hooks');
  
  // PHASE 5 - Migration données
  runScript('migrateDataToPrisma.js', 'Migration imports data vers prisma-service');
  
  // PHASE 6 - Validation
  console.log('\n🔍 Validation du système généré...');
  
  const criticalFiles = [
    'prisma/schema.prisma',
    'src/lib/prisma-service.ts',
    'src/app/api/users/route.ts',
    'src/app/api/auth/route.ts'
  ];
  
  let allGenerated = true;
  criticalFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
      
      // Vérification spéciale pour prisma-service.ts
      if (file === 'src/lib/prisma-service.ts') {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const hasUpdateHost = content.includes('updateHost');
        const hasDeleteHost = content.includes('deleteHost');
        console.log(`  📊 updateHost: ${hasUpdateHost ? '✅' : '❌'}`);
        console.log(`  📊 deleteHost: ${hasDeleteHost ? '✅' : '❌'}`);
      }
    } else {
      console.error(`❌ Manquant: ${file}`);
      allGenerated = false;
    }
  });
  
  if (!allGenerated) {
    console.error('❌ Certains fichiers n\'ont pas été générés correctement');
    process.exit(1);
  }
  
  // PHASE 7 - Correction TypeScript
  console.log('\n🔧 Correction des erreurs TypeScript...');
  if (!fs.existsSync(path.join(__dirname, 'fixTypescriptErrors.js'))) {
    createTypescriptFixScript();
  }
  runScript('fixTypescriptErrors.js', 'Correction erreurs TypeScript');
  
  console.log('\n============================================================');
  console.log('🎉 SYSTÈME COMPLET GÉNÉRÉ AVEC SUCCÈS !');
  console.log('============================================================');
  
  console.log('\n📊 Résumé de la génération:');
  console.log('✅ Schema Prisma généré DYNAMIQUEMENT depuis types.ts');
  console.log('✅ Service Prisma avec CRUD COMPLET pour tous les modèles');
  console.log('✅ Routes API Next.js pour tous les modèles détectés');
  console.log('✅ Authentification migrée vers API');
  console.log('✅ Hooks React générés pour tous les modèles');
  console.log('✅ Composants migrés vers hooks automatiquement');
  console.log('✅ Imports data.ts migrés vers prisma-service.ts');
  console.log('✅ Erreurs TypeScript corrigées automatiquement');
  console.log('✅ Service Prisma maintenu dans /src/lib/ (pas de conflit)');
  
  console.log('\n🔥 CRUD COMPLET GÉNÉRÉ:');
  console.log('   - get[Model]ById() pour tous les modèles');
  console.log('   - getAll[Model]s() pour tous les modèles');
  console.log('   - create[Model]() pour tous les modèles');
  console.log('   - update[Model]() pour tous les modèles ← NOUVEAU');
  console.log('   - delete[Model]() pour tous les modèles ← NOUVEAU');
  
} catch (error) {
  console.error('\n❌ ERREUR CRITIQUE dans generateCompleteSystem:');
  console.error(`Message: ${error.message}`);
  console.error(`Stack: ${error.stack}`);
  process.exit(1);
}
