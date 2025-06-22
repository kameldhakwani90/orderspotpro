// tools/validateInputStructure.js

const fs = require('fs');
const path = require('path');

const typesPath = path.join(process.cwd(), 'src', 'types.ts');
const dataPath = path.join(process.cwd(), 'src', 'lib', 'data.ts');

function exitWithError(message) {
  console.error(`❌ validateInputStructure.js: ${message}`);
  process.exit(1);
}

// Vérifie existence fichiers
if (!fs.existsSync(typesPath)) {
  exitWithError('Fichier src/types.ts introuvable.');
}

if (!fs.existsSync(dataPath)) {
  exitWithError('Fichier src/lib/data.ts introuvable.');
}

// Vérifie contenu de types.ts
const typesContent = fs.readFileSync(typesPath, 'utf8');
const hasInterface = /export\s+interface\s+\w+\s*{[^}]*}/.test(typesContent);

if (!hasInterface) {
  exitWithError('Aucune interface exportée trouvée dans src/types.ts.');
}

// Vérifie contenu de data.ts
const dataContent = fs.readFileSync(dataPath, 'utf8');
const hasDataConst = /export\s+const\s+\w+\s*=\s*\[[\s\S]*?\]/.test(dataContent);

if (!hasDataConst) {
  exitWithError('Aucune constante exportée (tableau) trouvée dans src/lib/data.ts.');
}

console.log('✅ validateInputStructure.js : fichiers valides ✔');
