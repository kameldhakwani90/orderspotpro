
import type { User, Site, Host, RoomOrTable, ServiceCategory, CustomForm, FormField, Service, Order, UserRole } from './types';

let users: User[] = [
  { id: 'user-admin-01', email: 'kamel@gmail.com', nom: 'Kamel Admin', role: 'admin', motDePasse: '0000' },
  { id: 'user-host-01', email: 'host1@example.com', nom: 'Hotel Paradise', role: 'host', hostId: 'host-01', motDePasse: '1234' },
  { id: 'user-host-02', email: 'host2@example.com', nom: 'Restaurant Delice', role: 'host', hostId: 'host-02', motDePasse: '1234' },
  { id: 'user-client-01', email: 'client1@example.com', nom: 'Client Test', role: 'client', motDePasse: '1234' },
];

let sites: Site[] = [
  { siteId: 'site-01', nom: 'Paradise Beach Resort', hostId: 'host-01' },
  { siteId: 'site-02', nom: 'Delice Downtown', hostId: 'host-02' },
];

let hosts: Host[] = [ // Simplified, User table holds primary host info
  { hostId: 'host-01', nom: 'Hotel Paradise Management', email: 'host1@example.com' },
  { hostId: 'host-02', nom: 'Restaurant Delice Group', email: 'host2@example.com' },
];

let roomsOrTables: RoomOrTable[] = [
  { id: 'room-101', nom: 'Chambre 101', type: 'Chambre', hostId: 'host-01', siteId: 'site-01', urlPersonnalise: `/client/host-01/room-101` },
  { id: 'table-5', nom: 'Table 5', type: 'Table', hostId: 'host-02', siteId: 'site-02', urlPersonnalise: `/client/host-02/table-5` },
];

let serviceCategories: ServiceCategory[] = [
  { id: 'cat-roomservice', nom: 'Room Service', hostId: 'host-01' },
  { id: 'cat-transport', nom: 'Transport', hostId: 'host-01' },
  { id: 'cat-food', nom: 'Food Menu', hostId: 'host-02' },
  { id: 'cat-drinks', nom: 'Beverages', hostId: 'host-02' },
];

let customForms: CustomForm[] = [
  { id: 'form-booking', nom: 'Booking Request', hostId: 'host-01' },
  { id: 'form-foodorder', nom: 'Food Order Details', hostId: 'host-02' },
  { id: 'form-generic-info', nom: 'General Inquiry', hostId: 'host-01' },
];

let formFields: FormField[] = [
  { id: 'field-persons', formulaireId: 'form-booking', label: 'Nombre de personnes', type: 'number', obligatoire: true, ordre: 1, placeholder: 'e.g., 2' },
  { id: 'field-date', formulaireId: 'form-booking', label: 'Date souhaitée', type: 'date', obligatoire: true, ordre: 2 },
  { id: 'field-time', formulaireId: 'form-booking', label: 'Heure souhaitée', type: 'time', obligatoire: false, ordre: 3 },
  { id: 'field-dish', formulaireId: 'form-foodorder', label: 'Plat principal', type: 'text', obligatoire: true, ordre: 1, placeholder: 'e.g., Pizza Margherita' },
  { id: 'field-notes', formulaireId: 'form-foodorder', label: 'Notes additionnelles', type: 'textarea', obligatoire: false, ordre: 2, placeholder: 'e.g., Sans oignons' },
  { id: 'field-name-generic', formulaireId: 'form-generic-info', label: 'Your Name', type: 'text', obligatoire: true, ordre: 1, placeholder: 'John Doe' },
  { id: 'field-email-generic', formulaireId: 'form-generic-info', label: 'Your Email', type: 'email', obligatoire: true, ordre: 2, placeholder: 'john.doe@example.com' },
  { id: 'field-message-generic', formulaireId: 'form-generic-info', label: 'Your Message', type: 'textarea', obligatoire: true, ordre: 3, placeholder: 'Type your message here...' },
];

let services: Service[] = [
  { id: 'svc-taxi', titre: 'Airport Taxi', description: 'Book a taxi to or from the airport.', image: 'https://placehold.co/600x400.png', categorieId: 'cat-transport', hostId: 'host-01', formulaireId: 'form-booking', prix: 50 },
  { id: 'svc-breakfast', titre: 'Breakfast in Room', description: 'Order your breakfast to be delivered to your room.', image: 'https://placehold.co/600x400.png', categorieId: 'cat-roomservice', hostId: 'host-01', formulaireId: 'form-foodorder', prix: 25 },
  { id: 'svc-pizza', titre: 'Pizza Special', description: 'Delicious stone-baked pizza.', image: 'https://placehold.co/600x400.png', categorieId: 'cat-food', hostId: 'host-02', formulaireId: 'form-foodorder', prix: 15 },
  { id: 'svc-cocktail', titre: 'Signature Cocktail', description: 'Try our special house cocktail.', image: 'https://placehold.co/600x400.png', categorieId: 'cat-drinks', hostId: 'host-02', formulaireId: 'form-generic-info' },
];

let orders: Order[] = [
  { id: 'order-001', serviceId: 'svc-taxi', hostId: 'host-01', chambreTableId: 'room-101', clientNom: 'Jane Doe', donneesFormulaire: JSON.stringify({ persons: 2, date: '2024-08-15', time: '10:00' }), dateHeure: new Date().toISOString(), status: 'pending' },
];

// --- User Management ---
export const getUserByEmail = async (email: string): Promise<User | undefined> => {
  return users.find(u => u.email === email);
};
export const getUserById = async (id: string): Promise<User | undefined> => {
  return users.find(u => u.id === id);
};
export const getUsers = async (): Promise<User[]> => users;

export const addUser = async (user: Omit<User, 'id' | 'motDePasse'> & { motDePasse: string }): Promise<User> => {
  const newUser: User = { ...user, id: `user-${Date.now()}` };
  users.push(newUser);
  return newUser;
};

// --- Host Management ---
export const getHosts = async (): Promise<Host[]> => hosts;
export const getHostById = async (hostId: string): Promise<Host | undefined> => {
  return hosts.find(h => h.hostId === hostId);
};
export const addHost = async (hostData: Omit<Host, 'hostId'>): Promise<Host> => {
  const newHost: Host = { ...hostData, hostId: `host-${Date.now()}` };
  hosts.push(newHost);
  // Also create a user for this host
  const hostUser: User = {
    id: `user-${newHost.hostId}`,
    email: newHost.email,
    nom: newHost.nom,
    role: 'host',
    hostId: newHost.hostId,
    motDePasse: '1234' // Default password
  };
  users.push(hostUser);
  return newHost;
};

// --- Site Management ---
export const getSites = async (hostId?: string): Promise<Site[]> => {
  if (hostId) return sites.filter(s => s.hostId === hostId);
  return sites;
};
export const addSite = async (siteData: Omit<Site, 'siteId'>): Promise<Site> => {
  const newSite: Site = { ...siteData, siteId: `site-${Date.now()}` };
  sites.push(newSite);
  return newSite;
};

// --- RoomOrTable Management ---
export const getRoomsOrTables = async (hostId: string): Promise<RoomOrTable[]> => {
  return roomsOrTables.filter(rt => rt.hostId === hostId);
};
export const addRoomOrTable = async (data: Omit<RoomOrTable, 'id' | 'urlPersonnalise'>): Promise<RoomOrTable> => {
  const newId = `${data.type.toLowerCase()}-${Date.now()}`;
  const newRoomOrTable: RoomOrTable = {
    ...data,
    id: newId,
    urlPersonnalise: `/client/${data.hostId}/${newId}`,
  };
  roomsOrTables.push(newRoomOrTable);
  return newRoomOrTable;
};
export const getRoomOrTableById = async (id: string): Promise<RoomOrTable | undefined> => {
    return roomsOrTables.find(rt => rt.id === id);
};

// --- ServiceCategory Management ---
export const getServiceCategories = async (hostId: string): Promise<ServiceCategory[]> => {
  return serviceCategories.filter(sc => sc.hostId === hostId);
};
export const addServiceCategory = async (data: Omit<ServiceCategory, 'id'>): Promise<ServiceCategory> => {
  const newCategory: ServiceCategory = { ...data, id: `cat-${Date.now()}` };
  serviceCategories.push(newCategory);
  return newCategory;
};

// --- CustomForm Management ---
export const getCustomForms = async (hostId: string): Promise<CustomForm[]> => {
  return customForms.filter(cf => cf.hostId === hostId);
};
export const addCustomForm = async (data: Omit<CustomForm, 'id'>): Promise<CustomForm> => {
  const newForm: CustomForm = { ...data, id: `form-${Date.now()}` };
  customForms.push(newForm);
  return newForm;
};
export const getFormById = async (formId: string): Promise<CustomForm | undefined> => {
  return customForms.find(f => f.id === formId);
};

// --- FormField Management ---
export const getFormFields = async (formulaireId: string): Promise<FormField[]> => {
  return formFields.filter(ff => ff.formulaireId === formulaireId).sort((a, b) => a.ordre - b.ordre);
};
export const addFormField = async (data: Omit<FormField, 'id'>): Promise<FormField> => {
  const newField: FormField = { ...data, id: `field-${Date.now()}` };
  formFields.push(newField);
  return newField;
};

// --- Service Management ---
export const getServices = async (hostId: string, categoryId?: string): Promise<Service[]> => {
  let filteredServices = services.filter(s => s.hostId === hostId);
  if (categoryId) {
    filteredServices = filteredServices.filter(s => s.categorieId === categoryId);
  }
  return filteredServices;
};
export const getServiceById = async (serviceId: string): Promise<Service | undefined> => {
  return services.find(s => s.id === serviceId);
};
export const addService = async (data: Omit<Service, 'id'>): Promise<Service> => {
  const newService: Service = { ...data, id: `svc-${Date.now()}` };
  services.push(newService);
  return newService;
};

// --- Order Management ---
export const getOrders = async (hostId: string): Promise<Order[]> => {
  return orders.filter(o => o.hostId === hostId).sort((a,b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime());
};
export const addOrder = async (data: Omit<Order, 'id' | 'dateHeure' | 'status'>): Promise<Order> => {
  const newOrder: Order = {
    ...data,
    id: `order-${Date.now()}`,
    dateHeure: new Date().toISOString(),
    status: 'pending',
  };
  orders.push(newOrder);
  return newOrder;
};
export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<Order | undefined> => {
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex > -1) {
    orders[orderIndex].status = status;
    return orders[orderIndex];
  }
  return undefined;
};

// Initial data assignment for images
services.forEach(service => {
  if (service.titre.toLowerCase().includes('taxi')) {
    service.image = 'https://placehold.co/600x400.png?text=Taxi+Service';
    (service as any)['data-ai-hint'] = 'taxi transportation';
  } else if (service.titre.toLowerCase().includes('breakfast')) {
    service.image = 'https://placehold.co/600x400.png?text=Breakfast';
    (service as any)['data-ai-hint'] = 'breakfast food';
  } else if (service.titre.toLowerCase().includes('pizza')) {
    service.image = 'https://placehold.co/600x400.png?text=Pizza';
    (service as any)['data-ai-hint'] = 'pizza food';
  } else if (service.titre.toLowerCase().includes('cocktail')) {
    service.image = 'https://placehold.co/600x400.png?text=Cocktail';
    (service as any)['data-ai-hint'] = 'cocktail drink';
  } else {
    service.image = 'https://placehold.co/600x400.png?text=Service';
     (service as any)['data-ai-hint'] = 'general service';
  }
});

