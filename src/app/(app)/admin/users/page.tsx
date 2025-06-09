
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getUsers, addUser, updateUser, deleteUser, getHosts } from '@/lib/data';
import type { User, UserRole, Host } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit2, Trash2, Shield, UserPlus, BadgeInfo, Settings } from 'lucide-react';
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

const defaultMenuPermissions = {
    dashboard: true,
    orders: true,
    productionDisplay: true,
    reservations: true,
    clients: true,
    configuration: true,
};

const hostMenuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'orders', label: 'Client Orders' },
    { id: 'productionDisplay', label: 'Production Display' },
    { id: 'reservations', label: 'Reservations' },
    { id: 'clients', label: 'Gestion Clients' },
    { id: 'configuration', label: 'Configuration (Full Access)' },
];

export default function AdminUsersPage() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [currentUserData, setCurrentUserData] = useState<{
    email: string;
    nom: string;
    role: UserRole;
    hostId?: string;
    motDePasse: string;
    employeeType?: string;
    menuPermissions?: Record<string, boolean>;
  }>({
    email: '',
    nom: '',
    role: 'client',
    motDePasse: '1234',
    employeeType: '',
    menuPermissions: { ...defaultMenuPermissions },
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersData, hostsData] = await Promise.all([getUsers(), getHosts()]);
      setUsers(usersData);
      setHosts(hostsData);
    } catch (error) {
      console.error("Failed to load user or host data:", error);
      toast({ title: "Error", description: "Failed to load user data. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading) {
      if (authUser?.role !== 'admin') {
        router.replace('/dashboard');
      } else {
        fetchData();
      }
    }
  }, [authUser, authLoading, router, fetchData]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentUserData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRoleChange = (value: UserRole) => {
    setCurrentUserData(prev => ({
        ...prev,
        role: value,
        hostId: value === 'host' ? (prev.hostId || (hosts.length > 0 ? hosts[0].hostId : '')) : undefined,
        employeeType: value !== 'host' ? '' : prev.employeeType,
        menuPermissions: value !== 'host' ? { ...defaultMenuPermissions } : (prev.employeeType ? prev.menuPermissions : { ...defaultMenuPermissions }),
    }));
  };
  
  const handleHostChange = (value: string) => {
    setCurrentUserData(prev => ({...prev, hostId: value}));
  };

  const handleMenuPermissionChange = (permissionKey: string, checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
      setCurrentUserData(prev => ({
        ...prev,
        menuPermissions: {
          ...(prev.menuPermissions || defaultMenuPermissions),
          [permissionKey]: checked,
        }
      }));
    }
  };


  const handleSubmitUser = async () => {
    setIsSubmitting(true);
    
    const dataToSubmit = { ...currentUserData };

    if (!dataToSubmit.email?.trim() || !dataToSubmit.nom?.trim()) {
      toast({ title: "Missing Information", description: "Please fill in name and email.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (!editingUser && (!dataToSubmit.motDePasse || dataToSubmit.motDePasse.trim() === '')) {
        toast({ title: "Missing Information", description: "Please provide a non-empty password for new users.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    if (dataToSubmit.role === 'host' && !dataToSubmit.hostId && hosts.length > 0) {
      toast({ title: "Host Assignment Required", description: "Please assign a host to users with the 'host' role.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const userPayload: Partial<User> = {
        nom: dataToSubmit.nom,
        email: dataToSubmit.email,
        role: dataToSubmit.role,
        hostId: dataToSubmit.role === 'host' ? dataToSubmit.hostId : undefined,
        employeeType: dataToSubmit.role === 'host' && dataToSubmit.employeeType?.trim() ? dataToSubmit.employeeType.trim() : undefined,
        menuPermissions: dataToSubmit.role === 'host' && dataToSubmit.employeeType?.trim() ? dataToSubmit.menuPermissions : undefined,
      };

      if (editingUser && editingUser.id) {
        await updateUser(editingUser.id, userPayload);
        toast({ title: "User Updated", description: `${dataToSubmit.nom} has been updated.` });
      } else {
        await addUser({
          ...userPayload,
          motDePasse: dataToSubmit.motDePasse!.trim(),
        } as Omit<User, 'id'>);
        toast({ title: "User Created", description: `${dataToSubmit.nom} has been added.` });
      }
      await fetchData(); 
    } catch (error) {
        console.error("Failed to save user:", error);
        toast({ title: "Error", description: `Failed to save user. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
        setIsDialogOpen(false);
        setCurrentUserData({ email: '', nom: '', role: 'client', motDePasse: '1234', hostId: hosts.length > 0 ? hosts[0].hostId : '', employeeType: '', menuPermissions: { ...defaultMenuPermissions } });
        setEditingUser(null);
    }
  };
  
  const openAddDialog = () => {
    setEditingUser(null);
    const initialRole: UserRole = 'client';
    const initialHostId = initialRole === 'host' && hosts.length > 0 ? hosts[0].hostId : undefined;
    setCurrentUserData({ email: '', nom: '', role: initialRole, hostId: initialHostId, motDePasse: '1234', employeeType: '', menuPermissions: { ...defaultMenuPermissions } });
    setIsDialogOpen(true);
  };

  const openEditDialog = (userToEdit: User) => {
    setEditingUser(userToEdit);
    let effectiveHostId = userToEdit.hostId;
    if (userToEdit.role === 'host' && !userToEdit.hostId && hosts.length > 0) {
        effectiveHostId = hosts[0].hostId; 
    }
    setCurrentUserData({
        email: userToEdit.email,
        nom: userToEdit.nom,
        role: userToEdit.role,
        hostId: effectiveHostId,
        motDePasse: '', 
        employeeType: userToEdit.employeeType || '',
        menuPermissions: userToEdit.menuPermissions || { ...defaultMenuPermissions },
    });
    setIsDialogOpen(true);
  };
  
  const handleDeleteUser = async (userId: string, userName: string) => {
     if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) return;
     setIsSubmitting(true);
     try {
        await deleteUser(userId);
        toast({ title: "User Deleted", description: `User "${userName}" has been deleted.`, variant: "destructive" });
        await fetchData(); 
     } catch (error) {
        console.error("Failed to delete user:", error);
        toast({ title: "Error deleting user", description: `Could not delete user. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
     }
     setIsSubmitting(false);
  };


  if (isLoading || authLoading) {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <div><Skeleton className="h-10 w-72 mb-2" /><Skeleton className="h-6 w-96" /></div>
                <Skeleton className="h-10 w-36" />
            </div>
            <Card className="shadow-lg">
                <CardHeader><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-5 w-64" /></CardHeader>
                <CardContent><div className="space-y-4">{[...Array(3)].map((_, i) => (<div key={i} className="grid grid-cols-5 gap-4 items-center"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-8 w-full" /></div>))}</div></CardContent>
            </Card>
        </div>
    );
  }
  
  const isEmployeeTypeActive = currentUserData.role === 'host' && !!currentUserData.hostId && !!currentUserData.employeeType?.trim();

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="text-lg text-muted-foreground">Administer all user accounts in ConnectHost.</p>
        </div>
        <Button onClick={openAddDialog} disabled={isSubmitting}>
          <UserPlus className="mr-2 h-5 w-5" /> Add New User
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>List of all registered users. Current count: {users.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Host / Employee Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nom}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                      u.role === 'admin' ? 'bg-red-100 text-red-700' :
                      u.role === 'host' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    {u.hostId ? (hosts.find(h => h.hostId === u.hostId)?.nom || u.hostId) : 'N/A'}
                    {u.employeeType && <span className="text-xs text-muted-foreground ml-1">({u.employeeType})</span>}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(u)} title="Edit User" disabled={isSubmitting}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteUser(u.id, u.nom)} title="Delete User" disabled={(u.role === 'admin' && u.id === authUser?.id) || isSubmitting}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {users.length === 0 && <p className="p-4 text-center text-muted-foreground">No users found in the system.</p>}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!isSubmitting) setIsDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Modify the details of the existing user.' : 'Enter the details for the new user account.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">Name</Label>
              <Input id="nom" name="nom" value={currentUserData.nom || ''} onChange={handleInputChange} className="col-span-3" disabled={isSubmitting} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" name="email" type="email" value={currentUserData.email || ''} onChange={handleInputChange} className="col-span-3" disabled={isSubmitting || !!editingUser} />
            </div>
             {!editingUser && ( 
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="motDePasse" className="text-right">Password</Label>
                <Input id="motDePasse" name="motDePasse" type="password" value={currentUserData.motDePasse} onChange={handleInputChange} className="col-span-3" disabled={isSubmitting} />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Role</Label>
              <Select 
                value={currentUserData.role || 'client'} 
                onValueChange={handleRoleChange} 
                disabled={isSubmitting || (editingUser?.role === 'admin' && editingUser.id === authUser?.id)} 
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin" disabled={(editingUser?.role === 'admin' && editingUser.id === authUser?.id) || (authUser?.role !== 'admin')}>Admin</SelectItem>
                  <SelectItem value="host">Host / Employee</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {currentUserData.role === 'host' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="hostId" className="text-right">Host Account</Label>
                   <Select 
                      value={currentUserData.hostId || (hosts.length > 0 ? hosts[0].hostId : '')} 
                      onValueChange={handleHostChange} 
                      disabled={isSubmitting || hosts.length === 0}
                    >
                      <SelectTrigger className="col-span-3">
                          <SelectValue placeholder={hosts.length > 0 ? "Assign to a host" : "No hosts available"} />
                      </SelectTrigger>
                      <SelectContent>
                          {hosts.length > 0 ? hosts.map(host => (
                              <SelectItem key={host.hostId} value={host.hostId}>{host.nom} ({host.hostId.slice(-5)})</SelectItem>
                          )) : <SelectItem value="" disabled>No hosts available to assign</SelectItem>}
                      </SelectContent>
                   </Select>
                </div>
                {currentUserData.hostId && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="employeeType" className="text-right">Employee Type</Label>
                      <Input id="employeeType" name="employeeType" value={currentUserData.employeeType || ''} onChange={handleInputChange} className="col-span-3" placeholder="e.g., Chef, Serveur (optional)" disabled={isSubmitting} />
                    </div>
                     <p className="col-span-4 text-xs text-muted-foreground px-1">
                        Si "Employee Type" est vide, l'utilisateur est considéré comme un propriétaire/manager de l'établissement avec tous les accès. Sinon, les permissions ci-dessous s'appliquent.
                    </p>
                    <div className="col-span-4 mt-2">
                      <Label className="font-semibold text-sm flex items-center"><Settings className="mr-2 h-4 w-4 text-primary"/>Host Menu Permissions</Label>
                      <Card className="mt-1 p-3 bg-muted/30">
                        <div className="space-y-2">
                          {hostMenuItems.map(item => (
                            <div key={item.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`perm-${item.id}`}
                                checked={currentUserData.menuPermissions?.[item.id] ?? (isEmployeeTypeActive ? false : true) }
                                onCheckedChange={(checked) => handleMenuPermissionChange(item.id, checked)}
                                disabled={isSubmitting || !isEmployeeTypeActive}
                              />
                              <Label htmlFor={`perm-${item.id}`} className={`font-normal ${!isEmployeeTypeActive ? 'text-muted-foreground italic' : ''}`}>
                                {item.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {!isEmployeeTypeActive && <p className="text-xs text-muted-foreground mt-2 italic">Les permissions sont actives si un "Employee Type" est défini.</p>}
                      </Card>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button 
              onClick={handleSubmitUser} 
              disabled={isSubmitting || (currentUserData.role === 'host' && !currentUserData.hostId && hosts.length > 0) }
            >
              {editingUser ? (isSubmitting ? 'Saving...' : 'Save Changes') : (isSubmitting ? 'Creating...' : 'Create User')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    