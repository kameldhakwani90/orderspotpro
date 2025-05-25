// src/lib/types.ts

export type UserRole = "admin" | "host" | "client";

export interface User {
  id: string;
  email: string;
  nom: string;
  role: UserRole;
  hostId?: string;
  motDePasse: string;
}

export interface ReservationPageSettings {
  heroImageUrl?: string;
  heroImageAiHint?: string;
  enableRoomReservations: boolean;
  enableTableReservations: boolean;
}

export interface LoyaltySettings {
  enabled: boolean;
  pointsPerEuroSpent: number;
  pointsPerNightRoom: number;
  pointsPerTableBooking: number;
  pointsForNewClientSignup?: number;
}

export interface Host {
  hostId: string;
  nom: string;
  email: string;
  reservationPageSettings?: ReservationPageSettings;
  loyaltySettings?: LoyaltySettings;
}

export interface Site { // Represents a Global Site
  siteId: string;
  nom: string;
  hostId: string;
  logoUrl?: string;
  logoAiHint?: string;
  primaryColor?: string; // HEX string
}

export interface Tag {
  id: string;
  name: string;
  hostId: string;
}

export interface AmenityOption {
  id: string;
  label: string;
  icon: React.ElementType;
}

export interface AmenityCategory {
  categoryLabel: string;
  options: AmenityOption[];
}

export interface RoomOrTable {
  id: string;
  nom: string;
  type: "Chambre" | "Table" | "Site";
  hostId: string;
  globalSiteId: string;
  parentLocationId?: string;
  urlPersonnalise: string;
  capacity?: number;
  description?: string;
  imageUrls?: string[];
  imageAiHint?: string;
  tagIds?: string[];
  amenityIds?: string[];
  prixParNuit?: number;
  prixFixeReservation?: number;
}

export interface ServiceCategory {
  id: string;
  nom: string;
  hostId: string;
  image?: string;
  "data-ai-hint"?: string;
}

export interface CustomForm {
  id: string;
  nom: string;
  hostId: string;
}

export type FormFieldTypeOption = "text" | "number" | "date" | "time" | "textarea" | "email" | "tel";

export interface FormField {
  id: string;
  formulaireId: string;
  label: string;
  type: FormFieldTypeOption;
  obligatoire: boolean;
  ordre: number;
  placeholder?: string;
  options?: string[];
}

export interface Service {
  id: string;
  titre: string;
  description: string;
  image?: string;
  "data-ai-hint"?: string;
  categorieId: string;
  hostId: string;
  formulaireId?: string;
  prix?: number;
  targetLocationIds?: string[];
  loginRequired?: boolean;
  pointsRequis?: number;
}

export type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Paiement {
  type: 'credit' | 'cash' | 'card' | 'points';
  montant: number;
  date: string; // ISO string
  notes?: string;
}

export interface Order {
  id: string;
  serviceId: string;
  hostId: string;
  chambreTableId: string;
  clientNom?: string;
  userId?: string;
  donneesFormulaire: string;
  dateHeure: string; // ISO string
  status: OrderStatus;
  prixTotal?: number;
  montantPaye?: number;
  soldeDu?: number;
  paiements?: Paiement[];
  pointsGagnes?: number;
}

export type ClientType = "heberge" | "passager";

export interface Client {
    id: string;
    hostId: string;
    nom: string;
    email?: string;
    telephone?: string;
    type: ClientType;
    dateArrivee?: string; // YYYY-MM-DD
    dateDepart?: string;  // YYYY-MM-DD
    locationId?: string;
    notes?: string;
    documents?: Array<{ name: string; url: string; uploadedAt: string }>;
    credit?: number;
    pointsFidelite?: number;
    userId?: string;
}

export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "checked-in" | "checked-out";
export type OnlineCheckinStatus = 'not-started' | 'pending-review' | 'completed';

export interface OnlineCheckinData {
  fullName?: string;
  email?: string;
  birthDate?: string;
  phoneNumber?: string;
  travelReason?: string;
  additionalNotes?: string;
  submissionDate?: string; // ISO DateTime
}

export interface Reservation {
  id: string;
  hostId: string;
  locationId: string;
  type?: 'Chambre' | 'Table';
  clientId?: string; // Corresponds to User.id if the client is a registered user
  clientName: string; // Name used for the reservation (can be guest name or registered user's name)
  dateArrivee: string; // YYYY-MM-DD
  dateDepart?: string; // YYYY-MM-DD, optional for tables
  nombrePersonnes: number;
  animauxDomestiques?: boolean;
  notes?: string;
  status?: ReservationStatus;
  channel?: string;
  prixTotal?: number;
  montantPaye?: number;
  soldeDu?: number;
  paiements?: Paiement[];
  pointsGagnes?: number;
  onlineCheckinData?: OnlineCheckinData;
  onlineCheckinStatus?: OnlineCheckinStatus;
  clientInitiatedCheckoutTime?: string; // ISO string
  checkoutNotes?: string;
}

export interface EnrichedReservation extends Reservation {
  hostName?: string;
  locationName?: string;
  locationType?: 'Chambre' | 'Table' | 'Site';
}


export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  allowedRoles: UserRole[];
  children?: NavItem[];
  isChidren?: boolean;
  external?: boolean;
}

export interface ClientDetails { // For host-side client file page
  name: string;
  orders: (Order & { serviceName?: string; locationName?: string })[];
  // This might be replaced by distinct Client records
  locations: (RoomOrTable & { globalSiteName?: string })[];
}

// Types for Chat Functionality (Placeholders for now)
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string; // 'user-client-id' or 'user-host-id' or 'system'
  receiverId: string; // 'user-host-id' or 'user-client-id'
  text: string;
  timestamp: string; // ISO DateTime string
  read?: boolean;
}

export interface ChatConversation {
  id: string; // Could be a composite key like 'client-id_host-id' or 'client-id_globalSite-id'
  participantIds: string[]; // [clientId, hostUserId or globalSiteId]
  lastMessage?: Pick<ChatMessage, 'text' | 'timestamp' | 'senderId'>;
  unreadCounts?: { [userId: string]: number }; // e.g., { 'host-id': 2 }
  clientName?: string;
  hostName?: string; // or Establishment Name
  clientAvatar?: string;
  hostAvatar?: string;
}
