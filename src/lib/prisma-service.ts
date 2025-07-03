// Service Prisma pour OrderSpot Pro
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export { prisma };

// Service de base de données
export class DatabaseService {
  private client: PrismaClient;
  
  constructor() {
    this.client = prisma;
  }
  
  async connect() {
    try {
      await this.client.$connect();
      console.log('✅ Base de données connectée');
      return true;
    } catch (error) {
      console.error('❌ Erreur de connexion à la base de données:', error);
      return false;
    }
  }
  
  async disconnect() {
    try {
      await this.client.$disconnect();
      console.log('✅ Base de données déconnectée');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
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
export default new DatabaseService();