const fs = require('fs');
const path = require('path');

console.log('🔧 Génération du schema Prisma depuis data.ts...');

// Créer le répertoire prisma s'il n'existe pas
const prismaDir = path.join(__dirname, '../prisma');
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
}

const schemaPath = path.join(prismaDir, 'schema.prisma');

// Schema Prisma complet avec toutes les relations correctes
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
  orders    Order[]  // Relation inverse vers Order
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

model Site {
  id        Int      @id @default(autoincrement())
  name      String
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  hosts     Host[]
  tags      Tag[]
  rooms     Room[]
  tables    Table[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Host {
  id        Int      @id @default(autoincrement())
  name      String
  siteId    Int
  site      Site     @relation(fields: [siteId], references: [id])
  orders    Order[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Tag {
  id        Int      @id @default(autoincrement())
  name      String
  color     String?
  siteId    Int
  site      Site     @relation(fields: [siteId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Room {
  id        Int      @id @default(autoincrement())
  name      String
  capacity  Int?
  siteId    Int
  site      Site     @relation(fields: [siteId], references: [id])
  tables    Table[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Table {
  id           Int           @id @default(autoincrement())
  number       String
  capacity     Int
  siteId       Int
  site         Site          @relation(fields: [siteId], references: [id])
  roomId       Int?
  room         Room?         @relation(fields: [roomId], references: [id])
  reservations Reservation[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Reservation {
  id        Int      @id @default(autoincrement())
  tableId   Int
  table     Table    @relation(fields: [tableId], references: [id])
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  startTime DateTime
  endTime   DateTime
  guests    Int
  status    String   @default("pending")
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
