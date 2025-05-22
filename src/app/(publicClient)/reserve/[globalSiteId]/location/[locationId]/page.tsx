
"use client";

import React, { useEffect, useState, useCallback, Suspense, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getSiteById, getRoomOrTableById, getTags as fetchHostTags, addReservationToData, getReservations } from '@/lib/data';
import type { Site as GlobalSiteType, RoomOrTable, Tag, Reservation, AmenityOption } from '@/lib/types';
import { PREDEFINED_AMENITIES } from '@/lib/amenities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BedDouble, Utensils, Users, CalendarDays, Tag as TagIconLucide, ChevronLeft, AlertTriangle, CheckCircle, Info, Image as ImageIcon, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import NextImage from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { format, parseISO, isValid, differenceInDays, isBefore, isEqual, eachDayOfInterval, addDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar'; 
import { cn } from '@/lib/utils';


const ImageGallery: React.FC<{ imageUrls?: string[]; locationName: string; imageAiHintBase?: string }> = ({ imageUrls, locationName, imageAiHintBase }) => {
  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="relative h-64 md:h-96 w-full bg-muted flex items-center justify-center rounded-lg overflow-hidden shadow-inner">
        <ImageIcon className="h-24 w-24 text-muted-foreground opacity-50" />
      </div>
    );
  }

  if (imageUrls.length === 1) {
    return (
      <div className="relative h-64 md:h-[500px] w-full rounded-lg overflow-hidden shadow-lg">
        <NextImage src={imageUrls[0]} alt={`Image principale de ${locationName}`} layout="fill" objectFit="cover" data-ai-hint={imageAiHintBase || 'location detail'} priority />
      </div>
    );
  }

  const imagesToDisplay = imageUrls.slice(0, 5);
  const mainImage = imagesToDisplay[0];
  const smallImages = imagesToDisplay.slice(1); // Max 4 small images

  return (
    <div className="relative rounded-lg overflow-hidden shadow-lg h-[300px] md:h-[450px] lg:h-[550px]">
      <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-2 h-full">
        {/* Main Image */}
        <div className="col-span-2 row-span-2 relative">
          <NextImage src={mainImage} alt={`Image principale de ${locationName}`} layout="fill" objectFit="cover" className="rounded-l-lg" data-ai-hint={`${imageAiHintBase} main` || 'location detail main'} priority />
        </div>
        
        {/* Small Images Grid (up to 4 images) */}
        {smallImages.map((imgUrl, index) => (
          <div key={index} className={`relative ${index < 2 ? 'col-span-1' : 'col-span-1'} ${
            index === 0 ? 'rounded-tr-lg md:rounded-tr-none' : '' // Top-right for first small image on all screens if it's the only small one in its row
          } ${
            index === 1 ? 'md:rounded-tr-lg' : '' // Top-right for second small image on medium+ screens
          } ${
            index === 2 && smallImages.length === 3 ? 'rounded-br-lg md:rounded-br-none' : '' // Bottom-right for third if it's the last
          } ${
            index === 3 ? 'md:rounded-br-lg' : '' // Bottom-right for fourth
          }`}>
            <NextImage src={imgUrl} alt={`Image ${index + 2} de ${locationName}`} layout="fill" objectFit="cover" data-ai-hint={`${imageAiHintBase} detail ${index + 2}` || `location detail ${index + 2}`} />
          </div>
        ))}
         {/* Fillers for consistent grid structure if fewer than 4 small images */}
        {smallImages.length < 2 && <div className="hidden md:block bg-muted rounded-tr-lg"></div>}
        {smallImages.length < 4 && <div className="hidden md:block bg-muted rounded-br-lg"></div>}
        {smallImages.length < 3 && smallImages.length % 2 !== 0 && <div className="hidden md:block bg-muted "></div>}


      </div>
      {imageUrls.length > 5 && (
        <Button variant="secondary" className="absolute bottom-4 right-4 bg-background/90 hover:bg-background shadow-md">
          <ImageIcon className="mr-2 h-4 w-4" /> Afficher toutes les photos
        </Button>
      )}
    </div>
  );
};


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
  const [existingReservations, setExistingReservations] = useState<Reservation[]>([]);
  
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(undefined);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(undefined);
  const [numPersons, setNumPersons] = useState<number>(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const arrivalParam = searchParams.get('arrival');
    const departureParam = searchParams.get('departure');
    const personsParam = searchParams.get('persons');

    if (arrivalParam && isValid(parseISO(arrivalParam))) setArrivalDate(startOfDay(parseISO(arrivalParam)));
    if (departureParam && isValid(parseISO(departureParam))) setDepartureDate(startOfDay(parseISO(departureParam)));
    if (personsParam && !isNaN(parseInt(personsParam))) setNumPersons(Math.max(1, parseInt(personsParam)));
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
        const [tags, reservations] = await Promise.all([
          fetchHostTags(siteData.hostId),
          getReservations(siteData.hostId, { locationId: locationId })
        ]);
        setHostTags(tags);
        setExistingReservations(reservations.filter(r => r.status !== 'cancelled'));
      } else {
        setHostTags([]);
        setExistingReservations([]);
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
  
  useEffect(() => {
    if (locationInfo?.type === 'Table' && arrivalDate) {
      if (!departureDate || !isEqual(startOfDay(arrivalDate), startOfDay(departureDate))) {
        setDepartureDate(arrivalDate);
      }
    }
  }, [arrivalDate, locationInfo?.type, departureDate]);


  const handleConfirmReservation = async () => {
    if (!globalSiteInfo || !locationInfo || !arrivalDate) {
      toast({ title: "Informations manquantes", description: "La date d'arrivée est requise.", variant: "destructive"});
      return;
    }
    if (locationInfo.type === 'Chambre' && !departureDate) {
        toast({ title: "Date de départ manquante", description: "Veuillez spécifier une date de départ pour une chambre.", variant: "destructive"});
        return;
    }
    if (locationInfo.type === 'Chambre' && departureDate && (isBefore(departureDate, arrivalDate) || isEqual(startOfDay(departureDate), startOfDay(arrivalDate)))) {
        toast({ title: "Date de départ invalide", description: "La date de départ doit être après la date d'arrivée pour une chambre.", variant: "destructive"});
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
        dateArrivee: format(arrivalDate, 'yyyy-MM-dd'),
        dateDepart: locationInfo.type === 'Chambre' && departureDate ? format(departureDate, 'yyyy-MM-dd') : undefined,
        nombrePersonnes: numPersons,
        animauxDomestiques: locationInfo.type === 'Chambre' ? false : undefined, 
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
  
  const calculateNights = useCallback(() => {
    if (locationInfo?.type === 'Chambre' && arrivalDate && departureDate && isValid(arrivalDate) && isValid(departureDate)) {
      const start = startOfDay(arrivalDate);
      const end = startOfDay(departureDate);
      if (isBefore(start, end)) {
        const nights = differenceInDays(end, start);
        return nights > 0 ? nights : 1; 
      }
    }
    return 1; 
  }, [arrivalDate, departureDate, locationInfo?.type]);

  const disabledDates = useMemo(() => {
    if (!locationInfo) return [];
    let datesToDisable: Array<Date | { from: Date; to: Date }> = [];
    existingReservations.forEach(res => {
      try {
        const resStart = startOfDay(parseISO(res.dateArrivee));
        if (locationInfo.type === 'Chambre' && res.dateDepart) {
          const resEnd = startOfDay(parseISO(res.dateDepart));
          // For rooms, disable from resStart (inclusive) up to, but not including, resEnd
          datesToDisable.push({ from: resStart, to: addDays(resEnd, -1) });
        } else if (locationInfo.type === 'Table') {
          datesToDisable.push(resStart); 
        }
      } catch (e) {
        console.error("Error parsing reservation dates for disabledDates", e, res);
      }
    });
    return datesToDisable;
  }, [existingReservations, locationInfo]);

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

  const nights = calculateNights();
  let totalPrice: number | undefined = undefined;
  if (locationInfo?.type === 'Chambre' && locationInfo.prixParNuit && arrivalDate && departureDate && nights > 0) {
    totalPrice = nights * locationInfo.prixParNuit;
  } else if (locationInfo?.type === 'Table' && locationInfo.prixFixeReservation) {
    totalPrice = locationInfo.prixFixeReservation;
  }


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
          Votre demande de réservation pour <span className="font-semibold text-primary">{locationInfo.nom}</span> à <span className="font-semibold text-primary">{globalSiteInfo.nom}</span> du <span className="font-semibold">{arrivalDate ? format(arrivalDate, 'PPP', {locale:fr}) : ''}</span> {locationInfo.type === 'Chambre' && departureDate ? `au ${format(departureDate, 'PPP', {locale:fr})}` : ''} a été enregistrée.
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
    <div className="max-w-5xl mx-auto py-8 px-2 sm:px-4">
      <Button variant="outline" onClick={() => router.back()} className="mb-6 text-sm">
        <ChevronLeft className="mr-2 h-4 w-4" /> Retour à la recherche
      </Button>

      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">{locationInfo.nom}</h1>
        <p className="text-sm text-muted-foreground">
          <Link href={`/reserve/${globalSiteId}`} className="hover:underline text-primary">{globalSiteInfo.nom}</Link>
           {' / '} 
          <span className="capitalize">{locationInfo.type}</span>
          {locationInfo.capacity && ` · Capacité: ${locationInfo.capacity} personnes`}
        </p>
      </header>
      
      <ImageGallery 
        imageUrls={locationInfo.imageUrls} 
        locationName={locationInfo.nom} 
        imageAiHintBase={locationInfo.imageAiHint}
      />

      <div className="mt-8 grid md:grid-cols-3 gap-x-8 gap-y-10">
        <div className="md:col-span-2 space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-3 border-b pb-3">Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{locationInfo.description || "Aucune description détaillée pour ce lieu."}</p>
          </div>
          
          {(locationTags.length > 0) && (
             <div className="border-t pt-6">
              <h2 className="text-2xl font-semibold mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {locationTags.map(tag => <Badge key={tag} variant="secondary" className="text-sm px-3 py-1">{tag}</Badge>)}
              </div>
            </div>
          )}

          {Object.keys(groupedAmenities).length > 0 && (
            <div className="border-t pt-6">
              <h2 className="text-2xl font-semibold mb-4">Ce que propose ce logement</h2>
              {Object.entries(groupedAmenities).map(([categoryLabel, amenities]) => (
                <div key={categoryLabel} className="mb-5">
                  <h3 className="text-lg font-medium mb-2.5">{categoryLabel}</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-muted-foreground">
                    {amenities.map(amenity => (
                      <li key={amenity.id} className="flex items-center py-1">
                        {React.createElement(amenity.icon, { className: "mr-2.5 h-5 w-5 text-primary/80" })}
                        {amenity.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-1 md:sticky md:top-24 h-fit">
          <Card className="p-5 shadow-xl border rounded-xl">
            <CardHeader className="px-0 pt-0 pb-4">
              <CardTitle className="text-xl mb-1">
                  {locationInfo.type === 'Chambre' && locationInfo.prixParNuit ? (
                      <><span className="font-bold text-2xl">${locationInfo.prixParNuit.toFixed(2)}</span> <span className="text-base font-normal text-muted-foreground">/ nuit</span></>
                  ) : locationInfo.type === 'Table' && locationInfo.prixFixeReservation !== undefined ? (
                      <><span className="font-bold text-2xl">${locationInfo.prixFixeReservation.toFixed(2)}</span> <span className="text-base font-normal text-muted-foreground">/ réservation</span></>
                  ) : (
                      <span className="text-lg text-muted-foreground">Prix non spécifié</span>
                  )}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-3">
              <div className={cn("grid gap-2", locationInfo.type === 'Chambre' ? 'grid-cols-2' : 'grid-cols-1')}>
                  <div className={cn(locationInfo.type === 'Chambre' ? '' : 'col-span-full')}>
                      <Label htmlFor="arrivalDateDetail" className="text-xs font-medium">Arrivée</Label>
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button id="arrivalDateDetail" variant="outline" className="w-full justify-start text-left font-normal h-11">
                                  <CalendarIcon className="mr-2 h-4 w-4"/>
                                  {arrivalDate ? format(arrivalDate, "PPP", {locale: fr}) : <span>Choisir une date</span>}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                              <Calendar mode="single" selected={arrivalDate} onSelect={(date) => date && setArrivalDate(startOfDay(date))} initialFocus disabled={disabledDates}/>
                          </PopoverContent>
                      </Popover>
                  </div>
                  {locationInfo.type === 'Chambre' && (
                      <div>
                          <Label htmlFor="departureDateDetail" className="text-xs font-medium">Départ</Label>
                          <Popover>
                              <PopoverTrigger asChild>
                                  <Button id="departureDateDetail" variant="outline" className="w-full justify-start text-left font-normal h-11" disabled={!arrivalDate}>
                                      <CalendarIcon className="mr-2 h-4 w-4"/>
                                      {departureDate ? format(departureDate, "PPP", {locale: fr}) : <span>Choisir une date</span>}
                                  </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                  <Calendar mode="single" selected={departureDate} onSelect={(date) => date && setDepartureDate(startOfDay(date))} disabled={(date) => isBefore(date, addDays(arrivalDate || new Date(), 1)) || disabledDates.some(d => typeof d === 'object' && 'from' in d ? (isEqual(startOfDay(date), startOfDay(d.from)) || isEqual(startOfDay(date), startOfDay(d.to)) || (isBefore(startOfDay(d.from), startOfDay(date)) && isBefore(startOfDay(date), startOfDay(d.to)))) : isEqual(startOfDay(date), startOfDay(d))) } initialFocus/>
                              </PopoverContent>
                          </Popover>
                      </div>
                  )}
              </div>
               <div>
                  <Label htmlFor="numPersonsDetail" className="text-xs font-medium">Voyageurs</Label>
                  <Input id="numPersonsDetail" type="number" value={numPersons} onChange={(e) => setNumPersons(Math.max(1, parseInt(e.target.value) || 1))} min="1" max={locationInfo.capacity || undefined} className="h-11"/>
              </div>

              {totalPrice !== undefined && (
                  <div className="pt-3 border-t">
                      {locationInfo.type === 'Chambre' && locationInfo.prixParNuit && arrivalDate && departureDate && (
                          <div className="flex justify-between text-sm text-muted-foreground mb-1">
                              <span>${locationInfo.prixParNuit.toFixed(2)} x {nights} nuit{nights > 1 ? 's' : ''}</span>
                              <span>${(locationInfo.prixParNuit * nights).toFixed(2)}</span>
                          </div>
                      )}
                      <div className="flex justify-between text-lg font-semibold mt-1">
                          <span>Total</span>
                          <span>${totalPrice.toFixed(2)}</span>
                      </div>
                  </div>
              )}
            </CardContent>
            <CardFooter className="px-0 pb-0 pt-4">
              <Button 
                onClick={handleConfirmReservation} 
                disabled={isSubmitting || !arrivalDate || (locationInfo.type === 'Chambre' && !departureDate) || (numPersons > (locationInfo.capacity || Infinity))} 
                className="w-full text-base py-3 h-auto bg-primary hover:bg-primary/80"
              >
                {isSubmitting ? "Confirmation en cours..." : "Réserver"}
              </Button>
            </CardFooter>
             {!user && (
              <p className="text-xs text-muted-foreground mt-3 text-center">Vous pouvez vous <Button variant="link" className="p-0 h-auto text-xs" onClick={() => router.push(`/login?redirect_url=${encodeURIComponent(window.location.pathname + window.location.search)}`)}>connecter</Button> pour enregistrer cette réservation sur votre compte.</p>
            )}
          </Card>
        </div>
      </div>
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
      
