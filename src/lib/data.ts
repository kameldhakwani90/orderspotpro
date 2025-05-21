
// src/lib/data.ts
import type { User, Site, Host, RoomOrTable, ServiceCategory, CustomForm, FormField, Service, Order, OrderStatus, Client, ClientType, Reservation, ReservationStatus } from './types';
// Firestore imports are removed as we are using in-memory data for now
// import { db } from './firebase';
// import { collection, getDocs, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';

const log = (message: string, data?: any) => {
  console.log(`[Data Layer] ${new Date().toISOString()}: ${message}`, data !== undefined ? data : '');
}
log("Data layer initialized. Using in-memory data for ALL entities.");

// --- User Management (In-memory) ---
let users: User[] = [
  { id: 'user-admin-01', email: 'kamel@gmail.com', nom: 'Kamel Admin', role: 'admin', motDePasse: '0000' },
  { id: 'user-host-01', email: 'manager@paradise.com', nom: 'Paradise Manager', role: 'host', hostId: 'host-01-inmem', motDePasse: '1234' },
  { id: 'user-host-02', email: 'contact@delice.com', nom: 'Delice Owner', role: 'host', hostId: 'host-02-inmem', motDePasse: '1234' },
  { id: 'user-dynamic-host-01', email: 'dynamic.host@example.com', nom: 'Dynamic Test Host', role: 'host', hostId: 'host-1747669860022', motDePasse: '1234' },
  { id: 'user-client-01', email: 'client1@example.com', nom: 'Alice Wonderland', role: 'client', motDePasse: '1234' },
  { id: 'user-client-02', email: 'client2@example.com', nom: 'Bob The Builder', role: 'client', motDePasse: '1234' },
  { id: 'user-dynamic-client-01', email: 'dynamic_client@example.com', nom: 'Dynamic Test Client', role: 'client', motDePasse: '1234' },
];

export const getUserByEmail = async (email: string): Promise<User | undefined> => {
  log(`getUserByEmail called for: ${email} (in-memory)`);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    const userData = { ...user }; // Corrected: Added space
    if (!userData.motDePasse && (user as any).password) {
      userData.motDePasse = (user as any).password;
    }
    if (!userData.nom && userData.email) {
        userData.nom = userData.email.split('@')[0]; // Default nom
    }
    return userData;
  }
  return undefined;
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  log(`getUserById called for: ${id} (in-memory)`);
  const user = users.find(u => u.id === id);
   if (user) {
    const userData = { ...user };
    if (!userData.motDePasse && (user as any).password) {
      userData.motDePasse = (user as any).password;
    }
    if (!userData.nom && userData.email) {
        userData.nom = userData.email.split('@')[0];
    }
    return userData;
  }
  return undefined;
};

export const getUsers = async (): Promise<User[]> => {
  log(`getUsers called (in-memory). Returning ${users.length} users.`);
  return [...users].sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
};

export const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
  log(`addUser called for: ${userData.email} (in-memory)`);
  const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
  if (existingUser) {
    log(`User with email ${userData.email} already exists. Updating existing user (in-memory).`);
    existingUser.nom = userData.nom;
    existingUser.role = userData.role;
    existingUser.hostId = userData.hostId || undefined;
    existingUser.motDePasse = userData.motDePasse;
    return { ...existingUser };
  }
  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...userData,
  };
  users.push(newUser);
  log(`User ${newUser.email} added (in-memory) with ID ${newUser.id}.`);
  return { ...newUser };
};

export const updateUser = async (userId: string, userData: Partial<Omit<User, 'id'>>): Promise<User | undefined> => {
  log(`updateUser called for ID: ${userId} (in-memory) with data:`, userData);
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    const updatedUser = { ...users[userIndex], ...userData };
    // Don't update password if it's not provided or empty in userData
    if (!userData.motDePasse || userData.motDePasse.trim() === '') {
        // Keep original password by not including motDePasse in the spread if it's not changing
    } else {
        updatedUser.motDePasse = userData.motDePasse.trim();
    }
    users[userIndex] = updatedUser;
    log(`User ${userId} updated (in-memory).`);
    return { ...users[userIndex] };
  }
  log(`User ${userId} not found for update (in-memory).`);
  return undefined;
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  log(`deleteUser called for ID: ${userId} (in-memory)`);
  const initialLength = users.length;
  users = users.filter(u => u.id !== userId);
  if (users.length < initialLength) {
    log(`User ${userId} deleted (in-memory).`);
    return true;
  }
  log(`User ${userId} not found for deletion (in-memory).`);
  return false;
};

// --- Host Management (In-memory) ---
let hosts: Host[] = [
  { hostId: 'host-01-inmem', nom: 'Paradise Beach Resort (In-Mem)', email: 'manager@paradise.com' },
  { hostId: 'host-02-inmem', nom: 'Le Delice Downtown (In-Mem)', email: 'contact@delice.com' },
  { hostId: 'host-1747669860022', nom: 'Dynamic Test Est. (In-Mem)', email: 'dynamic.host@example.com' },
];

export const getHosts = async (): Promise<Host[]> => {
  log(`getHosts called (in-memory). Returning ${hosts.length} hosts.`);
  return [...hosts].sort((a, b) => a.nom.localeCompare(b.nom));
};

export const getHostById = async (hostId: string): Promise<Host | undefined> => {
  log(`getHostById called for: ${hostId} (in-memory)`);
  return hosts.find(h => h.hostId === hostId);
};

export const addHost = async (hostData: Omit<Host, 'hostId'>): Promise<Host> => {
  log(`addHost called for: ${hostData.email} (in-memory)`);
  const existingHostByEmail = hosts.find(h => h.email.toLowerCase() === hostData.email.toLowerCase());
  if (existingHostByEmail) {
      log(`Host with email ${hostData.email} already exists. Updating name if different.`);
      if (existingHostByEmail.nom !== hostData.nom) {
          existingHostByEmail.nom = hostData.nom;
      }
      // Ensure associated user is updated or created (in-memory)
      let associatedUser = users.find(u => u.email.toLowerCase() === existingHostByEmail.email.toLowerCase());
      if (associatedUser) {
          await updateUser(associatedUser.id, { nom: existingHostByEmail.nom, role: 'host', hostId: existingHostByEmail.hostId });
      } else {
          await addUser({ email: existingHostByEmail.email, nom: existingHostByEmail.nom, role: 'host', hostId: existingHostByEmail.hostId, motDePasse: '1234' });
      }
      return { ...existingHostByEmail };
  }

  const newHost: Host = {
    hostId: `host-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...hostData,
  };
  hosts.push(newHost);
  log(`Host ${newHost.email} added (in-memory) with ID ${newHost.hostId}.`);
  // Create associated user (in-memory)
  await addUser({
    email: newHost.email,
    nom: newHost.nom,
    role: 'host',
    hostId: newHost.hostId,
    motDePasse: '1234', // Default password
  });
  return { ...newHost };
};

export const updateHost = async (hostId: string, hostData: Partial<Omit<Host, 'hostId'>>): Promise<Host | undefined> => {
  log(`updateHost called for ID: ${hostId} (in-memory) with data:`, hostData);
  const hostIndex = hosts.findIndex(h => h.hostId === hostId);
  if (hostIndex > -1) {
    const originalHostData = { ...hosts[hostIndex] };
    hosts[hostIndex] = { ...hosts[hostIndex], ...hostData };
    log(`Host ${hostId} updated (in-memory).`);

    // Update associated user if email or name changed (in-memory)
    const updatedHost = hosts[hostIndex];
    if ((hostData.email && hostData.email !== originalHostData.email) || (hostData.nom && hostData.nom !== originalHostData.nom)) {
        let userToUpdate = users.find(u => u.email.toLowerCase() === originalHostData.email.toLowerCase() && u.hostId === hostId);
        if (userToUpdate) {
            await updateUser(userToUpdate.id, {
                email: updatedHost.email, // Use updated email if changed
                nom: updatedHost.nom,     // Use updated name if changed
            });
            log(`Associated user for host ${hostId} also updated (in-memory).`);
        } else if (hostData.email && hostData.email !== originalHostData.email) { // If email changed, try finding user by new email
            userToUpdate = users.find(u => u.email.toLowerCase() === updatedHost.email.toLowerCase() && u.hostId === hostId);
            if (userToUpdate) {
                await updateUser(userToUpdate.id, { nom: updatedHost.nom });
                log(`Associated user for host ${hostId} found by new email and updated (in-memory).`);
            }
        }
    }
    return { ...hosts[hostIndex] };
  }
  log(`Host ${hostId} not found for update (in-memory).`);
  return undefined;
};

export const deleteHost = async (hostId: string): Promise<boolean> => {
  log(`deleteHost called for ID: ${hostId} (in-memory)`);
  const hostToDelete = hosts.find(h => h.hostId === hostId);
  if (!hostToDelete) {
    log(`Host ${hostId} not found for deletion (in-memory).`);
    return false;
  }

  // Delete associated user (in-memory)
  const userToDelete = users.find(u => u.hostId === hostId); // Find by hostId association
  if (userToDelete) {
    await deleteUser(userToDelete.id);
    log(`Associated user ${userToDelete.email} deleted (in-memory).`);
  }

  const initialLength = hosts.length;
  hosts = hosts.filter(h => h.hostId !== hostId);
  const hostDeleted = hosts.length < initialLength;

  if (hostDeleted) {
    log(`Host ${hostId} deleted (in-memory).`);
    // Cascade delete for related in-memory collections
    sites = sites.filter(s => s.hostId !== hostId);
    roomsOrTables = roomsOrTables.filter(rt => rt.hostId !== hostId);
    serviceCategories = serviceCategories.filter(sc => sc.hostId !== hostId);
    const formsForHost = customForms.filter(cf => cf.hostId === hostId);
    const formIdsForHost = formsForHost.map(f => f.id);
    formFields = formFields.filter(ff => !formIdsForHost.includes(ff.formulaireId));
    customForms = customForms.filter(cf => cf.hostId !== hostId);
    services = services.filter(s => s.hostId !== hostId);
    orders = orders.filter(o => o.hostId !== hostId);
    clients = clients.filter(c => c.hostId !== hostId);
    reservations = reservations.filter(r => r.hostId !== hostId);
    log(`Cascaded delete for in-memory data related to host ${hostId}.`);
  }
  return hostDeleted;
};


// --- Site Management (Global Sites for Admin) --- (In-memory data)
let sites: Site[] = [
  { siteId: 'site-01', nom: 'Paradise Beach Resort (In-Mem)', hostId: 'host-01-inmem' },
  { siteId: 'site-02', nom: 'Le Delice Downtown (In-Mem)', hostId: 'host-02-inmem' },
  { siteId: 'site-dynamic-01', nom: 'Dynamic Test Establishment (In-Mem)', hostId: 'host-1747669860022' },
];

export const getSites = async (hostIdParam?: string): Promise<Site[]> => {
  log(`getSites called. HostIdParam: ${hostIdParam}. Using in-memory data.`);
  if (hostIdParam) return sites.filter(s => s.hostId === hostIdParam);
  return [...sites].sort((a,b) => a.nom.localeCompare(b.nom));
};
export const getSiteById = async (siteId: string): Promise<Site | undefined> => {
  log(`getSiteById called for: ${siteId}. Using in-memory data.`);
    return sites.find(s => s.siteId === siteId);
};
export const addSite = async (siteData: Omit<Site, 'siteId'>): Promise<Site> => {
  log(`addSite called. Data: ${JSON.stringify(siteData)}. Using in-memory data.`);
  const newSite: Site = { ...siteData, siteId: `globalsite-${Date.now()}-${Math.random().toString(36).substring(2, 5)}` };
  sites.push(newSite);
  return newSite;
};
export const updateSite = async (siteId: string, siteData: Partial<Omit<Site, 'siteId'>>): Promise<Site | undefined> => {
  log(`updateSite called for ID: ${siteId}. Using in-memory data.`);
  const siteIndex = sites.findIndex(s => s.siteId === siteId);
  if (siteIndex > -1) {
    sites[siteIndex] = { ...sites[siteIndex], ...siteData };
    return sites[siteIndex];
  }
  return undefined;
};
export const deleteSiteInData = async (siteId: string): Promise<boolean> => {
    log(`deleteSiteInData called for: ${siteId}. Using in-memory data.`);
    const initialLength = sites.length;
    sites = sites.filter(s => s.siteId !== siteId);
    // Also remove RoomOrTable entries that reference this global site
    roomsOrTables = roomsOrTables.filter(rt => rt.globalSiteId !== siteId);
    return sites.length < initialLength;
};


// --- RoomOrTable Management (Host Locations) --- (In-memory data)
let roomsOrTables: RoomOrTable[] = [
  // Paradise Beach Resort (host-01-inmem)
  { id: 'rt-paradise-main', nom: 'Paradise Resort Main Area', type: 'Site', hostId: 'host-01-inmem', globalSiteId: 'site-01', parentLocationId: undefined, urlPersonnalise: `/client/host-01-inmem/rt-paradise-main`, capacity: 200},
  { id: 'rt-lobby-01', nom: 'Lobby Zone', type: 'Site', hostId: 'host-01-inmem', globalSiteId: 'site-01', parentLocationId: 'rt-paradise-main', urlPersonnalise: `/client/host-01-inmem/rt-lobby-01`, capacity: 50},
  { id: 'rt-reception-desk-01', nom: 'Reception Desk Area', type: 'Site', hostId: 'host-01-inmem', globalSiteId: 'site-01', parentLocationId: 'rt-lobby-01', urlPersonnalise: `/client/host-01-inmem/rt-reception-desk-01`, capacity: 10},
  { id: 'room-101', nom: 'Chambre 101', type: 'Chambre', hostId: 'host-01-inmem', globalSiteId: 'site-01', parentLocationId: 'rt-lobby-01', urlPersonnalise: `/client/host-01-inmem/room-101`, capacity: 2 },
  { id: 'room-102', nom: 'Chambre 102 (Suite)', type: 'Chambre', hostId: 'host-01-inmem', globalSiteId: 'site-01', parentLocationId: 'rt-lobby-01', urlPersonnalise: `/client/host-01-inmem/room-102`, capacity: 4 },
  { id: 'rt-pool-01', nom: 'Pool Area', type: 'Site', hostId: 'host-01-inmem', globalSiteId: 'site-01', parentLocationId: 'rt-paradise-main', urlPersonnalise: `/client/host-01-inmem/rt-pool-01`, capacity: 100},
  { id: 'table-pool-1', nom: 'Table Piscine 1', type: 'Table', hostId: 'host-01-inmem', globalSiteId: 'site-01', parentLocationId: 'rt-pool-01', urlPersonnalise: `/client/host-01-inmem/table-pool-1`, capacity: 4 },
  // Le Delice Downtown (host-02-inmem)
  { id: 'rt-delice-main', nom: 'Delice Main Dining', type: 'Site', hostId: 'host-02-inmem', globalSiteId: 'site-02', parentLocationId: undefined, urlPersonnalise: `/client/host-02-inmem/rt-delice-main`, capacity: 80},
  { id: 'table-5', nom: 'Table 5', type: 'Table', hostId: 'host-02-inmem', globalSiteId: 'site-02', parentLocationId: 'rt-delice-main', urlPersonnalise: `/client/host-02-inmem/table-5`, capacity: 2 },
  { id: 'table-vip', nom: 'VIP Table', type: 'Table', hostId: 'host-02-inmem', globalSiteId: 'site-02', parentLocationId: 'rt-delice-main', urlPersonnalise: `/client/host-02-inmem/table-vip`, capacity: 8 },
  // Dynamic Test Establishment (host-1747669860022)
  { id: 'rt-dynamic-main', nom: 'Dynamic Main Area', type: 'Site', hostId: 'host-1747669860022', globalSiteId: 'site-dynamic-01', parentLocationId: undefined, urlPersonnalise: `/client/host-1747669860022/rt-dynamic-main`, capacity: 150},
  { id: 'rt-dynamic-lobby', nom: 'Dynamic Lobby', type: 'Site', hostId: 'host-1747669860022', globalSiteId: 'site-dynamic-01', parentLocationId: 'rt-dynamic-main', urlPersonnalise: `/client/host-1747669860022/rt-dynamic-lobby`, capacity: 30},
  { id: 'rt-dynamic-room1', nom: 'Dynamic Room 101', type: 'Chambre', hostId: 'host-1747669860022', globalSiteId: 'site-dynamic-01', parentLocationId: 'rt-dynamic-lobby', urlPersonnalise: `/client/host-1747669860022/rt-dynamic-room1`, capacity: 2},
  { id: 'rt-dynamic-table1', nom: 'Dynamic Table Alpha', type: 'Table', hostId: 'host-1747669860022', globalSiteId: 'site-dynamic-01', parentLocationId: 'rt-dynamic-main', urlPersonnalise: `/client/host-1747669860022/rt-dynamic-table1`, capacity: 6},
];
export const getRoomsOrTables = async (hostId: string, globalSiteIdParam?: string): Promise<RoomOrTable[]> => {
  log(`getRoomsOrTables called for host: ${hostId}, globalSiteId: ${globalSiteIdParam}. Using in-memory data.`);
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
  log(`getRoomOrTableById called for: ${id}. Using in-memory data.`);
    return roomsOrTables.find(rt => rt.id === id);
};
export const addRoomOrTable = async (data: Omit<RoomOrTable, 'id' | 'urlPersonnalise'>): Promise<RoomOrTable> => {
  log(`addRoomOrTable called. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  const newId = `rt-${data.type.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  const newRoomOrTable: RoomOrTable = {
    ...data,
    id: newId,
    urlPersonnalise: `/client/${data.hostId}/${newId}`,
    capacity: data.capacity
  };
  roomsOrTables.push(newRoomOrTable);
  return newRoomOrTable;
};
export const updateRoomOrTable = async (id: string, data: Partial<Omit<RoomOrTable, 'id' | 'urlPersonnalise' | 'hostId'>>): Promise<RoomOrTable | undefined> => {
  log(`updateRoomOrTable called for ID: ${id}. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  const itemIndex = roomsOrTables.findIndex(rt => rt.id === id);
  if (itemIndex > -1) {
    const currentItem = roomsOrTables[itemIndex];
    roomsOrTables[itemIndex] = {
        ...currentItem,
        ...data,
        nom: data.nom !== undefined ? data.nom : currentItem.nom,
        type: data.type !== undefined ? data.type : currentItem.type,
        globalSiteId: data.globalSiteId !== undefined ? data.globalSiteId : currentItem.globalSiteId,
        parentLocationId: data.parentLocationId !== undefined ? data.parentLocationId : currentItem.parentLocationId,
        capacity: data.capacity !== undefined ? data.capacity : currentItem.capacity
    };
    return { ...roomsOrTables[itemIndex] };
  }
  return undefined;
};
export const deleteRoomOrTable = async (id: string): Promise<boolean> => {
    log(`deleteRoomOrTable called for: ${id}. Using in-memory data.`);
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
        const linkedReservations = reservations.filter(r => r.locationId === id);
        if (linkedReservations.length > 0) {
            log(`Warning: Deleting location ${id} which has ${linkedReservations.length} associated reservations.`);
        }
    }
    roomsOrTables = roomsOrTables.filter(rt => rt.id !== id);
    return roomsOrTables.length < initialLength;
};

// --- ServiceCategory Management --- (In-memory data)
let serviceCategories: ServiceCategory[] = [
  { id: 'cat-roomservice-inmem', nom: 'Room Service (In-Mem)', hostId: 'host-01-inmem', image: 'https://placehold.co/300x200.png', "data-ai-hint": "room service" },
  { id: 'cat-transport-inmem', nom: 'Transport & Tours (In-Mem)', hostId: 'host-01-inmem', image: 'https://placehold.co/300x200.png', "data-ai-hint": "transportation tour" },
  { id: 'cat-food-inmem', nom: 'Food Menu (In-Mem)', hostId: 'host-02-inmem', image: 'https://placehold.co/300x200.png', "data-ai-hint": "food menu" },
  { id: 'cat-drinks-inmem', nom: 'Beverages (In-Mem)', hostId: 'host-02-inmem', image: 'https://placehold.co/300x200.png', "data-ai-hint": "drinks beverages" },
  { id: 'cat-activities-inmem', nom: 'Resort Activities (In-Mem)', hostId: 'host-01-inmem', image: 'https://placehold.co/300x200.png', "data-ai-hint": "activities leisure" },
  { id: 'cat-poolside-inmem', nom: 'Poolside Snacks & Drinks (In-Mem)', hostId: 'host-01-inmem', image: 'https://placehold.co/300x200.png', "data-ai-hint": "poolside snacks" },
  { id: 'cat-dynamic-main-inmem', nom: 'General Services (Dynamic Host)', hostId: 'host-1747669860022', image: 'https://placehold.co/300x200.png', "data-ai-hint": "general services" },
];
export const getServiceCategories = async (hostId: string): Promise<ServiceCategory[]> => {
  log(`getServiceCategories called for host: ${hostId}. Using in-memory data.`);
  return [...serviceCategories].filter(sc => sc.hostId === hostId).sort((a,b) => a.nom.localeCompare(b.nom));
};
export const addServiceCategory = async (data: Omit<ServiceCategory, 'id' | 'data-ai-hint'>): Promise<ServiceCategory> => {
  log(`addServiceCategory called. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  const newCategory: ServiceCategory = { ...data, id: `cat-${Date.now()}`, "data-ai-hint": data.nom.toLowerCase().substring(0,15).replace(/\s+/g, ' ') };
  serviceCategories.push(newCategory);
  return newCategory;
};
export const updateServiceCategory = async (id: string, data: Partial<Omit<ServiceCategory, 'id' | 'hostId' | 'data-ai-hint'>>): Promise<ServiceCategory | undefined> => {
  log(`updateServiceCategory called for ID: ${id}. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  const catIndex = serviceCategories.findIndex(sc => sc.id === id);
  if (catIndex > -1) {
    serviceCategories[catIndex] = { ...serviceCategories[catIndex], ...data, "data-ai-hint": data.nom ? data.nom.toLowerCase().substring(0,15).replace(/\s+/g, ' ') : serviceCategories[catIndex]["data-ai-hint"] };
    return { ...serviceCategories[catIndex] };
  }
  return undefined;
};
export const deleteServiceCategory = async (id: string): Promise<boolean> => {
    log(`deleteServiceCategory called for: ${id}. Using in-memory data.`);
    const initialLength = serviceCategories.length;
    serviceCategories = serviceCategories.filter(sc => sc.id !== id);
    services = services.map(s => s.categorieId === id ? {...s, categorieId: ''} : s);
    return serviceCategories.length < initialLength;
};
export const getServiceCategoryById = async (id: string): Promise<ServiceCategory | undefined> => {
  log(`getServiceCategoryById called for: ${id}. Using in-memory data.`);
  return serviceCategories.find(sc => sc.id === id);
};

// --- CustomForm Management --- (In-memory data)
let customForms: CustomForm[] = [
  { id: 'form-booking-inmem', nom: 'Booking Details (In-Mem)', hostId: 'host-01-inmem' },
  { id: 'form-foodorder-inmem', nom: 'Food Order Preferences (In-Mem)', hostId: 'host-02-inmem' },
  { id: 'form-generic-info-inmem', nom: 'General Inquiry (In-Mem)', hostId: 'host-01-inmem' },
  { id: 'form-no-fields-inmem', nom: 'Simple Confirmation (No Fields) (In-Mem)', hostId: 'host-01-inmem' },
  { id: 'form-activity-signup-inmem', nom: 'Activity Sign-up Details (In-Mem)', hostId: 'host-01-inmem'},
  { id: 'form-dynamic-request-inmem', nom: 'Dynamic Service Request (Dynamic Host)', hostId: 'host-1747669860022'},
];
export const getCustomForms = async (hostId: string): Promise<CustomForm[]> => {
  log(`getCustomForms called for host: ${hostId}. Using in-memory data.`);
  return [...customForms].filter(cf => cf.hostId === hostId).sort((a,b) => a.nom.localeCompare(b.nom));
};
export const addCustomForm = async (data: Omit<CustomForm, 'id'>): Promise<CustomForm> => {
  log(`addCustomForm called. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  const newForm: CustomForm = { ...data, id: `form-${Date.now()}` };
  customForms.push(newForm);
  return newForm;
};
export const getFormById = async (formId: string): Promise<CustomForm | undefined> => {
  log(`getFormById called for: ${formId}. Using in-memory data.`);
  return customForms.find(f => f.id === formId);
};
export const updateCustomForm = async (id: string, data: Partial<Omit<CustomForm, 'id' | 'hostId'>>): Promise<CustomForm | undefined> => {
  log(`updateCustomForm called for ID: ${id}. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  const formIndex = customForms.findIndex(cf => cf.id === id);
  if (formIndex > -1) {
    customForms[formIndex] = { ...customForms[formIndex], ...data };
    return { ...customForms[formIndex] };
  }
  return undefined;
};
export const deleteCustomForm = async (id: string): Promise<boolean> => {
    log(`deleteCustomForm called for: ${id}. Using in-memory data.`);
    const initialLength = customForms.length;
    customForms = customForms.filter(cf => cf.id !== id);
    formFields = formFields.filter(ff => ff.formulaireId !== id);
    services = services.map(s => s.formulaireId === id ? {...s, formulaireId: undefined} : s);
    return customForms.length < initialLength;
};

// --- FormField Management --- (In-memory data)
let formFields: FormField[] = [
  { id: 'field-persons-inmem', formulaireId: 'form-booking-inmem', label: 'Number of Persons', type: 'number', obligatoire: true, ordre: 1, placeholder: 'e.g., 2' },
  { id: 'field-date-inmem', formulaireId: 'form-booking-inmem', label: 'Desired Date', type: 'date', obligatoire: true, ordre: 2 },
  { id: 'field-time-inmem', formulaireId: 'form-booking-inmem', label: 'Preferred Time', type: 'time', obligatoire: false, ordre: 3 },
  { id: 'field-dish-inmem', formulaireId: 'form-foodorder-inmem', label: 'Main Dish Choice', type: 'text', obligatoire: true, ordre: 1, placeholder: 'e.g., Pizza Margherita' },
  { id: 'field-notes-inmem', formulaireId: 'form-foodorder-inmem', label: 'Additional Notes/Allergies', type: 'textarea', obligatoire: false, ordre: 2, placeholder: 'e.g., No onions, gluten-free' },
  { id: 'field-name-generic-inmem', formulaireId: 'form-generic-info-inmem', label: 'Your Name', type: 'text', obligatoire: true, ordre: 1, placeholder: 'John Doe' },
  { id: 'field-email-generic-inmem', formulaireId: 'form-generic-info-inmem', label: 'Your Email', type: 'email', obligatoire: true, ordre: 2, placeholder: 'john.doe@example.com' },
  { id: 'field-message-generic-inmem', formulaireId: 'form-generic-info-inmem', label: 'Your Message/Question', type: 'textarea', obligatoire: true, ordre: 3, placeholder: 'Type your message here...' },
  { id: 'field-activity-name-inmem', formulaireId: 'form-activity-signup-inmem', label: 'Participant Full Name', type: 'text', obligatoire: true, ordre: 1},
  { id: 'field-activity-age-inmem', formulaireId: 'form-activity-signup-inmem', label: 'Participant Age', type: 'number', obligatoire: false, ordre: 2},
  { id: 'field-dynamic-detail-inmem', formulaireId: 'form-dynamic-request-inmem', label: 'Request Detail', type: 'textarea', obligatoire: true, ordre: 1, placeholder: 'Please describe your request...'},
];
export const getFormFields = async (formulaireId: string): Promise<FormField[]> => {
  log(`getFormFields called for formulaireId: ${formulaireId}. Using in-memory data.`);
  return [...formFields].filter(ff => ff.formulaireId === formulaireId).sort((a, b) => a.ordre - b.ordre);
};
export const addFormField = async (data: Omit<FormField, 'id'>): Promise<FormField> => {
  log(`addFormField called. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  const newField: FormField = { ...data, id: `field-${Date.now()}` };
  formFields.push(newField);
  return newField;
};
export const updateFormField = async (id: string, data: Partial<Omit<FormField, 'id' | 'formulaireId'>>): Promise<FormField | undefined> => {
  log(`updateFormField called for ID: ${id}. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  const fieldIndex = formFields.findIndex(ff => ff.id === id);
  if (fieldIndex > -1) {
    formFields[fieldIndex] = { ...formFields[fieldIndex], ...data };
    return { ...formFields[fieldIndex] };
  }
  return undefined;
};
export const deleteFormField = async (id: string): Promise<boolean> => {
    log(`deleteFormField called for: ${id}. Using in-memory data.`);
    const initialLength = formFields.length;
    formFields = formFields.filter(ff => ff.id !== id);
    return formFields.length < initialLength;
};

// --- Service Management --- (In-memory data)
let services: Service[] = [
  { id: 'svc-taxi-inmem', titre: 'Airport Taxi (In-Mem)', description: 'Book a taxi to or from the airport.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "taxi airport", categorieId: 'cat-transport-inmem', hostId: 'host-01-inmem', formulaireId: 'form-booking-inmem', prix: 50, targetLocationIds: [], loginRequired: true },
  { id: 'svc-breakfast-inmem', titre: 'In-Room Breakfast (In-Mem)', description: 'Order your breakfast selection.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "breakfast room", categorieId: 'cat-roomservice-inmem', hostId: 'host-01-inmem', formulaireId: 'form-foodorder-inmem', prix: 25, targetLocationIds: ['room-101', 'room-102'], loginRequired: false },
  { id: 'svc-pool-cocktails-inmem', titre: 'Poolside Cocktails (In-Mem)', description: 'Enjoy refreshing cocktails by the pool.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "cocktail pool", categorieId: 'cat-poolside-inmem', hostId: 'host-01-inmem', prix: 12, targetLocationIds: ['rt-pool-01'], loginRequired: false },
  { id: 'svc-pizza-inmem', titre: 'Artisan Pizza (In-Mem)', description: 'Delicious stone-baked pizza.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "pizza food", categorieId: 'cat-food-inmem', hostId: 'host-02-inmem', formulaireId: 'form-foodorder-inmem', prix: 18, targetLocationIds: [], loginRequired: false },
  { id: 'svc-water-restaurant-inmem', titre: 'Bottled Water (Restaurant - In-Mem)', description: 'Chilled spring water.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "water bottle", categorieId: 'cat-drinks-inmem', hostId: 'host-02-inmem', prix: 3, targetLocationIds: [], loginRequired: false },
  { id: 'svc-concierge-inmem', titre: 'Concierge Assistance (In-Mem)', description: 'Need help with bookings or local information?', image: 'https://placehold.co/600x400.png', "data-ai-hint": "concierge helpdesk", categorieId: 'cat-roomservice-inmem', hostId: 'host-01-inmem', formulaireId: 'form-generic-info-inmem', targetLocationIds: ['rt-lobby-01', 'rt-reception-desk-01'], loginRequired: true },
  { id: 'svc-spa-inmem', titre: 'Full Day Spa Package (In-Mem)', description: 'Indulge in a full day of relaxation.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "spa massage", categorieId: 'cat-activities-inmem', hostId: 'host-01-inmem', formulaireId: 'form-booking-inmem', prix: 150, targetLocationIds: [], loginRequired: true },
  { id: 'svc-citytour-inmem', titre: 'Guided City Tour (In-Mem)', description: 'Explore the city highlights.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "city tour", categorieId: 'cat-transport-inmem', hostId: 'host-01-inmem', formulaireId: 'form-activity-signup-inmem', prix: 75, targetLocationIds: ['rt-lobby-01', 'rt-reception-desk-01'], loginRequired: true },
  { id: 'svc-dynamic-info-inmem', titre: 'Info Desk (Dynamic Host)', description: 'Ask us anything!', image: 'https://placehold.co/600x400.png', "data-ai-hint": "information desk", categorieId: 'cat-dynamic-main-inmem', hostId: 'host-1747669860022', formulaireId: 'form-dynamic-request-inmem', targetLocationIds: ['rt-dynamic-lobby'], loginRequired: false},
  { id: 'svc-dynamic-roomclean-inmem', titre: 'Room Cleaning (Dynamic Host)', description: 'Schedule room cleaning.', image: 'https://placehold.co/600x400.png', "data-ai-hint": "room cleaning", categorieId: 'cat-dynamic-main-inmem', hostId: 'host-1747669860022', formulaireId: undefined, targetLocationIds: ['rt-dynamic-room1'], loginRequired: true},
];
export const getServices = async (
  hostId: string,
  clientCurrentLocationId?: string,
  categoryId?: string
): Promise<Service[]> => {
  log(`getServices called for host: ${hostId}, location: ${clientCurrentLocationId}, category: ${categoryId}. Using in-memory data.`);
  let hostServices = [...services].filter(s => s.hostId === hostId);

  if (clientCurrentLocationId) {
    const currentScannedLocation = await getRoomOrTableById(clientCurrentLocationId);
    if (!currentScannedLocation) {
      log(`Location with ID ${clientCurrentLocationId} not found for service filtering.`);
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
  log(`getServiceById called for: ${serviceId}. Using in-memory data.`);
  return services.find(s => s.id === serviceId);
};
export const addService = async (data: Omit<Service, 'id' | 'data-ai-hint'>): Promise<Service> => {
  log(`addService called. Data: ${JSON.stringify(data)}. Using in-memory data.`);
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
  log(`updateService called for ID: ${id}. Data: ${JSON.stringify(data)}. Using in-memory data.`);
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
    log(`deleteService called for: ${id}. Using in-memory data.`);
    const initialLength = services.length;
    services = services.filter(s => s.id !== id);
    orders = orders.filter(o => o.serviceId !== id);
    return services.length < initialLength;
};

// --- Order Management --- (In-memory data)
let orders: Order[] = [
  { id: 'order-001-inmem', serviceId: 'svc-taxi-inmem', hostId: 'host-01-inmem', chambreTableId: 'room-101', clientNom: 'Alice Wonderland', userId: 'user-client-01', donneesFormulaire: JSON.stringify({ persons: 2, date: '2024-08-15', time: '10:00' }), dateHeure: new Date(Date.now() - 3600000 * 2).toISOString(), status: 'pending', prix: 50 },
  { id: 'order-002-inmem', serviceId: 'svc-breakfast-inmem', hostId: 'host-01-inmem', chambreTableId: 'room-102', clientNom: 'Bob The Builder', userId: 'user-client-02', donneesFormulaire: JSON.stringify({ dish: "Continental Breakfast", notes: "Extra orange juice"}), dateHeure: new Date(Date.now() - 3600000 * 5).toISOString(), status: 'completed', prix: 25},
  { id: 'order-003-inmem', serviceId: 'svc-pizza-inmem', hostId: 'host-02-inmem', chambreTableId: 'table-5', clientNom: 'Alice Wonderland', userId: 'user-client-01', donneesFormulaire: JSON.stringify({dish: "Pepperoni Pizza", notes: "Extra cheese"}), dateHeure: new Date(Date.now() - 3600000 * 1).toISOString(), status: 'confirmed', prix: 18},
  { id: 'order-004-inmem', serviceId: 'svc-spa-inmem', hostId: 'host-01-inmem', chambreTableId: 'room-101', clientNom: 'Alice Wonderland', userId: 'user-client-01', donneesFormulaire: JSON.stringify({ persons: 1, date: '2024-09-10', time: '14:00' }), dateHeure: new Date().toISOString(), status: 'pending', prix: 150 },
  { id: 'order-005-inmem', serviceId: 'svc-citytour-inmem', hostId: 'host-01-inmem', chambreTableId: 'rt-reception-desk-01', clientNom: 'Bob The Builder', userId: 'user-client-02', donneesFormulaire: JSON.stringify({ participant_name: "Bob Builder", participant_age: "35" }), dateHeure: new Date(Date.now() - 3600000 * 24).toISOString(), status: 'completed', prix: 75 },
  { id: 'order-006-inmem', serviceId: 'svc-dynamic-info-inmem', hostId: 'host-1747669860022', chambreTableId: 'rt-dynamic-lobby', clientNom: 'Test Guest', userId: undefined, donneesFormulaire: JSON.stringify({ request_detail: "Need directions to the nearest ATM."}), dateHeure: new Date().toISOString(), status: 'pending'},
  { id: 'order-007-inmem', hostId: 'host-1747669860022', serviceId: 'svc-dynamic-roomclean-inmem', chambreTableId: 'rt-dynamic-room1', clientNom: 'Dynamic Test Client', userId: 'user-dynamic-client-01', donneesFormulaire: '{}', dateHeure: new Date(Date.now() - 3600000 * 3).toISOString(), status: 'completed' },
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
  log(`getOrders called for host: ${hostId}, filters: ${JSON.stringify(filters)}. Using in-memory data.`);
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
  log(`getOrdersByClientName called for host: ${hostId}, clientName: ${clientName}. Using in-memory data.`);
  if (!clientName) return [];
  const clientOrders = [...orders].filter(o =>
    o.hostId === hostId &&
    o.clientNom &&
    o.clientNom.toLowerCase() === clientName.toLowerCase()
  );
  return clientOrders.sort((a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime());
};
export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
  log(`getOrdersByUserId called for userId: ${userId}. Using in-memory data.`);
  return [...orders].filter(o => o.userId === userId)
               .sort((a,b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime());
};
export const addOrder = async (data: Omit<Order, 'id' | 'dateHeure' | 'status'>): Promise<Order> => {
  log(`addOrder called. Data: ${JSON.stringify(data)}. Using in-memory data.`);
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
  log(`updateOrderStatus called for orderId: ${orderId}, status: ${status}. Using in-memory data.`);
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex > -1) {
    orders[orderIndex].status = status;
    return { ...orders[orderIndex] };
  }
  return undefined;
};

// --- Client Management (Host Side) --- (In-memory data)
let clients: Client[] = [
    { id: 'client-mock-1-inmem', hostId: 'host-01-inmem', nom: 'Alice Wonderland (In-Mem)', email: 'client1@example.com', type: 'heberge', dateArrivee: '2024-07-10', dateDepart: '2024-07-15', locationId: 'room-101', notes: 'Prefers quiet room. Likes extra pillows.', credit: 50 },
    { id: 'client-mock-2-inmem', hostId: 'host-01-inmem', nom: 'Bob The Builder (In-Mem)', email: 'client2@example.com', type: 'heberge', dateArrivee: '2024-07-12', dateDepart: '2024-07-14', locationId: 'room-102', credit: 0 },
    { id: 'client-mock-3-inmem', hostId: 'host-02-inmem', nom: 'Charlie Passager (In-Mem)', telephone: '+1123456789', type: 'passager', notes: 'Regular for lunch on Fridays.', credit: 10 },
    { id: 'client-mock-4-inmem', hostId: 'host-01-inmem', nom: 'Diana Visitor (In-Mem)', email: 'diana@example.com', type: 'passager', notes: 'Interested in spa services.'},
    { id: 'client-mock-dynamic-inmem', hostId: 'host-1747669860022', nom: 'Dynamic Test Client (In-Mem)', email: 'dynamic_client@example.com', type: 'heberge', dateArrivee: '2024-08-01', dateDepart: '2024-08-05', locationId: 'rt-dynamic-room1', notes: 'Testing client for dynamic host.', credit: 100 },
];
export const getClients = async (hostId: string): Promise<Client[]> => {
  log(`getClients called for host: ${hostId}. Using in-memory data.`);
  return [...clients].filter(c => c.hostId === hostId).sort((a,b) => a.nom.localeCompare(b.nom));
};
export const getClientById = async (clientId: string): Promise<Client | undefined> => {
  log(`getClientById called for: ${clientId}. Using in-memory data.`);
  return clients.find(c => c.id === clientId);
};
export const getClientRecordsByEmail = async (email: string): Promise<Client[]> => {
  log(`getClientRecordsByEmail called for email: ${email}. Using in-memory data.`);
  return [...clients].filter(c => c.email?.toLowerCase() === email.toLowerCase())
                .sort((a,b) => a.nom.localeCompare(b.nom));
};
export const addClientData = async (clientData: Omit<Client, 'id' | 'documents'>): Promise<Client> => {
  log(`addClientData called. Data: ${JSON.stringify(clientData)}. Using in-memory data.`);
  const newClient: Client = { ...clientData, id: `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` };
  clients.push(newClient);
  return newClient;
};
export const updateClientData = async (clientId: string, clientData: Partial<Omit<Client, 'id' | 'hostId' | 'documents'>>): Promise<Client | undefined> => {
  log(`updateClientData called for ID: ${clientId}. Data: ${JSON.stringify(clientData)}. Using in-memory data.`);
  const clientIndex = clients.findIndex(c => c.id === clientId);
  if (clientIndex > -1) {
    clients[clientIndex] = { ...clients[clientIndex], ...clientData };
    return { ...clients[clientIndex] };
  }
  return undefined;
};
export const deleteClientData = async (clientId: string): Promise<boolean> => {
  log(`deleteClientData called for: ${clientId}. Using in-memory data.`);
  const initialLength = clients.length;
  clients = clients.filter(c => c.id !== clientId);
  return clients.length < initialLength;
};

// --- Reservation Management --- (In-memory data)
let reservations: Reservation[] = [
    { id: 'res-001-inmem', hostId: 'host-01-inmem', locationId: 'room-101', clientName: 'Alice Wonderland (In-Mem)', clientId: 'client-mock-1-inmem', dateArrivee: '2024-07-10', dateDepart: '2024-07-15', nombrePersonnes: 2, status: 'confirmed', notes: 'Early check-in requested' },
    { id: 'res-002-inmem', hostId: 'host-01-inmem', locationId: 'room-102', clientName: 'Bob The Builder (In-Mem)', clientId: 'client-mock-2-inmem', dateArrivee: '2024-07-12', dateDepart: '2024-07-14', nombrePersonnes: 1, animauxDomestiques: true, status: 'checked-in' },
    { id: 'res-003-inmem', hostId: 'host-1747669860022', locationId: 'rt-dynamic-room1', clientName: 'Dynamic Test Client (In-Mem)', clientId: 'client-mock-dynamic-inmem', dateArrivee: '2024-08-01', dateDepart: '2024-08-05', nombrePersonnes: 2, notes: "Needs a crib", status: 'pending' },
    { id: 'res-004-inmem', hostId: 'host-02-inmem', locationId: 'table-5', clientName: 'Charlie Passager (In-Mem)', clientId: 'client-mock-3-inmem', dateArrivee: '2024-07-20', dateDepart: '2024-07-20', nombrePersonnes: 4, status: 'confirmed', notes: 'Dinner reservation for 8 PM' },
];
export const getReservations = async (
  hostId: string,
  filters?: {
    locationId?: string;
    month?: number;
    year?: number;
  }
): Promise<Reservation[]> => {
  log(`getReservations called for host: ${hostId}, filters: ${JSON.stringify(filters)}. Using in-memory data.`);
  let hostReservations = reservations.filter(r => r.hostId === hostId);
  if (filters?.locationId) {
    hostReservations = hostReservations.filter(r => r.locationId === filters.locationId);
  }
  if (filters?.month !== undefined && filters?.year !== undefined) {
    hostReservations = hostReservations.filter(r => {
      const arrivalDate = new Date(r.dateArrivee + "T00:00:00Z"); // Assume dates are UTC for consistency
      const departureDate = new Date(r.dateDepart + "T00:00:00Z"); // Use start of day for comparison
      const monthStart = new Date(Date.UTC(filters.year!, filters.month!, 1));
      const monthEnd = new Date(Date.UTC(filters.year!, filters.month! + 1, 0, 23, 59, 59, 999)); // End of the last day of the month
      
      // Check for overlap: (StartA <= EndB) and (EndA >= StartB)
      return (arrivalDate <= monthEnd && departureDate >= monthStart);
    });
  }
  return [...hostReservations].sort((a,b) => new Date(a.dateArrivee).getTime() - new Date(b.dateArrivee).getTime());
};
export const addReservation = async (data: Omit<Reservation, 'id'>): Promise<Reservation> => {
  log(`addReservation called. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  const newReservation: Reservation = { ...data, id: `res-${Date.now()}` };
  reservations.push(newReservation);
  return newReservation;
};
export const updateReservation = async (id: string, data: Partial<Omit<Reservation, 'id' | 'hostId'>>): Promise<Reservation | undefined> => {
  log(`updateReservation called for ID: ${id}. Data: ${JSON.stringify(data)}. Using in-memory data.`);
  const resIndex = reservations.findIndex(r => r.id === id);
  if (resIndex > -1) {
    reservations[resIndex] = { ...reservations[resIndex], ...data };
    return { ...reservations[resIndex] };
  }
  return undefined;
};
export const deleteReservation = async (id: string): Promise<boolean> => {
  log(`deleteReservation called for: ${id}. Using in-memory data.`);
  const initialLength = reservations.length;
  reservations = reservations.filter(r => r.id !== id);
  return reservations.length < initialLength;
};

// --- General Data Logging ---
log("Initial in-memory data loaded/defined.");
log(`Users: ${users.length}, Hosts: ${hosts.length}, Global Sites: ${sites.length}, Locations: ${roomsOrTables.length}`);
log(`Categories: ${serviceCategories.length}, Forms: ${customForms.length}, Fields: ${formFields.length}, Services: ${services.length}`);
log(`Orders: ${orders.length}, Clients: ${clients.length}, Reservations: ${reservations.length}`);
