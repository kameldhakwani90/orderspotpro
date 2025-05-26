
"use client";

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getReservationById, getHostById, getRoomOrTableById, getOrdersByUserId, getServiceById, getSiteById } from '@/lib/data'; // Added getSiteById
import type { Reservation, Host, RoomOrTable, Order, Service, Site as GlobalSiteType } from '@/lib/types'; // Added GlobalSiteType
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Building, CalendarDays, Users, Hash, Info, BedDouble, Utensils, ShoppingBag, CreditCard, FileText as InvoiceIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';

interface EnrichedOrder extends Order {
  serviceName?: string;
  locationName?: string; 
}

function ReservationDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const reservationId = params.reservationId as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [host, setHost] = useState<Host | null>(null);
  const [globalSite, setGlobalSite] = useState<GlobalSiteType | null>(null); // For establishment details
  const [location, setLocation] = useState<RoomOrTable | null>(null);
  const [relatedOrders, setRelatedOrders] = useState<EnrichedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReservationDetails = useCallback(async () => {
    if (!reservationId) {
      setError(t('errorAccessingReservation'));
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const resData = await getReservationById(reservationId);
      if (!resData) {
        setError(t('reservationDetailsNotAvailable'));
        setReservation(null);
        setIsLoading(false);
        return;
      }
      setReservation(resData);

      let hostData: Host | undefined;
      let globalSiteData: GlobalSiteType | undefined;

      if (resData.hostId) {
        hostData = await getHostById(resData.hostId);
        setHost(hostData || null);
        if (hostData) {
          const loc = resData.locationId ? await getRoomOrTableById(resData.locationId) : null;
          if (loc?.globalSiteId) {
            globalSiteData = await getSiteById(loc.globalSiteId);
          } else {
            // Fallback to host's first global site if location's globalSiteId is not directly on reservation or loc
            const hostSites = await getSites(resData.hostId);
            if (hostSites.length > 0) globalSiteData = hostSites[0];
          }
          setGlobalSite(globalSiteData || null);
        }
      }
      
      if (resData.locationId) {
        const locationDataResult = await getRoomOrTableById(resData.locationId);
        setLocation(locationDataResult || null);
      }


      if (resData.clientId && resData.hostId) { // Assuming clientId on reservation is User.id for client's own orders
        const allClientOrders = await getOrdersByUserId(resData.clientId);
        const filteredOrders = allClientOrders.filter(order => {
          if (order.hostId !== resData.hostId) return false;
          try {
            const orderDate = startOfDay(parseISO(order.dateHeure));
            const resStartDate = startOfDay(parseISO(resData.dateArrivee));
            const resEndDate = resData.type === 'Table' || !resData.dateDepart
                ? endOfDay(parseISO(resData.dateArrivee))
                : endOfDay(parseISO(resData.dateDepart));
            return isWithinInterval(orderDate, { start: resStartDate, end: resEndDate });
          } catch (e) { 
            console.error("Error filtering order dates:", e, order);
            return false; 
          }
        });
        
        const enriched = await Promise.all(filteredOrders.map(async o => {
            const serviceDetails = await getServiceById(o.serviceId);
            return {...o, serviceName: serviceDetails ? ('titre' in serviceDetails ? serviceDetails.titre : serviceDetails.name) : 'Service inconnu'};
        }));
        setRelatedOrders(enriched);
      }

    } catch (e: any) {
      console.error("Erreur lors de la récupération des détails de la réservation:", e);
      setError(t('errorLoadingReservationDetails') + ` (${e.message})`);
    } finally {
      setIsLoading(false);
    }
  }, [reservationId, t]);

  useEffect(() => {
    fetchReservationDetails();
  }, [fetchReservationDetails]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <Skeleton className="h-10 w-1/4 mb-6" />
        <Card className="shadow-lg"><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-20 w-full" /><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <Info className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">{error || t('errorAccessingReservation')}</h2>
        <p className="text-muted-foreground">{t('reservationDetailsNotAvailable')}</p>
        <Button onClick={() => router.push('/client/my-reservations')} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voir Toutes Mes Réservations
        </Button>
      </div>
    );
  }
  
  const LocationIcon = reservation.type === 'Chambre' ? BedDouble : Utensils;
  const establishmentDisplayName = globalSite?.nom || host?.nom || 'Établissement inconnu';

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <Button variant="outline" onClick={() => router.push('/client/my-reservations')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voir Toutes Mes Réservations
      </Button>

      <Card className="shadow-xl">
        <CardHeader className="bg-muted/30">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <CardTitle className="text-3xl font-bold text-primary">
                Réservation #{reservation.id.slice(-6).toUpperCase()}
              </CardTitle>
              <CardDescription className="text-md">
                {establishmentDisplayName}
              </CardDescription>
            </div>
            <Badge variant={reservation.status === 'cancelled' ? 'destructive' : reservation.status === 'checked-out' ? 'secondary' : 'default'} className="text-lg capitalize h-fit">
              {reservation.status || 'N/A'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
              <TabsTrigger value="details">Détails du Séjour</TabsTrigger>
              <TabsTrigger value="services">Services Commandés</TabsTrigger>
              <TabsTrigger value="billing">Facturation</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-xl">Informations du Séjour</CardTitle></CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary" /> <strong>Arrivée:</strong> {isValid(parseISO(reservation.dateArrivee)) ? format(parseISO(reservation.dateArrivee), 'EEEE d MMMM yyyy', { locale: fr }) : 'N/A'}</div>
                  {reservation.dateDepart && reservation.type === 'Chambre' && <div className="flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary" /> <strong>Départ:</strong> {isValid(parseISO(reservation.dateDepart)) ? format(parseISO(reservation.dateDepart), 'EEEE d MMMM yyyy', { locale: fr }) : 'N/A'}</div>}
                  <div className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" /> <strong>Personnes:</strong> {reservation.nombrePersonnes}</div>
                  <div className="flex items-center"><LocationIcon className="mr-2 h-5 w-5 text-primary" /> <strong>Lieu:</strong> {location?.nom || 'Inconnu'} ({reservation.type || 'N/A'})</div>
                  {reservation.channel && <div className="flex items-center"><Info className="mr-2 h-5 w-5 text-primary" /> <strong>Canal:</strong> {reservation.channel}</div>}
                  {reservation.animauxDomestiques && reservation.type === 'Chambre' && <div className="text-green-600 font-medium">Animaux domestiques autorisés</div>}
                  {reservation.notes && <div className="col-span-full"><strong className="text-primary">Notes:</strong> <p className="text-muted-foreground whitespace-pre-wrap">{reservation.notes}</p></div>}
                </CardContent>
              </Card>
               {reservation.onlineCheckinData && (
                <Card>
                    <CardHeader><CardTitle className="text-xl">Détails d'Enregistrement en Ligne</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                        <p><strong>Nom complet:</strong> {reservation.onlineCheckinData.fullName}</p>
                        <p><strong>Email:</strong> {reservation.onlineCheckinData.email}</p>
                        {reservation.onlineCheckinData.birthDate && isValid(parseISO(reservation.onlineCheckinData.birthDate)) && <p><strong>Date de naissance:</strong> {format(parseISO(reservation.onlineCheckinData.birthDate), 'PPP', {locale: fr})}</p>}
                        <p><strong>Téléphone:</strong> {reservation.onlineCheckinData.phoneNumber}</p>
                        {reservation.onlineCheckinData.travelReason && <p><strong>Motif du voyage:</strong> {reservation.onlineCheckinData.travelReason}</p>}
                        {reservation.onlineCheckinData.additionalNotes && <p><strong>Notes additionnelles:</strong> {reservation.onlineCheckinData.additionalNotes}</p>}
                        {reservation.onlineCheckinData.submissionDate && <p className="text-xs text-muted-foreground pt-1">Soumis le: {format(parseISO(reservation.onlineCheckinData.submissionDate), 'PPP p', {locale: fr})}</p>}
                    </CardContent>
                </Card>
               )}
            </TabsContent>

            <TabsContent value="services">
              <Card>
                <CardHeader><CardTitle className="text-xl">Services Commandés Durant ce Séjour</CardTitle></CardHeader>
                <CardContent>
                  {relatedOrders.length > 0 ? (
                     <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Service</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Prix</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {relatedOrders.map(order => (
                            <TableRow key={order.id}>
                              <TableCell>{order.serviceName}</TableCell>
                              <TableCell>{isValid(parseISO(order.dateHeure)) ? format(parseISO(order.dateHeure), 'Pp', {locale: fr}) : 'Date invalide'}</TableCell>
                              <TableCell><Badge variant={order.status === 'completed' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'} className="capitalize text-xs">{order.status}</Badge></TableCell>
                              <TableCell className="text-right">{(order.currency || '$')}{order.prixTotal !== undefined ? order.prixTotal.toFixed(2) : 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                  ) : (
                    <p className="text-muted-foreground">Aucun service commandé pendant ce séjour.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing">
              <Card>
                <CardHeader><CardTitle className="text-xl">Récapitulatif de Facturation</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between font-semibold">
                        <span>Description</span>
                        <span>Montant</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                        <span>Séjour {reservation.type} ({isValid(parseISO(reservation.dateArrivee)) ? format(parseISO(reservation.dateArrivee), 'dd/MM') : ''} {reservation.dateDepart && reservation.type === 'Chambre' && isValid(parseISO(reservation.dateDepart)) ? `- ${format(parseISO(reservation.dateDepart), 'dd/MM')}` : ''})</span>
                        <span>{(reservation.currency || '$')}{reservation.prixTotal !== undefined ? reservation.prixTotal.toFixed(2) : 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>TOTAL</span>
                        <span>{(reservation.currency || '$')}{reservation.prixTotal !== undefined ? reservation.prixTotal.toFixed(2) : 'N/A'}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Montant Payé</span>
                        <span className="text-green-600">{(reservation.currency || '$')}{(reservation.montantPaye || 0).toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between font-semibold">
                        <span className="text-muted-foreground">Solde Dû</span>
                        <span className={`${(reservation.soldeDu || 0) > 0 ? 'text-red-600' : 'text-foreground'}`}>{(reservation.currency || '$')}{(reservation.soldeDu || 0).toFixed(2)}</span>
                    </div>
                     {reservation.status === 'checked-out' && (reservation.soldeDu || 0) > 0 && (
                         <p className="text-destructive text-xs text-center pt-2">Veuillez régler le solde dû auprès de l'établissement.</p>
                     )}
                </CardContent>
                 <CardFooter className="border-t pt-4">
                    <Link href={`/invoice/reservation/${reservation.id}`} target="_blank" passHref>
                      <Button variant="outline" className="w-full">
                        <InvoiceIcon className="mr-2 h-4 w-4" /> Voir la Facture du Séjour
                      </Button>
                    </Link>
                  </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ClientReservationDetailPage() { // Changed name for clarity
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p>Chargement des détails de la réservation...</p></div>}>
      <ReservationDetailPageContent />
    </Suspense>
  )
}
