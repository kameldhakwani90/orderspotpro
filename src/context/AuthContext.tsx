
"use client";

import type { User, UserRole } from '@/lib/types';
import { getUserByEmail, getUserById } from '@/lib/data';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { SetStateAction } from 'react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, motDePasse: string) => Promise<boolean>;
  logout: () => void;
  setUser: React.Dispatch<SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const log = (message: string, data?: any) => {
  console.log(`[${new Date().toISOString()}] AuthContext: ${message}`, data !== undefined ? data : '');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    log('AuthProvider mounted. Initial isLoading state: true.');
  }, []);

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
        } else {
          log(`User with ID ${storedUserId} not found in data source. Clearing storage and setting user to null.`);
          localStorage.removeItem('connectHostUserId');
          setUser(null);
        }
      } catch (error) {
        log('Error fetching user from storage:', error);
        localStorage.removeItem('connectHostUserId');
        setUser(null);
      }
    } else {
      log('No stored user ID found in localStorage. Setting user to null.');
      setUser(null);
    }
    setIsLoading(false);
    log('Finished loading user from storage (isLoading will be false).', { finalIsLoading: false });
  }, []);

  useEffect(() => {
    log('useEffect to load user from storage triggered.');
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  useEffect(() => {
    log('Auth state changed.', { isLoading, userId: user?.id || null, userEmail: user?.email || null });
  }, [isLoading, user]);

  const login = async (email: string, motDePasse: string): Promise<boolean> => {
    log('Login attempt initiated.', { email });
    setIsLoading(true);
    let loginSuccessful = false;
    try {
      const foundUser = await getUserByEmail(email);
      if (foundUser) {
        log('User found in database by email.', { email: foundUser.email, id: foundUser.id, retrievedMotDePasse: foundUser.motDePasse });
        
        const storedPassword = foundUser.motDePasse || ''; // Ensure it's a string for trim()
        const enteredPassword = motDePasse || ''; // Ensure it's a string for trim()

        const trimmedStoredPassword = storedPassword.trim();
        const trimmedEnteredPassword = enteredPassword.trim();

        log('Comparing passwords.', {
          entered: enteredPassword,
          enteredLength: enteredPassword.length,
          trimmedEntered: trimmedEnteredPassword,
          trimmedEnteredLength: trimmedEnteredPassword.length,
          stored: storedPassword,
          storedLength: storedPassword.length,
          trimmedStored: trimmedStoredPassword,
          trimmedStoredLength: trimmedStoredPassword.length,
        });

        // Log character codes for deep comparison
        const enteredChars = Array.from(trimmedEnteredPassword).map(char => char.charCodeAt(0));
        const storedChars = Array.from(trimmedStoredPassword).map(char => char.charCodeAt(0));
        log('Password Char Codes (trimmed):', {
          entered: enteredChars,
          stored: storedChars,
        });
        
        if (trimmedStoredPassword === trimmedEnteredPassword) {
          setUser(foundUser);
          localStorage.setItem('connectHostUserId', foundUser.id);
          loginSuccessful = true;
          log('Login successful.', { email: foundUser.email, id: foundUser.id });
        } else {
          log('Password mismatch for user: ' + email);
          setUser(null); 
          localStorage.removeItem('connectHostUserId'); 
        }
      } else {
        log('User not found in database.', { email });
        setUser(null); 
        localStorage.removeItem('connectHostUserId'); 
      }
    } catch (error) {
      log('Login error:', error);
      setUser(null);
      localStorage.removeItem('connectHostUserId');
    }
    setIsLoading(false);
    log('Login attempt finished.', { finalIsLoading: false, loginSuccessful });
    return loginSuccessful;
  };

  const logout = useCallback(() => {
    log('Logout initiated.', { currentUserId: user?.id || 'No user logged in' });
    setUser(null);
    localStorage.removeItem('connectHostUserId');
    router.push('/login');
    log('Logout completed. User set to null, localStorage cleared, redirected to /login.');
  }, [router, user]); 

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setUser }}>
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
