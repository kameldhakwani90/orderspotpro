const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'next.config.ts');

const redirectBlock = `
  async redirects() {
    return [
      {
        source: '/api-custom/:path*',
        destination: '/api-custom/:path*',
        permanent: false,
      },
    ];
  },
`;

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

  // Injecter juste avant export default
  content = content.replace(
    /export default nextConfig;/,
    `${redirectBlock}\n\nexport default nextConfig;`
  );

  fs.writeFileSync(configPath, content, 'utf-8');
  console.log('✅ Redirection ajoutée à next.config.ts');
}

patchConfig();
