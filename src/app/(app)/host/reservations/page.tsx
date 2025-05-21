
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Calendar as CalendarLucideIcon, 
  BedDouble, 
  PlusCircle, 
  Users, 
  Dog, 
  FileText, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight 
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
  startOfWeek,
  differenceInDays,
  max,
  min
} from 'date-fns';
import { fr } from 'date-fns/locale'; // For French day names

import type { Reservation, RoomOrTable, Client, ReservationStatus } from '@/lib/types';
import { 
  getReservations as fetchReservations, 
  addReservation as addReservationToData, 
  updateReservation as updateReservationInData, 
  deleteReservation as deleteReservationInData, 
  getRoomsOrTables, 
  getClients 
} from '@/lib/data';

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
const DAYS_IN_WEEK_VIEW = 7;

const getStatusColor = (status?: ReservationStatus): string => {
  switch (status) {
    case 'pending': return 'bg-yellow-500/70 hover:bg-yellow-600/70';
    case 'confirmed': return 'bg-blue-500/70 hover:bg-blue-600/70';
    case 'checked-in': return 'bg-green-500/70 hover:bg-green-600/70';
    case 'checked-out': return 'bg-gray-500/70 hover:bg-gray-600/70';
    case 'cancelled': return 'bg-red-500/70 hover:bg-red-600/70';
    default: return 'bg-gray-400/70 hover:bg-gray-500/70';
  }
};

export default function HostReservationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [rooms, setRooms] = useState<RoomOrTable[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  
  const [viewStartDate, setViewStartDate] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 })); // Start week on Monday
  const [timelineDays, setTimelineDays] = useState<Date[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isDialogLoading, setIsDialogLoading] = useState(false);
  
  const [isAddOrEditDialogOpen, setIsAddOrEditDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [currentReservationData, setCurrentReservationData] = useState<Partial<Reservation>>({});
  const [arrivalDateForDialog, setArrivalDateForDialog] = useState<Date | undefined>(undefined);
  const [departureDateForDialog, setDepartureDateForDialog] = useState<Date | undefined>(undefined);
  const [selectedClientForDialog, setSelectedClientForDialog] = useState<string>(NO_CLIENT_SELECTED);
  const [manualClientNameForDialog, setManualClientNameForDialog] = useState<string>("");
  const [selectedRoomForDialog, setSelectedRoomForDialog] = useState<string | undefined>(undefined);


  const fetchInitialData = useCallback(async (hostId: string) => {
    setIsLoading(true);
    try {
      const [roomsData, clientsData, reservationsData] = await Promise.all([
        getRoomsOrTables(hostId).then(r => r.filter(loc => loc.type === 'Chambre')),
        getClients(hostId),
        fetchReservations(hostId) // Fetch all reservations for the host
      ]);
      setRooms(roomsData);
      setClients(clientsData);
      setAllReservations(reservationsData);
    } catch (error) {
      console.error("Failed to load initial page data:", error);
      toast({ title: "Error loading page data", description: "Could not load rooms, clients, or reservations.", variant: "destructive" });
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
    for (let i = 0; i < DAYS_IN_WEEK_VIEW; i++) {
      days.push(addDays(viewStartDate, i));
    }
    setTimelineDays(days);
  }, [viewStartDate]);
  
  const openAddReservationDialog = (roomId: string, date: Date) => {
    setEditingReservation(null);
    setSelectedRoomForDialog(roomId);
    setCurrentReservationData({ locationId: roomId, nombrePersonnes: 1, animauxDomestiques: false, status: 'pending' });
    setArrivalDateForDialog(startOfDay(date));
    setDepartureDateForDialog(startOfDay(addDays(date, 1)));
    setSelectedClientForDialog(NO_CLIENT_SELECTED);
    setManualClientNameForDialog("");
    setIsAddOrEditDialogOpen(true);
  };

  const openEditReservationDialog = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setSelectedRoomForDialog(reservation.locationId);
    setCurrentReservationData({...reservation});
    setArrivalDateForDialog(parseISO(reservation.dateArrivee));
    setDepartureDateForDialog(parseISO(reservation.dateDepart));
    setSelectedClientForDialog(reservation.clientId || NO_CLIENT_SELECTED);
    setManualClientNameForDialog(reservation.clientId ? "" : reservation.clientName);
    setIsAddOrEditDialogOpen(true);
  };

  const handleDialogInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        setCurrentReservationData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === 'number') {
        setCurrentReservationData(prev => ({ ...prev, [name]: parseInt(value) || 1 }));
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
    if (!user?.hostId || !selectedRoomForDialog || !arrivalDateForDialog) {
        toast({ title: "Missing Information", description: "Room and arrival date are required.", variant: "destructive" });
        return;
    }
    if (!departureDateForDialog || isBefore(departureDateForDialog, arrivalDateForDialog) || isEqual(startOfDay(departureDateForDialog), startOfDay(arrivalDateForDialog))) {
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

    // Basic double booking check for the specific room
    const conflictingReservation = allReservations.find(res => {
        if (res.locationId !== selectedRoomForDialog) return false; // Only check for the same room
        if (editingReservation && res.id === editingReservation.id) return false; 
        const existingArrival = startOfDay(parseISO(res.dateArrivee));
        const existingDeparture = startOfDay(parseISO(res.dateDepart)); // Use start of day for departure to check actual booked nights
        const newArrival = startOfDay(arrivalDateForDialog);
        const newDeparture = startOfDay(departureDateForDialog);
        // Check for overlap: (StartA < EndB) and (EndA > StartB)
        return (newArrival < existingDeparture && newDeparture > existingArrival);
    });

    if (conflictingReservation) {
        toast({ title: "Double Booking Alert", description: `This room is already booked for some of the selected dates (Reservation: ${conflictingReservation.clientName}). Please adjust dates.`, variant: "destructive", duration: 7000 });
        return;
    }

    setIsDialogLoading(true);
    const reservationPayload: Omit<Reservation, 'id'> = {
        hostId: user.hostId,
        locationId: selectedRoomForDialog!,
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
      if(user.hostId) fetchInitialData(user.hostId); // Refetch all data
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
        if(user.hostId) fetchInitialData(user.hostId);
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
      return direction === 'prev' ? subDays(prevDate, DAYS_IN_WEEK_VIEW) : addDays(prevDate, DAYS_IN_WEEK_VIEW);
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-center mb-4"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-10 w-32" /></div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-bold">Reservations Timeline</CardTitle>
              <CardDescription>
                {format(viewStartDate, 'MMMM yyyy', { locale: fr })}: {format(timelineDays[0], 'd')} - {format(timelineDays[timelineDays.length - 1], 'd MMM', { locale: fr })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setViewStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Today</Button>
              <Button variant="outline" size="icon" onClick={() => navigateTimeline('prev')}><ChevronLeft/></Button>
              <Button variant="outline" size="icon" onClick={() => navigateTimeline('next')}><ChevronRight/></Button>
              <Button onClick={() => openAddReservationDialog(rooms[0]?.id || '', new Date())} disabled={rooms.length === 0}>
                <PlusCircle className="mr-2 h-5 w-5" /> Add Reservation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
             <p className="text-muted-foreground text-center py-10">No rooms configured. Please add rooms in 'My Locations'.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid border-l border-t border-border min-w-[1000px]" 
                   style={{ gridTemplateColumns: `150px repeat(${DAYS_IN_WEEK_VIEW}, 1fr)` }}>
                {/* Header Row */}
                <div className="p-2 border-r border-b border-border font-semibold bg-muted/50 sticky left-0 z-10">Room</div>
                {timelineDays.map(day => (
                  <div key={day.toISOString()} className="p-2 text-center border-r border-b border-border bg-muted/50">
                    <div className="text-xs font-medium uppercase">{format(day, 'EEE', { locale: fr })}</div>
                    <div className="text-lg font-semibold">{format(day, 'd')}</div>
                  </div>
                ))}

                {/* Room Rows */}
                {rooms.map(room => {
                  const reservationsForThisRoom = allReservations.filter(res => res.locationId === room.id);
                  return (
                    <React.Fragment key={room.id}>
                      <div className="p-2 border-r border-b border-border font-medium sticky left-0 bg-card z-10 flex items-center">
                        <BedDouble className="h-4 w-4 mr-2 text-primary" />{room.nom}
                      </div>
                      {timelineDays.map((day, dayIndex) => {
                        // Find reservations that START on this day for this room
                        const startingReservations = reservationsForThisRoom.filter(res => 
                          isValid(parseISO(res.dateArrivee)) && isEqual(startOfDay(parseISO(res.dateArrivee)), startOfDay(day))
                        );
                        
                        // Check if this day is part of an ongoing reservation (not starting today)
                        let isDayBookedByOngoing = false;
                        if (startingReservations.length === 0) {
                           isDayBookedByOngoing = reservationsForThisRoom.some(res => 
                            isValid(parseISO(res.dateArrivee)) && isValid(parseISO(res.dateDepart)) &&
                            isWithinInterval(day, { 
                              start: startOfDay(parseISO(res.dateArrivee)), 
                              // Ensure departure date is exclusive for interval check, or adjust as needed
                              end: startOfDay(subDays(parseISO(res.dateDepart),1)) // Reservation ends *before* departure date
                            }) && !isEqual(startOfDay(parseISO(res.dateArrivee)), startOfDay(day))
                          );
                        }

                        return (
                          <div 
                            key={day.toISOString()} 
                            className="p-0.5 border-r border-b border-border min-h-[60px] relative cursor-pointer hover:bg-secondary/30 transition-colors"
                            onClick={() => {
                              const resOnThisDay = reservationsForThisRoom.find(r => 
                                isValid(parseISO(r.dateArrivee)) && isValid(parseISO(r.dateDepart)) &&
                                isWithinInterval(day, {start: startOfDay(parseISO(r.dateArrivee)), end: startOfDay(subDays(parseISO(r.dateDepart),1))})
                              );
                              if (resOnThisDay) openEditReservationDialog(resOnThisDay);
                              else openAddReservationDialog(room.id, day);
                            }}
                          >
                            {startingReservations.map(res => {
                              const arrival = startOfDay(parseISO(res.dateArrivee));
                              const departure = startOfDay(parseISO(res.dateDepart));
                              let duration = differenceInDays(departure, arrival);
                              if (duration < 1) duration = 1; // Min 1 day visually

                              // Clamp duration if it extends beyond the current view
                              const viewEndDate = addDays(viewStartDate, DAYS_IN_WEEK_VIEW -1);
                              if (isAfter(departure, addDays(day, duration -1))) {
                                 if (isAfter(addDays(day, duration -1), viewEndDate)) {
                                    duration = differenceInDays(viewEndDate, day) + 1;
                                 }
                              }
                             
                              return (
                                <div
                                  key={res.id}
                                  className={`absolute top-0.5 left-0.5 right-0.5 p-1.5 rounded text-white text-xs shadow-md overflow-hidden ${getStatusColor(res.status)}`}
                                  style={{ 
                                    gridColumnStart: dayIndex + 2, // +1 for 1-based index, +1 for room name column
                                    // This style will be applied by Tailwind's grid-cols-X on the parent
                                    // Here, we just ensure it visually fits.
                                    // For actual spanning, a different structure or absolute positioning based on width might be needed.
                                    // This simplified version just places the block in the starting day cell.
                                    // Actual spanning over multiple divs is complex with this simple grid.
                                    // A better way for spanning is to place it directly on the main grid of the room row.
                                    // Let's assume for now each reservation block is rendered in its start cell.
                                    // The logic for gridColumnEnd for a single block is more complex
                                  }}
                                  onClick={(e) => { e.stopPropagation(); openEditReservationDialog(res); }}
                                >
                                  <p className="font-semibold truncate">{res.clientName}</p>
                                  <p className="text-[10px] opacity-80">{format(arrival, 'HH:mm')} - {format(departure, 'HH:mm')}</p>
                                  <Badge variant="secondary" className="mt-0.5 capitalize text-[9px] px-1 py-0 bg-black/20 border-none">
                                    {res.status}
                                  </Badge>
                                </div>
                              );
                            })}
                             {startingReservations.length === 0 && isDayBookedByOngoing && (
                                <div className="h-full w-full bg-slate-300/30 dark:bg-slate-700/30"></div>
                             )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOrEditDialogOpen} onOpenChange={(open) => { if(!isDialogLoading) setIsAddOrEditDialogOpen(open);}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingReservation ? 'Edit Reservation' : 'Add New Reservation'}</DialogTitle>
            <DialogDescription>Room: {rooms.find(r => r.id === (editingReservation?.locationId || selectedRoomForDialog))?.nom || "N/A"}</DialogDescription>
          </DialogHeader>
          {isDialogLoading ? <Skeleton className="h-64 w-full" /> : (
          <ScrollArea className="max-h-[70vh] pr-4 -mr-2"><div className="grid gap-4 py-4 ">
            <div className="space-y-1.5">
              <Label htmlFor="roomIdDialog">Room*</Label>
              <Select 
                value={selectedRoomForDialog || ""} 
                onValueChange={(value) => setSelectedRoomForDialog(value)} 
                disabled={!!editingReservation || rooms.length === 0}
              >
                <SelectTrigger id="roomIdDialog"><SelectValue placeholder="Select a room" /></SelectTrigger>
                <SelectContent>
                  {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.nom}</SelectItem>)}
                  {rooms.length === 0 && <SelectItem value="" disabled>No rooms available</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="clientIdDialog">Registered Client (Optional)</Label>
                <Select value={selectedClientForDialog} onValueChange={handleClientSelectionForDialog} disabled={clients.length === 0}>
                    <SelectTrigger id="clientIdDialog"><SelectValue placeholder="Select registered client" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CLIENT_SELECTED}>None (Enter name below)</SelectItem>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nom} ({c.email || c.telephone || 'No contact'})</SelectItem>)}
                      {clients.length === 0 && <SelectItem value="no_clients_placeholder_disabled" disabled>No clients registered</SelectItem>}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="clientNameDialog">Or Enter Client Name*</Label>
                <Input id="clientNameDialog" name="clientName" value={manualClientNameForDialog} onChange={(e) => setManualClientNameForDialog(e.target.value)} disabled={selectedClientForDialog !== NO_CLIENT_SELECTED} placeholder="e.g., John Doe"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label htmlFor="dateArriveeDialog">Arrival Date*</Label>
                    <Popover><PopoverTrigger asChild><Button variant="outline" className={`w-full justify-start text-left font-normal ${!arrivalDateForDialog && "text-muted-foreground"}`}><CalendarLucideIcon className="mr-2 h-4 w-4" />{arrivalDateForDialog ? format(arrivalDateForDialog, 'PPP', {locale: fr}) : <span>Pick arrival</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><ShadCalendar mode="single" selected={arrivalDateForDialog} onSelect={setArrivalDateForDialog} initialFocus /></PopoverContent></Popover>
                </div>
                <div className="space-y-1.5"><Label htmlFor="dateDepartDialog">Departure Date*</Label>
                    <Popover><PopoverTrigger asChild><Button variant="outline" className={`w-full justify-start text-left font-normal ${!departureDateForDialog && "text-muted-foreground"}`} disabled={!arrivalDateForDialog}><CalendarLucideIcon className="mr-2 h-4 w-4" />{departureDateForDialog ? format(departureDateForDialog, 'PPP', {locale: fr}) : <span>Pick departure</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><ShadCalendar mode="single" selected={departureDateForDialog} onSelect={setDepartureDateForDialog} disabled={(date) => arrivalDateForDialog ? isBefore(date, addDays(arrivalDateForDialog,1)) || isEqual(date, arrivalDateForDialog) : false} initialFocus /></PopoverContent></Popover>
                </div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="nombrePersonnesDialog"><Users className="inline mr-1 h-4 w-4" />Number of Persons*</Label><Input id="nombrePersonnesDialog" name="nombrePersonnes" type="number" value={currentReservationData.nombrePersonnes || 1} onChange={handleDialogInputChange} min="1" /></div>
            <div className="flex items-center space-x-2"><Checkbox id="animauxDomestiquesDialog" name="animauxDomestiques" checked={currentReservationData.animauxDomestiques || false} onCheckedChange={(checked) => setCurrentReservationData(prev => ({...prev, animauxDomestiques: !!checked}))} /><Label htmlFor="animauxDomestiquesDialog" className="font-normal"><Dog className="inline mr-1 h-4 w-4" />Pets Allowed</Label></div>
            <div className="space-y-1.5"><Label htmlFor="statusDialog">Status</Label>
                <Select value={currentReservationData.status || 'pending'} onValueChange={(val) => setCurrentReservationData(prev => ({...prev, status: val as ReservationStatus}))}><SelectTrigger id="statusDialog"><SelectValue /></SelectTrigger><SelectContent>{(["pending", "confirmed", "cancelled", "checked-in", "checked-out"] as ReservationStatus[]).map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="notesDialog"><FileText className="inline mr-1 h-4 w-4" />Notes</Label><Textarea id="notesDialog" name="notes" value={currentReservationData.notes || ''} onChange={handleDialogInputChange} placeholder="e.g., Late check-in, specific requests..." /></div>
          </div></ScrollArea>)}
          <DialogFooter className="mt-4 pt-4 border-t">
            {editingReservation && (<Button variant="destructive" onClick={() => handleDeleteReservation(editingReservation.id)} disabled={isDialogLoading} className="mr-auto"><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>)}
            <Button variant="outline" onClick={() => setIsAddOrEditDialogOpen(false)} disabled={isDialogLoading}>Cancel</Button>
            <Button 
              onClick={handleSaveReservation} 
              disabled={isDialogLoading || !selectedRoomForDialog || (!manualClientNameForDialog.trim() && selectedClientForDialog === NO_CLIENT_SELECTED)}
            >
              {isDialogLoading ? "Saving..." : (editingReservation ? 'Save Changes' : 'Create Reservation')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    