
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
}

export interface Site { // Represents a Global Site
  siteId: string;
  nom: string;
  hostId: string; // FK to Host.hostId
  logoUrl?: string;
  logoAiHint?: string;
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

export interface Order {
  id: string;
  serviceId: string;
  hostId: string;
  chambreTableId: string;
  clientNom?: string;
  userId?: string; // Optional: ID of the registered user if they were logged in
  donneesFormulaire: string;
  dateHeure: string;
  status: OrderStatus;
  prix?: number;
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

export interface ClientDetails {
  name: string;
  orders: (Order & { serviceName?: string; locationName?: string })[];
  locations: (RoomOrTable & { globalSiteName?: string })[];
}

export type ClientType = "heberge" | "passager";

export interface Client {
    id: string;
    hostId: string;
    nom: string;
    email?: string;
    telephone?: string;
    type: ClientType;
    dateArrivee?: string;
    dateDepart?: string;
    locationId?: string;
    notes?: string;
    documents?: Array<{ name: string; url: string; uploadedAt: string }>;
    credit?: number;
}

export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "checked-in" | "checked-out";

export interface Reservation {
  id: string;
  hostId: string;
  locationId: string;
  type?: 'Chambre' | 'Table';
  clientId?: string;
  clientName: string;
  dateArrivee: string;
  dateDepart?: string; // Optionnel, surtout pour les tables
  nombrePersonnes: number;
  animauxDomestiques?: boolean; // Optionnel, plus pertinent pour les chambres
  notes?: string;
  status?: ReservationStatus;
  channel?: string; // Pour le canal d'acquisition
}
