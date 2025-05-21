
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarLucideIcon, BedDouble, PlusCircle, Users, Dog, FileText, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, isWithinInterval, eachDayOfInterval, addDays, subDays, startOfDay, endOfDay, isEqual, isBefore, isValid } from 'date-fns';

import type { Reservation, RoomOrTable, Client, ReservationStatus } from '@/lib/types';
import { getReservations as fetchReservations, addReservation as addReservationToData, updateReservation as updateReservationInData, deleteReservation as deleteReservationInData, getRoomsOrTables, getClients } from '@/lib/data';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { Calendar } from "@/components/ui/calendar"; // Still needed for date pickers in dialog
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

export default function HostReservationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [rooms, setRooms] = useState<RoomOrTable[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [allReservationsForRoom, setAllReservationsForRoom] = useState<Reservation[]>([]);
  
  const [viewStartDate, setViewStartDate] = useState<Date>(startOfDay(new Date()));
  const [currentTimelineDays, setCurrentTimelineDays] = useState<Date[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isDialogLoading, setIsDialogLoading] = useState(false);
  const [isReservationsLoading, setIsReservationsLoading] = useState(false);
  
  const [isAddOrEditDialogOpen, setIsAddOrEditDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [currentReservationData, setCurrentReservationData] = useState<Partial<Reservation>>({});
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(undefined);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(undefined);
  const [selectedClientForDialog, setSelectedClientForDialog] = useState<string>(NO_CLIENT_SELECTED);
  const [manualClientNameForDialog, setManualClientNameForDialog] = useState<string>("");

  const fetchPageData = useCallback(async (hostId: string) => {
    setIsLoading(true);
    try {
      const [roomsData, clientsData] = await Promise.all([
        getRoomsOrTables(hostId).then(r => r.filter(loc => loc.type === 'Chambre')),
        getClients(hostId)
      ]);
      setRooms(roomsData);
      setClients(clientsData);
      if (roomsData.length > 0 && !selectedRoomId) {
        setSelectedRoomId(roomsData[0].id);
      }
    } catch (error) {
      console.error("Failed to load initial page data:", error);
      toast({ title: "Error loading page data", description: "Could not load rooms or clients.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, selectedRoomId]);

  const fetchRoomReservations = useCallback(async (hostId: string, roomId: string) => {
    if (!roomId) {
        setAllReservationsForRoom([]);
        return;
    }
    setIsReservationsLoading(true);
    try {
      // Fetch a wider range, e.g., 3 months, to minimize re-fetches during navigation,
      // or fetch dynamically based on viewStartDate. For now, fetching all for simplicity of mock.
      const reservationsData = await fetchReservations(hostId, { locationId: roomId });
      setAllReservationsForRoom(reservationsData);
    } catch (error) {
      console.error(`Failed to load reservations for room ${roomId}:`, error);
      toast({ title: "Error loading reservations", variant: "destructive" });
      setAllReservationsForRoom([]);
    } finally {
        setIsReservationsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && user?.hostId) {
      fetchPageData(user.hostId);
    } else if (!authLoading && !user?.hostId) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router, fetchPageData]);

  useEffect(() => {
    if (user?.hostId && selectedRoomId) {
      fetchRoomReservations(user.hostId, selectedRoomId);
    } else if (!selectedRoomId) {
      setAllReservationsForRoom([]);
    }
  }, [user?.hostId, selectedRoomId, fetchRoomReservations]);

  useEffect(() => {
    const days = [];
    for (let i = 0; i < DAYS_TO_DISPLAY; i++) {
      days.push(addDays(viewStartDate, i));
    }
    setCurrentTimelineDays(days);
  }, [viewStartDate]);

  const getReservationsForDay = (day: Date, reservations: Reservation[]): Reservation[] => {
    return reservations.filter(res => {
      const arrival = startOfDay(parseISO(res.dateArrivee));
      const departure = endOfDay(parseISO(res.dateDepart)); // Use end of day for departure to include the last day
      return isValid(arrival) && isValid(departure) && isWithinInterval(day, { start: arrival, end: departure });
    });
  };
  
  const handleDayCellClick = (day: Date) => {
    if (!selectedRoomId) return;
    const reservationsOnDay = getReservationsForDay(day, allReservationsForRoom);

    if (reservationsOnDay.length > 0) {
      // For simplicity, open edit for the first reservation on that day
      // A more complex UI could show a list or allow choosing which to edit
      const resToEdit = reservationsOnDay[0]; 
      openEditReservationDialog(resToEdit);
    } else {
      openAddReservationDialog(day);
    }
  };
  
  const openAddReservationDialog = (defaultArrivalDate?: Date) => {
    if (!selectedRoomId && rooms.length > 0) {
        toast({title: "Select a Room", description: "Please select a room first to add a new reservation.", variant: "default"});
        return;
    }
    if (rooms.length === 0) {
        toast({title: "No Rooms Available", description: "Please create rooms in 'My Locations' before adding reservations.", variant: "destructive"});
        return;
    }
    setEditingReservation(null);
    setCurrentReservationData({ locationId: selectedRoomId || undefined, nombrePersonnes: 1, animauxDomestiques: false, status: 'pending' });
    setArrivalDate(defaultArrivalDate || new Date());
    setDepartureDate(defaultArrivalDate ? addDays(defaultArrivalDate, 1) : addDays(new Date(), 1));
    setSelectedClientForDialog(NO_CLIENT_SELECTED);
    setManualClientNameForDialog("");
    setIsAddOrEditDialogOpen(true);
  };

  const openEditReservationDialog = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setCurrentReservationData({...reservation});
    setArrivalDate(parseISO(reservation.dateArrivee));
    setDepartureDate(parseISO(reservation.dateDepart));
    setSelectedClientForDialog(reservation.clientId || NO_CLIENT_SELECTED);
    setManualClientNameForDialog(reservation.clientId ? "" : reservation.clientName);
    setIsAddOrEditDialogOpen(true);
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        setCurrentReservationData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === 'number') {
        setCurrentReservationData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
        setCurrentReservationData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleClientSelectionForDialog = (value: string) => {
    setSelectedClientForDialog(value);
    if (value !== NO_CLIENT_SELECTED) {
      setManualClientNameForDialog("");
    }
  };

  const handleSaveReservation = async () => {
    if (!user?.hostId || !currentReservationData.locationId || !arrivalDate) {
        toast({ title: "Missing Information", description: "Room and arrival date are required.", variant: "destructive" });
        return;
    }
    if (!departureDate || isBefore(departureDate, arrivalDate) || isEqual(departureDate, arrivalDate)) {
        toast({ title: "Invalid Departure Date", description: "Departure date must be after arrival date, and not the same day.", variant: "destructive" });
        return;
    }
    let clientNameToSave = manualClientNameForDialog.trim();
    let clientIdToSave = undefined;
    if(selectedClientForDialog !== NO_CLIENT_SELECTED){
        const clientObj = clients.find(c => c.id === selectedClientForDialog);
        clientNameToSave = clientObj?.nom || "Unknown Client";
        clientIdToSave = clientObj?.id;
    }
    if(!clientNameToSave){
        toast({ title: "Client Name Required", description: "Please select or enter a client name.", variant: "destructive"});
        return;
    }

    const conflictingReservation = allReservationsForRoom.find(res => {
        if (editingReservation && res.id === editingReservation.id) return false; 
        const existingArrival = parseISO(res.dateArrivee);
        const existingDeparture = parseISO(res.dateDepart);
        // Check for overlap: (StartA < EndB) and (EndA > StartB)
        return (arrivalDate < existingDeparture && departureDate > existingArrival);
    });

    if (conflictingReservation) {
        toast({ title: "Double Booking Alert", description: `This room is already booked for the selected dates (Reservation ID: ${conflictingReservation.id.slice(-5)} for ${conflictingReservation.clientName}).`, variant: "destructive", duration: 5000 });
        return;
    }

    setIsDialogLoading(true);
    const reservationPayload: Omit<Reservation, 'id'> = {
        hostId: user.hostId,
        locationId: currentReservationData.locationId!,
        clientName: clientNameToSave,
        clientId: clientIdToSave,
        dateArrivee: format(arrivalDate, 'yyyy-MM-dd'),
        dateDepart: format(departureDate, 'yyyy-MM-dd'),
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
      if(selectedRoomId) fetchRoomReservations(user.hostId, selectedRoomId);
    } catch (error) {
      console.error("Failed to save reservation:", error);
      toast({ title: "Error Saving Reservation", variant: "destructive" });
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
        if(selectedRoomId) fetchRoomReservations(user.hostId, selectedRoomId);
        setIsAddOrEditDialogOpen(false);
    } catch (error) {
        console.error("Failed to delete reservation:", error);
        toast({ title: "Error Deleting Reservation", variant: "destructive"});
    } finally {
        setIsDialogLoading(false);
    }
  };
  
  const navigateTimeline = (direction: 'prev' | 'next') => {
    setViewStartDate(prevDate => {
      return direction === 'prev' ? subDays(prevDate, DAYS_TO_DISPLAY) : addDays(prevDate, DAYS_TO_DISPLAY);
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-center mb-4"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-10 w-32" /></div>
        <div className="grid md:grid-cols-[280px_1fr] gap-6">
          <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-1/2 mb-2" /><Skeleton className="h-4 w-3/4" /></CardHeader><CardContent><Skeleton className="h-[400px] w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  const selectedRoomName = rooms.find(r => r.id === selectedRoomId)?.nom || "Select a Room";

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Room Reservations</h1>
          <p className="text-lg text-muted-foreground">Manage and view room bookings.</p>
        </div>
        <Button onClick={() => openAddReservationDialog()} disabled={rooms.length === 0}>
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Reservation
        </Button>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-6 items-start">
        <Card className="shadow-lg sticky top-20">
          <CardHeader><CardTitle>Rooms ({rooms.length})</CardTitle><CardDescription>Select a room.</CardDescription></CardHeader>
          <CardContent><ScrollArea className="h-[calc(100vh-240px)]">
            {rooms.length === 0 && <p className="text-muted-foreground text-center py-4">No rooms found.</p>}
            <ul className="space-y-2">
              {rooms.map(room => (
                <li key={room.id}>
                  <Button variant={selectedRoomId === room.id ? "secondary" : "ghost"} className="w-full justify-start text-left h-auto py-2.5" onClick={() => setSelectedRoomId(room.id)}>
                    <BedDouble className="mr-3 h-5 w-5 text-primary" /><span className="font-medium">{room.nom}</span>
                  </Button>
                </li>))}
            </ul>
          </ScrollArea></CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>Timeline: {selectedRoomName}</CardTitle>
                <CardDescription>
                  {format(viewStartDate, 'MMM d, yyyy')} - {format(addDays(viewStartDate, DAYS_TO_DISPLAY - 1), 'MMM d, yyyy')}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => navigateTimeline('prev')} disabled={isReservationsLoading || !selectedRoomId}><ChevronLeft/></Button>
                <Button variant="outline" size="icon" onClick={() => navigateTimeline('next')} disabled={isReservationsLoading || !selectedRoomId}><ChevronRight/></Button>
              </div>
            </CardHeader>
            <CardContent>
              {isReservationsLoading ? <Skeleton className="h-48 w-full" /> : 
               !selectedRoomId && rooms.length > 0 ? <p className="text-muted-foreground text-center py-10">Select a room to see its timeline.</p> :
               rooms.length === 0 ? <p className="text-muted-foreground text-center py-10">No rooms available.</p> :
              (
                <div className="overflow-x-auto">
                  <div className="grid gap-px bg-border -ml-px -mt-px border-l border-t" style={{ gridTemplateColumns: `repeat(${DAYS_TO_DISPLAY}, minmax(100px, 1fr))`}}>
                    {/* Day Headers */}
                    {currentTimelineDays.map(day => (
                      <div key={day.toISOString()} className="p-2 text-center border-r border-b bg-card">
                        <div className="text-xs font-medium text-muted-foreground">{format(day, 'EEE')}</div>
                        <div className="text-lg font-semibold">{format(day, 'd')}</div>
                      </div>
                    ))}
                    {/* Reservation Row for Selected Room */}
                    {currentTimelineDays.map(day => {
                      const reservationsOnThisDay = getReservationsForDay(day, allReservationsForRoom);
                      return (
                        <div 
                          key={`res-${day.toISOString()}`} 
                          className="p-2 border-r border-b min-h-[80px] bg-card hover:bg-secondary/50 transition-colors cursor-pointer flex flex-col justify-start items-stretch"
                          onClick={() => handleDayCellClick(day)}
                        >
                          {reservationsOnThisDay.map(res => (
                            <div key={res.id} className="mb-1 p-1.5 rounded-md text-xs bg-primary/20 text-primary-foreground shadow-sm hover:bg-primary/30" title={`Reservation for ${res.clientName}`}>
                              <p className="font-semibold truncate">{res.clientName}</p>
                              <p className="text-primary-foreground/80 truncate">{format(parseISO(res.dateArrivee), 'HH:mm')} - {format(parseISO(res.dateDepart), 'HH:mm')}</p>
                              <Badge variant={res.status === 'confirmed' ? 'default' : 'secondary'} className="mt-0.5 capitalize text-[10px] px-1.5 py-0">{res.status || 'pending'}</Badge>
                            </div>
                          ))}
                          {reservationsOnThisDay.length === 0 && <span className="text-xs text-muted-foreground self-center mt-auto opacity-50">+ Add</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isAddOrEditDialogOpen} onOpenChange={(open) => { if(!isDialogLoading) setIsAddOrEditDialogOpen(open);}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingReservation ? 'Edit Reservation' : 'Add New Reservation'}</DialogTitle>
            <DialogDescription>Room: {rooms.find(r => r.id === (editingReservation?.locationId || currentReservationData.locationId || selectedRoomId))?.nom || "N/A"}</DialogDescription>
          </DialogHeader>
          {isDialogLoading ? <Skeleton className="h-64 w-full" /> : (
          <ScrollArea className="max-h-[70vh] pr-4"><div className="grid gap-4 py-4">
            <div className="space-y-1.5">
                <Label htmlFor="clientIdDialog">Registered Client (Optional)</Label>
                <Select value={selectedClientForDialog} onValueChange={handleClientSelectionForDialog} disabled={clients.length === 0}>
                    <SelectTrigger id="clientIdDialog"><SelectValue placeholder="Select registered client" /></SelectTrigger>
                    <SelectContent><SelectItem value={NO_CLIENT_SELECTED}>None (Enter name below)</SelectItem>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nom} ({c.email || c.telephone || 'No contact'})</SelectItem>)}{clients.length === 0 && <SelectItem value="" disabled>No clients registered</SelectItem>}</SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="clientNameDialog">Or Enter Client Name*</Label>
                <Input id="clientNameDialog" name="clientName" value={manualClientNameForDialog} onChange={(e) => setManualClientNameForDialog(e.target.value)} disabled={selectedClientForDialog !== NO_CLIENT_SELECTED} placeholder="e.g., John Doe"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label htmlFor="dateArriveeDialog">Arrival Date*</Label>
                    <Popover><PopoverTrigger asChild><Button variant="outline" className={`w-full justify-start text-left font-normal ${!arrivalDate && "text-muted-foreground"}`}><CalendarLucideIcon className="mr-2 h-4 w-4" />{arrivalDate ? format(arrivalDate, 'PPP') : <span>Pick arrival</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={arrivalDate} onSelect={setArrivalDate} initialFocus /></PopoverContent></Popover>
                </div>
                <div className="space-y-1.5"><Label htmlFor="dateDepartDialog">Departure Date*</Label>
                    <Popover><PopoverTrigger asChild><Button variant="outline" className={`w-full justify-start text-left font-normal ${!departureDate && "text-muted-foreground"}`} disabled={!arrivalDate}><CalendarLucideIcon className="mr-2 h-4 w-4" />{departureDate ? format(departureDate, 'PPP') : <span>Pick departure</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} disabled={(date) => arrivalDate ? isBefore(date, addDays(arrivalDate,1)) || isEqual(date, arrivalDate) : false} initialFocus /></PopoverContent></Popover>
                </div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="nombrePersonnesDialog"><Users className="inline mr-1 h-4 w-4" />Number of Persons*</Label><Input id="nombrePersonnesDialog" name="nombrePersonnes" type="number" value={currentReservationData.nombrePersonnes || 1} onChange={handleInputChange} min="1" /></div>
            <div className="flex items-center space-x-2"><Checkbox id="animauxDomestiquesDialog" name="animauxDomestiques" checked={currentReservationData.animauxDomestiques || false} onCheckedChange={(checked) => setCurrentReservationData(prev => ({...prev, animauxDomestiques: !!checked}))} /><Label htmlFor="animauxDomestiquesDialog" className="font-normal"><Dog className="inline mr-1 h-4 w-4" />Pets Allowed</Label></div>
            <div className="space-y-1.5"><Label htmlFor="statusDialog">Status</Label>
                <Select value={currentReservationData.status || 'pending'} onValueChange={(val) => setCurrentReservationData(prev => ({...prev, status: val as ReservationStatus}))}><SelectTrigger id="statusDialog"><SelectValue /></SelectTrigger><SelectContent>{(["pending", "confirmed", "cancelled", "checked-in", "checked-out"] as ReservationStatus[]).map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="notesDialog"><FileText className="inline mr-1 h-4 w-4" />Notes</Label><Textarea id="notesDialog" name="notes" value={currentReservationData.notes || ''} onChange={handleInputChange} placeholder="e.g., Late check-in, specific requests..." /></div>
          </div></ScrollArea>)}
          <DialogFooter className="mt-4 pt-4 border-t">
            {editingReservation && (<Button variant="destructive" onClick={() => handleDeleteReservation(editingReservation.id)} disabled={isDialogLoading} className="mr-auto"><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>)}
            <Button variant="outline" onClick={() => setIsAddOrEditDialogOpen(false)} disabled={isDialogLoading}>Cancel</Button>
            <Button onClick={handleSaveReservation} disabled={isDialogLoading}>{isDialogLoading ? "Saving..." : (editingReservation ? 'Save Changes' : 'Create Reservation')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
