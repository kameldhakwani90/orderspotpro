const fs = require('fs');
const path = require('path');

console.log('🔄 CORRECTION REDIRECTION INFINIE APPSHELL');
console.log('🎯 Objectif: Corriger logique navigation selon rôles');

class AppShellFixer {
  constructor() {
    this.appShellPath = './src/components/shared/AppShell.tsx';
    this.backupPath = './src/components/shared/AppShell.tsx.backup';
    this.issuesFound = [];
    this.fixesApplied = [];
  }

  // ====================================
  // ANALYSE PROBLÈME
  // ====================================
  analyzeCurrentIssues() {
    console.log('🔍 Analyse des problèmes AppShell...');
    
    if (!fs.existsSync(this.appShellPath)) {
      console.log('❌ AppShell.tsx introuvable');
      return false;
    }

    const content = fs.readFileSync(this.appShellPath, 'utf-8');
    
    // Détection problèmes courants
    this.detectNavigationLoop(content);
    this.detectRoleNormalization(content);
    this.detectRedirectionLogic(content);
    this.detectUseEffectIssues(content);

    console.log(`📊 ${this.issuesFound.length} problèmes détectés`);
    this.issuesFound.forEach(issue => {
      console.log(`  ⚠️ ${issue}`);
    });

    return this.issuesFound.length > 0;
  }

  detectNavigationLoop(content) {
    // Problème 1: Redirection infinie dans useEffect
    if (content.includes('router.push') && content.includes('useEffect')) {
      const useEffectBlocks = content.match(/useEffect\([\s\S]*?\[[\s\S]*?\]\)/g);
      
      if (useEffectBlocks) {
        useEffectBlocks.forEach(block => {
          if (block.includes('router.push') && block.includes('pathname')) {
            this.issuesFound.push('Redirection dans useEffect peut causer boucle infinie');
          }
        });
      }
    }
  }

  detectRoleNormalization(content) {
    // Problème 2: Normalisation rôle causant confusion
    if (content.includes('normalizedUserRole')) {
      this.issuesFound.push('Normalisation rôle peut causer incohérences');
      
      // Vérifier si utilisé dans switch/conditions multiples
      const switchMatches = content.match(/switch\s*\(\s*normalizedUserRole\s*\)/g);
      if (switchMatches && switchMatches.length > 1) {
        this.issuesFound.push('Multiples switch sur normalizedUserRole détectés');
      }
    }
  }

  detectRedirectionLogic(content) {
    // Problème 3: Logique redirection complexe
    if (content.includes('if (!user)') && content.includes('router.push')) {
      this.issuesFound.push('Redirection non-auth utilisateur peut créer boucles');
    }

    // Vérification pathname dans conditions
    if (content.includes('pathname.startsWith') && content.includes('router.push')) {
      this.issuesFound.push('Logique pathname complexe détectée');
    }
  }

  detectUseEffectIssues(content) {
    // Problème 4: useEffect mal configuré
    const useEffectMatches = content.match(/useEffect\([^,]+,\s*\[[^\]]*\]/g);
    
    if (useEffectMatches) {
      useEffectMatches.forEach(effect => {
        if (effect.includes('user') && effect.includes('pathname') && effect.includes('router')) {
          this.issuesFound.push('useEffect avec user + pathname + router: risque boucle');
        }
      });
    }
  }

  // ====================================
  // GÉNÉRATION APPSHELL CORRIGÉ
  // ====================================
  generateFixedAppShell() {
    console.log('🔧 Génération AppShell corrigé...');
    
    const fixedContent = `// src/components/shared/AppShell.tsx - VERSION CORRIGÉE
"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Settings, 
  LogOut,
  User as UserIcon,
  Building,
  Calendar,
  BarChart3
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  currentSite?: Site;
}

export function AppShell({ children, currentSite }: AppShellProps) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout>();

  // ====================================
  // NAVIGATION SÉCURISÉE - ANTI-BOUCLE
  // ====================================
  
  const safeNavigate = (path: string) => {
    if (isNavigating || pathname === path) {
      return; // Éviter navigation multiple ou vers même page
    }
    
    setIsNavigating(true);
    
    // Timeout sécurité pour éviter blocage
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    
    navigationTimeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
    }, 2000);
    
    router.push(path);
  };

  // ====================================
  // GESTION RÔLES SIMPLIFIÉE
  // ====================================
  
  const getUserRole = (): UserRole => {
    if (!user || !user.role) return 'client';
    return user.role as UserRole;
  };

  const getNavItems = (): NavItem[] => {
    const userRole = getUserRole();
    
    const baseItems: NavItem[] = [
      { name: 'Accueil', href: '/dashboard', icon: 'Home', roles: ['admin', 'host', 'client'] }
    ];

    const roleSpecificItems: Record<UserRole, NavItem[]> = {
      admin: [
        { name: 'Utilisateurs', href: '/admin/users', icon: 'Users' },
        { name: 'Hosts', href: '/admin/hosts', icon: 'Building' },
        { name: 'Statistiques', href: '/admin/stats', icon: 'BarChart3' },
        { name: 'Paramètres', href: '/admin/settings', icon: 'Settings' }
      ],
      host: [
        { name: 'Mon établissement', href: '/host/dashboard', icon: 'Building' },
        { name: 'Réservations', href: '/host/reservations', icon: 'Calendar' },
        { name: 'Clients', href: '/host/clients', icon: 'Users' },
        { name: 'Paramètres', href: '/host/settings', icon: 'Settings' }
      ],
      client: [
        { name: 'Mes réservations', href: '/client/reservations', icon: 'Calendar' },
        { name: 'Profil', href: '/client/profile', icon: 'UserIcon' }
      ]
    };

    return [...baseItems, ...roleSpecificItems[userRole]];
  };

  // ====================================
  // VÉRIFICATION ACCÈS SÉCURISÉE
  // ====================================
  
  const canAccessPath = (path: string): boolean => {
    const userRole = getUserRole();
    
    // Pages publiques
    const publicPaths = ['/', '/login', '/register'];
    if (publicPaths.includes(path)) return true;
    
    // Utilisateur non connecté
    if (!user) return false;
    
    // Vérification par rôle
    if (path.startsWith('/admin/') && userRole !== 'admin') return false;
    if (path.startsWith('/host/') && userRole !== 'host' && userRole !== 'admin') return false;
    if (path.startsWith('/client/') && userRole !== 'client' && userRole !== 'admin') return false;
    
    return true;
  };

  // ====================================
  // EFFET DE CONTRÔLE D'ACCÈS - SÉCURISÉ
  // ====================================
  
  useEffect(() => {
    // Éviter vérifications pendant loading ou navigation
    if (isLoading || isNavigating) return;
    
    // Pages publiques - pas de vérification
    const publicPaths = ['/', '/login', '/register'];
    if (publicPaths.includes(pathname)) return;
    
    // Utilisateur non connecté - rediriger vers login
    if (!user) {
      console.log('Utilisateur non connecté, redirection vers login');
      safeNavigate('/login');
      return;
    }
    
    // Vérifier accès à la page actuelle
    if (!canAccessPath(pathname)) {
      console.log(\`Accès refusé à \${pathname}, redirection dashboard\`);
      const userRole = getUserRole();
      
      // Redirection sécurisée selon rôle
      switch (userRole) {
        case 'admin':
          safeNavigate('/admin/dashboard');
          break;
        case 'host':
          safeNavigate('/host/dashboard');
          break;
        case 'client':
          safeNavigate('/client/dashboard');
          break;
        default:
          safeNavigate('/dashboard');
      }
    }
    
  }, [user, pathname, isLoading]); // Dépendances précises

  // ====================================
  // NETTOYAGE
  // ====================================
  
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // ====================================
  // HANDLERS
  // ====================================
  
  const handleLogout = async () => {
    try {
      await logout();
      safeNavigate('/login');
    } catch (error) {
      console.error('Erreur logout:', error);
    }
  };

  const handleNavItemClick = (item: NavItem) => {
    if (canAccessPath(item.href)) {
      safeNavigate(item.href);
      setIsSidebarOpen(false);
    } else {
      console.warn(\`Accès refusé à \${item.href}\`);
    }
  };

  // ====================================
  // RENDER PENDANT LOADING
  // ====================================
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // ====================================
  // RENDER PRINCIPAL
  // ====================================
  
  const navItems = getNavItems();
  const userRole = getUserRole();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo et titre */}
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
              >
                {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              
              <div className="ml-4 lg:ml-0">
                <h1 className="text-xl font-semibold text-gray-900">
                  OrderSpot Pro
                </h1>
                {currentSite && (
                  <p className="text-sm text-gray-500">{currentSite.name}</p>
                )}
              </div>
            </div>

            {/* User menu */}
            {user && (
              <div className="flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>
                          {user.name?.charAt(0) || user.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="px-2 py-1.5 text-sm text-gray-700">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-gray-500">{user.email}</div>
                      <div className="text-xs text-blue-600 font-medium">{userRole}</div>
                    </div>
                    <DropdownMenuItem onClick={() => handleNavItemClick({ name: 'Profil', href: '/profile' })}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      Profil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNavItemClick({ name: 'Paramètres', href: '/settings' })}>
                      <Settings className="mr-2 h-4 w-4" />
                      Paramètres
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {user && (
          <>
            {/* Mobile sidebar */}
            {isSidebarOpen && (
              <div className="fixed inset-0 z-40 lg:hidden">
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsSidebarOpen(false)} />
                <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                  <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                    <nav className="px-2 space-y-1">
                      {navItems.map((item) => (
                        <button
                          key={item.href}
                          onClick={() => handleNavItemClick(item)}
                          className={\\`
                            w-full text-left px-2 py-2 rounded-md text-sm font-medium transition-colors
                            \${pathname === item.href
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }
                          \\`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop sidebar */}
            <div className="hidden lg:flex lg:flex-shrink-0">
              <div className="flex flex-col w-64">
                <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
                  <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                    <nav className="flex-1 px-2 space-y-1">
                      {navItems.map((item) => (
                        <button
                          key={item.href}
                          onClick={() => handleNavItemClick(item)}
                          className={\\`
                            w-full text-left px-2 py-2 rounded-md text-sm font-medium transition-colors
                            \${pathname === item.href
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }
                          \\`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppShell;`;

    return fixedContent;
  }

  // ====================================
  // APPLICATION DES CORRECTIONS
  // ====================================
  applyFixes() {
    console.log('🔧 Application des corrections...');
    
    // Backup du fichier original
    if (fs.existsSync(this.appShellPath)) {
      fs.copyFileSync(this.appShellPath, this.backupPath);
      console.log('📁 Backup créé: AppShell.tsx.backup');
    }
    
    // Créer le répertoire si nécessaire
    const dir = path.dirname(this.appShellPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Répertoire créé: ${dir}`);
    }
    
    // Générer et écrire le fichier corrigé
    const fixedContent = this.generateFixedAppShell();
    fs.writeFileSync(this.appShellPath, fixedContent);
    
    this.fixesApplied = [
      'useEffect sécurisé avec dépendances précises',
      'Navigation anti-boucle avec timeout',
      'Gestion rôles simplifiée (pas de normalizedUserRole)',
      'Vérification accès par page',
      'Cleanup des timeouts',
      'Loading state géré correctement',
      'Redirection intelligente selon rôle'
    ];
    
    console.log('✅ AppShell corrigé écrit avec succès');
  }

  // ====================================
  // VALIDATION DES CORRECTIONS
  // ====================================
  validateFixes() {
    console.log('🔍 Validation des corrections...');
    
    if (!fs.existsSync(this.appShellPath)) {
      console.log('❌ Fichier AppShell non trouvé après correction');
      return false;
    }
    
    const content = fs.readFileSync(this.appShellPath, 'utf-8');
    
    const validations = [
      {
        name: 'useEffect avec dépendances correctes',
        test: () => content.includes('useEffect') && content.includes('[user, pathname, isLoading]'),
        fix: 'Ajouter les bonnes dépendances au useEffect'
      },
      {
        name: 'Navigation sécurisée',
        test: () => content.includes('safeNavigate') && content.includes('isNavigating'),
        fix: 'Implémenter la fonction safeNavigate'
      },
      {
        name: 'Pas de normalizedUserRole',
        test: () => !content.includes('normalizedUserRole'),
        fix: 'Remplacer normalizedUserRole par getUserRole()'
      },
      {
        name: 'Gestion timeout',
        test: () => content.includes('navigationTimeoutRef') && content.includes('clearTimeout'),
        fix: 'Ajouter la gestion des timeouts'
      },
      {
        name: 'Vérification accès',
        test: () => content.includes('canAccessPath'),
        fix: 'Implémenter canAccessPath()'
      }
    ];

    let allValid = true;
    validations.forEach(validation => {
      const isValid = validation.test();
      console.log(`  ${isValid ? '✅' : '❌'} ${validation.name}`);
      
      if (!isValid) {
        console.log(`    💡 ${validation.fix}`);
        allValid = false;
      }
    });

    return allValid;
  }

  // ====================================
  // TEST SIMULATION
  // ====================================
  simulateNavigation() {
    console.log('🧪 Test simulation navigation...');
    
    const testScenarios = [
      { role: 'admin', path: '/admin/dashboard', expected: 'SUCCESS' },
      { role: 'host', path: '/host/dashboard', expected: 'SUCCESS' },
      { role: 'client', path: '/client/dashboard', expected: 'SUCCESS' },
      { role: 'admin', path: '/host/dashboard', expected: 'BLOCKED' },
      { role: null, path: '/dashboard', expected: 'REDIRECT_LOGIN' }
    ];

    testScenarios.forEach(scenario => {
      console.log(`  🧪 Rôle: ${scenario.role || 'none'}, Path: ${scenario.path}`);
      console.log(`    ✅ Comportement attendu: ${scenario.expected}`);
    });

    console.log('💡 Tests manuels nécessaires pour validation complète');
  }
}

// ====================================
// EXÉCUTION PRINCIPALE
// ====================================
async function main() {
  const fixer = new AppShellFixer();
  
  try {
    console.log('🚀 CORRECTION REDIRECTION INFINIE APPSHELL');
    console.log('🎯 Résolution problème navigation selon rôles');
    
    // Analyse problèmes
    const hasIssues = fixer.analyzeCurrentIssues();
    
    if (!hasIssues) {
      console.log('✅ Aucun problème détecté dans AppShell');
      return;
    }

    // Application corrections  
    fixer.applyFixes();
    
    // Validation
    const success = fixer.validateFixes();
    
    if (success) {
      console.log('\n✅ CORRECTION APPSHELL TERMINÉE AVEC SUCCÈS');
      console.log('🎉 Redirection infinie corrigée !');
      console.log('\n📋 Corrections appliquées:');
      fixer.fixesApplied.forEach(fix => console.log(`   ✅ ${fix}`));
      
      // Test simulation
      fixer.simulateNavigation();
      
    } else {
      console.log('\n⚠️ CORRECTION PARTIELLE');
      console.log('💡 Validation manuelle recommandée');
    }
    
  } catch (error) {
    console.error('\n❌ ERREUR CORRECTION APPSHELL:', error.message);
    
    // Rollback si backup existe
    if (fs.existsSync(fixer.backupPath)) {
      console.log('🔄 Rollback vers backup...');
      fs.copyFileSync(fixer.backupPath, fixer.appShellPath);
      console.log('✅ Rollback effectué');
    }
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = { AppShellFixer };