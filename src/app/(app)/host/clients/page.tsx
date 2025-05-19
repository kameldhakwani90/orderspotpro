
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getClients, addClient, updateClient, deleteClient, getRoomsOrTables } from '@/lib/data';
import type { Client, ClientType, RoomOrTable } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit2, Trash2, Users, Hotel, UserCheck, CalendarIcon as CalendarLucideIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const clientTypes: ClientType[] = ["heberge", "passager"];

export default function HostClientsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [hostLocations, setHostLocations] = useState<RoomOrTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentClientData, setCurrentClientData] = useState<{
    nom: string;
    email?: string;
    telephone?: string;
    type: ClientType;
    _dateArrivee?: Date; // For calendar component
    _dateDepart?: Date;  // For calendar component
    locationId?: string;
    notes?: string;
  }>({
    nom: '',
    type: 'passager',
  });

  const fetchData = useCallback(async (hostId: string) => {
    setIsLoading(true);
    try {
      const [clientsData, locationsData] = await Promise.all([
        getClients(hostId),
        getRoomsOrTables(hostId)
      ]);
      setClients(clientsData);
      setHostLocations(locationsData.filter(loc => loc.type === 'Chambre' || loc.type === 'Table')); // Only rooms/tables assignable
    } catch (error) {
      console.error("Failed to load clients or locations:", error);
      toast({ title: "Error", description: "Could not load client data. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== 'host' || !user.hostId) {
        router.replace('/dashboard');
      } else {
        fetchData(user.hostId);
      }
    }
  }, [user, authLoading, router, fetchData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentClientData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: ClientType) => {
    setCurrentClientData(prev => ({ ...prev, type: value }));
  };
  
  const handleLocationChange = (value: string) => {
    setCurrentClientData(prev => ({ ...prev, locationId: value === "NONE" ? undefined : value }));
  };

  const handleDateChange = (field: '_dateArrivee' | '_dateDepart', date?: Date) => {
    setCurrentClientData(prev => ({ ...prev, [field]: date }));
  };

  const handleSubmitClient = async () => {
    if (!user?.hostId) return;
    if (!currentClientData.nom.trim()) {
      toast({ title: "Validation Error", description: "Client name cannot be empty.", variant: "destructive" });
      return;
    }
    if (currentClientData.type === 'heberge') {
        if (!currentClientData._dateArrivee) {
            toast({ title: "Validation Error", description: "Arrival date is required for lodged clients.", variant: "destructive"});
            return;
        }
        if (currentClientData._dateDepart && currentClientData._dateArrivee && currentClientData._dateDepart < currentClientData._dateArrivee) {
            toast({ title: "Validation Error", description: "Departure date cannot be before arrival date.", variant: "destructive"});
            return;
        }
    }

    setIsSubmitting(true);
    const dataToSubmit: Omit<Client, 'id' | 'hostId' | 'documents'> = {
      nom: currentClientData.nom.trim(),
      email: currentClientData.email?.trim() || undefined,
      telephone: currentClientData.telephone?.trim() || undefined,
      type: currentClientData.type,
      dateArrivee: currentClientData.type === 'heberge' && currentClientData._dateArrivee ? format(currentClientData._dateArrivee, 'yyyy-MM-dd') : undefined,
      dateDepart: currentClientData.type === 'heberge' && currentClientData._dateDepart ? format(currentClientData._dateDepart, 'yyyy-MM-dd') : undefined,
      locationId: currentClientData.type === 'heberge' ? currentClientData.locationId : undefined,
      notes: currentClientData.notes?.trim() || undefined,
    };

    try {
      if (editingClient) {
        await updateClient(editingClient.id, dataToSubmit);
        toast({ title: "Client Updated", description: `Client "${dataToSubmit.nom}" has been updated.` });
      } else {
        await addClient({ ...dataToSubmit, hostId: user.hostId });
        toast({ title: "Client Added", description: `Client "${dataToSubmit.nom}" has been added.` });
      }
      fetchData(user.hostId);
    } catch (error) {
      console.error("Failed to save client:", error);
      toast({ title: "Error", description: `Could not save client. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
      setIsDialogOpen(false);
      setEditingClient(null);
      setCurrentClientData({ nom: '', type: 'passager' });
      setIsSubmitting(false);
    }
  };

  const openAddDialog = () => {
    setEditingClient(null);
    setCurrentClientData({
      nom: '',
      email: '',
      telephone: '',
      type: 'passager',
      _dateArrivee: undefined,
      _dateDepart: undefined,
      locationId: undefined,
      notes: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setCurrentClientData({
      nom: client.nom,
      email: client.email || '',
      telephone: client.telephone || '',
      type: client.type,
      _dateArrivee: client.dateArrivee ? parseISO(client.dateArrivee) : undefined,
      _dateDepart: client.dateDepart ? parseISO(client.dateDepart) : undefined,
      locationId: client.locationId || undefined,
      notes: client.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClient = async (client: Client) => {
    if (!user?.hostId || !window.confirm(`Are you sure you want to delete client "${client.nom}"?`)) return;
    setIsSubmitting(true); // Use this to disable buttons during deletion
    try {
      await deleteClient(client.id);
      toast({ title: "Client Deleted", description: `Client "${client.nom}" has been deleted.`, variant: "destructive" });
      fetchData(user.hostId);
    } catch (error) {
      console.error("Failed to delete client:", error);
      toast({ title: "Error", description: `Could not delete client. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div><Skeleton className="h-10 w-72 mb-2" /><Skeleton className="h-6 w-96" /></div>
          <Skeleton className="h-10 w-36" />
        </div>
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-5 w-64" /></CardHeader>
          <CardContent><div className="space-y-4">{[...Array(3)].map((_, i) => (<div key={i} className="grid grid-cols-5 gap-4 items-center"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-8 w-full" /></div>))}</div></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Gestion Clients</h1>
          <p className="text-lg text-muted-foreground">Manage all your registered clients and their information.</p>
        </div>
        <Button onClick={openAddDialog} disabled={isSubmitting}>
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Client
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>Total clients: {clients.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Assigned Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.nom}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold capitalize ${client.type === 'heberge' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {client.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    {client.email && <div>{client.email}</div>}
                    {client.telephone && <div className="text-xs text-muted-foreground">{client.telephone}</div>}
                  </TableCell>
                  <TableCell>
                    {client.type === 'heberge' && client.locationId ? 
                        (hostLocations.find(l => l.id === client.locationId)?.nom || 'N/A') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(client)} title="Edit Client" disabled={isSubmitting}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteClient(client)} title="Delete Client" disabled={isSubmitting}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {clients.length === 0 && <p className="p-4 text-center text-muted-foreground">No clients added yet.</p>}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {if(!isSubmitting) setIsDialogOpen(open)}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
            <DialogDescription>
              {editingClient ? 'Modify the details for this client.' : 'Enter the details for the new client.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">Name*</Label>
              <Input id="nom" name="nom" value={currentClientData.nom} onChange={handleInputChange} className="col-span-3" disabled={isSubmitting} placeholder="e.g., John Doe"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" name="email" type="email" value={currentClientData.email || ''} onChange={handleInputChange} className="col-span-3" disabled={isSubmitting} placeholder="e.g., john.doe@example.com"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telephone" className="text-right">Phone</Label>
              <Input id="telephone" name="telephone" type="tel" value={currentClientData.telephone || ''} onChange={handleInputChange} className="col-span-3" disabled={isSubmitting} placeholder="e.g., +1234567890"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type*</Label>
              <Select value={currentClientData.type} onValueChange={handleTypeChange} disabled={isSubmitting}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {clientTypes.map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {currentClientData.type === 'heberge' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dateArrivee" className="text-right">Arrival*</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`col-span-3 justify-start text-left font-normal ${!currentClientData._dateArrivee && "text-muted-foreground"}`}
                        disabled={isSubmitting}
                      >
                        <CalendarLucideIcon className="mr-2 h-4 w-4" />
                        {currentClientData._dateArrivee ? format(currentClientData._dateArrivee, "PPP") : <span>Pick arrival date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={currentClientData._dateArrivee}
                        onSelect={(date) => handleDateChange('_dateArrivee', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dateDepart" className="text-right">Departure</Label>
                   <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`col-span-3 justify-start text-left font-normal ${!currentClientData._dateDepart && "text-muted-foreground"}`}
                        disabled={isSubmitting || !currentClientData._dateArrivee}
                      >
                        <CalendarLucideIcon className="mr-2 h-4 w-4" />
                        {currentClientData._dateDepart ? format(currentClientData._dateDepart, "PPP") : <span>Pick departure date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={currentClientData._dateDepart}
                        onSelect={(date) => handleDateChange('_dateDepart', date)}
                        disabled={(date) => currentClientData._dateArrivee ? date < currentClientData._dateArrivee : false}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="locationId" className="text-right">Location</Label>
                    <Select value={currentClientData.locationId || "NONE"} onValueChange={handleLocationChange} disabled={isSubmitting || hostLocations.length === 0}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder={hostLocations.length > 0 ? "Assign a room/table" : "No locations available"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NONE">None</SelectItem>
                            {hostLocations.map(loc => (
                                <SelectItem key={loc.id} value={loc.id}>{loc.type} - {loc.nom}</SelectItem>
                            ))}
                            {hostLocations.length === 0 && <SelectItem value="" disabled>Create locations first</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
              </>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">Notes</Label>
              <Textarea id="notes" name="notes" value={currentClientData.notes || ''} onChange={handleInputChange} className="col-span-3" disabled={isSubmitting} placeholder="Any special requests or notes..."/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Documents</Label>
                <div className="col-span-3 text-sm text-muted-foreground italic">
                    (Document upload feature will be available in a future update.)
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmitClient} disabled={isSubmitting}>
              {isSubmitting ? (editingClient ? 'Saving...' : 'Creating...') : (editingClient ? 'Save Changes' : 'Create Client')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    