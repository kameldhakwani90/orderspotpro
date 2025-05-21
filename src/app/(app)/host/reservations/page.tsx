
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, BedDouble, PlusCircle, Users, Dog, FileText, Edit2, Trash2 } from 'lucide-react';
import { format, parseISO, isWithinInterval, eachDayOfInterval, addMonths, subMonths, startOfMonth, endOfMonth, isEqual, isBefore, isValid } from 'date-fns';

import type { Reservation, RoomOrTable, Client } from '@/lib/types';
import { getReservations as fetchReservations, addReservation as addReservationToData, updateReservation as updateReservationInData, deleteReservation as deleteReservationInData, getRoomsOrTables, getClients } from '@/lib/data';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NO_CLIENT_SELECTED = "___NO_CLIENT_SELECTED___";

export default function HostReservationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [rooms, setRooms] = useState<RoomOrTable[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [reservationsForSelectedRoom, setReservationsForSelectedRoom] = useState<Reservation[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [displayedReservations, setDisplayedReservations] = useState<Reservation[]>([]);

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

  const fetchRoomReservations = useCallback(async (hostId: string, roomId: string, month: Date) => {
    if (!roomId) {
        setReservationsForSelectedRoom([]);
        setDisplayedReservations([]);
        return;
    }
    setIsReservationsLoading(true);
    try {
      const year = month.getFullYear();
      const monthIndex = month.getMonth(); // 0-11
      const reservationsData = await fetchReservations(hostId, { locationId: roomId, month: monthIndex, year: year });
      setReservationsForSelectedRoom(reservationsData);
      setDisplayedReservations(reservationsData);
    } catch (error) {
      console.error(`Failed to load reservations for room ${roomId}:`, error);
      toast({ title: "Error loading reservations", variant: "destructive" });
      setReservationsForSelectedRoom([]);
      setDisplayedReservations([]);
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
      fetchRoomReservations(user.hostId, selectedRoomId, currentMonth);
    } else if (!selectedRoomId) {
      setReservationsForSelectedRoom([]); // Clear reservations if no room is selected
      setDisplayedReservations([]);
    }
  }, [user?.hostId, selectedRoomId, currentMonth, fetchRoomReservations]);

  const bookedDays = displayedReservations.flatMap(res => {
    const start = parseISO(res.dateArrivee);
    const end = parseISO(res.dateDepart);
     // For display, we want to include the departure day itself if the booking ends on that day
    if (isValid(start) && isValid(end) && !isBefore(end, start)) {
       return eachDayOfInterval({ start, end }); 
    }
    return [];
  });

  const handleDayClick = (day: Date) => {
    const reservationsOnDay = displayedReservations.filter(res => {
      const arrival = parseISO(res.dateArrivee);
      const departure = parseISO(res.dateDepart);
      // A day is considered part of a reservation if it's between arrival (inclusive) and departure (inclusive)
      return isValid(arrival) && isValid(departure) && isWithinInterval(day, { start: arrival, end: departure });
    });

    if (reservationsOnDay.length > 0) {
      const resToEdit = reservationsOnDay[0]; // Prioritize editing an existing one on click
      setEditingReservation(resToEdit);
      setCurrentReservationData({...resToEdit});
      setArrivalDate(parseISO(resToEdit.dateArrivee));
      setDepartureDate(parseISO(resToEdit.dateDepart));
      setSelectedClientForDialog(resToEdit.clientId || NO_CLIENT_SELECTED);
      setManualClientNameForDialog(resToEdit.clientId ? "" : resToEdit.clientName);
      setIsAddOrEditDialogOpen(true);
    } else if (selectedRoomId) {
      // Day is free, open new reservation dialog
      setEditingReservation(null);
      setCurrentReservationData({ locationId: selectedRoomId, nombrePersonnes: 1, animauxDomestiques: false, status: 'pending' });
      setArrivalDate(day);
      setDepartureDate(undefined); 
      setSelectedClientForDialog(NO_CLIENT_SELECTED);
      setManualClientNameForDialog("");
      setIsAddOrEditDialogOpen(true);
    }
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
        toast({ title: "Invalid Departure Date", description: "Departure date must be after arrival date.", variant: "destructive" });
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

    const conflictingReservation = reservationsForSelectedRoom.find(res => {
        if (editingReservation && res.id === editingReservation.id) return false; 
        const existingArrival = parseISO(res.dateArrivee);
        const existingDeparture = parseISO(res.dateDepart);
        // For checking overlap, new departure should be exclusive for the last day.
        // So, if new arrival is 10th and new departure is 12th, it's for 10th, 11th.
        // If existing is 11th to 13th, there's an overlap.
        // (StartA < EndB) and (EndA > StartB)
        return (arrivalDate < existingDeparture && departureDate > existingArrival);
    });

    if (conflictingReservation) {
        toast({ title: "Double Booking Alert", description: `This room is already booked for the selected dates (Reservation ID: ${conflictingReservation.id.slice(-5)}).`, variant: "destructive" });
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
      if(selectedRoomId) fetchRoomReservations(user.hostId, selectedRoomId, currentMonth);
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
        if(selectedRoomId) fetchRoomReservations(user.hostId, selectedRoomId, currentMonth);
        setIsAddOrEditDialogOpen(false);
    } catch (error) {
        console.error("Failed to delete reservation:", error);
        toast({ title: "Error Deleting Reservation", variant: "destructive"});
    } finally {
        setIsDialogLoading(false);
    }
  };


  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid md:grid-cols-[280px_1fr] gap-6">
          <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-1/2 mb-2" /><Skeleton className="h-4 w-3/4" /></CardHeader><CardContent><Skeleton className="h-[400px] w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Room Reservations</h1>
          <p className="text-lg text-muted-foreground">Manage and view room bookings.</p>
        </div>
        <Button onClick={() => {
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
            setArrivalDate(new Date());
            setDepartureDate(undefined);
            setSelectedClientForDialog(NO_CLIENT_SELECTED);
            setManualClientNameForDialog("");
            setIsAddOrEditDialogOpen(true);
        }} disabled={rooms.length === 0}>
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Reservation
        </Button>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-6 items-start">
        <Card className="shadow-lg sticky top-20">
          <CardHeader>
            <CardTitle>Rooms ({rooms.length})</CardTitle>
            <CardDescription>Select a room to view its reservations.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-200px)]">
              {rooms.length === 0 && <p className="text-muted-foreground text-center py-4">No rooms found. Please add rooms in "My Locations".</p>}
              <ul className="space-y-2">
                {rooms.map(room => (
                  <li key={room.id}>
                    <Button
                      variant={selectedRoomId === room.id ? "secondary" : "ghost"}
                      className="w-full justify-start text-left h-auto py-2.5"
                      onClick={() => setSelectedRoomId(room.id)}
                    >
                      <BedDouble className="mr-3 h-5 w-5 text-primary" />
                      <span className="font-medium">{room.nom}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>
                        Calendar: {selectedRoomId ? rooms.find(r=>r.id === selectedRoomId)?.nom : "Please select a room"}
                    </CardTitle>
                    <CardDescription>
                        {format(currentMonth, 'MMMM yyyy')} - Click a day to view/add reservations.
                    </CardDescription>
                </div>
                 <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>Prev</Button>
                    <Button variant="outline" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>Next</Button>
                </div>
            </CardHeader>
            <CardContent className="flex justify-center">
              {isReservationsLoading ? (
                 <Skeleton className="h-[320px] w-full max-w-md" />
              ) : !selectedRoomId && rooms.length > 0 ? (
                <p className="text-muted-foreground text-center py-10 h-[320px] flex items-center justify-center">Select a room to see its calendar.</p>
              ) : rooms.length === 0 ? (
                <p className="text-muted-foreground text-center py-10 h-[320px] flex items-center justify-center">No rooms available to display reservations.</p>
              ) : (
                <Calendar
                    mode="single"
                    selected={undefined} 
                    onDayClick={handleDayClick}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    modifiers={{ booked: bookedDays }}
                    modifiersClassNames={{ booked: "bg-primary/20 text-primary-foreground rounded-md" }}
                    disabled={!selectedRoomId}
                    className="rounded-md border shadow-sm p-3"
                />
              )}
            </CardContent>
          </Card>
          {/* Reservation List/Details for selected day/room can go here */}
           <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Reservations for {rooms.find(r=>r.id===selectedRoomId)?.nom || "Selected Room"}</CardTitle>
                <CardDescription>Bookings in {format(currentMonth, 'MMMM yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
                {isReservationsLoading ? <Skeleton className="h-20 w-full"/> : 
                 !selectedRoomId && rooms.length > 0 ? <p className="text-muted-foreground">Select a room to view reservations.</p> :
                 rooms.length === 0 ? <p className="text-muted-foreground">No rooms available.</p> :
                 displayedReservations.length === 0 ? <p className="text-muted-foreground">No reservations for this room in {format(currentMonth, 'MMMM')}.</p> :
                (
                    <ScrollArea className="h-60">
                        <ul className="space-y-3">
                            {displayedReservations.map(res => (
                                <li key={res.id} className="p-3 border rounded-md bg-secondary/30">
                                    <div className="font-semibold">{res.clientName} ({clients.find(c=>c.id === res.clientId)?.email || 'N/A'})</div>
                                    <div className="text-sm">
                                        {format(parseISO(res.dateArrivee), 'PPP')} - {format(parseISO(res.dateDepart), 'PPP')}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {res.nombrePersonnes} person(s) {res.animauxDomestiques && " (Pets)"} - Status: <span className="capitalize font-medium">{res.status || 'pending'}</span>
                                    </div>
                                    {res.notes && <p className="text-xs mt-1 italic">Notes: {res.notes}</p>}
                                    <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => {
                                        setEditingReservation(res);
                                        setCurrentReservationData({...res});
                                        setArrivalDate(parseISO(res.dateArrivee));
                                        setDepartureDate(parseISO(res.dateDepart));
                                        setSelectedClientForDialog(res.clientId || NO_CLIENT_SELECTED);
                                        setManualClientNameForDialog(res.clientId ? "" : res.clientName);
                                        setIsAddOrEditDialogOpen(true);
                                    }}>
                                        <Edit2 className="mr-1.5 h-3 w-3"/> Edit
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                )}
            </CardContent>
           </Card>
        </div>
      </div>

      <Dialog open={isAddOrEditDialogOpen} onOpenChange={setIsAddOrEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingReservation ? 'Edit Reservation' : 'Add New Reservation'}</DialogTitle>
            <DialogDescription>
              Room: {rooms.find(r => r.id === (currentReservationData.locationId || selectedRoomId))?.nom || "Select Room"}
            </DialogDescription>
          </DialogHeader>
          {isDialogLoading ? <Skeleton className="h-64 w-full" /> : (
          <ScrollArea className="max-h-[70vh] pr-4">
          <div className="grid gap-4 py-4">
            
             {(!editingReservation && !selectedRoomId) && ( // Only show if adding AND no room selected from main page
                <div className="space-y-1.5">
                    <Label htmlFor="locationIdDialog">Room*</Label>
                    <Select 
                        value={currentReservationData.locationId || ''} 
                        onValueChange={(val) => setCurrentReservationData(prev => ({...prev, locationId: val}))}
                        disabled={rooms.length === 0}
                    >
                        <SelectTrigger id="locationIdDialog">
                            <SelectValue placeholder={rooms.length > 0 ? "Select a room" : "No rooms available"} />
                        </SelectTrigger>
                        <SelectContent>
                            {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.nom}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}
            
            <div className="space-y-1.5">
                <Label htmlFor="clientIdDialog">Registered Client (Optional)</Label>
                <Select value={selectedClientForDialog} onValueChange={handleClientSelectionForDialog} disabled={clients.length === 0}>
                    <SelectTrigger id="clientIdDialog"><SelectValue placeholder="Select registered client" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={NO_CLIENT_SELECTED}>None (Enter name below)</SelectItem>
                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nom} ({c.email || c.telephone || 'No contact'})</SelectItem>)}
                         {clients.length === 0 && <SelectItem value="" disabled>No clients registered</SelectItem>}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="clientNameDialog">Or Enter Client Name*</Label>
                <Input 
                    id="clientNameDialog" 
                    name="clientName" 
                    value={manualClientNameForDialog} 
                    onChange={(e) => setManualClientNameForDialog(e.target.value)}
                    disabled={selectedClientForDialog !== NO_CLIENT_SELECTED}
                    placeholder="e.g., John Doe"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="dateArriveeDialog">Arrival Date*</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={`w-full justify-start text-left font-normal ${!arrivalDate && "text-muted-foreground"}`}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {arrivalDate ? format(arrivalDate, 'PPP') : <span>Pick arrival</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={arrivalDate} onSelect={setArrivalDate} initialFocus /></PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="dateDepartDialog">Departure Date*</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={`w-full justify-start text-left font-normal ${!departureDate && "text-muted-foreground"}`} disabled={!arrivalDate}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {departureDate ? format(departureDate, 'PPP') : <span>Pick departure</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} disabled={(date) => arrivalDate ? isBefore(date, addMonths(arrivalDate,0)) || isEqual(date, arrivalDate) : false} initialFocus /></PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="nombrePersonnesDialog"><Users className="inline mr-1 h-4 w-4" />Number of Persons*</Label>
                <Input id="nombrePersonnesDialog" name="nombrePersonnes" type="number" value={currentReservationData.nombrePersonnes || 1} onChange={handleInputChange} min="1" />
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="animauxDomestiquesDialog" name="animauxDomestiques" checked={currentReservationData.animauxDomestiques || false} onCheckedChange={(checked) => setCurrentReservationData(prev => ({...prev, animauxDomestiques: !!checked}))} />
                <Label htmlFor="animauxDomestiquesDialog" className="font-normal"><Dog className="inline mr-1 h-4 w-4" />Pets Allowed</Label>
            </div>
             <div className="space-y-1.5">
                <Label htmlFor="statusDialog">Status</Label>
                <Select 
                    value={currentReservationData.status || 'pending'} 
                    onValueChange={(val) => setCurrentReservationData(prev => ({...prev, status: val as ReservationStatus}))}
                >
                    <SelectTrigger id="statusDialog"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {(["pending", "confirmed", "cancelled", "checked-in", "checked-out"] as ReservationStatus[]).map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="notesDialog"><FileText className="inline mr-1 h-4 w-4" />Notes</Label>
                <Textarea id="notesDialog" name="notes" value={currentReservationData.notes || ''} onChange={handleInputChange} placeholder="e.g., Late check-in, specific requests..." />
            </div>
          </div>
          </ScrollArea>
          )}
          <DialogFooter className="mt-4 pt-4 border-t">
            {editingReservation && (
                 <Button variant="destructive" onClick={() => handleDeleteReservation(editingReservation.id)} disabled={isDialogLoading} className="mr-auto">
                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                </Button>
            )}
            <Button variant="outline" onClick={() => setIsAddOrEditDialogOpen(false)} disabled={isDialogLoading}>Cancel</Button>
            <Button onClick={handleSaveReservation} disabled={isDialogLoading}>
                {isDialogLoading ? "Saving..." : (editingReservation ? 'Save Changes' : 'Create Reservation')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
