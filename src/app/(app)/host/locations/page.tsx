
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getRoomsOrTables, addRoomOrTable, updateRoomOrTable as updateLocationInData, deleteRoomOrTable as deleteLocationInData, getSites } from '@/lib/data';
import type { RoomOrTable, Site as GlobalSiteType } from '@/lib/types'; // Renamed Site to GlobalSiteType for clarity
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit2, Trash2, QrCode, Copy, Landmark, Bed, UtensilsIcon, Building } from 'lucide-react';
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

type AssignableParentOption = {
  id: string; // For GlobalSite, this is siteId. For RoomOrTable (type Site), this is its id.
  name: string;
  isGlobalSite: boolean; // True if this option represents a GlobalSite
  actualGlobalSiteId: string; // The globalSiteId to be stored for the new/edited location
  actualParentLocationId?: string; // The parentLocationId to be stored (if not a global site)
};


export default function HostLocationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [locations, setLocations] = useState<RoomOrTable[]>([]);
  const [globalSites, setGlobalSites] = useState<GlobalSiteType[]>([]); // These are the top-level sites managed by Admin
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Partial<RoomOrTable> | null>(null);
  
  const [newLocation, setNewLocation] = useState<{ 
    nom: string; 
    type: "Chambre" | "Table" | "Site"; 
    selectedParentIdentifier: string; // Stores 'globalSite_id' or 'locationSite_id'
  }>({
    nom: '',
    type: 'Chambre',
    selectedParentIdentifier: '',
  });
  const [assignableParentOptions, setAssignableParentOptions] = useState<AssignableParentOption[]>([]);


  const fetchData = useCallback(async (hostId: string) => {
    setIsLoading(true);
    try {
      const [fetchedLocations, fetchedGlobalSites] = await Promise.all([
        getRoomsOrTables(hostId),
        getSites(hostId) // getSites returns Global Sites for this host
      ]);
      setLocations(fetchedLocations);
      setGlobalSites(fetchedGlobalSites);

      // Prepare options for the "Assign To" dropdown
      const parentOpts: AssignableParentOption[] = [];
      fetchedGlobalSites.forEach(gs => {
        parentOpts.push({
          id: gs.siteId, // This ID is used as the value in SelectItem
          name: `${gs.nom} (Global Site)`,
          isGlobalSite: true,
          actualGlobalSiteId: gs.siteId,
          actualParentLocationId: undefined,
        });
      });
      fetchedLocations.filter(loc => loc.type === 'Site').forEach(locSite => {
        parentOpts.push({
          id: locSite.id, // This ID is used as the value in SelectItem
          name: `${locSite.nom} (Area/Zone in ${fetchedGlobalSites.find(gs => gs.siteId === locSite.globalSiteId)?.nom || 'Unknown'})`,
          isGlobalSite: false,
          actualGlobalSiteId: locSite.globalSiteId,
          actualParentLocationId: locSite.id,
        });
      });
      setAssignableParentOptions(parentOpts);

      if (parentOpts.length > 0 && !newLocation.selectedParentIdentifier) {
        setNewLocation(prev => ({ ...prev, selectedParentIdentifier: parentOpts[0].id }));
      } else if (parentOpts.length === 0) {
         setNewLocation(prev => ({ ...prev, selectedParentIdentifier: '' }));
      }

    } catch (error) {
      console.error("Failed to load locations data:", error);
      toast({ title: "Error", description: "Failed to load locations data. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // Removed newLocation.selectedParentIdentifier from deps to avoid loop

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
  
  const handleTypeSelectChange = (value: RoomOrTable['type']) => {
    const currentSetter = editingLocation ? setEditingLocation : setNewLocation;
    currentSetter(prev => ({ 
        ...prev, 
        type: value,
        // If changing type to 'Site', parent must be a Global Site. Reset selection if current parent is not.
        selectedParentIdentifier: value === 'Site' ? 
            (assignableParentOptions.find(opt => opt.id === (prev as any).selectedParentIdentifier && opt.isGlobalSite) ? (prev as any).selectedParentIdentifier : (assignableParentOptions.find(opt => opt.isGlobalSite)?.id || ''))
            : (prev as any).selectedParentIdentifier
    }));
  };

  const handleParentSelectChange = (value: string) => {
    const currentSetter = editingLocation ? setEditingLocation : setNewLocation;
    currentSetter(prev => ({ ...prev, selectedParentIdentifier: value }));
  };

  const handleSubmitLocation = async () => {
    if (!user?.hostId) return;

    const isEditing = !!(editingLocation && editingLocation.id);
    const currentData = isEditing ? editingLocation : newLocation;

    const selectedParentOption = assignableParentOptions.find(opt => opt.id === (currentData as any).selectedParentIdentifier);

    if (!currentData.nom || !selectedParentOption) {
      toast({ title: "Missing Information", description: "Please provide a name and select what it belongs to.", variant: "destructive" });
      return;
    }
    
    // If the location type is 'Site', it cannot have a parentLocationId, only a globalSiteId
    if(currentData.type === 'Site' && !selectedParentOption.isGlobalSite){
        toast({ title: "Invalid Assignment", description: "A 'Site' type location (Area/Zone) can only be assigned directly to a Global Site, not another Area/Zone.", variant: "destructive" });
        return;
    }

    const dataToSubmit: Omit<RoomOrTable, 'id' | 'urlPersonnalise'> = {
      nom: currentData.nom!,
      type: currentData.type!,
      hostId: user.hostId,
      globalSiteId: selectedParentOption.actualGlobalSiteId,
      parentLocationId: currentData.type !== 'Site' ? selectedParentOption.actualParentLocationId : undefined, // Areas/Zones are direct children of Global Sites
    };

    try {
      if (isEditing && editingLocation?.id) { 
        await updateLocationInData(editingLocation.id, dataToSubmit);
        toast({ title: "Location Updated", description: `${dataToSubmit.nom} has been updated.` });
      } else { 
        await addRoomOrTable(dataToSubmit);
        toast({ title: "Location Created", description: `${dataToSubmit.nom} has been added.` });
      }
      fetchData(user.hostId); // Refresh data
    } catch (error) {
      console.error("Failed to save location:", error);
      toast({ title: "Error", description: `Failed to save location. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    }
    
    setIsDialogOpen(false);
    setNewLocation({ nom: '', type: 'Chambre', selectedParentIdentifier: assignableParentOptions.length > 0 ? assignableParentOptions[0].id : '' });
    setEditingLocation(null);
  };
  
  const openAddDialog = () => {
    if (assignableParentOptions.length === 0) {
        toast({ title: "Cannot Add Location", description: "You must have at least one Global Site assigned by an admin, or create an Area/Zone first.", variant: "destructive"});
        return;
    }
    setEditingLocation(null);
    setNewLocation({ 
        nom: '', 
        type: 'Chambre', 
        selectedParentIdentifier: assignableParentOptions.length > 0 ? assignableParentOptions[0].id : '' 
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (locationToEdit: RoomOrTable) => {
    let parentIdentifier = '';
    if (locationToEdit.parentLocationId) {
        parentIdentifier = locationToEdit.parentLocationId;
    } else {
        parentIdentifier = locationToEdit.globalSiteId;
    }
    setEditingLocation({
        ...locationToEdit,
        selectedParentIdentifier: parentIdentifier // Add this to the partial type for editing
    } as Partial<RoomOrTable> & {selectedParentIdentifier: string});
    setIsDialogOpen(true);
  };
  
  const handleDeleteLocationWithConfirmation = async (location: RoomOrTable) => {
     if (!window.confirm(`Are you sure you want to delete "${location.nom}"? Locations parented by this will become unparented.`)) {
        return;
     }
     try {
        await deleteLocationInData(location.id);
        toast({ title: "Location Deleted", description: `Location "${location.nom}" has been deleted.`, variant: "destructive" });
        if (user?.hostId) fetchData(user.hostId);
     } catch (error) {
        console.error("Failed to delete location:", error);
        toast({ title: "Error deleting location", description: `Could not delete the location. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
     }
  };

  const copyUrlToClipboard = (url: string) => {
    if (!url.startsWith('http')) { 
        url = window.location.origin + url;
    }
    navigator.clipboard.writeText(url);
    toast({ title: "Copied to Clipboard", description: "QR Code URL copied!" });
  };

  const getLocationTypeIcon = (type: RoomOrTable['type']) => {
    switch (type) {
      case 'Chambre': return <Bed className="h-5 w-5 text-blue-500" title="Chambre" />;
      case 'Table': return <UtensilsIcon className="h-5 w-5 text-green-500" title="Table" />;
      case 'Site': return <Landmark className="h-5 w-5 text-purple-500" title="Site Area/Zone" />;
      default: return <Building className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const getParentName = (location: RoomOrTable) => {
    if (location.parentLocationId) {
        const parentLoc = locations.find(l => l.id === location.parentLocationId);
        return parentLoc ? `${parentLoc.nom} (Area/Zone)` : 'Unknown Area';
    }
    const globalSite = globalSites.find(gs => gs.siteId === location.globalSiteId);
    return globalSite ? `${globalSite.nom} (Global Site)` : 'Unknown Global Site';
  };


  if (isLoading || authLoading) {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <div> <Skeleton className="h-10 w-72 mb-2" /> <Skeleton className="h-6 w-96" /> </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <Card className="shadow-lg">
                <CardHeader> <Skeleton className="h-8 w-48 mb-2" /> <Skeleton className="h-5 w-64" /> </CardHeader>
                <CardContent> <div className="space-y-4"> {[...Array(3)].map((_, i) => ( <div key={i} className="grid grid-cols-5 gap-4 items-center"> <Skeleton className="h-6 w-full" /> <Skeleton className="h-6 w-full" /> <Skeleton className="h-6 w-full" /> <Skeleton className="h-6 w-full" /> <Skeleton className="h-8 w-full" /> </div> ))} </div> </CardContent>
            </Card>
        </div>
    );
  }
  
  const currentFormData = editingLocation || newLocation;
  const dialogParentOptions = currentFormData.type === 'Site' 
    ? assignableParentOptions.filter(opt => opt.isGlobalSite) 
    : assignableParentOptions;


  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Manage Locations</h1>
          <p className="text-lg text-muted-foreground">Your rooms, tables, site areas, and their QR codes.</p>
        </div>
        <Button onClick={openAddDialog} disabled={assignableParentOptions.length === 0 && globalSites.length === 0}>
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Location
        </Button>
      </div>
      {globalSites.length === 0 && !isLoading && (
        <Card className="mb-6 bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700/50">
          <CardHeader><CardTitle className="text-yellow-700 dark:text-yellow-400">No Global Sites Assigned</CardTitle></CardHeader>
          <CardContent>
            <p className="text-yellow-600 dark:text-yellow-500">You need to be assigned to at least one Global Site (e.g., your hotel or main restaurant) by an administrator before you can add specific locations. Please contact an administrator.</p>
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
                <TableHead>Belongs To / Parent</TableHead>
                <TableHead>QR Code URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium">{loc.nom}</TableCell>
                  <TableCell> <div className="flex items-center gap-2"> {getLocationTypeIcon(loc.type)} <span>{loc.type}</span> </div> </TableCell>
                  <TableCell>{getParentName(loc)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground truncate max-w-xs" title={loc.urlPersonnalise}>{loc.urlPersonnalise}</span>
                      <Button variant="ghost" size="icon" onClick={() => copyUrlToClipboard(loc.urlPersonnalise)} title="Copy URL"> <Copy className="h-4 w-4" /> </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(loc)} title="Edit Location"> <Edit2 className="h-4 w-4" /> </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteLocationWithConfirmation(loc)} title="Delete Location"> <Trash2 className="h-4 w-4" /> </Button>
                    <Button variant="outline" size="icon" title="View QR Code" onClick={() => alert(`QR code for: ${window.location.origin}${loc.urlPersonnalise}`)}> <QrCode className="h-4 w-4" /> </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {locations.length === 0 && <p className="p-4 text-center text-muted-foreground">{globalSites.length > 0 ? 'No locations added yet.' : 'Assign Global Sites first, then add locations.'}</p>}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
            <DialogDescription>
              {editingLocation ? 'Modify details for this location.' : 'Enter details for the new location and assign it appropriately.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">Name</Label>
              <Input id="nom" name="nom" value={currentFormData.nom || ''} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <Select value={currentFormData.type || 'Chambre'} onValueChange={handleTypeSelectChange}>
                <SelectTrigger className="col-span-3"> <SelectValue placeholder="Select type" /> </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chambre">Chambre (Room)</SelectItem>
                  <SelectItem value="Table">Table</SelectItem>
                  <SelectItem value="Site">Site (Area/Zone)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="selectedParentIdentifier" className="text-right">Assign To / Parent</Label>
              <Select 
                value={(currentFormData as any).selectedParentIdentifier || ''} 
                onValueChange={handleParentSelectChange} 
                disabled={dialogParentOptions.length === 0}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={dialogParentOptions.length > 0 ? "Select parent or global site" : "No options available"} />
                </SelectTrigger>
                <SelectContent>
                  {dialogParentOptions.map(opt => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                  ))}
                  {dialogParentOptions.length === 0 && <SelectItem value="" disabled>No Global Sites or Areas available</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitLocation} disabled={(dialogParentOptions.length === 0 && !editingLocation) || !(currentFormData as any).selectedParentIdentifier}>
                {editingLocation ? 'Save Changes' : 'Create Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
