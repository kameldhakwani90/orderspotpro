
"use client";

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getReservationById,
  updateReservationInData,
  deleteReservationInData,
  getRoomsOrTables,
  getClients,
  getRoomOrTableById,
  getHostById,
  getReservations as fetchAllHostReservations,
} from '@/lib/data';
import type { Reservation, RoomOrTable, Client, ReservationStatus, Host, OnlineCheckinStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ShadCalendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { format, parseISO, isValid, isBefore, addDays, startOfDay, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, CalendarDays as CalendarIcon, Users as UsersIcon, Dog, FileText, BedDouble, Utensils, Save, Trash2, AlertTriangle, Copy, FileCheck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge'; // Added Badge import

const NO_CLIENT_SELECTED = "___NO_CLIENT_SELECTED___";
const reservationStatuses: ReservationStatus[] = ["pending", "confirmed", "checked-in", "checked-out", "cancelled"];
const onlineCheckinStatuses: OnlineCheckinStatus[] = ['not-started', 'pending-review', 'completed'];


function HostReservationDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const reservationId = params.reservationId as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [hostDetails, setHostDetails] = useState<Host | null>(null);
  const [originalLocation, setOriginalLocation] = useState<RoomOrTable | null>(null);
  const [allHostLocations, setAllHostLocations] = useState<RoomOrTable[]>([]);
  const [allHostClients, setAllHostClients] = useState<Client[]>([]);
  const [allReservationsForHost, setAllReservationsForHost] = useState<Reservation[]>([]);


  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);
  const [selectedClientId, setSelectedClientId] = useState<string>(NO_CLIENT_SELECTED);
  const [manualClientName, setManualClientName] = useState<string>("");
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(undefined);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(undefined);
  const [numPersons, setNumPersons] = useState<number>(1);
  const [petsAllowed, setPetsAllowed] = useState<boolean>(false);
  const [currentStatus, setCurrentStatus] = useState<ReservationStatus>('pending');
  const [notes, setNotes] = useState<string>('');
  const [channel, setChannel] = useState<string>('');
  const [currentOnlineCheckinStatus, setCurrentOnlineCheckinStatus] = useState<OnlineCheckinStatus | undefined>(undefined);


  const fetchReservationData = useCallback(async () => {
    if (!reservationId || !user?.hostId) {
      setError("Reservation ID or Host ID missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [
        resData,
        hostData,
        hostLocationsData,
        hostClientsData,
        allReservationsData
      ] = await Promise.all([
        getReservationById(reservationId),
        getHostById(user.hostId),
        getRoomsOrTables(user.hostId),
        getClients(user.hostId),
        fetchAllHostReservations(user.hostId) 
      ]);

      if (!resData) {
        setError("Reservation not found.");
        setIsLoading(false);
        return;
      }
      if (resData.hostId !== user.hostId) {
        setError("You do not have permission to view this reservation.");
        setIsLoading(false);
        return;
      }

      setReservation(resData);
      setHostDetails(hostData);
      setAllHostLocations(hostLocationsData.filter(loc => loc.type === 'Chambre' || loc.type === 'Table'));
      setAllHostClients(hostClientsData);
      setAllReservationsForHost(allReservationsData);


      // Initialize form state
      setSelectedLocationId(resData.locationId);
      const originalLoc = hostLocationsData.find(loc => loc.id === resData.locationId);
      setOriginalLocation(originalLoc || null);

      setSelectedClientId(resData.clientId || NO_CLIENT_SELECTED);
      setManualClientName(resData.clientId ? "" : resData.clientName || "");
      
      if (resData.dateArrivee && isValid(parseISO(resData.dateArrivee))) {
        setArrivalDate(parseISO(resData.dateArrivee));
      } else {
        setArrivalDate(undefined);
      }
      
      if (resData.dateDepart && isValid(parseISO(resData.dateDepart))) {
        setDepartureDate(parseISO(resData.dateDepart));
      } else if (resData.dateArrivee && originalLoc?.type === 'Table' && isValid(parseISO(resData.dateArrivee))) {
        setDepartureDate(parseISO(resData.dateArrivee));
      } else {
        setDepartureDate(undefined);
      }

      setNumPersons(resData.nombrePersonnes || 1);
      setPetsAllowed(resData.animauxDomestiques || false);
      setCurrentStatus(resData.status || 'pending');
      setNotes(resData.notes || '');
      setChannel(resData.channel || '');
      setCurrentOnlineCheckinStatus(resData.onlineCheckinStatus || 'not-started');

    } catch (e: any) {
      console.error("Error fetching reservation details:", e);
      setError("Failed to load reservation details. " + e.message);
    } finally {
      setIsLoading(false);
    }
  }, [reservationId, user?.hostId]);

  useEffect(() => {
    fetchReservationData();
  }, [fetchReservationData]);

  const currentSelectedLocationType = useMemo(() => {
    if (selectedLocationId) {
      return allHostLocations.find(loc => loc.id === selectedLocationId)?.type;
    }
    return originalLocation?.type;
  }, [selectedLocationId, allHostLocations, originalLocation]);

  const availableLocationsForDialog = useMemo(() => {
    if (!arrivalDate || (currentSelectedLocationType === 'Chambre' && !departureDate)) {
      return allHostLocations.filter(loc =>
        loc.type === currentSelectedLocationType &&
        (!numPersons || (loc.capacity && loc.capacity >= numPersons))
      );
    }

    const checkIn = startOfDay(arrivalDate);
    let checkOut;

    if (currentSelectedLocationType === 'Table') {
      checkOut = startOfDay(addDays(arrivalDate, 1));
    } else if (departureDate) {
      checkOut = startOfDay(departureDate);
    } else {
       return allHostLocations.filter(loc =>
        loc.type === currentSelectedLocationType &&
        (!numPersons || (loc.capacity && loc.capacity >= numPersons))
      );
    }
    
    return allHostLocations.filter(loc => {
      if (loc.type !== currentSelectedLocationType) return false;
      if (numPersons > 0 && (!loc.capacity || loc.capacity < numPersons)) return false;

      const isLocationBooked = allReservationsForHost.some(res => {
        if (res.locationId !== loc.id) return false;
        if (reservation && res.id === reservation.id) return false; 
        if (res.status === 'cancelled') return false;
        try {
          const existingArrival = startOfDay(parseISO(res.dateArrivee));
          const existingDeparture = res.type === 'Table' || !res.dateDepart
            ? startOfDay(addDays(existingArrival, 1))
            : startOfDay(parseISO(res.dateDepart));
          return (checkIn < existingDeparture && checkOut > existingArrival);
        } catch (e) { return false; }
      });
      return !isLocationBooked;
    });
  }, [arrivalDate, departureDate, numPersons, allHostLocations, allReservationsForHost, reservation, currentSelectedLocationType]);
  
  useEffect(() => {
    if (currentSelectedLocationType === 'Table' && arrivalDate) {
      if (!departureDate || !isSameDay(arrivalDate, departureDate)) {
        setDepartureDate(arrivalDate);
      }
    }
  }, [arrivalDate, currentSelectedLocationType, departureDate]);


  const handleSaveChanges = async () => {
    if (!reservation || !user?.hostId || !selectedLocationId || !arrivalDate) {
      toast({ title: "Missing Information", description: "Location and arrival date are required.", variant: "destructive" });
      return;
    }

    const selectedLocationDetails = allHostLocations.find(loc => loc.id === selectedLocationId);
    if (!selectedLocationDetails) {
      toast({ title: "Error", description: "Selected location not found.", variant: "destructive" });
      return;
    }

    let effectiveDepartureDateStr: string | undefined;
    if (selectedLocationDetails.type === 'Chambre') {
      if (!departureDate || isBefore(startOfDay(departureDate), startOfDay(addDays(arrivalDate, 1)))) {
        toast({ title: "Invalid Departure Date", description: "Departure date must be at least one day after arrival for rooms.", variant: "destructive" });
        return;
      }
      effectiveDepartureDateStr = format(departureDate, 'yyyy-MM-dd');
    } else { // Table
      effectiveDepartureDateStr = undefined; 
    }

    if (numPersons <= 0) {
      toast({ title: "Invalid Guest Count", description: "Number of persons must be at least 1.", variant: "destructive" });
      return;
    }

    let clientNameToSave = manualClientName.trim() || "";
    let clientIdToSave = selectedClientId === NO_CLIENT_SELECTED ? undefined : selectedClientId;

    if (!clientIdToSave && !clientNameToSave) {
      toast({ title: "Client Name Required", description: "Please select or enter a client name.", variant: "destructive" });
      return;
    }
    if (clientIdToSave) {
      const clientObj = allHostClients.find(c => c.id === clientIdToSave);
      clientNameToSave = clientObj?.nom || "Unknown Registered Client";
    }
    
    setIsSubmitting(true);
    const reservationPayload: Partial<Omit<Reservation, 'id' | 'hostId' | 'prixTotal' | 'montantPaye' | 'soldeDu' | 'paiements' | 'pointsGagnes'>> = {
      locationId: selectedLocationId,
      type: selectedLocationDetails.type,
      clientName: clientNameToSave,
      clientId: clientIdToSave,
      dateArrivee: format(arrivalDate, 'yyyy-MM-dd'),
      dateDepart: effectiveDepartureDateStr,
      nombrePersonnes: numPersons,
      animauxDomestiques: selectedLocationDetails.type === 'Chambre' ? petsAllowed : undefined,
      notes: notes,
      status: currentStatus,
      channel: channel,
      onlineCheckinStatus: currentOnlineCheckinStatus,
      // onlineCheckinData is updated through its own flow
    };

    try {
      await updateReservationInData(reservation.id, reservationPayload);
      toast({ title: "Reservation Updated", description: "Changes saved successfully." });
      fetchReservationData(); // Re-fetch to show updated data
    } catch (error) {
      console.error("Failed to update reservation:", error);
      toast({ title: "Error Saving Reservation", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!reservation || !window.confirm("Are you sure you want to delete this reservation?")) return;
    setIsSubmitting(true);
    try {
      await deleteReservationInData(reservation.id);
      toast({ title: "Reservation Deleted", variant: "destructive" });
      router.push('/host/reservations');
    } catch (error) {
      console.error("Failed to delete reservation:", error);
      toast({ title: "Error Deleting Reservation", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReviewOnlineCheckin = async () => {
    if (!reservation || !user?.hostId) return;
    setIsSubmitting(true);
    try {
      await updateReservationInData(reservation.id, {
        onlineCheckinStatus: 'completed',
        status: 'checked-in'
      });
      toast({ title: "Online Check-in Processed", description: "Guest is now checked-in and online check-in marked as complete." });
      fetchReservationData();
    } catch (error) {
      console.error("Failed to update online check-in and reservation status:", error);
      toast({ title: "Error", description: "Could not update statuses.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyOnlineCheckinLink = () => {
    if (typeof window !== 'undefined' && reservation) {
      const link = `${window.location.origin}/checkin/${reservation.id}`;
      navigator.clipboard.writeText(link)
        .then(() => toast({ title: "Link Copied!", description: "Online check-in link copied to clipboard." }))
        .catch(err => toast({ title: "Copy Failed", description: "Could not copy link.", variant: "destructive" }));
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-6">
        <Skeleton className="h-10 w-1/3 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Reservation</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.push('/host/reservations')} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reservations List
        </Button>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Reservation not found.</p>
         <Button onClick={() => router.push('/host/reservations')} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reservations List
        </Button>
      </div>
    );
  }
  
  const LocationSpecificIcon = currentSelectedLocationType === 'Chambre' ? BedDouble : Utensils;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Reservation Details: #{reservation.id.slice(-6)}
        </h1>
        <Link href="/host/reservations">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Reservations</Button>
        </Link>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <LocationSpecificIcon className="mr-2 h-6 w-6 text-primary" />
            Edit Reservation for: {originalLocation?.nom} ({originalLocation?.type})
          </CardTitle>
          <CardDescription>Modify the details of this reservation. Current Status: <Badge variant="outline" className="capitalize">{currentStatus}</Badge></CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[70vh] pr-4 -mr-2">
            <div className="grid gap-6 py-4 ">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="arrivalDateDialog">Arrival Date*</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`w-full justify-start text-left font-normal ${!arrivalDate && "text-muted-foreground"}`}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {arrivalDate ? format(arrivalDate, 'PPP', { locale: fr }) : <span>Pick arrival</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <ShadCalendar mode="single" selected={arrivalDate} onSelect={setArrivalDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                {currentSelectedLocationType === 'Chambre' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="departureDateDialog">Departure Date*</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={`w-full justify-start text-left font-normal ${!departureDate && "text-muted-foreground"}`} disabled={!arrivalDate}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {departureDate ? format(departureDate, 'PPP', { locale: fr }) : <span>Pick departure</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <ShadCalendar mode="single" selected={departureDate} onSelect={setDepartureDate} disabled={(date) => arrivalDate ? isBefore(date, addDays(arrivalDate, 1)) : false} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="numPersonsDialog"><UsersIcon className="inline mr-1 h-4 w-4" />Number of Persons*</Label>
                <Input id="numPersonsDialog" name="numPersons" type="number" value={numPersons} onChange={(e) => setNumPersons(parseInt(e.target.value) || 1)} min="1" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="locationIdDialog">{currentSelectedLocationType === 'Chambre' ? 'Room' : 'Table'}*</Label>
                <Select
                  value={selectedLocationId || ""}
                  onValueChange={setSelectedLocationId}
                  disabled={availableLocationsForDialog.length === 0 && !originalLocation}
                >
                  <SelectTrigger id="locationIdDialog">
                    <SelectValue placeholder={availableLocationsForDialog.length > 0 ? `Select a ${currentSelectedLocationType?.toLowerCase()}` : `No ${currentSelectedLocationType?.toLowerCase()}s available for criteria`} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLocationsForDialog.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.nom} ({loc.type} - Cap: {loc.capacity || 'N/A'})</SelectItem>)}
                    {availableLocationsForDialog.length === 0 && !originalLocation && <SelectItem value="no_available_placeholder" disabled>No {currentSelectedLocationType?.toLowerCase()}s match criteria</SelectItem>}
                    {originalLocation && !availableLocationsForDialog.some(l => l.id === originalLocation.id) &&
                      <SelectItem value={originalLocation.id} disabled>
                        {originalLocation.nom} (Current, may conflict)
                      </SelectItem>
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clientIdDialog">Registered Client (Optional)</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId} disabled={allHostClients.length === 0}>
                  <SelectTrigger id="clientIdDialog"><SelectValue placeholder="Select registered client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CLIENT_SELECTED}>None (Enter name below)</SelectItem>
                    {allHostClients.map(c => <SelectItem key={c.id} value={c.id}>{c.nom} ({c.email || c.telephone || 'No contact'})</SelectItem>)}
                    {allHostClients.length === 0 && <SelectItem value="no_clients_placeholder_disabled" disabled>No clients registered</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manualClientNameDialog">Or Enter Client Name*</Label>
                <Input id="manualClientNameDialog" name="manualClientName" value={manualClientName} onChange={(e) => setManualClientName(e.target.value)} disabled={selectedClientId !== NO_CLIENT_SELECTED} placeholder="e.g., John Doe" />
              </div>

              {currentSelectedLocationType === 'Chambre' && (
                <div className="flex items-center space-x-2">
                  <Checkbox id="petsAllowedDialog" name="petsAllowed" checked={petsAllowed} onCheckedChange={(checked) => setPetsAllowed(!!checked)} />
                  <Label htmlFor="petsAllowedDialog" className="font-normal"><Dog className="inline mr-1 h-4 w-4" />Pets Allowed</Label>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="statusDialog">Status</Label>
                <Select value={currentStatus} onValueChange={(val) => setCurrentStatus(val as ReservationStatus)}>
                  <SelectTrigger id="statusDialog"><SelectValue /></SelectTrigger>
                  <SelectContent>{reservationStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="channelDialog">Booking Channel (Optional)</Label>
                <Input id="channelDialog" name="channel" value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="e.g., Booking.com, Direct Call" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notesDialog"><FileText className="inline mr-1 h-4 w-4" />Notes</Label>
                <Textarea id="notesDialog" name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., Late check-in, specific requests..." />
              </div>
              
              {reservation.onlineCheckinStatus && reservation.onlineCheckinStatus !== 'not-started' && reservation.onlineCheckinData && (
                <Card className="mt-4 bg-secondary/50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-md flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-blue-600" /> Online Check-in Submitted
                    </CardTitle>
                    <CardDescription className="text-xs">Status: <Badge variant={reservation.onlineCheckinStatus === 'completed' ? 'default' : 'secondary'} className="capitalize">{reservation.onlineCheckinStatus.replace('-', ' ')}</Badge></CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 text-sm space-y-1">
                    <p><strong>Full Name:</strong> {reservation.onlineCheckinData.fullName}</p>
                    <p><strong>Email:</strong> {reservation.onlineCheckinData.email}</p>
                    <p><strong>Birth Date:</strong> {reservation.onlineCheckinData.birthDate && isValid(parseISO(reservation.onlineCheckinData.birthDate)) ? format(parseISO(reservation.onlineCheckinData.birthDate), 'PPP', { locale: fr }) : 'N/A'}</p>
                    <p><strong>Phone:</strong> {reservation.onlineCheckinData.phoneNumber}</p>
                    {reservation.onlineCheckinData.travelReason && <p><strong>Travel Reason:</strong> {reservation.onlineCheckinData.travelReason}</p>}
                    {reservation.onlineCheckinData.additionalNotes && <p><strong>Notes:</strong> {reservation.onlineCheckinData.additionalNotes}</p>}
                    {reservation.onlineCheckinData.submissionDate && <p className="text-xs text-muted-foreground pt-1">Submitted: {format(parseISO(reservation.onlineCheckinData.submissionDate), 'PPP p', { locale: fr })}</p>}

                    <div className="mt-2 flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={copyOnlineCheckinLink} disabled={isSubmitting} className="flex-1">
                        <Copy className="mr-2 h-3.5 w-3.5" /> Copy Check-in Link
                      </Button>
                      {reservation.onlineCheckinStatus === 'pending-review' && (
                        <Button size="sm" onClick={handleReviewOnlineCheckin} disabled={isSubmitting} className="flex-1">
                          Review & Check-in Guest
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete Reservation
          </Button>
          <Button 
            onClick={handleSaveChanges} 
            disabled={
              isSubmitting || 
              !selectedLocationId || 
              (!manualClientName.trim() && selectedClientId === NO_CLIENT_SELECTED) || 
              !arrivalDate || 
              (currentSelectedLocationType === 'Chambre' && (!departureDate || isBefore(startOfDay(departureDate), startOfDay(addDays(arrivalDate,1))) || isSameDay(startOfDay(departureDate), startOfDay(arrivalDate)) ))
            }
          >
            <Save className="mr-2 h-4 w-4" /> {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


export default function HostReservationDetailPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8 px-4"><p>Loading reservation details...</p></div>}>
      <HostReservationDetailPageContent />
    </Suspense>
  );
}
