const fs = require('fs');
const path = require('path');

console.log('🔧 Génération du schema Prisma depuis data.ts...');

// Créer le répertoire prisma s'il n'existe pas
const prismaDir = path.join(__dirname, '../prisma');
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
}

const schemaPath = path.join(prismaDir, 'schema.prisma');

// Schema Prisma complet analysé depuis data.ts
const schema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User model - Base users (admin, host, client)
model User {
  id           String        @id @default(cuid())
  email        String        @unique
  nom          String
  role         String        // 'admin', 'host', 'client'
  motDePasse   String
  hostId       String?       // Si role = 'host', référence vers Host
  host         Host?         @relation(fields: [hostId], references: [hostId])
  orders       Order[]       @relation("UserOrders")
  reservations Reservation[] @relation("UserReservations")
  clients      Client[]      @relation("UserClients")
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

// Host model - Establishments (hotels, restaurants)
model Host {
  id                        String                   @id @default(cuid())
  hostId                    String                   @unique
  nom                       String
  email                     String
  globalSiteId              String?
  reservationPageSettings   Json? // ReservationPageSettings as JSON
  loyaltySettings          Json? // LoyaltySettings as JSON
  users                    User[]
  sites                    Site[]
  roomsOrTables            RoomOrTable[]
  services                 Service[]
  categories               ServiceCategory[]
  customForms              CustomForm[]
  orders                   Order[]
  reservations             Reservation[]
  clients                  Client[]
  tags                     Tag[]
  menuCards                MenuCard[]
  createdAt                DateTime                 @default(now())
  updatedAt                DateTime                 @updatedAt
}

// Site model - Physical locations within a host
model Site {
  id              String        @id @default(cuid())
  globalSiteId    String        @unique
  nom             String
  hostId          String
  host            Host          @relation(fields: [hostId], references: [hostId])
  roomsOrTables   RoomOrTable[]
  tags            Tag[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

// RoomOrTable model - Rooms and Tables
model RoomOrTable {
  id                    String        @id @default(cuid())
  nom                   String
  type                  String        // 'Chambre', 'Table', 'Site'
  hostId                String
  globalSiteId          String?
  parentLocationId      String?
  urlPersonnalise       String?
  capacity              Int?
  prixParNuit           Float?
  prixFixeReservation   Float?
  pricingModel          String?       // 'perPerson', 'perRoom'
  description           String?
  imageUrls             String[]      // Array of image URLs
  imageAiHint           String?
  amenityIds            String[]      // Array of amenity IDs
  tagIds                String[]      // Array of tag IDs
  menuCardId            String?
  currency              String        @default("EUR")
  host                  Host          @relation(fields: [hostId], references: [hostId])
  site                  Site?         @relation(fields: [globalSiteId], references: [globalSiteId])
  parentLocation        RoomOrTable?  @relation("LocationHierarchy", fields: [parentLocationId], references: [id])
  childLocations        RoomOrTable[] @relation("LocationHierarchy")
  menuCard              MenuCard?     @relation(fields: [menuCardId], references: [id])
  services              Service[]     @relation("LocationServices")
  orders                Order[]
  reservations          Reservation[]
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt
}

// Service model - Services offered
model Service {
  id                String           @id @default(cuid())
  titre             String
  description       String?
  image             String?
  dataAiHint        String?          @map("data-ai-hint")
  categorieId       String
  hostId            String
  formulaireId      String?
  prix              Float?
  targetLocationIds String[]         // Array of location IDs
  loginRequired     Boolean          @default(false)
  currency          String           @default("EUR")
  host              Host             @relation(fields: [hostId], references: [hostId])
  category          ServiceCategory  @relation(fields: [categorieId], references: [id])
  customForm        CustomForm?      @relation(fields: [formulaireId], references: [id])
  locations         RoomOrTable[]    @relation("LocationServices")
  orders            Order[]
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
}

// ServiceCategory model - Service categories
model ServiceCategory {
  id        String    @id @default(cuid())
  nom       String
  hostId    String
  host      Host      @relation(fields: [hostId], references: [hostId])
  services  Service[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

// CustomForm model - Forms for services
model CustomForm {
  id        String      @id @default(cuid())
  titre     String
  hostId    String
  fields    FormField[] // Related form fields
  host      Host        @relation(fields: [hostId], references: [hostId])
  services  Service[]
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
}

// FormField model - Individual form fields
model FormField {
  id           String     @id @default(cuid())
  nom          String
  type         String     // 'text', 'select', 'number', etc.
  obligatoire  Boolean    @default(false)
  options      String[]   // Array of options for select fields
  customFormId String
  customForm   CustomForm @relation(fields: [customFormId], references: [id])
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

// Order model - Service orders
model Order {
  id                  String       @id @default(cuid())
  serviceId           String
  hostId              String
  chambreTableId      String?
  clientNom           String?
  userId              String?
  clientId            String?
  donneesFormulaire   String?      // JSON string
  dateHeure           DateTime
  status              String       // 'pending', 'confirmed', 'completed', 'cancelled'
  prixTotal           Float
  montantPaye         Float        @default(0)
  soldeDu             Float?
  pointsGagnes        Int?         @default(0)
  currency            String       @default("EUR")
  paiements           Json[]       // Array of payment objects as JSON
  service             Service      @relation(fields: [serviceId], references: [id])
  host                Host         @relation(fields: [hostId], references: [hostId])
  location            RoomOrTable? @relation(fields: [chambreTableId], references: [id])
  user                User?        @relation("UserOrders", fields: [userId], references: [id])
  client              Client?      @relation(fields: [clientId], references: [id])
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
}

// Client model - Customer profiles
model Client {
  id                  String        @id @default(cuid())
  nom                 String
  email               String?
  telephone           String?
  typeClient          String        // 'individuel', 'groupe', 'entreprise'
  hostId              String
  userId              String?
  totalPointsFidelite Int           @default(0)
  derniereVisite      DateTime?
  nombreVisites       Int           @default(0)
  notes               String?
  host                Host          @relation(fields: [hostId], references: [hostId])
  user                User?         @relation("UserClients", fields: [userId], references: [id])
  orders              Order[]
  reservations        Reservation[]
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
}

// Reservation model - Room and table reservations
model Reservation {
  id                    String       @id @default(cuid())
  hostId                String
  locationId            String
  type                  String       // 'Chambre', 'Table'
  clientName            String
  clientId              String?
  userId                String?
  dateArrivee           String       // Date string (YYYY-MM-DD)
  dateDepart            String?      // Date string (YYYY-MM-DD) - optional for tables
  nombrePersonnes       Int
  status                String       // 'pending', 'confirmed', 'checked-in', 'completed', 'cancelled'
  prixTotal             Float
  montantPaye           Float        @default(0)
  soldeDu               Float?
  currency              String       @default("EUR")
  onlineCheckinStatus   String?      @default("not-started")
  onlineCheckinData     Json?        // OnlineCheckinData as JSON
  notes                 String?
  paiements             Json[]       // Array of payment objects as JSON
  host                  Host         @relation(fields: [hostId], references: [hostId])
  location              RoomOrTable  @relation(fields: [locationId], references: [id])
  client                Client?      @relation(fields: [clientId], references: [id])
  user                  User?        @relation("UserReservations", fields: [userId], references: [id])
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt
}

// Tag model - Tags for locations and services
model Tag {
  id        String   @id @default(cuid())
  nom       String
  couleur   String?
  hostId    String
  host      Host     @relation(fields: [hostId], references: [hostId])
  site      Site?    @relation(fields: [hostId], references: [globalSiteId])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// MenuCard model - Menu cards for locations
model MenuCard {
  id           String        @id @default(cuid())
  nom          String
  hostId       String
  locations    RoomOrTable[]
  categories   MenuCategory[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

// MenuCategory model - Categories within menu cards
model MenuCategory {
  id         String     @id @default(cuid())
  nom        String
  menuCardId String
  items      MenuItem[]
  menuCard   MenuCard   @relation(fields: [menuCardId], references: [id])
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
}

// MenuItem model - Individual menu items
model MenuItem {
  id             String              @id @default(cuid())
  nom            String
  description    String?
  prix           Float
  image          String?
  available      Boolean             @default(true)
  categoryId     String
  optionGroups   MenuItemOptionGroup[]
  category       MenuCategory        @relation(fields: [categoryId], references: [id])
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt
}

// MenuItemOptionGroup model - Option groups for menu items
model MenuItemOptionGroup {
  id         String           @id @default(cuid())
  nom        String
  required   Boolean          @default(false)
  maxChoices Int?
  menuItemId String
  options    MenuItemOption[]
  menuItem   MenuItem         @relation(fields: [menuItemId], references: [id])
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt
}

// MenuItemOption model - Individual options within option groups
model MenuItemOption {
  id            String              @id @default(cuid())
  nom           String
  prixExtra     Float               @default(0)
  available     Boolean             @default(true)
  optionGroupId String
  optionGroup   MenuItemOptionGroup @relation(fields: [optionGroupId], references: [id])
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
}`;

try {
  fs.writeFileSync(schemaPath, schema);
  console.log('✅ Schema Prisma généré avec succès');
  console.log(`📁 Fichier créé: ${schemaPath}`);
} catch (err) {
  console.error('❌ Erreur lors de l\'écriture du schema:', err.message);
  process.exit(1);
}
