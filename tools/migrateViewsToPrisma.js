
const fs = require('fs');
const path = require('path');

const viewsPath = './src/app';

function findEntityFromFunctionName(fnName) {
  // Ex: getAllUsers -> users
  const match = fnName.match(/get(All)?([A-Z][a-zA-Z]+)/);
  if (match) {
    return match[2].charAt(0).toLowerCase() + match[2].slice(1);
  }
  return null;
}

function getApiRouteFromEntity(entityName) {
  // Convert "user" -> "/api/users", "reservationSetting" -> "/api/reservation-settings"
  return '/api/' + entityName
    .replace(/[A-Z]/g, letter => '-' + letter.toLowerCase())
    .replace(/^-/, '') + 's';
}

function migrateViewFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  const prismaImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@\/server\/prisma-service['"]/;
  const match = content.match(prismaImportRegex);
  if (!match) return;

  const importedFns = match[1].split(',').map(fn => fn.trim());
  const lines = content.split('\n');
  let newLines = lines.filter(line => !prismaImportRegex.test(line)); // remove prisma import

  let replacedAny = false;

  importedFns.forEach(fnName => {
    const entity = findEntityFromFunctionName(fnName);
    if (entity) {
      const apiUrl = getApiRouteFromEntity(entity);
      const fetchSnippet = `await fetch('${apiUrl}').then(res => res.json())`;
      const fnCallRegex = new RegExp(`\\b${fnName}\\(\\)`, 'g');
      const joined = newLines.join('\n').replace(fnCallRegex, fetchSnippet);
      newLines = joined.split('\n');
      replacedAny = true;
    }
  });

  if (replacedAny) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
    console.log(`✅ Migrated: ${filePath}`);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.tsx')) {
      migrateViewFile(fullPath);
    }
  });
}

walk(viewsPath);