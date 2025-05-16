
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getRoomsOrTables, addRoomOrTable, getSites } from '@/lib/data'; // Assuming getSites for host
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

  useEffect(() => {
    if (!authLoading && user?.role !== 'host') {
      router.replace('/dashboard');
    } else if (user?.hostId) {
      fetchData(user.hostId);
    }
  }, [user, authLoading, router]);

  const fetchData = async (hostId: string) => {
    setIsLoading(true);
    try {
      const [locationsData, sitesData] = await Promise.all([
        getRoomsOrTables(hostId),
        getSites(hostId) // Fetch sites specific to this host
      ]);
      setLocations(locationsData);
      setSites(sitesData);
      if (sitesData.length > 0 && !newLocation.siteId) {
        setNewLocation(prev => ({...prev, siteId: sitesData[0].siteId}));
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load locations data.", variant: "destructive" });
    }
    setIsLoading(false);
  };

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
      toast({ title: "Missing Information", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    if (editingLocation) { // Update logic (simplified)
      // const updatedLocations = locations.map(loc => loc.id === editingLocation.id ? { ...loc, ...dataToSubmit } as RoomOrTable : loc);
      // setLocations(updatedLocations);
      toast({ title: "Location Updated", description: `${dataToSubmit.nom} has been updated (simulated).` });
    } else { // Add new location
      try {
        const createdLocation = await addRoomOrTable(dataToSubmit as Omit<RoomOrTable, 'id' | 'urlPersonnalise'>);
        setLocations(prev => [...prev, createdLocation]);
        toast({ title: "Location Created", description: `${createdLocation.nom} has been added.` });
      } catch (error) {
        toast({ title: "Error", description: "Failed to create location.", variant: "destructive" });
      }
    }
    setIsDialogOpen(false);
    setNewLocation({ nom: '', type: 'Chambre', siteId: sites.length > 0 ? sites[0].siteId : '' });
    setEditingLocation(null);
  };
  
  const openAddDialog = () => {
    setEditingLocation(null);
    setNewLocation({ nom: '', type: 'Chambre', siteId: sites.length > 0 ? sites[0].siteId : '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (locationToEdit: RoomOrTable) => {
    setEditingLocation({...locationToEdit});
    setIsDialogOpen(true);
  };
  
  const handleDeleteLocation = (locationId: string) => {
     // setLocations(locations.filter(loc => loc.id !== locationId));
     toast({ title: "Location Deleted", description: `Location has been deleted (simulated).`, variant: "destructive" });
  };

  const copyUrlToClipboard = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url); // Use full URL
    toast({ title: "Copied to Clipboard", description: "QR Code URL copied!" });
  };


  if (isLoading || authLoading) {
    return <div className="p-6">Loading locations...</div>;
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
      {sites.length === 0 && (
        <Card className="mb-6 bg-yellow-50 border-yellow-300">
          <CardHeader>
            <CardTitle className="text-yellow-700">No Sites Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-600">You need to have at least one site registered to add locations. Please contact an administrator if you don't have any sites linked to your host account.</p>
            {/* Potentially link to a "Manage Sites" page if hosts can create sites */}
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
                     {/* Placeholder for actual QR code display/generation tool */}
                    <Button variant="outline" size="icon" title="View QR Code (placeholder)" onClick={() => alert(`QR code for: ${window.location.origin}${loc.urlPersonnalise}`)}>
                        <QrCode className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {locations.length === 0 && <p className="p-4 text-center text-muted-foreground">No locations added yet.</p>}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
            <DialogDescription>
              {editingLocation ? 'Modify details for this location.' : 'Enter details for the new location.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">Name</Label>
              <Input id="nom" name="nom" value={currentFormData.nom || ''} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <Select value={currentFormData.type || 'Chambre'} onValueChange={(value) => handleSelectChange('type', value)}>
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
              <Select value={currentFormData.siteId || ''} onValueChange={(value) => handleSelectChange('siteId', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem key={site.siteId} value={site.siteId}>{site.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitLocation} disabled={sites.length === 0 && !editingLocation}>{editingLocation ? 'Save Changes' : 'Create Location'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
