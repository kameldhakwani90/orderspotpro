const fs = require('fs');
const path = require('path');

console.log('⚙️ GESTIONNAIRE CENTRALISÉ - next.config.js');

class NextConfigManager {
  constructor() {
    this.rootDir = process.cwd();
    this.configPath = path.join(this.rootDir, 'next.config.js');
  }

  // Vérifier si config valide existe
  isConfigValid() {
    if (!fs.existsSync(this.configPath)) return false;
    
    const content = fs.readFileSync(this.configPath, 'utf-8');
    
    // Config valide = array + pas d'appDir + pas de false
    return (
      content.includes('optimizePackageImports: []') &&
      !content.includes('appDir: true') &&
      !content.includes('optimizePackageImports: false')
    );
  }

  // Créer config Next.js 15 compatible
  createValidConfig() {
    console.log('📝 Génération next.config.js Next.js 15 compatible...');
    
    const configContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: []
  },
  
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'lucide-react': require.resolve('lucide-react')
    };
    
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /__barrel_optimize__/ },
      { module: /lucide-react/ }
    ];
    
    config.module.rules.push({
      test: /node_modules\\/lucide-react/,
      type: 'javascript/auto'
    });
    
    return config;
  },
  
  typescript: {
    ignoreBuildErrors: false
  },
  
  transpilePackages: []
}

module.exports = nextConfig`;

    fs.writeFileSync(this.configPath, configContent);
    console.log('✅ next.config.js créé avec succès');
  }

  // Méthode principale
  ensureValidConfig() {
    if (this.isConfigValid()) {
      console.log('✅ next.config.js valide déjà présent');
      return true;
    }
    
    console.log('🔧 Configuration invalide détectée, régénération...');
    this.createValidConfig();
    return true;
  }
}

// Exécution
if (require.main === module) {
  const manager = new NextConfigManager();
  const success = manager.ensureValidConfig();
  process.exit(success ? 0 : 1);
}

module.exports = NextConfigManager;