
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
}

export type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Order {
  id: string;
  serviceId: string;
  hostId: string;
  chambreTableId: string;
  clientNom?: string;
  donneesFormulaire: string;
  dateHeure: string;
  status: OrderStatus;
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

// For Client File Page
export interface ClientDetails {
  name: string;
  orders: (Order & { serviceName?: string; locationName?: string })[];
  locations: (RoomOrTable & { globalSiteName?: string })[];
  // Potential future fields:
  // arrivalDate?: string;
  // departureDate?: string;
  // contactEmail?: string;
  // contactPhone?: string;
  // preferences?: string[];
  // totalSpent?: number;
}
