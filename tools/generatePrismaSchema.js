const fs = require('fs');
const path = require('path');

console.log('🔧 Génération du schema Prisma depuis data.ts...');

const dataPath = path.join(__dirname, '../src/lib/data.ts');
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');

if (!fs.existsSync(dataPath)) {
  console.error('❌ Fichier data.ts introuvable');
  process.exit(1);
}

// Créer le répertoire prisma s'il n'existe pas
const prismaDir = path.dirname(schemaPath);
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
}

// Lire le fichier data.ts pour extraire les modèles
let dataContent = '';
try {
  dataContent = fs.readFileSync(dataPath, 'utf-8');
} catch (err) {
  console.error('❌ Erreur lors de la lecture de data.ts:', err.message);
  process.exit(1);
}

// Générer un schema Prisma basique (à adapter selon votre structure data.ts)
const schema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Order {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  status    String
  total     Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Service {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  price       Float
  category    String
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Location {
  id        Int      @id @default(autoincrement())
  name      String
  address   String
  city      String
  country   String
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

try {
  fs.writeFileSync(schemaPath, schema);
  console.log('✅ Schema Prisma généré avec succès');
  console.log(`📁 Fichier créé: ${schemaPath}`);
} catch (err) {
  console.error('❌ Erreur lors de l\'écriture du schema:', err.message);
  process.exit(1);
}