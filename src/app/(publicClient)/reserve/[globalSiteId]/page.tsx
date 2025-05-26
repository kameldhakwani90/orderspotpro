
"use client";

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { getSiteById, getRoomsOrTables, getTags as fetchHostTags, getReservations as fetchAllReservationsForHost } from '@/lib/data';
import type { Site as GlobalSiteType, RoomOrTable, Tag, Reservation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ShadCalendar } from '@/components/ui/calendar';
import {
  CalendarDays as CalendarIcon,
  AlertTriangle,
  Search,
  BedDouble,
  Utensils as UtensilsIcon,
  Users,
  Tag as TagIconLucide,
  Info,
  ImageIcon as ImageIconLucide,
  Filter as FilterIcon,
  Minus,
  Plus,
  ChevronDown,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import {
  format, parseISO, isWithinInterval, eachDayOfInterval, addDays, subDays,
  startOfDay, endOfDay, isEqual, isBefore, isValid, differenceInDays,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';


const GuestCounter: React.FC<{
  label: string;
  description?: string;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  minCount?: number;
  maxCount?: number;
}> = ({ label, description, count, onIncrement, onDecrement, minCount = 0, maxCount = Infinity }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="font-medium">{label}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
    <div className="flex items-center gap-3">
      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={onDecrement} disabled={count <= minCount}>
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-6 text-center font-medium">{count}</span>
      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={onIncrement} disabled={count >= maxCount}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  </div>
);


function PublicReservationPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  const globalSiteId = params.globalSiteId as string;

  const [globalSiteInfo, setGlobalSiteInfo] = useState<GlobalSiteType | null>(null);
  const [allHostTags, setAllHostTags] = useState<Tag[]>([]);
  const [allReservableLocationsForSite, setAllReservableLocationsForSite] = useState<RoomOrTable[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);

  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [departureDate, setDepartureDate] = useState<Date | undefined>(startOfDay(addDays(new Date(), 1)));
  const [searchType, setSearchType] = useState<'Chambre' | 'Table'>('Chambre');

  const [numAdults, setNumAdults] = useState<number>(1);
  const [numChildren, setNumChildren] = useState<number>(0);
  const [numInfants, setNumInfants] = useState<number>(0); 
  const [numPets, setNumPets] = useState<number>(0);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagFilters, setShowTagFilters] = useState(false);

  const [availableLocations, setAvailableLocations] = useState<RoomOrTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const totalTravelers = useMemo(() => numAdults + numChildren, [numAdults, numChildren]);

  const fetchPageData = useCallback(async () => {
    if (!globalSiteId) {
      setError(t('errorLoadingLocationDetails'));
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const siteInfo = await getSiteById(globalSiteId);
      if (!siteInfo) {
        setError(t('establishmentNotFound', { globalSiteId }));
        setGlobalSiteInfo(null); setIsLoading(false); return;
      }
      setGlobalSiteInfo(siteInfo);

      if (!siteInfo.hostId) {
        setError(t('errorLoadingLocationDetails') + " (Host ID missing)");
        setIsLoading(false); return;
      }

      const [tagsData, locationsData, reservationsData] = await Promise.all([
        fetchHostTags(siteInfo.hostId),
        getRoomsOrTables(siteInfo.hostId, globalSiteId),
        fetchAllReservationsForHost(siteInfo.hostId)
      ]);

      setAllHostTags(tagsData);
      setAllReservableLocationsForSite(locationsData.filter(loc => (loc.type === 'Chambre' || loc.type === 'Table') && loc.globalSiteId === globalSiteId));
      setAllReservations(reservationsData);

      const roomEnabled = siteInfo.reservationPageSettings?.enableRoomReservations ?? true;
      const tableEnabled = siteInfo.reservationPageSettings?.enableTableReservations ?? true;
      
      const typeParam = searchParamsHook.get('type') as 'Chambre' | 'Table' | null;
      let initialSearchType = typeParam || (roomEnabled ? 'Chambre' : tableEnabled ? 'Table' : 'Chambre');

      if (!roomEnabled && tableEnabled) initialSearchType = 'Table';
      else if (roomEnabled && !tableEnabled) initialSearchType = 'Chambre';
      else if (!roomEnabled && !tableEnabled) {
          setError(t('noAvailabilityDescription'));
      }
      setSearchType(initialSearchType);


    } catch (e: any) {
      setError(t('errorLoadingServiceDetails') + ` (${e.message})`);
      setGlobalSiteInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [globalSiteId, t, searchParamsHook]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  useEffect(() => {
    let newArrivalDate = startOfDay(new Date());
    let newDepartureDate = startOfDay(addDays(new Date(), 1));
    
    const arrivalParam = searchParamsHook.get('arrival');
    const departureParam = searchParamsHook.get('departure');
    const adultsParam = searchParamsHook.get('adults');
    const childrenParam = searchParamsHook.get('children');
    const infantsParam = searchParamsHook.get('infants');
    const petsParam = searchParamsHook.get('pets');

    if (arrivalParam && isValid(parseISO(arrivalParam))) {
        newArrivalDate = startOfDay(parseISO(arrivalParam));
    }
    setArrivalDate(newArrivalDate);
    
    if (searchType === 'Chambre') {
      if (departureParam && isValid(parseISO(departureParam)) && isBefore(newArrivalDate, startOfDay(parseISO(departureParam)))) {
          newDepartureDate = startOfDay(parseISO(departureParam));
      } else {
          newDepartureDate = startOfDay(addDays(newArrivalDate, 1));
      }
    } else { // Table
      newDepartureDate = startOfDay(newArrivalDate);
    }
    setDepartureDate(newDepartureDate);

    if (adultsParam && !isNaN(parseInt(adultsParam))) setNumAdults(Math.max(1, parseInt(adultsParam)));
    if (childrenParam && !isNaN(parseInt(childrenParam))) setNumChildren(Math.max(0, parseInt(childrenParam)));
    if (infantsParam && !isNaN(parseInt(infantsParam))) setNumInfants(Math.max(0, parseInt(infantsParam)));
    if (petsParam && !isNaN(parseInt(petsParam))) setNumPets(Math.max(0, parseInt(petsParam)));

  }, [searchParamsHook, searchType]); // Re-run if searchType changes too

  useEffect(() => {
    if (arrivalDate) {
      if (searchType === 'Table') {
        if (!departureDate || !isEqual(startOfDay(arrivalDate), startOfDay(departureDate))) {
          setDepartureDate(startOfDay(arrivalDate));
        }
      } else { // Chambre
        if (departureDate && !isBefore(startOfDay(arrivalDate), startOfDay(departureDate))) {
          setDepartureDate(startOfDay(addDays(arrivalDate, 1)));
        } else if (!departureDate) {
          setDepartureDate(startOfDay(addDays(arrivalDate, 1)));
        }
      }
    }
  }, [arrivalDate, searchType, departureDate]);


  const handleTagChange = (tagId: string, checked: boolean | string) => {
    setSelectedTags(prev =>
      checked ? [...prev, tagId] : prev.filter(id => id !== tagId)
    );
  };

  const handleSearchAvailability = async () => {
    if (!arrivalDate || (searchType === 'Chambre' && !departureDate)) {
      toast({ title: t("dates") as string, description: "Veuillez sélectionner les dates d'arrivée et de départ.", variant: "destructive" });
      return;
    }
    if (searchType === 'Chambre' && departureDate && !isBefore(startOfDay(arrivalDate), startOfDay(departureDate))) {
        toast({ title: t("departureDate") as string, description: "La date de départ doit être après la date d'arrivée pour les chambres.", variant: "destructive"});
        return;
    }
    const effectiveNumPersons = Math.max(1, totalTravelers);
    if (effectiveNumPersons <= 0) {
        toast({ title: t("guests") as string, description: "Veuillez indiquer au moins un voyageur (adulte ou enfant).", variant: "destructive"});
        return;
    }

    setIsSearching(true);
    setSearchAttempted(true);
    setAvailableLocations([]);
    setError(null);

    try {
      const checkIn = startOfDay(arrivalDate);
      const checkOut = searchType === 'Table' ? endOfDay(arrivalDate) : startOfDay(departureDate!);

      const filtered = allReservableLocationsForSite.filter(loc => {
        if (loc.type !== searchType) return false;
        if (effectiveNumPersons > 0 && loc.capacity && loc.capacity < effectiveNumPersons) return false;
        if (selectedTags.length > 0 && !selectedTags.every(tagId => loc.tagIds?.includes(tagId))) return false;

        const isBooked = allReservations.some(res => {
          if (res.locationId !== loc.id || res.status === 'cancelled') return false;
          try {
            const resArrival = startOfDay(parseISO(res.dateArrivee));
            let resDeparture;
            if (res.type === 'Table' || !res.dateDepart) {
              resDeparture = endOfDay(parseISO(res.dateArrivee));
            } else {
              resDeparture = startOfDay(parseISO(res.dateDepart));
            }
            return checkIn < resDeparture && checkOut > resArrival;
          } catch (e) {
            console.error("Error parsing reservation dates for availability check:", e, res);
            return true; 
          }
        });
        return !isBooked;
      });

      setAvailableLocations(filtered);
      if (filtered.length === 0) {
        toast({ title: t('noAvailability') || "Aucune Disponibilité", description: t('noAvailabilityDescription') || "Aucun lieu ne correspond à vos critères pour les dates sélectionnées.", variant: "default" });
      }
    } catch (e: any) {
        setError(t('errorLoadingServiceDetails') + ` (${e.message})`);
        toast({ title: t('searchErrorTitle') || "Search Error", description: t('searchErrorDescription') || "Could not perform search.", variant: "destructive" });
    } finally {
        setIsSearching(false);
    }
  };

  const handleSelectLocation = (location: RoomOrTable) => {
    const arrivalQueryParam = arrivalDate ? format(arrivalDate, 'yyyy-MM-dd') : '';
    const departureQueryParam = searchType === 'Table' ? arrivalQueryParam : (departureDate ? format(departureDate, 'yyyy-MM-dd') : '');
    
    router.push(`/reserve/${globalSiteId}/location/${location.id}?arrival=${arrivalQueryParam}&departure=${departureQueryParam}&adults=${numAdults}&children=${numChildren}&infants=${numInfants}&pets=${numPets}`);
  };

  const LocationTypeIcon = ({ type }: { type: 'Chambre' | 'Table' }) => {
    if (type === 'Chambre') return <BedDouble className="h-4 w-4 mr-1 text-muted-foreground" />;
    if (type === 'Table') return <UtensilsIcon className="h-4 w-4 mr-1 text-muted-foreground" />;
    return null;
  };
  
  const showTypeSelector = useMemo(() => {
    if (!globalSiteInfo || !globalSiteInfo.reservationPageSettings) return true; 
    const { enableRoomReservations = true, enableTableReservations = true } = globalSiteInfo.reservationPageSettings;
    return enableRoomReservations && enableTableReservations;
  }, [globalSiteInfo]);


  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-8">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Card><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 max-w-2xl mx-auto">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">{t('errorLoadingServiceDetails')}</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }
  
  if (!globalSiteInfo) {
    return (
      <div className="text-center py-10 max-w-2xl mx-auto">
        <Info className="mx-auto h-12 w-12 text-primary mb-4" />
        <h2 className="text-2xl font-semibold mb-2">{t('establishmentNotFound', { globalSiteId: ''})}</h2>
        <p className="text-muted-foreground">{t('errorLoadingLocationDetails')}</p>
      </div>
    );
  }

  const heroImageUrl = globalSiteInfo?.reservationPageSettings?.heroImageUrl || `https://placehold.co/1200x350.png`;
  const heroImageAiHint = globalSiteInfo?.reservationPageSettings?.heroImageAiHint || globalSiteInfo?.nom.toLowerCase().split(' ').slice(0,2).join(' ') || "establishment banner";

  const isSearchButtonDisabled = isLoading ||
    isSearching ||
    !arrivalDate ||
    (searchType === 'Chambre' && (!departureDate || !isBefore(startOfDay(arrivalDate), startOfDay(departureDate)))) ||
    totalTravelers <= 0 ||
    (
      globalSiteInfo?.reservationPageSettings &&
      globalSiteInfo.reservationPageSettings.enableRoomReservations === false &&
      globalSiteInfo.reservationPageSettings.enableTableReservations === false
    );

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="relative h-56 md:h-72 w-full rounded-xl overflow-hidden shadow-xl">
          <NextImage
            src={heroImageUrl}
            alt={t('reserveYourStayAt', { siteName: globalSiteInfo?.nom || ''})}
            fill
            style={{objectFit:"cover"}}
            className="opacity-90"
            data-ai-hint={heroImageAiHint}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white shadow-md">
              {globalSiteInfo?.nom}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mt-1">{t('findYourIdealAccommodation')}</p>
          </div>
        </div>

      <Card className="shadow-xl sticky top-24 z-40 bg-card/95 backdrop-blur-md">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            
            {showTypeSelector && (
              <div className="space-y-1.5">
                <Label htmlFor="searchType" className="text-xs font-medium text-muted-foreground">{t('searchType')}</Label>
                <Select value={searchType} onValueChange={(value: 'Chambre' | 'Table') => setSearchType(value)}>
                  <SelectTrigger id="searchType" className="h-12 text-sm">
                    <div className="flex items-center min-w-0">
                       <LocationTypeIcon type={searchType} />
                       <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {(globalSiteInfo?.reservationPageSettings?.enableRoomReservations !== false) && <SelectItem value="Chambre"><BedDouble className="inline-block mr-2 h-4 w-4" />{t('room')}</SelectItem>}
                    {(globalSiteInfo?.reservationPageSettings?.enableTableReservations !== false) && <SelectItem value="Table"><UtensilsIcon className="inline-block mr-2 h-4 w-4" />{t('table')}</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-1.5">
              <Label htmlFor="arrivalDate" className="text-xs font-medium text-muted-foreground">{t('arrivalDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="arrivalDate" variant="outline" className="w-full justify-start text-left font-normal h-12 text-sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {arrivalDate && isValid(arrivalDate) ? format(arrivalDate, 'dd/MM/yy', { locale: fr }) : <span>{t('when')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><ShadCalendar mode="single" selected={arrivalDate} onSelect={setArrivalDate} initialFocus disabled={{ before: startOfDay(new Date()) }}/></PopoverContent>
              </Popover>
            </div>
            
            {searchType === 'Chambre' && (
              <div className="space-y-1.5">
                <Label htmlFor="departureDate" className="text-xs font-medium text-muted-foreground">{t('departureDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="departureDate"
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-12 text-sm"
                      disabled={!arrivalDate || !isValid(arrivalDate)}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {departureDate && isValid(departureDate) ? format(departureDate, 'dd/MM/yy', { locale: fr }) : <span>{t('when')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <ShadCalendar
                      mode="single"
                      selected={departureDate}
                      onSelect={setDepartureDate}
                      disabled={(date) => arrivalDate && isValid(arrivalDate) ? isBefore(date, addDays(arrivalDate,1)) : true}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="voyageursButton" className="text-xs font-medium text-muted-foreground">{t('guests')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                    <Button id="voyageursButton" variant="outline" className="w-full justify-start text-left font-normal h-12 text-sm">
                        <div className="flex items-center min-w-0 flex-1">
                            <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                            {(() => {
                                const parts = [];
                                const displayTravelers = Math.max(1, totalTravelers); 
                                parts.push(t('numTravelers', {count: displayTravelers}));
                                if (numInfants > 0) parts.push(t('numInfants', {count: numInfants}));
                                if (numPets > 0) parts.push(t('numPets', {count: numPets}));
                                return parts.join(', ');
                            })()}
                            </span>
                        </div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0">
                  <div className="p-4 space-y-2">
                    <GuestCounter label={t('adults')|| "Adults"} description={t('adultsDescription') || "Age 13+"} count={numAdults} onIncrement={() => setNumAdults(c => c + 1)} onDecrement={() => setNumAdults(c => Math.max(1, c - 1))} minCount={1}/>
                    <GuestCounter label={t('children') || "Children"} description={t('childrenDescription') || "Ages 2-12"} count={numChildren} onIncrement={() => setNumChildren(c => c + 1)} onDecrement={() => setNumChildren(c => Math.max(0, c - 1))} />
                    <GuestCounter label={t('infants') || "Infants"} description={t('infantsDescription') || "Under 2"} count={numInfants} onIncrement={() => setNumInfants(c => c + 1)} onDecrement={() => setNumInfants(c => Math.max(0, c - 1))} />
                    <GuestCounter label={t('pets') || "Pets"} count={numPets} onIncrement={() => setNumPets(c => c + 1)} onDecrement={() => setNumPets(c => Math.max(0, c - 1))} />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-end gap-2 col-span-full sm:col-span-2 md:col-span-2 lg:col-span-full xl:col-span-1">
              {allHostTags.length > 0 && (
                <Button variant="outline" onClick={() => setShowTagFilters(!showTagFilters)} className="h-12 w-12 p-0 flex-shrink-0" title={t('filterByTags')}>
                  <FilterIcon className="h-5 w-5" />
                </Button>
              )}
              <Button 
                onClick={handleSearchAvailability} 
                disabled={isSearchButtonDisabled}
                className="h-12 flex-grow bg-primary hover:bg-primary/90"
              >
                <Search className="h-5 w-5 mr-2" /> {t('search')}
              </Button>
            </div>
          </div>

          {showTagFilters && allHostTags.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">{t('filterByTags')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {allHostTags.map(tag => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={selectedTags.includes(tag.id)}
                      onCheckedChange={(checked) => handleTagChange(tag.id, !!checked)}
                    />
                    <Label htmlFor={`tag-${tag.id}`} className="text-sm font-normal cursor-pointer">{tag.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {searchAttempted && !isSearching && (
        <div className="mt-8">
          {availableLocations.length > 0 ? (
            <>
              <h2 className="text-2xl font-semibold mb-4">{t('availableLocations', { count: availableLocations.length })}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableLocations.map(loc => (
                  <Card key={loc.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                     <div className="relative h-48 w-full bg-muted">
                        {loc.imageUrls && loc.imageUrls.length > 0 ? (
                             <NextImage src={loc.imageUrls[0]} alt={loc.nom} fill style={{objectFit:"cover"}} data-ai-hint={loc.imageAiHint || "location image"} />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <ImageIconLucide className="w-16 h-16 text-muted-foreground/50" />
                            </div>
                        )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">{loc.nom}</CardTitle>
                      <CardDescription className="flex items-center">
                        <LocationTypeIcon type={loc.type}/> {loc.type}
                        {loc.capacity && <span className="ml-2 flex items-center"><Users className="mr-1 h-4 w-4 text-muted-foreground"/>{loc.capacity} {t('guests')}</span>}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-1 pt-0 pb-3">
                      <p className="line-clamp-2 h-10">{loc.description || t('noDescriptionAvailable')}</p>
                      
                      {loc.type === 'Chambre' && loc.prixParNuit !== undefined && (
                        <p className="font-semibold text-primary flex items-center">
                          <DollarSign className="h-4 w-4 mr-1"/>
                          {(loc.currency || globalSiteInfo?.currency || '$')}{loc.prixParNuit.toFixed(2)}
                          {loc.pricingModel === 'perPerson' ? ` / ${t('person')} / ${t('night')}` : ` / ${t('night')}`}
                        </p>
                      )}
                      {loc.type === 'Table' && loc.prixFixeReservation !== undefined && (
                         <p className="font-semibold text-primary flex items-center">
                           <DollarSign className="h-4 w-4 mr-1"/>
                           {(loc.currency || globalSiteInfo?.currency || '$')}{loc.prixFixeReservation.toFixed(2)} / {t('reservation')}
                         </p>
                      )}

                      {loc.tagIds && loc.tagIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {loc.tagIds.map(tagId => {
                            const tagName = allHostTags.find(t => t.id === tagId)?.name;
                            return tagName ? <Badge key={tagId} variant="outline" className="text-xs">{tagName}</Badge> : null;
                          })}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-4 border-t">
                      <Button onClick={() => handleSelectLocation(loc)} className="w-full bg-primary hover:bg-primary/80">
                        {t('selectLocation')}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-10 text-lg">{t('noAvailabilityDescription')}</p>
          )}
        </div>
      )}
       {isSearching && (
        <div className="text-center py-10">
            <Search className="mx-auto h-12 w-12 text-primary animate-pulse mb-4" />
            <p className="text-lg text-muted-foreground">{t('searchingAvailability')}...</p>
        </div>
      )}
    </div>
  );
}


export default function PublicReservationPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p className="text-lg">{/* Fallback UI while params are loading */}</p></div>}>
      <PublicReservationPageContent />
    </Suspense>
  );
}
      
