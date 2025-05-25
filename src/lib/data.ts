// src/lib/data.ts
import type { User, Site, Host, RoomOrTable, ServiceCategory, CustomForm, FormField, Service, Order, OrderStatus, Client, ClientType, Reservation, ReservationStatus, Tag, LoyaltySettings, ReservationPageSettings, OnlineCheckinData, OnlineCheckinStatus, Paiement, MenuCard, MenuCategory, MenuItem } from './types';
// import { db } from './firebase'; // Firebase is neutralized for now
// import { collection, getDocs, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';

const log = (message: string, data?: any) => {
  // console.log(`[Data Layer Memory] ${new Date().toISOString()}: ${message}`, data !== undefined ? data : '');
}
log("Data layer initialized. USING IN-MEMORY DATA for all entities.");

// --- In-memory data store ---
let usersInMemory: User[] = [
  { id: 'user-admin-01', email: 'kamel@gmail.com', nom: 'Kamel Admin', role: 'admin', motDePasse: '0000' },
  { id: 'user-host-paradise', email: 'manager@paradise.com', nom: 'Paradise Manager', role: 'host', hostId: 'host-paradise-resort', motDePasse: '1234' },
  { id: 'user-host-delice', email: 'contact@delice.com', nom: 'Delice Owner', role: 'host', hostId: 'host-le-delice', motDePasse: '1234' },
  { id: 'user-host-salty-pelican', email: 'hello@saltypelican.com', nom: 'Salty Pelican Lodge', role: 'host', hostId: 'host-salty-pelican', motDePasse: '1234' },
  { id: 'user-host-le-phare', email: 'info@lepharebistro.com', nom: 'Le Phare Bistro', role: 'host', hostId: 'host-le-phare', motDePasse: '1234' },
  { id: 'user-client-alice', email: 'alice@example.com', nom: 'Alice Wonderland', role: 'client', motDePasse: '1234' },
  { id: 'user-client-bob', email: 'bob@example.com', nom: 'Bob The Builder', role: 'client', motDePasse: '1234' },
  { id: 'user-dynamic-host', email: 'dynamic@host.com', nom: 'Dynamic Host User', role: 'host', hostId: 'host-1747669860022', motDePasse: '1234' },
];

const defaultLoyaltySettings: LoyaltySettings = {
  enabled: false,
  pointsPerEuroSpent: 1,
  pointsPerNightRoom: 10,
  pointsPerTableBooking: 5,
  pointsForNewClientSignup: 20,
};

const defaultReservationPageSettings: ReservationPageSettings = {
  enableRoomReservations: true,
  enableTableReservations: true,
  heroImageUrl: 'https://placehold.co/1200x300.png?text=Bienvenue',
  heroImageAiHint: 'establishment banner',
};

let hostsInMemory: Host[] = [
  { hostId: 'host-paradise-resort', nom: 'Paradise Beach Resort', email: 'manager@paradise.com', currency: 'USD', language: 'en', reservationPageSettings: { ...defaultReservationPageSettings, heroImageUrl: 'https://placehold.co/1200x400.png?text=Paradise+Resort+Banner', heroImageAiHint: 'resort beach banner' }, loyaltySettings: { ...defaultLoyaltySettings, enabled: true, pointsPerEuroSpent: 1, pointsPerNightRoom: 10, pointsPerTableBooking: 5, pointsForNewClientSignup: 50 } },
  { hostId: 'host-le-delice', nom: 'Le Delice Downtown', email: 'contact@delice.com', currency: 'EUR', language: 'fr', reservationPageSettings: { ...defaultReservationPageSettings, heroImageUrl: 'https://placehold.co/1200x400.png?text=Le+Delice+Banner', heroImageAiHint: 'restaurant city banner', enableRoomReservations: false }, loyaltySettings: { ...defaultLoyaltySettings } },
  { hostId: 'host-salty-pelican', nom: 'The Salty Pelican Beach Lodge', email: 'hello@saltypelican.com', currency: 'USD', language: 'en', reservationPageSettings: { ...defaultReservationPageSettings, heroImageUrl: 'https://placehold.co/1200x400.png?text=Salty+Pelican+Lodge', heroImageAiHint: 'beach lodge hotel', enableTableReservations: false }, loyaltySettings: { ...defaultLoyaltySettings, enabled: true, pointsPerNightRoom: 15, pointsForNewClientSignup: 25 } },
  { hostId: 'host-le-phare', nom: 'Le Phare Bistro', email: 'info@lepharebistro.com', currency: 'EUR', language: 'fr', reservationPageSettings: { ...defaultReservationPageSettings, heroImageUrl: 'https://placehold.co/1200x400.png?text=Le+Phare+Bistro', heroImageAiHint: 'bistro beach cafe', enableRoomReservations: false}, loyaltySettings: { ...defaultLoyaltySettings, enabled: true, pointsPerEuroSpent: 0.5, pointsPerTableBooking: 3, pointsForNewClientSignup: 10 } },
  { hostId: 'host-1747669860022', nom: 'Dynamic Test Establishment', email: 'dynamic@host.com', currency: 'EUR', language: 'fr', reservationPageSettings: { ...defaultReservationPageSettings, heroImageUrl: 'https://placehold.co/1200x400.png?text=Dynamic+Test', heroImageAiHint: 'dynamic test banner' }, loyaltySettings: { ...defaultLoyaltySettings, enabled: true } },
];

let sitesInMemory: Site[] = [
  { siteId: 'site-paradise-resort', nom: 'Paradise Beach Resort (Global)', hostId: 'host-paradise-resort', logoUrl: 'https://placehold.co/100x100.png?text=PBR', logoAiHint: 'resort logo', primaryColor: '#0D9488' /* Teal */ },
  { siteId: 'site-le-delice', nom: 'Le Delice Downtown (Global)', hostId: 'host-le-delice', logoUrl: 'https://placehold.co/100x100.png?text=LDD', logoAiHint: 'restaurant logo', primaryColor: '#7C3AED' /* Purple */ },
  { siteId: 'site-salty-pelican', nom: 'The Salty Pelican (Global)', hostId: 'host-salty-pelican', logoUrl: 'https://placehold.co/100x100.png?text=TSP', logoAiHint: 'beach lodge logo', primaryColor: '#F97316' /* Orange */ },
  { siteId: 'site-le-phare', nom: 'Le Phare Bistro (Global)', hostId: 'host-le-phare', logoUrl: 'https://placehold.co/100x100.png?text=LPB', logoAiHint: 'bistro logo', primaryColor: '#2563EB' /* Blue */ },
  { siteId: 'site-dynamic-01', nom: 'Dynamic Test Establishment (Global)', hostId: 'host-1747669860022', logoUrl: 'https://placehold.co/100x100.png?text=DYN', logoAiHint: 'dynamic logo', primaryColor: '#DC2626' /* Red */ },
];

let tagsInMemory: Tag[] = [
  { id: 'tag-vue-mer', name: 'Vue Mer', hostId: 'host-salty-pelican' },
  { id: 'tag-vue-mer-paradise', name: 'Vue Mer', hostId: 'host-paradise-resort' },
  { id: 'tag-famille', name: 'Famille', hostId: 'host-salty-pelican' },
  { id: 'tag-famille-paradise', name: 'Famille', hostId: 'host-paradise-resort' },
  { id: 'tag-animaux', name: 'Animaux Admis', hostId: 'host-salty-pelican' },
  { id: 'tag-exterieur', name: 'Extérieur', hostId: 'host-le-phare' },
  { id: 'tag-calme', name: 'Calme', hostId: 'host-paradise-resort' },
  { id: 'tag-luxe', name: 'Luxe', hostId: 'host-paradise-resort' },
  { id: 'tag-romantique', name: 'Romantique', hostId: 'host-le-delice' },
];

let roomsOrTablesInMemory: RoomOrTable[] = [
  // Salty Pelican
  { id: 'sp-room-ocean-double', nom: 'Ocean Double', type: 'Chambre', hostId: 'host-salty-pelican', globalSiteId: 'site-salty-pelican', urlPersonnalise: `/client/host-salty-pelican/sp-room-ocean-double`, capacity: 2, prixParNuit: 150, description: "Chambre double avec vue imprenable sur l'océan.", imageUrls: ["https://placehold.co/600x400.png?text=Ocean+View+Double"], imageAiHint: "ocean view room", tagIds: ['tag-vue-mer'], amenityIds: ['wifi', 'salle-de-bain', 'tv', 'terrasse-balcon'] },
  { id: 'sp-room-garden-bungalow', nom: 'Garden Bungalow', type: 'Chambre', hostId: 'host-salty-pelican', globalSiteId: 'site-salty-pelican', urlPersonnalise: `/client/host-salty-pelican/sp-room-garden-bungalow`, capacity: 4, prixParNuit: 180, description: "Bungalow spacieux avec accès direct au jardin, idéal pour les familles.", imageUrls: ["https://placehold.co/600x400.png?text=Garden+Bungalow"], imageAiHint: "garden bungalow family", tagIds: ['tag-famille', 'tag-animaux'], amenityIds: ['wifi', 'salle-de-bain', 'cuisine', 'animaux-acceptes', 'climatisation'] },
  { id: 'sp-zone-terrasse', nom: 'Terrasse Plage', type: 'Site', hostId: 'host-salty-pelican', globalSiteId: 'site-salty-pelican', urlPersonnalise: `/client/host-salty-pelican/sp-zone-terrasse`, description: "Terrasse ensoleillée face à la mer.", amenityIds: ['wifi'] },
  { id: 'sp-table-terrasse-1', nom: 'Table Terrasse Vue Mer 1', type: 'Table', hostId: 'host-salty-pelican', globalSiteId: 'site-salty-pelican', parentLocationId: 'sp-zone-terrasse', urlPersonnalise: `/client/host-salty-pelican/sp-table-terrasse-1`, capacity: 4, prixFixeReservation: 10, description: "Table avec la meilleure vue." },

  // Le Phare Bistro
  { id: 'lp-zone-principale', nom: 'Salle Principale Bistro', type: 'Site', hostId: 'host-le-phare', globalSiteId: 'site-le-phare', urlPersonnalise: `/client/host-le-phare/lp-zone-principale`, description: "Ambiance conviviale au coeur du bistro.", amenityIds:['wifi'] },
  { id: 'lp-table-fenetre-1', nom: 'Table Fenêtre 1', type: 'Table', hostId: 'host-le-phare', globalSiteId: 'site-le-phare', parentLocationId: 'lp-zone-principale', urlPersonnalise: `/client/host-le-phare/lp-table-fenetre-1`, capacity: 2, prixFixeReservation: 5, description: "Table intime avec vue sur la rue animée." },
  { id: 'lp-table-groupe-5', nom: 'Table Groupe 5', type: 'Table', hostId: 'host-le-phare', globalSiteId: 'site-le-phare', parentLocationId: 'lp-zone-principale', urlPersonnalise: `/client/host-le-phare/lp-table-groupe-5`, capacity: 6, prixFixeReservation: 15, description: "Grande table pour les groupes.", tagIds: ['tag-exterieur'] },

  // Paradise Beach Resort
  { id: 'pbr-lobby', nom: 'Lobby Principal Paradise', type: 'Site', hostId: 'host-paradise-resort', globalSiteId: 'site-paradise-resort', urlPersonnalise: `/client/host-paradise-resort/pbr-lobby`, amenityIds: ['wifi', 'climatisation'] },
  { id: 'pbr-room-deluxe-king', nom: 'Deluxe King Suite', type: 'Chambre', hostId: 'host-paradise-resort', globalSiteId: 'site-paradise-resort', parentLocationId: 'pbr-lobby', urlPersonnalise: `/client/host-paradise-resort/pbr-room-deluxe-king`, capacity: 2, prixParNuit: 250, description: "Suite luxueuse avec lit King Size et vue mer.", imageUrls: ["https://placehold.co/600x400.png?text=Deluxe+King"], imageAiHint: "luxury suite king", tagIds: ['tag-vue-mer-paradise', 'tag-luxe'], amenityIds: ['wifi', 'salle-de-bain', 'tv', 'climatisation', 'terrasse-balcon', 'petit-dejeuner-inclus'] },
  { id: 'pbr-room-standard-twin', nom: 'Standard Twin Vue Jardin', type: 'Chambre', hostId: 'host-paradise-resort', globalSiteId: 'site-paradise-resort', parentLocationId: 'pbr-lobby', urlPersonnalise: `/client/host-paradise-resort/pbr-room-standard-twin`, capacity: 2, prixParNuit: 120, description: "Chambre confortable avec deux lits jumeaux et vue sur les jardins.", imageUrls: ["https://placehold.co/600x400.png?text=Standard+Twin"], imageAiHint: "twin room garden", tagIds: ['tag-calme', 'tag-famille-paradise'], amenityIds: ['wifi', 'salle-de-bain', 'tv'] },
  { id: 'pbr-zone-piscine', nom: 'Espace Piscine Paradise', type: 'Site', hostId: 'host-paradise-resort', globalSiteId: 'site-paradise-resort', urlPersonnalise: `/client/host-paradise-resort/pbr-zone-piscine`, amenityIds: ['piscine', 'jacuzzi'] },
  { id: 'pbr-table-piscine-A', nom: 'Table Cabana Piscine A', type: 'Table', hostId: 'host-paradise-resort', globalSiteId: 'site-paradise-resort', parentLocationId: 'pbr-zone-piscine', urlPersonnalise: `/client/host-paradise-resort/pbr-table-piscine-A`, capacity: 6, prixFixeReservation: 25, description: "Cabana privée près de la piscine." },

  // Le Delice Downtown
  { id: 'ldd-salle-principale', nom: 'Salle Restaurant Le Delice', type: 'Site', hostId: 'host-le-delice', globalSiteId: 'site-le-delice', urlPersonnalise: `/client/host-le-delice/ldd-salle-principale`, amenityIds: ['wifi', 'climatisation'] },
  { id: 'ldd-table-romantique-2', nom: 'Table Romantique 2pax', type: 'Table', hostId: 'host-le-delice', globalSiteId: 'site-le-delice', parentLocationId: 'ldd-salle-principale', urlPersonnalise: `/client/host-le-delice/ldd-table-romantique-2`, capacity: 2, prixFixeReservation: 10, description: "Table parfaite pour un dîner en amoureux.", tagIds:['tag-romantique'] },

  // Dynamic Test Establishment
  { id: 'rt-dynamic-lobby', nom: 'Dynamic Lobby', type: 'Site', hostId: 'host-1747669860022', globalSiteId: 'site-dynamic-01', urlPersonnalise: `/client/host-1747669860022/rt-dynamic-lobby`, description: "Lobby for the dynamic establishment.", amenityIds: ['wifi'] },
  { id: 'rt-dynamic-room1', nom: 'Dynamic Room 101', type: 'Chambre', hostId: 'host-1747669860022', globalSiteId: 'site-dynamic-01', parentLocationId: 'rt-dynamic-lobby', urlPersonnalise: `/client/host-1747669860022/rt-dynamic-room1`, capacity: 2, prixParNuit: 100, description: "A standard room in the dynamic establishment.", imageUrls: ["https://placehold.co/600x400.png?text=Dynamic+Room+101"], imageAiHint: "dynamic room hotel", amenityIds: ['wifi', 'salle-de-bain', 'tv'] },
  { id: 'rt-dynamic-table5', nom: 'Dynamic Table 5', type: 'Table', hostId: 'host-1747669860022', globalSiteId: 'site-dynamic-01', parentLocationId: 'rt-dynamic-lobby', urlPersonnalise: `/client/host-1747669860022/rt-dynamic-table5`, capacity: 4, prixFixeReservation: 5, description: "A table in the dynamic lobby.", amenityIds: ['wifi'] },
];

let serviceCategoriesInMemory: ServiceCategory[] = [
  { id: 'cat-sp-breakfast', nom: 'Petit Déjeuner (Salty Pelican)', hostId: 'host-salty-pelican', image: 'https://placehold.co/300x200.png?text=Breakfast', "data-ai-hint": "breakfast food" },
  { id: 'cat-sp-activities', nom: 'Activités Plage (Salty Pelican)', hostId: 'host-salty-pelican', image: 'https://placehold.co/300x200.png?text=Beach+Fun', "data-ai-hint": "beach activity" },
  { id: 'cat-lp-menu', nom: 'Menu Bistro (Le Phare)', hostId: 'host-le-phare', image: 'https://placehold.co/300x200.png?text=Bistro+Menu', "data-ai-hint": "restaurant menu" },
  { id: 'cat-lp-drinks', nom: 'Boissons (Le Phare)', hostId: 'host-le-phare', image: 'https://placehold.co/300x200.png?text=Drinks', "data-ai-hint": "drinks beverages" },
  { id: 'cat-pbr-dining', nom: 'Restaurant Gastronomique (Paradise)', hostId: 'host-paradise-resort', image: 'https://placehold.co/300x200.png?text=Fine+Dining', "data-ai-hint": "fine dining" },
  { id: 'cat-pbr-spa', nom: 'Services Spa (Paradise)', hostId: 'host-paradise-resort', image: 'https://placehold.co/300x200.png?text=Spa', "data-ai-hint": "spa wellness" },
  { id: 'cat-pbr-roomservice', nom: 'Room Service (Paradise)', hostId: 'host-paradise-resort', image: 'https://placehold.co/300x200.png?text=Room+Service', "data-ai-hint": "room service hotel" },
  { id: 'cat-ldd-plats', nom: 'Plats Signatures (Le Delice)', hostId: 'host-le-delice', image: 'https://placehold.co/300x200.png?text=Signature+Dishes', "data-ai-hint": "signature dish" },
  { id: 'cat-dyn-main', nom: 'Main Menu (Dynamic Est.)', hostId: 'host-1747669860022', image: 'https://placehold.co/300x200.png?text=Dynamic+Menu', "data-ai-hint": "dynamic menu general" },
];

let customFormsInMemory: CustomForm[] = [
  { id: 'form-sp-activity-booking', nom: 'Réservation Activité (Salty Pelican)', hostId: 'host-salty-pelican' },
  { id: 'form-lp-table-request', nom: 'Demande Spéciale Table (Le Phare)', hostId: 'host-le-phare' },
  { id: 'form-pbr-spa-treatment', nom: 'Choix Soin Spa (Paradise)', hostId: 'host-paradise-resort' },
  { id: 'form-dyn-generic', nom: 'Generic Request Form (Dynamic Est.)', hostId: 'host-1747669860022' },
];

let formFieldsInMemory: FormField[] = [
  { id: 'field-sp-activity-participants', formulaireId: 'form-sp-activity-booking', label: 'Nombre de participants', type: 'number', obligatoire: true, ordre: 1, placeholder: 'e.g., 2' },
  { id: 'field-sp-activity-date', formulaireId: 'form-sp-activity-booking', label: 'Date souhaitée', type: 'date', obligatoire: true, ordre: 2 },
  { id: 'field-lp-table-occasion', formulaireId: 'form-lp-table-request', label: 'Occasion spéciale ?', type: 'text', obligatoire: false, ordre: 1, placeholder: 'Anniversaire, etc.' },
  { id: 'field-pbr-spa-choice', formulaireId: 'form-pbr-spa-treatment', label: 'Type de massage souhaité', type: 'text', obligatoire: true, ordre: 1, placeholder: 'Relaxant, Tissus Profonds...' },
  { id: 'field-pbr-spa-duration', formulaireId: 'form-pbr-spa-treatment', label: 'Durée (minutes)', type: 'number', obligatoire: true, ordre: 2, placeholder: '60' },
  { id: 'field-dyn-request-details', formulaireId: 'form-dyn-generic', label: 'Your Request Details', type: 'textarea', obligatoire: true, ordre: 1, placeholder: 'Please describe your request...' },
];

let servicesInMemory: Service[] = [
  // Salty Pelican Services
  { id: 'svc-sp-breakfast', titre: 'Petit Déjeuner Continental', description: 'Café, thé, jus, viennoiseries, fruits frais.', image: 'https://placehold.co/600x400.png?text=Continental+Breakfast', "data-ai-hint": "breakfast continental", categorieId: 'cat-sp-breakfast', hostId: 'host-salty-pelican', prix: 15, targetLocationIds: ['sp-room-ocean-double', 'sp-room-garden-bungalow'], loginRequired: false },
  { id: 'svc-sp-kayak', titre: 'Location de Kayak (1h)', description: 'Explorez la côte en kayak.', image: 'https://placehold.co/600x400.png?text=Kayak+Rental', "data-ai-hint": "kayak beach", categorieId: 'cat-sp-activities', hostId: 'host-salty-pelican', formulaireId: 'form-sp-activity-booking', prix: 20, targetLocationIds: ['sp-zone-terrasse'], loginRequired: true },
  { id: 'svc-sp-yoga', titre: 'Cours de Yoga au Lever du Soleil', description: 'Session de yoga revitalisante sur la plage.', image: 'https://placehold.co/600x400.png?text=Sunrise+Yoga', "data-ai-hint": "yoga sunrise beach", categorieId: 'cat-sp-activities', hostId: 'host-salty-pelican', prix: 25, targetLocationIds: [], loginRequired: true, pointsRequis: 100 },

  // Le Phare Bistro Services
  { id: 'svc-lp-espresso', titre: 'Espresso Intense', description: 'Un shot de pur café italien.', image: 'https://placehold.co/600x400.png?text=Espresso', "data-ai-hint": "espresso coffee", categorieId: 'cat-lp-drinks', hostId: 'host-le-phare', prix: 2.5, targetLocationIds: [], loginRequired: false },
  { id: 'svc-lp-croissant', titre: 'Croissant Beurre Frais', description: 'Viennoiserie parisienne classique.', image: 'https://placehold.co/600x400.png?text=Croissant', "data-ai-hint": "croissant pastry", categorieId: 'cat-lp-menu', hostId: 'host-le-phare', prix: 3, targetLocationIds: [], loginRequired: false },
  { id: 'svc-lp-soupe-jour', titre: 'Soupe du Jour Maison', description: 'Servie avec pain croustillant.', image: 'https://placehold.co/600x400.png?text=Daily+Soup', "data-ai-hint": "soup daily", categorieId: 'cat-lp-menu', hostId: 'host-le-phare', prix: 7, targetLocationIds: [], loginRequired: false },

  // Paradise Beach Resort Services
  { id: 'svc-pbr-dinner', titre: 'Dîner Gastronomique 3 Plats', description: 'Menu dégustation par notre chef étoilé.', image: 'https://placehold.co/600x400.png?text=3-Course+Dinner', "data-ai-hint": "gourmet dinner food", categorieId: 'cat-pbr-dining', hostId: 'host-paradise-resort', prix: 75, targetLocationIds: [], loginRequired: true, pointsRequis: 300 },
  { id: 'svc-pbr-massage', titre: 'Massage Tissus Profonds (60 min)', description: 'Relâchez toutes vos tensions.', image: 'https://placehold.co/600x400.png?text=Deep+Tissue+Massage', "data-ai-hint": "massage spa", categorieId: 'cat-pbr-spa', hostId: 'host-paradise-resort', formulaireId: 'form-pbr-spa-treatment', prix: 90, targetLocationIds: [], loginRequired: true },
  { id: 'svc-pbr-mojito', titre: 'Mojito Classique Piscine', description: 'Rhum, menthe, citron vert, sucre, eau gazeuse.', image: 'https://placehold.co/600x400.png?text=Mojito', "data-ai-hint": "mojito cocktail", categorieId: 'cat-pbr-roomservice', hostId: 'host-paradise-resort', prix: 12, targetLocationIds: ['pbr-zone-piscine', 'pbr-room-deluxe-king'], loginRequired: false },

  // Le Delice Downtown Services
  { id: 'svc-ldd-boeuf', titre: 'Filet de Boeuf Rossini', description: 'Tournedos de bœuf, foie gras poêlé, sauce Périgueux.', image: 'https://placehold.co/600x400.png?text=Filet+Rossini', "data-ai-hint": "beef steak food", categorieId: 'cat-ldd-plats', hostId: 'host-le-delice', prix: 35, targetLocationIds: [], loginRequired: false },

  // Dynamic Test Establishment Services
  { id: 'svc-dyn-water', titre: 'Bottled Water', description: 'Refreshing spring water.', image: 'https://placehold.co/600x400.png?text=Water+Bottle', "data-ai-hint": "water bottle", categorieId: 'cat-dyn-main', hostId: 'host-1747669860022', prix: 2, targetLocationIds: ['rt-dynamic-room1', 'rt-dynamic-table5'], loginRequired: false },
  { id: 'svc-dyn-concierge', titre: 'Concierge Request', description: 'Submit a request to our concierge.', image: 'https://placehold.co/600x400.png?text=Concierge', "data-ai-hint": "concierge service hotel", categorieId: 'cat-dyn-main', hostId: 'host-1747669860022', formulaireId: 'form-dyn-generic', targetLocationIds: ['rt-dynamic-lobby'], loginRequired: true },
];

let ordersInMemory: Order[] = [
  { id: 'order-sp-1', serviceId: 'svc-sp-breakfast', hostId: 'host-salty-pelican', chambreTableId: 'sp-room-ocean-double', clientNom: 'Alice Wonderland', userId: 'user-client-alice', donneesFormulaire: JSON.stringify({}), dateHeure: new Date(Date.now() - 3600000 * 24).toISOString(), status: 'completed', prixTotal: 15, montantPaye: 15, soldeDu: 0, pointsGagnes: 15, currency: 'USD' },
  { id: 'order-lp-1', serviceId: 'svc-lp-espresso', hostId: 'host-le-phare', chambreTableId: 'lp-table-fenetre-1', clientNom: 'Bob The Builder', userId: 'user-client-bob', donneesFormulaire: JSON.stringify({}), dateHeure: new Date(Date.now() - 3600000 * 2).toISOString(), status: 'pending', prixTotal: 2.5, currency: 'EUR' },
  { id: 'order-pbr-1', serviceId: 'svc-pbr-massage', hostId: 'host-paradise-resort', chambreTableId: 'pbr-room-deluxe-king', clientNom: 'Alice Wonderland', userId: 'user-client-alice', donneesFormulaire: JSON.stringify({"Type de massage souhaité": "Relaxant", "Durée (minutes)": 90}), dateHeure: new Date().toISOString(), status: 'confirmed', prixTotal: 120, currency: 'USD' },
  { id: 'order-dyn-1', serviceId: 'svc-dyn-water', hostId: 'host-1747669860022', chambreTableId: 'rt-dynamic-room1', clientNom: 'Guest User', donneesFormulaire: JSON.stringify({}), dateHeure: new Date().toISOString(), status: 'completed', prixTotal: 2, currency: 'EUR' },
];

let clientsInMemory: Client[] = [
    { id: 'client-alice-sp', hostId: 'host-salty-pelican', nom: 'Alice Wonderland', email: 'alice@example.com', type: 'heberge', dateArrivee: '2024-07-20', dateDepart: '2024-07-25', locationId: 'sp-room-ocean-double', notes: 'Aime le yoga.', credit: 20, pointsFidelite: 150, userId: 'user-client-alice' },
    { id: 'client-bob-lp', hostId: 'host-le-phare', nom: 'Bob The Builder', email: 'bob@example.com', type: 'passager', telephone: '+33612345678', notes: 'Client régulier le midi.', credit: 5, pointsFidelite: 80, userId: 'user-client-bob' },
    { id: 'client-alice-pbr', hostId: 'host-paradise-resort', nom: 'Alice Wonderland', email: 'alice@example.com', type: 'heberge', dateArrivee: '2024-08-01', dateDepart: '2024-08-07', locationId: 'pbr-room-deluxe-king', credit: 100, pointsFidelite: 250, userId: 'user-client-alice' },
    { id: 'client-guest-dyn', hostId: 'host-1747669860022', nom: 'Guest User', type: 'heberge', dateArrivee: new Date().toISOString().split('T')[0], dateDepart: new Date(Date.now() + 3600000 * 24 * 2).toISOString().split('T')[0], locationId: 'rt-dynamic-room1', credit: 0, pointsFidelite: 0 },
];

const today = new Date();
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const dayAfterTomorrow = new Date(today); dayAfterTomorrow.setDate(today.getDate() + 2);
const threeDaysLater = new Date(today); threeDaysLater.setDate(today.getDate() + 3);

let reservationsInMemory: Reservation[] = [
    { id: 'res-sp-alice', hostId: 'host-salty-pelican', locationId: 'sp-room-ocean-double', type: 'Chambre', clientName: 'Alice Wonderland', clientId: 'user-client-alice', dateArrivee: today.toISOString().split('T')[0], dateDepart: tomorrow.toISOString().split('T')[0], nombrePersonnes: 2, status: 'confirmed', notes: 'Arrivée tardive prévue.', animauxDomestiques: false, prixTotal: 150, montantPaye: 150, soldeDu: 0, onlineCheckinStatus: 'not-started', currency: 'USD' },
    { id: 'res-lp-bob', hostId: 'host-le-phare', locationId: 'lp-table-groupe-5', type: 'Table', clientName: 'Bob The Builder', clientId: 'user-client-bob', dateArrivee: today.toISOString().split('T')[0], nombrePersonnes: 5, status: 'pending', prixTotal: 15, currency: 'EUR' },
    { id: 'res-pbr-alice-future', hostId: 'host-paradise-resort', locationId: 'pbr-room-standard-twin', type: 'Chambre', clientName: 'Alice Wonderland', clientId: 'user-client-alice', dateArrivee: dayAfterTomorrow.toISOString().split('T')[0], dateDepart: threeDaysLater.toISOString().split('T')[0], nombrePersonnes: 1, status: 'confirmed', prixTotal: 120, onlineCheckinStatus: 'pending-review', onlineCheckinData: {fullName: "Alice W.", email:"alice@example.com", submissionDate: new Date().toISOString()}, currency: 'USD'  },
    { id: 'res-dyn-guest', hostId: 'host-1747669860022', locationId: 'rt-dynamic-room1', type: 'Chambre', clientName: 'Guest User', dateArrivee: today.toISOString().split('T')[0], dateDepart: tomorrow.toISOString().split('T')[0], nombrePersonnes: 1, status: 'pending', prixTotal: 100, currency: 'EUR', onlineCheckinStatus: 'not-started' },
];

let menuCardsInMemory: MenuCard[] = [
  { id: 'mc-salty-main', name: 'Menu Principal Salty Pelican', hostId: 'host-salty-pelican', globalSiteId: 'site-salty-pelican', description: 'Notre sélection pour votre séjour à la plage.', isActive: true },
  { id: 'mc-lephare-jour', name: 'Carte du Jour Le Phare', hostId: 'host-le-phare', globalSiteId: 'site-le-phare', description: 'Produits frais et de saison.', isActive: true },
];

let menuCategoriesInMemory: MenuCategory[] = [
  { id: 'mcat-salty-boissons', name: 'Boissons Fraîches', menuCardId: 'mc-salty-main', hostId: 'host-salty-pelican', displayOrder: 1 },
  { id: 'mcat-salty-snacks', name: 'Snacks de Plage', menuCardId: 'mc-salty-main', hostId: 'host-salty-pelican', displayOrder: 2 },
  { id: 'mcat-lephare-entrees', name: 'Entrées Le Phare', menuCardId: 'mc-lephare-jour', hostId: 'host-le-phare', displayOrder: 1 },
  { id: 'mcat-lephare-plats', name: 'Plats Le Phare', menuCardId: 'mc-lephare-jour', hostId: 'host-le-phare', displayOrder: 2 },
];

let menuItemsInMemory: MenuItem[] = [
  { id: 'mi-salty-coca', name: 'Coca-Cola', description: '33cl, bien frais.', price: 3, menuCategoryId: 'mcat-salty-boissons', hostId: 'host-salty-pelican', imageUrl: 'https://placehold.co/300x200.png?text=Coca-Cola', imageAiHint: 'soda can' },
  { id: 'mi-salty-frites', name: 'Cornet de Frites Maison', description: 'Avec sauce au choix.', price: 5, menuCategoryId: 'mcat-salty-snacks', hostId: 'host-salty-pelican', imageUrl: 'https://placehold.co/300x200.png?text=Frites', imageAiHint: 'fries food' },
  { id: 'mi-lephare-salade', name: 'Salade César', description: 'Poulet grillé, Grana Padano, croûtons à l\'ail.', price: 14, menuCategoryId: 'mcat-lephare-entrees', hostId: 'host-le-phare', imageUrl: 'https://placehold.co/300x200.png?text=Salade+Cesar', imageAiHint: 'caesar salad' },
  { id: 'mi-lephare-poisson', name: 'Poisson du Jour Grillé', description: 'Selon arrivage, légumes de saison.', price: 22, menuCategoryId: 'mcat-lephare-plats', hostId: 'host-le-phare', imageUrl: 'https://placehold.co/300x200.png?text=Poisson+Grille', imageAiHint: 'grilled fish' },
];


// --- User Management ---
const normalizeUserPassword = (user: any): User => {
  try {
    const userData = { ...user };
    if (userData.motDePasse === undefined && userData.password !== undefined) {
      userData.motDePasse = String(userData.password);
    } else if (userData.motDePasse === undefined) {
      userData.motDePasse = ""; // Ensure it's at least an empty string
    } else {
      userData.motDePasse = String(userData.motDePasse); // Ensure it's a string
    }
    delete userData.password;

    if (userData.nom === undefined && userData.email) {
        userData.nom = userData.email.split('@')[0];
    } else if (userData.nom === undefined) {
        userData.nom = "Unnamed User";
    }
    return userData as User;
  } catch(error) {
    log("Error in normalizeUserPassword", {user, error});
    return { id: 'error-user', email: 'error@example.com', nom: 'Error User', role: 'client', motDePasse: '', ...user };
  }
};


export const getUserByEmail = async (email: string): Promise<User | undefined> => {
  log(`getUserByEmail called for: ${email} (in-memory)`);
  try {
    const user = usersInMemory.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      let normalizedUser = { ...user };
      if (normalizedUser.motDePasse === undefined && (user as any).password !== undefined) {
        normalizedUser.motDePasse = String((user as any).password);
      } else if (normalizedUser.motDePasse === undefined) {
        normalizedUser.motDePasse = "";
      } else {
        normalizedUser.motDePasse = String(normalizedUser.motDePasse);
      }
      delete (normalizedUser as any).password;

      if (normalizedUser.nom === undefined && normalizedUser.email) {
        normalizedUser.nom = normalizedUser.email.split('@')[0];
      } else if (normalizedUser.nom === undefined) {
        normalizedUser.nom = "Unnamed User";
      }
      return normalizedUser as User;
    }
    return undefined;
  } catch (e) {
    console.error("Error in getUserByEmail (in-memory):", e);
    return undefined;
  }
};


export const getUserById = async (id: string): Promise<User | undefined> => {
  log(`getUserById called for: ${id} (in-memory)`);
  try {
    const user = usersInMemory.find(u => u.id === id);
    return user ? normalizeUserPassword(user) : undefined;
  } catch (e) {
    console.error("Error in getUserById (in-memory):", e);
    return undefined; // Changed from [] to undefined
  }
};

export const getUsers = async (): Promise<User[]> => {
  log(`getUsers called (in-memory). Returning ${usersInMemory.length} users.`);
   try {
    return [...usersInMemory].map(normalizeUserPassword).sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
  } catch (e) {
    console.error("Error in getUsers (in-memory):", e);
    return [];
  }
};

export const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
  log(`addUser called for: ${userData.email} (in-memory)`);
  try {
    const existingUser = usersInMemory.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existingUser) {
      log(`User with email ${userData.email} already exists. Updating existing user (in-memory).`);
      existingUser.nom = userData.nom || existingUser.email.split('@')[0];
      existingUser.role = userData.role;
      existingUser.hostId = userData.hostId || undefined;
      if (userData.motDePasse && userData.motDePasse.trim() !== '') existingUser.motDePasse = userData.motDePasse.trim();
      return normalizeUserPassword({ ...existingUser });
    }
    if (!userData.motDePasse || userData.motDePasse.trim() === '') {
        throw new Error("Password cannot be empty or just spaces for a new user.");
    }
    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      motDePasse: userData.motDePasse.trim(),
      nom: userData.nom || userData.email.split('@')[0],
      ...userData,
    };
    usersInMemory.push(newUser);
    log(`User ${newUser.email} added (in-memory) with ID ${newUser.id}.`);
    return normalizeUserPassword({ ...newUser });
  } catch (e) {
    console.error("Error in addUser (in-memory):", e);
    throw e;
  }
};

export const updateUser = async (userId: string, userData: Partial<Omit<User, 'id' | 'motDePasse'>> & { motDePasse?: string }): Promise<User | undefined> => {
  log(`updateUser called for ID: ${userId} (in-memory) with data:`, userData);
  try {
    const userIndex = usersInMemory.findIndex(u => u.id === userId);
    if (userIndex > -1) {
      const updatedUser = { ...usersInMemory[userIndex], ...userData };
      if (userData.motDePasse && userData.motDePasse.trim() !== '') {
          updatedUser.motDePasse = userData.motDePasse.trim();
      }
      if (userData.hasOwnProperty('hostId')) {
        updatedUser.hostId = userData.hostId || undefined;
      }
      usersInMemory[userIndex] = normalizeUserPassword(updatedUser);
      log(`User ${userId} updated (in-memory).`);
      return { ...usersInMemory[userIndex] };
    }
    log(`User ${userId} not found for update (in-memory).`);
    return undefined;
  } catch (e) {
    console.error("Error in updateUser (in-memory):", e);
    return undefined;
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  log(`deleteUser called for ID: ${userId} (in-memory)`);
  try {
    const initialLength = usersInMemory.length;
    usersInMemory = usersInMemory.filter(u => u.id !== userId);
    if (usersInMemory.length < initialLength) {
      log(`User ${userId} deleted (in-memory).`);
      clientsInMemory = clientsInMemory.map(c => c.userId === userId ? {...c, userId: undefined} : c);
      ordersInMemory = ordersInMemory.map(o => o.userId === userId ? {...o, userId: undefined} : o);
      reservationsInMemory = reservationsInMemory.map(r => r.clientId === userId ? {...r, clientId: undefined} : r);
      return true;
    }
    log(`User ${userId} not found for deletion (in-memory).`);
    return false;
  } catch (e) {
    console.error("Error in deleteUser (in-memory):", e);
    return false;
  }
};


// --- Host Management (In-memory) ---
export const getHosts = async (): Promise<Host[]> => {
  log(`getHosts called (in-memory). Returning ${hostsInMemory.length} hosts.`);
  try {
    return [...hostsInMemory].sort((a,b) => a.nom.localeCompare(b.nom));
  } catch (e) {
    console.error("Error in getHosts (in-memory):", e);
    return [];
  }
};

export const getHostById = async (hostId: string): Promise<Host | undefined> => {
  log(`getHostById called for: ${hostId} (in-memory)`);
  try {
    return hostsInMemory.find(h => h.hostId === hostId);
  } catch (e) {
    console.error("Error in getHostById (in-memory):", e);
    return undefined;
  }
};

export const addHost = async (hostData: Omit<Host, 'hostId' | 'loyaltySettings' | 'reservationPageSettings' | 'currency' | 'language'> & { loyaltySettings?: Partial<LoyaltySettings>; reservationPageSettings?: Partial<ReservationPageSettings>; currency?:string; language?:string; }): Promise<Host> => {
  log(`addHost called for: ${hostData.email} (in-memory)`);
  try {
    const existingHostByEmail = hostsInMemory.find(h => h.email.toLowerCase() === hostData.email.toLowerCase());
    if (existingHostByEmail) {
        log(`Host with email ${hostData.email} already exists. Updating name if different.`);
        if (existingHostByEmail.nom !== hostData.nom) existingHostByEmail.nom = hostData.nom;
        let associatedUser = usersInMemory.find(u => u.email.toLowerCase() === existingHostByEmail.email.toLowerCase());
        if (associatedUser) {
            await updateUser(associatedUser.id, { nom: existingHostByEmail.nom, role: 'host', hostId: existingHostByEmail.hostId });
        } else {
            await addUser({ email: existingHostByEmail.email, nom: existingHostByEmail.nom, role: 'host', hostId: existingHostByEmail.hostId, motDePasse: '1234' });
        }
        return { ...existingHostByEmail };
    }

    const resolvedReservationSettings: ReservationPageSettings = {
      ...defaultReservationPageSettings,
      ...(hostData.reservationPageSettings || {}),
      heroImageUrl: hostData.reservationPageSettings?.heroImageUrl || `https://placehold.co/1200x400.png?text=${encodeURIComponent(hostData.nom)}+Banner`,
      heroImageAiHint: hostData.reservationPageSettings?.heroImageAiHint || hostData.nom.toLowerCase().split(' ').slice(0,2).join(' ') || 'establishment banner',
    };

    const newHost: Host = {
      hostId: `host-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      nom: hostData.nom,
      email: hostData.email,
      reservationPageSettings: resolvedReservationSettings,
      loyaltySettings: { ...defaultLoyaltySettings, ...(hostData.loyaltySettings || {}) },
      currency: hostData.currency || 'USD',
      language: hostData.language || 'fr',
    };
    hostsInMemory.push(newHost);
    log(`Host ${newHost.email} added (in-memory) with ID ${newHost.hostId}.`);
    await addUser({
      email: newHost.email,
      nom: newHost.nom,
      role: 'host',
      hostId: newHost.hostId,
      motDePasse: '1234',
    });
    return { ...newHost };
  } catch (e) {
    console.error("Error in addHost (in-memory):", e);
    throw e;
  }
};

export const updateHost = async (hostId: string, hostData: Partial<Omit<Host, 'hostId'>>): Promise<Host | undefined> => {
  log(`updateHost called for ID: ${hostId} (in-memory) with data:`, hostData);
  try {
    const hostIndex = hostsInMemory.findIndex(h => h.hostId === hostId);
    if (hostIndex > -1) {
      const originalHostData = { ...hostsInMemory[hostIndex] };
      const updatedReservationSettings: ReservationPageSettings = {
        ...(originalHostData.reservationPageSettings || defaultReservationPageSettings),
        ...(hostData.reservationPageSettings || {}),
      };
      if (hostData.reservationPageSettings?.heroImageUrl || (hostData.nom && hostData.nom !== originalHostData.nom)) {
          updatedReservationSettings.heroImageAiHint = (hostData.nom || originalHostData.nom).toLowerCase().split(' ').slice(0,2).join(' ') + ' banner';
      }
       if (hostData.reservationPageSettings?.heroImageUrl === '') {
          updatedReservationSettings.heroImageUrl = '';
          updatedReservationSettings.heroImageAiHint = '';
      }

      const updatedLoyaltySettings: LoyaltySettings = {
        ...(originalHostData.loyaltySettings || defaultLoyaltySettings),
        ...(hostData.loyaltySettings || {}),
      };

      hostsInMemory[hostIndex] = {
        ...originalHostData,
        ...hostData,
        reservationPageSettings: updatedReservationSettings,
        loyaltySettings: updatedLoyaltySettings,
        currency: hostData.currency !== undefined ? hostData.currency : originalHostData.currency,
        language: hostData.language !== undefined ? hostData.language : originalHostData.language,
      };
      log(`Host ${hostId} updated (in-memory).`);

      const updatedHost = hostsInMemory[hostIndex];
      if ((hostData.email && hostData.email !== originalHostData.email) || (hostData.nom && hostData.nom !== originalHostData.nom)) {
          let userToUpdate = usersInMemory.find(u => u.hostId === hostId);
          if (!userToUpdate) userToUpdate = usersInMemory.find(u => u.email.toLowerCase() === originalHostData.email.toLowerCase() && u.role === 'host');
          if (userToUpdate) {
              await updateUser(userToUpdate.id, { email: updatedHost.email, nom: updatedHost.nom });
              log(`Associated user for host ${hostId} also updated (in-memory).`);
          }
      }
      return { ...hostsInMemory[hostIndex] };
    }
    log(`Host ${hostId} not found for update (in-memory).`);
    return undefined;
  } catch (e) {
    console.error("Error in updateHost (in-memory):", e);
    return undefined;
  }
};

export const deleteHost = async (hostId: string): Promise<boolean> => {
  log(`deleteHost called for ID: ${hostId} (in-memory)`);
  try {
    const hostToDelete = hostsInMemory.find(h => h.hostId === hostId);
    if (!hostToDelete) {
      log(`Host ${hostId} not found for deletion (in-memory).`);
      return false;
    }
    const userToDelete = usersInMemory.find(u => u.hostId === hostId && u.email.toLowerCase() === hostToDelete.email.toLowerCase());
    if (userToDelete) {
      await deleteUser(userToDelete.id);
      log(`Associated user ${userToDelete.email} deleted (in-memory).`);
    } else {
      log(`No user directly associated with hostId ${hostId} and matching email found for deletion.`);
    }
    const initialLength = hostsInMemory.length;
    hostsInMemory = hostsInMemory.filter(h => h.hostId !== hostId);
    const hostDeleted = hostsInMemory.length < initialLength;
    if (hostDeleted) {
      log(`Host ${hostId} deleted (in-memory). Cascading deletes to related in-memory data.`);
      sitesInMemory = sitesInMemory.filter(s => s.hostId !== hostId);
      roomsOrTablesInMemory = roomsOrTablesInMemory.filter(rt => rt.hostId !== hostId);
      serviceCategoriesInMemory = serviceCategoriesInMemory.filter(sc => sc.hostId !== hostId);
      const formsForHost = customFormsInMemory.filter(cf => cf.hostId === hostId);
      const formIdsForHost = formsForHost.map(f => f.id);
      formFieldsInMemory = formFieldsInMemory.filter(ff => !formIdsForHost.includes(ff.formulaireId));
      customFormsInMemory = customFormsInMemory.filter(cf => cf.hostId !== hostId);
      servicesInMemory = servicesInMemory.filter(s => s.hostId !== hostId);
      ordersInMemory = ordersInMemory.filter(o => o.hostId !== hostId);
      clientsInMemory = clientsInMemory.filter(c => c.hostId !== hostId);
      reservationsInMemory = reservationsInMemory.filter(r => r.hostId !== hostId);
      tagsInMemory = tagsInMemory.filter(t => t.hostId !== hostId);
      menuCardsInMemory = menuCardsInMemory.filter(mc => mc.hostId !== hostId);
      menuCategoriesInMemory = menuCategoriesInMemory.filter(mcat => mcat.hostId !== hostId);
      menuItemsInMemory = menuItemsInMemory.filter(mi => mi.hostId !== hostId);
    }
    return hostDeleted;
  } catch (e) {
    console.error("Error in deleteHost (in-memory):", e);
    return false;
  }
};

// --- Site Management (Global Sites for Admin) ---
export const getSites = async (hostIdParam?: string): Promise<Site[]> => {
  log(`getSites called. HostIdParam: ${hostIdParam}. Using in-memory data.`);
  try {
    let resultSites = [...sitesInMemory];
    if (hostIdParam) {
      resultSites = resultSites.filter(s => s.hostId === hostIdParam);
    }
    return resultSites.sort((a,b) => a.nom.localeCompare(b.nom));
  } catch (e) {
    console.error("Error in getSites (in-memory):", e);
    return [];
  }
};

export const getSiteById = async (siteId: string): Promise<Site | undefined> => {
  log(`getSiteById called for: ${siteId}. Using in-memory data.`);
  try {
    return sitesInMemory.find(s => s.siteId === siteId);
  } catch (e) {
    console.error("Error in getSiteById (in-memory):", e);
    return undefined;
  }
};

export const addSiteToData = async (siteData: Omit<Site, 'siteId' | 'logoAiHint'>): Promise<Site> => {
  log(`addSiteToData called. Data: ${JSON.stringify(siteData)}. Using in-memory data.`);
  try {
    const newSite: Site = {
      ...siteData,
      siteId: `globalsite-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      logoUrl: siteData.logoUrl || undefined,
      logoAiHint: siteData.logoUrl && siteData.nom ? siteData.nom.toLowerCase().split(' ').slice(0,2).join(' ') : (siteData.nom ? siteData.nom.toLowerCase().split(' ').slice(0,2).join(' ') : undefined),
      primaryColor: siteData.primaryColor || undefined,
    };
    sitesInMemory.push(newSite);
    return newSite;
  } catch (e) {
    console.error("Error in addSiteToData (in-memory):", e);
    throw e;
  }
};

export const updateSiteInData = async (siteId: string, siteData: Partial<Omit<Site, 'siteId' | 'logoAiHint'>>): Promise<Site | undefined> => {
  log(`updateSiteInData called for ID: ${siteId}. Using in-memory data.`);
  try {
    const siteIndex = sitesInMemory.findIndex(s => s.siteId === siteId);
    if (siteIndex > -1) {
      sitesInMemory[siteIndex] = {
        ...sitesInMemory[siteIndex],
        ...siteData,
        logoUrl: siteData.logoUrl !== undefined ? (siteData.logoUrl || undefined) : sitesInMemory[siteIndex].logoUrl,
        logoAiHint: siteData.logoUrl && siteData.nom ? siteData.nom.toLowerCase().split(' ').slice(0,2).join(' ') : (siteData.nom ? siteData.nom.toLowerCase().split(' ').slice(0,2).join(' ') : sitesInMemory[siteIndex].logoAiHint),
        primaryColor: siteData.primaryColor !== undefined ? (siteData.primaryColor || undefined) : sitesInMemory[siteIndex].primaryColor,
      };
      return sitesInMemory[siteIndex];
    }
    return undefined;
  } catch (e) {
    console.error("Error in updateSiteInData (in-memory):", e);
    return undefined;
  }
};

export const deleteSiteInData = async (siteId: string): Promise<boolean> => {
    log(`deleteSiteInData called for: ${siteId}. Using in-memory data.`);
    try {
      const initialLength = sitesInMemory.length;
      sitesInMemory = sitesInMemory.filter(s => s.siteId !== siteId);
      roomsOrTablesInMemory = roomsOrTablesInMemory.filter(rt => rt.globalSiteId !== siteId);
      return sitesInMemory.length < initialLength;
    } catch (e) {
      console.error("Error in deleteSiteInData (in-memory):", e);
      return false;
    }
};


// --- RoomOrTable Management (Host Locations) ---
export const getRoomsOrTables = async (hostId: string, globalSiteIdParam?: string): Promise<RoomOrTable[]> => {
  log(`getRoomsOrTables called for host: ${hostId}, globalSiteId: ${globalSiteIdParam}. Using in-memory data.`);
  try {
    let filtered = roomsOrTablesInMemory.filter(rt => rt.hostId === hostId);
    if (globalSiteIdParam) {
      filtered = filtered.filter(rt => rt.globalSiteId === globalSiteIdParam);
    }
    return [...filtered].sort((a,b) => {
      if (a.type === 'Site' && b.type !== 'Site') return -1;
      if (a.type !== 'Site' && b.type === 'Site') return 1;
      if (a.type === b.type) return a.nom.localeCompare(b.nom);
      return a.type.localeCompare(b.type);
    });
  } catch (e) {
    console.error("Error in getRoomsOrTables (in-memory):", e);
    return [];
  }
};

export const getRoomOrTableById = async (id: string): Promise<RoomOrTable | undefined> => {
  log(`getRoomOrTableById called for: ${id}. Using in-memory data.`);
  try {
    return roomsOrTablesInMemory.find(rt => rt.id === id);
  } catch (e) {
    console.error("Error in getRoomOrTableById (in-memory):", e);
    return undefined;
  }
};

export const addRoomOrTable = async (data: Omit<RoomOrTable, 'id' | 'urlPersonnalise'>): Promise<RoomOrTable> => {
  log(`addRoomOrTable called. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  try {
    const newId = `rt-${data.type.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const newRoomOrTable: RoomOrTable = {
      ...data,
      id: newId,
      urlPersonnalise: `/client/${data.hostId}/${newId}`,
      capacity: data.capacity,
      tagIds: data.tagIds || [],
      description: data.description || undefined,
      imageUrls: data.imageUrls || [],
      imageAiHint: data.imageUrls && data.imageUrls.length > 0 && data.nom ? data.nom.toLowerCase().split(' ').slice(0,2).join(' ') : undefined,
      amenityIds: data.amenityIds || [],
      prixParNuit: data.type === 'Chambre' ? data.prixParNuit : undefined,
      prixFixeReservation: data.type === 'Table' ? data.prixFixeReservation : undefined,
      menuCardId: data.menuCardId || undefined,
    };
    roomsOrTablesInMemory.push(newRoomOrTable);
    return newRoomOrTable;
  } catch (e) {
    console.error("Error in addRoomOrTable (in-memory):", e);
    throw e;
  }
};

export const updateRoomOrTable = async (id: string, data: Partial<Omit<RoomOrTable, 'id' | 'urlPersonnalise' | 'hostId'>>): Promise<RoomOrTable | undefined> => {
  log(`updateRoomOrTable called for ID: ${id}. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  try {
    const itemIndex = roomsOrTablesInMemory.findIndex(rt => rt.id === id);
    if (itemIndex > -1) {
      const currentItem = roomsOrTablesInMemory[itemIndex];
      roomsOrTablesInMemory[itemIndex] = {
          ...currentItem,
          ...data,
          nom: data.nom !== undefined ? data.nom : currentItem.nom,
          type: data.type !== undefined ? data.type : currentItem.type,
          globalSiteId: data.globalSiteId !== undefined ? data.globalSiteId : currentItem.globalSiteId,
          parentLocationId: data.hasOwnProperty('parentLocationId') ? data.parentLocationId : currentItem.parentLocationId,
          capacity: data.capacity !== undefined ? data.capacity : currentItem.capacity,
          tagIds: data.tagIds !== undefined ? data.tagIds : currentItem.tagIds,
          description: data.description !== undefined ? data.description : currentItem.description,
          imageUrls: data.imageUrls !== undefined ? data.imageUrls : currentItem.imageUrls,
          imageAiHint: data.imageUrls && data.imageUrls.length > 0 && data.nom ? data.nom.toLowerCase().split(' ').slice(0,2).join(' ') : currentItem.imageAiHint,
          amenityIds: data.amenityIds !== undefined ? data.amenityIds : currentItem.amenityIds,
          prixParNuit: data.type === 'Chambre' ? (data.prixParNuit !== undefined ? data.prixParNuit : currentItem.prixParNuit) : undefined,
          prixFixeReservation: data.type === 'Table' ? (data.prixFixeReservation !== undefined ? data.prixFixeReservation : currentItem.prixFixeReservation) : undefined,
          menuCardId: data.hasOwnProperty('menuCardId') ? data.menuCardId : currentItem.menuCardId,
      };
      return { ...roomsOrTablesInMemory[itemIndex] };
    }
    return undefined;
  } catch (e) {
    console.error("Error in updateRoomOrTable (in-memory):", e);
    return undefined;
  }
};

export const deleteRoomOrTable = async (id: string): Promise<boolean> => {
    log(`deleteRoomOrTable called for: ${id}. Using in-memory data.`);
    try {
      const initialLength = roomsOrTablesInMemory.length;
      const locationToDelete = roomsOrTablesInMemory.find(rt => rt.id === id);

      if (locationToDelete) {
          const children = roomsOrTablesInMemory.filter(rt => rt.parentLocationId === id);
          children.forEach(child => {
              const childIndex = roomsOrTablesInMemory.findIndex(c => c.id === child.id);
              if (childIndex > -1) {
                  roomsOrTablesInMemory[childIndex].parentLocationId = locationToDelete.parentLocationId || undefined;
              }
          });
          servicesInMemory.forEach(service => {
              if (service.targetLocationIds?.includes(id)) {
                  service.targetLocationIds = service.targetLocationIds.filter(targetId => targetId !== id);
              }
          });
          clientsInMemory.forEach(client => {
              if (client.locationId === id) {
                  client.locationId = undefined;
              }
          });
          const linkedReservations = reservationsInMemory.filter(r => r.locationId === id);
          if (linkedReservations.length > 0) {
              log(`Warning: Deleting location ${id} which has ${linkedReservations.length} associated reservations. These reservations will also be removed.`);
              reservationsInMemory = reservationsInMemory.filter(r => r.locationId !== id);
          }
      }
      roomsOrTablesInMemory = roomsOrTablesInMemory.filter(rt => rt.id !== id);
      return roomsOrTablesInMemory.length < initialLength;
    } catch (e) {
      console.error("Error in deleteRoomOrTable (in-memory):", e);
      return false;
    }
};

// --- Tag Management ---
export const getTags = async (hostId: string): Promise<Tag[]> => {
  log(`getTags called for host: ${hostId}. Using in-memory data.`);
  try {
    return [...tagsInMemory].filter(tag => tag.hostId === hostId).sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    console.error("Error in getTags (in-memory):", e);
    return [];
  }
};

export const addTag = async (tagData: Omit<Tag, 'id'>): Promise<Tag> => {
  log(`addTag called. Data: ${JSON.stringify(tagData)}. Using in-memory data.`);
  try {
    const newTag: Tag = { ...tagData, id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` };
    tagsInMemory.push(newTag);
    return newTag;
  } catch (e) {
    console.error("Error in addTag (in-memory):", e);
    throw e;
  }
};

export const updateTag = async (tagId: string, tagData: Partial<Omit<Tag, 'id' | 'hostId'>>): Promise<Tag | undefined> => {
  log(`updateTag called for ID: ${tagId}. Data: ${JSON.stringify(tagData)}. Using in-memory data.`);
  try {
    const tagIndex = tagsInMemory.findIndex(tag => tag.id === tagId);
    if (tagIndex > -1) {
      tagsInMemory[tagIndex] = { ...tagsInMemory[tagIndex], ...tagData };
      return { ...tagsInMemory[tagIndex] };
    }
    return undefined;
  } catch (e) {
    console.error("Error in updateTag (in-memory):", e);
    return undefined;
  }
};

export const deleteTag = async (tagId: string): Promise<boolean> => {
  log(`deleteTag called for: ${tagId}. Using in-memory data.`);
  try {
    const initialLength = tagsInMemory.length;
    tagsInMemory = tagsInMemory.filter(tag => tag.id !== tagId);
    if (tagsInMemory.length < initialLength) {
      roomsOrTablesInMemory = roomsOrTablesInMemory.map(loc => {
        if (loc.tagIds && loc.tagIds.includes(tagId)) {
          return { ...loc, tagIds: loc.tagIds.filter(id => id !== tagId) };
        }
        return loc;
      });
      log(`Tag ${tagId} deleted and removed from locations (in-memory).`);
      return true;
    }
    return false;
  } catch (e) {
    console.error("Error in deleteTag (in-memory):", e);
    return false;
  }
};

// --- ServiceCategory Management ---
export const getServiceCategories = async (hostId: string): Promise<ServiceCategory[]> => {
  log(`getServiceCategories called for host: ${hostId}. Using in-memory data.`);
  try {
    return [...serviceCategoriesInMemory].filter(sc => sc.hostId === hostId).sort((a,b) => a.nom.localeCompare(b.nom));
  } catch (e) {
    console.error("Error in getServiceCategories (in-memory):", e);
    return [];
  }
};

export const addServiceCategory = async (data: Omit<ServiceCategory, 'id' | 'data-ai-hint'>): Promise<ServiceCategory> => {
  log(`addServiceCategory called. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  try {
    const newCategory: ServiceCategory = { ...data, id: `cat-${Date.now()}`, "data-ai-hint": data.image && data.nom ? data.nom.toLowerCase().substring(0,15).replace(/\s+/g, ' ') : undefined };
    serviceCategoriesInMemory.push(newCategory);
    return newCategory;
  } catch (e) {
    console.error("Error in addServiceCategory (in-memory):", e);
    throw e;
  }
};

export const updateServiceCategory = async (id: string, data: Partial<Omit<ServiceCategory, 'id' | 'hostId' | 'data-ai-hint'>>): Promise<ServiceCategory | undefined> => {
  log(`updateServiceCategory called for ID: ${id}. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  try {
    const catIndex = serviceCategoriesInMemory.findIndex(sc => sc.id === id);
    if (catIndex > -1) {
      serviceCategoriesInMemory[catIndex] = {
          ...serviceCategoriesInMemory[catIndex],
          ...data,
          "data-ai-hint": data.image && data.nom ? data.nom.toLowerCase().substring(0,15).replace(/\s+/g, ' ') : serviceCategoriesInMemory[catIndex]["data-ai-hint"]
      };
      return { ...serviceCategoriesInMemory[catIndex] };
    }
    return undefined;
  } catch (e) {
    console.error("Error in updateServiceCategory (in-memory):", e);
    return undefined;
  }
};

export const deleteServiceCategory = async (id: string): Promise<boolean> => {
    log(`deleteServiceCategory called for: ${id}. Using in-memory data.`);
    try {
      const initialLength = serviceCategoriesInMemory.length;
      serviceCategoriesInMemory = serviceCategoriesInMemory.filter(sc => sc.id !== id);
      servicesInMemory = servicesInMemory.map(s => s.categorieId === id ? {...s, categorieId: ''} : s);
      return serviceCategoriesInMemory.length < initialLength;
    } catch (e) {
      console.error("Error in deleteServiceCategory (in-memory):", e);
      return false;
    }
};

export const getServiceCategoryById = async (id: string): Promise<ServiceCategory | undefined> => {
  log(`getServiceCategoryById called for: ${id}. Using in-memory data.`);
  try {
    return serviceCategoriesInMemory.find(sc => sc.id === id);
  } catch (e) {
    console.error("Error in getServiceCategoryById (in-memory):", e);
    return undefined;
  }
};

// --- CustomForm Management ---
export const getCustomForms = async (hostId: string): Promise<CustomForm[]> => {
  log(`getCustomForms called for host: ${hostId}. Using in-memory data.`);
  try {
    return [...customFormsInMemory].filter(cf => cf.hostId === hostId).sort((a,b) => a.nom.localeCompare(b.nom));
  } catch (e) {
    console.error("Error in getCustomForms (in-memory):", e);
    return [];
  }
};

export const addCustomForm = async (data: Omit<CustomForm, 'id'>): Promise<CustomForm> => {
  log(`addCustomForm called. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  try {
    const newForm: CustomForm = { ...data, id: `form-${Date.now()}` };
    customFormsInMemory.push(newForm);
    return newForm;
  } catch (e) {
    console.error("Error in addCustomForm (in-memory):", e);
    throw e;
  }
};

export const getFormById = async (formId: string): Promise<CustomForm | undefined> => {
  log(`getFormById called for: ${formId}. Using in-memory data.`);
  try {
    return customFormsInMemory.find(f => f.id === formId);
  } catch (e) {
    console.error("Error in getFormById (in-memory):", e);
    return undefined;
  }
};

export const updateCustomForm = async (id: string, data: Partial<Omit<CustomForm, 'id' | 'hostId'>>): Promise<CustomForm | undefined> => {
  log(`updateCustomForm called for ID: ${id}. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  try {
    const formIndex = customFormsInMemory.findIndex(cf => cf.id === id);
    if (formIndex > -1) {
      customFormsInMemory[formIndex] = { ...customFormsInMemory[formIndex], ...data };
      return { ...customFormsInMemory[formIndex] };
    }
    return undefined;
  } catch (e) {
    console.error("Error in updateCustomForm (in-memory):", e);
    return undefined;
  }
};

export const deleteCustomForm = async (id: string): Promise<boolean> => {
    log(`deleteCustomForm called for: ${id}. Using in-memory data.`);
    try {
      const initialLength = customFormsInMemory.length;
      customFormsInMemory = customFormsInMemory.filter(cf => cf.id !== id);
      formFieldsInMemory = formFieldsInMemory.filter(ff => ff.formulaireId !== id);
      servicesInMemory = servicesInMemory.map(s => s.formulaireId === id ? {...s, formulaireId: undefined} : s);
      return customFormsInMemory.length < initialLength;
    } catch (e) {
      console.error("Error in deleteCustomForm (in-memory):", e);
      return false;
    }
};

// --- FormField Management ---
export const getFormFields = async (formulaireId: string): Promise<FormField[]> => {
  log(`getFormFields called for formulaireId: ${formulaireId}. Using in-memory data.`);
  try {
    return [...formFieldsInMemory].filter(ff => ff.formulaireId === formulaireId).sort((a, b) => a.ordre - b.ordre);
  } catch (e) {
    console.error("Error in getFormFields (in-memory):", e);
    return [];
  }
};

export const addFormField = async (data: Omit<FormField, 'id'>): Promise<FormField> => {
  log(`addFormField called. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  try {
    const newField: FormField = { ...data, id: `field-${Date.now()}` };
    formFieldsInMemory.push(newField);
    return newField;
  } catch (e) {
    console.error("Error in addFormField (in-memory):", e);
    throw e;
  }
};

export const updateFormField = async (id: string, data: Partial<Omit<FormField, 'id' | 'formulaireId'>>): Promise<FormField | undefined> => {
  log(`updateFormField called for ID: ${id}. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  try {
    const fieldIndex = formFieldsInMemory.findIndex(ff => ff.id === id);
    if (fieldIndex > -1) {
      formFieldsInMemory[fieldIndex] = { ...formFieldsInMemory[fieldIndex], ...data };
      return { ...formFieldsInMemory[fieldIndex] };
    }
    return undefined;
  } catch (e) {
    console.error("Error in updateFormField (in-memory):", e);
    return undefined;
  }
};

export const deleteFormField = async (id: string): Promise<boolean> => {
    log(`deleteFormField called for: ${id}. Using in-memory data.`);
    try {
      const initialLength = formFieldsInMemory.length;
      formFieldsInMemory = formFieldsInMemory.filter(ff => ff.id !== id);
      return formFieldsInMemory.length < initialLength;
    } catch (e) {
      console.error("Error in deleteFormField (in-memory):", e);
      return false;
    }
};

// --- Service Management ---
export const getServices = async (
  hostId: string,
  clientCurrentLocationId?: string,
  categoryId?: string
): Promise<Service[]> => {
  log(`getServices called for host: ${hostId}, location: ${clientCurrentLocationId}, category: ${categoryId}. Using in-memory data.`);
  try {
    let hostServices = [...servicesInMemory].filter(s => s.hostId === hostId);

    if (clientCurrentLocationId) {
      const currentScannedLocation = await getRoomOrTableById(clientCurrentLocationId);
      if (!currentScannedLocation) {
        log(`Location with ID ${clientCurrentLocationId} not found for service filtering.`);
        return [];
      }
      const relevantLocationIds: string[] = [currentScannedLocation.id];
      let parentId = currentScannedLocation.parentLocationId;
      while (parentId) {
        const parentLocation = await getRoomOrTableById(parentId);
        if (parentLocation) {
          relevantLocationIds.push(parentId);
          parentId = parentLocation.parentLocationId;
        } else {
          parentId = undefined;
        }
      }
      if (currentScannedLocation.globalSiteId) {
        // Consider services targeted directly to the Global Site as well if it makes sense
        // For now, only direct location and its parents are considered by targetLocationIds.
        // If a service is targeted to a Global Site ID, it would need to be explicitly in its targetLocationIds or the logic adjusted.
      }

      hostServices = hostServices.filter(service => {
        if (!service.targetLocationIds || service.targetLocationIds.length === 0) {
          return true;
        }
        return service.targetLocationIds.some(targetId => relevantLocationIds.includes(targetId));
      });
    }

    if (categoryId && categoryId !== "all" && categoryId !== "") {
      hostServices = hostServices.filter(s => s.categorieId === categoryId);
    }

    return hostServices.sort((a,b) => a.titre.localeCompare(b.titre));
  } catch (e) {
    console.error("Error in getServices (in-memory):", e);
    return [];
  }
};

export const getServiceById = async (serviceId: string): Promise<Service | undefined> => {
  log(`getServiceById called for: ${serviceId}. Using in-memory data.`);
  try {
    return servicesInMemory.find(s => s.id === serviceId);
  } catch (e) {
    console.error("Error in getServiceById (in-memory):", e);
    return undefined;
  }
};

export const addService = async (data: Omit<Service, 'id' | 'data-ai-hint'>): Promise<Service> => {
  log(`addService called. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  try {
    const newService: Service = {
      ...data,
      id: `svc-${Date.now()}`,
      "data-ai-hint": data.image && data.titre ? data.titre.toLowerCase().substring(0,15).replace(/\s+/g, ' ') : undefined,
      targetLocationIds: data.targetLocationIds || []
    };
    servicesInMemory.push(newService);
    return newService;
  } catch (e) {
    console.error("Error in addService (in-memory):", e);
    throw e;
  }
};

export const updateService = async (id: string, data: Partial<Omit<Service, 'id' | 'hostId' | 'data-ai-hint'>>): Promise<Service | undefined> => {
  log(`updateService called for ID: ${id}. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  try {
    const serviceIndex = servicesInMemory.findIndex(s => s.id === id);
    if (serviceIndex > -1) {
      servicesInMemory[serviceIndex] = {
        ...servicesInMemory[serviceIndex],
        ...data,
        "data-ai-hint": data.image && data.titre ? data.titre.toLowerCase().substring(0,15).replace(/\s+/g, ' ') : servicesInMemory[serviceIndex]["data-ai-hint"],
        targetLocationIds: data.targetLocationIds !== undefined ? data.targetLocationIds : servicesInMemory[serviceIndex].targetLocationIds,
      };
      return { ...servicesInMemory[serviceIndex] };
    }
    return undefined;
  } catch (e) {
    console.error("Error in updateService (in-memory):", e);
    return undefined;
  }
};

export const deleteService = async (id: string): Promise<boolean> => {
    log(`deleteService called for: ${id}. Using in-memory data.`);
    try {
      const initialLength = servicesInMemory.length;
      servicesInMemory = servicesInMemory.filter(s => s.id !== id);
      ordersInMemory = ordersInMemory.filter(o => o.serviceId !== id);
      return servicesInMemory.length < initialLength;
    } catch (e) {
      console.error("Error in deleteService (in-memory):", e);
      return false;
    }
};

// --- Order Management ---
export const getOrders = async (
  hostId: string,
  filters?: {
    status?: OrderStatus | "all";
    categoryId?: string;
    serviceId?: string;
    clientName?: string;
  }
): Promise<Order[]> => {
  log(`getOrders called for host: ${hostId}, filters: ${JSON.stringify(filters)}. Using in-memory data.`);
  try {
    let filteredOrders = [...ordersInMemory].filter(o => o.hostId === hostId);

    if (filters?.status && filters.status !== "all") {
      filteredOrders = filteredOrders.filter(o => o.status === filters.status);
    }
    if (filters?.serviceId && filters.serviceId !== "all") {
      filteredOrders = filteredOrders.filter(o => o.serviceId === filters.serviceId);
    } else if (filters?.categoryId && filters.categoryId !== "all") {
      const servicesInCategory = servicesInMemory.filter(s => s.categorieId === filters.categoryId && s.hostId === hostId).map(s => s.id);
      filteredOrders = filteredOrders.filter(o => servicesInCategory.includes(o.serviceId));
    }
    if (filters?.clientName && filters.clientName.trim() !== "") {
      filteredOrders = filteredOrders.filter(o => o.clientNom && o.clientNom.toLowerCase().includes(filters.clientName!.toLowerCase()));
    }

    return filteredOrders.sort((a,b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime());
  } catch (e) {
    console.error("Error in getOrders (in-memory):", e);
    return [];
  }
};

export const getOrderById = async (orderId: string): Promise<Order | undefined> => {
  log(`getOrderById called for: ${orderId}. Using in-memory data.`);
  try {
    return ordersInMemory.find(o => o.id === orderId);
  } catch (e) {
    console.error(`Error in getOrderById (in-memory) for ID ${orderId}:`, e);
    return undefined;
  }
};

export const getOrdersByClientName = async (hostId: string, clientName: string): Promise<Order[]> => {
  log(`getOrdersByClientName called for host: ${hostId}, clientName: ${clientName}. Using in-memory data.`);
  try {
    if (!clientName) return [];
    const clientOrders = [...ordersInMemory].filter(o =>
      o.hostId === hostId &&
      o.clientNom &&
      o.clientNom.toLowerCase() === clientName.toLowerCase()
    );
    return clientOrders.sort((a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime());
  } catch (e) {
    console.error("Error in getOrdersByClientName (in-memory):", e);
    return [];
  }
};

export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
  log(`getOrdersByUserId called for userId: ${userId}. Using in-memory data.`);
  try {
    return [...ordersInMemory].filter(o => o.userId === userId)
                 .sort((a,b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime());
  } catch (e) {
    console.error("Error in getOrdersByUserId (in-memory):", e);
    return [];
  }
};

export const addOrder = async (data: Omit<Order, 'id' | 'dateHeure' | 'status' | 'montantPaye' | 'soldeDu' | 'paiements' | 'pointsGagnes' | 'currency'>): Promise<Order> => {
  log(`addOrder called. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  try {
    const serviceDetails = await getServiceById(data.serviceId);
    const hostDetails = await getHostById(data.hostId);
    const newOrder: Order = {
      ...data,
      id: `order-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
      dateHeure: new Date().toISOString(),
      status: 'pending',
      prixTotal: serviceDetails?.prix,
      montantPaye: 0,
      soldeDu: serviceDetails?.prix || 0,
      paiements: [],
      userId: data.userId,
      pointsGagnes: 0,
      currency: hostDetails?.currency || 'USD',
    };
    ordersInMemory.push(newOrder);
    return newOrder;
  } catch (e) {
    console.error("Error in addOrder (in-memory):", e);
    throw e;
  }
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order | undefined> => {
  log(`updateOrderStatus called for orderId: ${orderId}, status: ${status}. Using in-memory data.`);
  try {
    const orderIndex = ordersInMemory.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
      const order = ordersInMemory[orderIndex];
      order.status = status;

      if (status === 'completed') {
          const host = await getHostById(order.hostId);
          if (host?.loyaltySettings?.enabled && host.loyaltySettings.pointsPerEuroSpent > 0 && order.prixTotal && order.prixTotal > 0) {
              const pointsEarned = Math.floor(order.prixTotal * host.loyaltySettings.pointsPerEuroSpent);
              if (pointsEarned > 0) {
                let clientRecordToUpdate: Client | undefined;
                if (order.userId) {
                  clientRecordToUpdate = clientsInMemory.find(c => c.userId === order.userId && c.hostId === order.hostId);
                }
                if (!clientRecordToUpdate && order.clientNom) {
                  clientRecordToUpdate = clientsInMemory.find(c => c.nom === order.clientNom && c.hostId === order.hostId);
                }
                if (clientRecordToUpdate) {
                   await addPointsToClient(clientRecordToUpdate.id, pointsEarned, order.hostId);
                   order.pointsGagnes = pointsEarned;
                   log(`Awarded ${pointsEarned} loyalty points to client ID ${clientRecordToUpdate.id} (User ID: ${order.userId || 'N/A'}, Name: ${order.clientNom}) for order ${order.id}`);
                } else {
                  log(`No client record found to award points for order ${order.id} (User ID: ${order.userId || 'N/A'}, Name: ${order.clientNom})`);
                }
              }
          }
      }
      return { ...order };
    }
    return undefined;
  } catch (e) {
    console.error("Error in updateOrderStatus (in-memory):", e);
    return undefined;
  }
};

// --- Client Management (Host Side) ---
export const getClients = async (hostId: string): Promise<Client[]> => {
  log(`getClients called for host: ${hostId}. Using in-memory data.`);
  try {
    return [...clientsInMemory].filter(c => c.hostId === hostId).sort((a,b) => a.nom.localeCompare(b.nom));
  } catch (e) {
    console.error("Error in getClients (in-memory):", e);
    return [];
  }
};

export const getClientById = async (clientId: string): Promise<Client | undefined> => {
  log(`getClientById called for: ${clientId}. Using in-memory data.`);
  try {
    return clientsInMemory.find(c => c.id === clientId);
  } catch (e) {
    console.error("Error in getClientById (in-memory):", e);
    return undefined;
  }
};

export const getClientsByHostAndName = async (hostId: string, clientName: string): Promise<Client[]> => {
  log(`getClientsByHostAndName called for host: ${hostId}, clientName: ${clientName}. Using in-memory data.`);
  try {
    if (!clientName) return [];
    const lowerCaseClientName = clientName.toLowerCase();
    return [...clientsInMemory].filter(c =>
      c.hostId === hostId &&
      c.nom.toLowerCase().includes(lowerCaseClientName)
    ).sort((a, b) => a.nom.localeCompare(b.nom));
  } catch (e) {
    console.error("Error in getClientsByHostAndName (in-memory):", e);
    return [];
  }
};

export const getClientRecordsByEmail = async (email: string): Promise<Client[]> => {
  log(`getClientRecordsByEmail called for email: ${email}. Using in-memory data.`);
  try {
    return [...clientsInMemory].filter(c => c.email?.toLowerCase() === email.toLowerCase())
                  .sort((a,b) => (a.hostId || '').localeCompare(b.hostId || ''));
  } catch (e) {
    console.error("Error in getClientRecordsByEmail (in-memory):", e);
    return [];
  }
};

export const getClientRecordsByUserId = async (userId: string): Promise<Client[]> => {
  log(`getClientRecordsByUserId called for userId: ${userId}. Using in-memory data.`);
  try {
    return [...clientsInMemory].filter(c => c.userId === userId)
                  .sort((a,b) => (a.hostId || '').localeCompare(b.hostId || ''));
  } catch (e) {
    console.error("Error in getClientRecordsByUserId (in-memory):", e);
    return [];
  }
};

export const addClientData = async (clientData: Omit<Client, 'id' | 'documents' | 'credit' | 'pointsFidelite'> & { hostId: string }): Promise<Client> => {
  log(`addClientData called. Data: ${JSON.stringify(clientData)}. Using in-memory data.`);
  try {
    let initialPoints = 0;
    const host = await getHostById(clientData.hostId);
    if (host?.loyaltySettings?.enabled && host.loyaltySettings.pointsForNewClientSignup && host.loyaltySettings.pointsForNewClientSignup > 0) {
        initialPoints = host.loyaltySettings.pointsForNewClientSignup;
    }
    const newClient: Client = {
        ...clientData,
        id: `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        credit: 0,
        pointsFidelite: initialPoints,
        userId: clientData.userId || undefined,
    };
    clientsInMemory.push(newClient);
    log(`Client ${newClient.nom} added with ${initialPoints} signup loyalty points for host ${clientData.hostId}.`);
    return newClient;
  } catch (e) {
    console.error("Error in addClientData (in-memory):", e);
    throw e;
  }
};

export const updateClientData = async (clientId: string, clientData: Partial<Omit<Client, 'id' | 'hostId' | 'documents'>>): Promise<Client | undefined> => {
  log(`updateClientData called for ID: ${clientId}. Data: ${JSON.stringify(clientData)}. Using in-memory data.`);
  try {
    const clientIndex = clientsInMemory.findIndex(c => c.id === clientId);
    if (clientIndex > -1) {
      clientsInMemory[clientIndex] = { ...clientsInMemory[clientIndex], ...clientData };
      return { ...clientsInMemory[clientIndex] };
    }
    return undefined;
  } catch (e) {
    console.error("Error in updateClientData (in-memory):", e);
    return undefined;
  }
};

export const deleteClientData = async (clientId: string): Promise<boolean> => {
  log(`deleteClientData called for: ${clientId}. Using in-memory data.`);
  try {
    const initialLength = clientsInMemory.length;
    clientsInMemory = clientsInMemory.filter(c => c.id !== clientId);
    if (clientsInMemory.length < initialLength) {
      reservationsInMemory = reservationsInMemory.map(r => {
        if (r.clientId === clientId) {
          return { ...r, clientId: undefined, clientName: r.clientName || "Deleted Client" };
        }
        return r;
      });
    }
    return clientsInMemory.length < initialLength;
  } catch (e) {
    console.error("Error in deleteClientData (in-memory):", e);
    return false;
  }
};

export const addCreditToClient = async (clientId: string, amount: number, hostId: string): Promise<Client | undefined> => {
  log(`addCreditToClient called for client: ${clientId}, amount: ${amount}, host: ${hostId}. Using in-memory data.`);
  try {
    const clientIndex = clientsInMemory.findIndex(c => c.id === clientId && c.hostId === hostId);
    if (clientIndex > -1) {
      clientsInMemory[clientIndex].credit = (clientsInMemory[clientIndex].credit || 0) + amount;
      log(`Credit updated for client ${clientId}. New balance: ${clientsInMemory[clientIndex].credit}.`);
      return { ...clientsInMemory[clientIndex] };
    }
    log(`Client ${clientId} not found for host ${hostId} to add credit.`);
    return undefined;
  } catch (e) {
    console.error("Error in addCreditToClient (in-memory):", e);
    return undefined;
  }
}

export const addPointsToClient = async (clientId: string, pointsToAdd: number, hostId: string): Promise<Client | undefined> => {
  log(`addPointsToClient called for client: ${clientId}, points: ${pointsToAdd}, host: ${hostId}. Using in-memory data.`);
  try {
    const clientIndex = clientsInMemory.findIndex(c => c.id === clientId && c.hostId === hostId);
    if (clientIndex > -1) {
      clientsInMemory[clientIndex].pointsFidelite = (clientsInMemory[clientIndex].pointsFidelite || 0) + pointsToAdd;
      log(`Loyalty points updated for client ${clientId}. New balance: ${clientsInMemory[clientIndex].pointsFidelite}.`);
      return { ...clientsInMemory[clientIndex] };
    }
    log(`Client ${clientId} not found for host ${hostId} to add/remove points.`);
    return undefined;
  } catch (e) {
    console.error("Error in addPointsToClient (in-memory):", e);
    return undefined;
  }
}

// --- Reservation Management ---
export const getReservations = async (
  hostId: string,
  filters?: {
    locationId?: string;
    month?: number;
    year?: number;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<Reservation[]> => {
  log(`getReservations called for host: ${hostId}, filters: ${JSON.stringify(filters)}. Using in-memory data.`);
  try {
    let hostReservations = reservationsInMemory.filter(r => r.hostId === hostId);
    if (filters?.locationId) {
      hostReservations = hostReservations.filter(r => r.locationId === filters.locationId);
    }
    if (filters?.month !== undefined && filters?.year !== undefined) {
        const monthStart = new Date(Date.UTC(filters.year, filters.month, 1));
        const monthEnd = new Date(Date.UTC(filters.year, filters.month + 1, 0, 23, 59, 59, 999));
        hostReservations = hostReservations.filter(r => {
            try {
                const arrivalDate = new Date(r.dateArrivee + "T00:00:00Z");
                const departureDateForRoom = r.dateDepart ? new Date(r.dateDepart + "T00:00:00Z") : null;
                const effectiveDeparture = r.type === 'Table' || !departureDateForRoom ? new Date(r.dateArrivee + "T23:59:59Z") : departureDateForRoom;
                if (!effectiveDeparture) return false;
                return (arrivalDate <= monthEnd && effectiveDeparture >= monthStart);
            } catch (e) {
                log("Error parsing date for reservation filtering by month/year", {reservationId: r.id, error: e});
                return false;
            }
        });
    }
     if (filters?.startDate && filters?.endDate) {
        const queryStart = filters.startDate;
        const queryEnd = filters.endDate;
        hostReservations = hostReservations.filter(r => {
            try {
                const resArrival = new Date(r.dateArrivee + "T00:00:00Z");
                const resDeparture = r.dateDepart ? new Date(r.dateDepart + "T00:00:00Z") : new Date(r.dateArrivee + "T23:59:59Z");
                return resArrival < queryEnd && resDeparture > queryStart;
            } catch (e) {
                 log("Error parsing date for reservation range filtering", {reservationId: r.id, error: e});
                 return false;
            }
        });
    }
    return [...hostReservations].sort((a,b) => new Date(a.dateArrivee).getTime() - new Date(b.dateArrivee).getTime());
  } catch (e) {
    console.error("Error in getReservations (in-memory):", e);
    return [];
  }
};

export const getReservationById = async (reservationId: string): Promise<Reservation | undefined> => {
  log(`getReservationById called for: ${reservationId}. Using in-memory data.`);
  try {
    return reservationsInMemory.find(r => r.id === reservationId);
  } catch (e) {
    console.error("Error in getReservationById (in-memory):", e);
    return undefined;
  }
};

export const addReservationToData = async (data: Omit<Reservation, 'id' | 'prixTotal' | 'montantPaye' | 'soldeDu' | 'paiements' | 'pointsGagnes' | 'onlineCheckinStatus' | 'onlineCheckinData' | 'clientInitiatedCheckoutTime' | 'checkoutNotes' | 'currency'>): Promise<Reservation> => {
  log(`addReservationToData called. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  try {
    const location = await getRoomOrTableById(data.locationId);
    const host = await getHostById(data.hostId);
    let prixTotalReservation: number | undefined = undefined;

    if (location?.type === 'Chambre' && location.prixParNuit && data.dateDepart) {
        const arrival = new Date(data.dateArrivee);
        const departure = new Date(data.dateDepart);
        const nights = Math.max(1, Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 3600 * 24)));
        prixTotalReservation = nights * location.prixParNuit;
    } else if (location?.type === 'Table' && location.prixFixeReservation !== undefined) {
        prixTotalReservation = location.prixFixeReservation;
    }

    const newReservation: Reservation = {
      ...data,
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
      type: location?.type,
      prixTotal: prixTotalReservation,
      montantPaye: 0,
      soldeDu: prixTotalReservation || 0,
      paiements: [],
      pointsGagnes: 0,
      onlineCheckinStatus: 'not-started',
      currency: host?.currency || 'USD',
    };
    reservationsInMemory.push(newReservation);
    return newReservation;
  } catch (e) {
    console.error("Error in addReservationToData (in-memory):", e);
    throw e;
  }
};

export const updateReservationInData = async (id: string, data: Partial<Omit<Reservation, 'id' | 'hostId' | 'prixTotal' | 'montantPaye' | 'soldeDu' | 'paiements' | 'pointsGagnes' | 'currency'>>): Promise<Reservation | undefined> => {
  log(`updateReservationInData called for ID: ${id}. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  try {
    const resIndex = reservationsInMemory.findIndex(r => r.id === id);
    if (resIndex > -1) {
      const existingReservation = reservationsInMemory[resIndex];
      const location = data.locationId ? await getRoomOrTableById(data.locationId) : await getRoomOrTableById(existingReservation.locationId);
      let prixTotalReservation = existingReservation.prixTotal;

      if(data.dateArrivee || data.dateDepart || data.locationId) {
        const arrivalDate = data.dateArrivee || existingReservation.dateArrivee;
        const departureDate = data.dateDepart === null ? undefined : (data.dateDepart || existingReservation.dateDepart);
        const currentType = location?.type || existingReservation.type;

        if (currentType === 'Chambre' && location?.prixParNuit !== undefined && departureDate) {
            const arrival = new Date(arrivalDate);
            const departure = new Date(departureDate);
            const nights = Math.max(1, Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 3600 * 24)));
            prixTotalReservation = nights * location.prixParNuit;
        } else if (currentType === 'Table' && location?.prixFixeReservation !== undefined) {
            prixTotalReservation = location.prixFixeReservation;
        }
      }

      const updatedReservation = {
        ...existingReservation,
        ...data,
        type: location?.type || existingReservation.type,
        prixTotal: prixTotalReservation,
        soldeDu: prixTotalReservation !== undefined ? prixTotalReservation - (data.montantPaye !== undefined ? data.montantPaye : (existingReservation.montantPaye || 0)) : existingReservation.soldeDu,
      };

      if (updatedReservation.status === 'checked-out' && existingReservation.status !== 'checked-out') {
        const host = await getHostById(updatedReservation.hostId);
        if (host?.loyaltySettings?.enabled) {
          let pointsToAward = 0;
          if (updatedReservation.type === 'Chambre' && updatedReservation.dateDepart && host.loyaltySettings.pointsPerNightRoom > 0) {
            const arrival = new Date(updatedReservation.dateArrivee);
            const departure = new Date(updatedReservation.dateDepart);
            const nights = Math.max(1, Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 3600 * 24)));
            pointsToAward += nights * host.loyaltySettings.pointsPerNightRoom;
          } else if (updatedReservation.type === 'Table' && host.loyaltySettings.pointsPerTableBooking > 0) {
            pointsToAward += host.loyaltySettings.pointsPerTableBooking;
          }
          if (pointsToAward > 0) {
             let clientToAwardPoints: Client | undefined = undefined;
             if (updatedReservation.clientId) {
                clientToAwardPoints = clientsInMemory.find(c => (c.id === updatedReservation.clientId || c.userId === updatedReservation.clientId) && c.hostId === updatedReservation.hostId);
             }
             if (!clientToAwardPoints && updatedReservation.clientName) {
                clientToAwardPoints = clientsInMemory.find(c => c.nom === updatedReservation.clientName && c.hostId === updatedReservation.hostId);
             }
             if (clientToAwardPoints) {
                await addPointsToClient(clientToAwardPoints.id, pointsToAward, updatedReservation.hostId);
                updatedReservation.pointsGagnes = (updatedReservation.pointsGagnes || 0) + pointsToAward;
                log(`Awarded ${pointsToAward} loyalty points to client ID ${clientToAwardPoints.id} for reservation ${id}`);
             }
          }
        }
      }
      reservationsInMemory[resIndex] = updatedReservation;
      return { ...updatedReservation };
    }
    return undefined;
  } catch (e) {
    console.error("Error in updateReservationInData (in-memory):", e);
    return undefined;
  }
};

export const deleteReservationInData = async (id: string): Promise<boolean> => {
  log(`deleteReservationInData called for: ${id}. Using in-memory data.`); // Corrected function name
  try {
    const initialLength = reservationsInMemory.length;
    reservationsInMemory = reservationsInMemory.filter(r => r.id !== id);
    return reservationsInMemory.length < initialLength;
  } catch (e) {
    console.error("Error in deleteReservationInData (in-memory):", e);
    return false;
  }
};

export const getReservationsByUserId = async (userId: string): Promise<Reservation[]> => {
  log(`getReservationsByUserId called for userId: ${userId}. Using in-memory data.`);
  try {
    const clientRecordsForUser = clientsInMemory.filter(c => c.userId === userId);
    const clientRecordIds = clientRecordsForUser.map(cr => cr.id);

    return [...reservationsInMemory].filter(r => {
      return r.clientId === userId || (r.clientId && clientRecordIds.includes(r.clientId));
    }).sort((a, b) => new Date(b.dateArrivee).getTime() - new Date(a.dateArrivee).getTime());
  } catch (e) {
    console.error("Error in getReservationsByUserId (in-memory):", e);
    return [];
  }
};

export const getReservationsByClientName = async (hostId: string, clientName: string): Promise<Reservation[]> => {
  log(`getReservationsByClientName called for host: ${hostId}, clientName: ${clientName}. Using in-memory data.`);
  try {
    if (!clientName) return [];
    const lowerCaseClientName = clientName.toLowerCase();
    return [...reservationsInMemory].filter(r =>
      r.hostId === hostId &&
      r.clientName &&
      r.clientName.toLowerCase().includes(lowerCaseClientName)
    ).sort((a, b) => new Date(b.dateArrivee).getTime() - new Date(a.dateArrivee).getTime());
  } catch (e) {
    console.error("Error in getReservationsByClientName (in-memory):", e);
    return [];
  }
};

// --- Menu Card Management ---
export const getMenuCards = async (hostId: string, globalSiteId?: string): Promise<MenuCard[]> => {
  try {
    let cards = menuCardsInMemory.filter(mc => mc.hostId === hostId);
    if (globalSiteId) {
      cards = cards.filter(mc => mc.globalSiteId === globalSiteId);
    }
    return cards.sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    log("Error in getMenuCards (in-memory)", e); return [];
  }
};

export const getMenuCardById = async (id: string): Promise<MenuCard | undefined> => {
  try {
    return menuCardsInMemory.find(mc => mc.id === id);
  } catch (e) {
    log("Error in getMenuCardById (in-memory)", e); return undefined;
  }
};

export const addMenuCard = async (data: Omit<MenuCard, 'id'>): Promise<MenuCard> => {
  try {
    const newCard: MenuCard = { ...data, id: `menucard-${Date.now()}` };
    menuCardsInMemory.push(newCard);
    return newCard;
  } catch (e) {
    log("Error in addMenuCard (in-memory)", e); throw e;
  }
};

export const updateMenuCard = async (id: string, data: Partial<Omit<MenuCard, 'id' | 'hostId' | 'globalSiteId'>>): Promise<MenuCard | undefined> => {
  try {
    const index = menuCardsInMemory.findIndex(mc => mc.id === id);
    if (index > -1) {
      menuCardsInMemory[index] = { ...menuCardsInMemory[index], ...data };
      return menuCardsInMemory[index];
    }
    return undefined;
  } catch (e) {
    log("Error in updateMenuCard (in-memory)", e); return undefined;
  }
};

export const deleteMenuCard = async (id: string): Promise<boolean> => {
  try {
    const initialLength = menuCardsInMemory.length;
    menuCardsInMemory = menuCardsInMemory.filter(mc => mc.id !== id);
    // Also delete associated categories and items
    const categoriesToDelete = menuCategoriesInMemory.filter(cat => cat.menuCardId === id);
    const categoryIdsToDelete = categoriesToDelete.map(cat => cat.id);
    menuCategoriesInMemory = menuCategoriesInMemory.filter(cat => cat.menuCardId !== id);
    menuItemsInMemory = menuItemsInMemory.filter(item => !categoryIdsToDelete.includes(item.menuCategoryId));
    // Unassign from locations
    roomsOrTablesInMemory = roomsOrTablesInMemory.map(loc => loc.menuCardId === id ? { ...loc, menuCardId: undefined } : loc);
    return menuCardsInMemory.length < initialLength;
  } catch (e) {
    log("Error in deleteMenuCard (in-memory)", e); return false;
  }
};

// --- Menu Category Management ---
export const getMenuCategories = async (menuCardId: string, hostId: string): Promise<MenuCategory[]> => {
  try {
    return menuCategoriesInMemory.filter(cat => cat.menuCardId === menuCardId && cat.hostId === hostId).sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity) || a.name.localeCompare(b.name));
  } catch (e) {
    log("Error in getMenuCategories (in-memory)", e); return [];
  }
};

export const addMenuCategory = async (data: Omit<MenuCategory, 'id'>): Promise<MenuCategory> => {
  try {
    const newCategory: MenuCategory = { ...data, id: `menucat-${Date.now()}` };
    menuCategoriesInMemory.push(newCategory);
    return newCategory;
  } catch (e) {
    log("Error in addMenuCategory (in-memory)", e); throw e;
  }
};

export const updateMenuCategory = async (id: string, data: Partial<Omit<MenuCategory, 'id' | 'menuCardId' | 'hostId'>>): Promise<MenuCategory | undefined> => {
  try {
    const index = menuCategoriesInMemory.findIndex(cat => cat.id === id);
    if (index > -1) {
      menuCategoriesInMemory[index] = { ...menuCategoriesInMemory[index], ...data };
      return menuCategoriesInMemory[index];
    }
    return undefined;
  } catch (e) {
    log("Error in updateMenuCategory (in-memory)", e); return undefined;
  }
};

export const deleteMenuCategory = async (id: string): Promise<boolean> => {
  try {
    const initialLength = menuCategoriesInMemory.length;
    menuCategoriesInMemory = menuCategoriesInMemory.filter(cat => cat.id !== id);
    // Also delete associated menu items
    menuItemsInMemory = menuItemsInMemory.filter(item => item.menuCategoryId !== id);
    return menuCategoriesInMemory.length < initialLength;
  } catch (e) {
    log("Error in deleteMenuCategory (in-memory)", e); return false;
  }
};

// --- MenuItem Management ---
export const getMenuItems = async (menuCategoryId: string, hostId: string): Promise<MenuItem[]> => {
  try {
    return menuItemsInMemory.filter(item => item.menuCategoryId === menuCategoryId && item.hostId === hostId).sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    log("Error in getMenuItems (in-memory)", e); return [];
  }
};

export const addMenuItem = async (data: Omit<MenuItem, 'id' | 'imageAiHint'>): Promise<MenuItem> => {
  try {
    const newItem: MenuItem = { ...data, id: `menuitem-${Date.now()}`, imageAiHint: data.imageUrl && data.name ? data.name.toLowerCase().substring(0,15).replace(/\s+/g, ' ') : undefined };
    menuItemsInMemory.push(newItem);
    return newItem;
  } catch (e) {
    log("Error in addMenuItem (in-memory)", e); throw e;
  }
};

export const updateMenuItem = async (id: string, data: Partial<Omit<MenuItem, 'id' | 'menuCategoryId' | 'hostId' | 'imageAiHint'>>): Promise<MenuItem | undefined> => {
  try {
    const index = menuItemsInMemory.findIndex(item => item.id === id);
    if (index > -1) {
      menuItemsInMemory[index] = { 
        ...menuItemsInMemory[index], 
        ...data,
        imageAiHint: data.imageUrl && data.name ? data.name.toLowerCase().substring(0,15).replace(/\s+/g, ' ') : menuItemsInMemory[index].imageAiHint,
      };
      return menuItemsInMemory[index];
    }
    return undefined;
  } catch (e) {
    log("Error in updateMenuItem (in-memory)", e); return undefined;
  }
};

export const deleteMenuItem = async (id: string): Promise<boolean> => {
  try {
    const initialLength = menuItemsInMemory.length;
    menuItemsInMemory = menuItemsInMemory.filter(item => item.id !== id);
    return menuItemsInMemory.length < initialLength;
  } catch (e) {
    log("Error in deleteMenuItem (in-memory)", e); return false;
  }
};


log("Initial in-memory data loaded/defined.");
log(`Users: ${usersInMemory.length}, Hosts: ${hostsInMemory.length}, Global Sites: ${sitesInMemory.length}, Locations: ${roomsOrTablesInMemory.length}`);
log(`Categories: ${serviceCategoriesInMemory.length}, Forms: ${customFormsInMemory.length}, Fields: ${formFieldsInMemory.length}, Services: ${servicesInMemory.length}`);
log(`Orders: ${ordersInMemory.length}, Clients: ${clientsInMemory.length}, Reservations: ${reservationsInMemory.length}, Tags: ${tagsInMemory.length}`);
log(`MenuCards: ${menuCardsInMemory.length}, MenuCategories: ${menuCategoriesInMemory.length}, MenuItems: ${menuItemsInMemory.length}`);
