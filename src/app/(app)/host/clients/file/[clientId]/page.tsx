
"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  getOrdersByClientId,
  getRoomOrTableById,
  getServiceById,
  getClientById,
  getReservationsByClientId,
  getHostById,
  recordPaymentForOrder,
  recordPaymentForReservation,
  addCreditToClient, // For manual adjustment if needed outside payment
  addPointsToClient // For manual adjustment if needed
} from '@/lib/data';
import type { Order, RoomOrTable, Service, Client, Reservation, Host, Paiement, PaymentMethod } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, ShoppingBag, MapPin, CalendarDays, Phone, Mail, DollarSign, AlertTriangle, Info, ListOrdered, Building, BedDouble, Utensils, FileCheck as FileCheckIcon, ArrowLeft, Edit3, Users as UsersIcon, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface EnrichedOrder extends Order {
  serviceName?: string;
  locationName?: string;
  hostName?: string;
}

interface EnrichedReservation extends Reservation {
    locationFullName?: string;
    hostName?: string;
}

type BillableItem = (Order | Reservation) & { itemType: 'Commande' | 'Séjour' };

interface PaymentDialogState {
  isOpen: boolean;
  itemType: 'Order' | 'Reservation' | null;
  itemId: string | null;
  itemName: string; // For display in dialog title
  amountDue: number;
  currentPaid: number;
  currency: string;
}

function ClientFilePageContent() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const clientId = params.clientId as string;

  const [clientDetails, setClientDetails] = useState<Client | null>(null);
  const [clientHost, setClientHost] = useState<Host | null>(null);
  const [clientOrders, setClientOrders] = useState<EnrichedOrder[]>([]);
  const [clientReservations, setClientReservations] = useState<EnrichedReservation[]>([]);
  
  const [billableItems, setBillableItems] = useState<BillableItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment Dialog State
  const [paymentDialogState, setPaymentDialogState] = useState<PaymentDialogState>({
    isOpen: false, itemType: null, itemId: null, itemName: '', amountDue: 0, currentPaid: 0, currency: 'USD'
  });
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);


  const fetchData = useCallback(async (hostIdForAuth: string, currentClientId: string) => {
    if (!currentClientId) {
      setError("Client ID non fourni.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const clientData = await getClientById(currentClientId);
      if (!clientData || clientData.hostId !== hostIdForAuth) {
        setError("Fiche client introuvable ou non accessible.");
        setClientDetails(null);
        setBillableItems([]);
        setIsLoading(false);
        return;
      }
      setClientDetails(clientData);

      const hostData = await getHostById(clientData.hostId);
      setClientHost(hostData);

      const [ordersData, reservationsData] = await Promise.all([
        getOrdersByClientId(hostIdForAuth, currentClientId),
        getReservationsByClientId(hostIdForAuth, currentClientId)
      ]);

      const enrichedOrders = await Promise.all(
        ordersData.map(async (order) => {
          const service = await getServiceById(order.serviceId);
          const location = await getRoomOrTableById(order.chambreTableId);
          return {
            ...order,
            serviceName: service && 'titre' in service ? service.titre : (service && 'name' in service ? service.name : 'Service Inconnu'),
            locationName: location ? `${location.type} ${location.nom}` : 'Lieu Inconnu',
            hostName: hostData?.nom || 'Établissement Inconnu',
          };
        })
      );
      setClientOrders(enrichedOrders);

      const enrichedReservations = await Promise.all(
        reservationsData.map(async (res) => {
            let locFullName: string | undefined = undefined;
            if(res.locationId) {
                const loc = await getRoomOrTableById(res.locationId);
                if(loc) locFullName = `${loc.type} ${loc.nom}`;
            }
            return { ...res, locationFullName: locFullName, hostName: hostData?.nom || 'Établissement Inconnu' };
        })
      );
      setClientReservations(enrichedReservations);
      
      const combinedBillableItems: BillableItem[] = [
        ...enrichedOrders.map(o => ({ ...o, itemType: 'Commande' as const, dateHeure: o.dateHeure, id: o.id  })),
        ...enrichedReservations.map(r => ({ ...r, itemType: 'Séjour' as const, dateHeure: r.dateArrivee, id: r.id }))
      ].sort((a, b) => new Date(b.dateHeure || 0).getTime() - new Date(a.dateHeure || 0).getTime());
      setBillableItems(combinedBillableItems);


    } catch (e) {
      console.error("Échec de la récupération des détails du client:", e);
      setError("Impossible de charger les détails du client. Veuillez réessayer.");
      setBillableItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && authUser?.hostId && clientId) {
      fetchData(authUser.hostId, clientId);
    } else if (!authLoading && (!authUser?.hostId && authUser?.role === 'host')) {
        setError("ID d'hôte manquant pour l'utilisateur connecté.");
        setIsLoading(false);
    } else if (!authLoading && authUser?.role !== 'host') {
      router.replace('/dashboard');
    }
  }, [authUser, authLoading, clientId, fetchData, router]);

  const totalSpentOverall = useMemo(() => {
    return clientOrders
      .filter(o => (o.status === 'completed' || o.status === 'confirmed') && typeof o.prixTotal === 'number')
      .reduce((sum, o) => sum + (o.prixTotal!), 0);
  }, [clientOrders]);

  const openPaymentDialog = (item: BillableItem) => {
    const amountDue = (item.prixTotal || 0) - (item.montantPaye || 0);
    setPaymentDialogState({
      isOpen: true,
      itemType: item.itemType === 'Commande' ? 'Order' : 'Reservation',
      itemId: item.id,
      itemName: item.itemType === 'Commande' ? (item as EnrichedOrder).serviceName || 'Commande' : `Séjour ${ (item as EnrichedReservation).locationFullName || 'N/A'}`,
      amountDue: amountDue,
      currentPaid: item.montantPaye || 0,
      currency: item.currency || clientHost?.currency || 'USD'
    });
    setPaymentAmount(amountDue > 0 ? amountDue : '');
    setPaymentMethod('cash');
    setPaymentNotes('');
  };

  const handleRecordPayment = async () => {
    if (!paymentDialogState.itemType || !paymentDialogState.itemId || typeof paymentAmount !== 'number' || paymentAmount <= 0) {
      toast({ title: "Montant Invalide", description: "Veuillez saisir un montant de paiement valide.", variant: "destructive" });
      return;
    }
    if (paymentAmount > paymentDialogState.amountDue + 0.001) { // check for overpayment with small tolerance
      toast({ title: "Paiement Excessif", description: `Le montant saisi dépasse le solde dû de ${paymentDialogState.amountDue.toFixed(2)} ${paymentDialogState.currency}.`, variant: "destructive" });
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const paymentDetails: Omit<Paiement, 'id'> = {
        montant: paymentAmount,
        type: paymentMethod,
        date: new Date().toISOString(),
        notes: paymentNotes.trim() || undefined,
      };

      if (paymentDialogState.itemType === 'Order') {
        await recordPaymentForOrder(paymentDialogState.itemId, paymentDetails);
      } else if (paymentDialogState.itemType === 'Reservation') {
        await recordPaymentForReservation(paymentDialogState.itemId, paymentDetails);
      }

      if (paymentMethod === 'credit' && clientDetails) {
        await updateClientData(clientDetails.id, { credit: (clientDetails.credit || 0) - paymentAmount });
      }
      // Logic for points deduction would go here if implemented

      toast({ title: "Paiement Enregistré", description: `Paiement de ${paymentAmount.toFixed(2)} ${paymentDialogState.currency} pour ${paymentDialogState.itemName} enregistré.` });
      if (authUser?.hostId) fetchData(authUser.hostId, clientId); // Refresh all data
      setPaymentDialogState(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      toast({ title: "Erreur d'Enregistrement", description: `Impossible d'enregistrer le paiement. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
      setIsSubmittingPayment(false);
    }
  };


  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-6">
        <Skeleton className="h-10 w-1/3 mb-2" /> <Skeleton className="h-6 w-1/2 mb-6" />
        <Skeleton className="h-12 w-full mb-6" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Erreur</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.push('/host/clients')} className="mt-6">Retour à la liste des Clients</Button>
      </div>
    );
  }

  if (!clientDetails) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <Info className="mx-auto h-12 w-12 text-primary mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Client Non Trouvé</h2>
        <p className="text-muted-foreground">Aucune fiche client trouvée pour cet ID.</p>
        <Button onClick={() => router.push('/host/clients')} className="mt-6">Retour à la Gestion Clients</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center">
            <User className="mr-3 h-10 w-10 text-primary" /> Fiche Client: {clientDetails.nom}
          </h1>
          <p className="text-lg text-muted-foreground">Aperçu de l'activité et des détails du client chez {clientHost?.nom || 'votre établissement'}.</p>
        </div>
        <Link href="/host/clients" passHref>
            <Button variant="outline" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4"/> Retour à la liste des Clients
            </Button>
        </Link>
      </div>

      <Tabs defaultValue="billing" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
          <TabsTrigger value="general">Infos Générales</TabsTrigger>
          <TabsTrigger value="billing">Facturation & Transactions</TabsTrigger>
          <TabsTrigger value="checkins">Enreg. en Ligne</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>Détails de la Fiche Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><strong className="text-muted-foreground">ID Fiche Client:</strong> #{clientDetails.id.slice(-6)}</div>
              <div><Mail className="inline mr-1.5 h-4 w-4 text-muted-foreground" /> Email: <span className="font-medium">{clientDetails.email || "(Non renseigné)"}</span></div>
              <div><Phone className="inline mr-1.5 h-4 w-4 text-muted-foreground" /> Téléphone: <span className="font-medium">{clientDetails.telephone || "(Non renseigné)"}</span></div>
              <div className="flex items-center"><UsersIcon className="inline mr-1.5 h-4 w-4 text-muted-foreground" /> Type: <Badge variant={clientDetails.type === 'heberge' ? 'default' : 'secondary'} className="capitalize ml-1">{clientDetails.type}</Badge></div>
              {clientDetails.type === 'heberge' && (
                <>
                  <div><CalendarDays className="inline mr-1.5 h-4 w-4 text-muted-foreground"/> Arrivée: {clientDetails.dateArrivee && isValid(parseISO(clientDetails.dateArrivee)) ? format(parseISO(clientDetails.dateArrivee), 'PPP', {locale: fr}) : 'N/A'}</div>
                  <div><CalendarDays className="inline mr-1.5 h-4 w-4 text-muted-foreground"/> Départ: {clientDetails.dateDepart && isValid(parseISO(clientDetails.dateDepart)) ? format(parseISO(clientDetails.dateDepart), 'PPP', {locale: fr}) : 'N/A'}</div>
                  {clientDetails.locationId && <div><MapPin className="inline mr-1.5 h-4 w-4 text-muted-foreground"/> Lieu Actuel: {clientDetails.locationId}</div>}
                </>
              )}
              <div className="text-green-600"><DollarSign className="inline mr-1.5 h-4 w-4"/> Crédit: <span className="font-semibold">{(clientDetails.credit || 0).toFixed(2)} {clientHost?.currency || '$'}</span></div>
              <div className="text-amber-600"><ListOrdered className="inline mr-1.5 h-4 w-4"/> Points Fidélité: <span className="font-semibold">{clientDetails.pointsFidelite || 0} pts</span></div>
              <div className="mt-2"><strong className="text-primary">Notes:</strong> <p className="text-muted-foreground whitespace-pre-wrap">{clientDetails.notes || "(Aucune note pour cette fiche)"}</p></div>
               {clientDetails.userId && <p className="text-xs text-muted-foreground italic pt-2">(Lié à l'utilisateur global ID: #{clientDetails.userId.slice(-6)})</p>}
            </CardContent>
             <CardFooter>
                <Button onClick={() => router.push(`/host/clients?edit=${clientDetails.id}`)} variant="outline"><Edit3 className="mr-2 h-4 w-4"/> Modifier cette Fiche Client</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary"/>Facturation & Transactions</CardTitle>
                    <CardDescription>{billableItems.length} élément(s) facturable(s) trouvé(s) pour ce client.</CardDescription>
                </CardHeader>
                <CardContent>
                    {billableItems.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead><TableHead>Réf.</TableHead><TableHead>Date</TableHead><TableHead>Description</TableHead>
                                    <TableHead>Total</TableHead><TableHead>Payé</TableHead><TableHead>Solde Dû</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {billableItems.map(item => {
                                    const total = item.prixTotal || 0;
                                    const paid = item.montantPaye || 0;
                                    const due = total - paid;
                                    let paymentStatus: 'Payé' | 'Impayé' | 'Partiel' = 'Impayé';
                                    if (due <= 0 && total > 0) paymentStatus = 'Payé';
                                    else if (paid > 0 && due > 0) paymentStatus = 'Partiel';
                                    
                                    const description = item.itemType === 'Commande' ? (item as EnrichedOrder).serviceName : `Séjour ${(item as EnrichedReservation).locationFullName || 'N/A'}`;
                                    const currencySymbol = item.currency || clientHost?.currency || '$';

                                    return (
                                        <TableRow key={`${item.itemType}-${item.id}`}>
                                            <TableCell><Badge variant={item.itemType === 'Commande' ? 'outline' : 'secondary'}>{item.itemType}</Badge></TableCell>
                                            <TableCell className="font-medium text-xs">#{item.id.slice(-6)}</TableCell>
                                            <TableCell>{isValid(parseISO(item.dateHeure || item.dateArrivee)) ? format(parseISO(item.dateHeure || item.dateArrivee), 'P', {locale: fr}) : 'N/A'}</TableCell>
                                            <TableCell>{description}</TableCell>
                                            <TableCell>{currencySymbol}{total.toFixed(2)}</TableCell>
                                            <TableCell className="text-green-600">{currencySymbol}{paid.toFixed(2)}</TableCell>
                                            <TableCell className={due > 0 ? "text-red-600 font-semibold" : ""}>{currencySymbol}{due.toFixed(2)}</TableCell>
                                            <TableCell><Badge variant={paymentStatus === 'Payé' ? 'default' : paymentStatus === 'Partiel' ? 'secondary' : 'destructive'}>{paymentStatus}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                {due > 0.009 && <Button size="sm" onClick={() => openPaymentDialog(item)}>Encaisser</Button>}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : <p className="text-muted-foreground text-center py-4">Aucune commande ou réservation facturable trouvée.</p>}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="checkins" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><FileCheckIcon className="mr-2 h-5 w-5 text-primary" />Enregistrements en Ligne Soumis</CardTitle>
              <CardDescription>Informations soumises par le client lors d'enregistrements en ligne pour ses réservations chez {clientHost?.nom || 'cet établissement'}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {clientReservations.filter(res => res.onlineCheckinData).length > 0 ? (
                clientReservations.filter(res => res.onlineCheckinData).map(res => (
                  <Card key={`checkin-${res.id}`} className="bg-secondary/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Pour Réservation ID: #{res.id.slice(-6)} ({res.locationFullName})</CardTitle>
                      <CardDescription>Soumis le: {res.onlineCheckinData!.submissionDate && isValid(parseISO(res.onlineCheckinData!.submissionDate)) ? format(parseISO(res.onlineCheckinData!.submissionDate), 'PPP p', { locale: fr }) : 'Date inconnue'}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p><strong>Nom complet:</strong> {res.onlineCheckinData!.fullName || 'N/A'}</p>
                      <p><strong>Email:</strong> {res.onlineCheckinData!.email || 'N/A'}</p>
                      {res.onlineCheckinData!.birthDate && isValid(parseISO(res.onlineCheckinData!.birthDate)) && <p><strong>Date de naissance:</strong> {format(parseISO(res.onlineCheckinData!.birthDate), 'PPP', { locale: fr })}</p>}
                      <p><strong>Téléphone:</strong> {res.onlineCheckinData!.phoneNumber || 'N/A'}</p>
                      {res.onlineCheckinData!.travelReason && <p><strong>Motif du voyage:</strong> {res.onlineCheckinData!.travelReason}</p>}
                      {res.onlineCheckinData!.additionalNotes && <p><strong>Notes additionnelles:</strong> {res.onlineCheckinData!.additionalNotes}</p>}
                      <div className="flex items-center"><strong>Statut Enreg. Ligne:</strong> <Badge variant={res.onlineCheckinStatus === 'completed' ? 'default' : res.onlineCheckinStatus === 'pending-review' ? 'secondary' : 'outline'} className="capitalize text-xs ml-1">{res.onlineCheckinStatus?.replace('-', ' ') || 'Non démarré'}</Badge></div>
                    </CardContent>
                  </Card>
                ))
              ) : <p className="text-muted-foreground text-center py-4">Aucune information d'enregistrement en ligne trouvée pour les réservations de ce client chez cet établissement.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogState.isOpen} onOpenChange={(open) => setPaymentDialogState(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer Paiement pour {paymentDialogState.itemName}</DialogTitle>
            <DialogDescription>
              Solde Dû: {paymentDialogState.amountDue.toFixed(2)} {paymentDialogState.currency} (Déjà payé: {paymentDialogState.currentPaid.toFixed(2)} {paymentDialogState.currency})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="paymentAmount">Montant à Payer*</Label>
              <Input id="paymentAmount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder={`Max ${paymentDialogState.amountDue.toFixed(2)}`} min="0.01" step="0.01" max={paymentDialogState.amountDue}/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paymentMethod">Méthode de Paiement*</Label>
              <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}>
                <SelectTrigger id="paymentMethod"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="card">Carte Bancaire</SelectItem>
                  <SelectItem value="credit" disabled={(clientDetails?.credit || 0) === 0}>Crédit Client (Dispo: {(clientDetails?.credit || 0).toFixed(2)} {paymentDialogState.currency})</SelectItem>
                  <SelectItem value="points" disabled={(clientDetails?.pointsFidelite || 0) === 0}>Points Fidélité (Dispo: {clientDetails?.pointsFidelite || 0} pts)</SelectItem>
                </SelectContent>
              </Select>
              {paymentMethod === 'credit' && typeof paymentAmount === 'number' && (clientDetails?.credit || 0) < paymentAmount && <p className="text-xs text-destructive">Crédit client insuffisant pour ce montant.</p>}
              {paymentMethod === 'points' && <p className="text-xs text-muted-foreground">La logique de conversion points/devise et déduction n'est pas encore implémentée.</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paymentNotes">Notes (Optionnel)</Label>
              <Textarea id="paymentNotes" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Ex: Paiement partiel, référence transaction..." />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" disabled={isSubmittingPayment}>Annuler</Button></DialogClose>
            <Button
              onClick={handleRecordPayment}
              disabled={isSubmittingPayment || typeof paymentAmount !== 'number' || paymentAmount <= 0 || (paymentMethod === 'credit' && (clientDetails?.credit || 0) < paymentAmount) || paymentAmount > paymentDialogState.amountDue + 0.001 }
            >
              {isSubmittingPayment ? "Enregistrement..." : "Enregistrer Paiement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default function ClientFilePage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8 px-4"><Skeleton className="h-10 w-1/3 mb-2" /><Skeleton className="h-6 w-1/2 mb-6" /><Skeleton className="h-96 w-full" /></div>}>
      <ClientFilePageContent />
    </Suspense>
  )
}
