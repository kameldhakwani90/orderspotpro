
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getHosts, addHost as addHostToData, updateHost as updateHostInData, deleteHost as deleteHostInData } from '@/lib/data';
import type { Host } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit2, Trash2, UserCog } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminHostsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [hosts, setHosts] = useState<Host[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHost, setEditingHost] = useState<Partial<Host> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newHost, setNewHost] = useState<{ nom: string; email: string }>({
    nom: '',
    email: '',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const hostsData = await getHosts();
      setHosts(hostsData);
    } catch (error) {
      console.error("Failed to load hosts data:", error);
      toast({ title: "Error loading hosts", description: "Could not load hosts. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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
    const currentSetter = editingHost ? setEditingHost : setNewHost;
    currentSetter(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitHost = async () => {
    setIsSubmitting(true);
    const isEditing = !!(editingHost && editingHost.hostId);
    const dataToSubmit = isEditing ? 
      { ...(hosts.find(h => h.hostId === editingHost!.hostId) || {}), ...editingHost } : 
      { ...newHost };

    if (!dataToSubmit.nom || !dataToSubmit.email) {
      toast({ title: "Missing Information", description: "Please provide a host name and email.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(dataToSubmit.email!)) {
        toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    try {
      if (isEditing) { 
        await updateHostInData(editingHost!.hostId!, dataToSubmit as Partial<Host>);
        toast({ title: "Host Updated", description: `${dataToSubmit.nom} has been updated.` });
      } else { 
        await addHostToData(dataToSubmit as Omit<Host, 'hostId'>);
        toast({ title: "Host Created", description: `${dataToSubmit.nom} has been added. A user account with default password '1234' was also created for this host.` });
      }
      await fetchData(); 
    } catch (error) {
      console.error("Failed to save host:", error);
      toast({ title: "Error saving host", description: `Could not save the host. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    }
    
    setIsDialogOpen(false);
    setNewHost({ nom: '', email: '' });
    setEditingHost(null);
    setIsSubmitting(false);
  };
  
  const openAddDialog = () => {
    setEditingHost(null);
    setNewHost({ nom: '', email: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (hostToEdit: Host) => {
    setEditingHost({ ...hostToEdit });
    setIsDialogOpen(true);
  };
  
  const handleDeleteHost = async (hostId: string, hostName: string) => {
     if (!window.confirm(`Are you sure you want to delete host "${hostName}"? This will also affect associated users, sites, and services.`)) {
        return;
     }
     setIsSubmitting(true);
     try {
        await deleteHostInData(hostId);
        toast({ title: "Host Deleted", description: `Host "${hostName}" and associated data have been deleted.`, variant: "destructive" });
        await fetchData();
     } catch (error) {
        console.error("Failed to delete host:", error);
        toast({ title: "Error deleting host", description: `Could not delete the host. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
     }
     setIsSubmitting(false);
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
  
  const currentFormData = editingHost || newHost;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Manage Hosts</h1>
          <p className="text-lg text-muted-foreground">Administer all host accounts and their primary details.</p>
        </div>
        <Button onClick={openAddDialog} disabled={isSubmitting}>
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Host
        </Button>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Hosts</CardTitle>
          <CardDescription>List of all registered hosts. Current count: {hosts.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Host Name</TableHead>
                <TableHead>Host Email</TableHead>
                <TableHead>Host ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hosts.map((host) => (
                    <TableRow key={host.hostId}>
                    <TableCell className="font-medium flex items-center">
                        <UserCog className="mr-2 h-5 w-5 text-primary" />
                        {host.nom}
                    </TableCell>
                    <TableCell>{host.email}</TableCell>
                    <TableCell>{host.hostId}</TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(host)} title="Edit Host" disabled={isSubmitting}>
                        <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteHost(host.hostId, host.nom)} title="Delete Host" disabled={isSubmitting}>
                        <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
           {hosts.length === 0 && <p className="p-4 text-center text-muted-foreground">No hosts added yet.</p>}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {if(!isSubmitting) setIsDialogOpen(open)}}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingHost ? 'Edit Host' : 'Add New Host'}</DialogTitle>
            <DialogDescription>
              {editingHost ? 'Modify details for this host.' : 'Enter details for the new host. A user account will be created automatically.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">Host Name</Label>
              <Input id="nom" name="nom" value={currentFormData.nom || ''} onChange={handleInputChange} className="col-span-3" placeholder="e.g., Grand Hotel Management" disabled={isSubmitting}/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Host Email</Label>
              <Input id="email" name="email" type="email" value={currentFormData.email || ''} onChange={handleInputChange} className="col-span-3" placeholder="e.g., manager@grandhotel.com" disabled={isSubmitting}/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmitHost} disabled={isSubmitting}>
                {isSubmitting ? (editingHost ? 'Saving...' : 'Creating...') : (editingHost ? 'Save Changes' : 'Create Host')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    