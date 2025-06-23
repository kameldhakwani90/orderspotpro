import { NextRequest, NextResponse } from 'next/server';

// Import conditionnel pour éviter les erreurs
let prisma: any;
try {
  const prismaModule = require('@/lib/prisma-service');
  prisma = prismaModule.prisma;
} catch {
  // Fallback si Prisma n'est pas disponible
  prisma = null;
}

// GET /api/products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    // Mock data si Prisma n'est pas disponible
    if (!prisma) {
      const mockProducts = [
        {
          id: '1',
          name: 'Café Expresso',
          price: 2.50,
          category: 'boissons',
          description: 'Café expresso italien authentique',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Croissant',
          price: 1.80,
          category: 'viennoiseries',
          description: 'Croissant artisanal au beurre',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const filteredProducts = category 
        ? mockProducts.filter(p => p.category === category)
        : mockProducts;
      
      return NextResponse.json({
        success: true,
        data: filteredProducts
      });
    }
    
    const where: any = {};
    if (category) where.category = category;
    
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products'
    }, { status: 500 });
  }
}

// POST /api/products
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, category, imageUrl, isActive } = body;
    
    if (!name || !price || !category) {
      return NextResponse.json({
        success: false,
        error: 'Name, price, and category are required'
      }, { status: 400 });
    }
    
    // Mock response si Prisma n'est pas disponible
    if (!prisma) {
      const mockProduct = {
        id: Date.now().toString(),
        name,
        description,
        price: parseFloat(price),
        category,
        imageUrl,
        isActive: isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return NextResponse.json({
        success: true,
        data: mockProduct
      }, { status: 201 });
    }
    
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        imageUrl,
        isActive: isActive ?? true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: product
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create product'
    }, { status: 500 });
  }
}
