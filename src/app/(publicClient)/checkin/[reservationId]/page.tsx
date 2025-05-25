
"use client";

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getReservationById, updateReservationInData, getRoomOrTableById, getHostById } from '@/lib/data';
import type { Reservation, OnlineCheckinData, RoomOrTable, Host } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as ShadCalendar } from '@/components/ui/calendar';
import { CalendarDays, Hotel, ScanText, Send, CheckCircle, AlertTriangle, ArrowLeft, FileText as FileTextIcon, PenSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import NextImage from 'next/image';

function OnlineCheckinPageContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const reservationId = params.reservationId as string;

  const [step, setStep] = useState(1); // 1: Welcome, 2: Form, 3: Confirmation
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [locationDetails, setLocationDetails] = useState<RoomOrTable | null>(null);
  const [hostDetails, setHostDetails] = useState<Host | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [checkinData, setCheckinData] = useState<OnlineCheckinData>({
    fullName: '',
    email: '',
    birthDate: '',
    phoneNumber: '',
    travelReason: '',
    additionalNotes: '',
  });
  const [birthDateForPicker, setBirthDateForPicker] = useState<Date | undefined>(undefined);

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
        setError("Réservation non trouvée.");
        setReservation(null);
      } else {
        setReservation(resData);
        setCheckinData(prev => ({
          ...prev,
          fullName: resData.clientName || '',
        }));
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCheckinData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date?: Date) => {
    setBirthDateForPicker(date);
    setCheckinData(prev => ({ ...prev, birthDate: date ? format(date, 'yyyy-MM-dd') : '' }));
  };

  const validateForm = () => {
    if (!checkinData.fullName?.trim()) return "Le nom complet est requis.";
    if (!checkinData.email?.trim() || !/\S+@\S+\.\S+/.test(checkinData.email)) return "Une adresse e-mail valide est requise.";
    return null;
  };

  const handleSubmitCheckin = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast({ title: "Erreur de Validation", description: validationError, variant: "destructive" });
      return;
    }
    if (!reservation) return;

    setIsSubmitting(true);
    try {
      const updatedCheckinData: OnlineCheckinData = {
        ...checkinData,
        submissionDate: new Date().toISOString(),
      };
      await updateReservationInData(reservation.id, {
        onlineCheckinData: updatedCheckinData,
        onlineCheckinStatus: 'pending-review',
      });
      toast({ title: "Enregistrement Soumis", description: "Vos informations d'enregistrement ont été envoyées." });
      setStep(3);
    } catch (e: any) {
      setError("Échec de la soumission de l'enregistrement. " + e.message);
      toast({ title: "Erreur de Soumission", description: "Impossible de soumettre vos informations.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-secondary to-background">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader><Skeleton className="h-8 w-3/4 mx-auto" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-1/2 mx-auto" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gradient-to-br from-destructive/10 to-background">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Erreur d'Accès</h1>
        <p className="text-muted-foreground mb-6">{error || "Détails de la réservation non disponibles."}</p>
        <Button onClick={() => router.push('/')}>Retour à l'Accueil</Button>
      </div>
    );
  }

  const heroImageUrl = hostDetails?.reservationPageSettings?.heroImageUrl || "https://placehold.co/800x400.png?text=Bienvenue";
  const heroImageAiHint = hostDetails?.reservationPageSettings?.heroImageAiHint || hostDetails?.nom.toLowerCase().split(' ').slice(0,2).join(' ') || "establishment banner";

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-secondary to-background">
      <Card className="w-full max-w-lg shadow-2xl">
        {step !== 3 && (
          <Button variant="ghost" size="sm" onClick={() => step === 2 ? setStep(1) : router.back()} className="absolute top-4 left-4 text-muted-foreground hover:text-foreground z-10">
            <ArrowLeft className="h-5 w-5 mr-1" /> Retour
          </Button>
        )}
        {step === 1 && (
          <>
            <CardHeader className="text-center p-0">
              <div className="relative h-48 w-full rounded-t-lg overflow-hidden">
                <NextImage 
                  src={heroImageUrl} 
                  alt={hostDetails?.nom || "Image d'accueil"} 
                  fill
                  style={{objectFit:"cover"}}
                  data-ai-hint={heroImageAiHint}
                />
              </div>
              <div className="p-6">
                <CardTitle className="text-2xl font-bold">Enregistrement en Ligne</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-center space-y-3 px-6">
              <p className="text-xl">Bonjour {reservation.clientName} !</p>
              <p className="text-muted-foreground">
                Préparez votre arrivée à <span className="font-semibold text-primary">{hostDetails?.nom || 'votre lieu de séjour'}</span> pour le lieu <span className="font-semibold text-primary">{locationDetails?.nom}</span>.
              </p>
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                <p>Du {format(parseISO(reservation.dateArrivee), 'PPP', { locale: fr })}</p>
                {reservation.dateDepart && reservation.type === 'Chambre' && <p>Au {format(parseISO(reservation.dateDepart), 'PPP', { locale: fr })}</p>}
                <p>{reservation.nombrePersonnes} personne(s)</p>
              </div>
              <p className="mt-2">Commencez votre enregistrement pour gagner du temps à votre arrivée.</p>
            </CardContent>
            <CardFooter className="px-6 pb-6">
              <Button onClick={() => setStep(2)} className="w-full" size="lg">
                Démarrer l'Enregistrement
                <ScanText className="ml-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-xl font-semibold text-center">Vos Informations</CardTitle>
              <CardDescription className="text-center">Veuillez vérifier et compléter vos informations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              <div>
                <Label htmlFor="fullName">Nom Complet*</Label>
                <Input id="fullName" name="fullName" value={checkinData.fullName} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="email">Email*</Label>
                <Input id="email" name="email" type="email" value={checkinData.email} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="birthDate">Date de Naissance</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {birthDateForPicker ? format(birthDateForPicker, 'PPP', { locale: fr }) : <span>Choisir une date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <ShadCalendar
                      mode="single"
                      selected={birthDateForPicker}
                      onSelect={handleDateChange}
                      captionLayout="dropdown-buttons"
                      fromYear={1920}
                      toYear={new Date().getFullYear() - 10} 
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="phoneNumber">Numéro de Téléphone</Label>
                <Input id="phoneNumber" name="phoneNumber" type="tel" value={checkinData.phoneNumber} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="travelReason">Motif du Voyage (Optionnel)</Label>
                <Input id="travelReason" name="travelReason" value={checkinData.travelReason} onChange={handleInputChange} placeholder="Ex: Vacances, Affaires" />
              </div>
              <div>
                <Label htmlFor="additionalNotes">Notes Supplémentaires (Optionnel)</Label>
                <Textarea id="additionalNotes" name="additionalNotes" value={checkinData.additionalNotes} onChange={handleInputChange} placeholder="Allergies, demandes spéciales..." />
              </div>
              
              <Card className="mt-4">
                <CardHeader className="flex flex-row items-center space-x-3 p-4">
                  <FileTextIcon className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-base">Pièce d'Identité (Ex: Passeport)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-muted-foreground">
                    La fonctionnalité de téléversement sécurisé de documents sera bientôt disponible.
                    Votre hôte pourra vous demander de présenter une pièce d'identité à votre arrivée.
                  </p>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader className="flex flex-row items-center space-x-3 p-4">
                  <PenSquare className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-base">Signature Numérique</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-muted-foreground">
                    La signature numérique sera intégrée prochainement. Pour l'instant, votre soumission vaudra pour accord.
                  </p>
                </CardContent>
              </Card>

            </CardContent>
            <CardFooter className="px-6 pb-6">
              <Button onClick={handleSubmitCheckin} className="w-full" disabled={isSubmitting} size="lg">
                {isSubmitting ? "Envoi en cours..." : "Envoyer les Informations"}
                <Send className="ml-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader className="text-center px-6 pt-6">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <CardTitle className="text-2xl font-bold">Enregistrement Soumis !</CardTitle>
            </CardHeader>
            <CardContent className="text-center px-6">
              <p className="text-muted-foreground">
                Merci, {checkinData.fullName || reservation.clientName} ! Vos informations ont été envoyées à <span className="font-semibold text-primary">{hostDetails?.nom || 'l\'établissement'}</span>.
              </p>
              <p className="text-sm mt-2 text-muted-foreground">Vous pouvez maintenant fermer cette page ou préparer le reste de votre voyage.</p>
            </CardContent>
            <CardFooter className="px-6 pb-6">
              <Button onClick={() => router.push('/')} className="w-full" variant="outline" size="lg">
                Retour à l'Accueil du Site
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}

export default function OnlineCheckinPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p>Chargement de la page d'enregistrement...</p></div>}>
      <OnlineCheckinPageContent />
    </Suspense>
  )
}

    