
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getUsers, addUser as addUserToData, getHosts } from '@/lib/data'; // Assuming getHosts exists
import type { User, UserRole, Host } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit2, Trash2, Shield, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

export default function AdminUsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  
  const [newUser, setNewUser] = useState<{ email: string; nom: string; role: UserRole; hostId?: string; motDePasse: string }>({
    email: '',
    nom: '',
    role: 'client',
    motDePasse: '1234', // Default password for new users
  });

  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      router.replace('/dashboard');
    } else if (user?.role === 'admin') {
      fetchData();
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const usersData = await getUsers();
      const hostsData = await getHosts();
      setUsers(usersData);
      setHosts(hostsData);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load user data.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | { name: string, value: string }) => {
    const { name, value } = 'target' in e ? e.target : e;
    if (editingUser) {
      setEditingUser(prev => ({ ...prev, [name]: value }));
    } else {
      setNewUser(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleRoleChange = (value: UserRole) => {
    if (editingUser) {
        setEditingUser(prev => ({...prev, role: value, hostId: value !== 'host' ? undefined : prev?.hostId || ''}));
    } else {
        setNewUser(prev => ({...prev, role: value, hostId: value !== 'host' ? undefined : prev?.hostId || ''}));
    }
  };
  
  const handleHostChange = (value: string) => {
    if (editingUser) {
        setEditingUser(prev => ({...prev, hostId: value}));
    } else {
        setNewUser(prev => ({...prev, hostId: value}));
    }
  };


  const handleSubmitUser = async () => {
    if (editingUser) { // Update logic (simplified for MVP)
      // const updatedUsers = users.map(u => u.id === editingUser.id ? { ...u, ...editingUser } as User : u);
      // setUsers(updatedUsers);
      // In a real app: await updateUserInData(editingUser);
      toast({ title: "User Updated", description: `${editingUser.nom} has been updated (simulated).` });
    } else { // Add new user
      if (!newUser.email || !newUser.nom || !newUser.motDePasse) {
        toast({ title: "Missing Information", description: "Please fill all required fields.", variant: "destructive" });
        return;
      }
      try {
        const createdUser = await addUserToData({
          email: newUser.email,
          nom: newUser.nom,
          role: newUser.role,
          hostId: newUser.role === 'host' ? newUser.hostId : undefined,
          motDePasse: newUser.motDePasse,
        });
        setUsers(prev => [...prev, createdUser]);
        toast({ title: "User Created", description: `${createdUser.nom} has been added.` });
      } catch (error) {
        toast({ title: "Error", description: "Failed to create user.", variant: "destructive" });
      }
    }
    setIsDialogOpen(false);
    setNewUser({ email: '', nom: '', role: 'client', motDePasse: '1234' }); // Reset form
    setEditingUser(null);
  };
  
  const openAddDialog = () => {
    setEditingUser(null);
    setNewUser({ email: '', nom: '', role: 'client', motDePasse: '1234' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (userToEdit: User) => {
    setEditingUser({...userToEdit});
    setIsDialogOpen(true);
  };
  
  const handleDeleteUser = (userId: string) => {
     // setUsers(users.filter(u => u.id !== userId));
     // In a real app: await deleteUserFromData(userId);
     toast({ title: "User Deleted", description: `User has been deleted (simulated).`, variant: "destructive" });
  };


  if (isLoading || authLoading) {
    return <div className="p-6">Loading user management...</div>;
  }
  
  const currentFormData = editingUser || newUser;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="text-lg text-muted-foreground">Administer all user accounts in ConnectHost.</p>
        </div>
        <Button onClick={openAddDialog}>
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
                <TableHead>Host ID (if applicable)</TableHead>
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
                  <TableCell>{u.hostId || 'N/A'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(u)} title="Edit User">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteUser(u.id)} title="Delete User" disabled={u.role === 'admin'}> {/* Prevent deleting admin for safety */}
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Modify the details of the existing user.' : 'Enter the details for the new user account.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">Name</Label>
              <Input id="nom" name="nom" value={currentFormData.nom || ''} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" name="email" type="email" value={currentFormData.email || ''} onChange={handleInputChange} className="col-span-3" />
            </div>
             {!editingUser && ( // Password field only for new users in this simplified form
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="motDePasse" className="text-right">Password</Label>
                <Input id="motDePasse" name="motDePasse" type="password" value={newUser.motDePasse} onChange={handleInputChange} className="col-span-3" />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Role</Label>
              <Select value={currentFormData.role || 'client'} onValueChange={handleRoleChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="host">Host</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {currentFormData.role === 'host' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="hostId" className="text-right">Host</Label>
                 <Select value={currentFormData.hostId || ''} onValueChange={handleHostChange}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Assign to a host" />
                    </SelectTrigger>
                    <SelectContent>
                        {hosts.length > 0 ? hosts.map(host => (
                            <SelectItem key={host.hostId} value={host.hostId}>{host.nom} ({host.hostId})</SelectItem>
                        )) : <SelectItem value="" disabled>No hosts available</SelectItem>}
                    </SelectContent>
                 </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitUser}>{editingUser ? 'Save Changes' : 'Create User'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

