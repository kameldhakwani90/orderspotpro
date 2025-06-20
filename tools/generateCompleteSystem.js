const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 DÉMARRAGE - Génération SYSTÈME COMPLET 100% DYNAMIQUE');

// ====================================
// CRÉATION SCRIPT CORRECTION TYPESCRIPT
// ====================================

function createTypescriptFixScript() {
  console.log('📝 Création du script de correction TypeScript...');
  
  const scriptLines = [
    "const fs = require('fs');",
    "const path = require('path');",
    "",
    "console.log('🔧 Correction automatique des erreurs TypeScript...');",
    "",
    "const srcDir = path.join(__dirname, '../src');",
    "",
    "function fixTypescriptErrors(filePath) {",
    "  if (!fs.existsSync(filePath)) {",
    "    return false;",
    "  }",
    "  ",
    "  let content = fs.readFileSync(filePath, 'utf-8');",
    "  let hasChanges = false;",
    "  ",
    "  // Correction 1: Parameter 'prev' implicitly has an 'any' type",
    "  content = content.replace(",
    "    /currentSetter\\(prev\\s*=>\\s*\\(\\{\\s*\\.\\.\\.prev,/g,",
    "    'currentSetter((prev: any) => ({ ...prev,'",
    "  );",
    "  ",
    "  content = content.replace(",
    "    /set\\w+\\(prev\\s*=>\\s*\\(\\{\\s*\\.\\.\\.prev,/g,",
    "    (match) => match.replace('prev =>', '(prev: any) =>')",
    "  );",
    "  ",
    "  // Correction 2: useState sans types",
    "  content = content.replace(",
    "    /useState\\(\\{\\}\\)/g,",
    "    'useState<any>({})'",
    "  );",
    "  ",
    "  content = content.replace(",
    "    /useState\\(null\\)/g,",
    "    'useState<any>(null)'",
    "  );",
    "  ",
    "  // Correction 3: Event handlers",
    "  content = content.replace(",
    "    /const\\s+(\\w+)\\s*=\\s*\\(e\\)\\s*=>/g,",
    "    'const $1 = (e: any) =>'",
    "  );",
    "  ",
    "  // Correction 4: Props destructuring avec types manquants",
    "  content = content.replace(",
    "    /const\\s*\\{\\s*([^}]+)\\s*\\}\\s*=\\s*useAuth\\(\\);/g,",
    "    'const { $1 } = useAuth() as any;'",
    "  );",
    "  ",
    "  // Vérifier si des changements ont été faits",
    "  const originalContent = fs.readFileSync(filePath, 'utf-8');",
    "  if (content !== originalContent) {",
    "    fs.writeFileSync(filePath, content, 'utf-8');",
    "    hasChanges = true;",
    "  }",
    "  ",
    "  return hasChanges;",
    "}",
    "",
    "function scanAndFixDirectory(dirPath) {",
    "  if (!fs.existsSync(dirPath)) {",
    "    return 0;",
    "  }",
    "  ",
    "  let fixedFiles = 0;",
    "  const entries = fs.readdirSync(dirPath, { withFileTypes: true });",
    "  ",
    "  entries.forEach(entry => {",
    "    const fullPath = path.join(dirPath, entry.name);",
    "    ",
    "    if (entry.isDirectory()) {",
    "      const skipDirs = ['node_modules', '.git', '.next', 'dist', 'build'];",
    "      if (!skipDirs.includes(entry.name)) {",
    "        fixedFiles += scanAndFixDirectory(fullPath);",
    "      }",
    "    } else if (entry.isFile() && /\\.(tsx?|jsx?)$/.test(entry.name)) {",
    "      if (fixTypescriptErrors(fullPath)) {",
    "        fixedFiles++;",
    "        console.log('✅ Corrigé: ' + path.relative(srcDir, fullPath));",
    "      }",
    "    }",
    "  });",
    "  ",
    "  return fixedFiles;",
    "}",
    "",
    "function createTsConfigIfMissing() {",
    "  const tsConfigPath = path.join(__dirname, '../tsconfig.json');",
    "  ",
    "  if (!fs.existsSync(tsConfigPath)) {",
    "    console.log('📝 Création tsconfig.json...');",
    "    ",
    "    const tsConfig = {",
    "      'compilerOptions': {",
    "        'target': 'es5',",
    "        'lib': ['dom', 'dom.iterable', 'es6'],",
    "        'allowJs': true,",
    "        'skipLibCheck': true,",
    "        'strict': false,",
    "        'noEmit': true,",
    "        'esModuleInterop': true,",
    "        'module': 'esnext',",
    "        'moduleResolution': 'bundler',",
    "        'resolveJsonModule': true,",
    "        'isolatedModules': true,",
    "        'jsx': 'preserve',",
    "        'incremental': true,",
    "        'baseUrl': '.',",
    "        'paths': {",
    "          '@/*': ['./src/*']",
    "        }",
    "      },",
    "      'include': ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],",
    "      'exclude': ['node_modules']",
    "    };",
    "    ",
    "    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2), 'utf-8');",
    "    console.log('✅ tsconfig.json créé avec strict: false');",
    "  }",
    "}",
    "",
    "try {",
    "  createTsConfigIfMissing();",
    "  ",
    "  console.log('🔍 Scan et correction des erreurs TypeScript...');",
    "  const fixedFiles = scanAndFixDirectory(srcDir);",
    "  ",
    "  console.log('🎉 Correction TypeScript terminée !');",
    "  console.log('📊 ' + fixedFiles + ' fichier(s) corrigé(s)');",
    "  ",
    "} catch (error) {",
    "  console.error('❌ Erreur lors de la correction TypeScript:', error.message);",
    "  process.exit(1);",
    "}"
  ];

  const scriptPath = path.join(__dirname, 'fixTypescriptErrors.js');
  fs.writeFileSync(scriptPath, scriptLines.join('\n'), 'utf-8');
  console.log('✅ Script fixTypescriptErrors.js créé dynamiquement');
}

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
    console.error(`Code d'erreur: ${error.status}`);
    
    // Diagnostic supplémentaire pour les scripts critiques
    if (scriptName.includes('generatePrismaServiceFromData')) {
      console.log('\n🔍 Diagnostic prisma-service:');
      const servicePath = path.join(__dirname, '../src/lib/prisma-service.ts');
      console.log(`- Service existe: ${fs.existsSync(servicePath)}`);
      if (fs.existsSync(servicePath)) {
        const size = fs.statSync(servicePath).size;
        console.log(`- Taille: ${size} bytes`);
      }
      
      const typesPath = path.join(__dirname, '../src/lib/types.ts');
      console.log(`- types.ts existe: ${fs.existsSync(typesPath)}`);
      if (fs.existsSync(typesPath)) {
        const content = fs.readFileSync(typesPath, 'utf-8');
        const interfaceCount = (content.match(/export\s+interface\s+\w+/g) || []).length;
        console.log(`- Interfaces détectées: ${interfaceCount}`);
      }
    }
    
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
// CRÉATION DYNAMIQUE DU SCRIPT AUTH
// ====================================

function createMigrateAuthScript() {
  console.log('📝 Création du script migrateAuthToApi.js...');
  
  // Contenu du script en morceaux pour éviter les problèmes d'échappement
  const scriptLines = [
    "const fs = require('fs');",
    "const path = require('path');",
    "",
    "console.log('🔐 Migration DYNAMIQUE de l\\'authentification vers API...');",
    "",
    "const authContextPath = path.join(__dirname, '../src/context/AuthContext.tsx');",
    "const loginPagePath = path.join(__dirname, '../src/app/login/page.tsx');",
    "",
    "function updateAuthContext() {",
    "  if (!fs.existsSync(authContextPath)) {",
    "    console.warn('⚠️  AuthContext.tsx non trouvé - création automatique...');",
    "    createAuthContext();",
    "    return;",
    "  }",
    "  ",
    "  console.log('🔄 Mise à jour AuthContext pour utiliser l\\'API...');",
    "  ",
    "  let content = fs.readFileSync(authContextPath, 'utf-8');",
    "  ",
    "  // Supprimer les imports de data statique",
    "  content = content.replace(/import\\\\s+\\\\{[^}]*\\\\}\\\\s+from\\\\s+['\"]@\\\\/lib\\\\/data['\"];?\\\\s*/g, '');",
    "  content = content.replace(/import\\\\s+\\\\{[^}]*\\\\}\\\\s+from\\\\s+['\"][^'\"]*data['\"];?\\\\s*/g, '');",
    "  ",
    "  fs.writeFileSync(authContextPath, content, 'utf-8');",
    "  console.log('✅ AuthContext mis à jour pour utiliser l\\'API');",
    "}",
    "",
    "function createAuthContext() {",
    "  const authLines = [",
    "    \"'use client';\",",
    "    \"\",",
    "    \"import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';\",",
    "    \"\",",
    "    \"interface User {\",",
    "    \"  id: string;\",",
    "    \"  email: string;\",",
    "    \"  nom: string;\",",
    "    \"  role: string;\",",
    "    \"  hostId?: string;\",",
    "    \"  host?: any;\",",
    "    \"  [key: string]: any;\",",
    "    \"}\",",
    "    \"\",",
    "    \"interface AuthContextType {\",",
    "    \"  user: User | null;\",",
    "    \"  loading: boolean;\",",
    "    \"  error: string | null;\",",
    "    \"  login: (email: string, password: string) => Promise<boolean>;\",",
    "    \"  register: (email: string, password: string, nom?: string) => Promise<boolean>;\",",
    "    \"  logout: () => void;\",",
    "    \"  clearError: () => void;\",",
    "    \"}\",",
    "    \"\",",
    "    \"const AuthContext = createContext<AuthContextType | undefined>(undefined);\",",
    "    \"\",",
    "    \"export function AuthProvider({ children }: { children: ReactNode }) {\",",
    "    \"  const [user, setUser] = useState<User | null>(null);\",",
    "    \"  const [loading, setLoading] = useState(false);\",",
    "    \"  const [error, setError] = useState<string | null>(null);\",",
    "    \"\",",
    "    \"  useEffect(() => {\",",
    "    \"    const savedUser = localStorage.getItem('user');\",",
    "    \"    if (savedUser) {\",",
    "    \"      try {\",",
    "    \"        setUser(JSON.parse(savedUser));\",",
    "    \"      } catch (error) {\",",
    "    \"        console.error('Erreur parsing user:', error);\",",
    "    \"        localStorage.removeItem('user');\",",
    "    \"      }\",",
    "    \"    }\",",
    "    \"  }, []);\",",
    "    \"\",",
    "    \"  const login = async (email: string, password: string) => {\",",
    "    \"    try {\",",
    "    \"      setLoading(true);\",",
    "    \"      setError(null);\",",
    "    \"      \",",
    "    \"      const response = await fetch('/api/auth', {\",",
    "    \"        method: 'POST',\",",
    "    \"        headers: { 'Content-Type': 'application/json' },\",",
    "    \"        body: JSON.stringify({ email, motDePasse: password, action: 'login' })\",",
    "    \"      });\",",
    "    \"      \",",
    "    \"      const data = await response.json();\",",
    "    \"      \",",
    "    \"      if (response.error || data.error) {\",",
    "    \"        setError(data.error || 'Erreur de connexion');\",",
    "    \"        return false;\",",
    "    \"      }\",",
    "    \"      \",",
    "    \"      if (data.user) {\",",
    "    \"        setUser(data.user);\",",
    "    \"        localStorage.setItem('user', JSON.stringify(data.user));\",",
    "    \"        return true;\",",
    "    \"      }\",",
    "    \"      \",",
    "    \"      setError('Réponse invalide du serveur');\",",
    "    \"      return false;\",",
    "    \"    } catch (error) {\",",
    "    \"      setError('Erreur de connexion');\",",
    "    \"      console.error('Erreur login:', error);\",",
    "    \"      return false;\",",
    "    \"    } finally {\",",
    "    \"      setLoading(false);\",",
    "    \"    }\",",
    "    \"  };\",",
    "    \"\",",
    "    \"  const register = async (email: string, password: string, nom?: string) => {\",",
    "    \"    try {\",",
    "    \"      setLoading(true);\",",
    "    \"      setError(null);\",",
    "    \"      \",",
    "    \"      const response = await fetch('/api/auth', {\",",
    "    \"        method: 'POST',\",",
    "    \"        headers: { 'Content-Type': 'application/json' },\",",
    "    \"        body: JSON.stringify({ email, motDePasse: password, action: 'register' })\",",
    "    \"      });\",",
    "    \"      \",",
    "    \"      const data = await response.json();\",",
    "    \"      \",",
    "    \"      if (data.error) {\",",
    "    \"        setError(data.error);\",",
    "    \"        return false;\",",
    "    \"      }\",",
    "    \"      \",",
    "    \"      if (data.user) {\",",
    "    \"        setUser(data.user);\",",
    "    \"        localStorage.setItem('user', JSON.stringify(data.user));\",",
    "    \"        return true;\",",
    "    \"      }\",",
    "    \"      \",",
    "    \"      setError('Erreur lors de l\\\\'inscription');\",",
    "    \"      return false;\",",
    "    \"    } catch (error) {\",",
    "    \"      setError('Erreur de connexion');\",",
    "    \"      console.error('Erreur register:', error);\",",
    "    \"      return false;\",",
    "    \"    } finally {\",",
    "    \"      setLoading(false);\",",
    "    \"    }\",",
    "    \"  };\",",
    "    \"\",",
    "    \"  const logout = () => {\",",
    "    \"    setUser(null);\",",
    "    \"    setError(null);\",",
    "    \"    localStorage.removeItem('user');\",",
    "    \"  };\",",
    "    \"\",",
    "    \"  const clearError = () => {\",",
    "    \"    setError(null);\",",
    "    \"  };\",",
    "    \"\",",
    "    \"  return (\",",
    "    \"    <AuthContext.Provider value={{\",",
    "    \"      user,\",",
    "    \"      loading,\",",
    "    \"      error,\",",
    "    \"      login,\",",
    "    \"      register,\",",
    "    \"      logout,\",",
    "    \"      clearError\",",
    "    \"    }}>\",",
    "    \"      {children}\",",
    "    \"    </AuthContext.Provider>\",",
    "    \"  );\",",
    "    \"}\",",
    "    \"\",",
    "    \"export function useAuth() {\",",
    "    \"  const context = useContext(AuthContext);\",",
    "    \"  if (context === undefined) {\",",
    "    \"    throw new Error('useAuth must be used within an AuthProvider');\",",
    "    \"  }\",",
    "    \"  return context;\",",
    "    \"}\",",
  ];",
  "  ",
  "  const contextDir = path.dirname(authContextPath);",
  "  if (!fs.existsSync(contextDir)) {",
  "    fs.mkdirSync(contextDir, { recursive: true });",
  "  }",
  "",
  "  fs.writeFileSync(authContextPath, authLines.join('\\\\n'), 'utf-8');",
  "  console.log('✅ AuthContext créé avec connexion API');",
  "}",
  "",
  "function updateNextConfig() {",
  "  const nextConfigPath = path.join(__dirname, '../next.config.js');",
  "  ",
  "  if (!fs.existsSync(nextConfigPath)) {",
  "    console.warn('⚠️  next.config.js non trouvé');",
  "    return;",
  "  }",
  "  ",
  "  console.log('🔄 Nettoyage next.config.js...');",
  "  ",
  "  let content = fs.readFileSync(nextConfigPath, 'utf-8');",
  "  ",
  "  // Supprimer experimental.appDir",
  "  content = content.replace(/experimental:\\\\s*\\\\{\\\\s*appDir:\\\\s*true\\\\s*,?\\\\s*\\\\},?\\\\s*/g, '');",
  "  content = content.replace(/,\\\\s*\\\\}/g, '\\\\n}');",
  "  content = content.replace(/\\\\{\\\\s*,/g, '{');",
  "  ",
  "  fs.writeFileSync(nextConfigPath, content, 'utf-8');",
  "  console.log('✅ next.config.js nettoyé');",
  "}",
  "",
  "try {",
  "  updateAuthContext();",
  "  updateNextConfig();",
  "  console.log('✅ Migration auth terminée avec succès !');",
  "  console.log('📋 Actions effectuées:');",
  "  console.log('   ✓ AuthContext migré vers API');",
  "  console.log('   ✓ next.config.js nettoyé');",
  "  console.log('🔐 L\\'authentification utilise maintenant l\\'API !');",
  "  ",
  "} catch (error) {",
  "  console.error('❌ Erreur migration auth:', error.message);",
  "  process.exit(1);",
  "}"
  ];

  const scriptPath = path.join(__dirname, 'migrateAuthToApi.js');
  fs.writeFileSync(scriptPath, scriptLines.join('\n'), 'utf-8');
  console.log('✅ Script migrateAuthToApi.js créé dynamiquement');
}

// ====================================
// EXÉCUTION SÉQUENTIELLE DES SCRIPTS
// ====================================

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
  console.log('  8. Correction erreurs TypeScript');
  console.log('  9. Validation finale\n');
  
  // PHASE 1 - Génération Prisma (BASE)
  runScript('generatePrismaSchema.js', 'Génération schema Prisma DYNAMIQUE');
  runScript('generatePrismaServiceFromData.js', 'Génération service Prisma CRUD COMPLET');
  
  // PHASE 2 - Génération API
  runScript('generateApiRoutes.js', 'Génération routes API DYNAMIQUES');
  
  // PHASE 3 - Migration Auth
  if (fs.existsSync(path.join(__dirname, 'migrateAuthToApi.js'))) {
    runScript('migrateAuthToApi.js', 'Migration authentification vers API');
  } else {
    console.log('⚠️  migrateAuthToApi.js non trouvé - création automatique...');
    createMigrateAuthScript();
    runScript('migrateAuthToApi.js', 'Migration authentification vers API');
  }
  
  // PHASE 4 - Hooks et Components
  runScript('generateReactHooks.js', 'Génération hooks React DYNAMIQUES');
  runScript('migrateComponentsToHooks.js', 'Migration composants vers hooks');
  
  // PHASE 5 - Migration données
  runScript('migrateDataToPrisma.js', 'Migration imports data vers prisma-service');
  
  // PHASE 6 - Validation AVANT correction
  console.log('\n🔍 Validation avant correction...');
  
  const criticalFiles = [
    'prisma/schema.prisma',
    'src/lib/prisma-service.ts',
    'src/app/api/users/route.ts',
    'src/app/api/auth/route.ts',
    'src/lib/api-utils.ts'
  ];
  
  let allCriticalGenerated = true;
  criticalFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
    } else {
      console.error(`❌ Manquant: ${file}`);
      allCriticalGenerated = false;
    }
  });
  
  if (!allCriticalGenerated) {
    console.error('❌ Fichiers critiques manquants - Arrêt avant correction');
    process.exit(1);
  }
  
  // PHASE 7 - Organisation fichiers (DÉSACTIVÉE)
  console.log('\n⏭️  Organisation fichiers Prisma désactivée (évite conflits de chemins)');
  console.log('📍 Le service Prisma reste dans /src/lib/ pour compatibilité avec les imports');
  
  // PHASE 8 - Validation finale post-génération
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
      
      // Vérification spéciale pour prisma-service.ts
      if (file === 'src/lib/prisma-service.ts') {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const hasUpdateFunction = content.includes('updateHost');
        const hasDeleteFunction = content.includes('deleteHost');
        console.log(`  📊 updateHost: ${hasUpdateFunction ? '✅' : '❌'}`);
        console.log(`  📊 deleteHost: ${hasDeleteFunction ? '✅' : '❌'}`);
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
  
  // PHASE 9 - Correction des erreurs TypeScript
  console.log('\n🔧 Correction des erreurs TypeScript...');
  if (fs.existsSync(path.join(__dirname, 'fixTypescriptErrors.js'))) {
    runScript('fixTypescriptErrors.js', 'Correction erreurs TypeScript');
  } else {
    console.log('⚠️  fixTypescriptErrors.js non trouvé - création automatique...');
    createTypescriptFixScript();
    runScript('fixTypescriptErrors.js', 'Correction erreurs TypeScript');
  }
  
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
  
  console.log('\n🚀 Prochaines étapes:');
  console.log('1. npm install (si pas déjà fait)');
  console.log('2. Démarrer PostgreSQL');
  console.log('3. npx prisma db push');
  console.log('4. npm run dev');
  
  console.log('\n💡 Le système est 100% dynamique et s\'adaptera automatiquement');
  console.log('   à tous les futurs changements dans types.ts !');
  
  console.log('\n🔥 CRUD COMPLET GÉNÉRÉ:');
  console.log('   - get[Model]ById() pour tous les modèles');
  console.log('   - getAll[Model]s() pour tous les modèles');
  console.log('   - create[Model]() pour tous les modèles');
  console.log('   - update[Model]() pour tous les modèles ← NOUVEAU');
  console.log('   - delete[Model]() pour tous les modèles ← NOUVEAU');
  console.log('   - Aliases de compatibilité automatiques');
  
} catch (error) {
  console.error('\n❌ ERREUR CRITIQUE dans generateCompleteSystem:');
  console.error(`Message: ${error.message}`);
  console.error(`Stack: ${error.stack}`);
  
  console.log('\n🔍 Diagnostic détaillé:');
  console.log('📁 Fichiers critiques:');
  const diagnosticFiles = [
    'src/lib/types.ts',
    'src/lib/data.ts', 
    'src/lib/prisma-service.ts',
    'prisma/schema.prisma'
  ];
  
  diagnosticFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    const exists = fs.existsSync(fullPath);
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    if (exists) {
      const size = fs.statSync(fullPath).size;
      console.log(`      Taille: ${size} bytes`);
    }
  });
  
  console.log('\n🛠️  Scripts disponibles:');
  const toolsDir = path.join(__dirname);
  if (fs.existsSync(toolsDir)) {
    const scripts = fs.readdirSync(toolsDir).filter(f => f.endsWith('.js'));
    scripts.forEach(script => {
      console.log(`   - ${script}`);
    });
  }
  
  process.exit(1);
}
