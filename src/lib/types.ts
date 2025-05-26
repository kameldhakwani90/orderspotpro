// src/lib/types.ts
import type { LucideIcon } from 'lucide-react';

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
  currency?: string; // e.g., "USD", "EUR", "TND"
  language?: string; // e.g., "fr", "en", "ar"
}

export interface Site { // Represents a Global Site
  siteId: string;
  nom: string;
  hostId: string;
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
  pricingModel?: 'perRoom' | 'perPerson'; // Added
  prixParNuit?: number; // For rooms: per night (per room or per person based on pricingModel)
  prixFixeReservation?: number; // For tables
  menuCardId?: string; 
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
  currency?: string;
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
  clientId?: string;
  clientName?: string;
  dateArrivee: string; 
  dateDepart?: string | undefined;
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
  clientInitiatedCheckoutTime?: string; 
  checkoutNotes?: string;
  currency?: string;
}

export interface EnrichedReservation extends Reservation {
  hostName?: string;
  locationName?: string;
  locationType?: 'Chambre' | 'Table' | 'Site';
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  allowedRoles: UserRole[];
  children?: NavItem[];
  external?: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string; 
  receiverId: string; 
  text: string;
  timestamp: string; // ISO string
  read?: boolean;
}

export interface ChatConversation {
  id: string; 
  participantIds: string[]; 
  lastMessage?: Pick<ChatMessage, 'text' | 'timestamp' | 'senderId'>;
  unreadCounts?: { [userId: string]: number }; 
  clientName?: string;
  hostName?: string;
  clientAvatar?: string; // URL
  hostAvatar?: string;   // URL
}

export interface MenuCard {
  id: string;
  name: string;
  hostId: string;
  globalSiteId: string; 
  description?: string;
  isActive: boolean; 
  visibleFromTime?: string; 
  visibleToTime?: string;   
}

export interface MenuCategory { 
  id: string;
  name: string;
  menuCardId: string; 
  hostId: string; 
  description?: string;
  displayOrder?: number; 
}

export interface MenuItemOption {
  id: string; 
  name: string; 
  priceAdjustment?: number; 
}

export interface MenuItemOptionGroup {
  id: string; 
  name: string; 
  menuItemId: string; 
  selectionType: 'single' | 'multiple'; 
  isRequired: boolean; 
  options: MenuItemOption[]; 
  displayOrder?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  imageAiHint?: string;
  menuCategoryId: string; 
  hostId: string; 
  isConfigurable?: boolean;
  optionGroups?: MenuItemOptionGroup[];
  isAvailable?: boolean;
  loginRequired?: boolean;
  pointsRequis?: number;
  stock?: number; 
  currency?: string;
}

export type CartItem = (MenuItem) & { // Cart only supports MenuItems for now
  quantity: number;
  uniqueIdInCart: string;
  selectedOptions?: Record<string, string | string[]>; // For configurable items
  finalPrice?: number; // Price after options
};

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: MenuItem, options?: Record<string, string | string[]>, preCalculatedFinalPrice?: number) => void;
  removeFromCart: (uniqueIdInCart: string) => void;
  updateQuantity: (uniqueIdInCart: string, newQuantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getTotalItems: () => number;
}

export type LanguageCode = 'fr' | 'en' | 'ar';
export type TranslationKeys =
  | 'welcomeTo' | 'servicesFor' | 'room' | 'table' | 'backToCategories' | 'noServicesInCategory'
  | 'loginRequired' | 'loginToOrder' | 'orderNow' | 'viewDetails' | 'serviceNotFound' | 'establishmentNotFound'
  | 'locationNotFound' | 'errorLoadingServiceDetails' | 'goBack' | 'loginToContinue' | 'orderFor'
  | 'submitRequest' | 'submitting' | 'orderSuccessTitle' | 'orderSuccessDescription' | 'backToServices'
  | 'cancelAndBackToServices' | 'searchType' | 'arrivalDate' | 'departureDate' | 'guests' | 'filter'
  | 'search' | 'noAvailability' | 'noAvailabilityDescription' | 'availableLocations' | 'selectLocation'
  | 'detailsOfYourSelection' | 'pricePerNight' | 'totalEstimatedPrice' | 'bookNow' | 'confirmReservation'
  | 'bookingInProgress' | 'bookingSuccessTitle' | 'bookingSuccessDescription' | 'anotherSearch'
  | 'errorLoadingLocationDetails' | 'locationDetailsNotFound' | 'whatThisPlaceOffers'
  | 'adults' | 'children' | 'infants' | 'pets' | 'selectLanguage' | 'reserveYourStayAt'
  | 'findYourIdealAccommodation' | 'when' | 'numTravelers' | 'numInfants' | 'numPets' | 'filterByTags'
  | 'login' | 'logout' | 'myAccount' | 'footerText' | 'chatComingSoon' | 'chatFeatureTitle' | 'orderService' | 'serviceDescription'
  | 'servicePrice' | 'additionalInformation' | 'onlineCheckin' | 'welcomeUser' | 'prepareYourArrivalAt'
  | 'forLocation' | 'from' | 'to' | 'persons' | 'startCheckin' | 'yourInformation' | 'checkAndComplete'
  | 'fullName' | 'email' | 'birthDate' | 'phoneNumber' | 'travelReason' | 'additionalNotes'
  | 'exampleHolidayBusiness' | 'exampleAllergiesRequests' | 'identityDocument' | 'idDocPlaceholder'
  | 'digitalSignature' | 'signaturePlaceholder' | 'submitInformation' | 'submittingInProgress'
  | 'checkinSubmittedTitle' | 'checkinSubmittedDescription' | 'youCanClosePage' | 'backToSiteHome'
  | 'errorAccessingReservation' | 'errorLoadingReservationDetails' | 'reservationDetailsNotAvailable'
  | 'checkoutConfirmation' | 'helloUser' | 'aboutToConfirmCheckout' | 'dates' | 'location'
  | 'currentStatus' | 'billingSummaryExample' | 'estimatedTotal' | 'amountPaid' | 'balanceDue'
  | 'pleaseSettleBalance' | 'departureNotesOptional' | 'exampleEverythingPerfect' | 'confirmAndCheckout'
  | 'processingInProgress' | 'checkoutConfirmedTitle' | 'checkoutConfirmedDescription' | 'hopeToSeeYouSoon'
  | 'errorCheckout' | 'errorConfirmingCheckout' | 'reservationAlreadyFinalized'
  | 'reservationCancelledMessage' | 'checkoutProcessedOrCancelled'
  | 'ourMenuCategories' | 'noMenuAvailable' | 'itemsInCategory' | 'noItemsInCategory'
  | 'backToMenuCategories' | 'browseServices' | 'browseOtherServices' | 'backToMainMenu'
  | 'stockStatusOutOfStock' | 'stockStatusLimited' | 'configure' | 'addToCart' | 'viewCart'
  | 'upTo' | 'night' | 'nights' | 'person' | 'reservation' | 'priceNotSpecified' | 'selectDate'
  | 'description' | 'amenitiesAndTags' | 'searchErrorTitle' | 'adultsDescription' | 'childrenDescription' | 'infantsDescription'
  | 'youCan' | 'toSaveReservation' | 'priceFrom';

export type Translations = {
  [key in LanguageCode]: {
    [key in TranslationKeys]?: string;
  };
};

    
