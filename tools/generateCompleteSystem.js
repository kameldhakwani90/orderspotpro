const fs = require('fs');
const path = require('path');

console.log('🔧 GÉNÉRATEUR SYSTÈME COMPLET - Version corrigée "use client"');

class CompleteSystemGenerator {
  constructor() {
    this.projectRoot = process.cwd();
    this.srcDir = path.join(this.projectRoot, 'src');
    this.generatedFiles = [];
    this.errors = [];
  }

  // ====================================
  // TEMPLATE AVEC "use client" CORRECT
  // ====================================
  
  createFileWithUseClient(filePath, content, needsUseClient = false) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      let finalContent = content;
      
      if (needsUseClient && !content.includes('"use client"')) {
        // Ajouter "use client" EN PREMIER
        finalContent = `"use client";\n\n${content}`;
      }
      
      fs.writeFileSync(filePath, finalContent, 'utf-8');
      this.generatedFiles.push(filePath);
      
      return true;
    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      return false;
    }
  }

  // ====================================
  // GÉNÉRATION TEMPLATES CORRIGÉS
  // ====================================
  
  generateAppShellTemplate() {
    console.log('🎨 Génération AppShell avec "use client" correct...');
    
    const appShellContent = `import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { NavItem, UserRole, Site } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Home, Users, Building2, UserCog, MapPin, ListChecks, 
  FileText, ClipboardList, ShoppingCart, Settings, LogOut, 
  Menu, ChevronDown, ChevronUp, CalendarCheck, Database,
  LayoutDashboard, UserCircle, Briefcase
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, allowedRoles: ['admin'] },
  { label: 'Manage Users', href: '/admin/users', icon: Users, allowedRoles: ['admin'] },
  { label: 'Manage Global Sites', href: '/admin/sites', icon: Building2, allowedRoles: ['admin'] },
  { label: 'Manage Hosts', href: '/admin/hosts', icon: UserCog, allowedRoles: ['admin'] },
  { label: 'Data Model', href: '/admin/data-model', icon: Database, allowedRoles: ['admin'] },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="w-full max-w-md h-64" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          <div className="flex-1 px-4 py-6">
            <nav className="space-y-1">
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    pathname === item.href
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <Avatar className="w-6 h-6 mr-2">
                    <AvatarFallback>
                      {user.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {user.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}`;

    const appShellPath = path.join(this.srcDir, 'components', 'shared', 'AppShell.tsx');
    return this.createFileWithUseClient(appShellPath, appShellContent, true);
  }

  generateLoginPageTemplate() {
    console.log('🔐 Génération page Login avec "use client" correct...');
    
    const loginPageContent = `import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, register, error } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = isRegister 
        ? await register(email, password)
        : await login(email, password);
      
      if (success) {
        const redirect = searchParams.get('redirect') || '/dashboard';
        router.push(redirect);
      }
    } catch (error) {
      console.error('Erreur authentification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isRegister ? 'Créer un compte' : 'Se connecter'}
          </CardTitle>
          <CardDescription>
            {isRegister 
              ? 'Créez votre compte pour continuer'
              : 'Connectez-vous à votre compte'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isRegister ? 'Créer le compte' : 'Se connecter'}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsRegister(!isRegister)}
              disabled={isLoading}
            >
              {isRegister 
                ? 'Déjà un compte ? Se connecter'
                : 'Pas de compte ? Créer un compte'
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}`;

    const loginPagePath = path.join(this.srcDir, 'app', 'login', 'page.tsx');
    return this.createFileWithUseClient(loginPagePath, loginPageContent, true);
  }

  generateDashboardPageTemplate() {
    console.log('📊 Génération page Dashboard avec "use client" correct...');
    
    const dashboardContent = `import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Building2, ShoppingCart, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalHosts: number;
  totalOrders: number;
  revenue: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement des stats
    setTimeout(() => {
      setStats({
        totalUsers: 150,
        totalHosts: 25,
        totalOrders: 342,
        revenue: 15420
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Utilisateurs',
      value: stats?.totalUsers.toLocaleString() || '0',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Hôtes',
      value: stats?.totalHosts.toLocaleString() || '0',
      icon: Building2,
      color: 'text-green-600'
    },
    {
      title: 'Commandes',
      value: stats?.totalOrders.toLocaleString() || '0',
      icon: ShoppingCart,
      color: 'text-orange-600'
    },
    {
      title: 'Revenus',
      value: \`\${stats?.revenue.toLocaleString() || '0'} €\`,
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Bienvenue, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <card.icon className={cn("w-4 h-4", card.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>
            Aperçu des dernières actions sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">Nouvel utilisateur inscrit</p>
                <p className="text-xs text-gray-500">Il y a 2 heures</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">Commande terminée</p>
                <p className="text-xs text-gray-500">Il y a 4 heures</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">Nouveau hôte ajouté</p>
                <p className="text-xs text-gray-500">Il y a 6 heures</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}`;

    const dashboardPath = path.join(this.srcDir, 'app', 'dashboard', 'page.tsx');
    return this.createFileWithUseClient(dashboardPath, dashboardContent, true);
  }

  // ====================================
  // GÉNÉRATION SERVICE PRISMA
  // ====================================
  
  generatePrismaService() {
    console.log('🗄️ Génération service Prisma...');
    
    const serviceContent = `// Service Prisma généré automatiquement
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// HOSTS - CRUD COMPLET
// ============================================

export async function getHosts() {
  try {
    return await prisma.host.findMany({
      include: {
        clients: true,
        orders: true
      }
    });
  } catch (error) {
    console.error('Erreur getHosts:', error);
    return [];
  }
}

export async function getHostById(id: string) {
  try {
    return await prisma.host.findUnique({
      where: { id },
      include: {
        clients: true,
        orders: true
      }
    });
  } catch (error) {
    console.error('Erreur getHostById:', error);
    return null;
  }
}

export async function addHost(data: any) {
  try {
    return await prisma.host.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        ...data
      }
    });
  } catch (error) {
    console.error('Erreur addHost:', error);
    throw error;
  }
}

export async function updateHost(id: string, data: any) {
  try {
    return await prisma.host.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error('Erreur updateHost:', error);
    throw error;
  }
}

export async function deleteHost(id: string) {
  try {
    return await prisma.host.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Erreur deleteHost:', error);
    throw error;
  }
}

// ============================================
// CLIENTS - CRUD COMPLET
// ============================================

export async function getClients() {
  try {
    return await prisma.client.findMany({
      include: {
        host: true,
        orders: true
      }
    });
  } catch (error) {
    console.error('Erreur getClients:', error);
    return [];
  }
}

export async function getClientById(id: string) {
  try {
    return await prisma.client.findUnique({
      where: { id },
      include: {
        host: true,
        orders: true
      }
    });
  } catch (error) {
    console.error('Erreur getClientById:', error);
    return null;
  }
}

export async function addClient(data: any) {
  try {
    return await prisma.client.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        hostId: data.hostId,
        ...data
      }
    });
  } catch (error) {
    console.error('Erreur addClient:', error);
    throw error;
  }
}

export async function updateClient(id: string, data: any) {
  try {
    return await prisma.client.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error('Erreur updateClient:', error);
    throw error;
  }
}

export async function deleteClient(id: string) {
  try {
    return await prisma.client.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Erreur deleteClient:', error);
    throw error;
  }
}

// ============================================
// ORDERS - CRUD COMPLET
// ============================================

export async function getOrders() {
  try {
    return await prisma.order.findMany({
      include: {
        client: true,
        host: true
      }
    });
  } catch (error) {
    console.error('Erreur getOrders:', error);
    return [];
  }
}

export async function getOrderById(id: string) {
  try {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
        host: true
      }
    });
  } catch (error) {
    console.error('Erreur getOrderById:', error);
    return null;
  }
}

export async function addOrder(data: any) {
  try {
    return await prisma.order.create({
      data: {
        clientId: data.clientId,
        hostId: data.hostId,
        total: data.total,
        status: data.status || 'pending',
        ...data
      }
    });
  } catch (error) {
    console.error('Erreur addOrder:', error);
    throw error;
  }
}

export async function updateOrder(id: string, data: any) {
  try {
    return await prisma.order.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error('Erreur updateOrder:', error);
    throw error;
  }
}

export async function deleteOrder(id: string) {
  try {
    return await prisma.order.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Erreur deleteOrder:', error);
    throw error;
  }
}

// ============================================
// ALIASES COMPATIBILITÉ
// ============================================

export const addHostToData = addHost;
export const updateHostInData = updateHost;
export const deleteHostFromData = deleteHost;
export const addClientToData = addClient;
export const updateClientInData = updateClient;
export const deleteClientFromData = deleteClient;
export const addOrderToData = addOrder;
export const updateOrderInData = updateOrder;
export const deleteOrderFromData = deleteOrder;

export default prisma;`;

    const servicePath = path.join(this.srcDir, 'lib', 'prisma-service.ts');
    return this.createFileWithUseClient(servicePath, serviceContent, false);
  }

  // ====================================
  // GÉNÉRATION SCHEMA PRISMA
  // ====================================
  
  generatePrismaSchema() {
    console.log('📋 Génération schema Prisma...');
    
    const schemaContent = `// Prisma schema généré automatiquement
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Host {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  phone       String?
  address     String?
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  clients Client[]
  orders  Order[]
  
  @@map("hosts")
}

model Client {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  phone       String?
  address     String?
  credit      Float    @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  hostId String
  host   Host   @relation(fields: [hostId], references: [id])
  
  orders Order[]
  
  @@map("clients")
}

model Order {
  id          String   @id @default(cuid())
  total       Float
  status      String   @default("pending")
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  clientId String
  client   Client @relation(fields: [clientId], references: [id])
  
  hostId String
  host   Host   @relation(fields: [hostId], references: [id])
  
  @@map("orders")
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      String   @default("user")
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("users")
}`;

    const schemaPath = path.join(this.projectRoot, 'prisma', 'schema.prisma');
    return this.createFileWithUseClient(schemaPath, schemaContent, false);
  }

  // ====================================
  // MÉTHODE PRINCIPALE
  // ====================================
  
  generateCompleteSystem() {
    console.log('🚀 Génération système complet avec corrections "use client"...\n');
    
    try {
      // 1. Générer les templates de pages
      this.generateAppShellTemplate();
      this.generateLoginPageTemplate();
      this.generateDashboardPageTemplate();
      
      // 2. Générer les services
      this.generatePrismaService();
      this.generatePrismaSchema();
      
      this.printResults();
      return this.errors.length === 0;
      
    } catch (error) {
      console.error('❌ Erreur génération système:', error.message);
      return false;
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 GÉNÉRATION SYSTÈME COMPLET TERMINÉE !');
    console.log('='.repeat(60));
    console.log(`📊 ${this.generatedFiles.length} fichier(s) généré(s)`);
    console.log(`❌ ${this.errors.length} erreur(s) rencontrée(s)`);
    
    if (this.errors.length > 0) {
      console.log('\n⚠️ Erreurs rencontrées:');
      this.errors.forEach(err => {
        console.log(`   - ${err.file}: ${err.error}`);
      });
    }
    
    console.log('\n✅ Améliorations appliquées:');
    console.log('   🔧 "use client" placé EN PREMIER dans tous les templates');
    console.log('   🔧 Imports ajoutés APRÈS "use client"');
    console.log('   🔧 Structure Next.js App Router respectée');
    console.log('   🔧 Templates TypeScript avec types corrects');
    
    console.log('\n🚀 Les erreurs "use client" sont maintenant évitées !');
  }
}

// ====================================
// EXÉCUTION
// ====================================

if (require.main === module) {
  const generator = new CompleteSystemGenerator();
  const success = generator.generateCompleteSystem();
  process.exit(success ? 0 : 1);
}

module.exports = CompleteSystemGenerator;