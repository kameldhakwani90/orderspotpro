
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
    setIsLoading(true);
    const storedUserId = localStorage.getItem('connectHostUserId');
    if (storedUserId) {
      try {
        const fetchedUser = await getUserById(storedUserId);
        if (fetchedUser) {
          setUser(fetchedUser);
        } else {
          localStorage.removeItem('connectHostUserId');
        }
      } catch (error) {
        console.error("Failed to fetch user from storage:", error);
        localStorage.removeItem('connectHostUserId');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const login = async (email: string, motDePasse: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const foundUser = await getUserByEmail(email);
      if (foundUser && foundUser.motDePasse === motDePasse) {
        setUser(foundUser);
        localStorage.setItem('connectHostUserId', foundUser.id);
        setIsLoading(false);
        return true;
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
    setIsLoading(false);
    return false;
  };

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('connectHostUserId');
    router.push('/login');
  }, [router]);

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
