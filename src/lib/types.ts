
export type UserRole = "admin" | "host" | "client";

export interface User {
  id: string;
  email: string;
  nom: string;
  role: UserRole;
  hostId?: string;
  motDePasse: string;
}

export interface Site { // Represents a Global Site
  siteId: string;
  nom: string;
  hostId: string;
}

export interface Host {
  hostId: string;
  nom: string;
  email: string;
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
  formulaireId?: string; // Optional: A service might not need a form
  prix?: number;
  targetLocationIds?: string[];
  loginRequired?: boolean; // True if login is needed to order
}

export type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Order {
  id: string;
  serviceId: string;
  hostId: string;
  chambreTableId: string; // This is the RoomOrTable ID where the order was placed
  clientNom?: string; // Name of the client (could be from registered user or typed manually)
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

// For Client File Page (/host/clients/[clientName]/page.tsx)
export interface ClientDetails {
  name: string;
  orders: (Order & { serviceName?: string; locationName?: string })[];
  locations: (RoomOrTable & { globalSiteName?: string })[];
}

export type ClientType = "heberge" | "passager"; // For Host's client management

export interface Client { // For Host's client management records
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
  locationId: string; // FK to RoomOrTable.id (can be Chambre or Table)
  clientId?: string;   // Optional: FK to Client.id if client is registered
  clientName: string; // Name of the person making the reservation
  dateArrivee: string; // ISO date string e.g. "2024-12-25"
  dateDepart: string;  // ISO date string e.g. "2024-12-28"
  nombrePersonnes: number;
  animauxDomestiques?: boolean; // Whether pets are included
  notes?: string;
  status?: ReservationStatus;
  // channel?: string; // Future: For acquisition channel
}

