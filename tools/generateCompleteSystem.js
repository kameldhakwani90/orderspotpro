
const { cleanDataFile } = require('./cleanDataFile');
const { validateInputStructure } = require('./validateInputStructure');
const { generatePrismaSchema } = require('./generatePrismaSchema');
const { generatePrismaServiceFromData } = require('./generatePrismaServiceFromData');
const { fixPrismaServiceLocation } = require('./fixPrismaServiceLocation');
const { generateApiRoutes } = require('./generateApiRoutes');
const { generateReactHooks } = require('./generateReactHooks');
const { migrateComponentsToHooks } = require('./migrateComponentsToHooks');
const { migrateDataToPrisma } = require('./migrateDataToPrisma');
const { patchNextConfigRedirects } = require('./patchNextConfigRedirects');
const { fixApiFolder } = require('./fixApiFolder');
const { bulletproofMigrationSystem } = require('./bulletproofMigrationSystem');
const { validateSchemaChanges } = require('./validateSchemaChanges');
const { healthcheck } = require('./healthcheck');
const { execSync } = require("child_process");

console.log("🚀 DÉMARRAGE - generateCompleteSystem ultra-dynamique");

try {
  // Préparation
  cleanDataFile();
  validateInputStructure();

  // Prisma
  generatePrismaSchema();
  generatePrismaServiceFromData();
  fixPrismaServiceLocation();

  // API
  generateApiRoutes();

  // Migration dynamique des vues front
  console.log("🔄 Migration des vues front via fetch API...");
  execSync("node tools/migrateViewsToPrisma.dynamic.js", { stdio: "inherit" });

  // React Hooks
  generateReactHooks();
  migrateComponentsToHooks();

  // Data vers Prisma DB
  migrateDataToPrisma();

  // Finalisation
  patchNextConfigRedirects();
  fixApiFolder();
  validateSchemaChanges();
  bulletproofMigrationSystem();
  healthcheck();

  console.log("🎉 generateCompleteSystem terminé avec succès !");
} catch (err) {
  console.error("❌ ERREUR:", err.message);
  console.error(err.stack);
  process.exit(1);
}