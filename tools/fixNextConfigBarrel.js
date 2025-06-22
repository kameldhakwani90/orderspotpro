const fs = require('fs');
const path = require('path');

console.log('🔧 Configuration Next.js - Désactivation barrel optimization...');

const nextConfigPath = path.join(__dirname, '../next.config.js');

// Configuration qui désactive l'optimisation barrel
const configContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Désactiver l'optimisation barrel qui cause les erreurs lucide-react
  experimental: {
    optimizePackageImports: [] // Liste vide = pas d'optimisation
  },
  
  // Configuration webpack pour éviter les problèmes
  webpack: (config) => {
    // Forcer la résolution directe de lucide-react
    config.resolve.alias = {
      ...config.resolve.alias,
      'lucide-react': require.resolve('lucide-react')
    };
    
    // Ignorer les warnings barrel
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /__barrel_optimize__/ }
    ];
    
    return config;
  }
}

module.exports = nextConfig
`;

try {
  // Sauvegarder l'ancien si existe
  if (fs.existsSync(nextConfigPath)) {
    const backup = fs.readFileSync(nextConfigPath, 'utf-8');
    fs.writeFileSync(nextConfigPath + '.backup', backup);
    console.log('  📋 Sauvegarde de l\'ancien next.config.js');
  }
  
  // Écrire la nouvelle configuration
  fs.writeFileSync(nextConfigPath, configContent);
  console.log('  ✅ next.config.js créé/mis à jour');
  
  // Vérifier
  if (fs.existsSync(nextConfigPath)) {
    console.log('  ✅ Configuration appliquée avec succès');
    console.log('  🎯 Barrel optimization désactivée');
  }
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}

console.log('✅ Configuration Next.js corrigée !');
process.exit(0);
