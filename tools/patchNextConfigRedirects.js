const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '..', 'next.config.ts');

const redirectBlock = `  async redirects() {
    return [
      {
        source: '/api-custom/:path*',
        destination: '/api-custom/:path*',
        permanent: false,
      },
    ];
  },`;

function patchConfig() {
  if (!fs.existsSync(configPath)) {
    console.error('❌ Fichier next.config.ts non trouvé.');
    process.exit(1);
  }
  
  let content = fs.readFileSync(configPath, 'utf-8');
  
  // Ne rien faire si déjà présent
  if (content.includes('redirects()')) {
    console.log('⏭️ Redirection déjà présente dans next.config.ts');
    return;
  }
  
  // Injecter AVANT la fermeture de l'objet nextConfig
  content = content.replace(
    /^};$/m,
    `${redirectBlock}\n};`
  );
  
  fs.writeFileSync(configPath, content, 'utf-8');
  console.log('✅ Redirection ajoutée à next.config.ts');
}

patchConfig();
