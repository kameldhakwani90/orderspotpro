
"use client";

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getSiteById, getRoomOrTableById, getTags as fetchHostTags, addReservation as addReservationToData } from '@/lib/data';
import type { Site as GlobalSiteType, RoomOrTable, Tag, Reservation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BedDouble, Utensils, Users, CalendarDays, Tag as TagIconLucide, ChevronLeft, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import NextImage from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

function LocationDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const globalSiteId = params.globalSiteId as string;
  const locationId = params.locationId as string;

  const [globalSiteInfo, setGlobalSiteInfo] = useState<GlobalSiteType | null>(null);
  const [locationInfo, setLocationInfo] = useState<RoomOrTable | null>(null);
  const [hostTags, setHostTags] = useState<Tag[]>([]);
  
  const [arrivalDate, setArrivalDate] = useState<string | null>(null);
  const [departureDate, setDepartureDate] = useState<string | null>(null);
  const [numPersons, setNumPersons] = useState<number>(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const arrival = searchParams.get('arrival');
    const departure = searchParams.get('departure');
    const persons = searchParams.get('persons');

    if (arrival && isValid(parseISO(arrival))) setArrivalDate(arrival);
    if (departure && isValid(parseISO(departure))) setDepartureDate(departure);
    if (persons && !isNaN(parseInt(persons))) setNumPersons(parseInt(persons));

  }, [searchParams]);

  const fetchPageData = useCallback(async () => {
    if (!globalSiteId || !locationId) {
      setError("Informations de site ou de lieu manquantes dans l'URL.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [siteData, locationData] = await Promise.all([
        getSiteById(globalSiteId),
        getRoomOrTableById(locationId),
      ]);

      if (!siteData) {
        setError(`Établissement avec ID ${globalSiteId} non trouvé.`);
        setGlobalSiteInfo(null); setLocationInfo(null); setIsLoading(false); return;
      }
      setGlobalSiteInfo(siteData);

      if (!locationData || locationData.globalSiteId !== globalSiteId) {
        setError(`Lieu avec ID ${locationId} non trouvé ou n'appartient pas à ${siteData.nom}.`);
        setLocationInfo(null); setIsLoading(false); return;
      }
      setLocationInfo(locationData);
      
      const tags = await fetchHostTags(siteData.hostId);
      setHostTags(tags);

    } catch (e: any) {
      console.error("Error fetching location/site details:", e);
      setError("Impossible de charger les détails du lieu. " + e.message);
    } finally {
      setIsLoading(false);
    }
  }, [globalSiteId, locationId]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleConfirmReservation = async () => {
    if (!globalSiteInfo || !locationInfo || !arrivalDate) {
      toast({ title: "Informations manquantes", description: "Les détails de la réservation sont incomplets.", variant: "destructive"});
      return;
    }
    if (locationInfo.type === 'Chambre' && !departureDate) {
        toast({ title: "Date de départ manquante", description: "Veuillez spécifier une date de départ pour une chambre.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    try {
      const reservationData: Omit<Reservation, 'id'> = {
        hostId: globalSiteInfo.hostId,
        locationId: locationInfo.id,
        type: locationInfo.type,
        clientName: user?.nom || `Invité ${Date.now().toString().slice(-5)}`, // Placeholder if not logged in
        clientId: user?.id,
        dateArrivee: arrivalDate,
        dateDepart: locationInfo.type === 'Chambre' ? departureDate! : arrivalDate, // For table, depart is same as arrival
        nombrePersonnes: numPersons,
        animauxDomestiques: false, // Default, can be a form field later
        status: 'pending', // Default status
        notes: `Réservation via la page publique pour ${locationInfo.nom}.`,
      };

      await addReservationToData(reservationData);
      setBookingSuccess(true);
      toast({ title: "Réservation Confirmée !", description: `Votre réservation pour ${locationInfo.nom} a été enregistrée.` });
    } catch (e: any) {
      console.error("Error confirming reservation:", e);
      toast({ title: "Erreur de Réservation", description: "Impossible de confirmer la réservation. " + e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-72 w-full rounded-lg" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-6 w-1/2" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Erreur</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.back()} className="mt-6">Retour</Button>
      </div>
    );
  }

  if (!globalSiteInfo || !locationInfo) {
    return (
      <div className="text-center py-10">
        <Info className="mx-auto h-12 w-12 text-primary mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Détails non trouvés</h2>
        <p className="text-muted-foreground">Les informations pour ce lieu ou cet établissement n'ont pas pu être chargées.</p>
        <Button onClick={() => router.back()} className="mt-6">Retour</Button>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="text-center py-16 max-w-2xl mx-auto">
        <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-3">Réservation Effectuée !</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Votre demande de réservation pour <span className="font-semibold text-primary">{locationInfo.nom}</span> à <span className="font-semibold text-primary">{globalSiteInfo.nom}</span> du <span className="font-semibold">{arrivalDate ? format(parseISO(arrivalDate), 'PPP', {locale:fr}) : ''}</span> {locationInfo.type === 'Chambre' && departureDate ? `au ${format(parseISO(departureDate), 'PPP', {locale:fr})}` : ''} a été enregistrée.
        </p>
        <Button onClick={() => router.push(`/reserve/${globalSiteId}`)} size="lg">
          Effectuer une autre recherche
        </Button>
      </div>
    );
  }

  const locationTags = (locationInfo.tagIds || [])
    .map(tagId => hostTags.find(t => t.id === tagId)?.name)
    .filter(Boolean) as string[];

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ChevronLeft className="mr-2 h-4 w-4" /> Retour à la recherche
      </Button>

      <Card className="overflow-hidden shadow-xl">
        {locationInfo.imageUrls && locationInfo.imageUrls.length > 0 && (
          <div className="relative h-64 md:h-96 w-full bg-muted">
            {/* Basic image display, can be enhanced to a carousel later */}
            <NextImage
              src={locationInfo.imageUrls[0]}
              alt={`Image principale de ${locationInfo.nom}`}
              layout="fill"
              objectFit="cover"
              data-ai-hint={locationInfo.imageAiHint || locationInfo.nom.toLowerCase().split(' ').slice(0,2).join(' ')}
              priority
            />
          </div>
        )}
        <CardHeader className="p-6">
          <p className="text-sm text-muted-foreground">{globalSiteInfo.nom}</p>
          <CardTitle className="text-3xl md:text-4xl font-bold">{locationInfo.nom}</CardTitle>
          <CardDescription className="text-lg flex items-center text-primary">
            {locationInfo.type === 'Chambre' ? <BedDouble className="mr-2 h-5 w-5" /> : <Utensils className="mr-2 h-5 w-5" />}
            {locationInfo.type}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{locationInfo.description || "Aucune description disponible."}</p>
            </div>
            {locationTags.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Équipements & Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {locationTags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
              </div>
            )}
          </div>
          <div className="md:col-span-1 space-y-4">
            <Card className="p-4 bg-secondary/30">
              <CardTitle className="text-lg mb-3">Détails de votre sélection</CardTitle>
              <div className="space-y-2 text-sm">
                {arrivalDate && (
                  <p className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> Arrivée: <span className="font-semibold ml-1">{format(parseISO(arrivalDate), 'PPP', {locale: fr})}</span></p>
                )}
                {locationInfo.type === 'Chambre' && departureDate && (
                  <p className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> Départ: <span className="font-semibold ml-1">{format(parseISO(departureDate), 'PPP', {locale: fr})}</span></p>
                )}
                <p className="flex items-center"><Users className="mr-2 h-4 w-4 text-muted-foreground" /> Personnes: <span className="font-semibold ml-1">{numPersons}</span></p>
                {locationInfo.capacity && (
                   <p className="flex items-center"><Info className="mr-2 h-4 w-4 text-muted-foreground" /> Capacité max: <span className="font-semibold ml-1">{locationInfo.capacity}</span></p>
                )}
              </div>
              <Button 
                onClick={handleConfirmReservation} 
                disabled={isSubmitting || !arrivalDate || (locationInfo.type === 'Chambre' && !departureDate)} 
                className="w-full mt-6 text-base py-3"
              >
                {isSubmitting ? "Confirmation en cours..." : "Confirmer la réservation"}
              </Button>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// It's good practice to wrap pages using searchParams with Suspense
export default function LocationDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Chargement des détails de la réservation...</div>}>
      <LocationDetailPageContent />
    </Suspense>
  );
}
      