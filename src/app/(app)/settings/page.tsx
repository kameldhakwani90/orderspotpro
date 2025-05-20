
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import type { User, Order, Client, RoomOrTable, Host as HostType, Service as ServiceType } from "@/lib/types"; // Added Client, RoomOrTable, HostType, ServiceType
import { updateUser, getOrdersByUserId, getClientRecordsByEmail, getHostById, getRoomOrTableById, getServiceById } from "@/lib/data"; // Added new data functions
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingBag, MapPin, CalendarDays, ListOrdered, Info } from "lucide-react";


export default function SettingsPage() {
  const { user, setUser: setAuthUser, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  
  const [currentUserName, setCurrentUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State for client-specific data
  const [clientOrders, setClientOrders] = useState<(Order & { serviceName?: string; locationName?: string; hostName?: string })[]>([]);
  const [clientStays, setClientStays] = useState<(Client & { hostName?: string; locationFullName?: string; totalSpent?: number; netDue?: number })[]>([]);
  const [isClientDataLoading, setIsClientDataLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setCurrentUserName(user.nom);
      if (user.role === 'client') {
        fetchClientSpecificData(user);
      }
    }
  }, [user]);

  const fetchClientSpecificData = useCallback(async (loggedInUser: User) => {
    if (!loggedInUser.id || !loggedInUser.email) return;
    setIsClientDataLoading(true);
    try {
      // Fetch orders by user ID
      const ordersData = await getOrdersByUserId(loggedInUser.id);
      const enrichedOrders = await Promise.all(
        ordersData.map(async (order) => {
          const service = await getServiceById(order.serviceId);
          const location = await getRoomOrTableById(order.chambreTableId);
          const host = await getHostById(order.hostId);
          return {
            ...order,
            serviceName: service?.titre || 'Unknown Service',
            locationName: location ? `${location.type} ${location.nom}` : 'Unknown Location',
            hostName: host?.nom || 'Unknown Establishment'
          };
        })
      );
      setClientOrders(enrichedOrders);

      // Fetch client records by email (a user can be a client at multiple hosts)
      const clientRecordsData = await getClientRecordsByEmail(loggedInUser.email);
      const enrichedStays = await Promise.all(
          clientRecordsData.map(async (clientRecord) => {
              const host = await getHostById(clientRecord.hostId);
              let locationFullName: string | undefined = undefined;
              if (clientRecord.locationId) {
                  const loc = await getRoomOrTableById(clientRecord.locationId);
                  if (loc) locationFullName = `${loc.type} ${loc.nom}`;
              }

              // Calculate total spent for this client at this specific host
              const hostSpecificOrders = enrichedOrders.filter(o => o.hostId === clientRecord.hostId && (o.status === 'completed' || o.status === 'confirmed'));
              const totalSpentAtHost = hostSpecificOrders.reduce((sum, order) => sum + (order.prix || 0), 0);
              const netDueAtHost = totalSpentAtHost - (clientRecord.credit || 0);

              return {
                  ...clientRecord,
                  hostName: host?.nom || 'Unknown Establishment',
                  locationFullName: locationFullName,
                  totalSpent: totalSpentAtHost,
                  netDue: netDueAtHost,
              };
          })
      );
      setClientStays(enrichedStays);

    } catch (error) {
      console.error("Failed to fetch client specific data:", error);
      toast({ title: "Error", description: "Could not load your activity details.", variant: "destructive" });
    } finally {
      setIsClientDataLoading(false);
    }
  }, [toast]);


  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentUserName.trim()) {
        toast({ title: "Name Required", description: "Your name cannot be empty.", variant: "destructive"});
        return;
    }
    try {
      const updatedUser = await updateUser(user.id, { nom: currentUserName.trim() });
      if (updatedUser) {
        setAuthUser(updatedUser); // Update user in AuthContext
        toast({ title: "Profile Updated", description: "Your profile information has been saved." });
      } else {
        toast({ title: "Update Failed", description: "Could not update profile.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Error", description: "An error occurred while updating your profile.", variant: "destructive" });
    }
  };
  
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 4) { 
        toast({ title: "Password Too Short", description: "Password must be at least 4 characters.", variant: "destructive" });
        return;
    }
    // In a real app, this would call an API to change password, including current password for verification.
    // For MVP with Firestore user collection (not Firebase Auth users), direct password update is complex.
    // We'll simulate for now if no direct updateUserPassword function exists.
    console.warn("Password change simulation. Real implementation would require secure backend logic and ideally Firebase Auth or similar.");
    toast({ title: "Password Change Simulated", description: "Your password has been updated (simulated)." });
    setNewPassword('');
    setConfirmPassword('');
  };

  if (authIsLoading || !user) {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-8">
            <Skeleton className="h-10 w-1/3 mb-2" />
            <Skeleton className="h-6 w-1/2 mb-6" />
            <Skeleton className="h-60 w-full" />
            <Skeleton className="h-40 w-full" />
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-lg text-muted-foreground">Manage your account preferences and information.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                value={currentUserName} 
                onChange={(e) => setCurrentUserName(e.target.value)} 
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={user.email} 
                disabled 
              />
            </div>
            <Button type="submit">Save Profile</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password. (Simulated)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword" 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button type="submit">Change Password</Button>
          </form>
        </CardContent>
      </Card>
      
      {user.role === 'client' && (
        <>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><ShoppingBag className="mr-2 h-5 w-5 text-primary" /> My Recent Orders</CardTitle>
              <CardDescription>Overview of your recent service requests across all establishments.</CardDescription>
            </CardHeader>
            <CardContent>
              {isClientDataLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : clientOrders.length > 0 ? (
                <ul className="space-y-3 max-h-96 overflow-y-auto">
                  {clientOrders.map(order => (
                    <li key={order.id} className="p-3 bg-muted/50 rounded-md text-sm">
                      <div className="font-semibold">{order.serviceName} at {order.hostName}</div>
                      <div className="text-xs text-muted-foreground">
                        Location: {order.locationName} - Date: {new Date(order.dateHeure).toLocaleDateString()}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <Badge variant={order.status === 'completed' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'} className="capitalize">{order.status}</Badge>
                        {order.prix && <span className="font-medium text-primary">${order.prix.toFixed(2)}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">You haven't placed any orders yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><ListOrdered className="mr-2 h-5 w-5 text-primary" /> My Stays & Billing</CardTitle>
              <CardDescription>Information about your stays and credit at various establishments.</CardDescription>
            </CardHeader>
            <CardContent>
              {isClientDataLoading ? (
                <Skeleton className="h-60 w-full" />
              ) : clientStays.length > 0 ? (
                <div className="space-y-6">
                  {clientStays.map(stay => (
                    <Card key={stay.id} className="bg-card">
                      <CardHeader>
                        <CardTitle className="text-xl text-primary">{stay.hostName}</CardTitle>
                        {stay.type === 'heberge' && stay.dateArrivee && (
                           <CardDescription className="text-xs">
                            Stay: {new Date(stay.dateArrivee).toLocaleDateString()} - {stay.dateDepart ? new Date(stay.dateDepart).toLocaleDateString() : 'Ongoing'}
                           </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {stay.type === 'heberge' && stay.locationFullName && (
                             <div className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" /> Current Location: {stay.locationFullName}</div>
                        )}
                        <div className="flex items-center"><Info className="mr-2 h-4 w-4 text-muted-foreground" /> Client Type: <span className="ml-1 capitalize">{stay.type}</span></div>
                        <div className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-green-500" /> Available Credit: <span className="ml-1 font-semibold">${(stay.credit || 0).toFixed(2)}</span></div>
                        <div className="flex items-center"><ShoppingBag className="mr-2 h-4 w-4 text-blue-500" /> Total Spent: <span className="ml-1 font-semibold">${(stay.totalSpent || 0).toFixed(2)}</span></div>
                        <div className="flex items-center font-bold"><DollarSign className="mr-2 h-4 w-4 text-red-500" /> Net Due: <span className="ml-1 text-red-600">${(stay.netDue || 0).toFixed(2)}</span></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No specific stay or billing information found for your email.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Theme Preferences</CardTitle>
          <CardDescription>Customize the application appearance (not functional in MVP).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Theme selection (Light/Dark) will be available in a future update.</p>
             <Button variant="outline" disabled>Toggle Dark Mode (Soon)</Button>
        </CardContent>
      </Card>
    </div>
  );
}
