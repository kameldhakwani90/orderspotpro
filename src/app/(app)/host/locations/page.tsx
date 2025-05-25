
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  getRoomsOrTables, 
  addRoomOrTable, 
  updateRoomOrTable as updateLocationInData, 
  deleteRoomOrTable as deleteLocationInData, 
  getSites as fetchGlobalSitesForHost, // Renamed for clarity
  getTags as fetchHostTags 
} from '@/lib/data';
import type { RoomOrTable, Site as GlobalSiteType, Tag } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PlusCircle, Edit2, Trash2, QrCode, Copy, Landmark, Bed, Utensils, Building, Users, 
  Tag as TagIconLucide, FileImage, Info, CopyPlus, DollarSign, ChevronRight, ChevronDown, FolderPlus
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import NextImage from 'next/image';
import { PREDEFINED_AMENITIES, AmenityCategory } from '@/lib/amenities';
import { cn } from '@/lib/utils';

type AssignableParentOption = {
  id: string;
  name: string;
  isGlobalSite: boolean;
  actualGlobalSiteId: string;
  actualParentLocationId?: string;
};

interface TreeNode {
  id: string;
  name: string;
  type: 'GlobalSite' | RoomOrTable['type'];
  data: GlobalSiteType | RoomOrTable;
  children: TreeNode[];
  depth: number;
}

const buildLocationTree = (globalSites: GlobalSiteType[], locations: RoomOrTable[]): TreeNode[] => {
  const tree: TreeNode[] = [];
  const locationsMap = new Map<string, RoomOrTable & { treeChildren?: TreeNode[] }>(
    locations.map(loc => [loc.id, { ...loc, treeChildren: [] }])
  );

  const createNode = (item: RoomOrTable, depth: number): TreeNode => {
    const children: TreeNode[] = [];
    locations.forEach(childLoc => {
      if (childLoc.parentLocationId === item.id) {
        children.push(createNode(childLoc, depth + 1));
      }
    });
    return {
      id: item.id,
      name: item.nom,
      type: item.type,
      data: item,
      children: children.sort((a, b) => a.name.localeCompare(b.name)),
      depth,
    };
  };

  globalSites.forEach(gs => {
    const globalSiteNode: TreeNode = {
      id: gs.siteId,
      name: gs.nom,
      type: 'GlobalSite',
      data: gs,
      children: [],
      depth: 0,
    };
    locations.forEach(loc => {
      if (loc.globalSiteId === gs.siteId && !loc.parentLocationId) {
        globalSiteNode.children.push(createNode(loc, 1));
      }
    });
    globalSiteNode.children.sort((a, b) => a.name.localeCompare(b.name));
    tree.push(globalSiteNode);
  });

  return tree.sort((a, b) => a.name.localeCompare(b.name));
};


export default function HostLocationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [allLocations, setAllLocations] = useState<RoomOrTable[]>([]);
  const [globalSites, setGlobalSites] = useState<GlobalSiteType[]>([]);
  const [hostTags, setHostTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Partial<RoomOrTable> & {selectedParentIdentifier?: string} | null>(null);
  
  const [locationTree, setLocationTree] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});


  const [currentLocationData, setCurrentLocationData] = useState<{
    nom: string;
    type: "Chambre" | "Table" | "Site";
    selectedParentIdentifier: string; // Can be GlobalSite ID or parent RoomOrTable ID of type 'Site'
    capacity?: number;
    tagIds?: string[];
    description?: string;
    imageUrlsString?: string;
    amenityIds?: string[];
    prixParNuit?: number;
    prixFixeReservation?: number;
  }>({
    nom: '',
    type: 'Chambre',
    selectedParentIdentifier: '',
    capacity: undefined,
    tagIds: [],
    description: '',
    imageUrlsString: '',
    amenityIds: [],
    prixParNuit: undefined,
    prixFixeReservation: undefined,
  });
  
  const assignableParentOptions = useMemo((): AssignableParentOption[] => {
    const options: AssignableParentOption[] = [];
    globalSites.forEach(gs => {
      options.push({
        id: gs.siteId,
        name: `${gs.nom} (Global Site)`,
        isGlobalSite: true,
        actualGlobalSiteId: gs.siteId,
      });
    });
    allLocations.filter(loc => loc.type === 'Site').forEach(locSite => {
      const parentGlobalSite = globalSites.find(gs => gs.siteId === locSite.globalSiteId);
      options.push({
        id: locSite.id,
        name: `${locSite.nom} (Area in ${parentGlobalSite?.nom || 'Unknown'})`,
        isGlobalSite: false,
        actualGlobalSiteId: locSite.globalSiteId,
        actualParentLocationId: locSite.id,
      });
    });
    return options.sort((a,b) => a.name.localeCompare(b.name));
  }, [globalSites, allLocations]);


  const fetchData = useCallback(async (hostId: string) => {
    setIsLoading(true);
    try {
      const [fetchedLocations, fetchedGlobalSites, fetchedTags] = await Promise.all([
        getRoomsOrTables(hostId),
        fetchGlobalSitesForHost(hostId),
        fetchHostTags(hostId)
      ]);
      setAllLocations(fetchedLocations);
      setGlobalSites(fetchedGlobalSites);
      setHostTags(fetchedTags);
      setLocationTree(buildLocationTree(fetchedGlobalSites, fetchedLocations));

      if (assignableParentOptions.length > 0 && !currentLocationData.selectedParentIdentifier) {
        // setCurrentLocationData(prev => ({ ...prev, selectedParentIdentifier: assignableParentOptions[0].id }));
      }
    } catch (error) {
      console.error("Failed to load locations data:", error);
      toast({ title: "Error", description: "Failed to load locations data. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, assignableParentOptions, currentLocationData.selectedParentIdentifier]); // assignableParentOptions added

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== 'host' || !user?.hostId) {
        router.replace('/dashboard');
      } else {
        fetchData(user.hostId);
      }
    }
  }, [user, authLoading, router, fetchData]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { name: string, value: string | number }) => {
    let { name, value } = 'target' in e ? e.target : e;
    if ((name === 'capacity' || name === 'prixParNuit' || name === 'prixFixeReservation') && typeof value === 'string') {
        value = parseFloat(value);
        if (isNaN(value)) value = undefined;
    }
    const currentSetter = editingLocation ? setEditingLocation : setCurrentLocationData;
    currentSetter(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeSelectChange = (value: RoomOrTable['type']) => {
    const currentSetter = editingLocation ? setEditingLocation : setCurrentLocationData;
    currentSetter(prev => ({
        ...prev,
        type: value,
        // selectedParentIdentifier: (prev as any).selectedParentIdentifier, // Keep existing parent
        capacity: value === 'Site' ? undefined : (prev as any).capacity,
        prixParNuit: value === 'Chambre' ? (prev as any).prixParNuit : undefined,
        prixFixeReservation: value === 'Table' ? (prev as any).prixFixeReservation : undefined,
    }));
  };

  const handleParentSelectChange = (value: string) => {
    const currentSetter = editingLocation ? setEditingLocation : setCurrentLocationData;
    currentSetter(prev => ({ ...prev, selectedParentIdentifier: value }));
  };

  const handleTagChange = (tagId: string, checked: boolean | string ) => {
    const isChecked = !!checked;
    const currentSetter = editingLocation ? setEditingLocation : setCurrentLocationData;
    currentSetter(prev => {
        const currentTagIds = prev.tagIds || [];
        if (isChecked) {
            return { ...prev, tagIds: [...currentTagIds, tagId] };
        } else {
            return { ...prev, tagIds: currentTagIds.filter(id => id !== tagId) };
        }
    });
  };

  const handleAmenityChange = (amenityId: string, checked: boolean | string) => {
    const isChecked = !!checked;
    const currentSetter = editingLocation ? setEditingLocation : setCurrentLocationData;
    currentSetter(prev => {
        const currentAmenityIds = prev.amenityIds || [];
        if (isChecked) {
            return { ...prev, amenityIds: [...currentAmenityIds, amenityId] };
        } else {
            return { ...prev, amenityIds: currentAmenityIds.filter(id => id !== amenityId) };
        }
    });
  };

  const handleSubmitLocation = async () => {
    if (!user?.hostId) return;
    setIsSubmitting(true);

    const isEditing = !!(editingLocation && editingLocation.id);
    const dataForSubmit = editingLocation || currentLocationData;

    if (!dataForSubmit.nom || !dataForSubmit.selectedParentIdentifier) {
      toast({ title: "Missing Information", description: "Please provide a name and select what it belongs to.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
     if ((dataForSubmit.type === 'Chambre' || dataForSubmit.type === 'Table') && (dataForSubmit.capacity === undefined || dataForSubmit.capacity <= 0)) {
        toast({ title: "Invalid Capacity", description: "Please provide a valid positive capacity for rooms and tables.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
     if (dataForSubmit.type === 'Chambre' && (dataForSubmit.prixParNuit !== undefined && dataForSubmit.prixParNuit < 0)) {
        toast({ title: "Invalid Price", description: "Price per night for rooms cannot be negative.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    if (dataForSubmit.type === 'Table' && (dataForSubmit.prixFixeReservation !== undefined && dataForSubmit.prixFixeReservation < 0)) {
        toast({ title: "Invalid Price", description: "Fixed reservation price for tables cannot be negative.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    const selectedParentOption = assignableParentOptions.find(opt => opt.id === dataForSubmit.selectedParentIdentifier);
    if (!selectedParentOption) {
      toast({ title: "Invalid Parent Selection", description: "The selected parent assignment is not valid.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const imageUrlsArray = dataForSubmit.imageUrlsString?.split(',').map(url => url.trim()).filter(url => url) || [];
    const payload: Omit<RoomOrTable, 'id' | 'urlPersonnalise'> = {
      nom: dataForSubmit.nom!,
      type: dataForSubmit.type!,
      hostId: user.hostId,
      globalSiteId: selectedParentOption.actualGlobalSiteId,
      parentLocationId: selectedParentOption.isGlobalSite ? undefined : selectedParentOption.actualParentLocationId,
      capacity: (dataForSubmit.type === 'Chambre' || dataForSubmit.type === 'Table') ? dataForSubmit.capacity : undefined,
      tagIds: dataForSubmit.tagIds || [],
      description: dataForSubmit.description || undefined,
      imageUrls: imageUrlsArray,
      imageAiHint: imageUrlsArray.length > 0 && dataForSubmit.nom ? dataForSubmit.nom.toLowerCase().split(' ').slice(0,2).join(' ') : undefined,
      amenityIds: dataForSubmit.amenityIds || [],
      prixParNuit: dataForSubmit.type === 'Chambre' ? dataForSubmit.prixParNuit : undefined,
      prixFixeReservation: dataForSubmit.type === 'Table' ? dataForSubmit.prixFixeReservation : undefined,
    };
    
    if (dataForSubmit.type === 'Site') {
        payload.parentLocationId = selectedParentOption.isGlobalSite ? undefined : selectedParentOption.id;
    } else { // Chambre or Table
        payload.parentLocationId = selectedParentOption.isGlobalSite ? undefined : selectedParentOption.id;
    }


    try {
      if (isEditing && editingLocation?.id) {
        await updateLocationInData(editingLocation.id, payload);
        toast({ title: "Location Updated", description: `${payload.nom} has been updated.` });
      } else {
        await addRoomOrTable(payload);
        toast({ title: "Location Created", description: `${payload.nom} has been added.` });
      }
      if (user.hostId) fetchData(user.hostId);
    } catch (error) {
      console.error("Failed to save location:", error);
      toast({ title: "Error", description: `Failed to save location. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    }

    setIsDialogOpen(false);
    setCurrentLocationData({ nom: '', type: 'Chambre', selectedParentIdentifier: '', capacity: undefined, tagIds: [], description: '', imageUrlsString: '', amenityIds: [], prixParNuit: undefined, prixFixeReservation: undefined });
    setEditingLocation(null);
    setIsSubmitting(false);
  };

  const openAddDialog = (parentNode?: TreeNode) => {
    if (assignableParentOptions.length === 0 && globalSites.length === 0) {
        toast({ title: "Cannot Add Location", description: "You must have at least one Global Site assigned by an admin.", variant: "destructive"});
        return;
    }
    setEditingLocation(null);
    let defaultParentIdentifier = assignableParentOptions.length > 0 ? assignableParentOptions[0].id : '';
    if (parentNode) {
        defaultParentIdentifier = parentNode.id; // ParentNode ID is either GlobalSite.siteId or RoomOrTable.id (for type Site)
    }

    setCurrentLocationData({
        nom: '',
        type: 'Chambre',
        selectedParentIdentifier: defaultParentIdentifier,
        capacity: undefined,
        tagIds: [],
        description: '',
        imageUrlsString: '',
        amenityIds: [],
        prixParNuit: undefined,
        prixFixeReservation: undefined,
    });
    setIsDialogOpen(true);
  };

  const openDuplicateDialog = (locationToDuplicate: RoomOrTable) => {
     if (assignableParentOptions.length === 0 && globalSites.length === 0) {
        toast({ title: "Cannot Add Location", description: "You must have at least one Global Site assigned by an admin.", variant: "destructive"});
        return;
    }
    setEditingLocation(null); // It's an add operation, but pre-filled
    let parentIdentifier = '';
    if (locationToDuplicate.parentLocationId) {
        const parentOpt = assignableParentOptions.find(opt => !opt.isGlobalSite && opt.actualParentLocationId === locationToDuplicate.parentLocationId);
        parentIdentifier = parentOpt ? parentOpt.id : locationToDuplicate.globalSiteId;
    } else {
        parentIdentifier = locationToDuplicate.globalSiteId;
    }
     setCurrentLocationData({
        nom: `${locationToDuplicate.nom} - Copy`,
        type: locationToDuplicate.type,
        selectedParentIdentifier: parentIdentifier,
        capacity: locationToDuplicate.capacity,
        tagIds: [...(locationToDuplicate.tagIds || [])],
        description: locationToDuplicate.description || '',
        imageUrlsString: locationToDuplicate.imageUrls?.join(', ') || '',
        amenityIds: [...(locationToDuplicate.amenityIds || [])],
        prixParNuit: locationToDuplicate.prixParNuit,
        prixFixeReservation: locationToDuplicate.prixFixeReservation,
    });
    setIsDialogOpen(true);
  }

  const openEditDialog = (locationToEdit: RoomOrTable) => {
    let parentIdentifier = '';
    if (locationToEdit.parentLocationId) {
        const parentOption = assignableParentOptions.find(opt => !opt.isGlobalSite && opt.actualParentLocationId === locationToEdit.parentLocationId);
        parentIdentifier = parentOption ? parentOption.id : locationToEdit.globalSiteId;
    } else {
        parentIdentifier = locationToEdit.globalSiteId;
    }
    setEditingLocation({ ...locationToEdit, selectedParentIdentifier: parentIdentifier }); // Store original ID and pre-selected parent
    setCurrentLocationData({ // This state is for form binding
        nom: locationToEdit.nom,
        type: locationToEdit.type,
        selectedParentIdentifier: parentIdentifier,
        capacity: locationToEdit.capacity,
        tagIds: locationToEdit.tagIds || [],
        description: locationToEdit.description || '',
        imageUrlsString: locationToEdit.imageUrls?.join(', ') || '',
        amenityIds: locationToEdit.amenityIds || [],
        prixParNuit: locationToEdit.prixParNuit,
        prixFixeReservation: locationToEdit.prixFixeReservation,
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
    if (!url.startsWith('http') && typeof window !== 'undefined') {
        url = window.location.origin + url;
    }
    navigator.clipboard.writeText(url);
    toast({ title: "Copied to Clipboard", description: "QR Code URL copied!" });
  };

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const renderLocationNode = (node: TreeNode): React.ReactNode => {
    const isExpanded = !!expandedNodes[node.id];
    const location = node.data as RoomOrTable; // Assuming RoomOrTable specific fields needed for actions
    const globalSite = node.data as GlobalSiteType;

    let IconComponent;
    let iconColor = "text-muted-foreground";
    switch (node.type) {
      case 'GlobalSite': IconComponent = Building; iconColor = "text-purple-600"; break;
      case 'Site': IconComponent = Landmark; iconColor = "text-blue-600"; break;
      case 'Chambre': IconComponent = Bed; iconColor = "text-green-600"; break;
      case 'Table': IconComponent = Utensils; iconColor = "text-orange-600"; break;
      default: IconComponent = Info;
    }

    const canExpand = node.type === 'GlobalSite' || node.type === 'Site';

    return (
      <div key={node.id} className="flex flex-col" style={{ paddingLeft: `${node.depth * 1.5}rem` }}>
        <div className={cn(
          "flex items-center justify-between p-2 rounded-md hover:bg-accent",
          isSubmitting && "opacity-50 pointer-events-none"
        )}>
          <div className="flex items-center gap-2 flex-grow cursor-pointer" onClick={canExpand ? () => toggleNodeExpansion(node.id) : undefined}>
            {canExpand && (
              isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
            <IconComponent className={cn("h-5 w-5", iconColor)} />
            <span className="font-medium text-sm truncate" title={node.name}>{node.name}</span>
            <Badge variant="outline" className="text-xs capitalize">{node.type === 'GlobalSite' ? 'Global Site' : node.type}</Badge>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {(node.type === 'GlobalSite' || node.type === 'Site') && (
              <Button variant="ghost" size="icon" onClick={() => openAddDialog(node)} title={`Add to ${node.name}`} disabled={isSubmitting || (assignableParentOptions.length === 0 && globalSites.length === 0)}>
                <FolderPlus className="h-4 w-4 text-primary" />
              </Button>
            )}
             {node.type !== 'GlobalSite' && (
              <>
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(location)} title="Edit Location" disabled={isSubmitting}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                 <Button variant="ghost" size="icon" onClick={() => openDuplicateDialog(location)} title="Duplicate Location" disabled={isSubmitting}>
                  <CopyPlus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteLocationWithConfirmation(location)} title="Delete Location" disabled={isSubmitting}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                {location.urlPersonnalise && (
                  <Button variant="ghost" size="icon" title="View QR Code URL" onClick={() => copyUrlToClipboard(location.urlPersonnalise)} disabled={isSubmitting}>
                    <QrCode className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        {isExpanded && node.children && node.children.length > 0 && (
          <div className="mt-1 border-l border-dashed border-muted-foreground/30">
            {node.children.map(childNode => renderLocationNode(childNode))}
          </div>
        )}
         {isExpanded && node.children && node.children.length === 0 && node.type !== 'Chambre' && node.type !== 'Table' && (
            <p className="pl-6 text-xs text-muted-foreground py-1">No sub-locations added here yet.</p>
        )}
      </div>
    );
  };


  if (isLoading || authLoading) {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <div> <Skeleton className="h-10 w-72 mb-2" /> <Skeleton className="h-6 w-96" /> </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <Card className="shadow-lg"><CardHeader> <Skeleton className="h-8 w-48 mb-2" /> <Skeleton className="h-5 w-64" /> </CardHeader>
            <CardContent><Skeleton className="h-64 w-full"/></CardContent></Card>
        </div>
    );
  }

  const dataForDialog = editingLocation ? { ...editingLocation, ...currentLocationData } : currentLocationData;

  let dialogParentOptions = assignableParentOptions;
  if (editingLocation && editingLocation.id) {
      dialogParentOptions = assignableParentOptions.filter(opt => {
        if (opt.isGlobalSite) return true; 
        return opt.actualParentLocationId !== editingLocation.id;
      });
  }


  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Manage Locations</h1>
          <p className="text-lg text-muted-foreground">Your rooms, tables, site areas, and their QR codes.</p>
        </div>
        <Button onClick={() => openAddDialog()} disabled={isSubmitting || (assignableParentOptions.length === 0 && globalSites.length === 0)}>
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
          <CardTitle>My Locations Structure</CardTitle>
          <CardDescription>Hierarchical view of your registered locations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {locationTree.length === 0 && <p className="p-4 text-center text-muted-foreground">{globalSites.length > 0 ? 'No locations added yet.' : 'Assign Global Sites first, then add locations.'}</p>}
          {locationTree.map(node => renderLocationNode(node))}
        </CardContent>
      </Card>

      {/* Dialog for Add/Edit Location */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {if(!isSubmitting) setIsDialogOpen(open)}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
            <DialogDescription>
              {editingLocation ? 'Modify details for this location.' : (dataForDialog.nom && dataForDialog.nom.endsWith(" - Copy") ? 'Confirm details for the duplicated location (please rename it).' : 'Enter details for the new location and assign it appropriately.')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-2">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">Name*</Label>
              <Input id="nom" name="nom" value={dataForDialog.nom || ''} onChange={handleInputChange} className="col-span-3" disabled={isSubmitting} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type*</Label>
              <Select value={dataForDialog.type || 'Chambre'} onValueChange={handleTypeSelectChange} disabled={isSubmitting}>
                <SelectTrigger className="col-span-3"> <SelectValue placeholder="Select type" /> </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chambre">Chambre (Room)</SelectItem>
                  <SelectItem value="Table">Table</SelectItem>
                  <SelectItem value="Site">Site (Area/Zone)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(dataForDialog.type === 'Chambre' || dataForDialog.type === 'Table') && (
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="capacity" className="text-right"><Users className="inline h-4 w-4 mr-1"/>Capacity*</Label>
                    <Input id="capacity" name="capacity" type="number" value={dataForDialog.capacity ?? ''} onChange={handleInputChange} className="col-span-3" placeholder="e.g. 4" min="1" disabled={isSubmitting} />
                 </div>
            )}
            {dataForDialog.type === 'Chambre' && (
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="prixParNuit" className="text-right"><DollarSign className="inline h-4 w-4 mr-1"/>Price/Night</Label>
                    <Input id="prixParNuit" name="prixParNuit" type="number" value={dataForDialog.prixParNuit ?? ''} onChange={handleInputChange} className="col-span-3" placeholder="e.g. 150" min="0" step="0.01" disabled={isSubmitting} />
                 </div>
            )}
            {dataForDialog.type === 'Table' && (
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="prixFixeReservation" className="text-right"><DollarSign className="inline h-4 w-4 mr-1"/>Booking Price</Label>
                    <Input id="prixFixeReservation" name="prixFixeReservation" type="number" value={dataForDialog.prixFixeReservation ?? ''} onChange={handleInputChange} className="col-span-3" placeholder="e.g. 20" min="0" step="0.01" disabled={isSubmitting} />
                 </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="selectedParentIdentifier" className="text-right">Assign To / Parent*</Label>
              <Select
                value={dataForDialog.selectedParentIdentifier || ''}
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

            <div className="grid grid-cols-1 gap-2 pt-2">
                <Label htmlFor="description" className="flex items-center"><Info className="mr-2 h-4 w-4"/>Description</Label>
                <Textarea id="description" name="description" value={dataForDialog.description || ''} onChange={handleInputChange} className="col-span-full" placeholder="Detailed description of the location..." disabled={isSubmitting} />
            </div>

             <div className="grid grid-cols-1 gap-2 pt-2">
                <Label htmlFor="imageUrlsString" className="flex items-center"><FileImage className="mr-2 h-4 w-4"/>Image URLs</Label>
                <Textarea id="imageUrlsString" name="imageUrlsString" value={dataForDialog.imageUrlsString || ''} onChange={handleInputChange} className="col-span-full" placeholder="https://.../img1.png, https://.../img2.png" disabled={isSubmitting} />
                <p className="text-xs text-muted-foreground col-span-full px-1">Enter multiple image URLs separated by commas. Use `https://placehold.co/` for placeholders.</p>
            </div>

            {hostTags.length > 0 && (
                <div className="grid grid-cols-1 gap-2 pt-2">
                    <Label className="font-semibold flex items-center"><TagIconLucide className="mr-2 h-4 w-4"/>Assign Tags</Label>
                    <ScrollArea className="h-32 border rounded-md p-2">
                        <div className="space-y-2">
                        {hostTags.map(tag => (
                            <div key={tag.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`tag-${tag.id}`}
                                checked={dataForDialog.tagIds?.includes(tag.id)}
                                onCheckedChange={(checked) => handleTagChange(tag.id, !!checked)}
                                disabled={isSubmitting}
                            />
                            <Label htmlFor={`tag-${tag.id}`} className="font-normal cursor-pointer">{tag.name}</Label>
                            </div>
                        ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
            {hostTags.length === 0 && <p className="text-xs text-muted-foreground text-center">No tags created yet. You can create tags in 'Manage Tags'.</p>}

            <div className="grid grid-cols-1 gap-2 pt-2">
                <Label className="font-semibold flex items-center"><Bed className="mr-2 h-4 w-4"/>Assign Amenities</Label>
                <ScrollArea className="h-48 border rounded-md p-3">
                {PREDEFINED_AMENITIES.map((category: AmenityCategory) => (
                    <div key={category.categoryLabel} className="mb-3">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1.5">{category.categoryLabel}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                        {category.options.map(amenity => (
                        <div key={amenity.id} className="flex items-center space-x-2">
                            <Checkbox
                            id={`amenity-${amenity.id}`}
                            checked={dataForDialog.amenityIds?.includes(amenity.id)}
                            onCheckedChange={(checked) => handleAmenityChange(amenity.id, !!checked)}
                            disabled={isSubmitting}
                            />
                            <Label htmlFor={`amenity-${amenity.id}`} className="font-normal text-sm cursor-pointer flex items-center">
                            <amenity.icon className="mr-1.5 h-4 w-4 text-muted-foreground" />
                            {amenity.label}
                            </Label>
                        </div>
                        ))}
                    </div>
                    </div>
                ))}
                </ScrollArea>
            </div>
          </div>
          </ScrollArea>
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button
                onClick={handleSubmitLocation}
                disabled={isSubmitting || (assignableParentOptions.length === 0 && globalSites.length === 0 && !editingLocation) || !dataForDialog.selectedParentIdentifier || !dataForDialog.nom || (dataForDialog.nom.endsWith(" - Copy")) || ((dataForDialog.type === 'Chambre' || dataForDialog.type === 'Table') && (!dataForDialog.capacity || dataForDialog.capacity <=0))}
            >
                {editingLocation ? (isSubmitting ? 'Saving...' : 'Save Changes') : (isSubmitting ? 'Creating...' : 'Create Location')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
