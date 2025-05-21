
import type { User, Site, Host, RoomOrTable, ServiceCategory, CustomForm, FormField, Service, Order, OrderStatus, Client, ClientType } from './types';
// Firestore imports are removed for in-memory data management of Users and Hosts
// import { db } from './firebase';
// import { collection, getDocs, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';

// --- In-memory data for Users ---
let users: User[] = [
  { id: 'user-admin-kamel', email: 'kamel@gmail.com', nom: 'Kamel Admin', role: 'admin', motDePasse: '0000' },
  { id: 'user-host-01', email: 'manager@paradise.com', nom: 'Paradise Hotel Manager', role: 'host', hostId: 'host-01', motDePasse: '1234' },
  { id: 'user-host-02', email: 'contact@delice.com', nom: 'Delice Restaurant Lead', role: 'host', hostId: 'host-02', motDePasse: '1234' },
  { id: 'user-client-01', email: 'client1@example.com', nom: 'Alice Wonderland', role: 'client', motDePasse: 'clientpass' },
  { id: 'user-client-02', email: 'client2@example.com', nom: 'Bob The Builder', role: 'client', motDePasse: 'clientpass' },
  { id: 'user-dynamic-host', email: 'dynamic.host@example.com', nom: 'Dynamic Test Host User', role: 'host', hostId: 'host-1747669860022', motDePasse: '1234' },
  { id: 'user-dynamic-client-01', email: 'dynamic_client@example.com', nom: 'Dynamic Test Client', role: 'client', motDePasse: 'clientpass' },
];

// --- In-memory data for Hosts ---
let hosts: Host[] = [
  { hostId: 'host-01', nom: 'Paradise Beach Resort', email: 'manager@paradise.com' },
  { hostId: 'host-02', nom: 'Le Delice Downtown', email: 'contact@delice.com' },
  { hostId: 'host-1747669860022', nom: 'Dynamic Test Establishment', email: 'dynamic.host@example.com' },
];

// --- User Management (In-Memory) ---
export const getUserByEmail = async (email: string): Promise<User | undefined> => {
  console.log(`[In-Memory Data] getUserByEmail called for: ${email}`);
  const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (foundUser) {
    console.log(`[In-Memory Data] User found:`, {id: foundUser.id, email: foundUser.email, role: foundUser.role});
  } else {
    console.log(`[In-Memory Data] User not found for email: ${email}`);
  }
  return foundUser;
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  console.log(`[In-Memory Data] getUserById called for: ${id}`);
  return users.find(u => u.id === id);
};

export const getUsers = async (): Promise<User[]> => {
  console.log(`[In-Memory Data] getUsers called. Returning ${users.length} users.`);
  return [...users].sort((a, b) => a.nom.localeCompare(b.nom));
};

export const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
  console.log(`[In-Memory Data] addUser called for:`, userData.email);
  const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
  if (existingUser) {
    console.warn(`[In-Memory Data] User with email ${userData.email} already exists. Updating existing user.`);
    existingUser.nom = userData.nom;
    existingUser.role = userData.role;
    if (userData.hostId) existingUser.hostId = userData.hostId;
    if (userData.motDePasse) existingUser.motDePasse = userData.motDePasse;
    return { ...existingUser };
  }

  const newUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newUser: User = {
    id: newUserId,
    email: userData.email,
    nom: userData.nom,
    role: userData.role,
    hostId: userData.hostId,
    motDePasse: userData.motDePasse,
  };
  users.push(newUser);
  console.log(`[In-Memory Data] User ${newUser.email} added with ID ${newUser.id}. Total users: ${users.length}`);
  return { ...newUser };
};

export const updateUser = async (userId: string, userData: Partial<Omit<User, 'id'>>): Promise<User | undefined> => {
  console.log(`[In-Memory Data] updateUser called for ID: ${userId} with data:`, userData);
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    // Do not update password if it's empty or undefined in userData
    const { motDePasse, ...otherData } = userData;
    users[userIndex] = { ...users[userIndex], ...otherData };
    if (motDePasse && motDePasse.trim() !== '') {
      users[userIndex].motDePasse = motDePasse;
    }
    console.log(`[In-Memory Data] User ${users[userIndex].email} updated.`);
    return { ...users[userIndex] };
  }
  console.warn(`[In-Memory Data] User with ID ${userId} not found for update.`);
  return undefined;
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  console.log(`[In-Memory Data] deleteUser called for ID: ${userId}`);
  const initialLength = users.length;
  users = users.filter(u => u.id !== userId);
  const success = users.length < initialLength;
  if(success) console.log(`[In-Memory Data] User ${userId} deleted. Total users: ${users.length}`);
  else console.warn(`[In-Memory Data] User ${userId} not found for deletion.`);
  return success;
};

// --- Host Management (In-Memory) ---
export const getHosts = async (): Promise<Host[]> => {
  console.log(`[In-Memory Data] getHosts called. Returning ${hosts.length} hosts.`);
  return [...hosts].sort((a, b) => a.nom.localeCompare(b.nom));
};

export const getHostById = async (hostId: string): Promise<Host | undefined> => {
  console.log(`[In-Memory Data] getHostById called for: ${hostId}`);
  return hosts.find(h => h.hostId === hostId);
};

export const addHost = async (hostData: Omit<Host, 'hostId'>): Promise<Host> => {
  console.log(`[In-Memory Data] addHost called for:`, hostData.email);
  const existingHost = hosts.find(h => h.email.toLowerCase() === hostData.email.toLowerCase());
  if (existingHost) {
    console.warn(`[In-Memory Data] Host with email ${hostData.email} already exists. Updating existing host details.`);
    existingHost.nom = hostData.nom;
    // Ensure associated user is updated/created
    let associatedUser = await getUserByEmail(existingHost.email);
    if (associatedUser) {
      await updateUser(associatedUser.id, { nom: existingHost.nom, role: 'host', hostId: existingHost.hostId });
    } else {
      await addUser({
        email: existingHost.email,
        nom: existingHost.nom,
        role: 'host',
        hostId: existingHost.hostId,
        motDePasse: '1234', // Default password
      });
    }
    return { ...existingHost };
  }

  const newHostId = `host-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newHost: Host = { hostId: newHostId, ...hostData };
  hosts.push(newHost);
  console.log(`[In-Memory Data] Host ${newHost.email} added with ID ${newHost.hostId}. Total hosts: ${hosts.length}`);

  // Create or update associated user
  await addUser({
    email: newHost.email,
    nom: newHost.nom,
    role: 'host',
    hostId: newHost.hostId,
    motDePasse: '1234', // Default password for new host users
  });
  return { ...newHost };
};

export const updateHost = async (hostId: string, hostData: Partial<Omit<Host, 'hostId'>>): Promise<Host | undefined> => {
  console.log(`[In-Memory Data] updateHost called for ID: ${hostId} with data:`, hostData);
  const hostIndex = hosts.findIndex(h => h.hostId === hostId);
  if (hostIndex > -1) {
    const originalHost = { ...hosts[hostIndex] };
    hosts[hostIndex] = { ...hosts[hostIndex], ...hostData };
    const updatedHost = hosts[hostIndex];

    // Update associated user if email or name changed
    if (originalHost.email !== updatedHost.email || originalHost.nom !== updatedHost.nom) {
      let userToUpdate = await getUserByEmail(originalHost.email); // Find by old email if it changed
      if (userToUpdate) {
        await updateUser(userToUpdate.id, {
          email: updatedHost.email,
          nom: updatedHost.nom,
          role: 'host',
          hostId: updatedHost.hostId,
        });
      } else {
        // If user not found with old email (e.g. email was changed), try to find by new email or create
        userToUpdate = await getUserByEmail(updatedHost.email);
        if(userToUpdate) {
          await updateUser(userToUpdate.id, { nom: updatedHost.nom, role: 'host', hostId: updatedHost.hostId });
        } else {
          console.warn(`[In-Memory Data] No user found for host ${hostId}. Creating new associated user.`);
          await addUser({ email: updatedHost.email, nom: updatedHost.nom, role: 'host', hostId: updatedHost.hostId, motDePasse: '1234' });
        }
      }
    }
    console.log(`[In-Memory Data] Host ${updatedHost.email} updated.`);
    return { ...updatedHost };
  }
  console.warn(`[In-Memory Data] Host with ID ${hostId} not found for update.`);
  return undefined;
};

export const deleteHost = async (hostId: string): Promise<boolean> => {
  console.log(`[In-Memory Data] deleteHost called for ID: ${hostId}`);
  const hostToDelete = hosts.find(h => h.hostId === hostId);
  if (!hostToDelete) {
    console.warn(`[In-Memory Data] Host with ID ${hostId} not found for deletion.`);
    return false;
  }

  const initialLength = hosts.length;
  hosts = hosts.filter(h => h.hostId !== hostId);
  const success = hosts.length < initialLength;

  if (success) {
    console.log(`[In-Memory Data] Host ${hostToDelete.email} deleted.`);
    // Delete associated user
    const userToDelete = await getUserByEmail(hostToDelete.email);
    if (userToDelete && userToDelete.hostId === hostId) {
      await deleteUser(userToDelete.id);
    }
    // Cascade delete for other in-memory data related to this hostId
    sites = sites.filter(s => s.hostId !== hostId);
    roomsOrTables = roomsOrTables.filter(rt => rt.hostId !== hostId);
    serviceCategories = serviceCategories.filter(sc => sc.hostId !== hostId);
    customForms = customForms.filter(cf => cf.hostId !== hostId);
    formFields = formFields.filter(ff => {
      const form = customForms.find(f => f.id === ff.formulaireId);
      return !form || form.hostId !== hostId; // If form is gone, or form not for this host
    });
    services = services.filter(s => s.hostId !== hostId);
    orders = orders.filter(o => o.hostId !== hostId);
    clients = clients.filter(c => c.hostId !== hostId);
    console.log(`[In-Memory Data] Associated data for host ${hostId} also removed.`);

  } else {
    console.warn(`[In-Memory Data] Host ${hostId} could not be deleted (already removed or not found).`);
  }
  return success;
};


// --- Site Management (Global Sites for Admin) --- (Still uses in-memory data)
let sites: Site[] = [
  { siteId: 'site-01', nom: 'Paradise Beach Resort', hostId: 'host-01' },
  { siteId: 'site-02', nom: 'Le Delice Downtown', hostId: 'host-02' },
  { siteId: 'site-dynamic-01', nom: 'Dynamic Test Establishment', hostId: 'host-1747669860022' },
];

export const getSites = async (hostId?: string): Promise<Site[]> => {
  if (hostId) return sites.filter(s => s.hostId === hostId);
  return [...sites];
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
    // Also remove any RoomOrTable that belongs to this global site
    roomsOrTables = roomsOrTables.filter(rt => rt.globalSiteId !== siteId);
    return sites.length < initialLength;
};


// --- RoomOrTable Management (Host Locations) --- (Still uses in-memory data)
let roomsOrTables: RoomOrTable[] = [
  { id: 'rt-globalsite-root-site-01', nom: 'Paradise Resort Main Area', type: 'Site', hostId: 'host-01', globalSiteId: 'site-01', parentLocationId: undefined, urlPersonnalise: `/client/host-01/rt-globalsite-root-site-01`},
    { id: 'rt-lobby-01', nom: 'Lobby Zone', type: 'Site', hostId: 'host-01', globalSiteId: 'site-01', parentLocationId: 'rt-globalsite-root-site-01', urlPersonnalise: `/client/host-01/rt-lobby-01`},
      { id: 'rt-reception-desk-01', nom: 'Reception Desk', type: 'Site', hostId: 'host-01', globalSiteId: 'site-01', parentLocationId: 'rt-lobby-01', urlPersonnalise: `/client/host-01/rt-reception-desk-01`},
      { id: 'room-101', nom: 'Chambre 101', type: 'Chambre', hostId: 'host-01', globalSiteId: 'site-01', parentLocationId: 'rt-lobby-01', urlPersonnalise: `/client/host-01/room-101` },
      { id: 'room-102', nom: 'Chambre 102', type: 'Chambre', hostId: 'host-01', globalSiteId: 'site-01', parentLocationId: 'rt-lobby-01', urlPersonnalise: `/client/host-01/room-102` },
    { id: 'rt-pool-01', nom: 'Pool Area', type: 'Site', hostId: 'host-01', globalSiteId: 'site-01', parentLocationId: 'rt-globalsite-root-site-01', urlPersonnalise: `/client/host-01/rt-pool-01`},
      { id: 'table-pool-1', nom: 'Table Piscine 1', type: 'Table', hostId: 'host-01', globalSiteId: 'site-01', parentLocationId: 'rt-pool-01', urlPersonnalise: `/client/host-01/table-pool-1` },
  
  { id: 'rt-restaurant-main-area-02', nom: 'Delice Main Dining', type: 'Site', hostId: 'host-02', globalSiteId: 'site-02', parentLocationId: undefined, urlPersonnalise: `/client/host-02/rt-restaurant-main-area-02`},
  { id: 'table-5', nom: 'Table 5', type: 'Table', hostId: 'host-02', globalSiteId: 'site-02', parentLocationId: 'rt-restaurant-main-area-02', urlPersonnalise: `/client/host-02/table-5` },
  { id: 'table-vip', nom: 'VIP Table', type: 'Table', hostId: 'host-02', globalSiteId: 'site-02', parentLocationId: 'rt-restaurant-main-area-02', urlPersonnalise: `/client/host-02/table-vip` },

  { id: 'rt-dynamic-main', nom: 'Dynamic Main Area', type: 'Site', hostId: 'host-1747669860022', globalSiteId: 'site-dynamic-01', parentLocationId: undefined, urlPersonnalise: `/client/host-1747669860022/rt-dynamic-main`},
  { id: 'rt-dynamic-lobby', nom: 'Dynamic Lobby', type: 'Site', hostId: 'host-1747669860022', globalSiteId: 'site-dynamic-01', parentLocationId: 'rt-dynamic-main', urlPersonnalise: `/client/host-1747669860022/rt-dynamic-lobby`},
  { id: 'rt-dynamic-room1', nom: 'Dynamic Room 1', type: 'Chambre', hostId: 'host-1747669860022', globalSiteId: 'site-dynamic-01', parentLocationId: 'rt-dynamic-lobby', urlPersonnalise: `/client/host-1747669860022/rt-dynamic-room1`},
  { id: 'rt-dynamic-table1', nom: 'Dynamic Table Alpha', type: 'Table', hostId: 'host-1747669860022', globalSiteId: 'site-dynamic-01', parentLocationId: 'rt-dynamic-main', urlPersonnalise: `/client/host-1747669860022/rt-dynamic-table1`},
];

export const getRoomsOrTables = async (hostId: string, globalSiteIdParam?: string): Promise<RoomOrTable[]> => {
  let filtered = roomsOrTables.filter(rt => rt.hostId === hostId);
  if (globalSiteIdParam) {
    filtered = filtered.filter(rt => rt.globalSiteId === globalSiteIdParam);
  }
  return [...filtered].sort((a,b) => {
    if (a.type === 'Site' && b.type !== 'Site') return -1;
    if (a.type !== 'Site' && b.type === 'Site') return 1;
    return a.nom.localeCompare(b.nom);
  });
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
        ...data, 
        globalSiteId: data.globalSiteId !== undefined ? data.globalSiteId : currentItem.globalSiteId,
        parentLocationId: data.parentLocationId !== undefined ? data.parentLocationId : currentItem.parentLocationId,
    };
    return { ...roomsOrTables[itemIndex] };
  }
  return undefined;
};

export const deleteRoomOrTable = async (id: string): Promise<boolean> => {
    const initialLength = roomsOrTables.length;
    const locationToDelete = roomsOrTables.find(rt => rt.id === id);

    if (locationToDelete) {
        const children = roomsOrTables.filter(rt => rt.parentLocationId === id);
        children.forEach(child => {
            const childIndex = roomsOrTables.findIndex(c => c.id === child.id);
            if (childIndex > -1) {
                roomsOrTables[childIndex].parentLocationId = locationToDelete.parentLocationId || undefined;
            }
        });
        services.forEach(service => {
            if (service.targetLocationIds?.includes(id)) {
                service.targetLocationIds = service.targetLocationIds.filter(targetId => targetId !== id);
            }
        });
        clients.forEach(client => {
            if (client.locationId === id) {
                client.locationId = undefined; 
            }
        });
    }
    roomsOrTables = roomsOrTables.filter(rt => rt.id !== id);
    return roomsOrTables.length < initialLength;
};

// --- ServiceCategory Management --- (Still uses in-memory data)
let serviceCategories: ServiceCategory[] = [
  { id: 'cat-roomservice', nom: 'Room Service', hostId: 'host-01', image: 'https://placehold.co/300x200.png', "data-ai-hint": "room service" },
  { id: 'cat-transport', nom: 'Transport & Tours', hostId: 'host-01', image: 'https://placehold.co/300x200.png', "data-ai-hint": "transportation tour" },
  { id: 'cat-food', nom: 'Food Menu', hostId: 'host-02', image: 'https://placehold.co/300x200.png', "data-ai-hint": "food menu" },
  { id: 'cat-drinks', nom: 'Beverages', hostId: 'host-02', image: 'https://placehold.co/300x200.png', "data-ai-hint": "drinks beverages" },
  { id: 'cat-activities', nom: 'Resort Activities', hostId: 'host-01', image: 'https://placehold.co/300x200.png', "data-ai-hint": "activities leisure" },
  { id: 'cat-poolside', nom: 'Poolside Snacks & Drinks', hostId: 'host-01', image: 'https://placehold.co/300x200.png', "data-ai-hint": "poolside snacks" },
  { id: 'cat-dynamic-main', nom: 'General Services (Dynamic Host)', hostId: 'host-1747669860022', image: 'https://placehold.co/300x200.png', "data-ai-hint": "general services" },
];

export const getServiceCategories = async (hostId: string): Promise<ServiceCategory[]> => {
  return [...serviceCategories].filter(sc => sc.hostId === hostId).sort((a,b) => a.nom.localeCompare(b.nom));
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
    return { ...serviceCategories[catIndex] };
  }
  return undefined;
};
export const deleteServiceCategory = async (id: string): Promise<boolean> => {
    const initialLength = serviceCategories.length;
    serviceCategories = serviceCategories.filter(sc => sc.id !== id);
    services = services.map(s => s.categorieId === id ? {...s, categorieId: ''} : s); 
    return serviceCategories.length < initialLength;
};
export const getServiceCategoryById = async (id: string): Promise<ServiceCategory | undefined> => {
  return serviceCategories.find(sc => sc.id === id);
};

// --- CustomForm Management --- (Still uses in-memory data)
let customForms: CustomForm[] = [
  { id: 'form-booking', nom: 'Booking Details', hostId: 'host-01' },
  { id: 'form-foodorder', nom: 'Food Order Preferences', hostId: 'host-02' },
  { id: 'form-generic-info', nom: 'General Inquiry', hostId: 'host-01' },
  { id: 'form-no-fields', nom: 'Simple Confirmation (No Fields)', hostId: 'host-01' },
  { id: 'form-activity-signup', nom: 'Activity Sign-up Details', hostId: 'host-01'},
  { id: 'form-dynamic-request', nom: 'Dynamic Service Request', hostId: 'host-1747669860022'},
];

export const getCustomForms = async (hostId: string): Promise<CustomForm[]> => {
  return [...customForms].filter(cf => cf.hostId === hostId).sort((a,b) => a.nom.localeCompare(b.nom));
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
    return { ...customForms[formIndex] };
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

// --- FormField Management --- (Still uses in-memory data)
let formFields: FormField[] = [
  { id: 'field-persons', formulaireId: 'form-booking', label: 'Number of Persons', type: 'number', obligatoire: true, ordre: 1, placeholder: 'e.g., 2' },
  { id: 'field-date', formulaireId: 'form-booking', label: 'Desired Date', type: 'date', obligatoire: true, ordre: 2 },
  { id: 'field-time', formulaireId: 'form-booking', label: 'Preferred Time', type: 'time', obligatoire: false, ordre: 3 },
  { id: 'field-dish', formulaireId: 'form-foodorder', label: 'Main Dish Choice', type: 'text', obligatoire: true, ordre: 1, placeholder: 'e.g., Pizza Margherita' },
  { id: 'field-notes', formulaireId: 'form-foodorder', label: 'Additional Notes/Allergies', type: 'textarea', obligatoire: false, ordre: 2, placeholder: 'e.g., No onions, gluten-free' },
  { id: 'field-name-generic', formulaireId: 'form-generic-info', label: 'Your Name', type: 'text', obligatoire: true, ordre: 1, placeholder: 'John Doe' },
  { id: 'field-email-generic', formulaireId: 'form-generic-info', label: 'Your Email', type: 'email', obligatoire: true, ordre: 2, placeholder: 'john.doe@example.com' },
  { id: 'field-message-generic', formulaireId: 'form-generic-info', label: 'Your Message/Question', type: 'textarea', obligatoire: true, ordre: 3, placeholder: 'Type your message here...' },
  { id: 'field-activity-name', formulaireId: 'form-activity-signup', label: 'Participant Full Name', type: 'text', obligatoire: true, ordre: 1},
  { id: 'field-activity-age', formulaireId: 'form-activity-signup', label: 'Participant Age', type: 'number', obligatoire: false, ordre: 2},
  { id: 'field-dynamic-detail', formulaireId: 'form-dynamic-request', label: 'Request Detail', type: 'textarea', obligatoire: true, ordre: 1, placeholder: 'Please describe your request...'},
];

export const getFormFields = async (formulaireId: string): Promise<FormField[]> => {
  return [...formFields].filter(ff => ff.formulaireId === formulaireId).sort((a, b) => a.ordre - b.ordre);
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
    return { ...formFields[fieldIndex] };
  }
  return undefined;
};
export const deleteFormField = async (id: string): Promise<boolean> => {
    const initialLength = formFields.length;
    formFields = formFields.filter(ff => ff.id !== id);
    return formFields.length < initialLength;
};

// --- Service Management --- (Still uses in-memory data)
let services: Service[] = [
  { id: 'svc-taxi', titre: 'Airport Taxi', description: 'Book a taxi to or from the airport. Reliable and comfortable.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "taxi airport", categorieId: 'cat-transport', hostId: 'host-01', formulaireId: 'form-booking', prix: 50, targetLocationIds: [], loginRequired: true },
  { id: 'svc-breakfast', titre: 'In-Room Breakfast', description: 'Order your breakfast selection to be delivered directly to your room.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "breakfast room", categorieId: 'cat-roomservice', hostId: 'host-01', formulaireId: 'form-foodorder', prix: 25, targetLocationIds: ['room-101', 'room-102'], loginRequired: false },
  { id: 'svc-pool-cocktails', titre: 'Poolside Cocktails', description: 'Enjoy refreshing cocktails served by the pool.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "cocktail pool", categorieId: 'cat-poolside', hostId: 'host-01', prix: 12, targetLocationIds: ['rt-pool-01'], loginRequired: false },
  { id: 'svc-pizza', titre: 'Artisan Pizza', description: 'Delicious stone-baked pizza with your choice of toppings.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "pizza food", categorieId: 'cat-food', hostId: 'host-02', formulaireId: 'form-foodorder', prix: 18, targetLocationIds: [], loginRequired: false },
  { id: 'svc-water-restaurant', titre: 'Bottled Water (Restaurant)', description: 'Chilled spring water.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "water bottle", categorieId: 'cat-drinks', hostId: 'host-02', prix: 3, targetLocationIds: [], loginRequired: false },
  { id: 'svc-concierge', titre: 'Concierge Assistance', description: 'Need help with bookings or local information? Our concierge is here for you.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "concierge helpdesk", categorieId: 'cat-roomservice', hostId: 'host-01', formulaireId: 'form-generic-info', targetLocationIds: ['rt-lobby-01', 'rt-reception-desk-01'], loginRequired: true },
  { id: 'svc-spa', titre: 'Full Day Spa Package', description: 'Indulge in a full day of relaxation and treatments at our spa.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "spa massage", categorieId: 'cat-activities', hostId: 'host-01', formulaireId: 'form-booking', prix: 150, targetLocationIds: [], loginRequired: true },
  { id: 'svc-citytour', titre: 'Guided City Tour', description: 'Explore the city highlights with our expert local guide. Duration: 3 hours.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "city tour", categorieId: 'cat-transport', hostId: 'host-01', formulaireId: 'form-activity-signup', prix: 75, targetLocationIds: ['rt-lobby-01', 'rt-reception-desk-01'], loginRequired: true },
  { id: 'svc-dynamic-info', titre: 'Information Desk (Dynamic Host)', description: 'Ask us anything!', image: 'https://placehold.co/600x400.png', "data-ai-hint": "information desk", categorieId: 'cat-dynamic-main', hostId: 'host-1747669860022', formulaireId: 'form-dynamic-request', targetLocationIds: ['rt-dynamic-lobby'], loginRequired: false},
  { id: 'svc-dynamic-roomclean', titre: 'Room Cleaning (Dynamic Host)', description: 'Schedule your room cleaning service.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "room cleaning", categorieId: 'cat-dynamic-main', hostId: 'host-1747669860022', formulaireId: undefined, targetLocationIds: ['rt-dynamic-room1'], loginRequired: true},
];

export const getServices = async (
  hostId: string,
  clientCurrentLocationId?: string,
  categoryId?: string
): Promise<Service[]> => {
  let hostServices = [...services].filter(s => s.hostId === hostId);

  if (clientCurrentLocationId) {
    const currentScannedLocation = await getRoomOrTableById(clientCurrentLocationId);
    if (!currentScannedLocation) {
      console.error(`[In-Memory Data] Location with ID ${clientCurrentLocationId} not found for service filtering.`);
      return [];
    }

    const ancestorAndSelfLocationIds: string[] = [currentScannedLocation.id];
    let parentIdLoop = currentScannedLocation.parentLocationId;
    while (parentIdLoop) {
      const parentLocation = await getRoomOrTableById(parentIdLoop);
      if (parentLocation) {
        ancestorAndSelfLocationIds.push(parentIdLoop);
        parentIdLoop = parentLocation.parentLocationId;
      } else {
        parentIdLoop = undefined;
      }
    }
    
    hostServices = hostServices.filter(service => {
      if (!service.targetLocationIds || service.targetLocationIds.length === 0) {
        return true; 
      }
      return service.targetLocationIds.some(targetId => ancestorAndSelfLocationIds.includes(targetId));
    });
  }

  if (categoryId && categoryId !== "all" && categoryId !== "") {
    hostServices = hostServices.filter(s => s.categorieId === categoryId);
  }
  return hostServices.sort((a,b) => a.titre.localeCompare(b.titre));
};

export const getServiceById = async (serviceId: string): Promise<Service | undefined> => {
  return services.find(s => s.id === serviceId);
};

export const addService = async (data: Omit<Service, 'id' | 'data-ai-hint'>): Promise<Service> => {
  const newService: Service = {
    ...data,
    id: `svc-${Date.now()}`,
    "data-ai-hint": data.titre.toLowerCase().substring(0,15).replace(/\s+/g, ' '),
    targetLocationIds: data.targetLocationIds || [] 
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
    return { ...services[serviceIndex] };
  }
  return undefined;
};
export const deleteService = async (id: string): Promise<boolean> => {
    const initialLength = services.length;
    services = services.filter(s => s.id !== id);
    orders = orders.filter(o => o.serviceId !== id);
    return services.length < initialLength;
};

// --- Order Management --- (Still uses in-memory data)
let orders: Order[] = [
  { id: 'order-001', serviceId: 'svc-taxi', hostId: 'host-01', chambreTableId: 'room-101', clientNom: 'Alice Wonderland', userId: 'user-client-01', donneesFormulaire: JSON.stringify({ persons: 2, date: '2024-08-15', time: '10:00' }), dateHeure: new Date(Date.now() - 3600000 * 2).toISOString(), status: 'pending', prix: 50 },
  { id: 'order-002', serviceId: 'svc-breakfast', hostId: 'host-01', chambreTableId: 'room-102', clientNom: 'Bob The Builder', userId: 'user-client-02', donneesFormulaire: JSON.stringify({ dish: "Continental Breakfast", notes: "Extra orange juice"}), dateHeure: new Date(Date.now() - 3600000 * 5).toISOString(), status: 'completed', prix: 25},
  { id: 'order-003', serviceId: 'svc-pizza', hostId: 'host-02', chambreTableId: 'table-5', clientNom: 'Alice Wonderland', userId: 'user-client-01', donneesFormulaire: JSON.stringify({dish: "Pepperoni Pizza", notes: "Extra cheese"}), dateHeure: new Date(Date.now() - 3600000 * 1).toISOString(), status: 'confirmed', prix: 18},
  { id: 'order-004', serviceId: 'svc-spa', hostId: 'host-01', chambreTableId: 'room-101', clientNom: 'Alice Wonderland', userId: 'user-client-01', donneesFormulaire: JSON.stringify({ persons: 1, date: '2024-09-10', time: '14:00' }), dateHeure: new Date().toISOString(), status: 'pending', prix: 150 },
  { id: 'order-005', serviceId: 'svc-citytour', hostId: 'host-01', chambreTableId: 'rt-reception-desk-01', clientNom: 'Bob The Builder', userId: 'user-client-02', donneesFormulaire: JSON.stringify({ participant_name: "Bob Builder", participant_age: "35" }), dateHeure: new Date(Date.now() - 3600000 * 24).toISOString(), status: 'completed', prix: 75 },
  { id: 'order-006', serviceId: 'svc-dynamic-info', hostId: 'host-1747669860022', chambreTableId: 'rt-dynamic-lobby', clientNom: 'Test Guest', userId: undefined, donneesFormulaire: JSON.stringify({ request_detail: "Need directions to the nearest ATM."}), dateHeure: new Date().toISOString(), status: 'pending'},
  { id: 'order-007', hostId: 'host-1747669860022', serviceId: 'svc-dynamic-roomclean', chambreTableId: 'rt-dynamic-room1', clientNom: 'Dynamic Test Client', userId: 'user-dynamic-client-01', donneesFormulaire: '{}', dateHeure: new Date(Date.now() - 3600000 * 3).toISOString(), status: 'completed' },
];

export const getOrders = async (
  hostId: string,
  filters?: {
    status?: OrderStatus | "all";
    categoryId?: string;
    serviceId?: string;
    clientName?: string;
  }
): Promise<Order[]> => {
  let filteredOrders = [...orders].filter(o => o.hostId === hostId);

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
  if (!clientName) return []; 
  const clientOrders = [...orders].filter(o => 
    o.hostId === hostId && 
    o.clientNom && 
    o.clientNom.toLowerCase() === clientName.toLowerCase()
  );
  return clientOrders.sort((a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime());
};

export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
  return [...orders].filter(o => o.userId === userId)
               .sort((a,b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime());
};

export const addOrder = async (data: Omit<Order, 'id' | 'dateHeure' | 'status'>): Promise<Order> => {
  const serviceDetails = await getServiceById(data.serviceId);
  const newOrder: Order = {
    ...data,
    id: `order-${Date.now()}`,
    dateHeure: new Date().toISOString(),
    status: 'pending', 
    prix: serviceDetails?.prix, 
    userId: data.userId 
  };
  orders.push(newOrder);
  return newOrder;
};
export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order | undefined> => {
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex > -1) {
    orders[orderIndex].status = status;
    return { ...orders[orderIndex] };
  }
  return undefined;
};

// --- Client Management (Host Side) --- (Still uses in-memory data)
let clients: Client[] = [
    { id: 'client-mock-1', hostId: 'host-01', nom: 'Alice Wonderland', email: 'client1@example.com', type: 'heberge', dateArrivee: '2024-07-10', dateDepart: '2024-07-15', locationId: 'room-101', notes: 'Prefers quiet room. Likes extra pillows.', credit: 50 },
    { id: 'client-mock-2', hostId: 'host-01', nom: 'Bob The Builder', email: 'client2@example.com', type: 'heberge', dateArrivee: '2024-07-12', dateDepart: '2024-07-14', locationId: 'room-102', credit: 0 },
    { id: 'client-mock-3', hostId: 'host-02', nom: 'Charlie Passager', telephone: '+1123456789', type: 'passager', notes: 'Regular for lunch on Fridays.', credit: 10 },
    { id: 'client-mock-4', hostId: 'host-01', nom: 'Diana Visitor', email: 'diana@example.com', type: 'passager', notes: 'Interested in spa services.'},
    { id: 'client-mock-dynamic', hostId: 'host-1747669860022', nom: 'Dynamic Test Client', email: 'dynamic_client@example.com', type: 'heberge', dateArrivee: '2024-08-01', dateDepart: '2024-08-05', locationId: 'rt-dynamic-room1', notes: 'Testing client for dynamic host.', credit: 100 },
    { id: 'client-user-client-01', hostId: 'host-01', nom: 'Alice Wonderland', email: 'client1@example.com', type: 'heberge', dateArrivee: '2024-08-01', dateDepart: '2024-08-10', locationId: 'room-101', credit: 20 },
    { id: 'client-user-client-02', hostId: 'host-01', nom: 'Bob The Builder', email: 'client2@example.com', type: 'passager', notes: 'Frequent visitor to the pool bar.' },
];

export const getClients = async (hostId: string): Promise<Client[]> => {
  return [...clients].filter(c => c.hostId === hostId).sort((a,b) => a.nom.localeCompare(b.nom));
};

export const getClientById = async (clientId: string): Promise<Client | undefined> => {
  return clients.find(c => c.id === clientId);
};

export const getClientRecordsByEmail = async (email: string): Promise<Client[]> => {
  return [...clients].filter(c => c.email?.toLowerCase() === email.toLowerCase())
                .sort((a,b) => a.nom.localeCompare(b.nom));
};

export const addClientData = async (clientData: Omit<Client, 'id' | 'documents'>): Promise<Client> => {
  const newClient: Client = { ...clientData, id: `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` };
  clients.push(newClient);
  return newClient;
};

export const updateClientData = async (clientId: string, clientData: Partial<Omit<Client, 'id' | 'hostId' | 'documents'>>): Promise<Client | undefined> => {
  const clientIndex = clients.findIndex(c => c.id === clientId);
  if (clientIndex > -1) {
    clients[clientIndex] = { ...clients[clientIndex], ...clientData };
    return { ...clients[clientIndex] };
  }
  return undefined;
};

export const deleteClientData = async (clientId: string): Promise<boolean> => {
  const initialLength = clients.length;
  clients = clients.filter(c => c.id !== clientId);
  return clients.length < initialLength;
};

console.log("Data layer initialized. User and Host management reverted to in-memory. Other entities remain in-memory.");
