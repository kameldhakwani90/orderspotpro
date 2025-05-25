
"use client";

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getReservationById, updateReservationInData, getRoomOrTableById, getHostById } from '@/lib/data';
import type { Reservation, RoomOrTable, Host } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, ArrowLeft, Hotel, Home, Briefcase, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import NextImage from 'next/image';

function OnlineCheckoutPageContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const reservationId = params.reservationId as string;

  const [step, setStep] = useState(1); // 1: Details, 2: Confirmation
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [locationDetails, setLocationDetails] = useState<RoomOrTable | null>(null);
  const [hostDetails, setHostDetails] = useState<Host | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');

  const fetchReservationDetails = useCallback(async () => {
    if (!reservationId) {
      setError("ID de réservation manquant.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const resData = await getReservationById(reservationId);
      if (!resData) {
        setError("Réservation non trouvée ou inaccessible.");
        setReservation(null);
      } else if (resData.status === 'checked-out' || resData.status === 'cancelled') {
        setError(`Cette réservation (ID: ${reservationId.slice(-6)}) est déjà ${resData.status === 'checked-out' ? 'finalisée (check-out effectué)' : 'annulée'}.`);
        setReservation(resData); // Still set it to show some info if needed
        setStep(2); // Go to confirmation/already done step
      }
      else {
        setReservation(resData);
        if (resData.locationId) {
          const locData = await getRoomOrTableById(resData.locationId);
          setLocationDetails(locData);
        }
        if (resData.hostId) {
            const hData = await getHostById(resData.hostId);
            setHostDetails(hData);
        }
      }
    } catch (e: any) {
      setError("Impossible de charger les détails de la réservation. " + e.message);
      setReservation(null);
    } finally {
      setIsLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    fetchReservationDetails();
  }, [fetchReservationDetails]);


  const handleConfirmCheckout = async () => {
    if (!reservation) return;

    setIsSubmitting(true);
    try {
      await updateReservationInData(reservation.id, {
        status: 'checked-out',
        clientInitiatedCheckoutTime: new Date().toISOString(),
        checkoutNotes: checkoutNotes.trim() || undefined,
      });
      toast({ title: "Check-out Confirmé", description: "Votre départ a été enregistré avec succès." });
      setStep(2);
      // Potentially trigger points calculation if not already done by updateReservationInData
      // For now, updateReservationInData has logic for points on 'checked-out'
    } catch (e: any) {
      setError("Échec de la confirmation du check-out. " + e.message);
      toast({ title: "Erreur de Check-out", description: "Impossible de confirmer votre départ.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-secondary to-background">
        <Card className="w-full max-w-lg shadow-2xl">
          <CardHeader className="text-center"><Skeleton className="h-8 w-3/4 mx-auto" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-1/2 mx-auto" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }


  const heroImageUrl = hostDetails?.reservationPageSettings?.heroImageUrl || "https://placehold.co/800x200.png?text=Bon+Voyage";
  const heroImageAiHint = hostDetails?.reservationPageSettings?.heroImageAiHint || hostDetails?.nom.toLowerCase().split(' ').slice(0,2).join(' ') || "establishment banner";

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-secondary to-background">
      <Card className="w-full max-w-lg shadow-2xl">
        {step === 1 && reservation && reservation.status !== 'checked-out' && reservation.status !== 'cancelled' && (
          <>
            <CardHeader className="text-center p-0">
               <div className="relative h-32 sm:h-40 w-full rounded-t-lg overflow-hidden">
                <NextImage
                  src={heroImageUrl}
                  alt={hostDetails?.nom || "Image d'accueil"}
                  fill
                  style={{objectFit:"cover"}}
                  data-ai-hint={heroImageAiHint}
                />
              </div>
              <div className="p-6">
                <CardTitle className="text-2xl font-bold">Confirmation de Départ (Check-out)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-6 space-y-4">
              <p className="text-lg">Bonjour {reservation.clientName},</p>
              <p className="text-muted-foreground">
                Vous êtes sur le point de confirmer votre départ de <span className="font-semibold text-primary">{locationDetails?.nom}</span> à <span className="font-semibold text-primary">{hostDetails?.nom}</span>.
              </p>
              <div className="text-sm bg-muted/50 p-3 rounded-md space-y-1">
                <p><strong>Dates :</strong> {format(parseISO(reservation.dateArrivee), 'PPP', { locale: fr })}
                  {reservation.dateDepart && reservation.type === 'Chambre' ? ` au ${format(parseISO(reservation.dateDepart), 'PPP', { locale: fr })}` : ''}
                </p>
                <p><strong>Lieu :</strong> {locationDetails?.type} {locationDetails?.nom}</p>
                <p><strong>Statut Actuel :</strong> <Badge variant="outline" className="capitalize">{reservation.status}</Badge></p>
              </div>

              <div className="pt-2">
                <h3 className="font-semibold mb-2 text-md">Sommaire de Facturation (Exemple)</h3>
                <Card className="bg-card border">
                    <CardContent className="p-3 text-sm text-muted-foreground space-y-1">
                        <p>Total estimé : ${reservation.prixTotal?.toFixed(2) || 'N/A'}</p>
                        <p>Montant payé : ${reservation.montantPaye?.toFixed(2) || '0.00'}</p>
                        <p className="font-semibold">Solde dû : ${reservation.soldeDu?.toFixed(2) || 'N/A'}</p>
                        <p className="text-xs italic mt-1">Veuillez régler tout solde restant à la réception.</p>
                    </CardContent>
                </Card>
              </div>

              <div>
                <Label htmlFor="checkoutNotes">Notes de Départ (Optionnel)</Label>
                <Textarea
                  id="checkoutNotes"
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder="Ex: Tout était parfait, clé laissée à la réception..."
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter className="px-6 pb-6">
              <Button onClick={handleConfirmCheckout} className="w-full" disabled={isSubmitting} size="lg">
                {isSubmitting ? "Traitement en cours..." : "Confirmer et Quitter (Check-out)"}
                <LogOutIcon className="ml-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </>
        )}

        {(step === 2 || error || (reservation && (reservation.status === 'checked-out' || reservation.status === 'cancelled'))) && (
          <>
            <CardHeader className="text-center px-6 pt-6">
              {error || (reservation?.status === 'cancelled') ? (
                <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
              ) : (
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              )}
              <CardTitle className="text-2xl font-bold">
                {error ? "Erreur de Check-out" : (reservation?.status === 'cancelled' ? "Réservation Annulée" : "Check-out Confirmé !")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center px-6">
              <p className="text-muted-foreground">
                {error ||
                 (reservation?.status === 'cancelled' ? `La réservation pour ${locationDetails?.nom || 'ce lieu'} à ${hostDetails?.nom || "l'établissement"} a été annulée.` :
                 `Merci, ${reservation?.clientName || 'cher client'} ! Votre départ de ${locationDetails?.nom || 'ce lieu'} à ${hostDetails?.nom || "l'établissement"} a été enregistré.`)
                }
              </p>
              {(reservation?.status === 'checked-out' && !error) &&
                <p className="text-sm mt-2 text-muted-foreground">Nous espérons vous revoir bientôt !</p>
              }
            </CardContent>
            <CardFooter className="px-6 pb-6">
              <Button onClick={() => router.push('/')} className="w-full" variant="outline" size="lg">
                <Home className="mr-2 h-5 w-5" /> Retour à l'Accueil du Site
              </Button>
            </CardFooter>
          </>
        )}
         {step === 1 && !isLoading && !error && reservation && (reservation.status === 'checked-out' || reservation.status === 'cancelled') && (
            // This block is to explicitly handle showing the "already done" message if step was 1 but status implies it's done
             <CardContent className="text-center px-6 py-10">
                <Info className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                <p className="text-lg text-muted-foreground">
                    L'opération de check-out pour cette réservation a déjà été traitée ou la réservation est annulée.
                </p>
             </CardContent>
        )}


      </Card>
    </div>
  );
}

export default function OnlineCheckoutPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p>Chargement de la page de check-out...</p></div>}>
      <OnlineCheckoutPageContent />
    </Suspense>
  )
}

