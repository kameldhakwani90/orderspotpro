
export type UserRole = "admin" | "host" | "client";

export interface User {
  id: string; // Using 'id' as a generic identifier, email can be separate if needed for login
  email: string; // Clé
  nom: string;
  role: UserRole;
  hostId?: string; // Identifiant de l’établissement (vide pour admin)
  motDePasse: string; // For MVP, plain text
}

export interface Site {
  siteId: string; // Clé
  nom: string;
  siteParentId?: string; // Référence à un autre site
  hostId: string; // Link to host managing this site
}

export interface Host {
  hostId: string; // Clé
  nom: string;
  email: string; // Should be unique, can be same as User.email
  // SiteID is managed through User.hostId implicitly, or explicit Sites table link
}

export interface RoomOrTable {
  id: string; // Clé
  nom: string;
  type: "Chambre" | "Table";
  hostId: string; // Référence
  siteId: string; // Référence
  urlPersonnalise: string; // Généré automatiquement
}

export interface ServiceCategory {
  id: string; // Clé
  nom: string;
  hostId: string; // Référence
}

export interface CustomForm {
  id: string; // Clé
  nom: string;
  hostId: string;
}

export type FormFieldType = "text" | "number" | "date" | "time" | "textarea" | "email" | "tel";

export interface FormField {
  id: string; // Clé
  formulaireId: string; // Référence
  label: string; // ex: “Nombre de personnes”
  type: FormFieldType;
  obligatoire: boolean; // Oui / Non
  ordre: number; // Ordre d’affichage
  placeholder?: string;
  options?: string[]; // For select/radio type in future
}

export interface Service {
  id: string; // Clé
  titre: string;
  description: string;
  image?: string; // URL - Optional
  categorieId: string; // Référence
  hostId: string; // Référence
  formulaireId: string; // Référence
  prix?: number; // Facultatif
}

export interface Order {
  id: string; // Clé auto
  serviceId: string; // Référence
  hostId: string;
  chambreTableId: string; // Référence
  clientNom?: string; // Optional for client
  donneesFormulaire: string; // Format texte ou JSON
  dateHeure: string; // ISO Date string
  status: "pending" | "confirmed" | "completed" | "cancelled";
}

// Helper type for navigation items
export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  allowedRoles: UserRole[];
  children?: NavItem[];
  isChidren?: boolean; // To identify sub-menu items for styling if needed
  external?: boolean; // For QR code links
}
