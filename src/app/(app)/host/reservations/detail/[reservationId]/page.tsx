
"use client";

import { useParams } from 'next/navigation';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function MinimalHostReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.reservationId as string;

  if (!reservationId) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Reservation ID not found in URL.</p>
            <Button onClick={() => router.back()} variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Minimal Reservation Detail Page</CardTitle>
        </CardHeader>
        <CardContent>
          <p>If you see this, the basic dynamic route is working.</p>
          <p className="mt-2">Reservation ID from URL: <strong>{reservationId}</strong></p>
          <Button onClick={() => router.push('/host/reservations')} variant="outline" className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reservations List
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
