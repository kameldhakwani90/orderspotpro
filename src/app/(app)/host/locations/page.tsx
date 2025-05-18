
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
import { PlusCircle, Edit2, Trash2, QrCode, Copy, Landmark } from 'lucide-react'; // Added Landmark for "Site" type
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
  
  const [newLocation, setNewLocation] = useState<{ nom: string; type: "Chambre" | "Table" | "Site"; siteId: string }>({
    nom: '',
    type: 'Chambre', // Default to Chambre
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
      if (sitesData.length > 0) {
        const currentSiteStillExists = sitesData.some(s => s.siteId === newLocation.siteId);
        if (!newLocation.siteId || !currentSiteStillExists) {
            setNewLocation(prev => ({...prev, siteId: sitesData[0].siteId}));
        }
      } else {
        setNewLocation(prev => ({...prev, siteId: ''}));
      }
    } catch (error) {
      console.error("Failed to load locations data:", error);
      toast({ title: "Error", description: "Failed to load locations data. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, newLocation.siteId]); // Removed setNewLocation from deps

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

    if (!sites.some(s => s.siteId === dataToSubmit.siteId)) {
        toast({ title: "Invalid Site", description: "Please select a valid site.", variant: "destructive" });
        return;
    }


    if (editingLocation && editingLocation.id) { 
      setLocations(prev => prev.map(loc => loc.id === editingLocation.id ? { ...loc, ...dataToSubmit } as RoomOrTable : loc));
      toast({ title: "Location Updated", description: `${dataToSubmit.nom} has been updated.` });
    } else { 
      try {
        const createdLocation = await addRoomOrTable(dataToSubmit as Omit<RoomOrTable, 'id' | 'urlPersonnalise'>);
        toast({ title: "Location Created", description: `${createdLocation.nom} has been added.` });
      } catch (error) {
        console.error("Failed to create location:", error);
        toast({ title: "Error", description: `Failed to create location. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
      }
    }
    setIsDialogOpen(false);
    if (user?.hostId) {
        fetchData(user.hostId);
    }
    setNewLocation({ nom: '', type: 'Chambre', siteId: sites.length > 0 ? sites[0].siteId : '' });
    setEditingLocation(null);
  };
  
  const openAddDialog = () => {
    setEditingLocation(null);
    setNewLocation({ nom: '', type: 'Chambre', siteId: sites.length > 0 ? sites[0].siteId : '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (locationToEdit: RoomOrTable) => {
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
     setLocations(prevLocations => prevLocations.filter(loc => loc.id !== locationId));
     toast({ title: "Location Deleted", description: `Location has been deleted (simulated).`, variant: "destructive" });
  };

  const copyUrlToClipboard = (url: string) => {
    if (!url.startsWith('http')) { 
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

  const getLocationTypeIcon = (type: RoomOrTable['type']) => {
    switch (type) {
      case 'Chambre': return <span title="Chambre" className="text-blue-500">🛌</span>;
      case 'Table': return <span title="Table" className="text-green-500">🍽️</span>;
      case 'Site': return <Landmark className="h-5 w-5 text-purple-500" title="Site Location" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Manage Locations</h1>
          <p className="text-lg text-muted-foreground">Your rooms, tables, sites, and their QR codes.</p>
        </div>
        <Button onClick={openAddDialog} disabled={sites.length === 0}>
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Location
        </Button>
      </div>
      {sites.length === 0 && !isLoading && (
        <Card className="mb-6 bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700/50">
          <CardHeader>
            <CardTitle className="text-yellow-700 dark:text-yellow-400">No Global Sites Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-600 dark:text-yellow-500">You need to have at least one global site (e.g., your hotel or main restaurant) registered to add specific locations like rooms, tables, or site areas. If you are an administrator, please manage global sites in the admin dashboard. Otherwise, contact an administrator.</p>
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
                <TableHead>Belongs to Site</TableHead>
                <TableHead>QR Code URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium">{loc.nom}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getLocationTypeIcon(loc.type)}
                      <span>{loc.type}</span>
                    </div>
                  </TableCell>
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
              {editingLocation ? 'Modify details for this location.' : 'Enter details for the new location and assign it to a global site.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">Name</Label>
              <Input id="nom" name="nom" value={currentFormData.nom || ''} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <Select value={currentFormData.type || 'Chambre'} onValueChange={(value) => handleSelectChange('type', value as "Chambre" | "Table" | "Site")}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chambre">Chambre (Room)</SelectItem>
                  <SelectItem value="Table">Table</SelectItem>
                  <SelectItem value="Site">Site (Area/Zone)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="siteId" className="text-right">Belongs to Site</Label>
              <Select value={currentFormData.siteId || ''} onValueChange={(value) => handleSelectChange('siteId', value)} disabled={sites.length === 0}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={sites.length > 0 ? "Select global site" : "No global sites available"} />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem key={site.siteId} value={site.siteId}>{site.nom}</SelectItem>
                  ))}
                  {sites.length === 0 && <SelectItem value="" disabled>No global sites to assign to</SelectItem>}
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
