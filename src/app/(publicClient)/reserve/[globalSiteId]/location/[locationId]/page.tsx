
"use client";

import React, { useEffect, useState, useCallback, Suspense, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getSiteById, getRoomOrTableById, getTags as fetchHostTags, addReservationToData } from '@/lib/data';
import type { Site as GlobalSiteType, RoomOrTable, Tag, Reservation, AmenityOption } from '@/lib/types';
import { PREDEFINED_AMENITIES } from '@/lib/amenities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BedDouble, Utensils, Users, CalendarDays, Tag as TagIconLucide, ChevronLeft, AlertTriangle, CheckCircle, Info, Image as ImageIcon } from 'lucide-react';
import NextImage from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { format, parseISO, isValid, differenceInDays, isBefore, isEqual } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

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
      const [siteData, locationDataResult] = await Promise.all([
        getSiteById(globalSiteId),
        getRoomOrTableById(locationId),
      ]);

      if (!siteData) {
        setError(`Établissement avec ID ${globalSiteId} non trouvé.`);
        setGlobalSiteInfo(null); setLocationInfo(null); setIsLoading(false); return;
      }
      setGlobalSiteInfo(siteData);

      if (!locationDataResult || locationDataResult.globalSiteId !== globalSiteId) {
        setError(`Lieu avec ID ${locationId} non trouvé ou n'appartient pas à ${siteData.nom}.`);
        setLocationInfo(null); setIsLoading(false); return;
      }
      setLocationInfo(locationDataResult);
      
      if(siteData.hostId) {
        const tags = await fetchHostTags(siteData.hostId);
        setHostTags(tags);
      } else {
        setHostTags([]);
        console.warn("Host ID not found for Global Site, cannot fetch tags:", siteData);
      }

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
    if (locationInfo.type === 'Chambre' && departureDate && (isBefore(parseISO(departureDate), parseISO(arrivalDate)) || isEqual(parseISO(departureDate), parseISO(arrivalDate)))) {
        toast({ title: "Date de départ invalide", description: "La date de départ doit être après la date d'arrivée.", variant: "destructive"});
        return;
    }


    setIsSubmitting(true);
    try {
      const reservationData: Omit<Reservation, 'id'> = {
        hostId: globalSiteInfo.hostId,
        locationId: locationInfo.id,
        type: locationInfo.type,
        clientName: user?.nom || `Invité ${Date.now().toString().slice(-5)}`,
        clientId: user?.id,
        dateArrivee: arrivalDate,
        dateDepart: locationInfo.type === 'Chambre' ? departureDate! : undefined, // Only set for 'Chambre'
        nombrePersonnes: numPersons,
        animauxDomestiques: locationInfo.type === 'Chambre' ? false : undefined, // Example, can be dynamic
        status: 'pending',
        notes: `Réservation via la page publique pour ${locationInfo.nom}.`,
      };

      await addReservationToData(reservationData);
      setBookingSuccess(true);
      toast({ title: "Réservation Confirmée !", description: `Votre réservation pour ${locationInfo.nom} a été enregistrée.` });
    } catch (e: any) {
      console.error("Error confirming reservation:", e);
      toast({ title: "Erreur de Réservation", description: "Impossible de confirmer la réservation. " + (e instanceof Error ? e.message : "Unknown error"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const calculateNights = () => {
    if (locationInfo?.type === 'Chambre' && arrivalDate && departureDate && isValid(parseISO(arrivalDate)) && isValid(parseISO(departureDate))) {
      const start = parseISO(arrivalDate);
      const end = parseISO(departureDate);
      if (isBefore(start, end)) {
        const nights = differenceInDays(end, start);
        return nights > 0 ? nights : 1; 
      }
    }
    return 1;
  };

  const getAmenityDetails = (amenityId: string): AmenityOption | undefined => {
    return PREDEFINED_AMENITIES.flatMap(category => category.options).find(opt => opt.id === amenityId);
  };

  const groupedAmenities = useMemo(() => {
    if (!locationInfo?.amenityIds) return {};
    const groups: Record<string, AmenityOption[]> = {};
    PREDEFINED_AMENITIES.forEach(category => {
      const amenitiesInCategory = category.options.filter(opt => locationInfo.amenityIds?.includes(opt.id));
      if (amenitiesInCategory.length > 0) {
        groups[category.categoryLabel] = amenitiesInCategory;
      }
    });
    return groups;
  }, [locationInfo?.amenityIds]);


  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
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
      <div className="text-center py-10 max-w-2xl mx-auto">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Erreur</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.back()} className="mt-6">Retour</Button>
      </div>
    );
  }

  if (!globalSiteInfo || !locationInfo) {
    return (
      <div className="text-center py-10 max-w-2xl mx-auto">
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

  const mainImage = locationInfo.imageUrls && locationInfo.imageUrls.length > 0 ? locationInfo.imageUrls[0] : "https://placehold.co/1200x600.png";
  const mainImageAiHint = locationInfo.imageAiHint || locationInfo.nom.toLowerCase().split(' ').slice(0,2).join(' ') || 'location detail';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ChevronLeft className="mr-2 h-4 w-4" /> Retour à la recherche
      </Button>

      <Card className="overflow-hidden shadow-xl">
        <div className="relative h-64 md:h-96 w-full bg-muted">
          <NextImage
            src={mainImage}
            alt={`Image principale de ${locationInfo.nom}`}
            layout="fill"
            objectFit="cover"
            data-ai-hint={mainImageAiHint}
            priority
          />
        </div>
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
            
            {(locationTags.length > 0 || (locationInfo.amenityIds && locationInfo.amenityIds.length > 0)) && (
               <div>
                <h3 className="text-xl font-semibold mb-2">Équipements & Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {locationTags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
              </div>
            )}


            {Object.keys(groupedAmenities).length > 0 && (
              <div className="pt-4">
                <h3 className="text-2xl font-semibold mb-4 border-b pb-2">Ce que propose ce logement</h3>
                {Object.entries(groupedAmenities).map(([categoryLabel, amenities]) => (
                  <div key={categoryLabel} className="mb-4">
                    <h4 className="text-lg font-medium mb-2">{categoryLabel}</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {amenities.map(amenity => (
                        <li key={amenity.id} className="flex items-center">
                          {React.createElement(amenity.icon, { className: "mr-2 h-4 w-4 text-primary" })}
                          {amenity.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}


          </div>
          <div className="md:col-span-1 space-y-4">
            <Card className="p-4 bg-secondary/50">
              <CardTitle className="text-lg mb-3">Détails de votre sélection</CardTitle>
              <div className="space-y-2 text-sm">
                {arrivalDate && (
                  <p className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> Arrivée: <span className="font-semibold ml-1">{format(parseISO(arrivalDate), 'PPP', {locale: fr})}</span></p>
                )}
                {locationInfo.type === 'Chambre' && departureDate && (
                  <>
                    <p className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> Départ: <span className="font-semibold ml-1">{format(parseISO(departureDate), 'PPP', {locale: fr})}</span></p>
                    <p className="flex items-center"><Info className="mr-2 h-4 w-4 text-muted-foreground" /> Nuits: <span className="font-semibold ml-1">{calculateNights()}</span></p>
                  </>
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
              {!user && (
                <p className="text-xs text-muted-foreground mt-3 text-center">Vous pouvez vous <Button variant="link" className="p-0 h-auto text-xs" onClick={() => router.push(`/login?redirect_url=${encodeURIComponent(window.location.pathname + window.location.search)}`)}>connecter</Button> pour enregistrer cette réservation sur votre compte.</p>
              )}
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LocationDetailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p className="text-lg">Chargement des détails de la réservation...</p></div>}>
      <LocationDetailPageContent />
    </Suspense>
  );
}
      
