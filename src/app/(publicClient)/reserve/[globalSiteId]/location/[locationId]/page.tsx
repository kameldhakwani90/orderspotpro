
"use client";

import React, { useEffect, useState, useCallback, Suspense, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getSiteById, getRoomOrTableById, getTags as fetchHostTags, addReservationToData, getReservations } from '@/lib/data';
import type { Site as GlobalSiteType, RoomOrTable, Tag, Reservation, AmenityOption } from '@/lib/types';
import { PREDEFINED_AMENITIES } from '@/lib/amenities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label'; // Fixed: Added Label import
import { BedDouble, Utensils, Users, CalendarDays as CalendarIcon, Tag as TagIconLucide, ChevronLeft, AlertTriangle, CheckCircle, Info, Image as ImageIconLucide, DollarSign } from 'lucide-react';
import NextImage from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { format, parseISO, isValid, differenceInDays, isBefore, isEqual, addDays, startOfDay, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useLanguage } from '@/context/LanguageContext';


interface ImageGalleryProps {
  images?: string[];
  altText: string;
  aiHint?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, altText, aiHint }) => {
  if (!images || images.length === 0) {
    return (
      <div className="relative h-64 md:h-96 w-full bg-muted rounded-lg flex items-center justify-center">
        <ImageIconLucide className="h-24 w-24 text-muted-foreground/50" />
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden">
        <NextImage src={images[0]} alt={altText} layout="fill" objectFit="cover" data-ai-hint={aiHint || 'location image'} priority />
      </div>
    );
  }

  const mainImage = images[0];
  const sideImages = images.slice(1, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-lg overflow-hidden h-[400px] md:h-[450px]">
      <div className="relative col-span-1 md:col-span-1 h-full">
        <NextImage src={mainImage} alt={`${altText} - main`} layout="fill" objectFit="cover" data-ai-hint={aiHint || 'location image'} priority />
      </div>
      <div className="hidden md:grid md:grid-cols-2 md:grid-rows-2 gap-2 h-full">
        {sideImages.map((img, index) => (
          <div key={index} className="relative h-full">
            <NextImage src={img} alt={`${altText} - ${index + 1}`} layout="fill" objectFit="cover" data-ai-hint={aiHint || 'location image detail'} />
          </div>
        ))}
        {images.length > 5 && (
          <div className="relative h-full flex items-center justify-center bg-black/50">
            <Button variant="outline" className="text-white border-white hover:bg-white/10">
              +{images.length - 5} photos
            </Button>
          </div>
        )}
      </div>
       {images.length > 1 && (
        <div className="md:hidden absolute bottom-4 right-4">
            <Button variant="secondary" size="sm" className="bg-white/80 hover:bg-white">
                Voir les {images.length} photos
            </Button>
        </div>
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
  const { t } = useLanguage();

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
    else setArrivalDate(startOfDay(new Date()));

    if (departureParam && isValid(parseISO(departureParam))) setDepartureDate(startOfDay(parseISO(departureParam)));
    else if (arrivalParam && isValid(parseISO(arrivalParam))) setDepartureDate(startOfDay(addDays(parseISO(arrivalParam),1)));
    else setDepartureDate(startOfDay(addDays(new Date(),1)));

    if (personsParam && !isNaN(parseInt(personsParam))) setNumPersons(Math.max(1, parseInt(personsParam)));
    else setNumPersons(1);

  }, [searchParams]);

  const fetchPageData = useCallback(async () => {
    if (!globalSiteId || !locationId) {
      setError(t('errorLoadingLocationDetails'));
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
        setError(t('establishmentNotFound', { globalSiteId }));
        setGlobalSiteInfo(null); setLocationInfo(null); setIsLoading(false); return;
      }
      setGlobalSiteInfo(siteData);

      if (!locationDataResult || locationDataResult.globalSiteId !== globalSiteId) {
        setError(t('locationNotFound'));
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
      setError(t('errorLoadingLocationDetails') + ` (${e.message})`);
    } finally {
      setIsLoading(false);
    }
  }, [globalSiteId, locationId, t]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  
  useEffect(() => {
    if (locationInfo?.type === 'Table' && arrivalDate) {
      if (!departureDate || !isSameDay(arrivalDate, departureDate)) {
        setDepartureDate(arrivalDate);
      }
    } else if (locationInfo?.type === 'Chambre' && arrivalDate && departureDate && !isBefore(arrivalDate, departureDate)) {
       setDepartureDate(addDays(arrivalDate, 1));
    }
  }, [arrivalDate, locationInfo?.type, departureDate]);


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

  const nights = calculateNights();
  let totalPrice: number | undefined = undefined;
  let priceDisplayString: string = t('priceNotSpecified');

  if (locationInfo?.prixParNuit !== undefined && locationInfo.type === 'Chambre') {
    if (locationInfo.pricingModel === 'perPerson') {
      priceDisplayString = `$${locationInfo.prixParNuit.toFixed(2)} / ${t('person')} / ${t('night')}`;
      if (arrivalDate && departureDate && nights > 0 && numPersons > 0) {
        totalPrice = nights * locationInfo.prixParNuit * numPersons;
      }
    } else { // perRoom or undefined (default to perRoom)
      priceDisplayString = `$${locationInfo.prixParNuit.toFixed(2)} / ${t('night')}`;
      if (arrivalDate && departureDate && nights > 0) {
        totalPrice = nights * locationInfo.prixParNuit;
      }
    }
  } else if (locationInfo?.type === 'Table' && locationInfo.prixFixeReservation !== undefined) {
    priceDisplayString = `$${locationInfo.prixFixeReservation.toFixed(2)} / ${t('reservation')}`;
    totalPrice = locationInfo.prixFixeReservation;
  }
  
  const handleConfirmReservation = async () => {
    if (!globalSiteInfo || !locationInfo || !arrivalDate || !totalPrice) {
      toast({ title: t("dates"), description: t('arrivalDate') + " et un prix valide sont requis.", variant: "destructive"});
      return;
    }
    if (locationInfo.type === 'Chambre' && !departureDate) {
        toast({ title: t("dates"), description: t('departureDate') + " est requise pour une chambre.", variant: "destructive"});
        return;
    }
    if (locationInfo.type === 'Chambre' && departureDate && (isBefore(startOfDay(departureDate), startOfDay(addDays(arrivalDate, 1))) || isSameDay(startOfDay(departureDate), startOfDay(arrivalDate)))) {
        toast({ title: t("departureDate"), description: "La date de départ doit être après la date d'arrivée pour une chambre.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    try {
      const reservationData: Omit<Reservation, 'id' | 'montantPaye' | 'soldeDu' | 'paiements' | 'pointsGagnes' | 'onlineCheckinStatus' | 'onlineCheckinData' | 'clientInitiatedCheckoutTime' | 'checkoutNotes' | 'currency'> & {prixTotal: number} = {
        hostId: globalSiteInfo.hostId,
        locationId: locationInfo.id,
        type: locationInfo.type,
        clientName: user?.nom || `Invité ${Date.now().toString().slice(-5)}`,
        clientId: user?.id,
        dateArrivee: format(arrivalDate, 'yyyy-MM-dd'),
        dateDepart: locationInfo.type === 'Chambre' && departureDate ? format(departureDate, 'yyyy-MM-dd') : undefined,
        nombrePersonnes: numPersons,
        animauxDomestiques: locationInfo.type === 'Chambre' ? false : undefined, // Assuming no pets by default for public booking
        status: 'pending',
        notes: `Réservation via la page publique pour ${locationInfo.nom}.`,
        prixTotal: totalPrice, // Use the calculated total price
      };

      await addReservationToData(reservationData as Omit<Reservation, 'id' | 'onlineCheckinData' | 'onlineCheckinStatus' | 'clientInitiatedCheckoutTime' | 'checkoutNotes' | 'prixTotal' | 'montantPaye' | 'soldeDu' | 'paiements' | 'pointsGagnes'>);
      setBookingSuccess(true);
      toast({ title: t('bookingSuccessTitle'), description: `Votre réservation pour ${locationInfo.nom} a été enregistrée.` });
    } catch (e: any) {
      console.error("Error confirming reservation:", e);
      toast({ title: t('searchErrorTitle'), description: t('errorConfirmingCheckout') + (e instanceof Error ? e.message : "Unknown error"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabledDates = useMemo(() => {
    if (!locationInfo) return [];
    let datesToDisable: Array<Date | { from: Date; to: Date }> = [];
    existingReservations.forEach(res => {
      try {
        const resStart = startOfDay(parseISO(res.dateArrivee));
        if (locationInfo.type === 'Chambre' && res.dateDepart) {
          const resEnd = startOfDay(parseISO(res.dateDepart));
          // For rooms, disable from resStart (inclusive) up to, but not including, resEnd
          // This means if departure is 25th, the 24th is the last booked night.
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
        <h2 className="text-2xl font-semibold text-destructive mb-2">{t('errorAccessingReservation')}</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.back()} className="mt-6">{t('goBack')}</Button>
      </div>
    );
  }

  if (!globalSiteInfo || !locationInfo) {
    return (
      <div className="text-center py-10 max-w-2xl mx-auto">
        <Info className="mx-auto h-12 w-12 text-primary mb-4" />
        <h2 className="text-2xl font-semibold mb-2">{t('locationDetailsNotFound')}</h2>
        <p className="text-muted-foreground">{t('errorLoadingLocationDetails')}</p>
        <Button onClick={() => router.back()} className="mt-6">{t('goBack')}</Button>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="text-center py-16 max-w-2xl mx-auto">
        <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-3">{t('bookingSuccessTitle')}</h1>
        <p className="text-lg text-muted-foreground mb-6">
          {t('bookingSuccessDescription', { 
            locationName: locationInfo.nom, 
            siteName: globalSiteInfo.nom,
            arrivalDate: arrivalDate ? format(arrivalDate, 'PPP', {locale:fr}) : '',
            departureDateRange: locationInfo.type === 'Chambre' && departureDate ? ` ${t('to')} ${format(departureDate, 'PPP', {locale:fr})}` : ''
          })}
        </p>
        <Button onClick={() => router.push(`/reserve/${globalSiteId}`)} size="lg">
          {t('anotherSearch')}
        </Button>
      </div>
    );
  }

  const locationTags = (locationInfo.tagIds || [])
    .map(tagId => hostTags.find(t => t.id === tagId)?.name)
    .filter(Boolean) as string[];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => router.push(`/reserve/${globalSiteId}?arrival=${arrivalDate ? format(arrivalDate, 'yyyy-MM-dd') : ''}&departure=${departureDate ? format(departureDate, 'yyyy-MM-dd') : ''}&persons=${numPersons}&type=${locationInfo.type}`)} className="mb-6">
        <ChevronLeft className="mr-2 h-4 w-4" /> {t('goBack')}
      </Button>

      <Card className="overflow-hidden shadow-xl">
        <ImageGallery images={locationInfo.imageUrls} altText={locationInfo.nom} aiHint={locationInfo.imageAiHint} />
        
        <div className="p-6 grid md:grid-cols-3 gap-x-8 gap-y-6">
          <div className="md:col-span-2 space-y-6">
            <div>
                <p className="text-sm text-muted-foreground">{globalSiteInfo.nom}</p>
                <CardTitle className="text-3xl md:text-4xl font-bold">{locationInfo.nom}</CardTitle>
                <CardDescription className="text-lg flex items-center text-primary mt-1">
                    {locationInfo.type === 'Chambre' ? <BedDouble className="mr-2 h-5 w-5" /> : <Utensils className="mr-2 h-5 w-5" />}
                    {locationInfo.type}
                    {locationInfo.capacity && <span className="text-muted-foreground text-base ml-2 flex items-center"><Users className="mr-1 h-4 w-4"/>{t('upTo')} {locationInfo.capacity} {t('persons')}</span>}
                </CardDescription>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 border-b pb-2">{t('description')}</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{locationInfo.description || t('noDescriptionAvailable')}</p>
            </div>
            
            {(locationTags.length > 0 || (locationInfo.amenityIds && locationInfo.amenityIds.length > 0)) && (
               <div className="border-t pt-4">
                <h3 className="text-xl font-semibold mb-2">{t('amenitiesAndTags')}</h3>
                {locationTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {locationTags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                    </div>
                )}
                {Object.keys(groupedAmenities).length > 0 && (
                  <div>
                    {Object.entries(groupedAmenities).map(([categoryLabel, amenities]) => (
                      <div key={categoryLabel} className="mb-3">
                        <h4 className="text-md font-medium mb-1.5 text-muted-foreground">{categoryLabel}</h4>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          {amenities.map(amenity => (
                            <li key={amenity.id} className="flex items-center py-0.5">
                              {React.createElement(amenity.icon, { className: "mr-2 h-4 w-4 text-primary/80" })}
                              {amenity.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-1 space-y-4 md:sticky md:top-24">
            <Card className="p-4 shadow-lg border">
              <CardHeader className="px-0 pt-0 pb-3">
                <CardTitle className="text-xl mb-1">
                  <span className="font-bold text-2xl">{priceDisplayString}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 space-y-3">
                <div className="grid grid-cols-1 gap-3">
                    <div>
                        <Label htmlFor="arrivalDateDetail" className="text-xs font-medium">{t('arrivalDate')}</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button id="arrivalDateDetail" variant="outline" className="w-full justify-start text-left font-normal h-11">
                                    <CalendarIcon className="mr-2 h-4 w-4"/>
                                    {arrivalDate && isValid(arrivalDate) ? format(arrivalDate, "PPP", {locale: fr}) : <span>{t('selectDate')}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={arrivalDate} onSelect={(date) => setArrivalDate(date ? startOfDay(date) : undefined)} initialFocus disabled={disabledDates}/>
                            </PopoverContent>
                        </Popover>
                    </div>
                    {locationInfo.type === 'Chambre' && (
                        <div>
                            <Label htmlFor="departureDateDetail" className="text-xs font-medium">{t('departureDate')}</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button id="departureDateDetail" variant="outline" className="w-full justify-start text-left font-normal h-11" disabled={!arrivalDate || !isValid(arrivalDate)}>
                                        <CalendarIcon className="mr-2 h-4 w-4"/>
                                        {departureDate && isValid(departureDate) ? format(departureDate, "PPP", {locale: fr}) : <span>{t('selectDate')}</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={departureDate} onSelect={(date) => setDepartureDate(date ? startOfDay(date) : undefined)} disabled={(date) => !arrivalDate || !isValid(arrivalDate) || isBefore(date, addDays(arrivalDate,1)) || isSameDay(date, arrivalDate) || disabledDates.some(d => typeof d === 'object' && 'from' in d ? (isEqual(date, d.from) || isEqual(date, d.to) || (isBefore(d.from, date) && isBefore(date, d.to))) : isEqual(date, d)) } initialFocus/>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}
                </div>
                 <div>
                    <Label htmlFor="numPersonsDetail" className="text-xs font-medium">{t('guests')}</Label>
                    <Input id="numPersonsDetail" type="number" value={numPersons} onChange={(e) => setNumPersons(Math.max(1, parseInt(e.target.value) || 1))} min="1" max={locationInfo.capacity || undefined} className="h-11"/>
                </div>

                {totalPrice !== undefined && (
                    <div className="pt-3 border-t">
                        {locationInfo.type === 'Chambre' && locationInfo.prixParNuit !== undefined && (
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>${locationInfo.prixParNuit.toFixed(2)} x {nights} {nights > 1 ? t('nights') : t('night')} {locationInfo.pricingModel === 'perPerson' ? `x ${numPersons} ${t('persons')}` : ''}</span>
                                <span>${(totalPrice).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-semibold mt-1">
                            <span>{t('totalEstimatedPrice')}</span>
                            <span>${totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                )}
                 {totalPrice === undefined && locationInfo.prixParNuit === undefined && locationInfo.prixFixeReservation === undefined && (
                    <p className="text-sm text-muted-foreground pt-3 border-t">{t('priceNotSpecified')}</p>
                )}
              </CardContent>
              <CardFooter className="px-0 pb-0 pt-4">
                <Button 
                  onClick={handleConfirmReservation} 
                  disabled={isSubmitting || !arrivalDate || (locationInfo.type === 'Chambre' && !departureDate) || (numPersons > (locationInfo.capacity || Infinity)) || totalPrice === undefined} 
                  className="w-full text-base py-3 h-auto"
                >
                  {isSubmitting ? t('bookingInProgress') : t('confirmReservation')}
                </Button>
              </CardFooter>
               {!user && (
                <p className="text-xs text-muted-foreground mt-3 text-center">{t('youCan')} <Button variant="link" className="p-0 h-auto text-xs" onClick={() => router.push(`/login?redirect_url=${encodeURIComponent(window.location.pathname + window.location.search)}`)}>{t('login').toLowerCase()}</Button> {t('toSaveReservation')}.</p>
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
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p className="text-lg">{/* Fallback UI while params are loading */}</p></div>}>
      <LocationDetailPageContent />
    </Suspense>
  );
}
      

