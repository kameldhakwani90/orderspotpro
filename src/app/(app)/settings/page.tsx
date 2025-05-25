
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import type { User, Order, Client, RoomOrTable, Host as HostType, Service as ServiceType, Reservation } from "@/lib/types";
import { updateUser, getOrdersByUserId, getClientRecordsByEmail, getHostById, getRoomOrTableById, getServiceById, getReservationsByUserId } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingBag, MapPin, CalendarDays, ListOrdered, Info, Hotel, LogOut as LogOutIcon } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";


export default function SettingsPage() {
  const { user, setUser: setAuthUser, isLoading: authIsLoading, logout } = useAuth();
  const { toast } = useToast();

  const [currentUserName, setCurrentUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [clientOrders, setClientOrders] = useState<(Order & { serviceName?: string; locationName?: string; hostName?: string })[]>([]);
  const [clientStays, setClientStays] = useState<(Client & { hostName?: string; locationFullName?: string; totalSpent?: number; netDue?: number })[]>([]);
  const [clientReservations, setClientReservations] = useState<(Reservation & { hostName?: string; locationFullName?: string })[]>([]);
  const [isClientDataLoading, setIsClientDataLoading] = useState(false);

  const fetchClientSpecificData = useCallback(async (loggedInUser: User) => {
    if (!loggedInUser.id || !loggedInUser.email) return;
    setIsClientDataLoading(true);
    try {
      const [ordersData, clientRecordsData, reservationsData] = await Promise.all([
        getOrdersByUserId(loggedInUser.id),
        getClientRecordsByEmail(loggedInUser.email),
        getReservationsByUserId(loggedInUser.id) // Assuming this function exists or will be created
      ]);

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

      const enrichedStays = await Promise.all(
          clientRecordsData.map(async (clientRecord) => {
              const host = await getHostById(clientRecord.hostId);
              let locationFullName: string | undefined = undefined;
              if (clientRecord.locationId) {
                  const loc = await getRoomOrTableById(clientRecord.locationId);
                  if (loc) locationFullName = `${loc.type} ${loc.nom}`;
              }
              const hostSpecificOrders = enrichedOrders.filter(o => o.hostId === clientRecord.hostId && (o.status === 'completed' || o.status === 'confirmed'));
              const totalSpentAtHost = hostSpecificOrders.reduce((sum, order) => sum + (order.prixTotal || 0), 0);
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

      const enrichedReservations = await Promise.all(
        reservationsData.map(async (res) => {
            const host = await getHostById(res.hostId);
            const location = await getRoomOrTableById(res.locationId);
            return {
                ...res,
                hostName: host?.nom || 'Unknown Establishment',
                locationFullName: location ? `${location.type} ${location.nom}` : 'Unknown Location',
            };
        })
      );
      setClientReservations(enrichedReservations);

    } catch (error) {
      console.error("Failed to fetch client specific data:", error);
      toast({ title: "Error", description: "Could not load your activity details.", variant: "destructive" });
    } finally {
      setIsClientDataLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      setCurrentUserName(user.nom);
      if (user.role === 'client') {
        fetchClientSpecificData(user);
      }
    }
  }, [user, fetchClientSpecificData]);


  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentUserName.trim()) {
        toast({ title: "Name Required", description: "Your name cannot be empty.", variant: "destructive"});
        return;
    }
    try {
      const updatedUser = await updateUser(user.id, { nom: currentUserName.trim() });
      if (updatedUser) {
        setAuthUser(updatedUser);
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
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Settings & My Account</h1>
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
              <CardTitle className="flex items-center"><Hotel className="mr-2 h-5 w-5 text-primary" /> My Stays & Reservations</CardTitle>
              <CardDescription>Overview of your current and past stays.</CardDescription>
            </CardHeader>
            <CardContent>
              {isClientDataLoading ? (
                <Skeleton className="h-60 w-full" />
              ) : clientReservations.length > 0 ? (
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {clientReservations.map(res => (
                    <Card key={res.id} className="bg-card border shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-primary">{res.hostName} - {res.locationFullName}</CardTitle>
                        <CardDescription className="text-xs">
                          {format(parseISO(res.dateArrivee), 'PPP', { locale: fr })}
                          {res.dateDepart ? ` - ${format(parseISO(res.dateDepart), 'PPP', { locale: fr })}` : ' (Table Reservation)'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p>Status: <Badge variant={res.status === 'cancelled' ? 'destructive' : 'secondary'} className="capitalize">{res.status}</Badge></p>
                        <p>Guests: {res.nombrePersonnes}</p>
                        {res.notes && <p className="text-xs text-muted-foreground">Notes: {res.notes}</p>}
                         {res.onlineCheckinStatus === 'pending-review' && <Badge variant="outline" className="mt-1">Online Check-in Pending</Badge>}
                        {res.onlineCheckinStatus === 'completed' && <Badge variant="default" className="mt-1">Online Check-in Complete</Badge>}
                        {(res.status === 'checked-in' || (res.status === 'confirmed' && new Date(res.dateArrivee) <= new Date())) && (
                           <Link href={`/checkout/${res.id}`} className="block mt-3">
                             <Button variant="outline" size="sm" className="w-full">
                               <LogOutIcon className="mr-2 h-4 w-4" /> Proceed to Check-out
                             </Button>
                           </Link>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">You have no active or past reservations.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><ShoppingBag className="mr-2 h-5 w-5 text-primary" /> My Recent Orders</CardTitle>
              <CardDescription>Overview of your recent service requests.</CardDescription>
            </CardHeader>
            <CardContent>
              {isClientDataLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : clientOrders.length > 0 ? (
                <ul className="space-y-3 max-h-96 overflow-y-auto">
                  {clientOrders.map(order => (
                    <li key={order.id} className="p-3 bg-muted/50 rounded-md text-sm border">
                      <div className="font-semibold">{order.serviceName} at {order.hostName}</div>
                      <div className="text-xs text-muted-foreground">
                        Location: {order.locationName} - Date: {format(parseISO(order.dateHeure), 'Pp', {locale: fr})}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <Badge variant={order.status === 'completed' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'} className="capitalize">{order.status}</Badge>
                        {order.prixTotal && <span className="font-medium text-primary">${order.prixTotal.toFixed(2)}</span>}
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
              <CardTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5 text-primary" /> My Billing & Loyalty</CardTitle>
              <CardDescription>Your credit and loyalty points across establishments.</CardDescription>
            </CardHeader>
            <CardContent>
              {isClientDataLoading ? (
                <Skeleton className="h-60 w-full" />
              ) : clientStays.length > 0 ? (
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {clientStays.map(stay => (
                    <Card key={stay.id} className="bg-card border shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-primary">{stay.hostName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1 text-sm">
                        <div className="flex items-center"><Info className="mr-2 h-4 w-4 text-muted-foreground" /> Client Type: <span className="ml-1 capitalize">{stay.type}</span></div>
                        <div className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-green-500" /> Credit: <span className="ml-1 font-semibold">${(stay.credit || 0).toFixed(2)}</span></div>
                         <div className="flex items-center text-amber-600"><ListOrdered className="mr-2 h-4 w-4" /> Loyalty Points: <span className="ml-1 font-semibold">{stay.pointsFidelite || 0} pts</span></div>
                        <div className="flex items-center text-blue-500"><ShoppingBag className="mr-2 h-4 w-4" /> Total Spent: <span className="ml-1 font-semibold">${(stay.totalSpent || 0).toFixed(2)}</span></div>
                        <div className="flex items-center font-bold text-red-600"><DollarSign className="mr-2 h-4 w-4" /> Net Due: <span className="ml-1">${(stay.netDue || 0).toFixed(2)}</span></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No specific billing or loyalty information found for your email across our establishments.</p>
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

