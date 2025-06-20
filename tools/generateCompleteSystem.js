const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 SYSTÈME COMPLET - Génération 100% DYNAMIQUE');

function validateSourceFiles() {
  console.log('🔍 Validation fichiers source...');
  
  const requiredFiles = ['src/lib/types.ts', 'src/lib/data.ts'];
  
  for (const file of requiredFiles) {
    const fullPath = path.join(__dirname, '..', file);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Fichier manquant: ${file}`);
      process.exit(1);
    }
    console.log(`✅ ${file}`);
  }
}

function createDirectories() {
  console.log('📁 Création répertoires...');
  
  const dirs = [
    'prisma',
    'src/app/api',
    'src/context',
    'src/hooks',
    'src/lib'
  ];
  
  for (const dir of dirs) {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`  📁 ${dir}`);
    }
  }
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
    console.error(`❌ Erreur: ${description}`);
    console.error(`Script: ${scriptName}`);
    process.exit(1);
  }
}

function createAuthContext() {
  console.log('🔐 Création AuthContext...');
  
  const authPath = path.join(__dirname, '../src/context/AuthContext.tsx');
  const contextDir = path.dirname(authPath);
  
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }
  
  // Contenu simple sans échappement compliqué
  const content = [
    "'use client';",
    "",
    "import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';",
    "",
    "interface User {",
    "  id: string;",
    "  email: string;",
    "  nom: string;",
    "  role: string;",
    "}",
    "",
    "interface AuthContextType {",
    "  user: User | null;",
    "  loading: boolean;",
    "  error: string | null;",
    "  login: (email: string, password: string) => Promise<boolean>;",
    "  logout: () => void;",
    "}",
    "",
    "const AuthContext = createContext<AuthContextType | undefined>(undefined);",
    "",
    "export function AuthProvider({ children }: { children: ReactNode }) {",
    "  const [user, setUser] = useState<User | null>(null);",
    "  const [loading, setLoading] = useState(false);",
    "  const [error, setError] = useState<string | null>(null);",
    "",
    "  const login = async (email: string, password: string) => {",
    "    try {",
    "      setLoading(true);",
    "      setError(null);",
    "      ",
    "      const response = await fetch('/api/auth', {",
    "        method: 'POST',",
    "        headers: { 'Content-Type': 'application/json' },",
    "        body: JSON.stringify({ email, motDePasse: password, action: 'login' })",
    "      });",
    "      ",
    "      const data = await response.json();",
    "      ",
    "      if (data.error) {",
    "        setError(data.error);",
    "        return false;",
    "      }",
    "      ",
    "      if (data.user) {",
    "        setUser(data.user);",
    "        return true;",
    "      }",
    "      ",
    "      return false;",
    "    } catch (error) {",
    "      setError('Erreur connexion');",
    "      return false;",
    "    } finally {",
    "      setLoading(false);",
    "    }",
    "  };",
    "",
    "  const logout = () => {",
    "    setUser(null);",
    "    setError(null);",
    "  };",
    "",
    "  return (",
    "    <AuthContext.Provider value={{ user, loading, error, login, logout }}>",
    "      {children}",
    "    </AuthContext.Provider>",
    "  );",
    "}",
    "",
    "export function useAuth() {",
    "  const context = useContext(AuthContext);",
    "  if (!context) {",
    "    throw new Error('useAuth must be used within an AuthProvider');",
    "  }",
    "  return context;",
    "}"
  ].join('\n');
  
  fs.writeFileSync(authPath, content, 'utf-8');
  console.log('✅ AuthContext créé');
}

function setupEnv() {
  console.log('🔧 Variables environnement...');
  
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    const envContent = 'DATABASE_URL="postgresql://orderspot_user:orderspot_pass@orderspot_postgres:5432/orderspot_db?schema=public"\n';
    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('✅ .env créé');
  }
}

function validateGenerated() {
  console.log('🔍 Validation génération...');
  
  const files = [
    'prisma/schema.prisma',
    'src/lib/prisma-service.ts',
    'src/app/api/users/route.ts',
    'src/app/api/auth/route.ts',
    'src/context/AuthContext.tsx'
  ];
  
  let allOk = true;
  
  for (const file of files) {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
    } else {
      console.error(`❌ Manquant: ${file}`);
      allOk = false;
    }
  }
  
  if (!allOk) {
    console.error('❌ Certains fichiers manquent');
    process.exit(1);
  }
}

try {
  console.log('=' * 50);
  console.log('🚀 GÉNÉRATION SYSTÈME COMPLET');
  console.log('=' * 50);
  
  // Phase 1 - Préparation
  validateSourceFiles();
  createDirectories();
  setupEnv();
  
  // Phase 2 - Génération Prisma
  runScript('generatePrismaSchema.js', 'Schema Prisma DYNAMIQUE');
  runScript('generatePrismaServiceFromData.js', 'Service Prisma DYNAMIQUE');
  
  // Phase 3 - API Routes
  runScript('generateApiRoutes.js', 'Routes API DYNAMIQUES');
  
  // Phase 4 - Auth (simple)
  createAuthContext();
  
  // Phase 5 - Hooks
  runScript('generateReactHooks.js', 'Hooks React DYNAMIQUES');
  
  // Phase 6 - Migration
  runScript('migrateComponentsToHooks.js', 'Migration composants');
  runScript('migrateDataToPrisma.js', 'Migration data vers prisma');
  
  // Phase 7 - Validation
  validateGenerated();
  
  console.log('\n🎉 SYSTÈME GÉNÉRÉ AVEC SUCCÈS !');
  console.log('✅ Schema Prisma dynamique');
  console.log('✅ Service Prisma complet');
  console.log('✅ Routes API pour tous modèles');
  console.log('✅ Authentification fonctionnelle');
  console.log('✅ Hooks React générés');
  console.log('✅ Migration automatique');
  
  console.log('\n🚀 Prochaines étapes:');
  console.log('1. npx prisma db push');
  console.log('2. npm run dev');
  
} catch (error) {
  console.error('❌ ERREUR:', error.message);
  process.exit(1);
}
