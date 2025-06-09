const fs = require('fs');
const path = require('path');

const oldDir = path.join(__dirname, '../src/pages/api-custom');
const newDir = path.join(__dirname, '../src/app/api');

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function moveFiles() {
  if (!fs.existsSync(oldDir)) {
    console.log('⏭️ Dossier src/pages/api-custom introuvable.');
    return;
  }

  ensureDirSync(newDir);

  const files = fs.readdirSync(oldDir).filter(file => file.endsWith('.ts'));

  if (files.length === 0) {
    console.log('⏭️ Aucun fichier .ts à déplacer depuis api-custom.');
    return;
  }

  files.forEach(file => {
    const src = path.join(oldDir, file);
    const dest = path.join(newDir, file);
    fs.renameSync(src, dest);
    console.log(`✅ Déplacé : ${file}`);
  });

  // Supprimer l’ancien dossier
  fs.rmdirSync(oldDir);
  console.log('🗑️ Ancien dossier api-custom supprimé.');
}

moveFiles();
