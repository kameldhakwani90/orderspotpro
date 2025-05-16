
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadUserFromStorage = useCallback(async () => {
    console.log('AuthContext: Attempting to load user from storage...');
    setIsLoading(true);
    const storedUserId = localStorage.getItem('connectHostUserId');
    console.log('AuthContext: Stored User ID:', storedUserId);
    if (storedUserId) {
      try {
        const fetchedUser = await getUserById(storedUserId);
        if (fetchedUser) {
          console.log('AuthContext: User fetched successfully:', fetchedUser.email);
          setUser(fetchedUser);
        } else {
          console.warn(`AuthContext: User with ID ${storedUserId} not found. Clearing storage.`);
          localStorage.removeItem('connectHostUserId');
          setUser(null); 
        }
      } catch (error) {
        console.error("AuthContext: Error fetching user from storage:", error);
        localStorage.removeItem('connectHostUserId');
        setUser(null);
      }
    } else {
      console.log('AuthContext: No stored user ID found.');
      setUser(null); // Ensure user is null if no ID found
    }
    setIsLoading(false);
    console.log('AuthContext: Finished loading user from storage. isLoading:', false, 'User email:', user?.email || 'null');
  }, []); // Removed router from dependencies as it's not used directly here

  useEffect(() => {
    console.log('AuthContext: useEffect triggered to load user from storage.');
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  useEffect(() => {
    console.log('AuthContext: State changed - isLoading:', isLoading, 'user:', user?.email || null);
  }, [isLoading, user]);

  const login = async (email: string, motDePasse: string): Promise<boolean> => {
    console.log('AuthContext: Attempting login for email:', email);
    setIsLoading(true);
    try {
      const foundUser = await getUserByEmail(email);
      if (foundUser && foundUser.motDePasse === motDePasse) {
        setUser(foundUser);
        localStorage.setItem('connectHostUserId', foundUser.id);
        console.log('AuthContext: Login successful for:', foundUser.email);
        setIsLoading(false);
        return true;
      } else {
        console.warn('AuthContext: Login failed - user not found or password mismatch for:', email);
      }
    } catch (error) {
      console.error("AuthContext: Login error:", error);
    }
    setIsLoading(false);
    return false;
  };

  const logout = useCallback(() => {
    console.log('AuthContext: Logging out user:', user?.email || 'No user was logged in');
    setUser(null);
    localStorage.removeItem('connectHostUserId');
    router.push('/login');
  }, [router, user]); // Added user to dependency array for logging its value before nullifying

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

