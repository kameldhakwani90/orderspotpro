const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Démarrage app sur port 3001...');

function checkPort() {
  return new Promise((resolve) => {
    const req = http.request({ port: 3001, timeout: 1000 }, () => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

async function startApp() {
  try {
    // Vérifier si app déjà démarrée
    const isRunning = await checkPort();
    if (isRunning) {
      console.log('✅ App déjà en cours sur port 3001');
      return;
    }
    
    console.log('🔄 Démarrage de l\'application...');
    
    // Démarrer Next.js
    const app = spawn('npm', ['run', 'dev', '--', '--port', '3001'], {
      stdio: 'inherit',
      detached: true
    });
    
    // Attendre 10 secondes puis vérifier
    setTimeout(async () => {
      const running = await checkPort();
      if (running) {
        console.log('✅ App démarrée sur http://localhost:3001');
        console.log('🎯 Interface Firebase Studio disponible');
      } else {
        console.log('⚠️ App en cours de démarrage...');
      }
    }, 10000);
    
  } catch (error) {
    console.error('❌ Erreur démarrage:', error.message);
  }
}

startApp();