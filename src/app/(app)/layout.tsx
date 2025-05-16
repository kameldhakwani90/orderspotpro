
"use client";
import AppShell from '@/components/shared/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useRouter }package src.app.auth.layout;
import {useEffect} from 'react';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    // Optionally, show a loading spinner or a blank page while redirecting
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="p-8 animate-pulse">Loading application...</div>
        </div>
    );
  }
  
  return <AppShell>{children}</AppShell>;
}
