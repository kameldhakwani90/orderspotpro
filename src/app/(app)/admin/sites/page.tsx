
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getSites, addSite as addSiteToData, getHosts } from '@/lib/data';
import type { Site, Host } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit2, Trash2, Building2 } from 'lucide-react';
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

export default function AdminSitesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [sites, setSites] = useState<Site[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Partial<Site> | null>(null);
  
  const [newSite, setNewSite] = useState<{ nom: string; hostId: string }>({
    nom: '',
    hostId: '',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sitesData, hostsData] = await Promise.all([
        getSites(), // Admin gets all sites
        getHosts()
      ]);
      setSites(sitesData);
      setHosts(hostsData);
      if (hostsData.length > 0 && !newSite.hostId) {
        setNewSite(prev => ({ ...prev, hostId: hostsData[0].hostId }));
      }
    } catch (error) {
      console.error("Failed to load sites/hosts data:", error);
      toast({ title: "Error", description: "Failed to load data. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, newSite.hostId]);

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== 'admin') {
        router.replace('/dashboard');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router, fetchData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | { name: string, value: string }) => {
    const { name, value } = 'target' in e ? e.target : e;
    const currentSetter = editingSite ? setEditingSite : setNewSite;
    currentSetter(prev => ({ ...prev, [name]: value }));
  };
  
  const handleHostSelectChange = (value: string) => {
    const currentSetter = editingSite ? setEditingSite : setNewSite;
    currentSetter(prev => ({ ...prev, hostId: value }));
  };

  const handleSubmitSite = async () => {
    const dataToSubmit = editingSite ? 
      { ...(sites.find(s => s.siteId === editingSite.siteId) || {}), ...editingSite } : 
      { ...newSite };

    if (!dataToSubmit.nom || !dataToSubmit.hostId) {
      toast({ title: "Missing Information", description: "Please provide a site name and assign a host.", variant: "destructive" });
      return;
    }

    if (!hosts.some(h => h.hostId === dataToSubmit.hostId)) {
      toast({ title: "Invalid Host", description: "Please select a valid host.", variant: "destructive" });
      return;
    }

    try {
      if (editingSite && editingSite.siteId) { 
        // Simulate update for mock data
        setSites(prevSites => prevSites.map(s => s.siteId === editingSite.siteId ? { ...s, ...dataToSubmit } as Site : s));
        toast({ title: "Global Site Updated", description: `${dataToSubmit.nom} has been updated.` });
      } else { 
        await addSiteToData(dataToSubmit as Omit<Site, 'siteId'>);
        toast({ title: "Global Site Created", description: `${dataToSubmit.nom} has been added.` });
      }
      fetchData(); // Refetch all data
    } catch (error) {
      console.error("Failed to save site:", error);
      toast({ title: "Error", description: `Failed to save site. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    }
    
    setIsDialogOpen(false);
    setNewSite({ nom: '', hostId: hosts.length > 0 ? hosts[0].hostId : '' });
    setEditingSite(null);
  };
  
  const openAddDialog = () => {
    setEditingSite(null);
    setNewSite({ nom: '', hostId: hosts.length > 0 ? hosts[0].hostId : '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (siteToEdit: Site) => {
    setEditingSite({ ...siteToEdit });
    setIsDialogOpen(true);
  };
  
  const handleDeleteSite = (siteId: string) => {
     // Simulate delete for mock data
     setSites(prevSites => prevSites.filter(s => s.siteId !== siteId));
     toast({ title: "Global Site Deleted", description: `Site has been deleted (simulated).`, variant: "destructive" });
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
                            <div key={i} className="grid grid-cols-4 gap-4 items-center">
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
  
  const currentFormData = editingSite || newSite;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Manage Global Sites</h1>
          <p className="text-lg text-muted-foreground">Administer all global establishments (e.g., Hotels, Restaurants).</p>
        </div>
        <Button onClick={openAddDialog} disabled={hosts.length === 0}>
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Global Site
        </Button>
      </div>
      
      {hosts.length === 0 && !isLoading && (
        <Card className="mb-6 bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700/50">
          <CardHeader>
            <CardTitle className="text-yellow-700 dark:text-yellow-400">No Hosts Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-600 dark:text-yellow-500">You need to create Hosts first before you can assign them to Global Sites. Please go to "Manage Hosts" to add a host.</p>
             <Button variant="link" onClick={() => router.push('/admin/hosts')} className="text-yellow-700 dark:text-yellow-400 px-0">
                Go to Manage Hosts
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Global Sites</CardTitle>
          <CardDescription>List of all registered global sites. Current count: {sites.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site Name</TableHead>
                <TableHead>Managed by Host</TableHead>
                <TableHead>Site ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => (
                <TableRow key={site.siteId}>
                  <TableCell className="font-medium flex items-center">
                    <Building2 className="mr-2 h-5 w-5 text-primary" />
                    {site.nom}
                  </TableCell>
                  <TableCell>{hosts.find(h => h.hostId === site.hostId)?.nom || 'N/A'}</TableCell>
                  <TableCell>{site.siteId}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(site)} title="Edit Site">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteSite(site.siteId)} title="Delete Site">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {sites.length === 0 && <p className="p-4 text-center text-muted-foreground">No global sites added yet.</p>}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingSite ? 'Edit Global Site' : 'Add New Global Site'}</DialogTitle>
            <DialogDescription>
              {editingSite ? 'Modify details for this global site.' : 'Enter details for the new global site and assign a host to manage it.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">Site Name</Label>
              <Input id="nom" name="nom" value={currentFormData.nom || ''} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hostId" className="text-right">Managed by</Label>
              <Select 
                value={currentFormData.hostId || ''} 
                onValueChange={handleHostSelectChange} 
                disabled={hosts.length === 0}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={hosts.length > 0 ? "Select a host" : "No hosts available"} />
                </SelectTrigger>
                <SelectContent>
                  {hosts.map(host => (
                    <SelectItem key={host.hostId} value={host.hostId}>{host.nom} ({host.hostId})</SelectItem>
                  ))}
                  {hosts.length === 0 && <SelectItem value="" disabled>Create a host first</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitSite} disabled={hosts.length === 0 || !currentFormData.hostId}>
                {editingSite ? 'Save Changes' : 'Create Global Site'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


    