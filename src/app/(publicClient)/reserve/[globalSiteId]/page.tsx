
"use client";

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getSiteById, getRoomsOrTables, getTags, getReservations as fetchAllReservationsForHost } from '@/lib/data';
import type { Site as GlobalSiteType, RoomOrTable, Tag, Reservation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ShadCalendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, AlertTriangle, Search, BedDouble, Utensils, Users, Tag as TagIconLucide, Building } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, isValid, isBefore, isEqual, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';

export default function PublicReservationPage() {
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

      const [tagsData, locationsData, reservationsData] = await Promise.all([
        getTags(siteInfo.hostId),
        getRoomsOrTables(siteInfo.hostId, globalSiteId), // Get locations specific to this global site
        fetchAllReservationsForHost(siteInfo.hostId) // Fetch all reservations for conflict checking
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
    // Auto-set departure date for tables when arrival date changes or type is table
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
    if (!arrivalDate || (!departureDate && searchType === 'Chambre')) {
      toast({ title: "Dates requises", description: "Veuillez sélectionner les dates d'arrivée et de départ.", variant: "destructive" });
      return;
    }
    if (searchType === 'Chambre' && departureDate && (isBefore(departureDate, arrivalDate) || isEqual(departureDate, arrivalDate))) {
        toast({ title: "Date de départ invalide", description: "La date de départ doit être après la date d'arrivée pour les chambres.", variant: "destructive" });
        return;
    }

    setIsSearching(true);
    setSearchAttempted(true);
    setAvailableLocations([]); // Clear previous results
    setError(null);

    try {
      const checkIn = startOfDay(arrivalDate);
      const checkOut = searchType === 'Table' ? endOfDay(arrivalDate) : (departureDate ? startOfDay(departureDate) : endOfDay(addDays(arrivalDate, 1)));


      const filtered = allReservableLocationsForSite.filter(loc => {
        if (loc.type !== searchType) return false;
        if (numPersons > 0 && loc.capacity && loc.capacity < numPersons) return false;
        if (selectedTags.length > 0 && !selectedTags.every(tagId => loc.tagIds?.includes(tagId))) return false;

        // Check for booking conflicts
        const isBooked = allReservations.some(res => {
          if (res.locationId !== loc.id) return false;
          try {
            const resArrival = startOfDay(parseISO(res.dateArrivee));
            const resDeparture = res.dateDepart ? startOfDay(parseISO(res.dateDepart)) : endOfDay(parseISO(res.dateArrivee)); // Tables are effectively single day
            
            // Conflict if: new period overlaps with existing period
            // (resArrival < checkOut) AND (resDeparture > checkIn)
            return resArrival < checkOut && resDeparture > checkIn;

          } catch (e) { return false; }
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
    // For now, just log. Later, this would navigate to a booking confirmation page.
    console.log("Selected location:", location);
    toast({ title: "Lieu Sélectionné", description: `${location.nom} - Prochaine étape : détails du client et confirmation.`});
    // Example: router.push(`/reserve/${globalSiteId}/confirm?locationId=${location.id}&arrival=${format(arrivalDate!, 'yyyy-MM-dd')}&departure=${format(departureDate!, 'yyyy-MM-dd')}&persons=${numPersons}`);
  };

  const LocationTypeIcon = ({ type }: { type: 'Chambre' | 'Table' }) => {
    if (type === 'Chambre') return <BedDouble className="h-5 w-5 mr-2 text-primary" />;
    if (type === 'Table') return <Utensils className="h-5 w-5 mr-2 text-green-600" />;
    return null;
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-12 w-2/3 mx-auto" />
        <Skeleton className="h-8 w-1/2 mx-auto mb-8" />
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </CardContent>
        </Card>
        <Card className="shadow-lg mt-8">
          <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
          <CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent>
        </Card>
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
  
  const heroImageUrl = globalSiteInfo.logoUrl || `https://placehold.co/1200x300.png`;
  const heroImageAiHint = globalSiteInfo.logoAiHint || globalSiteInfo.nom.toLowerCase().split(' ').slice(0,2).join(' ') || "establishment banner";


  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card className="shadow-xl overflow-hidden">
        <div className="relative h-48 md:h-64 w-full">
          <NextImage 
            src={heroImageUrl}
            alt={`Image de ${globalSiteInfo.nom}`}
            layout="fill"
            objectFit="cover"
            className="opacity-80"
            data-ai-hint={heroImageAiHint}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white shadow-md">
              Réservez à {globalSiteInfo.nom}
            </h1>
          </div>
        </div>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><Search className="mr-2 h-6 w-6 text-primary" />Vos Critères de Recherche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
            {/* Date Pickers */}
            <div className="space-y-1.5">
              <Label htmlFor="arrivalDate">Date d'arrivée</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="arrivalDate" variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {arrivalDate ? format(arrivalDate, 'PPP', { locale: fr }) : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><ShadCalendar mode="single" selected={arrivalDate} onSelect={setArrivalDate} initialFocus /></PopoverContent>
              </Popover>
            </div>
            
            {searchType === 'Chambre' && (
              <div className="space-y-1.5">
                <Label htmlFor="departureDate">Date de départ</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="departureDate" variant="outline" className="w-full justify-start text-left font-normal" disabled={!arrivalDate}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {departureDate ? format(departureDate, 'PPP', { locale: fr }) : <span>Choisir une date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <ShadCalendar 
                      mode="single" 
                      selected={departureDate} 
                      onSelect={setDepartureDate} 
                      disabled={(date) => arrivalDate ? isBefore(date, addDays(arrivalDate,1)) : false} // Departure must be after arrival
                      initialFocus 
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Type Search */}
            <div className="space-y-1.5">
              <Label htmlFor="searchType">Je cherche</Label>
              <Select value={searchType} onValueChange={(value: 'Chambre' | 'Table') => setSearchType(value)}>
                <SelectTrigger id="searchType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chambre"><BedDouble className="inline-block mr-2 h-4 w-4" />Chambre</SelectItem>
                  <SelectItem value="Table"><Utensils className="inline-block mr-2 h-4 w-4" />Table</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Number of Persons */}
            <div className="space-y-1.5">
              <Label htmlFor="numPersons">Nombre de personnes</Label>
              <Input id="numPersons" type="number" value={numPersons} onChange={(e) => setNumPersons(Math.max(1, parseInt(e.target.value) || 1))} min="1" />
            </div>
          </div>

          {/* Tags Filter */}
          {allHostTags.length > 0 && (
            <div className="space-y-2 pt-2">
              <Label className="text-md font-medium flex items-center"><TagIconLucide className="mr-2 h-5 w-5 text-primary"/>Filtrer par Tags (optionnel)</Label>
              <Card className="p-4 bg-muted/30">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 max-h-40 overflow-y-auto">
                  {allHostTags.map(tag => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox id={`tag-${tag.id}`} checked={selectedTags.includes(tag.id)} onCheckedChange={(checked) => handleTagChange(tag.id, !!checked)} />
                      <Label htmlFor={`tag-${tag.id}`} className="font-normal text-sm cursor-pointer">{tag.name}</Label>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
          <Button onClick={handleSearchAvailability} disabled={isSearching} className="w-full md:w-auto text-base py-3 px-6">
            <Search className="mr-2 h-5 w-5" />
            {isSearching ? 'Recherche en cours...' : 'Rechercher Disponibilités'}
          </Button>
        </CardContent>
      </Card>

      {searchAttempted && !isSearching && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Lieux Disponibles</CardTitle>
            <CardDescription>
              {availableLocations.length > 0 
                ? `Nous avons trouvé ${availableLocations.length} lieu(x) correspondant à vos critères.`
                : "Aucun lieu disponible pour les critères et dates sélectionnés."}
            </CardDescription>
          </CardHeader>
          {availableLocations.length > 0 && (
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {availableLocations.map(loc => (
                <Card key={loc.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center"><LocationTypeIcon type={loc.type}/>{loc.nom}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-1 text-sm">
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
                  <CardFooter className="p-4 border-t">
                    <Button onClick={() => handleSelectLocation(loc)} className="w-full bg-primary hover:bg-primary/80">
                      Sélectionner
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

    