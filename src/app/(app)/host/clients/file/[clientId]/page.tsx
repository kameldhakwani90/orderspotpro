
"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  getOrdersByUserId, // Assuming orders are primarily linked by User.id
  getOrdersByClientName, // Fallback if no User.id
  getRoomOrTableById,
  getServiceById,
  getClientById, 
  getReservationsByUserId, // Assuming reservations are primarily linked by User.id
  getReservationsByClientName, // Fallback
  getHostById
} from '@/lib/data';
import type { Order, RoomOrTable, Service, Client, Reservation, Host } from '@/lib/types'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, ShoppingBag, MapPin, CalendarDays, Phone, Mail, DollarSign, AlertTriangle, Info, ListOrdered, Building, BedDouble, Utensils, FileCheck as FileCheckIcon, ArrowLeft, Edit3, Users as UsersIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EnrichedOrder extends Order {
  serviceName?: string;
  locationName?: string;
  hostName?: string;
}

interface EnrichedReservation extends Reservation {
    locationFullName?: string;
    hostName?: string;
}


function ClientFilePageContent() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();

  const clientId = params.clientId as string;

  const [clientDetails, setClientDetails] = useState<Client | null>(null);
  const [clientHost, setClientHost] = useState<Host | null>(null);
  const [clientOrders, setClientOrders] = useState<EnrichedOrder[]>([]);
  const [clientReservations, setClientReservations] = useState<EnrichedReservation[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (hostIdForAuth: string, currentClientId: string) => {
    if (!currentClientId) {
      setError("Client ID non fourni.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const clientData = await getClientById(currentClientId);
      if (!clientData || clientData.hostId !== hostIdForAuth) {
        setError("Fiche client introuvable ou non accessible.");
        setClientDetails(null);
        setIsLoading(false);
        return;
      }
      setClientDetails(clientData);

      const hostData = await getHostById(clientData.hostId);
      setClientHost(hostData);

      let ordersData: Order[] = [];
      let reservationsData: Reservation[] = [];

      if (clientData.userId) {
        ordersData = await getOrdersByUserId(clientData.userId);
        reservationsData = await getReservationsByUserId(clientData.userId);
        // Filter orders/reservations to only those pertaining to the current host if needed
        ordersData = ordersData.filter(o => o.hostId === clientData.hostId);
        reservationsData = reservationsData.filter(r => r.hostId === clientData.hostId);
      } else if (clientData.nom) {
        // Fallback for clients not linked to a global user, or to get orders made before linking
        const nameBasedOrders = await getOrdersByClientName(clientData.hostId, clientData.nom);
        ordersData = [...ordersData, ...nameBasedOrders.filter(nbo => !ordersData.find(o => o.id === nbo.id))]; // Merge and deduplicate
        
        const nameBasedReservations = await getReservationsByClientName(clientData.hostId, clientData.nom);
        reservationsData = [...reservationsData, ...nameBasedReservations.filter(nbr => !reservationsData.find(r => r.id === nbr.id))];
      }


      const enrichedOrders = await Promise.all(
        ordersData.map(async (order) => {
          const service = await getServiceById(order.serviceId);
          const location = await getRoomOrTableById(order.chambreTableId);
          // Host name is already known via clientData.hostId -> hostData
          return {
            ...order,
            serviceName: service?.titre || 'Service Inconnu',
            locationName: location ? `${location.type} ${location.nom}` : 'Lieu Inconnu',
            hostName: hostData?.nom || 'Établissement Inconnu',
          };
        })
      );
      setClientOrders(enrichedOrders);

      const enrichedReservations = await Promise.all(
        reservationsData.map(async (res) => {
            let locFullName: string | undefined = undefined;
            if(res.locationId) {
                const loc = await getRoomOrTableById(res.locationId);
                if(loc) locFullName = `${loc.type} ${loc.nom}`;
            }
            return { ...res, locationFullName: locFullName, hostName: hostData?.nom || 'Établissement Inconnu' };
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
    if (!authLoading && authUser?.hostId && clientId) {
      fetchData(authUser.hostId, clientId);
    } else if (!authLoading && (!authUser?.hostId && authUser?.role === 'host')) {
        setError("ID d'hôte manquant pour l'utilisateur connecté.");
        setIsLoading(false);
    } else if (!authLoading && authUser?.role !== 'host') {
      router.replace('/dashboard');
    }
  }, [authUser, authLoading, clientId, fetchData, router]);

  const totalSpentOverall = useMemo(() => {
    return clientOrders
      .filter(o => o.status === 'completed' && typeof o.prixTotal === 'number')
      .reduce((sum, o) => sum + (o.prixTotal!), 0);
  }, [clientOrders]);


  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-6">
        <Skeleton className="h-10 w-1/3 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <Skeleton className="h-12 w-full mb-6" /> {/* For TabsList */}
        <Skeleton className="h-80 w-full" /> {/* For TabsContent */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Erreur</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.push('/host/clients')} className="mt-6">Retour à la liste des Clients</Button>
      </div>
    );
  }

  if (!clientDetails) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <Info className="mx-auto h-12 w-12 text-primary mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Client Non Trouvé</h2>
        <p className="text-muted-foreground">Aucune fiche client trouvée pour cet ID.</p>
        <Button onClick={() => router.push('/host/clients')} className="mt-6">Retour à la Gestion Clients</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center">
            <User className="mr-3 h-10 w-10 text-primary" /> Fiche Client: {clientDetails.nom}
          </h1>
          <p className="text-lg text-muted-foreground">Aperçu de l'activité et des détails du client chez {clientHost?.nom || 'votre établissement'}.</p>
        </div>
        <Link href="/host/clients" passHref>
            <Button variant="outline" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4"/> Retour à la liste des Clients
            </Button>
        </Link>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="general">Infos Générales</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="reservations">Réservations</TabsTrigger>
          <TabsTrigger value="checkins">Enreg. en Ligne</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>Détails de la Fiche Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><strong className="text-muted-foreground">ID Fiche Client:</strong> #{clientDetails.id.slice(-6)}</p>
              <p><Mail className="inline mr-1.5 h-4 w-4 text-muted-foreground" /> Email: <span className="font-medium">{clientDetails.email || "(Non renseigné)"}</span></p>
              <p><Phone className="inline mr-1.5 h-4 w-4 text-muted-foreground" /> Téléphone: <span className="font-medium">{clientDetails.telephone || "(Non renseigné)"}</span></p>
              <p><UsersIcon className="inline mr-1.5 h-4 w-4 text-muted-foreground" /> Type: <Badge variant={clientDetails.type === 'heberge' ? 'default' : 'secondary'} className="capitalize">{clientDetails.type}</Badge></p>
              {clientDetails.type === 'heberge' && (
                <>
                  <p><CalendarDays className="inline mr-1.5 h-4 w-4 text-muted-foreground"/> Arrivée: {clientDetails.dateArrivee && isValid(parseISO(clientDetails.dateArrivee)) ? format(parseISO(clientDetails.dateArrivee), 'PPP', {locale: fr}) : 'N/A'}</p>
                  <p><CalendarDays className="inline mr-1.5 h-4 w-4 text-muted-foreground"/> Départ: {clientDetails.dateDepart && isValid(parseISO(clientDetails.dateDepart)) ? format(parseISO(clientDetails.dateDepart), 'PPP', {locale: fr}) : 'N/A'}</p>
                  {clientDetails.locationId && <p><MapPin className="inline mr-1.5 h-4 w-4 text-muted-foreground"/> Lieu: {clientDetails.locationId}</p>} {/* TODO: Fetch location name */}
                </>
              )}
              <p className="text-green-600"><DollarSign className="inline mr-1.5 h-4 w-4"/> Crédit: <span className="font-semibold">${(clientDetails.credit || 0).toFixed(2)}</span></p>
              <p className="text-amber-600"><ListOrdered className="inline mr-1.5 h-4 w-4"/> Points Fidélité: <span className="font-semibold">{clientDetails.pointsFidelite || 0} pts</span></p>
              <p><DollarSign className="inline mr-1.5 h-4 w-4 text-blue-500" /> Total Dépensé (Commandes): <span className="font-semibold">${totalSpentOverall.toFixed(2)}</span></p>
              <div className="mt-2"><strong className="text-primary">Notes:</strong> <p className="text-muted-foreground whitespace-pre-wrap">{clientDetails.notes || "(Aucune note pour cette fiche)"}</p></div>
               {clientDetails.userId && <p className="text-xs text-muted-foreground italic pt-2">(Lié à l'utilisateur global ID: {clientDetails.userId.slice(-6)})</p>}
            </CardContent>
             <CardFooter>
                <Button onClick={() => router.push(`/host/clients?edit=${clientDetails.id}`)} variant="outline"><Edit3 className="mr-2 h-4 w-4"/> Modifier cette Fiche Client</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><ShoppingBag className="mr-2 h-5 w-5 text-primary"/>Historique des Commandes ({clientHost?.nom || 'cet établissement'})</CardTitle>
              <CardDescription>{clientOrders.length} commande(s) trouvée(s).</CardDescription>
            </CardHeader>
            <CardContent>
              {clientOrders.length > 0 ? (
                <Table>
                  <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Service</TableHead><TableHead>Lieu</TableHead><TableHead>Date</TableHead><TableHead>Prix</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
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
              ) : <p className="text-muted-foreground text-center py-4">Aucune commande trouvée pour ce client chez cet établissement.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservations" className="mt-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center"><Building className="mr-2 h-5 w-5 text-primary"/>Réservations ({clientHost?.nom || 'cet établissement'})</CardTitle>
                    <CardDescription>{clientReservations.length} réservation(s) trouvée(s).</CardDescription>
                </CardHeader>
                <CardContent>
                    {clientReservations.length > 0 ? (
                        <Table>
                            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Lieu</TableHead><TableHead>Type</TableHead><TableHead>Arrivée</TableHead><TableHead>Départ</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {clientReservations.map(res => (
                                    <TableRow key={res.id}>
                                        <TableCell className="font-medium text-xs">#{res.id.slice(-6)}</TableCell>
                                        <TableCell>{res.locationFullName}</TableCell>
                                        <TableCell>{res.type === 'Chambre' ? <BedDouble className="h-4 w-4"/> : <Utensils className="h-4 w-4"/>} {res.type}</TableCell>
                                        <TableCell>{isValid(parseISO(res.dateArrivee)) ? format(parseISO(res.dateArrivee), 'P', {locale: fr}) : 'N/A'}</TableCell>
                                        <TableCell>{res.dateDepart && isValid(parseISO(res.dateDepart)) ? format(parseISO(res.dateDepart), 'P', {locale: fr}) : (res.type === 'Table' ? 'N/A' : 'N/A')}</TableCell>
                                        <TableCell><Badge variant={res.status === 'cancelled' ? 'destructive' : 'secondary'} className="capitalize text-xs">{res.status || 'N/A'}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/host/reservations/detail/${res.id}`} passHref>
                                                <Button variant="outline" size="sm" className="flex items-center">
                                                  <Edit3 className="mr-1.5 h-3.5 w-3.5"/> Voir/Gérer
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : <p className="text-muted-foreground text-center py-4">Aucune réservation trouvée pour ce client chez cet établissement.</p>}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="checkins" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><FileCheckIcon className="mr-2 h-5 w-5 text-primary" />Enregistrements en Ligne Soumis</CardTitle>
              <CardDescription>Informations soumises par le client lors d'enregistrements en ligne pour ses réservations chez {clientHost?.nom || 'cet établissement'}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {clientReservations.filter(res => res.onlineCheckinData).length > 0 ? (
                clientReservations.filter(res => res.onlineCheckinData).map(res => (
                  <Card key={`checkin-${res.id}`} className="bg-secondary/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Pour Réservation ID: #{res.id.slice(-6)} ({res.locationFullName})</CardTitle>
                      <CardDescription>Soumis le: {res.onlineCheckinData!.submissionDate && isValid(parseISO(res.onlineCheckinData!.submissionDate)) ? format(parseISO(res.onlineCheckinData!.submissionDate), 'PPP p', { locale: fr }) : 'Date inconnue'}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p><strong>Nom complet:</strong> {res.onlineCheckinData!.fullName || 'N/A'}</p>
                      <p><strong>Email:</strong> {res.onlineCheckinData!.email || 'N/A'}</p>
                      {res.onlineCheckinData!.birthDate && isValid(parseISO(res.onlineCheckinData!.birthDate)) && <p><strong>Date de naissance:</strong> {format(parseISO(res.onlineCheckinData!.birthDate), 'PPP', { locale: fr })}</p>}
                      <p><strong>Téléphone:</strong> {res.onlineCheckinData!.phoneNumber || 'N/A'}</p>
                      {res.onlineCheckinData!.travelReason && <p><strong>Motif du voyage:</strong> {res.onlineCheckinData!.travelReason}</p>}
                      {res.onlineCheckinData!.additionalNotes && <p><strong>Notes additionnelles:</strong> {res.onlineCheckinData!.additionalNotes}</p>}
                      <div><strong>Statut Enreg. Ligne:</strong> <Badge variant={res.onlineCheckinStatus === 'completed' ? 'default' : res.onlineCheckinStatus === 'pending-review' ? 'secondary' : 'outline'} className="capitalize text-xs">{res.onlineCheckinStatus?.replace('-', ' ') || 'Non démarré'}</Badge></div>
                    </CardContent>
                  </Card>
                ))
              ) : <p className="text-muted-foreground text-center py-4">Aucune information d'enregistrement en ligne trouvée pour les réservations de ce client chez cet établissement.</p>}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}

export default function ClientFilePage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8 px-4"><Skeleton className="h-10 w-1/3 mb-2" /><Skeleton className="h-6 w-1/2 mb-6" /><Skeleton className="h-96 w-full" /></div>}>
      <ClientFilePageContent />
    </Suspense>
  )
}
