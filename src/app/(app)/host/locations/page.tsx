
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getRoomsOrTables, addRoomOrTable, updateRoomOrTable as updateLocationInData, deleteRoomOrTable as deleteLocationInData, getSites } from '@/lib/data';
import type { RoomOrTable, Site as GlobalSiteType } from '@/lib/types'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit2, Trash2, QrCode, Copy, Landmark, Bed, UtensilsIcon as Utensils, Building, Users } from 'lucide-react'; // Renamed UtensilsIcon to Utensils
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
  id: string; 
  name: string;
  isGlobalSite: boolean; 
  actualGlobalSiteId: string; 
  actualParentLocationId?: string; 
};


export default function HostLocationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [locations, setLocations] = useState<RoomOrTable[]>([]);
  const [globalSites, setGlobalSites] = useState<GlobalSiteType[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Partial<RoomOrTable> & {selectedParentIdentifier?: string} | null>(null);
  
  const [newLocation, setNewLocation] = useState<{ 
    nom: string; 
    type: "Chambre" | "Table" | "Site"; 
    selectedParentIdentifier: string; 
    capacity?: number;
  }>({
    nom: '',
    type: 'Chambre',
    selectedParentIdentifier: '',
    capacity: undefined,
  });
  const [assignableParentOptions, setAssignableParentOptions] = useState<AssignableParentOption[]>([]);


  const fetchData = useCallback(async (hostId: string) => {
    setIsLoading(true);
    try {
      const [fetchedLocations, fetchedGlobalSites] = await Promise.all([
        getRoomsOrTables(hostId),
        getSites(hostId) 
      ]);
      setLocations(fetchedLocations);
      setGlobalSites(fetchedGlobalSites);

      const parentOpts: AssignableParentOption[] = [];
      fetchedGlobalSites.forEach(gs => {
        parentOpts.push({
          id: gs.siteId, 
          name: `${gs.nom} (Global Site)`,
          isGlobalSite: true,
          actualGlobalSiteId: gs.siteId,
          actualParentLocationId: undefined,
        });
      });
      fetchedLocations.filter(loc => loc.type === 'Site').forEach(locSite => {
        parentOpts.push({
          id: locSite.id, 
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
  }, [toast, newLocation.selectedParentIdentifier]); 

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== 'host' || !user?.hostId) {
        router.replace('/dashboard');
      } else {
        fetchData(user.hostId);
      }
    }
  }, [user, authLoading, router, fetchData]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | { name: string, value: string | number }) => {
    let { name, value } = 'target' in e ? e.target : e;
    
    if (name === 'capacity' && typeof value === 'string') {
        value = parseInt(value, 10);
        if (isNaN(value)) value = undefined; // or 0, depending on preference
    }

    const currentSetter = editingLocation ? setEditingLocation : setNewLocation;
    currentSetter(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTypeSelectChange = (value: RoomOrTable['type']) => {
    const currentSetter = editingLocation ? setEditingLocation : setNewLocation;
    currentSetter(prev => ({ 
        ...prev, 
        type: value,
        selectedParentIdentifier: (prev as any).selectedParentIdentifier,
        // Reset capacity if type changes to 'Site' as it's not relevant for Site type
        capacity: value === 'Site' ? undefined : (prev as any).capacity, 
    }));
  };

  const handleParentSelectChange = (value: string) => {
    const currentSetter = editingLocation ? setEditingLocation : setNewLocation;
    currentSetter(prev => ({ ...prev, selectedParentIdentifier: value }));
  };

  const handleSubmitLocation = async () => {
    if (!user?.hostId) return;
    setIsSubmitting(true);

    const isEditing = !!(editingLocation && editingLocation.id);
    const currentData = editingLocation || newLocation;

    const selectedParentOption = assignableParentOptions.find(opt => opt.id === (currentData as any).selectedParentIdentifier);

    if (!currentData.nom || !selectedParentOption) {
      toast({ title: "Missing Information", description: "Please provide a name and select what it belongs to.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if ((currentData.type === 'Chambre' || currentData.type === 'Table') && (currentData.capacity === undefined || currentData.capacity <= 0)) {
        toast({ title: "Invalid Capacity", description: "Please provide a valid positive capacity for rooms and tables.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    
    const dataToSubmit: Omit<RoomOrTable, 'id' | 'urlPersonnalise'> = {
      nom: currentData.nom!,
      type: currentData.type!,
      hostId: user.hostId,
      globalSiteId: selectedParentOption.actualGlobalSiteId,
      parentLocationId: currentData.type === 'Site' ? undefined : selectedParentOption.actualParentLocationId, // An Area/Zone ('Site') is parented by a GlobalSite or another Area/Zone (selectedParentOption handles this for its own children)
      // if currentData.type is 'Site', its parentLocationId should be based on if selectedParentOption is a GlobalSite (undefined) or another 'Site' (actualParentLocationId)
      // This needs careful re-evaluation
      capacity: (currentData.type === 'Chambre' || currentData.type === 'Table') ? currentData.capacity : undefined,
    };

     if (currentData.type === 'Site') { // A host-created Site (Area/Zone)
        if (selectedParentOption.isGlobalSite) {
            dataToSubmit.parentLocationId = undefined; // Parent is a Global Site
        } else {
            dataToSubmit.parentLocationId = selectedParentOption.actualParentLocationId; // Parent is another Area/Zone
        }
    } else { // Room or Table
        dataToSubmit.parentLocationId = selectedParentOption.actualParentLocationId; // Could be undefined if parented by Global Site, or an ID if parented by an Area/Zone
    }


    try {
      if (isEditing && editingLocation?.id) { 
        await updateLocationInData(editingLocation.id, dataToSubmit);
        toast({ title: "Location Updated", description: `${dataToSubmit.nom} has been updated.` });
      } else { 
        await addRoomOrTable(dataToSubmit);
        toast({ title: "Location Created", description: `${dataToSubmit.nom} has been added.` });
      }
      if (user.hostId) fetchData(user.hostId); 
    } catch (error) {
      console.error("Failed to save location:", error);
      toast({ title: "Error", description: `Failed to save location. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    }
    
    setIsDialogOpen(false);
    setNewLocation({ nom: '', type: 'Chambre', selectedParentIdentifier: assignableParentOptions.length > 0 ? assignableParentOptions[0].id : '', capacity: undefined });
    setEditingLocation(null);
    setIsSubmitting(false);
  };
  
  const openAddDialog = () => {
    if (assignableParentOptions.length === 0 && globalSites.length === 0) {
        toast({ title: "Cannot Add Location", description: "You must have at least one Global Site assigned by an admin.", variant: "destructive"});
        return;
    }
    setEditingLocation(null);
    setNewLocation({ 
        nom: '', 
        type: 'Chambre', 
        selectedParentIdentifier: assignableParentOptions.length > 0 ? assignableParentOptions[0].id : '',
        capacity: undefined,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (locationToEdit: RoomOrTable) => {
    let parentIdentifier = '';
    // If the location has a parentLocationId, it means it's parented by another 'Site' (Area/Zone)
    // We need to find the option in assignableParentOptions that corresponds to this parent 'Site' Area/Zone
    if (locationToEdit.parentLocationId) { 
        const parentOption = assignableParentOptions.find(opt => !opt.isGlobalSite && opt.actualParentLocationId === locationToEdit.parentLocationId);
        parentIdentifier = parentOption ? parentOption.id : locationToEdit.globalSiteId; 
    } else { // If no parentLocationId, it's directly parented by a Global Site
        parentIdentifier = locationToEdit.globalSiteId;
    }

    setEditingLocation({
        ...locationToEdit,
        selectedParentIdentifier: parentIdentifier 
    });
    setIsDialogOpen(true);
  };
  
  const handleDeleteLocationWithConfirmation = async (location: RoomOrTable) => {
     if (!window.confirm(`Are you sure you want to delete "${location.nom}"? Locations parented by this will also be affected.`)) {
        return;
     }
     setIsSubmitting(true);
     try {
        await deleteLocationInData(location.id);
        toast({ title: "Location Deleted", description: `Location "${location.nom}" has been deleted.`, variant: "destructive" });
        if (user?.hostId) fetchData(user.hostId);
     } catch (error) {
        console.error("Failed to delete location:", error);
        toast({ title: "Error deleting location", description: `Could not delete the location. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
     }
     setIsSubmitting(false);
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
      case 'Table': return <Utensils className="h-5 w-5 text-green-500" title="Table" />;
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
                <CardContent> <div className="space-y-4"> {[...Array(3)].map((_, i) => ( <div key={i} className="grid grid-cols-6 gap-4 items-center"> <Skeleton className="h-6 w-full" /> <Skeleton className="h-6 w-full" /> <Skeleton className="h-6 w-full" /> <Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /> <Skeleton className="h-8 w-full" /> </div> ))} </div> </CardContent>
            </Card>
        </div>
    );
  }
  
  const currentFormData = editingLocation || newLocation;
  
  let dialogParentOptions = assignableParentOptions;
  if (editingLocation && editingLocation.id) {
      dialogParentOptions = assignableParentOptions.filter(opt => opt.id !== editingLocation.id);
  }


  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Manage Locations</h1>
          <p className="text-lg text-muted-foreground">Your rooms, tables, site areas, and their QR codes.</p>
        </div>
        <Button onClick={openAddDialog} disabled={isSubmitting || (assignableParentOptions.length === 0 && globalSites.length === 0)}>
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
                <TableHead>Capacity</TableHead>
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
                  <TableCell>{loc.capacity ?? 'N/A'}</TableCell>
                  <TableCell>{getParentName(loc)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground truncate max-w-xs" title={loc.urlPersonnalise}>{loc.urlPersonnalise}</span>
                      <Button variant="ghost" size="icon" onClick={() => copyUrlToClipboard(loc.urlPersonnalise)} title="Copy URL" disabled={isSubmitting}> <Copy className="h-4 w-4" /> </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(loc)} title="Edit Location" disabled={isSubmitting}> <Edit2 className="h-4 w-4" /> </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteLocationWithConfirmation(loc)} title="Delete Location" disabled={isSubmitting}> <Trash2 className="h-4 w-4" /> </Button>
                    <Button variant="outline" size="icon" title="View QR Code" onClick={() => alert(`QR code for: ${window.location.origin}${loc.urlPersonnalise}`)} disabled={isSubmitting}> <QrCode className="h-4 w-4" /> </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {locations.length === 0 && <p className="p-4 text-center text-muted-foreground">{globalSites.length > 0 ? 'No locations added yet.' : 'Assign Global Sites first, then add locations.'}</p>}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {if(!isSubmitting) setIsDialogOpen(open)}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
            <DialogDescription>
              {editingLocation ? 'Modify details for this location.' : 'Enter details for the new location and assign it appropriately.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">Name*</Label>
              <Input id="nom" name="nom" value={currentFormData.nom || ''} onChange={handleInputChange} className="col-span-3" disabled={isSubmitting} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type*</Label>
              <Select value={currentFormData.type || 'Chambre'} onValueChange={handleTypeSelectChange} disabled={isSubmitting}>
                <SelectTrigger className="col-span-3"> <SelectValue placeholder="Select type" /> </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chambre">Chambre (Room)</SelectItem>
                  <SelectItem value="Table">Table</SelectItem>
                  <SelectItem value="Site">Site (Area/Zone)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(currentFormData.type === 'Chambre' || currentFormData.type === 'Table') && (
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="capacity" className="text-right"><Users className="inline h-4 w-4 mr-1"/>Capacity*</Label>
                    <Input id="capacity" name="capacity" type="number" value={currentFormData.capacity ?? ''} onChange={handleInputChange} className="col-span-3" placeholder="e.g. 4" min="1" disabled={isSubmitting} />
                 </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="selectedParentIdentifier" className="text-right">Assign To / Parent*</Label>
              <Select 
                value={(currentFormData as any).selectedParentIdentifier || ''} 
                onValueChange={handleParentSelectChange} 
                disabled={isSubmitting || dialogParentOptions.length === 0}
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button 
                onClick={handleSubmitLocation} 
                disabled={isSubmitting || (dialogParentOptions.length === 0 && !editingLocation) || !(currentFormData as any).selectedParentIdentifier || !currentFormData.nom || ((currentFormData.type === 'Chambre' || currentFormData.type === 'Table') && (!currentFormData.capacity || currentFormData.capacity <=0))}
            >
                {editingLocation ? (isSubmitting ? 'Saving...' : 'Save Changes') : (isSubmitting ? 'Creating...' : 'Create Location')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

