
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { NavItem, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home, Users, Building2, UserCog, MapPin, ListChecks, FileText, ClipboardList, ShoppingCart, Settings, LogOut, Menu, QrCode, ChevronDown, ChevronUp, CalendarCheck, Tag as TagIcon, Settings2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: Home, allowedRoles: ['admin'] },
  { label: 'Manage Users', href: '/admin/users', icon: Users, allowedRoles: ['admin'] },
  { label: 'Manage Global Sites', href: '/admin/sites', icon: Building2, allowedRoles: ['admin'] },
  { label: 'Manage Hosts', href: '/admin/hosts', icon: UserCog, allowedRoles: ['admin'] },
];

const hostNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/host/dashboard', icon: Home, allowedRoles: ['host'] },
  { label: 'Client Orders', href: '/host/orders', icon: ShoppingCart, allowedRoles: ['host'] },
  { label: 'Reservations', href: '/host/reservations', icon: CalendarCheck, allowedRoles: ['host'] }, 
  { label: 'Gestion Clients', href: '/host/clients', icon: Users, allowedRoles: ['host'] },
  {
    label: 'Configuration',
    href: '#', 
    icon: Settings, 
    allowedRoles: ['host'],
    children: [
      { label: 'My Locations', href: '/host/locations', icon: MapPin, allowedRoles: ['host'] },
      { label: 'Manage Tags', href: '/host/tags', icon: TagIcon, allowedRoles: ['host'] },
      { label: 'Service Categories', href: '/host/service-categories', icon: ListChecks, allowedRoles: ['host'] },
      { label: 'Custom Forms', href: '/host/forms', icon: FileText, allowedRoles: ['host'] },
      { label: 'My Services', href: '/host/services', icon: ClipboardList, allowedRoles: ['host'] },
      { label: 'Reservation Page Settings', href: '/host/reservation-settings', icon: Settings2, allowedRoles: ['host'] },
      { label: 'Account Settings', href: '/settings', icon: Settings, allowedRoles: ['host'] }
    ]
  }
];

const clientNavItems: NavItem[] = [
    // Client dashboard/landing page is typically specific, handled by /dashboard redirect
];


const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initialOpenMenus: Record<string, boolean> = {};
    const navItemsForCurrentUserRole = () => {
        if (!user) return [];
        switch (user.role) {
            case 'admin': return adminNavItems;
            case 'host': return hostNavItems;
            case 'client': return clientNavItems;
            default: return [];
        }
    };
    navItemsForCurrentUserRole().forEach(item => {
      if (item.children && item.children.some(child => pathname.startsWith(child.href) && child.href !== '#')) {
        initialOpenMenus[item.label] = true;
      }
    });
    return initialOpenMenus;
  });
  
  useEffect(() => { 
    if (user) {
        const navItemsForCurrentUserRole = () => {
            switch (user.role) {
                case 'admin': return adminNavItems;
                case 'host': return hostNavItems;
                case 'client': return clientNavItems;
                default: return [];
            }
        };
        const newOpenMenus: Record<string, boolean> = {};
        navItemsForCurrentUserRole().forEach(item => {
          if (item.children && item.children.some(child => pathname.startsWith(child.href) && child.href !== '#')) {
            newOpenMenus[item.label] = true;
          }
        });
        
        setOpenMenus(prev => ({...prev, ...newOpenMenus}));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, user]);


  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-64 border-r p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined') router.push('/login');
    return null; 
  }

  const userInitial = user.nom ? user.nom.charAt(0).toUpperCase() : '?';
  
  let currentNavItems: NavItem[] = [];
  switch (user.role) {
      case 'admin':
          currentNavItems = adminNavItems;
          break;
      case 'host':
          currentNavItems = hostNavItems;
          break;
      case 'client':
          currentNavItems = clientNavItems;
          break;
  }

  let allNavItemsForUser: NavItem[];
  if (user.role !== 'host') { 
    const settingsItem: NavItem = { label: 'Settings', href: '/settings', icon: Settings, allowedRoles: ['admin', 'client'] };
    allNavItemsForUser = [...currentNavItems, settingsItem];
  } else {
    allNavItemsForUser = [...currentNavItems];
  }


  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };
  
  const NavLink: React.FC<{ item: NavItem; isSubItem?: boolean }> = ({ item, isSubItem = false }) => {
    const hasChildren = item.children && item.children.length > 0;
    let isParentActive = false;
    if (hasChildren) {
        isParentActive = item.children.some(child => pathname.startsWith(child.href) && child.href !== '#');
    }

    let isActive;
    
    const isDashboardLink = item.href === '/dashboard' || (user && item.href === `/${user.role}/dashboard`);

    if (isDashboardLink) {
        isActive = pathname === item.href;
    } else if (hasChildren) {
        isActive = isParentActive;
    } else {
        isActive = pathname.startsWith(item.href); 
    }
    
    const isMenuOpen = openMenus[item.label] || false;

    if (hasChildren) {
      return (
        <>
          <button
            onClick={() => toggleMenu(item.label)}
            className={cn(
              "flex items-center w-full text-left px-3 py-2.5 rounded-lg transition-colors",
              isSubItem ? "pl-8 text-sm" : "text-base",
              isActive ? "bg-primary/20 text-primary font-semibold" : "hover:bg-secondary hover:text-secondary-foreground",
              "text-sidebar-foreground"
            )}
          >
            <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-sidebar-foreground/80")} />
            <span className="flex-1">{item.label}</span>
            {isMenuOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {isMenuOpen && (
            <div className="pl-4 mt-1 space-y-1">
              {item.children?.map(child => <NavLink key={child.href} item={child} isSubItem={true} />)}
            </div>
          )}
        </>
      );
    }

    return (
      <Link href={item.href} legacyBehavior>
        <a
          className={cn(
            "flex items-center px-3 py-2.5 rounded-lg transition-colors",
            isSubItem ? "pl-8 text-sm" : "text-base",
            isActive ? "bg-primary/20 text-primary font-semibold shadow-sm" : "hover:bg-secondary hover:text-secondary-foreground",
            "text-sidebar-foreground"
          )}
          target={item.external ? "_blank" : undefined}
          rel={item.external ? "noopener noreferrer" : undefined}
        >
          <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-sidebar-foreground/80")} />
          {item.label}
        </a>
      </Link>
    );
  };


  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex-col border-r bg-sidebar transition-transform duration-300 ease-in-out md:static md:flex",
        isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 md:w-16"
      )}>
        <ScrollArea className="h-full">
        <div className="flex items-center justify-between h-16 border-b px-4">
          <Link href="/dashboard" className={cn("font-bold text-xl text-sidebar-primary", isSidebarOpen ? "opacity-100" : "md:opacity-0 md:w-0 overflow-hidden")}>
            ConnectHost
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
             <Menu />
          </Button>
        </div>
        <nav className="flex-grow p-4 space-y-1.5">
          {allNavItemsForUser.map((item) => (
            isSidebarOpen ? (
              <NavLink key={item.label + item.href} item={item} />
            ) : (
               <Link href={item.href === '#' ? (item.children && item.children[0].href) || '/dashboard' : item.href} key={`${item.label + item.href}-icon`} legacyBehavior>
                <a title={item.label} className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-lg transition-colors",
                   pathname.startsWith(item.href) && item.href !== '/dashboard' && item.href !== (user && `/${user.role}/dashboard`) && item.href !== '#' ? "bg-primary/20 text-primary" : (pathname === item.href && item.href !== '#' ? "bg-primary/20 text-primary" : "hover:bg-secondary text-sidebar-foreground"),
                   item.children && item.children.some(child => pathname.startsWith(child.href) && child.href !== '#') && "bg-primary/20 text-primary"
                )}>
                  <item.icon className="h-5 w-5" />
                </a>
              </Link>
            )
          ))}
        </nav>
        </ScrollArea>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between h-16 border-b bg-card px-4 md:px-6">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu />
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline">Role: {user.role}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://placehold.co/100x100.png?text=${userInitial}`} alt={user.nom || 'User'} data-ai-hint="user initial" />
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.nom}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
