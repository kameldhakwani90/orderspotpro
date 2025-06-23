// Types TypeScript pour OrderSpot Pro

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items?: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin' | 'manager';
  createdAt: Date;
  updatedAt: Date;
}

export interface Host {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  hostId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Reservation {
  id: string;
  clientId: string;
  hostId: string;
  date: Date;
  time: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
