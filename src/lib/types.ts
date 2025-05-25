
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

export interface Host {
  hostId: string;
  nom: string;
  email: string;
  reservationPageSettings?: ReservationPageSettings;
  loyaltySettings?: LoyaltySettings;
}

export interface LoyaltySettings {
  enabled: boolean;
  pointsPerEuroSpent: number;
  pointsPerNightRoom: number;
  pointsPerTableBooking: number;
}

export interface Site { // Represents a Global Site
  siteId: string;
  nom: string;
  hostId: string; // FK to Host.hostId
  logoUrl?: string;
  logoAiHint?: string;
  primaryColor?: string; // HEX string, e.g., "#FF5733"
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
  type: "Chambre" | "Table" | "Site"; // 'Site' here means a sub-area/zone within a Global Site
  hostId: string;
  globalSiteId: string; // FK to Site.siteId (the overarching Global Site)
  parentLocationId?: string; // FK to another RoomOrTable.id (if this location is nested)
  urlPersonnalise: string;
  capacity?: number; // Max number of persons
  description?: string;
  imageUrls?: string[];
  imageAiHint?: string;
  tagIds?: string[];
  amenityIds?: string[];
  prixParNuit?: number; // For rooms
  prixFixeReservation?: number; // For tables
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
  userId?: string; // ID of the registered user, if logged in
  donneesFormulaire: string;
  dateHeure: string; // ISO string
  status: OrderStatus;
  prixTotal?: number; // Original price of the order
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
    credit?: number; // Client's available credit balance
    pointsFidelite?: number;
}

export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "checked-in" | "checked-out";
export type OnlineCheckinStatus = 'not-started' | 'pending-review' | 'completed';

export interface OnlineCheckinData {
  fullName?: string;
  email?: string;
  birthDate?: string; // Format YYYY-MM-DD
  phoneNumber?: string;
  travelReason?: string;
  additionalNotes?: string;
  // passportPhotoUris?: string[]; // For future use
  // digitalSignatureUri?: string; // For future use
  submissionDate?: string; // ISO DateTime
}

export interface Reservation {
  id: string;
  hostId: string;
  locationId: string;
  type?: 'Chambre' | 'Table';
  clientId?: string;
  clientName: string;
  dateArrivee: string; // YYYY-MM-DD
  dateDepart?: string; // YYYY-MM-DD, optional for tables
  nombrePersonnes: number;
  animauxDomestiques?: boolean; // Only relevant for Chambre type
  notes?: string;
  status?: ReservationStatus;
  channel?: string;
  prixTotal?: number; // Original price of the reservation
  montantPaye?: number;
  soldeDu?: number;
  paiements?: Paiement[];
  pointsGagnes?: number;
  onlineCheckinData?: OnlineCheckinData;
  onlineCheckinStatus?: OnlineCheckinStatus;
}

// Helper type for navigation items
export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  allowedRoles: UserRole[];
  children?: NavItem[];
  isChidren?: boolean;
  external?: boolean;
}

export interface ClientDetails { // Used for client file page
  name: string;
  orders: (Order & { serviceName?: string; locationName?: string })[];
  locations: (RoomOrTable & { globalSiteName?: string })[];
}
