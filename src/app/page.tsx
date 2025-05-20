"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("✅ Test de déploiement du 20 mai 2025");

    if (!isLoading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  );
}
