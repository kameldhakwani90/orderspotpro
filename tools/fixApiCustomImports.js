const fs = require('fs');
const path = require('path');

const prismaSchemaPath = path.join(__dirname, '../prisma/schema.prisma');
const apiDir = path.join(__dirname, '../src/pages/api-custom');

function extractModels(schemaContent) {
  const modelRegex = /model (\w+) {/g;
  const models = [];
  let match;
  while ((match = modelRegex.exec(schemaContent))) {
    models.push(match[1]);
  }
  return models;
}

function fixFileContent(content, modelNames) {
  let changed = false;
  modelNames.forEach(model => {
    const pluralWrong = `prisma.${model.toLowerCase()}s`;
    const correct = `prisma.${model.charAt(0).toLowerCase()}${model.slice(1)}`;
    if (content.includes(pluralWrong)) {
      content = content.replaceAll(pluralWrong, correct);
      changed = true;
    }
  });
  return { content, changed };
}

// Charger les modèles depuis schema.prisma
if (!fs.existsSync(prismaSchemaPath)) {
  console.error('❌ prisma/schema.prisma introuvable.');
  process.exit(1);
}
const schema = fs.readFileSync(prismaSchemaPath, 'utf-8');
const models = extractModels(schema);

// Corriger tous les fichiers de l'API
if (!fs.existsSync(apiDir)) {
  console.error('❌ src/pages/api-custom/ introuvable.');
  process.exit(1);
}

fs.readdirSync(apiDir).forEach(file => {
  const filePath = path.join(apiDir, file);
  if (file.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    const { content: newContent, changed } = fixFileContent(content, models);
    if (changed) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`✅ Corrigé : ${file}`);
    } else {
      console.log(`⏭️ Aucun changement : ${file}`);
    }
  }
});
