import { NextRequest, NextResponse } from 'next/server';

// Import conditionnel pour éviter les erreurs
let prisma: any;
try {
  const prismaModule = require('@/lib/prisma-service');
  prisma = prismaModule.prisma;
} catch {
  prisma = null;
}

// GET /api/hosts
export async function GET() {
  try {
    // Mock data si Prisma n'est pas disponible
    if (!prisma) {
      const mockHosts = [
        {
          id: '1',
          name: 'Restaurant Le Gourmet',
          email: 'contact@legourmet.com',
          phone: '+33123456789',
          address: '123 Rue de la Paix, Paris',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          clients: [],
          reservations: []
        }
      ];
      
      return NextResponse.json({
        success: true,
        data: mockHosts
      });
    }
    
    const hosts = await prisma.host.findMany({
      include: {
        clients: true,
        reservations: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      data: hosts
    });
  } catch (error) {
    console.error('Error fetching hosts:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch hosts'
    }, { status: 500 });
  }
}

// POST /api/hosts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address } = body;
    
    if (!name || !email) {
      return NextResponse.json({
        success: false,
        error: 'Name and email are required'
      }, { status: 400 });
    }
    
    // Mock response si Prisma n'est pas disponible
    if (!prisma) {
      const mockHost = {
        id: Date.now().toString(),
        name,
        email,
        phone,
        address,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return NextResponse.json({
        success: true,
        data: mockHost
      }, { status: 201 });
    }
    
    const host = await prisma.host.create({
      data: {
        name,
        email,
        phone,
        address
      }
    });
    
    return NextResponse.json({
      success: true,
      data: host
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating host:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create host'
    }, { status: 500 });
  }
}
