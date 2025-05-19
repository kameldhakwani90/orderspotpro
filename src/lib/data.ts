
import type { User, Site, Host, RoomOrTable, ServiceCategory, CustomForm, FormField, Service, Order, FormFieldTypeOption } from './types';

let users: User[] = [
  { id: 'user-admin-01', email: 'kamel@gmail.com', nom: 'Kamel Admin', role: 'admin', motDePasse: '0000' },
  { id: 'user-host-01', email: 'host1@example.com', nom: 'Hotel Paradise', role: 'host', hostId: 'host-01', motDePasse: '1234' },
  { id: 'user-host-02', email: 'host2@example.com', nom: 'Restaurant Delice', role: 'host', hostId: 'host-02', motDePasse: '1234' },
  { id: 'user-client-01', email: 'client1@example.com', nom: 'Client Test', role: 'client', motDePasse: '1234' },
];

let sites: Site[] = [ // Global Sites
  { siteId: 'site-01', nom: 'Paradise Beach Resort', hostId: 'host-01' },
  { siteId: 'site-02', nom: 'Delice Downtown', hostId: 'host-02' },
];

let hosts: Host[] = [
  { hostId: 'host-01', nom: 'Hotel Paradise', email: 'host1@example.com' },
  { hostId: 'host-02', nom: 'Restaurant Delice', email: 'host2@example.com' },
];

let roomsOrTables: RoomOrTable[] = [
  { id: 'rt-globalsite-root-site-01', nom: 'Paradise Resort Main Area', type: 'Site', hostId: 'host-01', globalSiteId: 'site-01', parentLocationId: undefined, urlPersonnalise: `/client/host-01/rt-globalsite-root-site-01`},
  { id: 'rt-lobby-01', nom: 'Lobby Zone', type: 'Site', hostId: 'host-01', globalSiteId: 'site-01', parentLocationId: 'rt-globalsite-root-site-01', urlPersonnalise: `/client/host-01/rt-lobby-01`},
  { id: 'rt-pool-01', nom: 'Pool Area', type: 'Site', hostId: 'host-01', globalSiteId: 'site-01', parentLocationId: 'rt-globalsite-root-site-01', urlPersonnalise: `/client/host-01/rt-pool-01`},
    { id: 'rt-lobby-reception-01', nom: 'Reception Desk Area', type: 'Site', hostId: 'host-01', globalSiteId: 'site-01', parentLocationId: 'rt-lobby-01', urlPersonnalise: `/client/host-01/rt-lobby-reception-01`},
  { id: 'room-101', nom: 'Chambre 101', type: 'Chambre', hostId: 'host-01', globalSiteId: 'site-01', parentLocationId: 'rt-lobby-01', urlPersonnalise: `/client/host-01/room-101` },
  { id: 'table-5', nom: 'Table 5', type: 'Table', hostId: 'host-02', globalSiteId: 'site-02', parentLocationId: undefined, urlPersonnalise: `/client/host-02/table-5` },
];

let serviceCategories: ServiceCategory[] = [
  { id: 'cat-roomservice', nom: 'Room Service', hostId: 'host-01', image: 'https://placehold.co/300x200.png', "data-ai-hint": "room service" },
  { id: 'cat-transport', nom: 'Transport', hostId: 'host-01', image: 'https://placehold.co/300x200.png', "data-ai-hint": "transportation" },
  { id: 'cat-food', nom: 'Food Menu', hostId: 'host-02', image: 'https://placehold.co/300x200.png', "data-ai-hint": "food menu" },
  { id: 'cat-drinks', nom: 'Beverages', hostId: 'host-02', image: 'https://placehold.co/300x200.png', "data-ai-hint": "drinks beverages" },
];

let customForms: CustomForm[] = [
  { id: 'form-booking', nom: 'Booking Request', hostId: 'host-01' },
  { id: 'form-foodorder', nom: 'Food Order Details', hostId: 'host-02' },
  { id: 'form-generic-info', nom: 'General Inquiry', hostId: 'host-01' },
  { id: 'form-no-fields', nom: 'Simple Confirmation', hostId: 'host-01' },
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
  { id: 'svc-taxi', titre: 'Airport Taxi', description: 'Book a taxi to or from the airport.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "taxi airport", categorieId: 'cat-transport', hostId: 'host-01', formulaireId: 'form-booking', prix: 50 },
  { id: 'svc-breakfast', titre: 'Breakfast in Room', description: 'Order your breakfast to be delivered to your room.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "breakfast room", categorieId: 'cat-roomservice', hostId: 'host-01', formulaireId: 'form-foodorder', prix: 25 },
  { id: 'svc-pizza', titre: 'Pizza Special', description: 'Delicious stone-baked pizza.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "pizza food", categorieId: 'cat-food', hostId: 'host-02', formulaireId: 'form-foodorder', prix: 15 },
  { id: 'svc-cocktail', titre: 'Signature Cocktail', description: 'Try our special house cocktail.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "cocktail drink", categorieId: 'cat-drinks', hostId: 'host-02', formulaireId: 'form-generic-info' },
  { id: 'svc-concierge', titre: 'Concierge Help', description: 'Ask our concierge for assistance.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "concierge helpdesk", categorieId: 'cat-roomservice', hostId: 'host-01', formulaireId: 'form-generic-info' },
  { id: 'svc-water', titre: 'Bottled Water', description: 'A refreshing bottle of spring water.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "water bottle", categorieId: 'cat-drinks', hostId: 'host-02', prix: 2, formulaireId: 'form-no-fields' },
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

export const addUser = async (userData: Omit<User, 'id' | 'motDePasse'> & { motDePasse?: string }): Promise<User> => {
  const existingUserByEmail = users.find(u => u.email === userData.email);
  if (existingUserByEmail) {
    console.warn(`User with email ${userData.email} already exists.`);
    // Optionally update existing user or handle as an error
    // For now, we'll just return the existing user to prevent duplicates by email if desired behavior
    // or throw new Error(`User with email ${userData.email} already exists.`);
    return existingUserByEmail; // Or handle as an error if emails must be unique for new entries
  }
  const newUser: User = {
    ...userData,
    id: `user-${Date.now()}`, // Ensure unique ID
    motDePasse: userData.motDePasse?.trim() || '1234'
  };
  users.push(newUser);
  return newUser;
};


// --- Host Management ---
export const getHosts = async (): Promise<Host[]> => hosts;

export const getHostById = async (hostId: string): Promise<Host | undefined> => {
  return hosts.find(h => h.hostId === hostId);
};

export const addHost = async (hostData: Omit<Host, 'hostId'>): Promise<Host> => {
  const newHostId = `host-${Date.now()}`;
  const existingHostByEmail = hosts.find(h => h.email === hostData.email);

  if(existingHostByEmail) {
    console.warn(`A host entry with email ${hostData.email} already exists. Re-associating or updating if necessary.`);
    // Update existing host's name if different
    if (existingHostByEmail.nom !== hostData.nom) {
        existingHostByEmail.nom = hostData.nom;
    }
     // Ensure user account exists and is correctly configured
     const associatedUser = users.find(u => u.email === existingHostByEmail.email);
     if (associatedUser) {
        const userIndex = users.findIndex(u => u.id === associatedUser.id);
        users[userIndex] = {...users[userIndex], role: 'host', hostId: existingHostByEmail.hostId, nom: existingHostByEmail.nom};
     } else {
         users.push({
            id: `user-${existingHostByEmail.hostId}`, // Use existing hostId for consistency
            email: existingHostByEmail.email,
            nom: existingHostByEmail.nom,
            role: 'host',
            hostId: existingHostByEmail.hostId,
            motDePasse: '1234' // Default password
        });
     }
    return existingHostByEmail;
  }

  const newHost: Host = { ...hostData, hostId: newHostId };
  hosts.push(newHost);

  // Create or update associated user account
  let associatedUser = users.find(u => u.email === newHost.email);
  if (!associatedUser) {
    const hostUser: User = {
      id: `user-${newHostId}`, // Create a new user ID
      email: newHost.email,
      nom: newHost.nom,
      role: 'host',
      hostId: newHost.hostId,
      motDePasse: '1234' // Default password
    };
    users.push(hostUser);
  } else {
    // If user exists but is not a host, update their role and hostId
    const userIndex = users.findIndex(u => u.id === associatedUser!.id);
    users[userIndex] = {
        ...users[userIndex],
        role: 'host',
        hostId: newHost.hostId,
        nom: newHost.nom // Sync name if it changed
    };
  }
  return newHost;
};

export const updateHost = async (hostId: string, hostData: Partial<Omit<Host, 'hostId'>>): Promise<Host | undefined> => {
  const hostIndex = hosts.findIndex(h => h.hostId === hostId);
  if (hostIndex > -1) {
    const originalEmail = hosts[hostIndex].email;
    hosts[hostIndex] = { ...hosts[hostIndex], ...hostData };

    // Update associated user
    // Try to find user by hostId first, then by original email if hostId link might be broken/new
    let userToUpdate = users.find(u => u.hostId === hostId && u.role === 'host');
    if (!userToUpdate && originalEmail) { // Fallback if hostId wasn't set on user or email changed
        userToUpdate = users.find(u => u.email === originalEmail && u.role === 'host');
    }
    // If host email changed, try to find user by new email if no direct link found
    if (!userToUpdate && hostData.email && hostData.email !== originalEmail) {
        userToUpdate = users.find(u => u.email === hostData.email!);
    }


    if (userToUpdate) {
        const userIndex = users.findIndex(u=> u.id === userToUpdate!.id);
        users[userIndex] = {
            ...users[userIndex],
            email: hostData.email || users[userIndex].email, // Update email if provided
            nom: hostData.nom || users[userIndex].nom,       // Update name if provided
            role: 'host', // Ensure role is host
            hostId: hostId  // Ensure hostId is correctly linked
        };
    } else if (hostData.email && hostData.nom) {
      // If no user was found (e.g. email changed and no prior link), create one? Or handle as error?
      // For MVP, let's assume user must exist or host creation/update handles it.
      // This part might need more robust logic depending on business rules for orphaned hosts/users.
      console.warn(`Host ${hostId} updated, but no associated user found to update/create with new details. Manual user adjustment may be needed if email changed.`);
    }
    return hosts[hostIndex];
  }
  return undefined;
};

export const deleteHost = async (hostId: string): Promise<boolean> => {
    const initialHostsLength = hosts.length;
    const hostToDelete = hosts.find(h => h.hostId === hostId);
    hosts = hosts.filter(h => h.hostId !== hostId);

    if (hostToDelete) {
        // Remove user associated with this host (if any)
        users = users.filter(u => !(u.role === 'host' && u.hostId === hostId));
    }

    // Cascade delete related items
    sites = sites.filter(s => s.hostId !== hostId);
    roomsOrTables = roomsOrTables.filter(rt => rt.hostId !== hostId);
    serviceCategories = serviceCategories.filter(sc => sc.hostId !== hostId);
    customForms = customForms.filter(cf => cf.hostId !== hostId);
    services = services.filter(s => s.hostId !== hostId);
    orders = orders.filter(o => o.hostId !== hostId);

    return hosts.length < initialHostsLength;
};


// --- Site Management (Global Sites for Admin) ---
export const getSites = async (hostId?: string): Promise<Site[]> => {
  if (hostId) return sites.filter(s => s.hostId === hostId); // For host dashboard, if they need to see *their* global sites
  return sites; // For admin, all global sites
};

export const getSiteById = async (siteId: string): Promise<Site | undefined> => {
    return sites.find(s => s.siteId === siteId);
};

export const addSite = async (siteData: Omit<Site, 'siteId'>): Promise<Site> => {
  const newSite: Site = { ...siteData, siteId: `globalsite-${Date.now()}` };
  sites.push(newSite);
  return newSite;
};

export const updateSite = async (siteId: string, siteData: Partial<Omit<Site, 'siteId'>>): Promise<Site | undefined> => {
  const siteIndex = sites.findIndex(s => s.siteId === siteId);
  if (siteIndex > -1) {
    sites[siteIndex] = { ...sites[siteIndex], ...siteData };
    // If hostId changed, we might need to update relations, but for now, direct update.
    return sites[siteIndex];
  }
  return undefined;
};

export const deleteSiteInData = async (siteId: string): Promise<boolean> => {
    const initialLength = sites.length;
    sites = sites.filter(s => s.siteId !== siteId);
    // Cascade delete RoomOrTable entries that belong to this global site
    roomsOrTables = roomsOrTables.filter(rt => rt.globalSiteId !== siteId);
    // Services, orders etc are tied to hostId, not globalSiteId directly, so less direct cascade here from global site deletion
    // unless we want to delete all services of the host who managed this site. For now, keep it simple.
    return sites.length < initialLength;
};


// --- RoomOrTable Management (Host Locations) ---
export const getRoomsOrTables = async (hostId: string, globalSiteIdParam?: string): Promise<RoomOrTable[]> => {
  let filtered = roomsOrTables.filter(rt => rt.hostId === hostId);
  if (globalSiteIdParam) { // Optional filter by globalSiteId if provided
    filtered = filtered.filter(rt => rt.globalSiteId === globalSiteIdParam);
  }
  return filtered;
};


export const getRoomOrTableById = async (id: string): Promise<RoomOrTable | undefined> => {
    return roomsOrTables.find(rt => rt.id === id);
};

export const addRoomOrTable = async (data: Omit<RoomOrTable, 'id' | 'urlPersonnalise'>): Promise<RoomOrTable> => {
  const newId = `rt-${data.type.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  const newRoomOrTable: RoomOrTable = {
    ...data,
    id: newId,
    urlPersonnalise: `/client/${data.hostId}/${newId}`, // Ensure hostId is part of the data
  };
  roomsOrTables.push(newRoomOrTable);
  return newRoomOrTable;
};

export const updateRoomOrTable = async (id: string, data: Partial<Omit<RoomOrTable, 'id' | 'urlPersonnalise' | 'hostId'>>): Promise<RoomOrTable | undefined> => {
  const itemIndex = roomsOrTables.findIndex(rt => rt.id === id);
  if (itemIndex > -1) {
    const currentItem = roomsOrTables[itemIndex];
    roomsOrTables[itemIndex] = {
        ...currentItem,
        ...data,
        // hostId is not updatable here, it's fixed by the item's context
        // globalSiteId and parentLocationId are updated based on `data` from component
        globalSiteId: data.globalSiteId !== undefined ? data.globalSiteId : currentItem.globalSiteId,
        parentLocationId: data.parentLocationId !== undefined ? data.parentLocationId : currentItem.parentLocationId,
    };
    // urlPersonnalise does not change on update as it's tied to id and hostId
    return roomsOrTables[itemIndex];
  }
  return undefined;
};


export const deleteRoomOrTable = async (id: string): Promise<boolean> => {
    const initialLength = roomsOrTables.length;
    const locationToDelete = roomsOrTables.find(rt => rt.id === id);

    if (locationToDelete) {
        // Re-parent children locations to the deleted location's parent (or to the global site if no parent)
        const children = roomsOrTables.filter(rt => rt.parentLocationId === id);
        children.forEach(child => {
            const childIndex = roomsOrTables.findIndex(c => c.id === child.id);
            if (childIndex > -1) {
                roomsOrTables[childIndex].parentLocationId = locationToDelete.parentLocationId; // Grandparent or undefined
            }
        });
    }
    roomsOrTables = roomsOrTables.filter(rt => rt.id !== id);
    return roomsOrTables.length < initialLength;
};


// --- ServiceCategory Management ---
export const getServiceCategories = async (hostId: string): Promise<ServiceCategory[]> => {
  return serviceCategories.filter(sc => sc.hostId === hostId);
};
export const addServiceCategory = async (data: Omit<ServiceCategory, 'id' | 'data-ai-hint'>): Promise<ServiceCategory> => {
  const newCategory: ServiceCategory = { ...data, id: `cat-${Date.now()}`, "data-ai-hint": data.nom.toLowerCase().substring(0,15).replace(/\s+/g, ' ') };
  serviceCategories.push(newCategory);
  return newCategory;
};
export const updateServiceCategory = async (id: string, data: Partial<Omit<ServiceCategory, 'id' | 'hostId' | 'data-ai-hint'>>): Promise<ServiceCategory | undefined> => {
  const catIndex = serviceCategories.findIndex(sc => sc.id === id);
  if (catIndex > -1) {
    serviceCategories[catIndex] = { ...serviceCategories[catIndex], ...data, "data-ai-hint": data.nom ? data.nom.toLowerCase().substring(0,15).replace(/\s+/g, ' ') : serviceCategories[catIndex]["data-ai-hint"] };
    return serviceCategories[catIndex];
  }
  return undefined;
};
export const deleteServiceCategory = async (id: string): Promise<boolean> => {
    const initialLength = serviceCategories.length;
    serviceCategories = serviceCategories.filter(sc => sc.id !== id);
    // Unassign this category from services
    services = services.map(s => s.categorieId === id ? {...s, categorieId: ''} : s); // Or a default/uncategorized ID
    return serviceCategories.length < initialLength;
};
export const getServiceCategoryById = async (id: string): Promise<ServiceCategory | undefined> => {
  return serviceCategories.find(sc => sc.id === id);
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
export const updateCustomForm = async (id: string, data: Partial<Omit<CustomForm, 'id' | 'hostId'>>): Promise<CustomForm | undefined> => {
  const formIndex = customForms.findIndex(cf => cf.id === id);
  if (formIndex > -1) {
    customForms[formIndex] = { ...customForms[formIndex], ...data };
    return customForms[formIndex];
  }
  return undefined;
};
export const deleteCustomForm = async (id: string): Promise<boolean> => {
    const initialLength = customForms.length;
    customForms = customForms.filter(cf => cf.id !== id);
    // Also delete associated form fields
    formFields = formFields.filter(ff => ff.formulaireId !== id);
    // Unassign this form from services
    services = services.map(s => s.formulaireId === id ? {...s, formulaireId: undefined} : s);
    return customForms.length < initialLength;
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
export const updateFormField = async (id: string, data: Partial<Omit<FormField, 'id' | 'formulaireId'>>): Promise<FormField | undefined> => {
  const fieldIndex = formFields.findIndex(ff => ff.id === id);
  if (fieldIndex > -1) {
    formFields[fieldIndex] = { ...formFields[fieldIndex], ...data };
    return formFields[fieldIndex];
  }
  return undefined;
};
export const deleteFormField = async (id: string): Promise<boolean> => {
    const initialLength = formFields.length;
    formFields = formFields.filter(ff => ff.id !== id);
    return formFields.length < initialLength;
};

// --- Service Management ---
export const getServices = async (hostId: string, categoryId?: string): Promise<Service[]> => {
  let filteredServices = services.filter(s => s.hostId === hostId);
  if (categoryId && categoryId !== "all") { // Ensure "all" doesn't filter by an actual category named "all"
    filteredServices = filteredServices.filter(s => s.categorieId === categoryId);
  }
  return filteredServices;
};

export const getServiceById = async (serviceId: string): Promise<Service | undefined> => {
  return services.find(s => s.id === serviceId);
};
export const addService = async (data: Omit<Service, 'id' | 'data-ai-hint'>): Promise<Service> => {
  const newService: Service = { ...data, id: `svc-${Date.now()}`, "data-ai-hint": data.titre.toLowerCase().substring(0,15).replace(/\s+/g, ' ') };
  services.push(newService);
  return newService;
};
export const updateService = async (id: string, data: Partial<Omit<Service, 'id' | 'hostId' | 'data-ai-hint'>>): Promise<Service | undefined> => {
  const serviceIndex = services.findIndex(s => s.id === id);
  if (serviceIndex > -1) {
    services[serviceIndex] = { ...services[serviceIndex], ...data, "data-ai-hint": data.titre ? data.titre.toLowerCase().substring(0,15).replace(/\s+/g, ' ') : services[serviceIndex]["data-ai-hint"] };
    return services[serviceIndex];
  }
  return undefined;
};
export const deleteService = async (id: string): Promise<boolean> => {
    const initialLength = services.length;
    services = services.filter(s => s.id !== id);
    orders = orders.filter(o => o.serviceId !== id); // Also delete orders related to this service
    return services.length < initialLength;
};


// --- Order Management ---
export const getOrders = async (hostId: string, status?: Order['status']): Promise<Order[]> => {
  let filteredOrders = orders.filter(o => o.hostId === hostId);
  if (status) {
    filteredOrders = filteredOrders.filter(o => o.status === status);
  }
  return filteredOrders.sort((a,b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime());
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

console.log("Mock data initialized/reloaded.");

    