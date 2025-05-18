
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getRoomsOrTables, addRoomOrTable, getSites } from '@/lib/data';
import type { RoomOrTable, Site } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit2, Trash2, QrCode, Copy } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function HostLocationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [locations, setLocations] = useState<RoomOrTable[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Partial<RoomOrTable> | null>(null);
  
  const [newLocation, setNewLocation] = useState<{ nom: string; type: "Chambre" | "Table"; siteId: string }>({
    nom: '',
    type: 'Chambre',
    siteId: '',
  });

  const fetchData = useCallback(async (hostId: string) => {
    setIsLoading(true);
    try {
      const [locationsData, sitesData] = await Promise.all([
        getRoomsOrTables(hostId),
        getSites(hostId)
      ]);
      setLocations(locationsData);
      setSites(sitesData);
      // Update newLocation.siteId only if it's not already set by user interaction
      // or if the available sites change and the current selection is no longer valid (though this part is not explicitly handled here)
      if (sitesData.length > 0) {
        // If newLocation.siteId is empty or not in the new list of sites, set it to the first available.
        const currentSiteStillExists = sitesData.some(s => s.siteId === newLocation.siteId);
        if (!newLocation.siteId || !currentSiteStillExists) {
            setNewLocation(prev => ({...prev, siteId: sitesData[0].siteId}));
        }
      } else {
        // No sites available, clear siteId for new location form
        setNewLocation(prev => ({...prev, siteId: ''}));
      }
    } catch (error) {
      console.error("Failed to load locations data:", error);
      toast({ title: "Error", description: "Failed to load locations data. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // Removed setNewLocation, newLocation.siteId from deps as it's handled internally or by user.

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== 'host' || !user?.hostId) {
        router.replace('/dashboard');
      } else {
        fetchData(user.hostId);
      }
    }
  }, [user, authLoading, router, fetchData]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | { name: string, value: string }) => {
    const { name, value } = 'target' in e ? e.target : e;
    const currentSetter = editingLocation ? setEditingLocation : setNewLocation;
    currentSetter(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    const currentSetter = editingLocation ? setEditingLocation : setNewLocation;
    currentSetter(prev => ({ ...prev, [name]: value }));
  };


  const handleSubmitLocation = async () => {
    if (!user?.hostId) return;

    const dataToSubmit = editingLocation ? 
      { ...editingLocation, hostId: user.hostId } : 
      { ...newLocation, hostId: user.hostId };

    if (!dataToSubmit.nom || !dataToSubmit.siteId) {
      toast({ title: "Missing Information", description: "Please provide a name and select a site.", variant: "destructive" });
      return;
    }

    // Prevent submission if selected siteId is not valid
    if (!sites.some(s => s.siteId === dataToSubmit.siteId)) {
        toast({ title: "Invalid Site", description: "Please select a valid site.", variant: "destructive" });
        return;
    }


    if (editingLocation && editingLocation.id) { // Update logic
      // Simulate update: In a real app, this would be an API call.
      // For now, we'll update the local state and show a toast.
      // This assumes `updateRoomOrTable` function exists or you handle it like `addRoomOrTable`.
      // For simplicity, let's just refetch data to reflect changes.
      // await updateRoomOrTable(editingLocation.id, dataToSubmit); // Example
      setLocations(prev => prev.map(loc => loc.id === editingLocation.id ? { ...loc, ...dataToSubmit } as RoomOrTable : loc));
      toast({ title: "Location Updated", description: `${dataToSubmit.nom} has been updated.` });
    } else { // Add new location
      try {
        // The addRoomOrTable function from data.ts will create the ID and urlPersonnalise
        const createdLocation = await addRoomOrTable(dataToSubmit as Omit<RoomOrTable, 'id' | 'urlPersonnalise'>);
        // No need to manually push, fetchData will refresh the list
        toast({ title: "Location Created", description: `${createdLocation.nom} has been added.` });
      } catch (error) {
        console.error("Failed to create location:", error);
        toast({ title: "Error", description: `Failed to create location. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
      }
    }
    setIsDialogOpen(false);
    // Fetch data again to get the latest list including the new or updated item
    if (user?.hostId) {
        fetchData(user.hostId);
    }
    setNewLocation({ nom: '', type: 'Chambre', siteId: sites.length > 0 ? sites[0].siteId : '' });
    setEditingLocation(null);
  };
  
  const openAddDialog = () => {
    setEditingLocation(null);
    // Ensure newLocation.siteId is set to the first available site, or empty if no sites
    setNewLocation({ nom: '', type: 'Chambre', siteId: sites.length > 0 ? sites[0].siteId : '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (locationToEdit: RoomOrTable) => {
    // Ensure all properties are correctly spread for editing
    setEditingLocation({
      id: locationToEdit.id,
      nom: locationToEdit.nom,
      type: locationToEdit.type,
      siteId: locationToEdit.siteId,
      hostId: locationToEdit.hostId,
      urlPersonnalise: locationToEdit.urlPersonnalise
    });
    setIsDialogOpen(true);
  };
  
  const handleDeleteLocation = (locationId: string) => {
     // Simulate deletion: In a real app, this would be an API call.
     // For now, we'll filter the local state and show a toast.
     // This assumes `deleteRoomOrTable` function exists or you handle it similarly.
     // await deleteRoomOrTable(locationId); // Example
     setLocations(prevLocations => prevLocations.filter(loc => loc.id !== locationId));
     toast({ title: "Location Deleted", description: `Location has been deleted (simulated).`, variant: "destructive" });
     // Optionally, refetch data if the source of truth is external:
     // if (user?.hostId) fetchData(user.hostId);
  };

  const copyUrlToClipboard = (url: string) => {
    if (!url.startsWith('http')) { // Ensure it's a full URL if not already
        url = window.location.origin + url;
    }
    navigator.clipboard.writeText(url);
    toast({ title: "Copied to Clipboard", description: "QR Code URL copied!" });
  };


  if (isLoading || authLoading) {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Skeleton className="h-10 w-72 mb-2" />
                    <Skeleton className="h-6 w-96" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-5 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="grid grid-cols-5 gap-4 items-center">
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-8 w-full" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  const currentFormData = editingLocation || newLocation;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Manage Locations</h1>
          <p className="text-lg text-muted-foreground">Your rooms, tables, and their QR codes.</p>
        </div>
        <Button onClick={openAddDialog} disabled={sites.length === 0}>
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Location
        </Button>
      </div>
      {sites.length === 0 && !isLoading && ( // Ensure not to show this during initial load
        <Card className="mb-6 bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700/50">
          <CardHeader>
            <CardTitle className="text-yellow-700 dark:text-yellow-400">No Sites Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-600 dark:text-yellow-500">You need to have at least one site registered to add locations. If you are an administrator, you can manage sites in the admin dashboard. Otherwise, please contact an administrator if no sites are linked to your host account.</p>
            {user?.role === 'admin' && (
                 <Button variant="link" onClick={() => router.push('/admin/sites')} className="text-yellow-700 dark:text-yellow-400 px-0">
                    Go to Manage Global Sites
                </Button>
            )}
          </CardContent>
        </Card>
      )}


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>My Locations</CardTitle>
          <CardDescription>List of your registered locations. Current count: {locations.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>QR Code URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium">{loc.nom}</TableCell>
                  <TableCell>{loc.type}</TableCell>
                  <TableCell>{sites.find(s => s.siteId === loc.siteId)?.nom || loc.siteId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground truncate max-w-xs" title={loc.urlPersonnalise}>{loc.urlPersonnalise}</span>
                      <Button variant="ghost" size="icon" onClick={() => copyUrlToClipboard(loc.urlPersonnalise)} title="Copy URL">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(loc)} title="Edit Location">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteLocation(loc.id)} title="Delete Location">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" title="View QR Code" onClick={() => alert(`QR code for: ${window.location.origin}${loc.urlPersonnalise}`)}>
                        <QrCode className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {locations.length === 0 && <p className="p-4 text-center text-muted-foreground">No locations added yet. Please add a location using the button above.</p>}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
            <DialogDescription>
              {editingLocation ? 'Modify details for this location.' : 'Enter details for the new location and assign it to a site.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">Name</Label>
              <Input id="nom" name="nom" value={currentFormData.nom || ''} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <Select value={currentFormData.type || 'Chambre'} onValueChange={(value) => handleSelectChange('type', value as "Chambre" | "Table")}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chambre">Chambre</SelectItem>
                  <SelectItem value="Table">Table</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="siteId" className="text-right">Site</Label>
              <Select value={currentFormData.siteId || ''} onValueChange={(value) => handleSelectChange('siteId', value)} disabled={sites.length === 0}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={sites.length > 0 ? "Select site" : "No sites available"} />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem key={site.siteId} value={site.siteId}>{site.nom}</SelectItem>
                  ))}
                  {sites.length === 0 && <SelectItem value="" disabled>No sites available to assign</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitLocation} disabled={(sites.length === 0 && !editingLocation) || !currentFormData.siteId}>
                {editingLocation ? 'Save Changes' : 'Create Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    