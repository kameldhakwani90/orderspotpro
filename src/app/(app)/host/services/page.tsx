
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  getServices, addService, updateService, deleteService,
  getServiceCategories, getCustomForms, getRoomsOrTables, getSites as getGlobalSitesForHost
} from '@/lib/data';
import type { Service, ServiceCategory, CustomForm, RoomOrTable, Site as GlobalSite } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Edit2, Trash2, ClipboardList, DollarSign, ImageIcon, FileText as FormIcon, Tag as CategoryIcon, Target } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

const DEFAULT_NO_FORM_ID = "___NO_FORM_SELECTED___";

export default function HostServicesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [allHostLocations, setAllHostLocations] = useState<RoomOrTable[]>([]);
  const [hostGlobalSites, setHostGlobalSites] = useState<GlobalSite[]>([]);


  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentServiceData, setCurrentServiceData] = useState<Partial<Service>>({
    titre: '', description: '', image: '', categorieId: '', formulaireId: undefined, prix: 0, targetLocationIds: []
  });

  const fetchData = useCallback(async (hostId: string) => {
    setIsLoading(true);
    try {
      const [servicesData, categoriesData, formsData, locationsData, globalSitesData] = await Promise.all([
        getServices(hostId), // Fetches all services for the host for management view
        getServiceCategories(hostId),
        getCustomForms(hostId),
        getRoomsOrTables(hostId),
        getGlobalSitesForHost(hostId)
      ]);
      setServices(servicesData);
      setCategories(categoriesData);
      setForms(formsData);
      setAllHostLocations(locationsData);
      setHostGlobalSites(globalSitesData);

      if (categoriesData.length > 0 && !currentServiceData.categorieId) {
        setCurrentServiceData(prev => ({ ...prev, categorieId: categoriesData[0].id }));
      }
    } catch (error) {
      console.error("Failed to load services data:", error);
      toast({ title: "Error", description: "Could not load services or related data. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, currentServiceData.categorieId]);

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
    setCurrentServiceData(prev => ({ ...prev, [name]: name === 'prix' ? parseFloat(value) || 0 : value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'formulaireId') {
      setCurrentServiceData(prev => ({ ...prev, [name]: value === DEFAULT_NO_FORM_ID ? undefined : value }));
    } else {
      setCurrentServiceData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleTargetLocationChange = (locationId: string, checked: boolean | string) => {
    setCurrentServiceData(prev => {
        const currentTargets = prev.targetLocationIds || [];
        if (checked) {
            return { ...prev, targetLocationIds: [...currentTargets, locationId] };
        } else {
            return { ...prev, targetLocationIds: currentTargets.filter(id => id !== locationId) };
        }
    });
  };


  const handleSubmitService = async () => {
    if (!user?.hostId) return;
    if (!currentServiceData.titre?.trim() || !currentServiceData.categorieId) {
      toast({ title: "Validation Error", description: "Service title and category are required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const dataToSubmit: Omit<Service, 'id' | 'hostId' | 'data-ai-hint'> = {
      titre: currentServiceData.titre!,
      description: currentServiceData.description || '',
      image: currentServiceData.image || '',
      categorieId: currentServiceData.categorieId!,
      formulaireId: currentServiceData.formulaireId || undefined,
      prix: currentServiceData.prix || undefined,
      targetLocationIds: currentServiceData.targetLocationIds || [],
    };

    try {
      if (editingService && editingService.id) {
        await updateService(editingService.id, dataToSubmit);
        toast({ title: "Service Updated" });
      } else {
        await addService({ ...dataToSubmit, hostId: user.hostId });
        toast({ title: "Service Created" });
      }
      fetchData(user.hostId);
    } catch (error) {
      console.error("Failed to save service:", error);
      toast({ title: "Error", description: `Could not save service. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
      setIsDialogOpen(false);
      setCurrentServiceData({ titre: '', description: '', image: '', categorieId: categories[0]?.id || '', formulaireId: undefined, prix: 0, targetLocationIds: [] });
      setEditingService(null);
      setIsSubmitting(false);
    }
  };

  const openAddDialog = () => {
    setEditingService(null);
    setCurrentServiceData({
      titre: '', description: '', image: '',
      categorieId: categories.length > 0 ? categories[0].id : '',
      formulaireId: undefined, 
      prix: 0,
      targetLocationIds: []
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setCurrentServiceData({...service, targetLocationIds: service.targetLocationIds || []});
    setIsDialogOpen(true);
  };

  const handleDeleteService = async (service: Service) => {
    if (!user?.hostId || !window.confirm(`Delete service "${service.titre}"?`)) return;
    setIsSubmitting(true);
    try {
      await deleteService(service.id);
      toast({ title: "Service Deleted", variant: "destructive" });
      fetchData(user.hostId);
    } catch (error) {
      toast({ title: "Error", description: `Could not delete service. ${error}`, variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const getCategoryName = (categoryId: string) => categories.find(c => c.id === categoryId)?.nom || 'N/A';
  const getFormName = (formId?: string) => formId ? (forms.find(f => f.id === formId)?.nom || 'N/A') : 'None';
  const getTargetingSummary = (targetIds?: string[]) => {
    if (!targetIds || targetIds.length === 0) return "All Locations";
    if (targetIds.length > 2) return `${targetIds.length} specific locations/areas`;
    return targetIds.map(id => allHostLocations.find(loc => loc.id === id)?.nom || id.slice(-5)).join(', ');
  };


  if (isLoading || authLoading) {
     return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div><Skeleton className="h-10 w-72 mb-2" /><Skeleton className="h-6 w-96" /></div>
          <Skeleton className="h-10 w-48" />
        </div>
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-5 w-64" /></CardHeader>
          <CardContent><div className="space-y-4">{[...Array(3)].map((_, i) => (<div key={i} className="grid grid-cols-6 gap-4 items-center"><Skeleton className="h-10 w-10" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-8 w-full" /></div>))}</div></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">My Services</h1>
          <p className="text-lg text-muted-foreground">Manage all services offered by your establishment.</p>
        </div>
        <Button onClick={openAddDialog} disabled={isSubmitting || categories.length === 0} title={categories.length === 0 ? "Please create service categories first" : "Add New Service"}>
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Service
        </Button>
      </div>
       {categories.length === 0 && !isLoading && (
        <Card className="mb-6 bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700/50">
          <CardHeader><CardTitle className="text-yellow-700 dark:text-yellow-400">No Service Categories Found</CardTitle></CardHeader>
          <CardContent>
            <p className="text-yellow-600 dark:text-yellow-500">You need to create at least one Service Category before you can add Services. 
              Please go to "Service Categories" under Configuration to add a category.
            </p>
             <Button variant="link" onClick={() => router.push('/host/service-categories')} className="text-yellow-700 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300 px-1">
                Go to Service Categories
            </Button>
          </CardContent>
        </Card>
      )}


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Services</CardTitle>
          <CardDescription>List of all your services. Current count: {services.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Targeting</TableHead>
                <TableHead>Form</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    {service.image ? (
                      <Image src={service.image} alt={service.titre} width={50} height={50} className="rounded-md object-cover aspect-square" data-ai-hint={service['data-ai-hint'] || 'service item'}/>
                    ) : (
                      <div className="w-[50px] h-[50px] bg-muted rounded-md flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{service.titre}</TableCell>
                  <TableCell>{getCategoryName(service.categorieId)}</TableCell>
                  <TableCell>{getTargetingSummary(service.targetLocationIds)}</TableCell>
                  <TableCell>{getFormName(service.formulaireId)}</TableCell>
                  <TableCell>{service.prix ? `$${service.prix.toFixed(2)}` : 'N/A'}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(service)} title="Edit Service" disabled={isSubmitting}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteService(service)} title="Delete Service" disabled={isSubmitting}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {services.length === 0 && <p className="p-4 text-center text-muted-foreground">{categories.length > 0 ? "No services added yet." : "Create categories first, then add services."}</p>}
        </CardContent>
      </Card>

      {/* Service Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {if(!isSubmitting) setIsDialogOpen(open)}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-6">
            <div className="grid gap-4 py-4 ">
              <div className="space-y-1.5">
                <Label htmlFor="titre"><ClipboardList className="inline mr-1 h-4 w-4" />Title*</Label>
                <Input id="titre" name="titre" value={currentServiceData.titre || ''} onChange={handleInputChange} placeholder="e.g., Airport Shuttle" disabled={isSubmitting} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={currentServiceData.description || ''} onChange={handleInputChange} placeholder="e.g., Comfortable ride to the airport." disabled={isSubmitting} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="image"><ImageIcon className="inline mr-1 h-4 w-4" />Image URL</Label>
                <Input id="image" name="image" value={currentServiceData.image || ''} onChange={handleInputChange} placeholder="https://placehold.co/600x400.png" disabled={isSubmitting} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prix"><DollarSign className="inline mr-1 h-4 w-4" />Price (Optional)</Label>
                <Input id="prix" name="prix" type="number" value={currentServiceData.prix ?? ''} onChange={handleInputChange} placeholder="e.g., 25.00" step="0.01" disabled={isSubmitting} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="categorieId"><CategoryIcon className="inline mr-1 h-4 w-4" />Category*</Label>
                <Select value={currentServiceData.categorieId || ''} onValueChange={(val) => handleSelectChange('categorieId', val)} disabled={isSubmitting || categories.length === 0}>
                  <SelectTrigger id="categorieId"><SelectValue placeholder={categories.length > 0 ? "Select a category" : "No categories available"} /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="formulaireId"><FormIcon className="inline mr-1 h-4 w-4" />Custom Form (Optional)</Label>
                <Select 
                  value={currentServiceData.formulaireId || DEFAULT_NO_FORM_ID} 
                  onValueChange={(val) => handleSelectChange('formulaireId', val)} 
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="formulaireId"><SelectValue placeholder="Select a form (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DEFAULT_NO_FORM_ID}>None</SelectItem>
                    {forms.map(form => <SelectItem key={form.id} value={form.id}>{form.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="flex items-center"><Target className="inline mr-1 h-4 w-4" />Target Specific Locations/Areas</Label>
                 <p className="text-xs text-muted-foreground">Select which specific rooms, tables, or areas this service is available for. If none selected, service is available host-wide.</p>
                <ScrollArea className="h-48 border rounded-md p-3 bg-muted/50">
                  {allHostLocations.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No locations created yet to target.</p>}
                  {allHostLocations.map(loc => {
                    const globalSiteParent = hostGlobalSites.find(gs => gs.siteId === loc.globalSiteId);
                    const locationParent = loc.parentLocationId ? allHostLocations.find(p => p.id === loc.parentLocationId) : null;
                    let parentName = globalSiteParent?.nom || 'Global Site';
                    if (locationParent) {
                        parentName = `${locationParent.nom} (${locationParent.type}) / ${parentName}`;
                    }

                    return (
                      <div key={loc.id} className="flex items-center space-x-3 py-1.5">
                        <Checkbox
                          id={`target-${loc.id}`}
                          checked={currentServiceData.targetLocationIds?.includes(loc.id)}
                          onCheckedChange={(checked) => handleTargetLocationChange(loc.id, checked)}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor={`target-${loc.id}`} className="font-normal text-sm cursor-pointer flex-grow">
                          {loc.nom} <span className="text-xs text-muted-foreground">({loc.type})</span>
                          <p className="text-xs text-muted-foreground/80">in: {parentName}</p>
                        </Label>
                      </div>
                    );
                  })}
                </ScrollArea>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmitService} disabled={isSubmitting || (categories.length === 0 && !editingService)}>{isSubmitting ? "Saving..." : (editingService ? 'Save Changes' : 'Create Service')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

