
"use client";

import { useParams, useRouter } from 'next/navigation';
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
import { Calendar as CalendarIcon, AlertTriangle, Search, BedDouble, Utensils, Users, Tag as TagIconLucide, Building, Info, Image as ImageIcon, Filter } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, isValid, isBefore, isEqual, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function PublicReservationPageContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const globalSiteId = params.globalSiteId as string;

  const [globalSiteInfo, setGlobalSiteInfo] = useState<GlobalSiteType | null>(null);
  const [allHostTags, setAllHostTags] = useState<Tag[]>([]);
  const [allReservableLocationsForSite, setAllReservableLocationsForSite] = useState<RoomOrTable[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);

  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(new Date());
  const [departureDate, setDepartureDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [searchType, setSearchType] = useState<'Chambre' | 'Table'>('Chambre');
  const [numPersons, setNumPersons] = useState<number>(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagFilters, setShowTagFilters] = useState(false);

  const [availableLocations, setAvailableLocations] = useState<RoomOrTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);


  const fetchPageData = useCallback(async () => {
    if (!globalSiteId) {
      setError("Global Site ID is missing from the URL.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      console.log(`[PublicReservationPage] Fetching site info for ID: ${globalSiteId}`);
      const siteInfo = await getSiteById(globalSiteId);
      if (!siteInfo) {
        setError(`Establishment with ID ${globalSiteId} not found.`);
        setGlobalSiteInfo(null);
        setIsLoading(false);
        return;
      }
      setGlobalSiteInfo(siteInfo);
      console.log(`[PublicReservationPage] Site info found: ${siteInfo.nom}. Fetching related data for host: ${siteInfo.hostId}`);

      if (!siteInfo.hostId) {
        setError(`Host information is missing for establishment ${siteInfo.nom}. Cannot fetch locations or reservations.`);
        setIsLoading(false);
        return;
      }
      
      const [tagsData, locationsData, reservationsData] = await Promise.all([
        fetchHostTags(siteInfo.hostId),
        getRoomsOrTables(siteInfo.hostId, globalSiteId),
        fetchAllReservationsForHost(siteInfo.hostId)
      ]);

      setAllHostTags(tagsData);
      setAllReservableLocationsForSite(locationsData.filter(loc => loc.type === 'Chambre' || loc.type === 'Table'));
      setAllReservations(reservationsData);
      console.log(`[PublicReservationPage] Initial data loaded for ${siteInfo.nom}. Tags: ${tagsData.length}, Locations for site: ${locationsData.length}, All host reservations: ${reservationsData.length}`);
    } catch (e: any) {
      console.error("[PublicReservationPage] Error fetching page data:", e);
      setError("Failed to load establishment details or available options. " + e.message);
      setGlobalSiteInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [globalSiteId]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  useEffect(() => {
    if (searchType === 'Table' && arrivalDate) {
      if (!departureDate || !isEqual(startOfDay(arrivalDate), startOfDay(departureDate))) {
        setDepartureDate(arrivalDate);
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
      toast({ title: "Dates requises", description: "Veuillez sélectionner les dates d'arrivée et de départ.", variant: "destructive" });
      return;
    }
    if (searchType === 'Chambre' && departureDate && (isBefore(departureDate, arrivalDate) || isEqual(startOfDay(departureDate), startOfDay(arrivalDate)))) {
        toast({ title: "Date de départ invalide", description: "La date de départ doit être après la date d'arrivée pour les chambres.", variant: "destructive" });
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
        if (numPersons > 0 && loc.capacity && loc.capacity < numPersons) return false;
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
            console.warn("Error parsing reservation dates for conflict check", res, e);
            return true;
          }
        });
        return !isBooked;
      });

      console.log("[PublicReservationPage] Search results:", filtered);
      setAvailableLocations(filtered);
      if (filtered.length === 0) {
        toast({ title: "Aucune disponibilité", description: "Aucun lieu ne correspond à vos critères pour les dates sélectionnées.", variant: "default" });
      }
    } catch (e: any) {
        console.error("[PublicReservationPage] Error during search:", e);
        setError("Une erreur s'est produite lors de la recherche. " + e.message);
        toast({ title: "Erreur de recherche", description: "Impossible d'effectuer la recherche.", variant: "destructive" });
    } finally {
        setIsSearching(false);
    }
  };

  const handleSelectLocation = (location: RoomOrTable) => {
    console.log("Selected location, navigating to detail page:", location);
    const arrivalQueryParam = arrivalDate ? format(arrivalDate, 'yyyy-MM-dd') : '';
    const departureQueryParam = searchType === 'Table' ? arrivalQueryParam : (departureDate ? format(departureDate, 'yyyy-MM-dd') : '');
    
    router.push(`/reserve/${globalSiteId}/location/${location.id}?arrival=${arrivalQueryParam}&departure=${departureQueryParam}&persons=${numPersons}`);
  };

  const LocationTypeIcon = ({ type }: { type: 'Chambre' | 'Table' }) => {
    if (type === 'Chambre') return <BedDouble className="h-5 w-5 mr-1 text-muted-foreground" />;
    if (type === 'Table') return <Utensils className="h-5 w-5 mr-1 text-muted-foreground" />;
    return null;
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-64 w-full rounded-lg mb-6" /> {/* Hero Image Skeleton */}
        <Skeleton className="h-16 w-full rounded-lg mb-6" /> {/* Search Bar Skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-72 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (error) {
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white shadow-md">
              {globalSiteInfo.nom}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mt-1">Trouvez votre hébergement ou table idéale.</p>
          </div>
        </div>

      <Card className="shadow-xl sticky top-24 z-40 bg-card/95 backdrop-blur-md">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            
            <div className="space-y-1.5 lg:col-span-1">
              <Label htmlFor="arrivalDate" className="text-xs font-medium text-muted-foreground">Arrivée</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="arrivalDate" variant="outline" className="w-full justify-start text-left font-normal h-12 text-sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {arrivalDate ? format(arrivalDate, 'dd/MM/yy', { locale: fr }) : <span>Quand ?</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><ShadCalendar mode="single" selected={arrivalDate} onSelect={setArrivalDate} initialFocus /></PopoverContent>
              </Popover>
            </div>
            
            {searchType === 'Chambre' && (
              <div className="space-y-1.5 lg:col-span-1">
                <Label htmlFor="departureDate" className="text-xs font-medium text-muted-foreground">Départ</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="departureDate" variant="outline" className="w-full justify-start text-left font-normal h-12 text-sm" disabled={!arrivalDate}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {departureDate ? format(departureDate, 'dd/MM/yy', { locale: fr }) : <span>Quand ?</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <ShadCalendar
                      mode="single"
                      selected={departureDate}
                      onSelect={setDepartureDate}
                      disabled={(date) => arrivalDate ? isBefore(date, addDays(arrivalDate,1)) : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="space-y-1.5 lg:col-span-1">
              <Label htmlFor="searchType" className="text-xs font-medium text-muted-foreground">Type</Label>
              <Select value={searchType} onValueChange={(value: 'Chambre' | 'Table') => setSearchType(value)}>
                <SelectTrigger id="searchType" className="h-12 text-sm">
                  <div className="flex items-center">
                     <LocationTypeIcon type={searchType} />
                     <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chambre"><BedDouble className="inline-block mr-2 h-4 w-4" />Chambre</SelectItem>
                  <SelectItem value="Table"><Utensils className="inline-block mr-2 h-4 w-4" />Table</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 lg:col-span-1">
              <Label htmlFor="numPersons" className="text-xs font-medium text-muted-foreground">Voyageurs</Label>
              <Input id="numPersons" type="number" value={numPersons} onChange={(e) => setNumPersons(Math.max(1, parseInt(e.target.value) || 1))} min="1" className="h-12 text-sm" placeholder="Ajouter des..."/>
            </div>
            
            <div className="flex items-end gap-2 lg:col-span-1">
              {allHostTags.length > 0 && (
                <Button variant="outline" onClick={() => setShowTagFilters(!showTagFilters)} className="h-12 w-12 p-0 flex-shrink-0" title="Filtrer par tags">
                  <Filter className="h-5 w-5" />
                </Button>
              )}
              <Button onClick={handleSearchAvailability} disabled={isSearching} className="h-12 flex-grow bg-primary hover:bg-primary/90">
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {showTagFilters && allHostTags.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Label className="text-md font-medium flex items-center mb-2"><TagIconLucide className="mr-2 h-5 w-5 text-primary"/>Filtrer par Tags</Label>
              <Card className="p-3 bg-muted/20">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2 max-h-32 overflow-y-auto">
                  {allHostTags.map(tag => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox id={`tag-filter-${tag.id}`} checked={selectedTags.includes(tag.id)} onCheckedChange={(checked) => handleTagChange(tag.id, !!checked)} />
                      <Label htmlFor={`tag-filter-${tag.id}`} className="font-normal text-sm cursor-pointer">{tag.name}</Label>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {searchAttempted && !isSearching && (
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
                <Card key={loc.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden">
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
                    <CardTitle className="text-lg flex items-center"><LocationTypeIcon type={loc.type}/>{loc.nom}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-grow space-y-2 text-sm">
                    {loc.description && <p className="text-muted-foreground text-xs line-clamp-3">{loc.description}</p>}
                    <p className="flex items-center"><Users className="mr-2 h-4 w-4 text-muted-foreground" /> Capacité: {loc.capacity || 'N/A'} personnes</p>
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
                  <CardFooter className="p-4 border-t bg-muted/30">
                    <Button onClick={() => handleSelectLocation(loc)} className="w-full bg-primary hover:bg-primary/80 text-primary-foreground">
                      Sélectionner
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PublicReservationPage() {
  return (
    // Suspense is needed because PublicReservationPageContent uses useSearchParams
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p className="text-lg">Chargement de la page de réservation...</p></div>}>
      <PublicReservationPageContent />
    </Suspense>
  );
}

    