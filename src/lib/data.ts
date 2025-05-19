
import type { User, Site, Host, RoomOrTable, ServiceCategory, CustomForm, FormField, Service, Order, OrderStatus, Client, ClientType } from './types';

let users: User[] = [
  { id: 'user-admin-01', email: 'kamel@gmail.com', nom: 'Kamel Admin', role: 'admin', motDePasse: '0000' },
  { id: 'user-host-01', email: 'host1@example.com', nom: 'Hotel Paradise', role: 'host', hostId: 'host-01', motDePasse: '1234' },
  { id: 'user-host-02', email: 'host2@example.com', nom: 'Restaurant Delice', role: 'host', hostId: 'host-02', motDePasse: '1234' },
  { id: 'user-client-01', email: 'client1@example.com', nom: 'Alice Wonderland', role: 'client', motDePasse: '1234' },
  { id: 'user-client-02', email: 'client2@example.com', nom: 'Bob The Builder', role: 'client', motDePasse: '1234' },
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
  { id: 'room-102', nom: 'Chambre 102', type: 'Chambre', hostId: 'host-01', globalSiteId: 'site-01', parentLocationId: 'rt-lobby-01', urlPersonnalise: `/client/host-01/room-102` },
  { id: 'table-pool-1', nom: 'Table Piscine 1', type: 'Table', hostId: 'host-01', globalSiteId: 'site-01', parentLocationId: 'rt-pool-01', urlPersonnalise: `/client/host-01/table-pool-1` },
  { id: 'table-5', nom: 'Table 5', type: 'Table', hostId: 'host-02', globalSiteId: 'site-02', parentLocationId: undefined, urlPersonnalise: `/client/host-02/table-5` },
  { id: 'table-vip', nom: 'VIP Table', type: 'Table', hostId: 'host-02', globalSiteId: 'site-02', parentLocationId: undefined, urlPersonnalise: `/client/host-02/table-vip` },
];

let serviceCategories: ServiceCategory[] = [
  { id: 'cat-roomservice', nom: 'Room Service', hostId: 'host-01', image: 'https://placehold.co/300x200.png', "data-ai-hint": "room service" },
  { id: 'cat-transport', nom: 'Transport', hostId: 'host-01', image: 'https://placehold.co/300x200.png', "data-ai-hint": "transportation" },
  { id: 'cat-food', nom: 'Food Menu', hostId: 'host-02', image: 'https://placehold.co/300x200.png', "data-ai-hint": "food menu" },
  { id: 'cat-drinks', nom: 'Beverages', hostId: 'host-02', image: 'https://placehold.co/300x200.png', "data-ai-hint": "drinks beverages" },
  { id: 'cat-activities', nom: 'Activities', hostId: 'host-01', image: 'https://placehold.co/300x200.png', "data-ai-hint": "activities leisure" },
  { id: 'cat-poolside', nom: 'Poolside Menu', hostId: 'host-01', image: 'https://placehold.co/300x200.png', "data-ai-hint": "poolside snacks" },
];

let customForms: CustomForm[] = [
  { id: 'form-booking', nom: 'Booking Request', hostId: 'host-01' },
  { id: 'form-foodorder', nom: 'Food Order Details', hostId: 'host-02' },
  { id: 'form-generic-info', nom: 'General Inquiry', hostId: 'host-01' },
  { id: 'form-no-fields', nom: 'Simple Confirmation', hostId: 'host-01' },
  { id: 'form-activity-signup', nom: 'Activity Sign-up', hostId: 'host-01'},
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
  { id: 'field-activity-name', formulaireId: 'form-activity-signup', label: 'Participant Name', type: 'text', obligatoire: true, ordre: 1},
  { id: 'field-activity-age', formulaireId: 'form-activity-signup', label: 'Participant Age', type: 'number', obligatoire: false, ordre: 2},
];

let services: Service[] = [
  { id: 'svc-taxi', titre: 'Airport Taxi', description: 'Book a taxi to or from the airport.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "taxi airport", categorieId: 'cat-transport', hostId: 'host-01', formulaireId: 'form-booking', prix: 50, targetLocationIds: [] }, // Host-wide
  { id: 'svc-breakfast', titre: 'Breakfast in Room', description: 'Order your breakfast to be delivered to your room.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "breakfast room", categorieId: 'cat-roomservice', hostId: 'host-01', formulaireId: 'form-foodorder', prix: 25, targetLocationIds: ['room-101', 'room-102'] }, // Only for these rooms
  { id: 'svc-pool-cocktails', titre: 'Poolside Cocktails', description: 'Enjoy refreshing cocktails by the pool.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "cocktail pool", categorieId: 'cat-poolside', hostId: 'host-01', prix: 12, targetLocationIds: ['rt-pool-01'] }, // For entire pool area
  { id: 'svc-pizza', titre: 'Pizza Special', description: 'Delicious stone-baked pizza.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "pizza food", categorieId: 'cat-food', hostId: 'host-02', formulaireId: 'form-foodorder', prix: 15, targetLocationIds: [] },
  { id: 'svc-cocktail', titre: 'Signature Cocktail (Restaurant)', description: 'Try our special house cocktail.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "cocktail drink", categorieId: 'cat-drinks', hostId: 'host-02', formulaireId: 'form-generic-info', targetLocationIds: [] },
  { id: 'svc-concierge', titre: 'Concierge Help', description: 'Ask our concierge for assistance.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "concierge helpdesk", categorieId: 'cat-roomservice', hostId: 'host-01', formulaireId: 'form-generic-info', targetLocationIds: ['rt-lobby-01'] }, // Concierge available in lobby
  { id: 'svc-water', titre: 'Bottled Water', description: 'A refreshing bottle of spring water.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "water bottle", categorieId: 'cat-drinks', hostId: 'host-02', prix: 2, formulaireId: 'form-no-fields', targetLocationIds: [] },
  { id: 'svc-spa', titre: 'Spa Package', description: 'Relax with our full-day spa package.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "spa massage", categorieId: 'cat-activities', hostId: 'host-01', formulaireId: 'form-booking', prix: 150, targetLocationIds: [] },
  { id: 'svc-guidedtour', titre: 'Guided City Tour', description: 'Explore the city with our expert guide.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "city tour", categorieId: 'cat-activities', hostId: 'host-01', formulaireId: 'form-activity-signup', prix: 75, targetLocationIds: [] },
];

let orders: Order[] = [
  { id: 'order-001', serviceId: 'svc-taxi', hostId: 'host-01', chambreTableId: 'room-101', clientNom: 'Alice Wonderland', donneesFormulaire: JSON.stringify({ persons: 2, date: '2024-08-15', time: '10:00' }), dateHeure: new Date(Date.now() - 3600000 * 2).toISOString(), status: 'pending', prix: 50 },
  { id: 'order-002', serviceId: 'svc-breakfast', hostId: 'host-01', chambreTableId: 'room-102', clientNom: 'Bob The Builder', donneesFormulaire: JSON.stringify({ dish: "Continental Breakfast", notes: "Extra orange juice"}), dateHeure: new Date(Date.now() - 3600000 * 5).toISOString(), status: 'completed', prix: 25},
  { id: 'order-003', serviceId: 'svc-pizza', hostId: 'host-02', chambreTableId: 'table-5', clientNom: 'Alice Wonderland', donneesFormulaire: JSON.stringify({dish: "Pepperoni Pizza", notes: "Extra cheese"}), dateHeure: new Date(Date.now() - 3600000 * 1).toISOString(), status: 'confirmed', prix: 15},
  { id: 'order-004', serviceId: 'svc-spa', hostId: 'host-01', chambreTableId: 'room-101', clientNom: 'Alice Wonderland', donneesFormulaire: JSON.stringify({ persons: 1, date: '2024-09-10', time: '14:00' }), dateHeure: new Date().toISOString(), status: 'pending', prix: 150 },
  { id: 'order-005', serviceId: 'svc-guidedtour', hostId: 'host-01', chambreTableId: 'room-102', clientNom: 'Bob The Builder', donneesFormulaire: JSON.stringify({ participant_name: "Bob Builder", participant_age: "35" }), dateHeure: new Date(Date.now() - 3600000 * 24).toISOString(), status: 'completed', prix: 75 },
];

let clients: Client[] = [
    { id: 'client-mock-1', hostId: 'host-01', nom: 'Alice Wonderland', email: 'alice@example.com', type: 'heberge', dateArrivee: '2024-07-10', dateDepart: '2024-07-15', locationId: 'room-101', notes: 'Prefers quiet room.' },
    { id: 'client-mock-2', hostId: 'host-01', nom: 'Bob The Builder', email: 'bob@example.com', type: 'heberge', dateArrivee: '2024-07-12', dateDepart: '2024-07-14', locationId: 'room-102' },
    { id: 'client-mock-3', hostId: 'host-02', nom: 'Charlie Brown', telephone: '+1123456789', type: 'passager', notes: 'Regular for lunch.' },
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
    console.warn(`User with email ${userData.email} already exists. Not adding duplicate.`);
    return existingUserByEmail;
  }
  const newUser: User = {
    ...userData,
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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
    if (existingHostByEmail.nom !== hostData.nom) {
        existingHostByEmail.nom = hostData.nom;
    }
     const associatedUser = users.find(u => u.email === existingHostByEmail.email);
     if (associatedUser) {
        const userIndex = users.findIndex(u => u.id === associatedUser.id);
        users[userIndex] = {...users[userIndex], role: 'host', hostId: existingHostByEmail.hostId, nom: existingHostByEmail.nom};
     } else {
         users.push({
            id: `user-${existingHostByEmail.hostId}`,
            email: existingHostByEmail.email,
            nom: existingHostByEmail.nom,
            role: 'host',
            hostId: existingHostByEmail.hostId,
            motDePasse: '1234'
        });
     }
    return existingHostByEmail;
  }

  const newHost: Host = { ...hostData, hostId: newHostId };
  hosts.push(newHost);

  let associatedUser = users.find(u => u.email === newHost.email);
  if (!associatedUser) {
    const hostUser: User = {
      id: `user-${newHostId}`,
      email: newHost.email,
      nom: newHost.nom,
      role: 'host',
      hostId: newHost.hostId,
      motDePasse: '1234'
    };
    users.push(hostUser);
  } else {
    const userIndex = users.findIndex(u => u.id === associatedUser!.id);
    users[userIndex] = {
        ...users[userIndex],
        role: 'host',
        hostId: newHost.hostId,
        nom: newHost.nom
    };
  }
  return newHost;
};

export const updateHost = async (hostId: string, hostData: Partial<Omit<Host, 'hostId'>>): Promise<Host | undefined> => {
  const hostIndex = hosts.findIndex(h => h.hostId === hostId);
  if (hostIndex > -1) {
    const originalEmail = hosts[hostIndex].email;
    hosts[hostIndex] = { ...hosts[hostIndex], ...hostData };

    let userToUpdate = users.find(u => u.hostId === hostId && u.role === 'host');
    if (!userToUpdate && originalEmail) {
        userToUpdate = users.find(u => u.email === originalEmail && u.role === 'host');
    }
    if (!userToUpdate && hostData.email && hostData.email !== originalEmail) {
        userToUpdate = users.find(u => u.email === hostData.email!);
    }

    if (userToUpdate) {
        const userIndex = users.findIndex(u=> u.id === userToUpdate!.id);
        users[userIndex] = {
            ...users[userIndex],
            email: hostData.email || users[userIndex].email,
            nom: hostData.nom || users[userIndex].nom,
            role: 'host',
            hostId: hostId
        };
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
        users = users.filter(u => !(u.role === 'host' && u.hostId === hostId));
    }

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
  if (hostId) return sites.filter(s => s.hostId === hostId);
  return sites;
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
    return sites[siteIndex];
  }
  return undefined;
};

export const deleteSiteInData = async (siteId: string): Promise<boolean> => {
    const initialLength = sites.length;
    sites = sites.filter(s => s.siteId !== siteId);
    roomsOrTables = roomsOrTables.filter(rt => rt.globalSiteId !== siteId);
    return sites.length < initialLength;
};


// --- RoomOrTable Management (Host Locations) ---
export const getRoomsOrTables = async (hostId: string, globalSiteIdParam?: string): Promise<RoomOrTable[]> => {
  let filtered = roomsOrTables.filter(rt => rt.hostId === hostId);
  if (globalSiteIdParam) {
    filtered = filtered.filter(rt => rt.globalSiteId === globalSiteIdParam);
  }
  return filtered.sort((a,b) => a.nom.localeCompare(b.nom)); // Sort for consistent UI
};


export const getRoomOrTableById = async (id: string): Promise<RoomOrTable | undefined> => {
    return roomsOrTables.find(rt => rt.id === id);
};

export const addRoomOrTable = async (data: Omit<RoomOrTable, 'id' | 'urlPersonnalise'>): Promise<RoomOrTable> => {
  const newId = `rt-${data.type.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  const newRoomOrTable: RoomOrTable = {
    ...data,
    id: newId,
    urlPersonnalise: `/client/${data.hostId}/${newId}`,
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
        ...data, // Apply partial updates
        hostId: currentItem.hostId, // Ensure hostId and URL are not changed by partial update
        urlPersonnalise: currentItem.urlPersonnalise,
         // Ensure globalSiteId and parentLocationId are correctly preserved or updated
        globalSiteId: data.globalSiteId !== undefined ? data.globalSiteId : currentItem.globalSiteId,
        parentLocationId: data.parentLocationId !== undefined ? data.parentLocationId : currentItem.parentLocationId,
    };
    return roomsOrTables[itemIndex];
  }
  return undefined;
};


export const deleteRoomOrTable = async (id: string): Promise<boolean> => {
    const initialLength = roomsOrTables.length;
    const locationToDelete = roomsOrTables.find(rt => rt.id === id);

    if (locationToDelete) {
        // Re-parent children of the deleted location to its parent (or make them top-level under global site if no grandparent)
        const children = roomsOrTables.filter(rt => rt.parentLocationId === id);
        children.forEach(child => {
            const childIndex = roomsOrTables.findIndex(c => c.id === child.id);
            if (childIndex > -1) {
                 // Assign to grandparent or make top-level if no grandparent
                roomsOrTables[childIndex].parentLocationId = locationToDelete.parentLocationId || undefined;
            }
        });
         // Also remove from any service targetLocationIds
        services.forEach(service => {
            if (service.targetLocationIds?.includes(id)) {
                service.targetLocationIds = service.targetLocationIds.filter(targetId => targetId !== id);
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
    services = services.map(s => s.categorieId === id ? {...s, categorieId: ''} : s); // Uncategorize services
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
    formFields = formFields.filter(ff => ff.formulaireId !== id);
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
export const getServices = async (
  hostId: string,
  clientCurrentLocationId?: string, // This is the refId from the QR code for client view
  categoryId?: string
): Promise<Service[]> => {
  let hostServices = services.filter(s => s.hostId === hostId);

  if (clientCurrentLocationId) {
    const currentScannedLocation = await getRoomOrTableById(clientCurrentLocationId);
    if (!currentScannedLocation) {
      console.error(`Location with ID ${clientCurrentLocationId} not found.`);
      return [];
    }

    const ancestorAndSelfLocationIds: string[] = [currentScannedLocation.id];
    let parentId = currentScannedLocation.parentLocationId;
    while (parentId) {
      const parentLocation = await getRoomOrTableById(parentId); // Fetch parent details
      if (parentLocation) {
        ancestorAndSelfLocationIds.push(parentId);
        parentId = parentLocation.parentLocationId;
      } else {
        parentId = undefined; // Parent not found, break loop
      }
    }
    
    hostServices = hostServices.filter(service => {
      if (!service.targetLocationIds || service.targetLocationIds.length === 0) {
        return true; // Service is host-wide (available to all locations of this host)
      }
      // Check if any of the service's target locations are in the client's current location hierarchy
      return service.targetLocationIds.some(targetId => ancestorAndSelfLocationIds.includes(targetId));
    });
  }
  // else if not clientCurrentLocationId, it means we are fetching for host admin view, so no location-based filtering.

  if (categoryId && categoryId !== "all" && categoryId !== "") {
    hostServices = hostServices.filter(s => s.categorieId === categoryId);
  }
  return hostServices;
};

export const getServiceById = async (serviceId: string): Promise<Service | undefined> => {
  return services.find(s => s.id === serviceId);
};

export const addService = async (data: Omit<Service, 'id' | 'data-ai-hint'>): Promise<Service> => {
  const newService: Service = {
    ...data,
    id: `svc-${Date.now()}`,
    "data-ai-hint": data.titre.toLowerCase().substring(0,15).replace(/\s+/g, ' '),
    targetLocationIds: data.targetLocationIds || [] // Ensure it's an array
  };
  services.push(newService);
  return newService;
};

export const updateService = async (id: string, data: Partial<Omit<Service, 'id' | 'hostId' | 'data-ai-hint'>>): Promise<Service | undefined> => {
  const serviceIndex = services.findIndex(s => s.id === id);
  if (serviceIndex > -1) {
    services[serviceIndex] = {
      ...services[serviceIndex],
      ...data,
      "data-ai-hint": data.titre ? data.titre.toLowerCase().substring(0,15).replace(/\s+/g, ' ') : services[serviceIndex]["data-ai-hint"],
      targetLocationIds: data.targetLocationIds !== undefined ? data.targetLocationIds : services[serviceIndex].targetLocationIds,
    };
    return services[serviceIndex];
  }
  return undefined;
};
export const deleteService = async (id: string): Promise<boolean> => {
    const initialLength = services.length;
    services = services.filter(s => s.id !== id);
    orders = orders.filter(o => o.serviceId !== id);
    return services.length < initialLength;
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
  let filteredOrders = orders.filter(o => o.hostId === hostId);

  if (filters?.status && filters.status !== "all") {
    filteredOrders = filteredOrders.filter(o => o.status === filters.status);
  }

  if (filters?.serviceId && filters.serviceId !== "all") {
    filteredOrders = filteredOrders.filter(o => o.serviceId === filters.serviceId);
  } else if (filters?.categoryId && filters.categoryId !== "all") {
    const servicesInCategory = services.filter(s => s.categorieId === filters.categoryId && s.hostId === hostId).map(s => s.id);
    filteredOrders = filteredOrders.filter(o => servicesInCategory.includes(o.serviceId));
  }
  
  if (filters?.clientName && filters.clientName.trim() !== "") {
    filteredOrders = filteredOrders.filter(o => o.clientNom && o.clientNom.toLowerCase().includes(filters.clientName!.toLowerCase()));
  }

  return filteredOrders.sort((a,b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime());
};

export const getOrdersByClientName = async (hostId: string, clientName: string): Promise<Order[]> => {
  return orders.filter(o => o.hostId === hostId && o.clientNom?.toLowerCase() === clientName.toLowerCase())
               .sort((a,b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime());
};

export const addOrder = async (data: Omit<Order, 'id' | 'dateHeure' | 'status'>): Promise<Order> => {
  const serviceDetails = await getServiceById(data.serviceId);
  const newOrder: Order = {
    ...data,
    id: `order-${Date.now()}`,
    dateHeure: new Date().toISOString(),
    status: 'pending',
    prix: serviceDetails?.prix // Capture price at time of order
  };
  orders.push(newOrder);
  return newOrder;
};
export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order | undefined> => {
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex > -1) {
    orders[orderIndex].status = status;
    return orders[orderIndex];
  }
  return undefined;
};

// --- Client Management (Host Side) ---
export const getClients = async (hostId: string): Promise<Client[]> => {
  return clients.filter(c => c.hostId === hostId);
};

export const getClientById = async (clientId: string): Promise<Client | undefined> => {
  return clients.find(c => c.id === clientId);
};

export const addClient = async (clientData: Omit<Client, 'id' | 'documents'>): Promise<Client> => {
  const newClient: Client = { ...clientData, id: `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` };
  clients.push(newClient);
  return newClient;
};

export const updateClient = async (clientId: string, clientData: Partial<Omit<Client, 'id' | 'hostId' | 'documents'>>): Promise<Client | undefined> => {
  const clientIndex = clients.findIndex(c => c.id === clientId);
  if (clientIndex > -1) {
    clients[clientIndex] = { ...clients[clientIndex], ...clientData };
    return clients[clientIndex];
  }
  return undefined;
};

export const deleteClient = async (clientId: string): Promise<boolean> => {
  const initialLength = clients.length;
  clients = clients.filter(c => c.id !== clientId);
  // Future: Consider implications for orders if ClientId is linked to orders.
  return clients.length < initialLength;
};

console.log("Mock data initialized/reloaded.");
