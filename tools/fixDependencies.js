const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fix des dépendances - Installation versions compatibles...');

const packageJsonPath = path.join(__dirname, '../package.json');

// Lire le package.json actuel
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

console.log('📦 Versions actuelles:');
console.log('  - next:', packageJson.dependencies.next || 'non installé');
console.log('  - react:', packageJson.dependencies.react || 'non installé');
console.log('  - lucide-react:', packageJson.dependencies['lucide-react'] || 'non installé');

// Forcer les versions compatibles
const compatibleVersions = {
  dependencies: {
    ...packageJson.dependencies,
    "next": "13.4.19", // Version stable sans barrel optimization agressive
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "lucide-react": "0.263.1", // Version stable
    "@types/react": "18.2.21",
    "@types/react-dom": "18.2.7",
    "@types/node": "20.5.9"
  }
};

// Mettre à jour package.json
packageJson.dependencies = compatibleVersions.dependencies;

// Sauvegarder
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('\n✅ package.json mis à jour avec versions compatibles');

// Nettoyer et réinstaller
console.log('\n🗑️ Nettoyage des anciennes dépendances...');
try {
  execSync('rm -rf node_modules package-lock.json', { stdio: 'inherit' });
} catch (e) {
  // Ignorer si fichiers n'existent pas
}

console.log('\n📦 Installation des nouvelles dépendances...');
execSync('npm install', { stdio: 'inherit' });

console.log('\n✅ Dépendances installées avec succès !');
console.log('🎯 Versions compatibles installées - pas de barrel optimization !');
