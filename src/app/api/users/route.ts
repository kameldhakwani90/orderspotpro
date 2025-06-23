import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

// Import conditionnel pour éviter les erreurs
let prisma: any;
try {
  const prismaModule = require('@/lib/prisma-service');
  prisma = prismaModule.prisma;
} catch {
  prisma = null;
}

// GET /api/users - Lister tous les utilisateurs (sans mots de passe)
export async function GET() {
  try {
    if (!prisma) {
      const mockUsers = [
        {
          id: '1',
          email: 'admin@orderspot.com',
          name: 'Admin OrderSpot',
          role: 'ADMIN',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      return NextResponse.json({
        success: true,
        data: mockUsers
      });
    }
    
    const users = await prisma.user.findMany({
      select: {  // Exclure le mot de passe de la réponse
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        orders: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 });
  }
}

// POST /api/users - Créer un nouvel utilisateur avec mot de passe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password, role } = body;
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 });
    }
    
    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 6 characters long'
      }, { status: 400 });
    }
    
    // Mock response si Prisma n'est pas disponible
    if (!prisma) {
      const mockUser = {
        id: Date.now().toString(),
        email,
        name,
        role: role || 'USER',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return NextResponse.json({
        success: true,
        data: mockUser,
        message: 'User created successfully (mock mode)'
      }, { status: 201 });
    }
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User with this email already exists'
      }, { status: 409 });
    }
    
    // Hasher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,  // Mot de passe hashé
        role: role || 'USER'
      },
      select: {  // Exclure le mot de passe de la réponse
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: user,
      message: 'User created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create user'
    }, { status: 500 });
  }
}
