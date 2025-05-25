
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getReservationsByUserId, getHostById, getRoomOrTableById } from '@/lib/data';
import type { Reservation, EnrichedReservation, Host, RoomOrTable, ReservationStatus } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Eye, Search, ListFilter } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

const reservationStatuses: ReservationStatus[] = ["pending", "confirmed", "checked-in", "checked-out", "cancelled"];

export default function MyReservationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [reservations, setReservations] = useState<EnrichedReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all');

  const fetchClientReservations = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const userReservations = await getReservationsByUserId(userId);
      const enrichedReservations = await Promise.all(
        userReservations.map(async (res) => {
          const [hostData, locationData] = await Promise.all([
            getHostById(res.hostId),
            getRoomOrTableById(res.locationId),
          ]);
          return {
            ...res,
            hostName: hostData?.nom || 'Établissement Inconnu',
            locationName: locationData?.nom || 'Lieu Inconnu',
            locationType: locationData?.type,
          };
        })
      );
      setReservations(enrichedReservations);
    } catch (error) {
      console.error("Failed to fetch client reservations:", error);
      // Consider adding a toast notification here
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id && !authLoading) {
      fetchClientReservations(user.id);
    } else if (!authLoading && !user) {
      // Handle case where user is not logged in, though layout should prevent this
      setIsLoading(false);
    }
  }, [user, authLoading, fetchClientReservations]);

  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      const matchesSearchTerm = 
        res.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.hostName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.locationName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || res.status === statusFilter;
      
      return matchesSearchTerm && matchesStatus;
    });
  }, [reservations, searchTerm, statusFilter]);

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
          <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Veuillez vous connecter pour voir vos réservations.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Mes Réservations</CardTitle>
          <CardDescription>Consultez et gérez toutes vos réservations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="space-y-1.5">
              <label htmlFor="searchTerm" className="text-sm font-medium text-muted-foreground">Rechercher</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="searchTerm"
                  type="text"
                  placeholder="ID Rés., Établissement, Lieu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="statusFilter" className="text-sm font-medium text-muted-foreground">Filtrer par Statut</label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ReservationStatus | 'all')}>
                <SelectTrigger id="statusFilter" className="bg-card">
                  <div className="flex items-center">
                    <ListFilter className="h-4 w-4 mr-2 text-muted-foreground"/>
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les Statuts</SelectItem>
                  {reservationStatuses.map(status => (
                    <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredReservations.length === 0 && !isLoading ? (
            <p className="text-center text-muted-foreground py-8">
              {reservations.length === 0 ? "Vous n'avez aucune réservation pour le moment." : "Aucune réservation ne correspond à vos filtres."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Rés.</TableHead>
                    <TableHead>Établissement</TableHead>
                    <TableHead>Lieu</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Arrivée</TableHead>
                    <TableHead>Départ</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.map((res) => (
                    <TableRow key={res.id}>
                      <TableCell className="font-medium text-xs">#{res.id.slice(-6)}</TableCell>
                      <TableCell>{res.hostName}</TableCell>
                      <TableCell>{res.locationName}</TableCell>
                      <TableCell>{res.locationType || res.type}</TableCell>
                      <TableCell>{isValid(parseISO(res.dateArrivee)) ? format(parseISO(res.dateArrivee), 'dd/MM/yy', { locale: fr }) : 'N/A'}</TableCell>
                      <TableCell>{res.dateDepart && isValid(parseISO(res.dateDepart)) ? format(parseISO(res.dateDepart), 'dd/MM/yy', { locale: fr }) : (res.type === 'Table' ? 'N/A' : 'N/A')}</TableCell>
                      <TableCell><Badge variant={res.status === 'cancelled' ? 'destructive' : 'secondary'} className="capitalize text-xs">{res.status || 'N/A'}</Badge></TableCell>
                      <TableCell>{res.prixTotal !== undefined ? `$${res.prixTotal.toFixed(2)}` : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/client/reservations/${res.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-1 h-4 w-4" /> Détails
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
