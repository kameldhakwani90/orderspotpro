
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Service, MenuItem, Client, Host } from '@/lib/types';
import { getClients, addOrder, getHostById } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface HostOrderPlacementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Service | MenuItem;
  hostId: string;
  locationId: string; // refId
  selectedOptions?: Record<string, string | string[]>; // For configurable MenuItems
  finalPrice: number;
  onOrderPlaced: () => void; // Callback after successful order
}

const NO_CLIENT_SELECTED_VALUE = "__NO_CLIENT_SELECTED_IN_DIALOG__";

export function HostOrderPlacementDialog({
  open,
  onOpenChange,
  item,
  hostId,
  locationId,
  selectedOptions,
  finalPrice,
  onOrderPlaced,
}: HostOrderPlacementDialogProps) {
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [hostDetails, setHostDetails] = useState<Host | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>(NO_CLIENT_SELECTED_VALUE);
  const [manualClientName, setManualClientName] = useState<string>("");
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemName = 'titre' in item ? item.titre : item.name;
  const itemCurrency = item.currency || hostDetails?.currency || '$';

  const fetchDialogData = useCallback(async () => {
    if (!hostId || !open) return;
    setIsLoadingClients(true);
    try {
      const [hostClients, currentHostDetails] = await Promise.all([
        getClients(hostId),
        getHostById(hostId)
      ]);
      setClients(hostClients);
      setHostDetails(currentHostDetails || null);
    } catch (error) {
      toast({ title: "Error", description: "Could not load client list or host details.", variant: "destructive" });
    } finally {
      setIsLoadingClients(false);
    }
  }, [hostId, open, toast]);

  useEffect(() => {
    if (open) {
      fetchDialogData();
      setSelectedClient(NO_CLIENT_SELECTED_VALUE);
      setManualClientName("");
    }
  }, [open, fetchDialogData]);

  const handleSubmit = async () => {
    if (!authUser || authUser.role !== 'host') {
      toast({ title: "Authentication Error", description: "Host authentication required.", variant: "destructive" });
      return;
    }

    let clientNameToSubmit = manualClientName.trim();
    let clientIdToSubmit: string | undefined = undefined;
    let clientUserIdToSubmit: string | undefined = undefined;

    if (selectedClient !== NO_CLIENT_SELECTED_VALUE) {
      const clientObj = clients.find(c => c.id === selectedClient);
      clientNameToSubmit = clientObj?.nom || "Unknown Client";
      clientIdToSubmit = clientObj?.id;
      clientUserIdToSubmit = clientObj?.userId;
    }

    if (!clientNameToSubmit) {
      toast({ title: "Client Required", description: "Please select an existing client or enter a new client name.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await addOrder({
        serviceId: item.id,
        hostId: hostId,
        chambreTableId: locationId,
        clientNom: clientNameToSubmit,
        userId: clientUserIdToSubmit, 
        clientId: clientIdToSubmit,
        donneesFormulaire: JSON.stringify(selectedOptions || {}),
        prixTotal: finalPrice,
        currency: itemCurrency,
      });
      toast({ title: "Order Placed", description: `Order for ${itemName} by ${clientNameToSubmit} submitted.` });
      onOrderPlaced();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Order Submission Failed", description: `Failed to place order. ${error instanceof Error ? error.message : ""}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Passer la commande pour un client</DialogTitle>
          <DialogDescription>
            Commande : <strong>{itemName}</strong> pour <strong>{itemCurrency}{finalPrice.toFixed(2)}</strong>
          </DialogDescription>
        </DialogHeader>
        {isLoadingClients ? (
            <div className="py-4 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        ) : (
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="dialogExistingClient">Sélectionner un client existant (Optionnel)</Label>
            <Select
              value={selectedClient}
              onValueChange={(value) => {
                setSelectedClient(value);
                if (value !== NO_CLIENT_SELECTED_VALUE) setManualClientName("");
              }}
              disabled={clients.length === 0}
            >
              <SelectTrigger id="dialogExistingClient">
                <SelectValue placeholder={clients.length === 0 ? "Aucun client enregistré" : "Sélectionner un client"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CLIENT_SELECTED_VALUE}>-- Ou entrer un nom de client ci-dessous --</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>{client.nom} ({client.email || client.telephone || 'Pas de contact'})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="dialogManualClientName">Ou entrer un nouveau nom de client *</Label>
            <Input
              id="dialogManualClientName"
              value={manualClientName}
              onChange={(e) => setManualClientName(e.target.value)}
              placeholder="Ex: Jean Dupont (Table 5)"
              disabled={selectedClient !== NO_CLIENT_SELECTED_VALUE}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Si un nouveau nom de client est entré, un dossier client temporaire pourrait être créé.
          </p>
        </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting || isLoadingClients}>Annuler</Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isLoadingClients || (!manualClientName.trim() && selectedClient === NO_CLIENT_SELECTED_VALUE)}
          >
            {isSubmitting ? "Enregistrement..." : "Confirmer et Commander"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

