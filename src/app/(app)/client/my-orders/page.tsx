
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getOrdersByUserId, getHostById, getServiceById, getRoomOrTableById } from '@/lib/data';
import type { Order, Host, Service, RoomOrTable, OrderStatus } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Eye, Search, ListFilter, ShoppingCart, FileText as InvoiceIcon } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';


interface EnrichedOrder extends Order {
  serviceName?: string;
  locationName?: string;
  hostName?: string;
}
const orderStatusesList: OrderStatus[] = ["pending", "confirmed", "completed", "cancelled"]; // Renamed to avoid conflict

export default function MyOrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<EnrichedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [hostFilter, setHostFilter] = useState<string>('all');

  const [uniqueHostNames, setUniqueHostNames] = useState<Array<{id: string, name: string}>>([]);

  const fetchClientOrders = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const userOrders = await getOrdersByUserId(userId);
      const enriched = await Promise.all(
        userOrders.map(async (order) => {
          const [serviceData, locationData, hostData] = await Promise.all([
            getServiceById(order.serviceId),
            getRoomOrTableById(order.chambreTableId),
            getHostById(order.hostId),
          ]);
          return {
            ...order,
            serviceName: serviceData?.titre || 'Service Inconnu',
            locationName: locationData ? `${locationData.type} ${locationData.nom}` : 'Lieu Inconnu',
            hostName: hostData?.nom || 'Établissement Inconnu',
          };
        })
      );
      setOrders(enriched);

      const hostNamesMap = new Map<string, string>();
      enriched.forEach(order => {
        if (order.hostId && order.hostName) {
          hostNamesMap.set(order.hostId, order.hostName);
        }
      });
      setUniqueHostNames(Array.from(hostNamesMap, ([id, name]) => ({ id, name })).sort((a,b) => a.name.localeCompare(b.name)));

    } catch (error) {
      console.error("Failed to fetch client orders:", error);
      toast({title: "Erreur", description: "Impossible de charger vos commandes.", variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user?.id && !authLoading) {
      fetchClientOrders(user.id);
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [user, authLoading, fetchClientOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearchTerm = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.hostName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.locationName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesHost = hostFilter === 'all' || order.hostId === hostFilter;
      
      return matchesSearchTerm && matchesStatus && matchesHost;
    });
  }, [orders, searchTerm, statusFilter, hostFilter]);

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
        <p>Veuillez vous connecter pour voir vos commandes.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Mes Commandes</CardTitle>
          <CardDescription>Consultez l'historique de toutes vos commandes de services.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <label htmlFor="searchTermMyOrders" className="text-sm font-medium text-muted-foreground">Rechercher</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="searchTermMyOrders"
                  type="text"
                  placeholder="ID, Service, Établissement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="statusFilterMyOrders" className="text-sm font-medium text-muted-foreground">Filtrer par Statut</label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}>
                <SelectTrigger id="statusFilterMyOrders" className="bg-card">
                  <div className="flex items-center">
                    <ListFilter className="h-4 w-4 mr-2 text-muted-foreground"/>
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les Statuts</SelectItem>
                  {orderStatusesList.map(status => ( // Using renamed list
                    <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="hostFilterMyOrders" className="text-sm font-medium text-muted-foreground">Filtrer par Établissement</label>
              <Select value={hostFilter} onValueChange={setHostFilter} disabled={uniqueHostNames.length === 0}>
                <SelectTrigger id="hostFilterMyOrders" className="bg-card">
                   <div className="flex items-center">
                    <ListFilter className="h-4 w-4 mr-2 text-muted-foreground"/>
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les Établissements</SelectItem>
                  {uniqueHostNames.map(host => (
                    <SelectItem key={host.id} value={host.id}>{host.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredOrders.length === 0 && !isLoading ? (
            <p className="text-center text-muted-foreground py-8">
              {orders.length === 0 ? "Vous n'avez aucune commande pour le moment." : "Aucune commande ne correspond à vos filtres."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Comm.</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Établissement</TableHead>
                    <TableHead>Lieu</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead className="text-right">Facture</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium text-xs">#{order.id.slice(-6)}</TableCell>
                      <TableCell>{order.serviceName}</TableCell>
                      <TableCell>{order.hostName}</TableCell>
                      <TableCell>{order.locationName}</TableCell>
                      <TableCell>{isValid(parseISO(order.dateHeure)) ? format(parseISO(order.dateHeure), 'dd/MM/yy HH:mm', { locale: fr }) : 'N/A'}</TableCell>
                      <TableCell><Badge variant={order.status === 'cancelled' ? 'destructive' : 'secondary'} className="capitalize text-xs">{order.status || 'N/A'}</Badge></TableCell>
                      <TableCell>{order.prixTotal !== undefined ? `${(order.currency || '$')}${order.prixTotal.toFixed(2)}` : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/invoice/order/${order.id}`} target="_blank" passHref>
                            <Button variant="outline" size="sm">
                                <InvoiceIcon className="mr-1 h-4 w-4" /> Voir
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
