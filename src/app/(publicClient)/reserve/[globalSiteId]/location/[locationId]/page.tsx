
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
import { Calendar } from '@/components/ui/calendar'; // ShadCN Calendar

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
  
  // Dates from URL params are initial source, then can be modified by user
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

    if (arrivalParam && isValid(parseISO(arrivalParam))) setArrivalDate(parseISO(arrivalParam));
    if (departureParam && isValid(parseISO(departureParam))) setDepartureDate(parseISO(departureParam));
    if (personsParam && !isNaN(parseInt(personsParam))) setNumPersons(parseInt(personsParam));
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
        console.warn("Host ID not found for Global Site, cannot fetch tags/reservations:", siteData);
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
  
  // Auto-adjust departure date for tables
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
    return 1; // For tables or invalid room dates, assume 1 "period"
  }, [arrivalDate, departureDate, locationInfo?.type]);

  const disabledDates = useMemo(() => {
    if (!locationInfo) return [];
    let datesToDisable: Array<Date | { from: Date; to: Date }> = [];
    existingReservations.forEach(res => {
      try {
        const resStart = parseISO(res.dateArrivee);
        if (locationInfo.type === 'Chambre' && res.dateDepart) {
          const resEnd = parseISO(res.dateDepart);
          // For rooms, disable from resStart (inclusive) up to, but not including, resEnd
          datesToDisable.push({ from: resStart, to: addDays(resEnd, -1) });
        } else if (locationInfo.type === 'Table') {
          datesToDisable.push(resStart); // Disable the single day for table bookings
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
           {locationInfo.imageUrls && locationInfo.imageUrls.length > 1 && (
            <div className="absolute bottom-4 right-4">
              <Button variant="secondary" size="sm">Voir les {locationInfo.imageUrls.length} photos</Button> {/* TODO: Implement gallery */}
            </div>
          )}
        </div>
        <div className="p-6 grid md:grid-cols-3 gap-x-8 gap-y-6">
          <div className="md:col-span-2 space-y-6">
            <div>
                <p className="text-sm text-muted-foreground">{globalSiteInfo.nom}</p>
                <CardTitle className="text-3xl md:text-4xl font-bold">{locationInfo.nom}</CardTitle>
                <CardDescription className="text-lg flex items-center text-primary mt-1">
                    {locationInfo.type === 'Chambre' ? <BedDouble className="mr-2 h-5 w-5" /> : <Utensils className="mr-2 h-5 w-5" />}
                    {locationInfo.type}
                    {locationInfo.capacity && <span className="text-muted-foreground text-base ml-2 flex items-center"><Users className="mr-1 h-4 w-4"/>jusqu'à {locationInfo.capacity} pers.</span>}
                </CardDescription>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 border-b pb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{locationInfo.description || "Aucune description disponible."}</p>
            </div>
            
            {(locationTags.length > 0) && (
               <div className="border-t pt-4">
                <h3 className="text-xl font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {locationTags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
              </div>
            )}

            {Object.keys(groupedAmenities).length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-2xl font-semibold mb-4">Ce que propose ce logement</h3>
                {Object.entries(groupedAmenities).map(([categoryLabel, amenities]) => (
                  <div key={categoryLabel} className="mb-4">
                    <h4 className="text-lg font-medium mb-2">{categoryLabel}</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {amenities.map(amenity => (
                        <li key={amenity.id} className="flex items-center py-1">
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

          <div className="md:col-span-1 space-y-4 md:sticky md:top-24">
            <Card className="p-4 shadow-lg border">
              <CardHeader className="px-0 pt-0 pb-3">
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
                <div className="grid grid-cols-1 gap-3">
                    <div>
                        <Label htmlFor="arrivalDateDetail" className="text-xs font-medium">Arrivée</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button id="arrivalDateDetail" variant="outline" className="w-full justify-start text-left font-normal h-11">
                                    <CalendarIcon className="mr-2 h-4 w-4"/>
                                    {arrivalDate ? format(arrivalDate, "PPP", {locale: fr}) : <span>Choisir une date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={arrivalDate} onSelect={setArrivalDate} initialFocus disabled={disabledDates}/>
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
                                    <Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} disabled={date => isBefore(date, addDays(arrivalDate || new Date(), 1)) || disabledDates.some(d => typeof d === 'object' && 'from' in d ? (isEqual(date, d.from) || isEqual(date, d.to) || (isBefore(d.from, date) && isBefore(date, d.to))) : isEqual(date, d)) } initialFocus/>
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
                        {locationInfo.type === 'Chambre' && locationInfo.prixParNuit && (
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>${locationInfo.prixParNuit.toFixed(2)} x {nights} nuit{nights > 1 ? 's' : ''}</span>
                                <span>${(locationInfo.prixParNuit * nights).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-semibold mt-1">
                            <span>Total estimé</span>
                            <span>${totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                )}
              </CardContent>
              <CardFooter className="px-0 pb-0 pt-4">
                <Button 
                  onClick={handleConfirmReservation} 
                  disabled={isSubmitting || !arrivalDate || (locationInfo.type === 'Chambre' && !departureDate) || (numPersons > (locationInfo.capacity || Infinity))} 
                  className="w-full text-base py-3 h-auto"
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
      
