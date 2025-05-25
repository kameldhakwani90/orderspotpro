// src/lib/data.ts
import type { User, Site, Host, RoomOrTable, ServiceCategory, CustomForm, FormField, Service, Order, OrderStatus, Client, ClientType, Reservation, ReservationStatus, Tag, LoyaltySettings, ReservationPageSettings, OnlineCheckinData, OnlineCheckinStatus, Paiement } from './types';

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
];

let sitesInMemory: Site[] = [
  { siteId: 'site-paradise-resort', nom: 'Paradise Beach Resort (Global)', hostId: 'host-paradise-resort', logoUrl: 'https://placehold.co/100x100.png?text=PBR', logoAiHint: 'resort logo', primaryColor: '#0D9488' /* Teal */ },
  { siteId: 'site-le-delice', nom: 'Le Delice Downtown (Global)', hostId: 'host-le-delice', logoUrl: 'https://placehold.co/100x100.png?text=LDD', logoAiHint: 'restaurant logo', primaryColor: '#7C3AED' /* Purple */ },
  { siteId: 'site-salty-pelican', nom: 'The Salty Pelican (Global)', hostId: 'host-salty-pelican', logoUrl: 'https://placehold.co/100x100.png?text=TSP', logoAiHint: 'beach lodge logo', primaryColor: '#F97316' /* Orange */ },
  { siteId: 'site-le-phare', nom: 'Le Phare Bistro (Global)', hostId: 'host-le-phare', logoUrl: 'https://placehold.co/100x100.png?text=LPB', logoAiHint: 'bistro logo', primaryColor: '#2563EB' /* Blue */ },
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

  // Paradise Beach Resort (refinement of existing)
  { id: 'pbr-lobby', nom: 'Lobby Principal Paradise', type: 'Site', hostId: 'host-paradise-resort', globalSiteId: 'site-paradise-resort', urlPersonnalise: `/client/host-paradise-resort/pbr-lobby`, amenityIds: ['wifi', 'climatisation'] },
  { id: 'pbr-room-deluxe-king', nom: 'Deluxe King Suite', type: 'Chambre', hostId: 'host-paradise-resort', globalSiteId: 'site-paradise-resort', parentLocationId: 'pbr-lobby', urlPersonnalise: `/client/host-paradise-resort/pbr-room-deluxe-king`, capacity: 2, prixParNuit: 250, description: "Suite luxueuse avec lit King Size et vue mer.", imageUrls: ["https://placehold.co/600x400.png?text=Deluxe+King"], imageAiHint: "luxury suite king", tagIds: ['tag-vue-mer-paradise', 'tag-luxe'], amenityIds: ['wifi', 'salle-de-bain', 'tv', 'climatisation', 'terrasse-balcon', 'petit-dejeuner-inclus'] },
  { id: 'pbr-room-standard-twin', nom: 'Standard Twin Vue Jardin', type: 'Chambre', hostId: 'host-paradise-resort', globalSiteId: 'site-paradise-resort', parentLocationId: 'pbr-lobby', urlPersonnalise: `/client/host-paradise-resort/pbr-room-standard-twin`, capacity: 2, prixParNuit: 120, description: "Chambre confortable avec deux lits jumeaux et vue sur les jardins.", imageUrls: ["https://placehold.co/600x400.png?text=Standard+Twin"], imageAiHint: "twin room garden", tagIds: ['tag-calme', 'tag-famille-paradise'], amenityIds: ['wifi', 'salle-de-bain', 'tv'] },
  { id: 'pbr-zone-piscine', nom: 'Espace Piscine Paradise', type: 'Site', hostId: 'host-paradise-resort', globalSiteId: 'site-paradise-resort', urlPersonnalise: `/client/host-paradise-resort/pbr-zone-piscine`, amenityIds: ['piscine', 'jacuzzi'] },
  { id: 'pbr-table-piscine-A', nom: 'Table Cabana Piscine A', type: 'Table', hostId: 'host-paradise-resort', globalSiteId: 'site-paradise-resort', parentLocationId: 'pbr-zone-piscine', urlPersonnalise: `/client/host-paradise-resort/pbr-table-piscine-A`, capacity: 6, prixFixeReservation: 25, description: "Cabana privée près de la piscine." },

  // Le Delice Downtown (refinement of existing)
  { id: 'ldd-salle-principale', nom: 'Salle Restaurant Le Delice', type: 'Site', hostId: 'host-le-delice', globalSiteId: 'site-le-delice', urlPersonnalise: `/client/host-le-delice/ldd-salle-principale`, amenityIds: ['wifi', 'climatisation'] },
  { id: 'ldd-table-romantique-2', nom: 'Table Romantique 2pax', type: 'Table', hostId: 'host-le-delice', globalSiteId: 'site-le-delice', parentLocationId: 'ldd-salle-principale', urlPersonnalise: `/client/host-le-delice/ldd-table-romantique-2`, capacity: 2, prixFixeReservation: 10, description: "Table parfaite pour un dîner en amoureux.", tagIds:['tag-romantique'] },
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
];

let customFormsInMemory: CustomForm[] = [
  { id: 'form-sp-activity-booking', nom: 'Réservation Activité (Salty Pelican)', hostId: 'host-salty-pelican' },
  { id: 'form-lp-table-request', nom: 'Demande Spéciale Table (Le Phare)', hostId: 'host-le-phare' },
  { id: 'form-pbr-spa-treatment', nom: 'Choix Soin Spa (Paradise)', hostId: 'host-paradise-resort' },
];

let formFieldsInMemory: FormField[] = [
  { id: 'field-sp-activity-participants', formulaireId: 'form-sp-activity-booking', label: 'Nombre de participants', type: 'number', obligatoire: true, ordre: 1, placeholder: 'e.g., 2' },
  { id: 'field-sp-activity-date', formulaireId: 'form-sp-activity-booking', label: 'Date souhaitée', type: 'date', obligatoire: true, ordre: 2 },
  { id: 'field-lp-table-occasion', formulaireId: 'form-lp-table-request', label: 'Occasion spéciale ?', type: 'text', obligatoire: false, ordre: 1, placeholder: 'Anniversaire, etc.' },
  { id: 'field-pbr-spa-choice', formulaireId: 'form-pbr-spa-treatment', label: 'Type de massage souhaité', type: 'text', obligatoire: true, ordre: 1, placeholder: 'Relaxant, Tissus Profonds...' },
  { id: 'field-pbr-spa-duration', formulaireId: 'form-pbr-spa-treatment', label: 'Durée (minutes)', type: 'number', obligatoire: true, ordre: 2, placeholder: '60' },
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
];

let ordersInMemory: Order[] = [
  { id: 'order-sp-1', serviceId: 'svc-sp-breakfast', hostId: 'host-salty-pelican', chambreTableId: 'sp-room-ocean-double', clientNom: 'Alice Wonderland', userId: 'user-client-alice', donneesFormulaire: JSON.stringify({}), dateHeure: new Date(Date.now() - 3600000 * 24).toISOString(), status: 'completed', prixTotal: 15, montantPaye: 15, soldeDu: 0, pointsGagnes: 15, currency: 'USD' },
  { id: 'order-lp-1', serviceId: 'svc-lp-espresso', hostId: 'host-le-phare', chambreTableId: 'lp-table-fenetre-1', clientNom: 'Bob The Builder', userId: 'user-client-bob', donneesFormulaire: JSON.stringify({}), dateHeure: new Date(Date.now() - 3600000 * 2).toISOString(), status: 'pending', prixTotal: 2.5, currency: 'EUR' },
  { id: 'order-pbr-1', serviceId: 'svc-pbr-massage', hostId: 'host-paradise-resort', chambreTableId: 'pbr-room-deluxe-king', clientNom: 'Alice Wonderland', userId: 'user-client-alice', donneesFormulaire: JSON.stringify({"Type de massage souhaité": "Relaxant", "Durée (minutes)": 90}), dateHeure: new Date().toISOString(), status: 'confirmed', prixTotal: 120, currency: 'USD' },
];

let clientsInMemory: Client[] = [
    { id: 'client-alice-sp', hostId: 'host-salty-pelican', nom: 'Alice Wonderland', email: 'alice@example.com', type: 'heberge', dateArrivee: '2024-07-20', dateDepart: '2024-07-25', locationId: 'sp-room-ocean-double', notes: 'Aime le yoga.', credit: 20, pointsFidelite: 150, userId: 'user-client-alice' },
    { id: 'client-bob-lp', hostId: 'host-le-phare', nom: 'Bob The Builder', email: 'bob@example.com', type: 'passager', telephone: '+33612345678', notes: 'Client régulier le midi.', credit: 5, pointsFidelite: 80, userId: 'user-client-bob' },
    { id: 'client-alice-pbr', hostId: 'host-paradise-resort', nom: 'Alice Wonderland', email: 'alice@example.com', type: 'heberge', dateArrivee: '2024-08-01', dateDepart: '2024-08-07', locationId: 'pbr-room-deluxe-king', credit: 100, pointsFidelite: 250, userId: 'user-client-alice' },
];

const today = new Date();
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const dayAfterTomorrow = new Date(today); dayAfterTomorrow.setDate(today.getDate() + 2);
const threeDaysLater = new Date(today); threeDaysLater.setDate(today.getDate() + 3);

let reservationsInMemory: Reservation[] = [
    { id: 'res-sp-alice', hostId: 'host-salty-pelican', locationId: 'sp-room-ocean-double', type: 'Chambre', clientName: 'Alice Wonderland', clientId: 'user-client-alice', dateArrivee: today.toISOString().split('T')[0], dateDepart: tomorrow.toISOString().split('T')[0], nombrePersonnes: 2, status: 'confirmed', notes: 'Arrivée tardive prévue.', animauxDomestiques: false, prixTotal: 150, montantPaye: 150, soldeDu: 0, onlineCheckinStatus: 'not-started', currency: 'USD' },
    { id: 'res-lp-bob', hostId: 'host-le-phare', locationId: 'lp-table-groupe-5', type: 'Table', clientName: 'Bob The Builder', clientId: 'user-client-bob', dateArrivee: today.toISOString().split('T')[0], dateDepart: undefined, nombrePersonnes: 5, status: 'pending', prixTotal: 15, currency: 'EUR' },
    { id: 'res-pbr-alice-future', hostId: 'host-paradise-resort', locationId: 'pbr-room-standard-twin', type: 'Chambre', clientName: 'Alice Wonderland', clientId: 'user-client-alice', dateArrivee: dayAfterTomorrow.toISOString().split('T')[0], dateDepart: threeDaysLater.toISOString().split('T')[0], nombrePersonnes: 1, status: 'confirmed', prixTotal: 120, onlineCheckinStatus: 'pending-review', onlineCheckinData: {fullName: "Alice W.", email:"alice@example.com", submissionDate: new Date().toISOString()}, currency: 'USD'  },
];


// --- User Management ---
const normalizeUserPassword = (user: any): User => {
  try {
    const userData = { ...user };
    if (userData.motDePasse === undefined && userData.password !== undefined) {
      userData.motDePasse = userData.password;
    } else if (userData.motDePasse === undefined) {
      userData.motDePasse = "";
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
      
      // Handle potential 'password' field and ensure 'motDePasse' is a string
      if (normalizedUser.motDePasse === undefined && (user as any).password !== undefined) {
        normalizedUser.motDePasse = String((user as any).password);
      } else if (normalizedUser.motDePasse === undefined) {
        normalizedUser.motDePasse = "";
      } else {
        normalizedUser.motDePasse = String(normalizedUser.motDePasse);
      }
      delete (normalizedUser as any).password;

      // Ensure 'nom' is set
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
    return [];
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
      if (userData.motDePasse && userData.motDePasse.trim() !== '') { // Check if password is being explicitly updated
          updatedUser.motDePasse = userData.motDePasse.trim();
      }
      if (userData.hasOwnProperty('hostId')) { // Allow setting hostId to undefined
        updatedUser.hostId = userData.hostId || undefined;
      }
      usersInMemory[userIndex] = normalizeUserPassword(updatedUser); // Normalize before saving
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
      // Unlink from clients, orders, reservations
      clientsInMemory = clientsInMemory.map(c => c.userId === userId ? {...c, userId: undefined} : c);
      ordersInMemory = ordersInMemory.map(o => o.userId === userId ? {...o, userId: undefined} : o);
      reservationsInMemory = reservationsInMemory.map(r => r.clientId === userId ? {...r, clientId: undefined} : r); // Assuming clientId can be userId
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
    // Check if host with this email already exists
    const existingHostByEmail = hostsInMemory.find(h => h.email.toLowerCase() === hostData.email.toLowerCase());
    if (existingHostByEmail) {
        log(`Host with email ${hostData.email} already exists. Updating name if different.`);
        if (existingHostByEmail.nom !== hostData.nom) existingHostByEmail.nom = hostData.nom;
        // Ensure associated user exists and is up-to-date
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
    // Create an associated user
    await addUser({
      email: newHost.email,
      nom: newHost.nom,
      role: 'host',
      hostId: newHost.hostId,
      motDePasse: '1234', // Default password for new hosts
    });
    return { ...newHost };
  } catch (e) {
    console.error("Error in addHost (in-memory):", e);
    throw e; // Re-throw the error to be caught by the caller
  }
};

export const updateHost = async (hostId: string, hostData: Partial<Omit<Host, 'hostId'>>): Promise<Host | undefined> => {
  log(`updateHost called for ID: ${hostId} (in-memory) with data:`, hostData);
  try {
    const hostIndex = hostsInMemory.findIndex(h => h.hostId === hostId);
    if (hostIndex > -1) {
      const originalHostData = { ...hostsInMemory[hostIndex] }; // Copy before modification
      // Merge reservationPageSettings
      const updatedReservationSettings: ReservationPageSettings = {
        ...(originalHostData.reservationPageSettings || defaultReservationPageSettings), // Start with existing or default
        ...(hostData.reservationPageSettings || {}), // Apply updates
      };
       // Ensure heroImageAiHint is updated if heroImageUrl changes or name changes
      if (hostData.reservationPageSettings?.heroImageUrl || (hostData.nom && hostData.nom !== originalHostData.nom)) {
          updatedReservationSettings.heroImageAiHint = (hostData.nom || originalHostData.nom).toLowerCase().split(' ').slice(0,2).join(' ') + ' banner';
      }
       if (hostData.reservationPageSettings?.heroImageUrl === '') { // Handle clearing the image
          updatedReservationSettings.heroImageUrl = '';
          updatedReservationSettings.heroImageAiHint = '';
      }


      // Merge loyaltySettings
      const updatedLoyaltySettings: LoyaltySettings = {
        ...(originalHostData.loyaltySettings || defaultLoyaltySettings),
        ...(hostData.loyaltySettings || {}),
      };

      hostsInMemory[hostIndex] = {
        ...originalHostData, // Start with current data
        ...hostData,         // Apply partial updates
        reservationPageSettings: updatedReservationSettings, // Apply merged settings
        loyaltySettings: updatedLoyaltySettings, // Apply merged settings
        // Ensure currency and language are updated if provided, otherwise keep original
        currency: hostData.currency !== undefined ? hostData.currency : originalHostData.currency,
        language: hostData.language !== undefined ? hostData.language : originalHostData.language,
      };
      log(`Host ${hostId} updated (in-memory).`);

      // If host's email or name changed, update the associated user account
      const updatedHost = hostsInMemory[hostIndex];
      if ((hostData.email && hostData.email !== originalHostData.email) || (hostData.nom && hostData.nom !== originalHostData.nom)) {
          let userToUpdate = usersInMemory.find(u => u.hostId === hostId);
          // Fallback: if no user with hostId, try matching by old email (less reliable but a fallback)
          if (!userToUpdate) userToUpdate = usersInMemory.find(u => u.email.toLowerCase() === originalHostData.email.toLowerCase() && u.role === 'host');
          
          if (userToUpdate) {
              await updateUser(userToUpdate.id, { email: updatedHost.email, nom: updatedHost.nom, /* role and hostId should not change here */ });
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

    // Attempt to delete the associated user
    const userToDelete = usersInMemory.find(u => u.hostId === hostId && u.email.toLowerCase() === hostToDelete.email.toLowerCase());
    if (userToDelete) {
      await deleteUser(userToDelete.id); // This will also handle unlinking from other entities
      log(`Associated user ${userToDelete.email} deleted (in-memory).`);
    } else {
      log(`No user directly associated with hostId ${hostId} and matching email found for deletion.`);
    }

    const initialLength = hostsInMemory.length;
    hostsInMemory = hostsInMemory.filter(h => h.hostId !== hostId);
    const hostDeleted = hostsInMemory.length < initialLength;

    if (hostDeleted) {
      log(`Host ${hostId} deleted (in-memory). Cascading deletes to related in-memory data.`);
      // Remove sites associated with this host
      sitesInMemory = sitesInMemory.filter(s => s.hostId !== hostId);
      // Remove rooms/tables associated with this host
      roomsOrTablesInMemory = roomsOrTablesInMemory.filter(rt => rt.hostId !== hostId);
      // Remove service categories
      serviceCategoriesInMemory = serviceCategoriesInMemory.filter(sc => sc.hostId !== hostId);
      // Remove forms and their fields
      const formsForHost = customFormsInMemory.filter(cf => cf.hostId === hostId);
      const formIdsForHost = formsForHost.map(f => f.id);
      formFieldsInMemory = formFieldsInMemory.filter(ff => !formIdsForHost.includes(ff.formulaireId));
      customFormsInMemory = customFormsInMemory.filter(cf => cf.hostId !== hostId);
      // Remove services
      servicesInMemory = servicesInMemory.filter(s => s.hostId !== hostId);
      // Remove orders
      ordersInMemory = ordersInMemory.filter(o => o.hostId !== hostId);
      // Remove client records
      clientsInMemory = clientsInMemory.filter(c => c.hostId !== hostId);
      // Remove reservations
      reservationsInMemory = reservationsInMemory.filter(r => r.hostId !== hostId);
      // Remove tags
      tagsInMemory = tagsInMemory.filter(t => t.hostId !== hostId);
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
      // Also remove RoomOrTable entries that point to this globalSiteId
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
      return a.type.localeCompare(b.type); // Should not happen if type is already filtered
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
      prixParNuit: data.prixParNuit,
      prixFixeReservation: data.prixFixeReservation,
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
          parentLocationId: data.hasOwnProperty('parentLocationId') ? data.parentLocationId : currentItem.parentLocationId, // Allow setting to undefined
          capacity: data.capacity !== undefined ? data.capacity : currentItem.capacity,
          tagIds: data.tagIds !== undefined ? data.tagIds : currentItem.tagIds,
          description: data.description !== undefined ? data.description : currentItem.description,
          imageUrls: data.imageUrls !== undefined ? data.imageUrls : currentItem.imageUrls,
          imageAiHint: data.imageUrls && data.imageUrls.length > 0 && data.nom ? data.nom.toLowerCase().split(' ').slice(0,2).join(' ') : currentItem.imageAiHint,
          amenityIds: data.amenityIds !== undefined ? data.amenityIds : currentItem.amenityIds,
          prixParNuit: data.prixParNuit !== undefined ? data.prixParNuit : currentItem.prixParNuit,
          prixFixeReservation: data.prixFixeReservation !== undefined ? data.prixFixeReservation : currentItem.prixFixeReservation,
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
          // Re-parent children if any
          const children = roomsOrTablesInMemory.filter(rt => rt.parentLocationId === id);
          children.forEach(child => {
              const childIndex = roomsOrTablesInMemory.findIndex(c => c.id === child.id);
              if (childIndex > -1) {
                  // Re-parent to the parent of the deleted location, or to the global site if no grandparent
                  roomsOrTablesInMemory[childIndex].parentLocationId = locationToDelete.parentLocationId || undefined;
                  // globalSiteId remains the same
              }
          });

          // Remove from service targeting
          servicesInMemory.forEach(service => {
              if (service.targetLocationIds?.includes(id)) {
                  service.targetLocationIds = service.targetLocationIds.filter(targetId => targetId !== id);
              }
          });

          // Unlink from client records
          clientsInMemory.forEach(client => {
              if (client.locationId === id) {
                  client.locationId = undefined; // Or handle differently, e.g., log or error
              }
          });
          
          // Remove reservations linked to this location
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
      // Remove this tagId from all locations that might have it
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
      // Uncategorize services using this category
      servicesInMemory = servicesInMemory.map(s => s.categorieId === id ? {...s, categorieId: ''} : s); // Or a default "Uncategorized" ID
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
      // Delete associated form fields
      formFieldsInMemory = formFieldsInMemory.filter(ff => ff.formulaireId !== id);
      // Unassign from services
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
      // Add parent sites/areas to relevantLocationIds if a location is nested
      let parentId = currentScannedLocation.parentLocationId;
      while (parentId) {
        const parentLocation = await getRoomOrTableById(parentId);
        if (parentLocation) {
          relevantLocationIds.push(parentId);
          parentId = parentLocation.parentLocationId;
        } else {
          parentId = undefined; // break loop if parent not found
        }
      }
      // Also consider services targeted to the global site itself
      if (currentScannedLocation.globalSiteId) {
        relevantLocationIds.push(currentScannedLocation.globalSiteId);
      }


      hostServices = hostServices.filter(service => {
        if (!service.targetLocationIds || service.targetLocationIds.length === 0) {
          return true; // Service is available host-wide
        }
        // Check if any of the service's target locations match the client's current location or its parents
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
        targetLocationIds: data.targetLocationIds !== undefined ? data.targetLocationIds : servicesInMemory[serviceIndex].targetLocationIds, // Ensure array is updated
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
      // Remove orders for this service
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
      // Filter by category if serviceId is not specified
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
    if (!clientName) return []; // Return empty if no clientName provided
    const clientOrders = [...ordersInMemory].filter(o =>
      o.hostId === hostId &&
      o.clientNom &&
      o.clientNom.toLowerCase() === clientName.toLowerCase() // Exact match for this function
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
      userId: data.userId, // Ensure userId is carried over
      pointsGagnes: 0,
      currency: hostDetails?.currency || 'USD', // Get currency from host
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

      // Logic to add loyalty points if order is completed
      if (status === 'completed') {
          const host = await getHostById(order.hostId);
          if (host?.loyaltySettings?.enabled && host.loyaltySettings.pointsPerEuroSpent > 0 && order.prixTotal && order.prixTotal > 0) {
              const pointsEarned = Math.floor(order.prixTotal * host.loyaltySettings.pointsPerEuroSpent);
              if (pointsEarned > 0) {
                // Find the client record to add points to
                let clientRecordToUpdate: Client | undefined;
                if (order.userId) {
                  clientRecordToUpdate = clientsInMemory.find(c => c.userId === order.userId && c.hostId === order.hostId);
                }
                if (!clientRecordToUpdate && order.clientNom) {
                  clientRecordToUpdate = clientsInMemory.find(c => c.nom === order.clientNom && c.hostId === order.hostId);
                }
                if (clientRecordToUpdate) {
                   await addPointsToClient(clientRecordToUpdate.id, pointsEarned, order.hostId);
                   order.pointsGagnes = pointsEarned; // Store points earned on the order
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
      c.nom.toLowerCase().includes(lowerCaseClientName) // Use includes for partial match
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
        credit: 0, // Initialize credit to 0
        pointsFidelite: initialPoints, // Initialize points with signup bonus
        userId: clientData.userId || undefined, // Ensure userId is passed if available
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
  log(`updateClientData called for ID: ${clientId}. Data: ${JSON.stringify(data)}. Using in-memory data.`);
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
      // Unlink from reservations (if clientId was used)
      reservationsInMemory = reservationsInMemory.map(r => {
        if (r.clientId === clientId) {
          return { ...r, clientId: undefined, clientName: r.clientName || "Deleted Client" };
        }
        return r;
      });
      // Consider if orders need unlinking if they used clientId (currently they use userId or clientNom)
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
    month?: number; // 0-11 for Date object
    year?: number;
    startDate?: Date; // For date range queries
    endDate?: Date;
  }
): Promise<Reservation[]> => {
  log(`getReservations called for host: ${hostId}, filters: ${JSON.stringify(filters)}. Using in-memory data.`);
  try {
    let hostReservations = reservationsInMemory.filter(r => r.hostId === hostId);
    if (filters?.locationId) {
      hostReservations = hostReservations.filter(r => r.locationId === filters.locationId);
    }
    // Filter by month and year
    if (filters?.month !== undefined && filters?.year !== undefined) {
        const monthStart = new Date(Date.UTC(filters.year, filters.month, 1));
        const monthEnd = new Date(Date.UTC(filters.year, filters.month + 1, 0, 23, 59, 59, 999)); // End of the month

        hostReservations = hostReservations.filter(r => {
            try {
                const arrivalDate = new Date(r.dateArrivee + "T00:00:00Z"); // Assume dates are stored as YYYY-MM-DD
                // For tables, departure is same as arrival. For rooms, use dateDepart.
                const departureDateForRoom = r.dateDepart ? new Date(r.dateDepart + "T00:00:00Z") : null;
                const effectiveDeparture = r.type === 'Table' || !departureDateForRoom ? new Date(r.dateArrivee + "T23:59:59Z") : departureDateForRoom;
                if (!effectiveDeparture) return false; // Should not happen if arrivalDate is valid

                // Check if reservation period overlaps with the filter month
                return (arrivalDate <= monthEnd && effectiveDeparture >= monthStart);
            } catch (e) {
                log("Error parsing date for reservation filtering by month/year", {reservationId: r.id, error: e});
                return false;
            }
        });
    }
     // Filter by date range (for calendar view, etc.)
     if (filters?.startDate && filters?.endDate) {
        const queryStart = filters.startDate; // Should be Date objects
        const queryEnd = filters.endDate;     // Should be Date objects
        hostReservations = hostReservations.filter(r => {
            try {
                const resArrival = new Date(r.dateArrivee + "T00:00:00Z");
                // For tables, departure is the end of arrival day. For rooms, use dateDepart.
                const resDeparture = r.dateDepart ? new Date(r.dateDepart + "T00:00:00Z") : new Date(r.dateArrivee + "T23:59:59Z");
                // Check for overlap: (StartA < EndB) and (EndA > StartB)
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
        // Calculate nights correctly: for rooms, it's the number of nights.
        // If arrival and departure are on the same day, it's typically 0 nights, but for pricing, min 1 night.
        // For a proper hotel system, if checkout is same day as checkin, it's 0 nights unless day-use.
        // For simplicity, we'll assume departure is always at least the day after for a priced room stay.
        const nights = Math.max(1, Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 3600 * 24)));
        prixTotalReservation = nights * location.prixParNuit;
    } else if (location?.type === 'Table' && location.prixFixeReservation !== undefined) {
        prixTotalReservation = location.prixFixeReservation;
    }

    const newReservation: Reservation = {
      ...data,
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
      type: location?.type, // Set the type based on the location
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

      // Recalculate price if relevant fields change
      if(data.dateArrivee || data.dateDepart || data.locationId) {
        const arrivalDate = data.dateArrivee || existingReservation.dateArrivee;
        const departureDate = data.dateDepart === null ? undefined : (data.dateDepart || existingReservation.dateDepart); // Allow clearing departure date
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
        type: location?.type || existingReservation.type, // Update type if location changed
        prixTotal: prixTotalReservation,
        soldeDu: prixTotalReservation !== undefined ? prixTotalReservation - (data.montantPaye !== undefined ? data.montantPaye : (existingReservation.montantPaye || 0)) : existingReservation.soldeDu,
      };

      // Loyalty points logic on check-out
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

          // Add points based on spending if applicable (could be separate from stay/booking points)
          if (updatedReservation.prixTotal && updatedReservation.prixTotal > 0 && host.loyaltySettings.pointsPerEuroSpent > 0) {
             // Ensure this is not double-counted if pointsPerEuroSpent is already included in room/table points logic
             // For now, let's assume it's for additional services or a general spend bonus
             // pointsToAward += Math.floor(updatedReservation.prixTotal * host.loyaltySettings.pointsPerEuroSpent);
          }

          if (pointsToAward > 0) {
             let clientToAwardPoints: Client | undefined = undefined;
             // Try to find client by clientId (which could be User.id or Client.id)
             if (updatedReservation.clientId) {
                clientToAwardPoints = clientsInMemory.find(c => (c.id === updatedReservation.clientId || c.userId === updatedReservation.clientId) && c.hostId === updatedReservation.hostId);
             }
             // If not found by ID, try by name (less reliable)
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
  log(`deleteReservation called for: ${id}. Using in-memory data.`);
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
    // Find all Client records linked to this User.id
    const clientRecordsForUser = clientsInMemory.filter(c => c.userId === userId);
    const clientRecordIds = clientRecordsForUser.map(cr => cr.id);

    return [...reservationsInMemory].filter(r => {
      // Reservation is linked if its clientId matches User.id OR if its clientId matches one of the Client record IDs
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
      r.clientName && // Ensure clientName exists on the reservation
      r.clientName.toLowerCase().includes(lowerCaseClientName)
    ).sort((a, b) => new Date(b.dateArrivee).getTime() - new Date(a.dateArrivee).getTime());
  } catch (e) {
    console.error("Error in getReservationsByClientName (in-memory):", e);
    return [];
  }
};


log("Initial in-memory data loaded/defined.");
log(`Users: ${usersInMemory.length}, Hosts: ${hostsInMemory.length}, Global Sites: ${sitesInMemory.length}, Locations: ${roomsOrTablesInMemory.length}`);
log(`Categories: ${serviceCategoriesInMemory.length}, Forms: ${customFormsInMemory.length}, Fields: ${formFieldsInMemory.length}, Services: ${servicesInMemory.length}`);
log(`Orders: ${ordersInMemory.length}, Clients: ${clientsInMemory.length}, Reservations: ${reservationsInMemory.length}, Tags: ${tagsInMemory.length}`);

