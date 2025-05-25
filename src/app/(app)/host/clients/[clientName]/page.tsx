
"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  getOrdersByClientName, 
  getRoomOrTableById, 
  getServiceById, 
  getSiteById,
  getClientsByHostAndName, // Function to get Client records
  getReservationsByClientName // Function to get reservations by client name for this host
} from '@/lib/data';
import type { Order, RoomOrTable, Service, Client, ClientDetails as DeprecatedClientDetails, Reservation, Site as GlobalSite } from '@/lib/types'; // Renamed ClientDetails to avoid conflict
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, ShoppingBag, MapPin, CalendarDays, Phone, Mail, DollarSign, AlertTriangle, Info, ListOrdered, Building, BedDouble, Utensils } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EnrichedOrder extends Order {
  serviceName?: string;
  locationName?: string;
}

interface EnrichedClientRecord extends Client {
    locationFullName?: string;
}

interface EnrichedReservation extends Reservation {
    locationFullName?: string;
}

export default function ClientFilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  
  const clientNameParam = params.clientName as string;
  const [clientName, setClientName] = useState<string>("");

  const [clientOrders, setClientOrders] = useState<EnrichedOrder[]>([]);
  const [clientRecords, setClientRecords] = useState<EnrichedClientRecord[]>([]); // For Client type records from Host Mgt
  const [clientReservations, setClientReservations] = useState<EnrichedReservation[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientNameParam) {
      setClientName(decodeURIComponent(clientNameParam));
    }
  }, [clientNameParam]);

  const fetchData = useCallback(async (hostId: string, name: string) => {
    if (!name) {
      setError("Nom du client non fourni.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [ordersData, clientRecordsData, reservationsData] = await Promise.all([
        getOrdersByClientName(hostId, name),
        getClientsByHostAndName(hostId, name),
        getReservationsByClientName(hostId, name)
      ]);

      const enrichedOrders = await Promise.all(
        ordersData.map(async (order) => {
          const service = await getServiceById(order.serviceId);
          const location = await getRoomOrTableById(order.chambreTableId);
          return {
            ...order,
            serviceName: service?.titre || 'Service Inconnu',
            locationName: location ? `${location.type} ${location.nom}` : 'Lieu Inconnu',
          };
        })
      );
      setClientOrders(enrichedOrders);

      const enrichedClientRecords = await Promise.all(
        clientRecordsData.map(async (record) => {
            let locFullName: string | undefined = undefined;
            if(record.locationId) {
                const loc = await getRoomOrTableById(record.locationId);
                if(loc) locFullName = `${loc.type} ${loc.nom}`;
            }
            return { ...record, locationFullName: locFullName };
        })
      );
      setClientRecords(enrichedClientRecords);

      const enrichedReservations = await Promise.all(
        reservationsData.map(async (res) => {
            let locFullName: string | undefined = undefined;
            if(res.locationId) {
                const loc = await getRoomOrTableById(res.locationId);
                if(loc) locFullName = `${loc.type} ${loc.nom}`;
            }
            return { ...res, locationFullName: locFullName };
        })
      );
      setClientReservations(enrichedReservations);

    } catch (e) {
      console.error("Échec de la récupération des détails du client:", e);
      setError("Impossible de charger les détails du client. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && authUser?.hostId && clientName) {
      fetchData(authUser.hostId, clientName);
    } else if (!authLoading && !authUser?.hostId && authUser?.role === 'host') {
        setError("ID d'hôte manquant pour l'utilisateur connecté.");
        setIsLoading(false);
    } else if (!authLoading && authUser?.role !== 'host') {
      router.replace('/dashboard'); // Not a host or admin, or missing permissions
    }
  }, [authUser, authLoading, clientName, fetchData, router]);

  const totalSpent = useMemo(() => {
    return clientOrders
      .filter(o => o.status === 'completed' && o.prixTotal)
      .reduce((sum, o) => sum + (o.prixTotal || 0), 0);
  }, [clientOrders]);

  const primaryClientRecord = useMemo(() => clientRecords.length > 0 ? clientRecords[0] : null, [clientRecords]);

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
        <h2 className="text-2xl font-semibold text-destructive mb-2">Erreur</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.back()} className="mt-6">Retour</Button>
      </div>
    );
  }

  if (!clientName) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <Info className="mx-auto h-12 w-12 text-primary mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Client Non Spécifié</h2>
        <p className="text-muted-foreground">Aucun nom de client fourni dans l'URL.</p>
        <Button onClick={() => router.push('/host/orders')} className="mt-6">Retour aux Commandes</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center">
            <User className="mr-3 h-10 w-10 text-primary" /> Fiche Client: {clientName}
          </h1>
          <p className="text-lg text-muted-foreground">Aperçu de l'activité et des détails du client.</p>
        </div>
        <Button onClick={() => router.push('/host/orders')} variant="outline">Retour aux Commandes</Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="general">Infos Générales</TabsTrigger>
          <TabsTrigger value="orders">Historique Commandes</TabsTrigger>
          <TabsTrigger value="records">Fiches &amp; Crédits</TabsTrigger>
          <TabsTrigger value="reservations">Réservations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-xl flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>Informations Clés</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Email: <span className="ml-1 font-medium">{primaryClientRecord?.email || "(Non renseigné)"}</span></div>
              <div className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" /> Téléphone: <span className="ml-1 font-medium">{primaryClientRecord?.telephone || "(Non renseigné)"}</span></div>
              <div className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-green-500" /> Total Dépensé (Commandes): <span className="ml-1 font-semibold">${totalSpent.toFixed(2)}</span></div>
              <div className="mt-2"><strong className="text-primary">Notes:</strong> <p className="text-muted-foreground whitespace-pre-wrap">{primaryClientRecord?.notes || "(Aucune note)"}</p></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><ShoppingBag className="mr-2 h-5 w-5 text-primary"/>Historique des Commandes</CardTitle>
              <CardDescription>{clientOrders.length} commande(s) trouvée(s) pour ce client.</CardDescription>
            </CardHeader>
            <CardContent>
              {clientOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Commande</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Lieu</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientOrders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium text-xs">#{order.id.slice(-6)}</TableCell>
                        <TableCell>{order.serviceName}</TableCell>
                        <TableCell>{order.locationName}</TableCell>
                        <TableCell>{isValid(parseISO(order.dateHeure)) ? format(parseISO(order.dateHeure), 'Pp', {locale: fr}) : 'Date invalide'}</TableCell>
                        <TableCell>{order.prixTotal ? `$${order.prixTotal.toFixed(2)}` : 'N/A'}</TableCell>
                        <TableCell><Badge variant={order.status === 'completed' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'} className="capitalize text-xs">{order.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <p className="text-muted-foreground text-center py-4">Aucune commande trouvée pour ce client.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="mt-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center"><ListOrdered className="mr-2 h-5 w-5 text-primary"/>Fiches Client &amp; Crédits</CardTitle>
                    <CardDescription>{clientRecords.length} fiche(s) client trouvée(s) pour "{clientName}" gérée(s) par vous.</CardDescription>
                </CardHeader>
                <CardContent>
                    {clientRecords.length > 0 ? (
                        <div className="space-y-4">
                            {clientRecords.map(record => (
                                <Card key={record.id} className="bg-secondary/30">
                                    <CardHeader className='pb-2'><CardTitle className="text-md">Fiche ID: {record.id.slice(-6)} ({record.type})</CardTitle></CardHeader>
                                    <CardContent className="text-sm space-y-1">
                                        {record.type === 'heberge' && (
                                            <>
                                                <p><CalendarDays className="inline mr-1 h-4 w-4 text-muted-foreground"/> Arrivée: {record.dateArrivee ? format(parseISO(record.dateArrivee), 'PPP', {locale: fr}) : 'N/A'}</p>
                                                <p><CalendarDays className="inline mr-1 h-4 w-4 text-muted-foreground"/> Départ: {record.dateDepart ? format(parseISO(record.dateDepart), 'PPP', {locale: fr}) : 'N/A'}</p>
                                                <p><MapPin className="inline mr-1 h-4 w-4 text-muted-foreground"/> Lieu: {record.locationFullName || 'Non assigné'}</p>
                                            </>
                                        )}
                                        <p><DollarSign className="inline mr-1 h-4 w-4 text-green-500"/> Crédit: <span className="font-semibold">${(record.credit || 0).toFixed(2)}</span></p>
                                        <p className="text-amber-600"><ListOrdered className="inline mr-1 h-4 w-4"/> Points Fidélité: <span className="font-semibold">{record.pointsFidelite || 0} pts</span></p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : <p className="text-muted-foreground text-center py-4">Aucune fiche client spécifique trouvée pour ce nom.</p>}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="reservations" className="mt-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center"><Building className="mr-2 h-5 w-5 text-primary"/>Réservations du Client</CardTitle>
                    <CardDescription>{clientReservations.length} réservation(s) trouvée(s) pour ce client.</CardDescription>
                </CardHeader>
                <CardContent>
                    {clientReservations.length > 0 ? (
                        <Table>
                            <TableHeader><TableRow><TableHead>ID Rés.</TableHead><TableHead>Lieu</TableHead><TableHead>Type</TableHead><TableHead>Arrivée</TableHead><TableHead>Départ</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {clientReservations.map(res => (
                                    <TableRow key={res.id}>
                                        <TableCell className="font-medium text-xs">#{res.id.slice(-6)}</TableCell>
                                        <TableCell>{res.locationFullName}</TableCell>
                                        <TableCell>{res.type === 'Chambre' ? <BedDouble className="h-4 w-4"/> : <Utensils className="h-4 w-4"/>} {res.type}</TableCell>
                                        <TableCell>{isValid(parseISO(res.dateArrivee)) ? format(parseISO(res.dateArrivee), 'P', {locale: fr}) : 'N/A'}</TableCell>
                                        <TableCell>{res.dateDepart && isValid(parseISO(res.dateDepart)) ? format(parseISO(res.dateDepart), 'P', {locale: fr}) : 'N/A'}</TableCell>
                                        <TableCell><Badge variant={res.status === 'cancelled' ? 'destructive' : 'secondary'} className="capitalize text-xs">{res.status}</Badge></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : <p className="text-muted-foreground text-center py-4">Aucune réservation trouvée pour ce client.</p>}
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}

    