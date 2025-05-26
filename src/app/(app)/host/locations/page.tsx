
// src/app/(app)/host/locations/page.tsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  getRoomsOrTables, 
  addRoomOrTable, 
  updateRoomOrTable as updateLocationInData, 
  deleteRoomOrTable as deleteLocationInData, 
  getSites as fetchGlobalSitesForHost, 
  getTags as fetchHostTags,
  getMenuCards
} from '@/lib/data';
import type { RoomOrTable, Site as GlobalSiteType, Tag, AmenityOption, MenuCard } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PlusCircle, Edit2, Trash2, QrCode, Copy, Landmark, Bed, Utensils, Building, Users, 
  Tag as TagIconLucide, FileImage, Info, CopyPlus, DollarSign, ChevronRight, ChevronDown, FolderPlus, Utensils as MenuIcon
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
  const locationsMap = new Map(locations.map(loc => [loc.id, { ...loc, children: [] as TreeNode[] }]));

  const findChildrenForNode = (parentId: string, currentDepth: number): TreeNode[] => {
    return locations
      .filter(loc => loc.parentLocationId === parentId)
      .map(loc => {
        const mappedLoc = locationsMap.get(loc.id)!;
        return {
          id: mappedLoc.id,
          name: mappedLoc.nom,
          type: mappedLoc.type,
          data: mappedLoc,
          children: mappedLoc.type === 'Site' ? findChildrenForNode(mappedLoc.id, currentDepth + 1) : [],
          depth: currentDepth,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
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
    
    locations
      .filter(loc => loc.globalSiteId === gs.siteId && !loc.parentLocationId)
      .forEach(topLevelLoc => {
        const mappedTopLevelLoc = locationsMap.get(topLevelLoc.id)!;
        globalSiteNode.children.push({
          id: mappedTopLevelLoc.id,
          name: mappedTopLevelLoc.nom,
          type: mappedTopLevelLoc.type,
          data: mappedTopLevelLoc,
          children: mappedTopLevelLoc.type === 'Site' ? findChildrenForNode(mappedTopLevelLoc.id, 2) : [],
          depth: 1,
        });
      });
    globalSiteNode.children.sort((a, b) => a.name.localeCompare(b.name));
    tree.push(globalSiteNode);
  });

  return tree.sort((a, b) => a.name.localeCompare(b.name));
};


export default function HostLocationsPage() {
  const { user, isLoading: authLoading, selectedGlobalSite } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [allLocations, setAllLocations] = useState<RoomOrTable[]>([]);
  const [allGlobalSitesForHost, setAllGlobalSitesForHost] = useState<GlobalSiteType[]>([]);
  const [hostTags, setHostTags] = useState<Tag[]>([]);
  const [hostMenuCards, setHostMenuCards] = useState<MenuCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Partial<RoomOrTable> & {selectedParentIdentifier?: string} | null>(null);
  
  const [locationTree, setLocationTree] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const [currentLocationData, setCurrentLocationData] = useState<{
    nom: string;
    type: "Chambre" | "Table" | "Site";
    selectedParentIdentifier: string;
    capacity?: number;
    pricingModel?: 'perRoom' | 'perPerson';
    prixParNuit?: number;
    prixFixeReservation?: number;
    tagIds?: string[];
    description?: string;
    imageUrlsString?: string;
    amenityIds?: string[];
    menuCardId?: string; 
  }>({
    nom: '',
    type: 'Chambre',
    selectedParentIdentifier: '',
    capacity: undefined,
    pricingModel: 'perRoom',
    prixParNuit: undefined,
    prixFixeReservation: undefined,
    tagIds: [],
    description: '',
    imageUrlsString: '',
    amenityIds: [],
    menuCardId: undefined,
  });
  
  const assignableParentOptions = useMemo((): AssignableParentOption[] => {
    const options: AssignableParentOption[] = [];
    const sitesToConsiderForParenting = selectedGlobalSite ? [selectedGlobalSite] : allGlobalSitesForHost;

    sitesToConsiderForParenting.forEach(gs => {
      options.push({
        id: gs.siteId,
        name: `${gs.nom} (Global Site Root)`,
        isGlobalSite: true,
        actualGlobalSiteId: gs.siteId,
      });
    });

    allLocations
      .filter(loc => loc.type === 'Site' && (!selectedGlobalSite || loc.globalSiteId === selectedGlobalSite.siteId))
      .forEach(locSite => {
        const parentGlobalSite = allGlobalSitesForHost.find(gs => gs.siteId === locSite.globalSiteId);
        options.push({
          id: locSite.id,
          name: `    ${locSite.nom} (Area in ${parentGlobalSite?.nom || 'Unknown'})`,
          isGlobalSite: false,
          actualGlobalSiteId: locSite.globalSiteId,
          actualParentLocationId: locSite.id,
        });
      });
    return options.sort((a,b) => a.name.trim().localeCompare(b.name.trim()));
  }, [allGlobalSitesForHost, allLocations, selectedGlobalSite]);


  const fetchData = useCallback(async (hostId: string) => {
    setIsLoading(true);
    try {
      const [fetchedLocations, fetchedGlobalSites, fetchedTags, fetchedMenuCards] = await Promise.all([ 
        getRoomsOrTables(hostId),
        fetchGlobalSitesForHost(hostId),
        fetchHostTags(hostId),
        getMenuCards(hostId) 
      ]);
      
      setAllLocations(fetchedLocations);
      setAllGlobalSitesForHost(fetchedGlobalSites);
      setHostTags(fetchedTags);
      setHostMenuCards(fetchedMenuCards);

      const sitesForTree = selectedGlobalSite ? [selectedGlobalSite] : fetchedGlobalSites;
      const tree = buildLocationTree(sitesForTree, fetchedLocations);
      setLocationTree(tree);
      
      if (tree.length === 1 && !expandedNodes[tree[0].id]) { 
        setExpandedNodes(prev => ({...prev, [tree[0].id]: true}));
      }

    } catch (error) {
      console.error("Failed to load locations data:", error);
      toast({ title: "Error", description: "Failed to load locations data. Please try again.", variant: "destructive" });
      setLocationTree([]); 
    } finally {
      setIsLoading(false);
    }
  }, [toast, selectedGlobalSite, expandedNodes]); 

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
  
  const handleSelectChange = (fieldName: string, value: string | undefined) => {
    const currentSetter = editingLocation ? setEditingLocation : setCurrentLocationData;
    currentSetter(prev => ({...prev, [fieldName]: value === '___NO_SELECTION___' ? undefined : value }));
  };


  const handleTypeSelectChange = (value: RoomOrTable['type']) => {
    const currentSetter = editingLocation ? setEditingLocation : setCurrentLocationData;
    currentSetter(prev => ({
        ...prev,
        type: value,
        capacity: value === 'Site' ? undefined : (prev as any).capacity,
        pricingModel: value === 'Chambre' ? (prev as any).pricingModel || 'perRoom' : undefined,
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
    const baseData = isEditing ? editingLocation : {};
    const dataForSubmit = { ...baseData, ...currentLocationData };


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
    if (dataForSubmit.nom.trim().endsWith(" - Copy")) {
        toast({ title: "Rename Required", description: "Please rename the duplicated item before saving.", variant: "destructive" });
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
      nom: dataForSubmit.nom!.trim(),
      type: dataForSubmit.type!,
      hostId: user.hostId,
      globalSiteId: selectedParentOption.actualGlobalSiteId,
      parentLocationId: selectedParentOption.isGlobalSite ? undefined : selectedParentOption.id,
      capacity: (dataForSubmit.type === 'Chambre' || dataForSubmit.type === 'Table') ? dataForSubmit.capacity : undefined,
      pricingModel: dataForSubmit.type === 'Chambre' ? (dataForSubmit.pricingModel || 'perRoom') : undefined,
      prixParNuit: dataForSubmit.type === 'Chambre' ? dataForSubmit.prixParNuit : undefined,
      prixFixeReservation: dataForSubmit.type === 'Table' ? dataForSubmit.prixFixeReservation : undefined,
      tagIds: dataForSubmit.tagIds || [],
      description: dataForSubmit.description || undefined,
      imageUrls: imageUrlsArray,
      imageAiHint: imageUrlsArray.length > 0 && dataForSubmit.nom ? dataForSubmit.nom.toLowerCase().split(' ').slice(0,2).join(' ') : undefined,
      amenityIds: dataForSubmit.amenityIds || [],
      menuCardId: dataForSubmit.menuCardId || undefined,
    };
    
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
    setCurrentLocationData({ nom: '', type: 'Chambre', selectedParentIdentifier: assignableParentOptions.length > 0 ? assignableParentOptions[0].id : '', capacity: undefined, pricingModel: 'perRoom', prixParNuit: undefined, prixFixeReservation: undefined, tagIds: [], description: '', imageUrlsString: '', amenityIds: [], menuCardId: undefined });
    setEditingLocation(null);
    setIsSubmitting(false);
  };

  const openAddDialog = (parentNode?: TreeNode) => {
    const noGlobalSiteContext = !selectedGlobalSite && allGlobalSitesForHost.length === 0;
    const noAssignableParentsAvailable = assignableParentOptions.length === 0;

    if (noGlobalSiteContext || noAssignableParentsAvailable) {
        toast({ title: "Cannot Add Location", description: "You must have at least one Global Site assigned. Contact an administrator if needed.", variant: "destructive"});
        return;
    }
    setEditingLocation(null);
    let defaultParentIdentifier = '';
    if (parentNode) { 
        defaultParentIdentifier = parentNode.id; 
    } else if (selectedGlobalSite) { 
        defaultParentIdentifier = selectedGlobalSite.siteId;
    } else if (assignableParentOptions.length > 0) { 
        defaultParentIdentifier = assignableParentOptions[0].id;
    }

    setCurrentLocationData({
        nom: '',
        type: 'Chambre',
        selectedParentIdentifier: defaultParentIdentifier,
        capacity: undefined,
        pricingModel: 'perRoom',
        prixParNuit: undefined,
        prixFixeReservation: undefined,
        tagIds: [],
        description: '',
        imageUrlsString: '',
        amenityIds: [],
        menuCardId: undefined,
    });
    setIsDialogOpen(true);
  };

  const openDuplicateDialog = (locationToDuplicate: RoomOrTable) => {
     const noGlobalSiteContext = !selectedGlobalSite && allGlobalSitesForHost.length === 0;
     if (noGlobalSiteContext || assignableParentOptions.length === 0) {
        toast({ title: "Cannot Duplicate", description: "Required parent site information is missing.", variant: "destructive"});
        return;
    }
    setEditingLocation(null); 
    let parentIdentifier = locationToDuplicate.parentLocationId || locationToDuplicate.globalSiteId;

     setCurrentLocationData({
        nom: `${locationToDuplicate.nom} - Copy`,
        type: locationToDuplicate.type,
        selectedParentIdentifier: parentIdentifier,
        capacity: locationToDuplicate.capacity,
        pricingModel: locationToDuplicate.pricingModel || (locationToDuplicate.type === 'Chambre' ? 'perRoom' : undefined),
        prixParNuit: locationToDuplicate.prixParNuit,
        prixFixeReservation: locationToDuplicate.prixFixeReservation,
        tagIds: [...(locationToDuplicate.tagIds || [])],
        description: locationToDuplicate.description || '',
        imageUrlsString: locationToDuplicate.imageUrls?.join(', ') || '',
        amenityIds: [...(locationToDuplicate.amenityIds || [])],
        menuCardId: locationToDuplicate.menuCardId || undefined,
    });
    setIsDialogOpen(true);
  }

  const openEditDialog = (locationToEdit: RoomOrTable) => {
    let parentIdentifier = locationToEdit.parentLocationId || locationToEdit.globalSiteId;
    
    setEditingLocation({ ...locationToEdit, selectedParentIdentifier: parentIdentifier }); 
    
    setCurrentLocationData({ 
        nom: locationToEdit.nom,
        type: locationToEdit.type,
        selectedParentIdentifier: parentIdentifier,
        capacity: locationToEdit.capacity,
        pricingModel: locationToEdit.pricingModel || (locationToEdit.type === 'Chambre' ? 'perRoom' : undefined),
        prixParNuit: locationToEdit.prixParNuit,
        prixFixeReservation: locationToEdit.prixFixeReservation,
        tagIds: locationToEdit.tagIds || [],
        description: locationToEdit.description || '',
        imageUrlsString: locationToEdit.imageUrls?.join(', ') || '',
        amenityIds: locationToEdit.amenityIds || [],
        menuCardId: locationToEdit.menuCardId || undefined,
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
     } finally {
       setIsSubmitting(false);
     }
  };

  const copyUrlToClipboard = (locationData: RoomOrTable) => {
    let url = `/client/${locationData.hostId}/${locationData.id}`;
    if (typeof window !== 'undefined') {
        url = window.location.origin + url;
    }
    navigator.clipboard.writeText(url);
    toast({ title: "Copied to Clipboard", description: "Client access URL copied!" });
  };

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const renderLocationNode = (node: TreeNode): React.ReactNode => {
    const isExpanded = !!expandedNodes[node.id];
    const location = node.data as RoomOrTable; 

    let IconComponent;
    let iconColor = "text-muted-foreground";
    let canBeParent = false;
    let displayName = node.name;
    let displaySuffix = "";

    switch (node.type) {
      case 'GlobalSite': IconComponent = Building; iconColor = "text-purple-500"; canBeParent = true; displaySuffix = " (Établissement Global)"; break;
      case 'Site': IconComponent = Landmark; iconColor = "text-blue-500"; canBeParent = true; displaySuffix = ` (Zone - ${location.capacity ? location.capacity + 'p' : 'N/A cap.'})`; break;
      case 'Chambre': IconComponent = Bed; iconColor = "text-green-500"; displaySuffix = ` (Chambre - ${location.capacity || 'N/A'}p - ${location.prixParNuit !== undefined ? '$' + location.prixParNuit.toFixed(2) + (location.pricingModel === 'perPerson' ? '/pers' : '/nuit') : 'Prix N/A'})`; break;
      case 'Table': IconComponent = Utensils; iconColor = "text-orange-500"; displaySuffix = ` (Table - ${location.capacity || 'N/A'}p - ${location.prixFixeReservation !== undefined ? '$' + location.prixFixeReservation.toFixed(2) : 'Prix N/A'})`; break;
      default: IconComponent = Info;
    }

    const hasChildren = node.children && node.children.length > 0;
    const showChevron = canBeParent || hasChildren;

    return (
      <div key={node.id} className="flex flex-col" style={{ paddingLeft: node.depth === 0 ? '0' : `${node.depth * 0.75}rem` }}>
        <div className={cn(
          "flex items-center justify-between p-2.5 rounded-md hover:bg-accent/50 group border-b border-transparent group-hover:border-border/20",
          isSubmitting && "opacity-50 pointer-events-none"
        )}>
          <div 
            className={cn("flex items-center gap-2 flex-grow", showChevron ? "cursor-pointer" : "cursor-default")} 
            onClick={showChevron ? () => toggleNodeExpansion(node.id) : undefined}
          >
            {showChevron ? (
              isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground/70 shrink-0" /> : <ChevronRight className="h-5 w-5 text-muted-foreground/70 shrink-0" />
            ) : <div className="w-5 h-5 shrink-0"></div> }
            <IconComponent className={cn("h-5 w-5 shrink-0", iconColor)} />
            <div className="min-w-0">
              <span className="font-medium text-sm truncate" title={displayName}>{displayName}</span>
              <span className="text-xs text-muted-foreground ml-1 truncate">{displaySuffix}</span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            {canBeParent && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); openAddDialog(node);}} title={`Add to ${node.name}`} disabled={isSubmitting || (assignableParentOptions.length === 0 && allGlobalSitesForHost.length === 0)}>
                <FolderPlus className="h-4 w-4 text-primary" />
              </Button>
            )}
             {node.type !== 'GlobalSite' && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); openEditDialog(location);}} title="Edit Location" disabled={isSubmitting}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); openDuplicateDialog(location);}} title="Duplicate Location" disabled={isSubmitting}>
                  <CopyPlus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); handleDeleteLocationWithConfirmation(location);}} title="Delete Location" disabled={isSubmitting}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                {location.urlPersonnalise && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Copy Client Access URL" onClick={(e) => {e.stopPropagation(); copyUrlToClipboard(location);}} disabled={isSubmitting}>
                    <QrCode className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div className="mt-1 border-l-2 border-dashed border-muted/30 ml-[calc(0.625rem+7px)] pl-3">
            {node.children.map(childNode => renderLocationNode(childNode))}
          </div>
        )}
         {isExpanded && !hasChildren && node.type !== 'Chambre' && node.type !== 'Table' && (
            <p className="pl-[calc(1.25rem+14px)] text-xs text-muted-foreground py-1.5 italic">No sub-locations or items added here yet.</p>
        )}
      </div>
    );
  };


  if (isLoading || authLoading) {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <div> <Skeleton className="h-10 w-72 mb-2" /> <Skeleton className="h-6 w-96" /> </div>
                <Skeleton className="h-10 w-44" />
            </div>
            <Card className="shadow-lg"><CardHeader> <Skeleton className="h-8 w-48 mb-2" /> <Skeleton className="h-5 w-64" /> </CardHeader>
            <CardContent><div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full"/>)}</div></CardContent></Card>
        </div>
    );
  }

  const dataForDialog = editingLocation ? { ...editingLocation, ...currentLocationData } : currentLocationData;
  const filteredMenuCardsForDialog = hostMenuCards.filter(mc => mc.globalSiteId === (assignableParentOptions.find(opt => opt.id === dataForDialog.selectedParentIdentifier)?.actualGlobalSiteId || selectedGlobalSite?.siteId));

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Manage Locations</h1>
          <p className="text-lg text-muted-foreground">Hierarchical view of your registered locations, rooms, and tables.</p>
        </div>
        <Button onClick={() => openAddDialog()} disabled={isSubmitting || (assignableParentOptions.length === 0 && allGlobalSitesForHost.length === 0)}>
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Location/Area
        </Button>
      </div>
      {(allGlobalSitesForHost.length === 0 && !isLoading) && (
        <Card className="mb-6 bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700/50">
          <CardHeader><CardTitle className="text-yellow-700 dark:text-yellow-400">No Global Sites Assigned</CardTitle></CardHeader>
          <CardContent>
            <p className="text-yellow-600 dark:text-yellow-500">You need to be assigned to at least one Global Site by an administrator before you can add specific locations or areas. Please contact an administrator.</p>
          </CardContent>
        </Card>
      )}
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Locations Structure</CardTitle>
          <CardDescription>
            {selectedGlobalSite 
              ? `Locations for ${selectedGlobalSite.nom}.` 
              : "All locations for your managed establishments."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0.5"> 
          {locationTree.length === 0 && !isLoading && (allGlobalSitesForHost.length > 0) && 
            <p className="p-4 text-center text-muted-foreground">
              {selectedGlobalSite ? `No locations or areas added yet for ${selectedGlobalSite.nom}.` : `No locations or areas added yet.`} Click "Add New Location/Area" to start.
            </p>
          }
          {locationTree.map(node => renderLocationNode(node))}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {if(!isSubmitting) setIsDialogOpen(open)}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Edit Location/Area' : 'Add New Location/Area'}</DialogTitle>
            <DialogDescription>
              {editingLocation ? 'Modify details for this item.' : (dataForDialog.nom && dataForDialog.nom.endsWith(" - Copy") ? 'Confirm details for the duplicated item (please rename it).' : 'Enter details for the new location or area and assign it appropriately.')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-2">
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="nom">Name*</Label>
              <Input id="nom" name="nom" value={dataForDialog.nom || ''} onChange={handleInputChange} className="col-span-3" disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Type*</Label>
              <Select value={dataForDialog.type || 'Chambre'} onValueChange={handleTypeSelectChange} disabled={isSubmitting}>
                <SelectTrigger> <SelectValue placeholder="Select type" /> </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chambre">Chambre (Room)</SelectItem>
                  <SelectItem value="Table">Table</SelectItem>
                  <SelectItem value="Site">Site (Area/Zone)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(dataForDialog.type === 'Chambre' || dataForDialog.type === 'Table') && (
                 <div className="space-y-1.5">
                    <Label htmlFor="capacity"><Users className="inline h-4 w-4 mr-1"/>Capacity*</Label>
                    <Input id="capacity" name="capacity" type="number" value={dataForDialog.capacity ?? ''} onChange={handleInputChange} placeholder="e.g. 4" min="1" disabled={isSubmitting} />
                 </div>
            )}
            {dataForDialog.type === 'Chambre' && (
              <>
                <div className="space-y-1.5">
                    <Label htmlFor="pricingModel">Pricing Model</Label>
                    <Select value={dataForDialog.pricingModel || 'perRoom'} onValueChange={(val) => handleSelectChange('pricingModel', val as 'perRoom' | 'perPerson')} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="perRoom">Per Room / Night</SelectItem>
                            <SelectItem value="perPerson">Per Person / Night</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="prixParNuit"><DollarSign className="inline h-4 w-4 mr-1"/>
                        {dataForDialog.pricingModel === 'perPerson' ? 'Price per Person/Night' : 'Price per Room/Night'}
                    </Label>
                    <Input id="prixParNuit" name="prixParNuit" type="number" value={dataForDialog.prixParNuit ?? ''} onChange={handleInputChange} placeholder="e.g. 150" min="0" step="0.01" disabled={isSubmitting} />
                </div>
              </>
            )}
            {dataForDialog.type === 'Table' && (
                 <div className="space-y-1.5">
                    <Label htmlFor="prixFixeReservation"><DollarSign className="inline h-4 w-4 mr-1"/>Booking Price</Label>
                    <Input id="prixFixeReservation" name="prixFixeReservation" type="number" value={dataForDialog.prixFixeReservation ?? ''} onChange={handleInputChange} placeholder="e.g. 20" min="0" step="0.01" disabled={isSubmitting} />
                 </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="selectedParentIdentifier">Assign To / Parent*</Label>
              <Select
                value={dataForDialog.selectedParentIdentifier || ''}
                onValueChange={handleParentSelectChange}
                disabled={isSubmitting || assignableParentOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={assignableParentOptions.length > 0 ? "Select parent or global site" : "No options available"} />
                </SelectTrigger>
                <SelectContent>
                  {assignableParentOptions.map(opt => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                  ))}
                  {assignableParentOptions.length === 0 && <SelectItem value="" disabled>No Global Sites or parent Areas available</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="description" className="flex items-center"><Info className="mr-2 h-4 w-4"/>Description</Label>
                <Textarea id="description" name="description" value={dataForDialog.description || ''} onChange={handleInputChange} className="col-span-full" placeholder="Detailed description of the location..." disabled={isSubmitting} />
            </div>

             <div className="space-y-1.5">
                <Label htmlFor="imageUrlsString" className="flex items-center"><FileImage className="mr-2 h-4 w-4"/>Image URLs</Label>
                <Textarea id="imageUrlsString" name="imageUrlsString" value={dataForDialog.imageUrlsString || ''} onChange={handleInputChange} className="col-span-full" placeholder="https://.../img1.png, https://.../img2.png" disabled={isSubmitting} />
                <p className="text-xs text-muted-foreground col-span-full px-1">Enter multiple image URLs separated by commas. Use `https://placehold.co/` for placeholders.</p>
            </div>
            
            {hostTags.length > 0 && (
                <div className="space-y-1.5">
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

            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label htmlFor="menuCardId" className="flex items-center"><MenuIcon className="mr-2 h-4 w-4"/>Assign Menu Card (Optional)</Label>
              <Select
                value={dataForDialog.menuCardId || '___NO_SELECTION___'}
                onValueChange={(val) => handleSelectChange('menuCardId', val)}
                disabled={isSubmitting || filteredMenuCardsForDialog.length === 0}
              >
                <SelectTrigger id="menuCardId">
                  <SelectValue placeholder={filteredMenuCardsForDialog.length > 0 ? "Select a menu card" : "No menu cards for this site"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={'___NO_SELECTION___'}>None</SelectItem>
                  {filteredMenuCardsForDialog.map(card => (
                    <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filteredMenuCardsForDialog.length === 0 && <p className="text-xs text-muted-foreground text-center">No menu cards available for the selected Global Site. Create one in 'Menu Cards'.</p>}
            </div>
          </div>
          </ScrollArea>
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button
                onClick={handleSubmitLocation}
                disabled={isSubmitting || (assignableParentOptions.length === 0 && allGlobalSitesForHost.length === 0 && !editingLocation) || !dataForDialog.selectedParentIdentifier || !dataForDialog.nom || (dataForDialog.nom.trim().endsWith(" - Copy")) || ((dataForDialog.type === 'Chambre' || dataForDialog.type === 'Table') && (!dataForDialog.capacity || dataForDialog.capacity <=0))}
            >
                {editingLocation ? (isSubmitting ? 'Saving...' : 'Save Changes') : (isSubmitting ? 'Creating...' : 'Create Item')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

