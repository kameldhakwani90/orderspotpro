
// src/lib/data.ts
import type { User, Site, Host, RoomOrTable, ServiceCategory, CustomForm, FormField, Service, Order, OrderStatus, Client, ClientType, Reservation, ReservationStatus, Tag, OnlineCheckinData, OnlineCheckinStatus, LoyaltySettings } from './types';

// Firebase imports are commented out as we are using in-memory data
// import { db } from './firebase'; // Assuming firebase is correctly configured
// import { collection, getDocs, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';

const log = (message: string, data?: any) => {
  // console.log(`[Data Layer Memory] ${new Date().toISOString()}: ${message}`, data !== undefined ? data : '');
}
log("Data layer initialized. USING IN-MEMORY DATA for all entities.");


// --- In-memory data store ---
let usersInMemory: User[] = [
  { id: 'user-admin-01', email: 'kamel@gmail.com', nom: 'Kamel Admin', role: 'admin', motDePasse: '0000' },
  { id: 'user-host-01', email: 'manager@paradise.com', nom: 'Paradise Manager', role: 'host', hostId: 'host-01-inmem', motDePasse: '1234' },
  { id: 'user-host-02', email: 'contact@delice.com', nom: 'Delice Owner', role: 'host', hostId: 'host-02-inmem', motDePasse: '1234' },
  { id: 'user-dynamic-host-01', email: 'dynamic.host@example.com', nom: 'Dynamic Test Host User', role: 'host', hostId: 'host-1747669860022', motDePasse: '1234' },
  { id: 'user-client-01', email: 'client1@example.com', nom: 'Alice Wonderland', role: 'client', motDePasse: '1234' },
  { id: 'user-client-02', email: 'client2@example.com', nom: 'Bob The Builder', role: 'client', motDePasse: '1234' },
  { id: 'user-dynamic-client-01', email: 'dynamic_client@example.com', nom: 'Dynamic Test Client User', role: 'client', motDePasse: '1234' },
];

const defaultLoyaltySettings: LoyaltySettings = {
  enabled: false,
  pointsPerEuroSpent: 1,
  pointsPerNightRoom: 10,
  pointsPerTableBooking: 5,
  pointsForNewClientSignup: 0,
};

let hostsInMemory: Host[] = [
  { hostId: 'host-01-inmem', nom: 'Paradise Beach Resort (In-Mem)', email: 'manager@paradise.com', reservationPageSettings: { heroImageUrl: 'https://placehold.co/1200x400.png?text=Paradise+Resort+Banner', heroImageAiHint: 'resort beach banner', enableRoomReservations: true, enableTableReservations: true }, loyaltySettings: { ...defaultLoyaltySettings, enabled: true, pointsPerEuroSpent: 1, pointsPerNightRoom: 10, pointsPerTableBooking: 5, pointsForNewClientSignup: 50 } },
  { hostId: 'host-02-inmem', nom: 'Le Delice Downtown (In-Mem)', email: 'contact@delice.com', reservationPageSettings: { enableRoomReservations: false, enableTableReservations: true }, loyaltySettings: { ...defaultLoyaltySettings } },
  { hostId: 'host-1747669860022', nom: 'Dynamic Test Est. (In-Mem)', email: 'dynamic.host@example.com', reservationPageSettings: { heroImageUrl: 'https://placehold.co/1200x400.png?text=Dynamic+Test+Banner', heroImageAiHint: 'dynamic test banner', enableRoomReservations: true, enableTableReservations: false }, loyaltySettings: { ...defaultLoyaltySettings, enabled: true, pointsPerEuroSpent: 2, pointsPerNightRoom: 15, pointsPerTableBooking: 3, pointsForNewClientSignup: 25 } },
];

let sitesInMemory: Site[] = [
  { siteId: 'site-01', nom: 'Paradise Beach Resort (Global)', hostId: 'host-01-inmem', logoUrl: 'https://placehold.co/100x100.png?text=Paradise', logoAiHint: 'resort logo', primaryColor: '#64B5F6' },
  { siteId: 'site-02', nom: 'Le Delice Downtown (Global)', hostId: 'host-02-inmem', logoUrl: 'https://placehold.co/100x100.png?text=Delice', logoAiHint: 'restaurant logo', primaryColor: '#9575CD' },
  { siteId: 'site-dynamic-01', nom: 'Dynamic Test Establishment (Global)', hostId: 'host-1747669860022', logoUrl: 'https://placehold.co/100x100.png?text=Dynamic', logoAiHint: 'dynamic logo', primaryColor: '#FF5733' },
];

let roomsOrTablesInMemory: RoomOrTable[] = [
  { id: 'rt-paradise-main', nom: 'Paradise Resort Main Area', type: 'Site', hostId: 'host-01-inmem', globalSiteId: 'site-01', parentLocationId: undefined, urlPersonnalise: `/client/host-01-inmem/rt-paradise-main`, capacity: 200, description: "Main area of the Paradise Resort, featuring stunning ocean views and multiple zones.", imageUrls: ["https://placehold.co/600x400.png?text=Resort+View+1", "https://placehold.co/600x400.png?text=Resort+View+2"], imageAiHint: "resort main area", tagIds: ['tag-luxury-inmem', 'tag-beachfront-inmem'], amenityIds: ['wifi', 'parking-gratuit-sur-place', 'ascenseur', 'piscine'] },
  { id: 'rt-lobby-01', nom: 'Lobby Zone', type: 'Site', hostId: 'host-01-inmem', globalSiteId: 'site-01', parentLocationId: 'rt-paradise-main', urlPersonnalise: `/client/host-01-inmem/rt-lobby-01`, capacity: 50, description: "Comfortable lobby area with seating, reception, and concierge services.", imageUrls: ["https://placehold.co/600x400.png?text=Lobby+1"], imageAiHint: "hotel lobby", tagIds: ['tag-reception-inmem'], amenityIds: ['wifi', 'climatisation', 'espace-travail-dedie', 'cles-remises-hote'] },
  { id: 'rt-reception-desk-01', nom: 'Reception Desk Area', type: 'Site', hostId: 'host-01-inmem', globalSiteId: 'site-01', parentLocationId: 'rt-lobby-01', urlPersonnalise: `/client/host-01-inmem/rt-reception-desk-01`, capacity: 10, description: "Main reception and check-in desk.", amenityIds: ['cles-remises-hote'] },
  { id: 'room-101', nom: 'Chambre 101', type: 'Chambre', hostId: 'host-01-inmem', globalSiteId: 'site-01', parentLocationId: 'rt-lobby-01', urlPersonnalise: `/client/host-01-inmem/room-101`, capacity: 2, prixParNuit: 120, description: "Standard double room with garden view. Cozy and quiet.", imageUrls: ["https://placehold.co/600x400.png?text=Room+101+Pic1", "https://placehold.co/600x400.png?text=Room+101+Pic2"], imageAiHint: "hotel room garden", tagIds: ['tag-standard-inmem', 'tag-quiet-inmem'], amenityIds: ['salle-de-bain', 'wifi', 'tv', 'chauffage-central', 'serrure-porte-chambre', 'detecteur-fumee', 'vue-parc', 'draps', 'cintres'] },
  { id: 'room-102', nom: 'Chambre 102 (Suite)', type: 'Chambre', hostId: 'host-01-inmem', globalSiteId: 'site-01', parentLocationId: 'rt-lobby-01', urlPersonnalise: `/client/host-01-inmem/room-102`, capacity: 4, prixParNuit: 250, description: "Spacious suite with a private balcony and ocean view. Includes a small kitchenette.", imageUrls: ["https://placehold.co/600x400.png?text=Suite+Pic"], imageAiHint: "hotel suite ocean", tagIds: ['tag-suite-inmem', 'tag-balcony-inmem'], amenityIds: ['salle-de-bain', 'seche-cheveux', 'wifi', 'tv', 'climatisation', 'terrasse-balcon', 'vue-mer', 'cuisine', 'micro-ondes'] },
  { id: 'rt-pool-01', nom: 'Pool Area', type: 'Site', hostId: 'host-01-inmem', globalSiteId: 'site-01', parentLocationId: 'rt-paradise-main', urlPersonnalise: `/client/host-01-inmem/rt-pool-01`, capacity: 100, description: "Large outdoor swimming pool with sun loungers, cabanas, and a poolside bar.", imageUrls: ["https://placehold.co/600x400.png?text=Pool+Area"], imageAiHint: "swimming pool resort", tagIds: ['tag-poolside-inmem'], amenityIds: ['piscine', 'jacuzzi'] },
  { id: 'table-pool-1', nom: 'Table Piscine 1', type: 'Table', hostId: 'host-01-inmem', globalSiteId: 'site-01', parentLocationId: 'rt-pool-01', urlPersonnalise: `/client/host-01-inmem/table-pool-1`, capacity: 4, prixFixeReservation: 15, description: "Poolside table for snacks and drinks, shaded by an umbrella.", tagIds: ['tag-outdoor-inmem'] },
  { id: 'rt-delice-main', nom: 'Delice Main Dining', type: 'Site', hostId: 'host-02-inmem', globalSiteId: 'site-02', parentLocationId: undefined, urlPersonnalise: `/client/host-02-inmem/rt-delice-main`, capacity: 80, description: "Main dining hall of Le Delice Downtown, offering exquisite French cuisine.", imageUrls: ["https://placehold.co/600x400.png?text=Delice+Dining"], imageAiHint: "restaurant dining", tagIds: ['tag-fine-dining-inmem'], amenityIds: ['wifi', 'climatisation', 'table-manger'] },
  { id: 'table-5', nom: 'Table 5', type: 'Table', hostId: 'host-02-inmem', globalSiteId: 'site-02', parentLocationId: 'rt-delice-main', urlPersonnalise: `/client/host-02-inmem/table-5`, capacity: 2, prixFixeReservation: 10, description: "Cozy table for two near the window, perfect for a romantic dinner." },
  { id: 'table-vip', nom: 'VIP Table', type: 'Table', hostId: 'host-02-inmem', globalSiteId: 'site-02', parentLocationId: 'rt-delice-main', urlPersonnalise: `/client/host-02-inmem/table-vip`, capacity: 8, prixFixeReservation: 50, description: "Exclusive VIP table with premium service and a curated menu.", tagIds: ['tag-vip-inmem'] },
  { id: 'rt-dynamic-main', nom: 'Dynamic Main Area', type: 'Site', hostId: 'host-1747669860022', globalSiteId: 'site-dynamic-01', parentLocationId: undefined, urlPersonnalise: `/client/host-1747669860022/rt-dynamic-main`, capacity: 150, description: "Main area for Dynamic Test Establishment.", imageUrls: ["https://placehold.co/600x400.png?text=Dynamic+Area"], amenityIds: ['wifi'] },
  { id: 'rt-dynamic-lobby', nom: 'Dynamic Lobby', type: 'Site', hostId: 'host-1747669860022', globalSiteId: 'site-dynamic-01', parentLocationId: 'rt-dynamic-main', urlPersonnalise: `/client/host-1747669860022/rt-dynamic-lobby`, capacity: 30, description: "Lobby of Dynamic Test Establishment.", amenityIds: ['wifi', 'climatisation'] },
  { id: 'rt-dynamic-room1', nom: 'Dynamic Room 101', type: 'Chambre', hostId: 'host-1747669860022', globalSiteId: 'site-dynamic-01', parentLocationId: 'rt-dynamic-lobby', urlPersonnalise: `/client/host-1747669860022/rt-dynamic-room1`, capacity: 2, prixParNuit: 99, description: "Standard room in Dynamic Test Establishment.", imageUrls: ["https://placehold.co/600x400.png?text=Dynamic+Room"], tagIds: ['tag-standard-inmem'], amenityIds: ['salle-de-bain', 'wifi', 'tv'] },
  { id: 'rt-dynamic-table1', nom: 'Dynamic Table Alpha', type: 'Table', hostId: 'host-1747669860022', globalSiteId: 'site-dynamic-01', parentLocationId: 'rt-dynamic-main', urlPersonnalise: `/client/host-1747669860022/rt-dynamic-table1`, capacity: 6, prixFixeReservation: 20, description: "Table Alpha in Dynamic Test Establishment." },
];

let tagsInMemory: Tag[] = [
  { id: 'tag-luxury-inmem', name: 'Luxe', hostId: 'host-01-inmem' },
  { id: 'tag-beachfront-inmem', name: 'Front de Mer', hostId: 'host-01-inmem' },
  { id: 'tag-quiet-inmem', name: 'Calme', hostId: 'host-01-inmem' },
  { id: 'tag-standard-inmem', name: 'Standard', hostId: 'host-01-inmem' },
  { id: 'tag-suite-inmem', name: 'Suite', hostId: 'host-01-inmem' },
  { id: 'tag-balcony-inmem', name: 'Balcon', hostId: 'host-01-inmem' },
  { id: 'tag-poolside-inmem', name: 'Bord de Piscine', hostId: 'host-01-inmem' },
  { id: 'tag-outdoor-inmem', name: 'Extérieur', hostId: 'host-01-inmem' },
  { id: 'tag-fine-dining-inmem', name: 'Gastronomique', hostId: 'host-02-inmem' },
  { id: 'tag-vip-inmem', name: 'VIP', hostId: 'host-02-inmem' },
  { id: 'tag-reception-inmem', name: 'Réception', hostId: 'host-01-inmem' },
];

let serviceCategoriesInMemory: ServiceCategory[] = [
  { id: 'cat-roomservice-inmem', nom: 'Room Service (In-Mem)', hostId: 'host-01-inmem', image: 'https://placehold.co/300x200.png?text=Room+Service', "data-ai-hint": "room service" },
  { id: 'cat-transport-inmem', nom: 'Transport & Tours (In-Mem)', hostId: 'host-01-inmem', image: 'https://placehold.co/300x200.png?text=Transport', "data-ai-hint": "transportation tour" },
  { id: 'cat-food-inmem', nom: 'Food Menu (In-Mem)', hostId: 'host-02-inmem', image: 'https://placehold.co/300x200.png?text=Food+Menu', "data-ai-hint": "food menu" },
  { id: 'cat-drinks-inmem', nom: 'Beverages (In-Mem)', hostId: 'host-02-inmem', image: 'https://placehold.co/300x200.png?text=Beverages', "data-ai-hint": "drinks beverages" },
  { id: 'cat-activities-inmem', nom: 'Resort Activities (In-Mem)', hostId: 'host-01-inmem', image: 'https://placehold.co/300x200.png?text=Activities', "data-ai-hint": "activities leisure" },
  { id: 'cat-poolside-inmem', nom: 'Poolside Snacks & Drinks (In-Mem)', hostId: 'host-01-inmem', image: 'https://placehold.co/300x200.png?text=Poolside+Snacks', "data-ai-hint": "poolside snacks" },
  { id: 'cat-dynamic-main-inmem', nom: 'General Services (Dynamic Host)', hostId: 'host-1747669860022', image: 'https://placehold.co/300x200.png?text=General+Services', "data-ai-hint": "general services" },
];

let customFormsInMemory: CustomForm[] = [
  { id: 'form-booking-inmem', nom: 'Booking Details (In-Mem)', hostId: 'host-01-inmem' },
  { id: 'form-foodorder-inmem', nom: 'Food Order Preferences (In-Mem)', hostId: 'host-02-inmem' },
  { id: 'form-generic-info-inmem', nom: 'General Inquiry (In-Mem)', hostId: 'host-01-inmem' },
  { id: 'form-no-fields-inmem', nom: 'Simple Confirmation (No Fields) (In-Mem)', hostId: 'host-01-inmem' },
  { id: 'form-activity-signup-inmem', nom: 'Activity Sign-up Details (In-Mem)', hostId: 'host-01-inmem'},
  { id: 'form-dynamic-request-inmem', nom: 'Dynamic Service Request (Dynamic Host)', hostId: 'host-1747669860022'},
];

let formFieldsInMemory: FormField[] = [
  { id: 'field-persons-inmem', formulaireId: 'form-booking-inmem', label: 'Number of Persons', type: 'number', obligatoire: true, ordre: 1, placeholder: 'e.g., 2' },
  { id: 'field-date-inmem', formulaireId: 'form-booking-inmem', label: 'Desired Date', type: 'date', obligatoire: true, ordre: 2 },
  { id: 'field-time-inmem', formulaireId: 'form-booking-inmem', label: 'Preferred Time', type: 'time', obligatoire: false, ordre: 3 },
  { id: 'field-dish-inmem', formulaireId: 'form-foodorder-inmem', label: 'Main Dish Choice', type: 'text', obligatoire: true, ordre: 1, placeholder: 'e.g., Pizza Margherita' },
  { id: 'field-notes-inmem', formulaireId: 'form-foodorder-inmem', label: 'Additional Notes/Allergies', type: 'textarea', obligatoire: false, ordre: 2, placeholder: 'e.g., No onions, gluten-free' },
  { id: 'field-name-generic-inmem', formulaireId: 'form-generic-info-inmem', label: 'Your Name', type: 'text', obligatoire: true, ordre: 1, placeholder: 'John Doe' },
  { id: 'field-email-generic-inmem', formulaireId: 'form-generic-info-inmem', label: 'Your Email', type: 'email', obligatoire: true, ordre: 2, placeholder: 'john.doe@example.com' },
  { id: 'field-message-generic-inmem', formulaireId: 'form-generic-info-inmem', label: 'Your Message/Question', type: 'textarea', obligatoire: true, ordre: 3, placeholder: 'Type your message here...' },
  { id: 'field-activity-name-inmem', formulaireId: 'form-activity-signup-inmem', label: 'Participant Full Name', type: 'text', obligatoire: true, ordre: 1},
  { id: 'field-activity-age-inmem', formulaireId: 'form-activity-signup-inmem', label: 'Participant Age', type: 'number', obligatoire: false, ordre: 2},
  { id: 'field-dynamic-detail-inmem', formulaireId: 'form-dynamic-request-inmem', label: 'Request Detail', type: 'textarea', obligatoire: true, ordre: 1, placeholder: 'Please describe your request...'},
];

let servicesInMemory: Service[] = [
  { id: 'svc-taxi-inmem', titre: 'Airport Taxi (In-Mem)', description: 'Book a taxi to or from the airport.', image: 'https://placehold.co/600x400.png?text=Airport+Taxi', "data-ai-hint": "taxi airport", categorieId: 'cat-transport-inmem', hostId: 'host-01-inmem', formulaireId: 'form-booking-inmem', prix: 50, targetLocationIds: [], loginRequired: true },
  { id: 'svc-breakfast-inmem', titre: 'In-Room Breakfast (In-Mem)', description: 'Order your breakfast selection.', image: 'https://placehold.co/600x400.png?text=In-Room+Breakfast', "data-ai-hint": "breakfast room", categorieId: 'cat-roomservice-inmem', hostId: 'host-01-inmem', formulaireId: 'form-foodorder-inmem', prix: 25, targetLocationIds: ['room-101', 'room-102'], loginRequired: false },
  { id: 'svc-pool-cocktails-inmem', titre: 'Poolside Cocktails (In-Mem)', description: 'Enjoy refreshing cocktails by the pool.', image: 'https://placehold.co/600x400.png?text=Poolside+Cocktail', "data-ai-hint": "cocktail pool", categorieId: 'cat-poolside-inmem', hostId: 'host-01-inmem', prix: 12, targetLocationIds: ['rt-pool-01'], loginRequired: false },
  { id: 'svc-pizza-inmem', titre: 'Artisan Pizza (In-Mem)', description: 'Delicious stone-baked pizza.', image: 'https://placehold.co/600x400.png?text=Artisan+Pizza', "data-ai-hint": "pizza food", categorieId: 'cat-food-inmem', hostId: 'host-02-inmem', formulaireId: 'form-foodorder-inmem', prix: 18, targetLocationIds: [], loginRequired: false },
  { id: 'svc-water-restaurant-inmem', titre: 'Bottled Water (Restaurant - In-Mem)', description: 'Chilled spring water.', image: 'https://placehold.co/600x400.png?text=Bottled+Water', "data-ai-hint": "water bottle", categorieId: 'cat-drinks-inmem', hostId: 'host-02-inmem', prix: 3, targetLocationIds: [], loginRequired: false },
  { id: 'svc-concierge-inmem', titre: 'Concierge Assistance (In-Mem)', description: 'Need help with bookings or local information?', image: 'https://placehold.co/600x400.png?text=Concierge', "data-ai-hint": "concierge helpdesk", categorieId: 'cat-roomservice-inmem', hostId: 'host-01-inmem', formulaireId: 'form-generic-info-inmem', targetLocationIds: ['rt-lobby-01', 'rt-reception-desk-01'], loginRequired: true },
  { id: 'svc-spa-inmem', titre: 'Full Day Spa Package (In-Mem)', description: 'Indulge in a full day of relaxation.', image: 'https://placehold.co/600x400.png?text=Spa+Package', "data-ai-hint": "spa massage", categorieId: 'cat-activities-inmem', hostId: 'host-01-inmem', formulaireId: 'form-booking-inmem', prix: 150, targetLocationIds: [], loginRequired: true },
  { id: 'svc-citytour-inmem', titre: 'Guided City Tour (In-Mem)', description: 'Explore the city highlights.', image: 'https://placehold.co/600x400.png?text=City+Tour', "data-ai-hint": "city tour", categorieId: 'cat-transport-inmem', hostId: 'host-01-inmem', formulaireId: 'form-activity-signup-inmem', prix: 75, targetLocationIds: ['rt-lobby-01', 'rt-reception-desk-01'], loginRequired: true },
  { id: 'svc-dynamic-info-inmem', titre: 'Info Desk (Dynamic Host)', description: 'Ask us anything!', image: 'https://placehold.co/600x400.png?text=Info+Desk', "data-ai-hint": "information desk", categorieId: 'cat-dynamic-main-inmem', hostId: 'host-1747669860022', formulaireId: 'form-dynamic-request-inmem', targetLocationIds: ['rt-dynamic-lobby'], loginRequired: false},
  { id: 'svc-dynamic-roomclean-inmem', titre: 'Room Cleaning (Dynamic Host)', description: 'Schedule room cleaning.', image: 'https://placehold.co/600x400.png?text=Room+Cleaning', "data-ai-hint": "room cleaning", categorieId: 'cat-dynamic-main-inmem', hostId: 'host-1747669860022', formulaireId: undefined, targetLocationIds: ['rt-dynamic-room1'], loginRequired: true},
];

let ordersInMemory: Order[] = [
  { id: 'order-001-inmem', serviceId: 'svc-taxi-inmem', hostId: 'host-01-inmem', chambreTableId: 'room-101', clientNom: 'Alice Wonderland', userId: 'user-client-01', donneesFormulaire: JSON.stringify({ persons: 2, date: '2024-08-15', time: '10:00' }), dateHeure: new Date(Date.now() - 3600000 * 2).toISOString(), status: 'pending', prixTotal: 50, montantPaye: 0, soldeDu: 50, pointsGagnes: 0 },
  { id: 'order-002-inmem', serviceId: 'svc-breakfast-inmem', hostId: 'host-01-inmem', chambreTableId: 'room-102', clientNom: 'Bob The Builder', userId: 'user-client-02', donneesFormulaire: JSON.stringify({ dish: "Continental Breakfast", notes: "Extra orange juice"}), dateHeure: new Date(Date.now() - 3600000 * 5).toISOString(), status: 'completed', prixTotal: 25, montantPaye: 25, soldeDu: 0, paiements: [{ type: 'card', montant: 25, date: new Date(Date.now() - 3600000 * 5).toISOString() }], pointsGagnes: 25 },
  { id: 'order-003-inmem', serviceId: 'svc-pizza-inmem', hostId: 'host-02-inmem', chambreTableId: 'table-5', clientNom: 'Alice Wonderland', userId: 'user-client-01', donneesFormulaire: JSON.stringify({dish: "Pepperoni Pizza", notes: "Extra cheese"}), dateHeure: new Date(Date.now() - 3600000 * 1).toISOString(), status: 'confirmed', prixTotal: 18, montantPaye: 0, soldeDu: 18, pointsGagnes: 0 },
  { id: 'order-004-inmem', serviceId: 'svc-spa-inmem', hostId: 'host-01-inmem', chambreTableId: 'room-101', clientNom: 'Alice Wonderland', userId: 'user-client-01', donneesFormulaire: JSON.stringify({ persons: 1, date: '2024-09-10', time: '14:00' }), dateHeure: new Date().toISOString(), status: 'pending', prixTotal: 150, montantPaye: 0, soldeDu: 150, pointsGagnes: 0 },
  { id: 'order-005-inmem', serviceId: 'svc-citytour-inmem', hostId: 'host-01-inmem', chambreTableId: 'rt-reception-desk-01', clientNom: 'Bob The Builder', userId: 'user-client-02', donneesFormulaire: JSON.stringify({ participant_name: "Bob Builder", participant_age: "35" }), dateHeure: new Date(Date.now() - 3600000 * 24).toISOString(), status: 'completed', prixTotal: 75, montantPaye: 75, soldeDu: 0, paiements: [{type: 'cash', montant: 75, date: new Date(Date.now() - 3600000 * 24).toISOString()}], pointsGagnes: 75 },
  { id: 'order-006-inmem', serviceId: 'svc-dynamic-info-inmem', hostId: 'host-1747669860022', chambreTableId: 'rt-dynamic-lobby', clientNom: 'Test Guest', userId: undefined, donneesFormulaire: JSON.stringify({ request_detail: "Need directions to the nearest ATM."}), dateHeure: new Date().toISOString(), status: 'pending', prixTotal: undefined },
  { id: 'order-007-inmem', hostId: 'host-1747669860022', serviceId: 'svc-dynamic-roomclean-inmem', chambreTableId: 'rt-dynamic-room1', clientNom: 'Dynamic Test Client User', userId: 'user-dynamic-client-01', donneesFormulaire: '{}', dateHeure: new Date(Date.now() - 3600000 * 3).toISOString(), status: 'completed', prixTotal: undefined, pointsGagnes: 0 },
];

let clientsInMemory: Client[] = [
    { id: 'client-mock-1-inmem', hostId: 'host-01-inmem', nom: 'Alice Wonderland (In-Mem)', email: 'client1@example.com', type: 'heberge', dateArrivee: '2024-07-10', dateDepart: '2024-07-15', locationId: 'room-101', notes: 'Prefers quiet room. Likes extra pillows.', credit: 50, pointsFidelite: 120 },
    { id: 'client-mock-2-inmem', hostId: 'host-01-inmem', nom: 'Bob The Builder (In-Mem)', email: 'client2@example.com', type: 'heberge', dateArrivee: '2024-07-12', dateDepart: '2024-07-14', locationId: 'room-102', credit: 0, pointsFidelite: 75 },
    { id: 'client-mock-3-inmem', hostId: 'host-02-inmem', nom: 'Charlie Passager (In-Mem)', telephone: '+1123456789', type: 'passager', notes: 'Regular for lunch on Fridays.', credit: 10, pointsFidelite: 30 },
    { id: 'client-mock-4-inmem', hostId: 'host-01-inmem', nom: 'Diana Visitor (In-Mem)', email: 'diana@example.com', type: 'passager', notes: 'Interested in spa services.', credit: 0, pointsFidelite: 0},
    { id: 'client-mock-dynamic-inmem', hostId: 'host-1747669860022', nom: 'Dynamic Test Client User (In-Mem)', email: 'dynamic_client@example.com', type: 'heberge', dateArrivee: '2024-08-01', dateDepart: '2024-08-05', locationId: 'rt-dynamic-room1', notes: 'Testing client for dynamic host.', credit: 100, pointsFidelite: 50 },
];

let reservationsInMemory: Reservation[] = [
    { id: 'res-001-inmem', hostId: 'host-01-inmem', locationId: 'room-101', type: 'Chambre', clientName: 'Alice Wonderland (In-Mem)', clientId: 'client-mock-1-inmem', dateArrivee: '2024-07-10', dateDepart: '2024-07-15', nombrePersonnes: 2, status: 'confirmed', notes: 'Early check-in requested', animauxDomestiques: false, channel: 'Booking.com', prixTotal: 600, montantPaye: 600, soldeDu: 0, paiements: [{type: 'card', montant: 600, date: '2024-07-09'}], onlineCheckinStatus: 'not-started', pointsGagnes: 50 }, // 5 nights * 10 points/night
    { id: 'res-002-inmem', hostId: 'host-01-inmem', locationId: 'room-102', type: 'Chambre', clientName: 'Bob The Builder (In-Mem)', clientId: 'client-mock-2-inmem', dateArrivee: '2024-07-12', dateDepart: '2024-07-14', nombrePersonnes: 1, animauxDomestiques: true, status: 'checked-in', channel: 'Direct', prixTotal: 500, montantPaye: 200, soldeDu: 300, onlineCheckinStatus: 'not-started', pointsGagnes: 0 },
    { id: 'res-003-inmem', hostId: 'host-1747669860022', locationId: 'rt-dynamic-room1', type: 'Chambre', clientName: 'Dynamic Test Client User (In-Mem)', clientId: 'client-mock-dynamic-inmem', dateArrivee: '2024-08-01', dateDepart: '2024-08-05', nombrePersonnes: 2, notes: "Needs a crib", status: 'pending', animauxDomestiques: false, prixTotal: 396, onlineCheckinStatus: 'not-started', pointsGagnes: 0 },
    { id: 'res-004-inmem', hostId: 'host-02-inmem', locationId: 'table-5', type: 'Table', clientName: 'Charlie Passager (In-Mem)', clientId: 'client-mock-3-inmem', dateArrivee: '2024-07-20', nombrePersonnes: 4, status: 'confirmed', notes: 'Dinner reservation for 8 PM', channel: 'Phone', prixTotal: 10, montantPaye: 10, soldeDu: 0, onlineCheckinStatus: 'not-started', pointsGagnes: 5 },
    { id: 'res-dynamic-table-inmem', hostId: 'host-1747669860022', locationId: 'rt-dynamic-table1', type: 'Table', clientName: 'Test Diner', dateArrivee: '2024-08-03', nombrePersonnes: 2, status: 'confirmed', notes: 'Table reservation for dynamic host.', prixTotal: 20, onlineCheckinStatus: 'not-started', pointsGagnes: 3 },
];


// --- User Management (In-memory) ---
const normalizeUserPassword = (user: any): User => {
  const userData = { ...user };
  if (!userData.motDePasse && userData.password) {
    userData.motDePasse = userData.password;
  } else if (!userData.motDePasse) {
    userData.motDePasse = ""; 
  }
  delete userData.password; 
  if (!userData.nom && userData.email) { 
      userData.nom = userData.email.split('@')[0];
  }
  return userData as User;
};

export const getUserByEmail = async (email: string): Promise<User | undefined> => {
  log(`getUserByEmail called for: ${email} (in-memory)`);
  try {
    const user = usersInMemory.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      let userData = { ...user };
      if (!userData.motDePasse && (user as any).password) {
        userData.motDePasse = (user as any).password;
      } else if (!userData.motDePasse) {
        userData.motDePasse = ""; 
      }
      delete (userData as any).password; 

      if (!userData.nom) { 
        userData.nom = userData.email.split('@')[0];
      }
      return userData as User;
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
    return undefined;
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
        throw new Error("Password cannot be empty for a new user.");
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
    return [...hostsInMemory].sort((a, b) => a.nom.localeCompare(b.nom));
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

export const addHost = async (hostData: Omit<Host, 'hostId' | 'loyaltySettings'> & { loyaltySettings?: Partial<LoyaltySettings> }): Promise<Host> => {
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

    const defaultReservationSettings: ReservationPageSettings = {
      enableRoomReservations: true,
      enableTableReservations: true,
      heroImageUrl: `https://placehold.co/1200x400.png?text=${encodeURIComponent(hostData.nom)}+Banner`,
      heroImageAiHint: hostData.nom.toLowerCase().split(' ').slice(0,2).join(' ') || 'establishment banner',
    };
    
    const newHost: Host = {
      hostId: `host-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...hostData,
      reservationPageSettings: hostData.reservationPageSettings || defaultReservationSettings,
      loyaltySettings: { ...defaultLoyaltySettings, ...(hostData.loyaltySettings || {}) },
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
      const updatedSettings = {
        ...(originalHostData.reservationPageSettings || { enableRoomReservations: true, enableTableReservations: true }), 
        ...(hostData.reservationPageSettings || {}),
      };
      const updatedLoyaltySettings = {
        ...(originalHostData.loyaltySettings || defaultLoyaltySettings),
        ...(hostData.loyaltySettings || {}),
      };

      hostsInMemory[hostIndex] = { ...originalHostData, ...hostData, reservationPageSettings: updatedSettings, loyaltySettings: updatedLoyaltySettings };
      log(`Host ${hostId} updated (in-memory).`);

      const updatedHost = hostsInMemory[hostIndex];
      if ((hostData.email && hostData.email !== originalHostData.email) || (hostData.nom && hostData.nom !== originalHostData.nom)) {
          let userToUpdate = usersInMemory.find(u => u.hostId === hostId);
          if (!userToUpdate) userToUpdate = usersInMemory.find(u => u.email.toLowerCase() === originalHostData.email.toLowerCase() && u.role === 'host');
          if (userToUpdate) {
              await updateUser(userToUpdate.id, { email: updatedHost.email, nom: updatedHost.nom, });
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
      logoAiHint: siteData.logoUrl && siteData.nom ? siteData.nom.toLowerCase().split(' ').slice(0,2).join(' ') : undefined,
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
          parentLocationId: data.hasOwnProperty('parentLocationId') ? data.parentLocationId : currentItem.parentLocationId, 
          capacity: data.capacity !== undefined ? data.capacity : currentItem.capacity,
          tagIds: data.tagIds !== undefined ? data.tagIds : currentItem.tagIds,
          description: data.description !== undefined ? data.description : currentItem.description,
          imageUrls: data.imageUrls !== undefined ? data.imageUrls : currentItem.imageUrls,
          imageAiHint: data.imageUrls && data.imageUrls.length > 0 && data.nom ? data.nom.toLowerCase().split(' ').slice(0,2).join(' ') : (data.nom ? data.nom.toLowerCase().split(' ').slice(0,2).join(' ') : currentItem.imageAiHint),
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
              log(`Warning: Deleting location ${id} which has ${linkedReservations.length} associated reservations. These reservations will also be removed for in-memory data.`);
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

export const addOrder = async (data: Omit<Order, 'id' | 'dateHeure' | 'status' | 'montantPaye' | 'soldeDu' | 'paiements' | 'pointsGagnes'>): Promise<Order> => {
  log(`addOrder called. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  try {
    const serviceDetails = await getServiceById(data.serviceId);
    const newOrder: Order = {
      ...data,
      id: `order-${Date.now()}`,
      dateHeure: new Date().toISOString(),
      status: 'pending',
      prixTotal: serviceDetails?.prix, 
      montantPaye: 0,
      soldeDu: serviceDetails?.prix || 0,
      paiements: [],
      userId: data.userId, 
      pointsGagnes: 0,
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
                  const clientRecord = clientsInMemory.find(c => (order.userId && c.email === usersInMemory.find(u => u.id === order.userId)?.email) || (order.clientNom && c.nom === order.clientNom) && c.hostId === order.hostId);
                  if (clientRecord) {
                     await addPointsToClient(clientRecord.id, pointsEarned, order.hostId);
                     order.pointsGagnes = pointsEarned;
                     log(`Awarded ${pointsEarned} loyalty points to client ${clientRecord.nom} for order ${order.id}`);
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

export const getClientRecordsByEmail = async (email: string): Promise<Client[]> => {
  log(`getClientRecordsByEmail called for email: ${email}. Using in-memory data.`);
  try {
    return [...clientsInMemory].filter(c => c.email?.toLowerCase() === email.toLowerCase())
                  .sort((a,b) => a.nom.localeCompare(b.nom)); 
  } catch (e) {
    console.error("Error in getClientRecordsByEmail (in-memory):", e);
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
        pointsFidelite: initialPoints 
    };
    clientsInMemory.push(newClient);
    log(`Client ${newClient.nom} added with ${initialPoints} signup loyalty points.`);
    return newClient;
  } catch (e) {
    console.error("Error in addClientData (in-memory):", e);
    throw e;
  }
};

export const updateClientData = async (clientId: string, clientData: Partial<Omit<Client, 'id' | 'hostId' | 'documents' | 'credit' | 'pointsFidelite'>>): Promise<Client | undefined> => {
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
          return { ...r, clientId: undefined };
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
      hostReservations = hostReservations.filter(r => {
        try {
          const arrivalDate = new Date(r.dateArrivee + "T00:00:00Z"); 
          const departureDateForRoom = r.dateDepart ? new Date(r.dateDepart + "T00:00:00Z") : null; 
          const effectiveDeparture = r.type === 'Table' || !departureDateForRoom ? new Date(r.dateArrivee + "T23:59:59Z") : departureDateForRoom;
          if (!effectiveDeparture) return false; 
          const monthStart = new Date(Date.UTC(filters.year!, filters.month!, 1));
          const monthEnd = new Date(Date.UTC(filters.year!, filters.month! + 1, 0, 23, 59, 59, 999)); 
          return (arrivalDate <= monthEnd && effectiveDeparture >= monthStart);
        } catch (e) {
          log("Error parsing date for reservation filtering by month/year", { reservationId: r.id, error: e });
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
                log("Error parsing date for reservation range filtering", { reservationId: r.id, error: e });
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

export const addReservationToData = async (data: Omit<Reservation, 'id' | 'prixTotal' | 'montantPaye' | 'soldeDu' | 'paiements' | 'pointsGagnes' | 'onlineCheckinStatus' | 'onlineCheckinData'>): Promise<Reservation> => {
  log(`addReservationToData called. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  try {
    const location = await getRoomOrTableById(data.locationId);
    let prixTotalReservation: number | undefined = undefined;
    if (location?.type === 'Chambre' && location.prixParNuit && data.dateDepart) {
        const arrival = new Date(data.dateArrivee);
        const departure = new Date(data.dateDepart);
        const nights = Math.max(1, Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 3600 * 24)));
        prixTotalReservation = nights * location.prixParNuit;
    } else if (location?.type === 'Table' && location.prixFixeReservation) {
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
    };
    reservationsInMemory.push(newReservation);
    return newReservation;
  } catch (e) {
    console.error("Error in addReservationToData (in-memory):", e);
    throw e;
  }
};

export const updateReservationInData = async (id: string, data: Partial<Omit<Reservation, 'id' | 'hostId' | 'prixTotal' | 'montantPaye' | 'soldeDu' | 'paiements' | 'pointsGagnes'>>): Promise<Reservation | undefined> => {
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
        if (currentType === 'Chambre' && location?.prixParNuit && departureDate) {
            const arrival = new Date(arrivalDate);
            const departure = new Date(departureDate);
            const nights = Math.max(1, Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 3600 * 24)));
            prixTotalReservation = nights * location.prixParNuit;
        } else if (currentType === 'Table' && location?.prixFixeReservation) {
            prixTotalReservation = location.prixFixeReservation;
        }
      }
      const updatedReservation = {
        ...existingReservation,
        ...data,
        type: location?.type || existingReservation.type, 
        prixTotal: prixTotalReservation,
        soldeDu: prixTotalReservation !== undefined ? prixTotalReservation - (existingReservation.montantPaye || 0) : existingReservation.soldeDu,
      };
      
      if (updatedReservation.status === 'checked-out') {
        const host = await getHostById(updatedReservation.hostId);
        if (host?.loyaltySettings?.enabled) {
          let pointsEarned = 0;
          if (updatedReservation.type === 'Chambre' && updatedReservation.dateDepart && host.loyaltySettings.pointsPerNightRoom > 0) {
            const arrival = new Date(updatedReservation.dateArrivee);
            const departure = new Date(updatedReservation.dateDepart);
            const nights = Math.max(1, Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 3600 * 24)));
            pointsEarned += nights * host.loyaltySettings.pointsPerNightRoom;
          } else if (updatedReservation.type === 'Table' && host.loyaltySettings.pointsPerTableBooking > 0) {
            pointsEarned += host.loyaltySettings.pointsPerTableBooking;
          }
          if (updatedReservation.prixTotal && host.loyaltySettings.pointsPerEuroSpent > 0) {
             pointsEarned += Math.floor(updatedReservation.prixTotal * host.loyaltySettings.pointsPerEuroSpent);
          }

          if (pointsEarned > 0) {
             if (updatedReservation.clientId) {
                await addPointsToClient(updatedReservation.clientId, pointsEarned, updatedReservation.hostId);
                updatedReservation.pointsGagnes = (updatedReservation.pointsGagnes || 0) + pointsEarned;
                log(`Awarded ${pointsEarned} loyalty points to client ID ${updatedReservation.clientId} for reservation ${id}`);
             } else {
                const clientFromRecord = clientsInMemory.find(c => c.nom === updatedReservation.clientName && c.hostId === updatedReservation.hostId);
                if (clientFromRecord) {
                    await addPointsToClient(clientFromRecord.id, pointsEarned, updatedReservation.hostId);
                    updatedReservation.pointsGagnes = (updatedReservation.pointsGagnes || 0) + pointsEarned;
                    log(`Awarded ${pointsEarned} loyalty points to client ${updatedReservation.clientName} (matched by name) for reservation ${id}`);
                }
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

log("Initial in-memory data loaded/defined.");
log(`Users: ${usersInMemory.length}, Hosts: ${hostsInMemory.length}, Global Sites: ${sitesInMemory.length}, Locations: ${roomsOrTablesInMemory.length}`);
log(`Categories: ${serviceCategoriesInMemory.length}, Forms: ${customFormsInMemory.length}, Fields: ${formFieldsInMemory.length}, Services: ${servicesInMemory.length}`);
log(`Orders: ${ordersInMemory.length}, Clients: ${clientsInMemory.length}, Reservations: ${reservationsInMemory.length}, Tags: ${tagsInMemory.length}`);

    