// Données pour OrderSpot Pro avec exports pour scripts

export const mockProducts = [
  {
    id: '1',
    name: 'Café Expresso',
    price: 2.50,
    category: 'boissons',
    description: 'Café expresso italien authentique',
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

// FONCTIONS MANQUANTES AJOUTÉES
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
};