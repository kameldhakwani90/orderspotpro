
"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MinimalHostClientsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role !== 'host') {
      router.replace('/dashboard'); // Redirect if not host
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'host') {
    return <div className="p-6">Loading host client data or unauthorized...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Minimal Host Clients Page</h1>
      <p className="text-lg text-muted-foreground mt-2">
        If you see this, the basic page is loading.
      </p>
      <p className="mt-4">Current User: {user.nom} (Role: {user.role})</p>
      <p className="mt-1">Host ID: {user.hostId || "Not assigned"}</p>
    </div>
  );
}
