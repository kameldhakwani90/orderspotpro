// DonnÃ©es pour OrderSpot Pro avec exports pour scripts

export const mockProducts = [
  {
    id: '1',
    name: 'CafÃ© Expresso',
    price: 2.50,
    category: 'boissons',
    description: 'CafÃ© expresso italien authentique',
    imageUrl: '/images/coffee.jpg',
    isActive: true
  },
  {
    id: '2',
    name: 'Croissant',
    price: 1.80,
    category: 'viennoiseries',
    description: 'Croissant artisanal au beurre',
    imageUrl: '/images/croissant.jpg',
    isActive: true
  }
];

export const mockHosts = [
  {
    id: '1',
    name: 'Restaurant Le Gourmet',
    email: 'contact@legourmet.com',
    phone: '+33123456789',
    address: '123 Rue de la Paix, Paris',
    isActive: true
  }
];

export const mockClients = [
  {
    id: '1',
    name: 'Jean Durand',
    email: 'jean.durand@email.com',
    phone: '+33611223344',
    hostId: '1'
  }
];

export const mockUsers = [
  {
    id: '1',
    email: 'admin@orderspot.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    email: 'user@orderspot.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const mockSites = [
  {
    id: '1',
    name: 'Site Principal',
    url: 'https://orderspot.com',
    hostId: '1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface Host {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  isActive: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  hostId: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Site {
  id: string;
  name: string;
  url: string;
  hostId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// FONCTIONS MANQUANTES AJOUTÃ‰ES
export function getAllProducts(): Product[] {
  return mockProducts;
}

export function getAllHosts(): Host[] {
  return mockHosts;
}

export function getAllClients(): Client[] {
  return mockClients;
}

export function getAllUsers(): User[] {
  return mockUsers;
}

export function getUserByEmail(email: string): User | undefined {
  return mockUsers.find(user => user.email === email);
}

export function getUserById(id: string): User | undefined {
  return mockUsers.find(user => user.id === id);
}

export function getSites(): Site[] {
  return mockSites;
}

export default {
  products: mockProducts,
  hosts: mockHosts,
  clients: mockClients,
  users: mockUsers,
  sites: mockSites
};// Service Prisma pour OrderSpot Pro
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export { prisma };

// Service de base de donnÃ©es
export class DatabaseService {
  private client: PrismaClient;
  
  constructor() {
    this.client = prisma;
  }
  
  async connect() {
    try {
      await this.client.$connect();
      console.log('âœ… Base de donnÃ©es connectÃ©e');
      return true;
    } catch (error) {
      console.error('âŒ Erreur de connexion Ã  la base de donnÃ©es:', error);
      return false;
    }
  }
  
  async disconnect() {
    try {
      await this.client.$disconnect();
      console.log('âœ… Base de donnÃ©es dÃ©connectÃ©e');
    } catch (error) {
      console.error('âŒ Erreur lors de la dÃ©connexion:', error);
    }
  }
  
  getClient() {
    return this.client;
  }
}

// Services CRUD complets
export const userService = {
  async create(data: { email: string; name?: string; role?: string }) {
    return prisma.user.create({ 
      data: {
        ...data,
        role: data.role as any || 'USER'
      }
    });
  },
  
  async findById(id: string) {
    return prisma.user.findUnique({ 
      where: { id },
      include: { orders: true }
    });
  },
  
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
  
  async findMany() {
    return prisma.user.findMany({
      include: { orders: true }
    });
  },
  
  async update(id: string, data: any) {
    return prisma.user.update({ where: { id }, data });
  },
  
  async delete(id: string) {
    return prisma.user.delete({ where: { id } });
  }
};

export const productService = {
  async create(data: {
    name: string;
    description?: string;
    price: number;
    category: string;
    imageUrl?: string;
    isActive?: boolean;
  }) {
    return prisma.product.create({ data });
  },
  
  async findById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  },
  
  async findMany(filters?: { category?: string; isActive?: boolean }) {
    return prisma.product.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' }
    });
  },
  
  async update(id: string, data: any) {
    return prisma.product.update({ where: { id }, data });
  },
  
  async delete(id: string) {
    return prisma.product.delete({ where: { id } });
  }
};

export const hostService = {
  async create(data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  }) {
    return prisma.host.create({ data });
  },
  
  async findById(id: string) {
    return prisma.host.findUnique({ 
      where: { id },
      include: { clients: true, reservations: true }
    });
  },
  
  async findMany() {
    return prisma.host.findMany({
      include: { clients: true, reservations: true }
    });
  },
  
  async update(id: string, data: any) {
    return prisma.host.update({ where: { id }, data });
  },
  
  async delete(id: string) {
    return prisma.host.delete({ where: { id } });
  }
};

// Service principal
// USERS FUNCTIONS
export async function getUsers() {
  try {
    return await prisma.user.findMany();
  } catch (error) {
    console.error('Erreur getUsers:', error);
    return [];
  }
}

export async function addUser(data: any) {
  try {
    return await prisma.user.create({ data });
  } catch (error) {
    console.error('Erreur addUser:', error);
    throw error;
  }
}

export async function updateUser(id: string, data: any) {
  try {
    return await prisma.user.update({ where: { id }, data });
  } catch (error) {
    console.error('Erreur updateUser:', error);
    throw error;
  }
}

export async function deleteUser(id: string) {
  try {
    return await prisma.user.delete({ where: { id } });
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    throw error;
  }
}

// ============================================
// TOUS LES EXPORTS MANQUANTS
// ============================================

export const getHosts = () => mockHosts.map(host => ({
  ...host,
  hostId: host.id,
  nom: host.name
}));
export const addHost = (data) => ({ id: Date.now().toString(), ...data });
export const updateHost = (id, data) => data;
export const deleteHost = (id) => true;

export const getClients = () => mockClients;
export const addClientData = (data) => ({ id: Date.now().toString(), ...data });
export const updateClientData = (id, data) => data;
export const deleteClientData = (id) => true;
export const addCreditToClient = (id, credit) => ({ success: true });

export const getOrders = () => [];
export const addOrder = (data) => ({ id: Date.now().toString(), ...data });
export const updateOrder = (id, data) => data;
export const deleteOrder = (id) => true;

export const getServices = () => [];
export const getServiceCategories = () => [];
export const getRoomsOrTables = () => [];
export const getHostById = (id) => mockHosts[0];
export const getClientById = (id) => mockClients[0];
export const getItemById = (id) => ({ id, name: 'Item' });
export const getRoomOrTableById = (id) => ({ id, name: 'Room' });
export const getServiceById = (id) => ({ id, name: 'Service' });
export const getOrderById = (id) => ({ id, total: 0 });
export const getReservationById = (id) => ({ id, status: 'pending' });
export const getSiteById = (id) => ({ id, name: 'Site' });

export const getMenuCards = () => [];
export const getMenuCategories = () => [];
export const getMenuItems = () => [];
export const getCustomForms = () => [];
export const getFormFields = () => [];
export const getTags = () => [];
export const getReservations = () => [];
export const getFormById = (id) => ({ id, name: 'Form' });

export const updateMenuCard = (id, data) => data;
export const addMenuCard = (data) => ({ id: Date.now().toString(), ...data });
export const deleteMenuCard = (id) => true;
export const duplicateMenuCard = (id) => ({ id: Date.now().toString() });

export const updateMenuCategory = (id, data) => data;
export const addMenuCategory = (data) => ({ id: Date.now().toString(), ...data });
export const deleteMenuCategory = (id) => true;

export const updateMenuItem = (id, data) => data;
export const addMenuItem = (data) => ({ id: Date.now().toString(), ...data });
export const deleteMenuItem = (id) => true;

export const updateServiceCategory = (id, data) => data;
export const addServiceCategory = (data) => ({ id: Date.now().toString(), ...data });
export const deleteServiceCategory = (id) => true;

export const updateService = (id, data) => data;
export const addService = (data) => ({ id: Date.now().toString(), ...data });
export const deleteService = (id) => true;

export const updateTag = (id, data) => data;
export const addTag = (data) => ({ id: Date.now().toString(), ...data });
export const deleteTag = (id) => true;

export const updateCustomForm = (id, data) => data;
export const addCustomForm = (data) => ({ id: Date.now().toString(), ...data });
export const deleteCustomForm = (id) => true;

export const updateFormField = (id, data) => data;
export const addFormField = (data) => ({ id: Date.now().toString(), ...data });
export const deleteFormField = (id) => true;

export const updateRoomOrTable = (id, data) => data;
export const addRoomOrTable = (data) => ({ id: Date.now().toString(), ...data });
export const deleteRoomOrTable = (id) => true;

export const getOrdersByUserId = (id) => [];
export const getReservationsByUserId = (id) => [];
export const getClientRecordsByUserId = (id) => [];
export const getClientRecordsByEmail = (email) => [];
export const getOrdersByClientId = (id) => [];
export const getReservationsByClientId = (id) => [];

export const updateReservationInData = (id, data) => data;
export const addReservationToData = (data) => ({ id: Date.now().toString(), ...data });
export const deleteReservationInData = (id) => true;

export const updateOrderStatus = (id, status) => ({ id, status });
export const recordPaymentForOrder = (id, amount) => true;
export const recordPaymentForReservation = (id, amount) => true;

export const getMenuCardById = (id) => ({ id, name: 'Menu Card' });
export const duplicateMenuCardData = (id) => ({ id: Date.now().toString() });
export const updateLocationInData = (id, data) => data;
export const deleteLocationInData = (id) => true;
export const updateOrderStatusInData = (id, status) => ({ id, status });

// ALIASES
export const addHostToData = addHost;
export const updateHostInData = updateHost;
export const deleteHostInData = deleteHost;
export const addSiteToData = addSite;
export const updateSiteInData = updateSite;
export const deleteSiteInData = deleteSite;
export const fetchHostTags = getTags;
export const fetchMenuCategoriesForCard = getMenuCategories;
export const fetchReservations = getReservations;
export const fetchAllHostReservations = getReservations;
export const fetchAllReservationsForHost = getReservations;
export const fetchHostServiceCategories = getServiceCategories;
