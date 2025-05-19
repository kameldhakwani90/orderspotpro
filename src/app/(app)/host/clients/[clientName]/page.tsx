
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getOrdersByClientName, getRoomOrTableById, getServiceById, getSiteById } from '@/lib/data';
import type { Order, RoomOrTable, Service, ClientDetails } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, ShoppingBag, MapPin, CalendarDays, Phone, Mail, DollarSign, AlertTriangle, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function ClientFilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  
  const clientNameParam = params.clientName as string;
  const [clientName, setClientName] = useState<string>("");

  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientNameParam) {
      setClientName(decodeURIComponent(clientNameParam));
    }
  }, [clientNameParam]);

  const fetchData = useCallback(async (hostId: string, name: string) => {
    if (!name) {
      setError("Client name not provided.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const ordersData = await getOrdersByClientName(hostId, name);
      if (ordersData.length === 0) {
        setClientDetails({ name, orders: [], locations: [] });
        setIsLoading(false);
        return;
      }

      const enrichedOrders = await Promise.all(
        ordersData.map(async (order) => {
          const service = await getServiceById(order.serviceId);
          const location = await getRoomOrTableById(order.chambreTableId);
          return {
            ...order,
            serviceName: service?.titre || 'Unknown Service',
            locationName: location ? `${location.type} ${location.nom}` : 'Unknown Location',
          };
        })
      );

      const locationIds = [...new Set(ordersData.map(o => o.chambreTableId))];
      const locationsDataPromises = locationIds.map(id => getRoomOrTableById(id));
      const resolvedLocations = (await Promise.all(locationsDataPromises)).filter(loc => loc !== undefined) as RoomOrTable[];
      
      const enrichedLocations = await Promise.all(
        resolvedLocations.map(async (loc) => {
            const globalSite = await getSiteById(loc.globalSiteId);
            return { ...loc, globalSiteName: globalSite?.nom || 'Unknown Global Site' };
        })
      );


      setClientDetails({
        name: name,
        orders: enrichedOrders,
        locations: enrichedLocations,
      });

    } catch (e) {
      console.error("Failed to fetch client details:", e);
      setError("Failed to load client details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && authUser?.hostId && clientName) {
      fetchData(authUser.hostId, clientName);
    } else if (!authLoading && !authUser?.hostId) {
        router.replace('/dashboard'); // Not a host
    }
  }, [authUser, authLoading, clientName, fetchData, router]);

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-6">
        <Skeleton className="h-10 w-1/3 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.back()} className="mt-6">Go Back</Button>
      </div>
    );
  }

  if (!clientDetails) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <Info className="mx-auto h-12 w-12 text-primary mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Client Not Found</h2>
        <p className="text-muted-foreground">No details found for client: {clientName}</p>
        <Button onClick={() => router.push('/host/orders')} className="mt-6">Back to Orders</Button>
      </div>
    );
  }
  
  const totalSpent = clientDetails.orders
    .filter(o => o.status === 'completed' && o.prix)
    .reduce((sum, o) => sum + (o.prix || 0), 0);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center">
            <User className="mr-3 h-10 w-10 text-primary" /> Client File: {clientDetails.name}
          </h1>
          <p className="text-lg text-muted-foreground">Overview of client activity and details.</p>
        </div>
        <Button onClick={() => router.push('/host/orders')} variant="outline">Back to Orders</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="text-xl flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>Key Information</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> Arrival/Departure: <span className="ml-1 text-muted-foreground italic">(Data not captured)</span></div>
            <div className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" /> Phone: <span className="ml-1 text-muted-foreground italic">(Data not captured)</span></div>
            <div className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Email: <span className="ml-1 text-muted-foreground italic">(Data not captured)</span></div>
             <div className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-green-500" /> Total Spent (Completed): <span className="ml-1 font-semibold">${totalSpent.toFixed(2)}</span></div>
          </CardContent>
        </Card>

        <Card className="shadow-lg lg:col-span-2">
          <CardHeader><CardTitle className="text-xl flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary"/>Locations Used</CardTitle></CardHeader>
          <CardContent>
            {clientDetails.locations.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {clientDetails.locations.map(loc => (
                  <li key={loc.id} className="p-2 bg-secondary/50 rounded-md">
                    <span className="font-medium">{loc.type} {loc.nom}</span> at {loc.globalSiteName}
                    <p className="text-xs text-muted-foreground">ID: {loc.id}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No specific locations recorded from orders.</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><ShoppingBag className="mr-2 h-5 w-5 text-primary"/>Order History</CardTitle>
          <CardDescription>{clientDetails.orders.length} order(s) found for this client.</CardDescription>
        </CardHeader>
        <CardContent>
          {clientDetails.orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientDetails.orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
                    <TableCell>{order.serviceName}</TableCell>
                    <TableCell>{order.locationName}</TableCell>
                    <TableCell>{new Date(order.dateHeure).toLocaleString()}</TableCell>
                    <TableCell>{order.prix ? `$${order.prix.toFixed(2)}` : 'N/A'}</TableCell>
                    <TableCell><Badge variant={order.status === 'completed' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'} className="capitalize">{order.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-muted-foreground">No orders found for this client.</p>}
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
          <CardHeader><CardTitle className="text-xl">Notes & Preferences</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground italic">(Feature to add notes about this client - not yet implemented)</p>
            {/* Future: <Textarea placeholder="Add notes or preferences for this client..." /> <Button className="mt-2">Save Notes</Button> */}
          </CardContent>
        </Card>

    </div>
  );
}

