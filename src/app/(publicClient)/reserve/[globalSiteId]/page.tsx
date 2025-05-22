
"use client";

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { getSiteById, getRoomsOrTables, getTags as fetchHostTags, getReservations as fetchAllReservationsForHost } from '@/lib/data';
import type { Site as GlobalSiteType, RoomOrTable, Tag, Reservation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ShadCalendar } from '@/components/ui/calendar';
import { 
  Calendar as CalendarIcon, 
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
  Plus
} from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, isValid, isBefore, isEqual, addDays, subDays, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


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
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const globalSiteId = params.globalSiteId as string;

  const [globalSiteInfo, setGlobalSiteInfo] = useState<GlobalSiteType | null>(null);
  const [allHostTags, setAllHostTags] = useState<Tag[]>([]);
  const [allReservableLocationsForSite, setAllReservableLocationsForSite] = useState<RoomOrTable[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(undefined);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(undefined);
  const [searchType, setSearchType] = useState<'Chambre' | 'Table'>('Chambre');
  
  const [numAdults, setNumAdults] = useState<number>(1);
  const [numChildren, setNumChildren] = useState<number>(0);
  const [numInfants, setNumInfants] = useState<number>(0); // Typically not counted for capacity but good to have
  const [numPets, setNumPets] = useState<number>(0);
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagFilters, setShowTagFilters] = useState(false);

  const [availableLocations, setAvailableLocations] = useState<RoomOrTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const totalTravelers = useMemo(() => numAdults + numChildren, [numAdults, numChildren]);

  // Effect to set searchType based on globalSiteInfo settings
  useEffect(() => {
    if (globalSiteInfo && globalSiteInfo.reservationPageSettings) {
      const { enableRoomReservations, enableTableReservations } = globalSiteInfo.reservationPageSettings;
      const canReserveRooms = enableRoomReservations ?? true;
      const canReserveTables = enableTableReservations ?? true;

      if (canReserveRooms && !canReserveTables) {
        setSearchType('Chambre');
      } else if (!canReserveRooms && canReserveTables) {
        setSearchType('Table');
      } else if (!canReserveRooms && !canReserveTables) {
        setError("Les réservations pour cet établissement ne sont actuellement pas activées.");
      }
      // If both are enabled, keep current or default 'Chambre'
    }
  }, [globalSiteInfo]);

  // Effect for initializing dates and person counts from URL or defaults
  useEffect(() => {
    const arrivalParam = searchParams.get('arrival');
    const departureParam = searchParams.get('departure');
    const typeParam = searchParams.get('type') as 'Chambre' | 'Table' | null;
    const adultsParam = searchParams.get('adults');
    const childrenParam = searchParams.get('children');
    const infantsParam = searchParams.get('infants');
    const petsParam = searchParams.get('pets');

    let effectiveSearchType = searchType; // Default to current state

    if (globalSiteInfo?.reservationPageSettings) {
        const canReserveRooms = globalSiteInfo.reservationPageSettings.enableRoomReservations ?? true;
        const canReserveTables = globalSiteInfo.reservationPageSettings.enableTableReservations ?? true;
        if (typeParam && typeParam === 'Chambre' && canReserveRooms) {
            effectiveSearchType = 'Chambre';
        } else if (typeParam && typeParam === 'Table' && canReserveTables) {
            effectiveSearchType = 'Table';
        } else if (canReserveRooms && !canReserveTables) {
            effectiveSearchType = 'Chambre';
        } else if (!canReserveRooms && canReserveTables) {
            effectiveSearchType = 'Table';
        }
    }
    setSearchType(effectiveSearchType);


    let newArrivalState: Date;
    if (arrivalParam && isValid(parseISO(arrivalParam))) {
      newArrivalState = startOfDay(parseISO(arrivalParam));
    } else {
      newArrivalState = startOfDay(new Date()); 
    }
    setArrivalDate(newArrivalState);

    let newDepartureState: Date;
    if (departureParam && isValid(parseISO(departureParam))) {
      const parsedDeparture = startOfDay(parseISO(departureParam));
      if (effectiveSearchType === 'Chambre') {
        if (isBefore(parsedDeparture, addDays(newArrivalState, 1))) {
          newDepartureState = addDays(newArrivalState, 1);
        } else {
          newDepartureState = parsedDeparture;
        }
      } else { 
        newDepartureState = newArrivalState;
      }
    } else {
      newDepartureState = effectiveSearchType === 'Chambre' ? addDays(newArrivalState, 1) : newArrivalState;
    }
    setDepartureDate(newDepartureState);
    
    if (adultsParam && !isNaN(parseInt(adultsParam))) {
        setNumAdults(Math.max(1, parseInt(adultsParam)));
    } else if (searchParams.get('persons') && !isNaN(parseInt(searchParams.get('persons')!))) {
        // Fallback to 'persons' if 'adults' not present, assume all are adults
        setNumAdults(Math.max(1, parseInt(searchParams.get('persons')!)));
    }
    if (childrenParam && !isNaN(parseInt(childrenParam))) {
        setNumChildren(Math.max(0, parseInt(childrenParam)));
    }
    if (infantsParam && !isNaN(parseInt(infantsParam))) setNumInfants(Math.max(0, parseInt(infantsParam)));
    if (petsParam && !isNaN(parseInt(petsParam))) setNumPets(Math.max(0, parseInt(petsParam)));

  }, [searchParams, globalSiteInfo]); // Rerun if globalSiteInfo changes (for reservation settings)


  const fetchPageData = useCallback(async () => {
    if (!globalSiteId) {
      setError("Global Site ID is missing from the URL.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const siteInfo = await getSiteById(globalSiteId);
      if (!siteInfo) {
        setError(`Establishment with ID ${globalSiteId} not found.`);
        setGlobalSiteInfo(null); setIsLoading(false); return;
      }
      setGlobalSiteInfo(siteInfo);

      if (!siteInfo.hostId) {
        setError(`Host information is missing for establishment ${siteInfo.nom}.`);
        setIsLoading(false); return;
      }
      
      const [tagsData, locationsData, reservationsData] = await Promise.all([
        fetchHostTags(siteInfo.hostId),
        getRoomsOrTables(siteInfo.hostId, globalSiteId),
        fetchAllReservationsForHost(siteInfo.hostId)
      ]);

      setAllHostTags(tagsData);
      setAllReservableLocationsForSite(locationsData.filter(loc => (loc.type === 'Chambre' || loc.type === 'Table') && loc.globalSiteId === globalSiteId));
      setAllReservations(reservationsData.filter(r => r.status !== 'cancelled'));

    } catch (e: any) {
      setError("Failed to load establishment details. " + e.message);
      setGlobalSiteInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [globalSiteId]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleTagChange = (tagId: string, checked: boolean | string) => {
    setSelectedTags(prev =>
      checked ? [...prev, tagId] : prev.filter(id => id !== tagId)
    );
  };

  const handleSearchAvailability = async () => {
    if (!arrivalDate || (searchType === 'Chambre' && !departureDate)) {
      toast({ title: "Dates requises", description: "Veuillez sélectionner les dates d'arrivée et de départ.", variant: "destructive" });
      return;
    }
    if (searchType === 'Chambre' && departureDate && (isBefore(departureDate, arrivalDate) || isEqual(startOfDay(departureDate), startOfDay(arrivalDate)))) {
        toast({ title: "Date de départ invalide", description: "La date de départ doit être après la date d'arrivée pour les chambres.", variant: "destructive" });
        return;
    }
    
    const effectiveNumPersons = totalTravelers;
    if (effectiveNumPersons <= 0) {
        toast({ title: "Nombre de voyageurs invalide", description: "Veuillez indiquer au moins un voyageur (adulte ou enfant).", variant: "destructive"});
        return;
    }

    setIsSearching(true);
    setSearchAttempted(true);
    setAvailableLocations([]);
    setError(null);

    try {
      const checkIn = startOfDay(arrivalDate);
      const checkOut = searchType === 'Table' ? endOfDay(arrivalDate) : (departureDate ? startOfDay(departureDate) : endOfDay(addDays(arrivalDate, 1)));

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
            return true; 
          }
        });
        return !isBooked;
      });

      setAvailableLocations(filtered);
      if (filtered.length === 0) {
        toast({ title: "Aucune disponibilité", description: "Aucun lieu ne correspond à vos critères pour les dates sélectionnées.", variant: "default" });
      }
    } catch (e: any) {
        setError("Une erreur s'est produite lors de la recherche. " + e.message);
        toast({ title: "Erreur de recherche", description: "Impossible d'effectuer la recherche.", variant: "destructive" });
    } finally {
        setIsSearching(false);
    }
  };

  const handleSelectLocation = (location: RoomOrTable) => {
    const arrivalQueryParam = arrivalDate ? format(arrivalDate, 'yyyy-MM-dd') : '';
    const departureQueryParam = searchType === 'Table' ? arrivalQueryParam : (departureDate ? format(departureDate, 'yyyy-MM-dd') : '');
    
    router.push(`/reserve/${globalSiteId}/location/${location.id}?arrival=${arrivalQueryParam}&departure=${departureQueryParam}&persons=${totalTravelers}&adults=${numAdults}&children=${numChildren}&infants=${numInfants}&pets=${numPets}`);
  };

  const LocationTypeIcon = ({ type, className }: { type: 'Chambre' | 'Table', className?: string }) => {
    if (type === 'Chambre') return <BedDouble className={cn("h-5 w-5 mr-1", className)} />;
    if (type === 'Table') return <UtensilsIcon className={cn("h-5 w-5 mr-1", className)} />;
    return null;
  };
  
  const showTypeSelector = useMemo(() => {
    if (!globalSiteInfo || !globalSiteInfo.reservationPageSettings) return true; 
    const { enableRoomReservations, enableTableReservations } = globalSiteInfo.reservationPageSettings;
    return (enableRoomReservations ?? true) && (enableTableReservations ?? true);
  }, [globalSiteInfo]);


  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-64 w-full rounded-lg mb-6" />
        <Skeleton className="h-16 w-full rounded-lg mb-6" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-72 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (error && !globalSiteInfo) { // Only show full page error if globalSiteInfo failed to load
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Erreur d'Accès</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.push('/')} className="mt-6">Retour à l'accueil</Button>
      </div>
    );
  }

  if (!globalSiteInfo) {
     return (
      <div className="container mx-auto py-10 px-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Établissement Introuvable</h2>
        <p className="text-muted-foreground">Les détails de cet établissement n'ont pas pu être chargés.</p>
      </div>
    );
  }
  
  const heroImageUrl = globalSiteInfo.reservationPageSettings?.heroImageUrl || `https://placehold.co/1200x350.png`;
  const heroImageAiHint = globalSiteInfo.reservationPageSettings?.heroImageAiHint || globalSiteInfo.nom.toLowerCase().split(' ').slice(0,2).join(' ') || "establishment banner";

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="relative h-56 md:h-72 w-full rounded-xl overflow-hidden shadow-xl">
          <NextImage
            src={heroImageUrl}
            alt={`Bienvenue à ${globalSiteInfo.nom}`}
            layout="fill"
            objectFit="cover"
            className="opacity-90"
            data-ai-hint={heroImageAiHint}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white drop-shadow-lg">
              {globalSiteInfo.nom}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mt-1 drop-shadow-sm">Trouvez votre hébergement ou table idéale.</p>
          </div>
        </div>

      <Card className="shadow-xl sticky top-24 z-40 bg-card/95 backdrop-blur-md border">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-wrap items-end gap-2">
            
            {showTypeSelector && (
              <div className="flex-grow min-w-[130px] space-y-1">
                <Label htmlFor="searchType" className="text-xs font-medium text-muted-foreground">Je cherche</Label>
                <Select value={searchType} onValueChange={(value: 'Chambre' | 'Table') => setSearchType(value)}>
                  <SelectTrigger id="searchType" className="h-11 text-sm bg-background">
                    <div className="flex items-center">
                       <LocationTypeIcon type={searchType} className="text-foreground" />
                       <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {(globalSiteInfo.reservationPageSettings?.enableRoomReservations ?? true) && <SelectItem value="Chambre"><BedDouble className="inline-block mr-2 h-4 w-4" />Chambre</SelectItem>}
                    {(globalSiteInfo.reservationPageSettings?.enableTableReservations ?? true) && <SelectItem value="Table"><UtensilsIcon className="inline-block mr-2 h-4 w-4" />Table</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex-grow min-w-[130px] space-y-1">
              <Label htmlFor="arrivalDate" className="text-xs font-medium text-muted-foreground">Arrivée</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="arrivalDate" variant="outline" className="w-full justify-start text-left font-normal h-11 text-sm bg-background">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {arrivalDate ? format(arrivalDate, 'dd/MM/yy', { locale: fr }) : <span>Choisir</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><ShadCalendar mode="single" selected={arrivalDate} onSelect={(date) => date && setArrivalDate(startOfDay(date))} initialFocus /></PopoverContent>
              </Popover>
            </div>
            
            {searchType === 'Chambre' && (
              <div className="flex-grow min-w-[130px] space-y-1">
                <Label htmlFor="departureDate" className="text-xs font-medium text-muted-foreground">Départ</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="departureDate"
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-11 text-sm bg-background"
                      disabled={!arrivalDate}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {departureDate ? format(departureDate, 'dd/MM/yy', { locale: fr }) : <span>Choisir</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <ShadCalendar
                      mode="single"
                      selected={departureDate}
                      onSelect={(date) => date && setDepartureDate(startOfDay(date))}
                      disabled={(date) => arrivalDate ? isBefore(date, addDays(arrivalDate,1)) : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="flex-grow min-w-[180px] space-y-1">
              <Label htmlFor="voyageursButton" className="text-xs font-medium text-muted-foreground">Voyageurs</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="voyageursButton" variant="outline" className="w-full justify-start text-left font-normal h-11 text-sm bg-background">
                     <div className="flex items-center min-w-0 flex-1">
                        <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {(() => {
                            const parts = [];
                            const displayTravelers = Math.max(1, totalTravelers); 
                            parts.push(`${displayTravelers} voyageur${displayTravelers > 1 ? 's' : ''}`);
                            if (numInfants > 0) parts.push(`${numInfants} bébé${numInfants > 1 ? 's' : ''}`);
                            if (searchType === 'Chambre' && numPets > 0) parts.push(`${numPets} animal${numPets > 1 ? 'ux' : ''}`);
                            return parts.join(', ');
                          })()}
                        </span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 shadow-xl border">
                  <div className="p-4 space-y-1 divide-y divide-border">
                    <GuestCounter label="Adultes" description="13 ans et plus" count={numAdults} onIncrement={() => setNumAdults(c => c + 1)} onDecrement={() => setNumAdults(c => Math.max(1, c - 1))} minCount={1}/>
                    <GuestCounter label="Enfants" description="De 2 à 12 ans" count={numChildren} onIncrement={() => setNumChildren(c => c + 1)} onDecrement={() => setNumChildren(c => Math.max(0, c - 1))} />
                    <GuestCounter label="Bébés" description="Moins de 2 ans" count={numInfants} onIncrement={() => setNumInfants(c => c + 1)} onDecrement={() => setNumInfants(c => Math.max(0, c - 1))} />
                    {searchType === 'Chambre' && <GuestCounter label="Animaux domestiques" count={numPets} onIncrement={() => setNumPets(c => c + 1)} onDecrement={() => setNumPets(c => Math.max(0, c - 1))} />}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-end gap-2 flex-shrink-0">
              {allHostTags.length > 0 && (
                <Button variant="outline" onClick={() => setShowTagFilters(!showTagFilters)} className="h-11 w-11 p-0" title="Filtrer par tags">
                  <FilterIcon className="h-5 w-5" />
                </Button>
              )}
              <Button 
                onClick={handleSearchAvailability} 
                disabled={
                    isSearching || 
                    !arrivalDate || 
                    (searchType === 'Chambre' && !departureDate) || 
                    (globalSiteInfo && (!globalSiteInfo.reservationPageSettings?.enableRoomReservations && !globalSiteInfo.reservationPageSettings?.enableTableReservations)) 
                } 
                className="h-11 px-4 md:px-6 bg-primary hover:bg-primary/90"
              >
                <Search className="h-5 w-5 md:mr-2" />
                <span className="hidden md:inline">Rechercher</span>
              </Button>
            </div>
          </div>

          {showTagFilters && allHostTags.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <Label className="text-sm font-medium flex items-center mb-1.5 text-muted-foreground"><TagIconLucide className="mr-2 h-4 w-4"/>Tags</Label>
              <Card className="p-2.5 bg-background shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-1.5 max-h-28 overflow-y-auto">
                  {allHostTags.map(tag => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox id={`tag-filter-${tag.id}`} checked={selectedTags.includes(tag.id)} onCheckedChange={(checked) => handleTagChange(tag.id, !!checked)} />
                      <Label htmlFor={`tag-filter-${tag.id}`} className="font-normal text-xs cursor-pointer">{tag.name}</Label>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {error && searchAttempted && (
         <div className="text-center py-6">
            <AlertTriangle className="mx-auto h-10 w-10 text-destructive mb-3" />
            <p className="text-destructive">{error}</p>
        </div>
      )}

      {searchAttempted && !isSearching && !error && (
        <div className="pt-8">
          <CardHeader className="px-0 pb-4">
            <CardTitle className="text-2xl font-semibold">
              {availableLocations.length > 0
                ? `${availableLocations.length} lieu(x) disponible(s)`
                : "Aucune disponibilité"}
            </CardTitle>
            <CardDescription>
              {availableLocations.length === 0 && "Essayez d'ajuster vos dates ou critères de recherche."}
            </CardDescription>
          </CardHeader>
          {availableLocations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableLocations.map(loc => (
                <Card key={loc.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden bg-card">
                  <div className="relative h-48 w-full">
                    <NextImage
                      src={(loc.imageUrls && loc.imageUrls[0]) || `https://placehold.co/400x300.png?text=${loc.nom.replace(/\s/g, "+")}`}
                      alt={`Image de ${loc.nom}`}
                      layout="fill"
                      objectFit="cover"
                      data-ai-hint={loc.imageAiHint || loc.nom.toLowerCase().split(' ').slice(0,2).join(' ')}
                    />
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg flex items-center"><LocationTypeIcon type={loc.type} className="text-primary"/>{loc.nom}</CardTitle>
                     {loc.capacity && <CardDescription className="text-xs text-muted-foreground">Capacité: {loc.capacity} personnes</CardDescription>}
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-grow space-y-2 text-sm">
                    {loc.description && <p className="text-muted-foreground text-xs line-clamp-3">{loc.description}</p>}
                    {loc.tagIds && loc.tagIds.length > 0 && (
                      <div className="flex items-start pt-1">
                        <TagIconLucide className="mr-2 h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {loc.tagIds.map(tagId => {
                            const tagName = allHostTags.find(t => t.id === tagId)?.name;
                            return tagName ? <Badge key={tagId} variant="secondary" className="text-xs">{tagName}</Badge> : null;
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 border-t">
                    <Button onClick={() => handleSelectLocation(loc)} className="w-full bg-primary hover:bg-primary/80">
                      Sélectionner
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
       {isSearching && (
         <div className="pt-12 text-center">
            <Search className="mx-auto h-12 w-12 text-primary animate-pulse mb-4" />
            <p className="text-lg text-muted-foreground">Recherche des disponibilités...</p>
        </div>
       )}
    </div>
  );
}

export default function PublicReservationPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p className="text-lg">Chargement de la page de réservation...</p></div>}>
      <PublicReservationPageContent />
    </Suspense>
  );
}

