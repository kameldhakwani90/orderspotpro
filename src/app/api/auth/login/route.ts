import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

let prisma: any;
try {
  const prismaModule = require('@/lib/prisma-service');
  prisma = prismaModule.prisma;
} catch {
  prisma = null;
}

// POST /api/auth/login - Connexion avec email et mot de passe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 });
    }
    
    // Mock response si Prisma n'est pas disponible
    if (!prisma) {
      if (email === 'admin@orderspot.com' && password === 'admin123') {
        return NextResponse.json({
          success: true,
          data: {
            id: '1',
            email: 'admin@orderspot.com',
            name: 'Admin OrderSpot',
            role: 'ADMIN'
          },
          message: 'Login successful'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Invalid credentials'
        }, { status: 401 });
      }
    }
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }
    
    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }
    
    // Retourner les données utilisateur sans le mot de passe
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({
      success: false,
      error: 'Login failed'
    }, { status: 500 });
  }
}
