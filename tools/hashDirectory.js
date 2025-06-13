// tools/hashDirectory.js

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function hashDirectory(dirPath) {
  let hash = crypto.createHash('sha256');

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      hash.update(hashDirectory(fullPath));
    } else if (entry.isFile()) {
      const fileHash = hashFile(fullPath);
      hash.update(fileHash);
    }
  }

  return hash.digest('hex');
}

// CLI
if (require.main === module) {
  const targetDir = process.argv[2];
  if (!targetDir || !fs.existsSync(targetDir)) {
    console.error('❌ hashDirectory.js : dossier invalide ou introuvable');
    process.exit(1);
  }

  const result = hashDirectory(targetDir);
  console.log(`✅ Hash du dossier ${targetDir} : ${result}`);
}

module.exports = { hashDirectory };
