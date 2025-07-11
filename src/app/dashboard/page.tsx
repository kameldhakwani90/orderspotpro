
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardRedirectPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      switch (user.role) {
        case 'admin':
          router.replace('/admin/dashboard');
          break;
        case 'host':
          router.replace('/host/dashboard');
          break;
        case 'client':
          // Clients don't typically have a dashboard, they access via specific URLs
          // For now, redirect to a generic client page or show a message.
          // This could be a page that says "Scan a QR code to begin."
          router.replace('/client/landing'); // A placeholder client landing page
          break;
        default:
          router.replace('/login');
      }
    } else if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="space-y-4 text-center">
        <Skeleton className="h-12 w-48 mx-auto" />
        <Skeleton className="h-8 w-64 mx-auto" />
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
