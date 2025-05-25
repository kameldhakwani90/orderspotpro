
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import type { User, Order, Client, RoomOrTable, Host as HostType, Service as ServiceType, Reservation } from "@/lib/types";
import { updateUser, getOrdersByUserId, getClientRecordsByEmail, getHostById, getRoomOrTableById, getServiceById, getReservationsByUserId } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingBag, MapPin, CalendarDays, ListOrdered, Info, Hotel, LogOut as LogOutIcon, Search, FileText as InvoiceIcon } from "lucide-react";
import Link from "next/link";
import { format, parseISO, isValid } from "date-fns";
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
  
  const [reservationFilter, setReservationFilter] = useState('');


  const fetchClientSpecificData = useCallback(async (loggedInUser: User) => {
    if (!loggedInUser.id || !loggedInUser.email) return;
    setIsClientDataLoading(true);
    try {
      const [ordersData, clientRecordsData, reservationsData] = await Promise.all([
        getOrdersByUserId(loggedInUser.id), // Assumes it uses user.id to match Order.userId
        getClientRecordsByEmail(loggedInUser.email),
        getReservationsByUserId(loggedInUser.id) // Assumes it uses user.id to match Reservation.clientId
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
              // For total spent and net due, we consider orders where the logged-in user is the one who placed them
              const hostSpecificOrders = ordersData.filter(o => o.hostId === clientRecord.hostId && (o.status === 'completed' || o.status === 'confirmed'));
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

  const filteredClientReservations = clientReservations.filter(res => {
    const searchTerm = reservationFilter.toLowerCase();
    return (
      res.id.toLowerCase().includes(searchTerm) ||
      (res.hostName && res.hostName.toLowerCase().includes(searchTerm)) ||
      (res.locationFullName && res.locationFullName.toLowerCase().includes(searchTerm)) ||
      (isValid(parseISO(res.dateArrivee)) && format(parseISO(res.dateArrivee), 'PPP', { locale: fr }).toLowerCase().includes(searchTerm))
    );
  });


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
              <CardTitle className="flex items-center"><Hotel className="mr-2 h-5 w-5 text-primary" /> Mes Réservations</CardTitle>
              <CardDescription>Aperçu de vos réservations actuelles et passées.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Rechercher par ID, établissement, lieu ou date..."
                  value={reservationFilter}
                  onChange={(e) => setReservationFilter(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              {isClientDataLoading ? (
                <Skeleton className="h-60 w-full" />
              ) : filteredClientReservations.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID Rés.</TableHead>
                        <TableHead>Établissement</TableHead>
                        <TableHead>Lieu</TableHead>
                        <TableHead>Arrivée</TableHead>
                        <TableHead>Départ</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClientReservations.map(res => (
                        <TableRow key={res.id}>
                          <TableCell className="font-medium text-xs">#{res.id.slice(-6)}</TableCell>
                          <TableCell>{res.hostName}</TableCell>
                          <TableCell>{res.locationFullName}</TableCell>
                          <TableCell>{isValid(parseISO(res.dateArrivee)) ? format(parseISO(res.dateArrivee), 'dd/MM/yy') : 'N/A'}</TableCell>
                          <TableCell>{res.dateDepart && isValid(parseISO(res.dateDepart)) ? format(parseISO(res.dateDepart), 'dd/MM/yy') : (res.type === 'Table' ? 'N/A' : 'N/A')}</TableCell>
                          <TableCell><Badge variant={res.status === 'cancelled' ? 'destructive' : 'secondary'} className="capitalize text-xs">{res.status || 'N/A'}</Badge></TableCell>
                          <TableCell>
                            <Link href={`/client/reservations/${res.id}`}>
                              <Button variant="outline" size="sm">Voir Détails</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {reservationFilter ? "Aucune réservation ne correspond à votre recherche." : "Vous n'avez aucune réservation."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><ShoppingBag className="mr-2 h-5 w-5 text-primary" /> Mes Commandes Récentes</CardTitle>
              <CardDescription>Aperçu de vos demandes de service récentes.</CardDescription>
            </CardHeader>
            <CardContent>
              {isClientDataLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : clientOrders.length > 0 ? (
                <ul className="space-y-3 max-h-96 overflow-y-auto">
                  {clientOrders.map(order => (
                    <li key={order.id} className="p-3 bg-muted/50 rounded-md text-sm border">
                      <div className="font-semibold">{order.serviceName} à {order.hostName}</div>
                      <div className="text-xs text-muted-foreground">
                        Lieu: {order.locationName} - Date: {format(parseISO(order.dateHeure), 'Pp', {locale: fr})}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <Badge variant={order.status === 'completed' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'} className="capitalize">{order.status}</Badge>
                        {order.prixTotal && <span className="font-medium text-primary">${order.prixTotal.toFixed(2)}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Vous n'avez passé aucune commande récemment.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5 text-primary" /> Ma Facturation & Fidélité</CardTitle>
              <CardDescription>Votre crédit et vos points de fidélité par établissement.</CardDescription>
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
                        <div className="flex items-center"><Info className="mr-2 h-4 w-4 text-muted-foreground" /> Type de client: <span className="ml-1 capitalize">{stay.type}</span></div>
                        <div className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-green-500" /> Crédit: <span className="ml-1 font-semibold">${(stay.credit || 0).toFixed(2)}</span></div>
                         <div className="flex items-center text-amber-600"><ListOrdered className="mr-2 h-4 w-4" /> Points Fidélité: <span className="ml-1 font-semibold">{stay.pointsFidelite || 0} pts</span></div>
                        <div className="flex items-center text-blue-500"><ShoppingBag className="mr-2 h-4 w-4" /> Total Dépensé: <span className="ml-1 font-semibold">${(stay.totalSpent || 0).toFixed(2)}</span></div>
                        <div className="flex items-center font-bold text-red-600"><DollarSign className="mr-2 h-4 w-4" /> Solde Dû: <span className="ml-1">${(stay.netDue || 0).toFixed(2)}</span></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Aucune information spécifique de facturation ou de fidélité trouvée pour votre email à travers nos établissements.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Préférences de Thème</CardTitle>
          <CardDescription>Personnalisez l'apparence de l'application (non fonctionnel en MVP).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">La sélection du thème (Clair/Sombre) sera disponible dans une future mise à jour.</p>
             <Button variant="outline" disabled>Basculer Mode Sombre (Bientôt)</Button>
        </CardContent>
      </Card>
    </div>
  );
}
