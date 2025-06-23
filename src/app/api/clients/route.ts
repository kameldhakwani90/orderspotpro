import { NextRequest, NextResponse } from 'next/server';

// Import conditionnel pour éviter les erreurs
let prisma: any;
try {
  const prismaModule = require('@/lib/prisma-service');
  prisma = prismaModule.prisma;
} catch {
  prisma = null;
}

// GET /api/clients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hostId = searchParams.get('hostId');
    
    // Mock data si Prisma n'est pas disponible
    if (!prisma) {
      const mockClients = [
        {
          id: '1',
          name: 'Jean Durand',
          email: 'jean.durand@email.com',
          phone: '+33611223344',
          hostId: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
          host: {
            id: '1',
            name: 'Restaurant Le Gourmet',
            email: 'contact@legourmet.com'
          },
          reservations: []
        }
      ];
      
      const filteredClients = hostId 
        ? mockClients.filter(c => c.hostId === hostId)
        : mockClients;
      
      return NextResponse.json({
        success: true,
        data: filteredClients
      });
    }
    
    const where: any = {};
    if (hostId) where.hostId = hostId;
    
    const clients = await prisma.client.findMany({
      where,
      include: {
        host: true,
        reservations: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch clients'
    }, { status: 500 });
  }
}

// POST /api/clients
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, hostId } = body;
    
    if (!name || !email || !hostId) {
      return NextResponse.json({
        success: false,
        error: 'Name, email, and hostId are required'
      }, { status: 400 });
    }
    
    // Mock response si Prisma n'est pas disponible
    if (!prisma) {
      const mockClient = {
        id: Date.now().toString(),
        name,
        email,
        phone,
        hostId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return NextResponse.json({
        success: true,
        data: mockClient
      }, { status: 201 });
    }
    
    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        hostId
      }
    });
    
    return NextResponse.json({
      success: true,
      data: client
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create client'
    }, { status: 500 });
  }
}
