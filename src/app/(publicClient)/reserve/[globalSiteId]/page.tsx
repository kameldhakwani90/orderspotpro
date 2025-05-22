
"use client";

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button'; // Keep one UI import to see if components load
import { useEffect } from 'react';

export default function PublicReservationPageMinimalTest() {
  const params = useParams();
  const globalSiteId = params.globalSiteId as string;

  useEffect(() => {
    console.log("[PublicReservationPageMinimalTest] Mounted. globalSiteId from URL:", globalSiteId);
  }, [globalSiteId]);

  if (!globalSiteId) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-lg text-destructive">Error: Global Site ID is missing from the URL.</p>
        <Button onClick={() => window.history.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 px-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Minimal Reservation Page Test</h1>
      <p className="text-xl mb-2">
        Attempting to load page for Global Site ID:
      </p>
      <p className="text-2xl font-mono p-4 bg-muted rounded-md inline-block">
        {globalSiteId}
      </p>
      <p className="mt-6 text-sm text-muted-foreground">
        If you see this, the basic dynamic route is working.
        The next step would be to check data fetching for this ID.
      </p>
      <Button onClick={() => window.history.back()} className="mt-8">Go Back (Test)</Button>
    </div>
  );
}
