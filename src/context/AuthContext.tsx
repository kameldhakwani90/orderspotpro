"use client";

import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Types locaux
interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface Site {
  id: string;
  name: string;
  url: string;
  hostId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, motDePasse: string) => Promise<boolean>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  managedGlobalSites: Site[];
  selectedGlobalSite: Site | null;
  setSelectedGlobalSite: (site: Site | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const log = (message: string, data?: any) => {
  console.log(`[${new Date().toISOString()}] AuthContext: ${message}`, data !== undefined ? data : '');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [managedGlobalSites, setManagedGlobalSitesState] = useState<Site[]>([]);
  const [selectedGlobalSite, setSelectedGlobalSiteState] = useState<Site | null>(null);
  const router = useRouter();

  const setSelectedGlobalSite = useCallback((site: Site | null) => {
    log('Setting selected global site:', site);
    setSelectedGlobalSiteState(site);
    if (site && typeof window !== 'undefined') {
      localStorage.setItem('selectedGlobalSiteId', site.id);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('selectedGlobalSiteId');
    }
  }, []);

  const fetchHostSites = useCallback(async (hostId: string, attemptStoredSelection = false) => {
    log('Fetching managed sites for host:', hostId);
    try {
      // Mock sites pour l'instant - vous pouvez créer une API /api/sites plus tard
      const sites: Site[] = [
        {
          id: '1',
          name: 'Site Principal',
          url: 'https://orderspot.com',
          hostId: hostId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      setManagedGlobalSitesState(sites);
      
      let siteToSelect: Site | null = null;
      if (sites.length > 0) {
        const storedSelectedSiteId = attemptStoredSelection && typeof window !== 'undefined' 
          ? localStorage.getItem('selectedGlobalSiteId') 
          : null;
        if (storedSelectedSiteId) {
          const foundStored = sites.find(s => s.id === storedSelectedSiteId);
          if (foundStored) {
            siteToSelect = foundStored;
            log('Restored selected site from localStorage:', siteToSelect);
          }
        }
        if (!siteToSelect) {
          siteToSelect = sites[0];
          log('Defaulting to first managed site:', siteToSelect);
        }
      }
      setSelectedGlobalSite(siteToSelect);

    } catch (error) {
      log('Error fetching managed sites:', error);
      setManagedGlobalSitesState([]);
      setSelectedGlobalSite(null);
    }
  }, [setSelectedGlobalSite]);

  const loadUserFromStorage = useCallback(async () => {
    log('Attempting to load user from storage...');
    setIsLoading(true);
    
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    
    const storedUser = localStorage.getItem('user');
    log('Stored User from localStorage:', storedUser);

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        log('User parsed successfully from storage:', userData);
        setUser(userData);
        
        if (userData.role === 'host' && userData.hostId) {
          await fetchHostSites(userData.hostId, true);
        } else {
          setManagedGlobalSitesState([]);
          setSelectedGlobalSite(null);
        }
      } catch (error) {
        log('Error parsing user from storage:', error);
        localStorage.removeItem('user');
        setUser(null);
        setManagedGlobalSitesState([]);
        setSelectedGlobalSite(null);
      }
    } else {
      log('No stored user found.');
      setUser(null);
      setManagedGlobalSitesState([]);
      setSelectedGlobalSite(null);
    }
    setIsLoading(false);
    log('Finished loading user from storage.');
  }, [fetchHostSites, setSelectedGlobalSite]);

  useEffect(() => {
    log('AuthProvider mounted. Loading user from storage...');
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  useEffect(() => {
    log('Auth state changed.', { 
      isLoading, 
      userId: user?.id || null, 
      userEmail: user?.email || null, 
      selectedSite: selectedGlobalSite?.name 
    });
  }, [isLoading, user, selectedGlobalSite]);

  const login = async (email: string, motDePasse: string): Promise<boolean> => {
    log('Login attempt initiated via API.', { email });
    setIsLoading(true);
    let loginSuccessful = false;
    
    try {
      // Utiliser l'API au lieu des fonctions locales
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password: motDePasse // L'API attend 'password', pas 'motDePasse'
        }),
      });

      log('API Response status:', response.status);
      const data = await response.json();
      log('API Response data:', data);

      if (data.success && data.data) {
        const foundUser = data.data;
        setUser(foundUser);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(foundUser));
          // Garder la compatibilité avec l'ancien système
          localStorage.setItem('connectHostUserId', foundUser.id);
        }
        
        if (foundUser.role === 'host' && foundUser.hostId) {
          await fetchHostSites(foundUser.hostId, false);
        } else {
          setManagedGlobalSitesState([]);
          setSelectedGlobalSite(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('selectedGlobalSiteId');
          }
        }
        
        loginSuccessful = true;
        log('Login successful via API.', { email: foundUser.email, id: foundUser.id });
         // NOUVELLE LOGIQUE DE REDIRECTION PAR RÔLE
            if (typeof window !== 'undefined') {
              setTimeout(() => {
                switch (foundUser.role) {
                  case 'ADMIN':
                    log('Redirecting to admin dashboard...');
                    window.location.href = '/admin/dashboard';
                    break;
                  case 'MANAGER':
                    log('Redirecting to manager dashboard...');
                    window.location.href = '/manager/dashboard';
                    break;
                  case 'host':
                    log('Redirecting to host dashboard...');
                    window.location.href = '/host/dashboard';
                    break;
                  default:
                    log('Redirecting to user dashboard...');
                    window.location.href = '/dashboard';
                    break;
                }
              }, 100);
            }
      } else {
        log('Login failed via API:', data.error || 'Unknown error');
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('connectHostUserId'); 
          localStorage.removeItem('selectedGlobalSiteId');
        }
        setManagedGlobalSitesState([]);
        setSelectedGlobalSite(null);
      }
    } catch (error) {
      log('Login API error:', error);
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('connectHostUserId');
        localStorage.removeItem('selectedGlobalSiteId');
      }
      setManagedGlobalSitesState([]);
      setSelectedGlobalSite(null);
    }
    
    setIsLoading(false);
    log('Login attempt finished.', { loginSuccessful });
    return loginSuccessful;
  };

  const logout = useCallback(() => {
    log('Logout initiated.', { currentUserId: user?.id || 'No user logged in' });
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('connectHostUserId');
      localStorage.removeItem('selectedGlobalSiteId');
    }
    setManagedGlobalSitesState([]);
    setSelectedGlobalSite(null);
    router.push('/login');
    log('Logout completed.');
  }, [router, user]);

  return (
    <AuthContext.Provider value={{ 
        user, 
        isLoading, 
        login, 
        logout, 
        setUser, 
        managedGlobalSites, 
        selectedGlobalSite, 
        setSelectedGlobalSite 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Fonctions de compatibilité pour éviter les erreurs d'import
export function getUserByEmail(email: string): Promise<User | undefined> {
  return fetch('/api/users')
    .then(res => res.json())
    .then(data => data.success ? data.data.find((u: User) => u.email === email) : undefined)
    .catch(() => undefined);
}

export function getUserById(id: string): Promise<User | undefined> {
  return fetch('/api/users')
    .then(res => res.json())
    .then(data => data.success ? data.data.find((u: User) => u.id === id) : undefined)
    .catch(() => undefined);
}

export function getSites(hostId?: string): Promise<Site[]> {
  // Mock pour l'instant
  return Promise.resolve([
    {
      id: '1',
      name: 'Site Principal',
      url: 'https://orderspot.com',
      hostId: hostId || '1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
}