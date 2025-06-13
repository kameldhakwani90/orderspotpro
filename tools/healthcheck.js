// tools/healthcheck.js

const http = require('http');

const PORT = 3001;
const HOST = 'localhost';
const PATHS = ['/api/clients', '/api/hosts'];

function checkEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path,
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk.toString();
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ ${path} → ${res.statusCode}`);
          resolve(true);
        } else {
          console.error(`❌ ${path} → ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', err => {
      console.error(`❌ ${path} → erreur: ${err.message}`);
      resolve(false);
    });

    req.end();
  });
}

(async () => {
  console.log(`🔍 Healthcheck: Vérification des endpoints sur http://${HOST}:${PORT}`);

  let allGood = true;
  for (const path of PATHS) {
    const ok = await checkEndpoint(path);
    if (!ok) allGood = false;
  }

  if (allGood) {
    console.log('✅ Healthcheck terminé avec succès ✔');
    process.exit(0);
  } else {
    console.error('❌ Healthcheck échoué ❌');
    process.exit(1);
  }
})();
