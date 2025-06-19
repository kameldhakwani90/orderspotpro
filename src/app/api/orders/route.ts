import { NextRequest, NextResponse } from 'next/server';

// Import conditionnel pour éviter les erreurs
let prisma: any;
try {
  const prismaModule = require('@/lib/prisma-service');
  prisma = prismaModule.prisma;
} catch {
  prisma = null;
}

// GET /api/orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    
    // Mock data si Prisma n'est pas disponible
    if (!prisma) {
      const mockOrders = [
        {
          id: '1',
          orderNumber: 'ORD-001',
          userId: '1',
          total: 4.30,
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [
            {
              id: '1',
              productId: '1',
              quantity: 1,
              price: 2.50,
              product: {
                id: '1',
                name: 'Café Expresso',
                price: 2.50
              }
            }
          ],
          user: {
            id: '1',
            email: 'client@example.com',
            name: 'Client Test'
          }
        }
      ];
      
      return NextResponse.json({
        success: true,
        data: mockOrders
      });
    }
    
    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch orders'
    }, { status: 500 });
  }
}

// POST /api/orders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, items, notes } = body;
    
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'userId and items are required'
      }, { status: 400 });
    }
    
    // Calculer le total
    const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    
    // Mock response si Prisma n'est pas disponible
    if (!prisma) {
      const mockOrder = {
        id: Date.now().toString(),
        orderNumber: `ORD-${Date.now()}`,
        userId,
        total,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: items.map((item: any, index: number) => ({
          id: (Date.now() + index).toString(),
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      };
      
      return NextResponse.json({
        success: true,
        data: mockOrder
      }, { status: 201 });
    }
    
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        userId,
        total,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: order
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create order'
    }, { status: 500 });
  }
}
