
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getClientRecordsByUserId, getOrdersByUserId, getReservationsByUserId, getHostById, getRoomOrTableById } from '@/lib/data';
import type { Client, Order, Reservation, Host, RoomOrTable } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Gift, ShoppingBag, CalendarCheck, BedDouble, Utensils, ArrowRight, FileText } from 'lucide-react';
import { format, parseISO, isFuture, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EnrichedOrder extends Order {
  serviceName?: string;
  locationName?: string;
  hostName?: string;
}

interface CurrentStayInfo {
  reservationId: string;
  locationName: string;
  locationType?: 'Chambre' | 'Table';
  hostName: string;
  hostId: string;
  locationId: string;
  dateDepart?: string;
}

export default function ClientDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [clientRecords, setClientRecords] = useState<Client[]>([]);
  const [recentOrders, setRecentOrders] = useState<EnrichedOrder[]>([]);
  const [currentStay, setCurrentStay] = useState<CurrentStayInfo | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [totalCredit, setTotalCredit] = useState(0);
  const [totalLoyaltyPoints, setTotalLoyaltyPoints] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user || !user.id) {
      setIsLoadingData(false);
      return;
    }
    setIsLoadingData(true);
    try {
      const [clientData, ordersData, reservationsData] = await Promise.all([
        getClientRecordsByUserId(user.id),
        getOrdersByUserId(user.id),
        getReservationsByUserId(user.id),
      ]);

      setClientRecords(clientData);
      
      let creditSum = 0;
      let pointsSum = 0;
      clientData.forEach(record => {
        creditSum += record.credit || 0;
        pointsSum += record.pointsFidelite || 0;
      });
      setTotalCredit(creditSum);
      setTotalLoyaltyPoints(pointsSum);

      const enrichedOrders = await Promise.all(
        ordersData.slice(0, 3).map(async (order) => { // Show 3 most recent orders
          // Assuming getServiceById, getRoomOrTableById, getHostById exist
          // const service = await getServiceById(order.serviceId); 
          // const location = await getRoomOrTableById(order.chambreTableId);
          // const host = await getHostById(order.hostId);
          return {
            ...order,
            // serviceName: service?.titre || 'Service Inconnu',
            // locationName: location ? `${location.type} ${location.nom}` : 'Lieu Inconnu',
            // hostName: host?.nom || 'Établissement Inconnu',
            // For simplicity in this pass, we'll skip full enrichment if not critical for dashboard summary
            serviceName: order.serviceId, // Placeholder, enrich if needed
            locationName: order.chambreTableId,
            hostName: order.hostId,
          };
        })
      );
      setRecentOrders(enrichedOrders);

      const activeCheckIn = reservationsData.find(
        res => res.status === 'checked-in' && res.dateDepart && isFuture(parseISO(res.dateDepart))
      );

      if (activeCheckIn) {
        const [host, location] = await Promise.all([
          getHostById(activeCheckIn.hostId),
          getRoomOrTableById(activeCheckIn.locationId),
        ]);
        setCurrentStay({
          reservationId: activeCheckIn.id,
          locationName: location?.nom || 'Lieu Inconnu',
          locationType: location?.type,
          hostName: host?.nom || 'Établissement Inconnu',
          hostId: activeCheckIn.hostId,
          locationId: activeCheckIn.locationId,
          dateDepart: activeCheckIn.dateDepart
        });
      } else {
        setCurrentStay(null);
      }

    } catch (error) {
      console.error("Failed to load client dashboard data:", error);
      // Add toast notification here if needed
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (authLoading || isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-r from-primary/80 to-primary text-primary-foreground shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl">Bienvenue, {user?.nom || 'Client'} !</CardTitle>
          <CardDescription className="text-primary-foreground/80">Votre espace personnel ConnectHost.</CardDescription>
        </CardHeader>
      </Card>

      {currentStay && (
        <Card className="shadow-lg border-green-500 border-2">
          <CardHeader>
            <CardTitle className="text-xl text-green-600 flex items-center">
              <BedDouble className="mr-2 h-6 w-6" /> Mon Séjour Actuel
            </CardTitle>
            <CardDescription>
              Vous séjournez actuellement à <span className="font-semibold">{currentStay.locationName}</span> ({currentStay.locationType}) chez <span className="font-semibold">{currentStay.hostName}</span>.
              {currentStay.dateDepart && ` Départ prévu le ${format(parseISO(currentStay.dateDepart), 'PPP', {locale:fr})}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/client/${currentStay.hostId}/${currentStay.locationId}`}>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Voir les Services de mon Lieu <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde Crédit</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCredit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Disponible pour vos achats.</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points de Fidélité</CardTitle>
            <Gift className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLoyaltyPoints} pts</div>
            <p className="text-xs text-muted-foreground">Utilisez-les pour des récompenses.</p>
          </CardContent>
        </Card>
        <Card className="shadow-md md:col-span-2 lg:col-span-1 bg-primary/10 border-primary/30">
          <CardHeader className="pb-2">
             <CardTitle className="text-lg text-primary">Accès Rapides</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-2">
             <Link href="/client/my-reservations" passHref>
                <Button variant="outline" className="w-full justify-start text-primary hover:bg-primary/10 hover:text-primary border-primary/50">
                    <CalendarCheck className="mr-2 h-4 w-4"/> Mes Réservations
                </Button>
            </Link>
             {/* Placeholder for future "Mes Factures" link */}
            <Button variant="outline" className="w-full justify-start" disabled>
                <FileText className="mr-2 h-4 w-4"/> Mes Factures (Bientôt)
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Mes Commandes Récentes</CardTitle>
          <CardDescription>Les derniers services que vous avez commandés.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <ul className="space-y-3">
              {recentOrders.map(order => (
                <li key={order.id} className="p-3 border rounded-md bg-muted/30">
                  <div className="font-semibold">{order.serviceName}</div>
                  <div className="text-xs text-muted-foreground">
                    Chez: {order.hostName} - Lieu: {order.locationName} - {format(parseISO(order.dateHeure), 'Pp', { locale: fr })}
                  </div>
                  <div className="text-sm mt-1">Statut: <span className="capitalize font-medium">{order.status}</span> - Prix: ${order.prixTotal?.toFixed(2) || 'N/A'}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">Vous n'avez pas de commandes récentes.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
