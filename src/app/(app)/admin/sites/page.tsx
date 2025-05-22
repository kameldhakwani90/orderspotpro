
"use client";

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getSites, addSiteToData, getHosts, updateSiteInData, deleteSiteInData } from '@/lib/data';
import type { Site, Host } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit2, Trash2, Building2, ShieldAlert, Copy, ImageIcon } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminSitesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [sites, setSites] = useState<Site[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSite, setEditingSite] = useState<Partial<Site> | null>(null);
  
  const [currentSiteData, setCurrentSiteData] = useState<{ nom: string; hostId: string; logoUrl?: string; primaryColor?: string; }>({
    nom: '',
    hostId: '',
    logoUrl: '',
    primaryColor: '',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sitesData, hostsData] = await Promise.all([
        getSites(), 
        getHosts()
      ]);
      setSites(sitesData);
      setHosts(hostsData);
      if (hostsData.length > 0 && !currentSiteData.hostId) {
        setCurrentSiteData(prev => ({ ...prev, hostId: hostsData[0].hostId }));
      } else if (hostsData.length === 0) {
        setCurrentSiteData(prev => ({ ...prev, hostId: '' }));
      }
    } catch (error) {
      console.error("Failed to load sites/hosts data:", error);
      toast({ title: "Error loading data", description: "Could not load sites and hosts. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, currentSiteData.hostId]);

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== 'admin') {
        router.replace('/dashboard');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router, fetchData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentSiteData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleHostSelectChange = (value: string) => {
    setCurrentSiteData(prev => ({ ...prev, hostId: value }));
  };

  const handleSubmitSite = async () => {
    setIsSubmitting(true);
    const isEditing = !!(editingSite && editingSite.siteId);
    
    let dataToSubmit: Partial<Site>;

    if (isEditing && editingSite?.siteId) {
        dataToSubmit = {
            ...sites.find(s => s.siteId === editingSite!.siteId), 
            ...currentSiteData 
        };
    } else {
        dataToSubmit = { ...currentSiteData };
    }
    
    if (!dataToSubmit.nom || !dataToSubmit.hostId) {
      toast({ title: "Missing Information", description: "Please provide a site name and assign a host.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    if (!hosts.some(h => h.hostId === dataToSubmit.hostId)) {
      toast({ title: "Invalid Host", description: "Please select a valid host.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    // Basic HEX color validation (optional, but good practice)
    if (dataToSubmit.primaryColor && !/^#([0-9A-F]{3}){1,2}$/i.test(dataToSubmit.primaryColor)) {
        toast({ title: "Invalid Color Format", description: "Primary color must be a valid HEX code (e.g., #FF5733).", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    const payload: Partial<Omit<Site, 'siteId' | 'logoAiHint'>> = {
        nom: dataToSubmit.nom.trim(),
        hostId: dataToSubmit.hostId,
        logoUrl: dataToSubmit.logoUrl?.trim() || undefined,
        primaryColor: dataToSubmit.primaryColor?.trim() || undefined,
    };


    try {
      if (isEditing && editingSite?.siteId) { 
        await updateSiteInData(editingSite.siteId, payload);
        toast({ title: "Global Site Updated", description: `${payload.nom} has been updated.` });
      } else { 
        await addSiteToData(payload as Omit<Site, 'siteId' | 'logoAiHint' | 'primaryColor'> & { primaryColor?: string });
        toast({ title: "Global Site Created", description: `${payload.nom} has been added and assigned to a host.` });
      }
      fetchData(); 
    } catch (error) {
      console.error("Failed to save site:", error);
      toast({ title: "Error saving site", description: `Could not save the site. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    }
    
    setIsDialogOpen(false);
    setCurrentSiteData({ nom: '', hostId: hosts.length > 0 ? hosts[0].hostId : '', logoUrl: '', primaryColor: '' });
    setEditingSite(null);
    setIsSubmitting(false);
  };
  
  const openAddDialog = () => {
    if (hosts.length === 0) {
      toast({ title: "Cannot Add Site", description: "You must create at least one Host before adding a Global Site.", variant: "destructive"});
      return;
    }
    setEditingSite(null);
    setCurrentSiteData({ nom: '', hostId: hosts.length > 0 ? hosts[0].hostId : '', logoUrl: '', primaryColor: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (siteToEdit: Site) => {
    setEditingSite({ ...siteToEdit });
    setCurrentSiteData({
        nom: siteToEdit.nom,
        hostId: siteToEdit.hostId,
        logoUrl: siteToEdit.logoUrl || '',
        primaryColor: siteToEdit.primaryColor || '',
    });
    setIsDialogOpen(true);
  };
  
  const handleDeleteSite = async (siteId: string, siteName: string) => {
     if (!window.confirm(`Are you sure you want to delete Global Site "${siteName}"? This may affect related locations and services.`)) {
        return;
     }
     setIsSubmitting(true);
     try {
        await deleteSiteInData(siteId);
        toast({ title: "Global Site Deleted", description: `Site "${siteName}" has been deleted.`, variant: "destructive" });
        fetchData();
     } catch (error) {
        console.error("Failed to delete site:", error);
        toast({ title: "Error deleting site", description: `Could not delete the site. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
     }
     setIsSubmitting(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: "Copied to clipboard!", description: text }))
      .catch(err => toast({ title: "Copy failed", description: err.message, variant: "destructive" }));
  };

  if (isLoading || authLoading) {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Skeleton className="h-10 w-72 mb-2" />
                    <Skeleton className="h-6 w-96" />
                </div>
                <Skeleton className="h-10 w-48" />
            </div>
            <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-5 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="grid grid-cols-6 gap-4 items-center"> {/* Increased for new columns */}
                                <Skeleton className="h-10 w-10" /> {/* Logo */}
                                <Skeleton className="h-6 w-full" /> {/* Name */}
                                <Skeleton className="h-6 w-full" /> {/* Host */}
                                <Skeleton className="h-6 w-full" /> {/* Primary Color */}
                                <Skeleton className="h-6 w-full" /> {/* URL */}
                                <Skeleton className="h-8 w-full" /> {/* Actions */}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Manage Global Sites</h1>
          <p className="text-lg text-muted-foreground">Administer all global establishments (e.g., Hotels, Restaurants) and assign them to Hosts.</p>
        </div>
        <Button onClick={openAddDialog} disabled={isSubmitting || hosts.length === 0}>
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Global Site
        </Button>
      </div>
      
      {hosts.length === 0 && !isLoading && (
        <Alert variant="destructive" className="mb-6">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle>No Hosts Found!</AlertTitle>
          <AlertDescription>
            You need to create Hosts first before you can assign them to Global Sites. 
            Please go to "Manage Hosts" to add a host. Global Sites cannot be created without a Host to manage them.
            <Button variant="link" onClick={() => router.push('/admin/hosts')} className="text-destructive hover:text-destructive/80 px-1">
                Go to Manage Hosts
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Global Sites</CardTitle>
          <CardDescription>List of all registered global sites and their assigned Hosts. Current count: {sites.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px]">Logo</TableHead>
                <TableHead>Global Site Name</TableHead>
                <TableHead>Managed by Host</TableHead>
                <TableHead>Primary Color</TableHead>
                <TableHead>Reservation URL</TableHead>
                <TableHead>Site ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => {
                const hostName = hosts.find(h => h.hostId === site.hostId)?.nom || 'N/A (Host not found)';
                const reservationUrl = `/reserve/${site.siteId}`;
                const fullReservationUrl = typeof window !== 'undefined' ? `${window.location.origin}${reservationUrl}` : reservationUrl;
                return (
                    <TableRow key={site.siteId}>
                    <TableCell>
                      {site.logoUrl ? (
                        <Image
                          src={site.logoUrl}
                          alt={`${site.nom} logo`}
                          width={50}
                          height={50}
                          className="rounded-md object-contain aspect-square bg-muted"
                          data-ai-hint={site.logoAiHint || site.nom.toLowerCase().split(' ').slice(0,2).join(' ')}
                        />
                      ) : (
                        <div className="w-[50px] h-[50px] bg-muted rounded-md flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium flex items-center">
                        <Building2 className="mr-2 h-5 w-5 text-primary invisible md:visible" />
                        {site.nom}
                    </TableCell>
                    <TableCell>{hostName}</TableCell>
                    <TableCell>
                      {site.primaryColor ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: site.primaryColor }}></div>
                          <span className="text-xs">{site.primaryColor}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Default</span>
                      )}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <Link href={reservationUrl} className="text-primary hover:underline text-xs" target="_blank">
                                {reservationUrl}
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => copyToClipboard(fullReservationUrl)}
                                title="Copy Reservation URL"
                                disabled={isSubmitting}
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </TableCell>
                    <TableCell className="text-xs">{site.siteId}</TableCell>
                    <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(site)} title="Edit Site" disabled={isSubmitting || hosts.length === 0}>
                        <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteSite(site.siteId, site.nom)} title="Delete Site" disabled={isSubmitting}>
                        <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                    </TableRow>
                );
              })}
            </TableBody>
          </Table>
           {sites.length === 0 && <p className="p-4 text-center text-muted-foreground">{hosts.length > 0 ? 'No global sites added yet.' : 'Create hosts first, then add global sites.'}</p>}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {if (!isSubmitting) setIsDialogOpen(open)}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSite ? 'Edit Global Site' : 'Add New Global Site'}</DialogTitle>
            <DialogDescription>
              {editingSite ? 'Modify details for this global site and its assigned Host.' : 'Enter details for the new global site and assign a Host to manage it.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Site Name*</Label>
              <Input id="nom" name="nom" value={currentSiteData.nom || ''} onChange={handleInputChange} placeholder="e.g., Grand Hotel Downtown" disabled={isSubmitting}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostId">Managed by*</Label>
              <Select 
                value={currentSiteData.hostId || ''} 
                onValueChange={handleHostSelectChange} 
                disabled={isSubmitting || hosts.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={hosts.length > 0 ? "Select a Host" : "No Hosts available"} />
                </SelectTrigger>
                <SelectContent>
                  {hosts.map(host => (
                    <SelectItem key={host.hostId} value={host.hostId}>{host.nom} (ID: {host.hostId})</SelectItem>
                  ))}
                  {hosts.length === 0 && <SelectItem value="" disabled>Please create a Host first</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input id="logoUrl" name="logoUrl" value={currentSiteData.logoUrl || ''} onChange={handleInputChange} placeholder="https://placehold.co/100x100.png" disabled={isSubmitting}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color (HEX)</Label>
              <Input id="primaryColor" name="primaryColor" value={currentSiteData.primaryColor || ''} onChange={handleInputChange} placeholder="e.g., #FF5733" disabled={isSubmitting}/>
            </div>
            <p className="text-xs text-muted-foreground col-span-full px-1">
                **Tip for Logo URL:** Use image URLs starting with `https://placehold.co/` or ensure your desired image hosts are configured in `next.config.ts`.
                <br />
                **Tip for Primary Color:** Use HEX format like `#RRGGBB` (e.g., `#FF5733` for a vibrant orange). You can use an online color picker.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmitSite} disabled={isSubmitting || hosts.length === 0 || !currentSiteData.hostId || !currentSiteData.nom.trim()}>
                {editingSite ? (isSubmitting ? 'Saving...' : 'Save Changes') : (isSubmitting ? 'Creating...' : 'Create Global Site')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    
