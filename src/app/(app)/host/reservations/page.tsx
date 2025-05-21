
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Calendar as CalendarIconLucide, 
  BedDouble, 
  PlusCircle, 
  Users as UsersIcon, 
  Dog, 
  FileText, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Filter as FilterIcon,
  Utensils as UtensilsIcon // Added UtensilsIcon
} from 'lucide-react';
import { 
  format, 
  parseISO, 
  isWithinInterval, 
  eachDayOfInterval, 
  addDays, 
  subDays, 
  startOfDay, 
  endOfDay, 
  isEqual, 
  isBefore, 
  isValid,
  differenceInDays,
  max,
  min,
  isSameDay
} from 'date-fns';
import { fr } from 'date-fns/locale'; 

import type { Reservation, RoomOrTable, Client, ReservationStatus } from '@/lib/types';
import { 
  getReservations as fetchReservations, 
  addReservation as addReservationToData, 
  updateReservation as updateReservationInData, 
  deleteReservation as deleteReservationInData, 
  getRoomsOrTables, // This will fetch both rooms and tables
  getClients 
} from '@/lib/data';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as ShadCalendar } from "@/components/ui/calendar"; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

const NO_CLIENT_SELECTED = "___NO_CLIENT_SELECTED___";
const DAYS_TO_DISPLAY = 7; 

const getStatusColorClass = (status?: ReservationStatus): string => {
  switch (status) {
    case 'pending': return 'bg-yellow-500/90 hover:bg-yellow-600/90 border-yellow-700';
    case 'confirmed': return 'bg-blue-500/90 hover:bg-blue-600/90 border-blue-700';
    case 'checked-in': return 'bg-green-500/90 hover:bg-green-600/90 border-green-700';
    case 'checked-out': return 'bg-gray-500/90 hover:bg-gray-600/90 border-gray-700';
    case 'cancelled': return 'bg-red-500/90 hover:bg-red-600/90 border-red-700';
    default: return 'bg-gray-400/90 hover:bg-gray-500/90 border-gray-600';
  }
};

const reservationStatuses: ReservationStatus[] = ["pending", "confirmed", "checked-in", "checked-out", "cancelled"];


export default function HostReservationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [reservableLocations, setReservableLocations] = useState<RoomOrTable[]>([]); // Will store both Rooms and Tables
  const [clients, setClients] = useState<Client[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  
  const [viewStartDate, setViewStartDate] = useState<Date>(startOfDay(new Date()));
  const [timelineDays, setTimelineDays] = useState<Date[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isDialogLoading, setIsDialogLoading] = useState(false);
  
  const [isAddOrEditDialogOpen, setIsAddOrEditDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  
  const [currentReservationData, setCurrentReservationData] = useState<Partial<Reservation & { _manualClientName?: string }>>({
    nombrePersonnes: 1, // Default to 1 person
    status: 'pending',
  });
  const [arrivalDateForDialog, setArrivalDateForDialog] = useState<Date | undefined>(undefined);
  const [departureDateForDialog, setDepartureDateForDialog] = useState<Date | undefined>(undefined);
  const [selectedLocationForDialog, setSelectedLocationForDialog] = useState<string | undefined>(undefined);
  const [availableLocationsForDialog, setAvailableLocationsForDialog] = useState<RoomOrTable[]>([]);


  // Filter states
  const [filterClientName, setFilterClientName] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | "all">("all");


  const fetchInitialData = useCallback(async (hostId: string) => {
    setIsLoading(true);
    try {
      const [allLocationsData, clientsData, reservationsData] = await Promise.all([
        getRoomsOrTables(hostId),
        getClients(hostId),
        fetchReservations(hostId)
      ]);

      const filteredAndSortedLocations = allLocationsData
        .filter(loc => loc.type === 'Chambre' || loc.type === 'Table') // Now include tables
        .sort((a, b) => {
            if (a.type === b.type) return a.nom.localeCompare(b.nom);
            return a.type === 'Chambre' ? -1 : 1; // Group rooms first, then tables
        });

      setReservableLocations(filteredAndSortedLocations);
      setClients(clientsData);
      setAllReservations(reservationsData);
    } catch (error) {
      console.error("Failed to load initial page data:", error);
      toast({ title: "Error loading page data", description: "Could not load locations, clients, or reservations.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && user?.hostId) {
      fetchInitialData(user.hostId);
    } else if (!authLoading && !user?.hostId) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router, fetchInitialData]);

  useEffect(() => {
    const days = [];
    for (let i = 0; i < DAYS_TO_DISPLAY; i++) {
      days.push(addDays(viewStartDate, i));
    }
    setTimelineDays(days);
  }, [viewStartDate]);

  // Effect to filter available rooms/tables for the dialog
  useEffect(() => {
    if (!arrivalDateForDialog || !departureDateForDialog || isBefore(startOfDay(departureDateForDialog), startOfDay(arrivalDateForDialog)) || isEqual(startOfDay(departureDateForDialog), startOfDay(arrivalDateForDialog))) {
      setAvailableLocationsForDialog(reservableLocations.filter(loc => 
          (!currentReservationData.nombrePersonnes || (loc.capacity && loc.capacity >= currentReservationData.nombrePersonnes))
      )); // Show all (filtered by capacity if people count is set) if dates are invalid
      return;
    }

    const checkIn = startOfDay(arrivalDateForDialog);
    const checkOut = startOfDay(departureDateForDialog); // Check availability up to, but not including, the checkout day for stay

    const available = reservableLocations.filter(loc => {
      // Filter by capacity first
      if (currentReservationData.nombrePersonnes && currentReservationData.nombrePersonnes > 0) {
        if (!loc.capacity || loc.capacity < currentReservationData.nombrePersonnes) {
          return false;
        }
      }

      // Then check for date conflicts
      const isLocationBooked = allReservations.some(res => {
        if (res.locationId !== loc.id) return false;
        if (editingReservation && res.id === editingReservation.id) return false; // Exclude self if editing

        try {
            const existingArrival = startOfDay(parseISO(res.dateArrivee));
            const existingDeparture = startOfDay(parseISO(res.dateDepart));
            // Conflict if: (new_checkIn < existing_checkOut) AND (new_checkOut > existing_checkIn)
            return checkIn < existingDeparture && checkOut > existingArrival;
        } catch (e) { return false; }
      });
      return !isLocationBooked;
    });
    setAvailableLocationsForDialog(available);

    // If currently selected room/table is no longer available, reset it
    if (selectedLocationForDialog && !available.some(loc => loc.id === selectedLocationForDialog)) {
        setSelectedLocationForDialog(available.length > 0 ? available[0].id : undefined);
    } else if (!selectedLocationForDialog && available.length > 0) {
        // If no location was selected, and now there are available ones, select the first one
        // This is optional, could also leave it unselected.
        // setSelectedLocationForDialog(available[0].id);
    }

  }, [arrivalDateForDialog, departureDateForDialog, currentReservationData.nombrePersonnes, reservableLocations, allReservations, editingReservation, selectedLocationForDialog]);


  const filteredReservationsForTimeline = useMemo(() => {
    return allReservations.filter(res => {
      const clientNameMatch = filterClientName === "" || (res.clientName && res.clientName.toLowerCase().includes(filterClientName.toLowerCase()));
      const statusMatch = filterStatus === "all" || res.status === filterStatus;
      return clientNameMatch && statusMatch;
    });
  }, [allReservations, filterClientName, filterStatus]);
  
  const handleDayCellClick = (locationId: string, date: Date) => {
    const resOnThisDay = filteredReservationsForTimeline.find(r => 
        r.locationId === locationId &&
        isValid(parseISO(r.dateArrivee)) && isValid(parseISO(r.dateDepart)) &&
        isWithinInterval(date, {start: startOfDay(parseISO(r.dateArrivee)), end: startOfDay(subDays(parseISO(r.dateDepart),1))})
    );
    if (resOnThisDay) {
        openEditReservationDialog(resOnThisDay);
    } else {
        openAddReservationDialog(locationId, date);
    }
  };
  
  const openAddReservationDialog = (locationId?: string, date?: Date) => {
    setEditingReservation(null);
    const initialLocationId = locationId || (availableLocationsForDialog.length > 0 ? availableLocationsForDialog[0].id : undefined);
    setSelectedLocationForDialog(initialLocationId);
    setCurrentReservationData({ 
        locationId: initialLocationId, 
        nombrePersonnes: 1, 
        animauxDomestiques: false, 
        status: 'pending',
        _manualClientName: "",
        clientId: NO_CLIENT_SELECTED,
    });
    setArrivalDateForDialog(date ? startOfDay(date) : undefined);
    setDepartureDateForDialog(date ? startOfDay(addDays(date, 1)) : undefined);
    setIsAddOrEditDialogOpen(true);
  };

  const openEditReservationDialog = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setSelectedLocationForDialog(reservation.locationId); // Pre-select the room of the reservation being edited
    setCurrentReservationData({
        ...reservation, 
        _manualClientName: reservation.clientId ? "" : reservation.clientName || "",
        clientId: reservation.clientId || NO_CLIENT_SELECTED,
    });
    try {
        setArrivalDateForDialog(reservation.dateArrivee ? parseISO(reservation.dateArrivee) : undefined);
        setDepartureDateForDialog(reservation.dateDepart ? parseISO(reservation.dateDepart) : undefined);
    } catch (e) {
        setArrivalDateForDialog(undefined); setDepartureDateForDialog(undefined);
        toast({title: "Date Error", description: "Could not parse reservation dates.", variant:"destructive"});
    }
    setIsAddOrEditDialogOpen(true);
  };

  const handleDialogInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setCurrentReservationData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                 name === 'nombrePersonnes' ? (parseInt(value) || 1) : value 
    }));
  };

  const handleClientSelectionForDialog = (value: string) => {
    setCurrentReservationData(prev => ({
        ...prev,
        clientId: value,
        _manualClientName: value !== NO_CLIENT_SELECTED ? "" : prev._manualClientName
    }));
  };
  
  const handleLocationSelectionForDialog = (value: string) => {
    setSelectedLocationForDialog(value);
    setCurrentReservationData(prev => ({ ...prev, locationId: value }));
  };


  const handleSaveReservation = async () => {
    if (!user?.hostId || !selectedLocationForDialog || !arrivalDateForDialog) {
        toast({ title: "Missing Information", description: "Location and arrival date are required.", variant: "destructive" });
        return;
    }
    if (!departureDateForDialog || isBefore(startOfDay(departureDateForDialog), startOfDay(arrivalDateForDialog)) || isEqual(startOfDay(departureDateForDialog), startOfDay(arrivalDateForDialog))) {
        toast({ title: "Invalid Departure Date", description: "Departure date must be after arrival date.", variant: "destructive" });
        return;
    }
    if (!currentReservationData.nombrePersonnes || currentReservationData.nombrePersonnes <= 0) {
        toast({ title: "Invalid Guest Count", description: "Number of persons must be at least 1.", variant: "destructive" });
        return;
    }

    let clientNameToSave = currentReservationData._manualClientName?.trim() || "";
    let clientIdToSave = currentReservationData.clientId === NO_CLIENT_SELECTED ? undefined : currentReservationData.clientId;

    if(!clientIdToSave && !clientNameToSave){
        toast({ title: "Client Name Required", description: "Please select or enter a client name.", variant: "destructive"});
        return;
    }
    if (clientIdToSave) {
        const clientObj = clients.find(c => c.id === clientIdToSave);
        clientNameToSave = clientObj?.nom || "Unknown Registered Client";
    }


    const conflictingReservation = allReservations.find(res => {
        if (res.locationId !== selectedLocationForDialog) return false; 
        if (editingReservation && res.id === editingReservation.id) return false; 
        try {
            const existingArrival = startOfDay(parseISO(res.dateArrivee));
            const existingDeparture = startOfDay(parseISO(res.dateDepart)); 
            const newArrival = startOfDay(arrivalDateForDialog);
            const newDeparture = startOfDay(departureDateForDialog);
            return (newArrival < existingDeparture && newDeparture > existingArrival);
        } catch (e) { return false; }
    });

    if (conflictingReservation) {
        toast({ title: "Double Booking Alert", description: `This location is already booked for some of the selected dates (Reservation for: ${conflictingReservation.clientName}). Please adjust dates.`, variant: "destructive", duration: 7000 });
        return;
    }

    setIsDialogLoading(true);
    const reservationPayload: Omit<Reservation, 'id'> = {
        hostId: user.hostId,
        locationId: selectedLocationForDialog!,
        clientName: clientNameToSave,
        clientId: clientIdToSave,
        dateArrivee: format(arrivalDateForDialog, 'yyyy-MM-dd'),
        dateDepart: format(departureDateForDialog, 'yyyy-MM-dd'),
        nombrePersonnes: currentReservationData.nombrePersonnes || 1,
        animauxDomestiques: currentReservationData.animauxDomestiques || false,
        notes: currentReservationData.notes || '',
        status: currentReservationData.status || 'pending',
    };

    try {
      if (editingReservation) {
        await updateReservationInData(editingReservation.id, reservationPayload);
        toast({ title: "Reservation Updated" });
      } else {
        await addReservationToData(reservationPayload);
        toast({ title: "Reservation Created" });
      }
      if(user.hostId) fetchInitialData(user.hostId); 
    } catch (error) {
      console.error("Failed to save reservation:", error);
      toast({ title: "Error Saving Reservation", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsDialogLoading(false);
      setIsAddOrEditDialogOpen(false);
    }
  };
  
  const handleDeleteReservation = async (reservationId: string) => {
    if(!user?.hostId || !window.confirm("Are you sure you want to delete this reservation?")) return;
    setIsDialogLoading(true);
    try {
        await deleteReservationInData(reservationId);
        toast({title: "Reservation Deleted", variant: "destructive"});
        if(user.hostId) fetchInitialData(user.hostId);
        setIsAddOrEditDialogOpen(false);
    } catch (error) {
        console.error("Failed to delete reservation:", error);
        toast({ title: "Error Deleting Reservation", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive"});
    } finally {
        setIsDialogLoading(false);
    }
  };
  
  const navigateTimeline = (direction: 'prev' | 'next') => {
    setViewStartDate(prevDate => {
      return direction === 'prev' ? subDays(prevDate, DAYS_TO_DISPLAY) : addDays(prevDate, DAYS_TO_DISPLAY);
    });
  };
  
  const resetFiltersAndDate = () => {
    setFilterClientName("");
    setFilterStatus("all");
    setViewStartDate(startOfDay(new Date())); 
  };

  const getLocationIcon = (type: RoomOrTable['type']) => {
    if (type === 'Chambre') return <BedDouble className="h-4 w-4 mr-2 text-primary shrink-0" />;
    if (type === 'Table') return <UtensilsIcon className="h-4 w-4 mr-2 text-green-500 shrink-0" />;
    return null;
  };


  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-center mb-4"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-10 w-32" /></div>
        <Skeleton className="h-24 w-full mb-4" /> {/* Filter section skeleton */}
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <Card className="shadow-xl mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-bold">Reservations Timeline</CardTitle>
              {timelineDays.length > 0 && (
                <CardDescription>
                  {format(timelineDays[0], 'd MMM yyyy', { locale: fr })} - {format(timelineDays[timelineDays.length - 1], 'd MMM yyyy', { locale: fr })}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button onClick={() => openAddReservationDialog()} disabled={reservableLocations.length === 0} className="flex-1 sm:flex-none">
                <PlusCircle className="mr-2 h-5 w-5" /> Add Reservation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end mb-6 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-1.5">
              <Label htmlFor="viewStartDatePicker">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="viewStartDatePicker" variant="outline" className="w-full justify-start text-left font-normal bg-card">
                    <CalendarIconLucide className="mr-2 h-4 w-4" />
                    {format(viewStartDate, 'PPP', { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <ShadCalendar mode="single" selected={viewStartDate} onSelect={(date) => date && setViewStartDate(startOfDay(date))} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={() => setViewStartDate(startOfDay(new Date()))} className="flex-1">Today</Button>
              <Button variant="outline" size="icon" onClick={() => navigateTimeline('prev')}><ChevronLeft/></Button>
              <Button variant="outline" size="icon" onClick={() => navigateTimeline('next')}><ChevronRight/></Button>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filterClientName">Client Name</Label>
              <Input id="filterClientName" placeholder="Search client..." value={filterClientName} onChange={(e) => setFilterClientName(e.target.value)} className="bg-card"/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filterStatus">Status</Label>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as ReservationStatus | "all")}>
                <SelectTrigger id="filterStatus" className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {reservationStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-start-4 flex items-end">
                 <Button variant="outline" onClick={resetFiltersAndDate} className="w-full">Reset Filters</Button>
            </div>
          </div>
        
          {reservableLocations.length === 0 ? (
             <p className="text-muted-foreground text-center py-10">No rooms or tables configured. Please add reservable locations in 'My Locations'.</p>
          ) : (
            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="grid min-w-[1200px]" 
                 style={{ gridTemplateColumns: `minmax(200px, 1.5fr) repeat(${DAYS_TO_DISPLAY}, minmax(130px, 1fr))` }}>
                {/* Header Row */}
                <div className="p-2 border-r border-b border-border font-semibold bg-muted sticky left-0 z-20 text-sm flex items-center">
                    <FilterIcon className="h-4 w-4 mr-2 text-primary"/> Location
                </div>
                {timelineDays.map(day => (
                  <div key={day.toISOString()} className="p-2 text-center border-r border-b border-border bg-muted">
                    <div className="text-xs font-semibold uppercase text-muted-foreground">{format(day, 'EEE', { locale: fr })}</div>
                    <div className="text-lg font-bold">{format(day, 'd')}</div>
                  </div>
                ))}

                {/* Location Rows */}
                {reservableLocations.map((location) => {
                  return (
                    <React.Fragment key={location.id}>
                      <div className="p-2 border-r border-b border-border font-medium sticky left-0 bg-card z-10 flex items-center text-sm">
                        {getLocationIcon(location.type)}
                        <span className="truncate" title={location.nom}>{location.nom}</span>
                        {location.capacity && <span className="ml-auto text-xs text-muted-foreground">({location.capacity}p)</span>}
                      </div>
                      {timelineDays.map((day) => {
                        const dayStart = startOfDay(day);
                        const reservationsStartingThisCell = filteredReservationsForTimeline.filter(res => 
                            res.locationId === location.id &&
                            isValid(parseISO(res.dateArrivee)) &&
                            isSameDay(dayStart, parseISO(res.dateArrivee))
                        );
                        
                        let isOccupiedByOngoing = false;
                        if (reservationsStartingThisCell.length === 0) {
                           isOccupiedByOngoing = filteredReservationsForTimeline.some(res => 
                                res.locationId === location.id &&
                                isValid(parseISO(res.dateArrivee)) && isValid(parseISO(res.dateDepart)) &&
                                isWithinInterval(dayStart, { 
                                  start: startOfDay(parseISO(res.dateArrivee)), 
                                  end: startOfDay(subDays(parseISO(res.dateDepart),1)) 
                                }) && !isSameDay(parseISO(res.dateArrivee), dayStart)
                            );
                        }

                        return (
                          <div 
                            key={`${location.id}-${day.toISOString()}`} 
                            className="p-0.5 border-r border-b border-border min-h-[70px] relative cursor-pointer hover:bg-secondary/30 transition-colors flex flex-col group"
                            style={{ gridColumn: `${timelineDays.findIndex(d => isEqual(d, dayStart)) + 2}` }} // +2 because first col is location name
                            onClick={() => handleDayCellClick(location.id, dayStart)}
                          >
                            {reservationsStartingThisCell.map(res => {
                                let resArrival, resDeparture;
                                try {
                                    resArrival = startOfDay(parseISO(res.dateArrivee));
                                    resDeparture = startOfDay(parseISO(res.dateDepart));
                                } catch (e) { console.error("Date parsing error for res block:", e, res); return null; }
                                
                                // Calculate duration respecting the view window
                                const visibleStart = max([resArrival, startOfDay(timelineDays[0])]);
                                const visibleEnd = min([resDeparture, startOfDay(addDays(timelineDays[timelineDays.length - 1], 1))]);
                                let displayDuration = differenceInDays(visibleEnd, visibleStart);
                                if (displayDuration <=0) displayDuration = 1; // Minimum 1 day block
                                
                                // Ensure block doesn't extend beyond visible timeline days from its start
                                const startIndexInTimeline = timelineDays.findIndex(d => isSameDay(d, resArrival));
                                if(startIndexInTimeline === -1 && resArrival < timelineDays[0]) { // Starts before view
                                  // This case is handled by isOccupiedByOngoing or by drawing a partial block if needed
                                } else if (startIndexInTimeline !== -1) {
                                   const remainingDaysInView = DAYS_TO_DISPLAY - startIndexInTimeline;
                                   displayDuration = Math.min(displayDuration, remainingDaysInView);
                                }


                                return (
                                    <div
                                        key={res.id}
                                        className={`m-0.5 p-1.5 rounded text-white text-[10px] shadow-md overflow-hidden cursor-grab border ${getStatusColorClass(res.status)}`}
                                        style={{ 
                                            width: `calc(${displayDuration * 100}% - ${displayDuration > 1 ? (displayDuration-1)*2 : 0}px)`, 
                                            position: 'absolute', 
                                            top: '2px', left: '2px', bottom: '2px', 
                                            zIndex: 10, 
                                        }}
                                        onClick={(e) => { e.stopPropagation(); openEditReservationDialog(res); }}
                                        title={`${res.clientName}\nStatut: ${res.status}\n${format(resArrival, 'PP', {locale:fr})} - ${format(resDeparture, 'PP', {locale:fr})}`}
                                    >
                                        <p className="font-semibold truncate leading-tight">{res.clientName}</p>
                                        <p className="opacity-90 capitalize text-[9px]">{res.status}</p>
                                    </div>
                                );
                            })}
                             {reservationsStartingThisCell.length === 0 && isOccupiedByOngoing && (
                                <div className="h-full w-full bg-slate-200/50 dark:bg-slate-700/50 opacity-70 pointer-events-none rounded-sm"></div>
                             )}
                              <Button variant="ghost" size="icon" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 z-20" onClick={(e) => { e.stopPropagation(); openAddReservationDialog(location.id, dayStart); }}>
                                <PlusCircle className="w-4 h-4 text-muted-foreground" />
                              </Button>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOrEditDialogOpen} onOpenChange={(open) => { if(!isDialogLoading) setIsAddOrEditDialogOpen(open);}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingReservation ? 'Edit Reservation' : 'Add New Reservation'}</DialogTitle>
            <DialogDescription>
                Manage reservation details for {reservableLocations.find(loc => loc.id === (editingReservation?.locationId || selectedLocationForDialog))?.nom || "selected location"}.
            </DialogDescription>
          </DialogHeader>
          {isDialogLoading ? <Skeleton className="h-96 w-full" /> : (
          <ScrollArea className="max-h-[70vh] pr-4 -mr-2"><div className="grid gap-4 py-4 ">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label htmlFor="dateArriveeDialog">Arrival Date*</Label>
                    <Popover><PopoverTrigger asChild><Button variant="outline" className={`w-full justify-start text-left font-normal ${!arrivalDateForDialog && "text-muted-foreground"}`}><CalendarIconLucide className="mr-2 h-4 w-4" />{arrivalDateForDialog ? format(arrivalDateForDialog, 'PPP', {locale: fr}) : <span>Pick arrival</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><ShadCalendar mode="single" selected={arrivalDateForDialog} onSelect={setArrivalDateForDialog} initialFocus /></PopoverContent></Popover>
                </div>
                <div className="space-y-1.5"><Label htmlFor="dateDepartDialog">Departure Date*</Label>
                    <Popover><PopoverTrigger asChild><Button variant="outline" className={`w-full justify-start text-left font-normal ${!departureDateForDialog && "text-muted-foreground"}`} disabled={!arrivalDateForDialog}><CalendarIconLucide className="mr-2 h-4 w-4" />{departureDateForDialog ? format(departureDateForDialog, 'PPP', {locale: fr}) : <span>Pick departure</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><ShadCalendar mode="single" selected={departureDateForDialog} onSelect={setDepartureDateForDialog} disabled={(date) => arrivalDateForDialog ? isBefore(date, addDays(arrivalDateForDialog,0)) || isEqual(date, arrivalDateForDialog) : false} initialFocus /></PopoverContent></Popover>
                </div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="nombrePersonnesDialog"><UsersIcon className="inline mr-1 h-4 w-4" />Number of Persons*</Label><Input id="nombrePersonnesDialog" name="nombrePersonnes" type="number" value={currentReservationData.nombrePersonnes || 1} onChange={handleDialogInputChange} min="1" /></div>
            
            <div className="space-y-1.5">
              <Label htmlFor="locationIdDialog">Room/Table*</Label>
              <Select 
                value={selectedLocationForDialog || ""} 
                onValueChange={handleLocationSelectionForDialog} 
                disabled={availableLocationsForDialog.length === 0 && !editingReservation }
              >
                <SelectTrigger id="locationIdDialog">
                    <SelectValue placeholder={availableLocationsForDialog.length > 0 ? "Select a room/table" : "No locations available for criteria"} />
                </SelectTrigger>
                <SelectContent>
                  {availableLocationsForDialog.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.nom} ({loc.type === 'Chambre' ? 'Room' : 'Table'} - Cap: {loc.capacity || 'N/A'})</SelectItem>)}
                  {availableLocationsForDialog.length === 0 && !editingReservation && <SelectItem value="no_available_placeholder" disabled>No rooms/tables match criteria</SelectItem>}
                  {editingReservation && !availableLocationsForDialog.some(l => l.id === editingReservation.locationId) && 
                    <SelectItem value={editingReservation.locationId} disabled>
                        {reservableLocations.find(l => l.id === editingReservation.locationId)?.nom} (Currently selected, may conflict)
                    </SelectItem>
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="clientIdDialog">Registered Client (Optional)</Label>
                <Select value={currentReservationData.clientId || NO_CLIENT_SELECTED} onValueChange={handleClientSelectionForDialog} disabled={clients.length === 0}>
                    <SelectTrigger id="clientIdDialog"><SelectValue placeholder="Select registered client" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CLIENT_SELECTED}>None (Enter name below)</SelectItem>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nom} ({c.email || c.telephone || 'No contact'})</SelectItem>)}
                      {clients.length === 0 && <SelectItem value="no_clients_placeholder_disabled" disabled>No clients registered</SelectItem>}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="manualClientNameDialog">Or Enter Client Name*</Label>
                <Input id="manualClientNameDialog" name="_manualClientName" value={currentReservationData._manualClientName || ''} onChange={handleDialogInputChange} disabled={currentReservationData.clientId !== NO_CLIENT_SELECTED} placeholder="e.g., John Doe"/>
            </div>
            
            <div className="flex items-center space-x-2"><Checkbox id="animauxDomestiquesDialog" name="animauxDomestiques" checked={currentReservationData.animauxDomestiques || false} onCheckedChange={(checked) => setCurrentReservationData(prev => ({...prev, animauxDomestiques: !!checked}))} /><Label htmlFor="animauxDomestiquesDialog" className="font-normal"><Dog className="inline mr-1 h-4 w-4" />Pets Allowed</Label></div>
            <div className="space-y-1.5"><Label htmlFor="statusDialog">Status</Label>
                <Select value={currentReservationData.status || 'pending'} onValueChange={(val) => setCurrentReservationData(prev => ({...prev, status: val as ReservationStatus}))}><SelectTrigger id="statusDialog"><SelectValue /></SelectTrigger><SelectContent>{reservationStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="notesDialog"><FileText className="inline mr-1 h-4 w-4" />Notes</Label><Textarea id="notesDialog" name="notes" value={currentReservationData.notes || ''} onChange={handleDialogInputChange} placeholder="e.g., Late check-in, specific requests..." /></div>
          </div></ScrollArea>)}
          <DialogFooter className="mt-4 pt-4 border-t">
            {editingReservation && (<Button variant="destructive" onClick={() => handleDeleteReservation(editingReservation.id)} disabled={isDialogLoading} className="mr-auto"><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>)}
            <Button variant="outline" onClick={() => setIsAddOrEditDialogOpen(false)} disabled={isDialogLoading}>Cancel</Button>
            <Button 
              onClick={handleSaveReservation} 
              disabled={isDialogLoading || !selectedLocationForDialog || (!currentReservationData._manualClientName?.trim() && currentReservationData.clientId === NO_CLIENT_SELECTED) || !arrivalDateForDialog || !departureDateForDialog}
            >
              {isDialogLoading ? "Saving..." : (editingReservation ? 'Save Changes' : 'Create Reservation')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

