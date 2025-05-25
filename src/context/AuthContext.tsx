
"use client";

import type { User, Site } from '@/lib/types'; // Added Site
import { getUserByEmail, getUserById, getSites } from '@/lib/data'; // Added getSites
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { SetStateAction } from 'react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, motDePasse: string) => Promise<boolean>;
  logout: () => void;
  setUser: React.Dispatch<SetStateAction<User | null>>;
  managedGlobalSites: Site[];
  selectedGlobalSite: Site | null;
  setSelectedGlobalSite: (site: Site | null) => void;
  // Removed setManagedGlobalSites as it will be handled internally
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const log = (message: string, data?: any) => {
  // console.log(`[${new Date().toISOString()}] AuthContext: ${message}`, data !== undefined ? data : '');
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
    if (site) {
        localStorage.setItem('selectedGlobalSiteId', site.siteId);
    } else {
        localStorage.removeItem('selectedGlobalSiteId');
    }
  }, []);


  const fetchHostSites = useCallback(async (hostId: string, attemptStoredSelection = false) => {
    log('Fetching managed sites for host:', hostId);
    try {
      const sites = await getSites(hostId);
      setManagedGlobalSitesState(sites);
      
      let siteToSelect: Site | null = null;
      if (sites.length > 0) {
        const storedSelectedSiteId = attemptStoredSelection ? localStorage.getItem('selectedGlobalSiteId') : null;
        if (storedSelectedSiteId) {
          const foundStored = sites.find(s => s.siteId === storedSelectedSiteId);
          if (foundStored) {
            siteToSelect = foundStored;
            log('Restored selected site from localStorage:', siteToSelect);
          }
        }
        if (!siteToSelect) {
          siteToSelect = sites[0]; // Default to first site
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
    const storedUserId = localStorage.getItem('connectHostUserId');
    log('Stored User ID from localStorage:', storedUserId);

    if (storedUserId) {
      try {
        log(`Fetching user by ID: ${storedUserId}`);
        const fetchedUser = await getUserById(storedUserId);
        if (fetchedUser) {
          log('User fetched successfully from data source.', { email: fetchedUser.email, id: fetchedUser.id });
          setUser(fetchedUser);
          if (fetchedUser.role === 'host' && fetchedUser.hostId) {
            await fetchHostSites(fetchedUser.hostId, true); // Pass true to attempt stored selection
          } else {
            setManagedGlobalSitesState([]);
            setSelectedGlobalSite(null);
          }
        } else {
          log(`User with ID ${storedUserId} not found. Clearing storage and setting user to null.`);
          localStorage.removeItem('connectHostUserId');
          localStorage.removeItem('selectedGlobalSiteId');
          setUser(null);
          setManagedGlobalSitesState([]);
          setSelectedGlobalSite(null);
        }
      } catch (error) {
        log('Error fetching user from storage:', error);
        localStorage.removeItem('connectHostUserId');
        localStorage.removeItem('selectedGlobalSiteId');
        setUser(null);
        setManagedGlobalSitesState([]);
        setSelectedGlobalSite(null);
      }
    } else {
      log('No stored user ID found. Setting user to null.');
      setUser(null);
      setManagedGlobalSitesState([]);
      setSelectedGlobalSite(null);
    }
    setIsLoading(false);
    log('Finished loading user from storage (isLoading will be false).');
  }, [fetchHostSites, setSelectedGlobalSite]);

  useEffect(() => {
    log('AuthProvider mounted or loadUserFromStorage changed. Initial isLoading state: true.');
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  useEffect(() => {
    log('Auth state changed.', { isLoading, userId: user?.id || null, userEmail: user?.email || null, selectedSite: selectedGlobalSite?.nom });
  }, [isLoading, user, selectedGlobalSite]);

  const login = async (email: string, motDePasse: string): Promise<boolean> => {
    log('Login attempt initiated.', { email });
    setIsLoading(true);
    let loginSuccessful = false;
    try {
      const foundUser = await getUserByEmail(email);
      if (foundUser) {
        log('User found by email.', { email: foundUser.email, id: foundUser.id, retrievedMotDePasseIsSet: !!foundUser.motDePasse });
        
        const trimmedStoredPassword = (foundUser.motDePasse || '').trim();
        const trimmedEnteredPassword = (motDePasse || '').trim();

        const enteredChars = Array.from(trimmedEnteredPassword).map(char => char.charCodeAt(0));
        const storedChars = Array.from(trimmedStoredPassword).map(char => char.charCodeAt(0));
        log('Password Char Codes (trimmed):', { entered: enteredChars, stored: storedChars });
        log('Comparing passwords.', {
          entered: trimmedEnteredPassword,
          enteredLength: trimmedEnteredPassword.length,
          stored: trimmedStoredPassword,
          storedLength: trimmedStoredPassword.length,
        });
        
        if (trimmedStoredPassword === trimmedEnteredPassword) {
          setUser(foundUser);
          localStorage.setItem('connectHostUserId', foundUser.id);
          if (foundUser.role === 'host' && foundUser.hostId) {
            await fetchHostSites(foundUser.hostId, false); // Don't use stored selection on fresh login, default to first
          } else {
            setManagedGlobalSitesState([]);
            setSelectedGlobalSite(null);
            localStorage.removeItem('selectedGlobalSiteId');
          }
          loginSuccessful = true;
          log('Login successful.', { email: foundUser.email, id: foundUser.id });
        } else {
          log('Password mismatch for user: ' + email);
          setUser(null); 
          localStorage.removeItem('connectHostUserId'); 
          localStorage.removeItem('selectedGlobalSiteId');
          setManagedGlobalSitesState([]);
          setSelectedGlobalSite(null);
        }
      } else {
        log('User not found by email.', { email });
        setUser(null); 
        localStorage.removeItem('connectHostUserId'); 
        localStorage.removeItem('selectedGlobalSiteId');
        setManagedGlobalSitesState([]);
        setSelectedGlobalSite(null);
      }
    } catch (error) {
      log('Login error:', error);
      setUser(null);
      localStorage.removeItem('connectHostUserId');
      localStorage.removeItem('selectedGlobalSiteId');
      setManagedGlobalSitesState([]);
      setSelectedGlobalSite(null);
    }
    setIsLoading(false);
    log('Login attempt finished.', { finalIsLoading: false, loginSuccessful });
    return loginSuccessful;
  };

  const logout = useCallback(() => {
    log('Logout initiated.', { currentUserId: user?.id || 'No user logged in' });
    setUser(null);
    localStorage.removeItem('connectHostUserId');
    localStorage.removeItem('selectedGlobalSiteId');
    setManagedGlobalSitesState([]);
    setSelectedGlobalSite(null);
    router.push('/login');
    log('Logout completed. User set to null, localStorage cleared, redirected to /login.');
  }, [router, user]); // user is needed here to log currentUserId

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
