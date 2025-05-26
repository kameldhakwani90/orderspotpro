
"use client";

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getReservationById, getHostById, getSiteById, getRoomOrTableById, getUserById } from '@/lib/data';
import type { Reservation, Host, Site as GlobalSiteType, RoomOrTable, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Printer, ArrowLeft, Building, User as UserIcon, BedDouble, Utensils, CalendarDays, Hash, Info, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLanguage } from '@/context/LanguageContext';

interface InvoiceDetails {
  reservation: Reservation;
  host: Host | null;
  globalSite: GlobalSiteType | null;
  location: RoomOrTable | null;
  clientUser: User | null; // User object if reservation.clientId is a User.id
}

function ReservationInvoicePageContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const reservationId = params.reservationId as string;

  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoiceData = useCallback(async () => {
    if (!reservationId) {
      setError(t('errorAccessingReservation'));
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const reservationData = await getReservationById(reservationId);
      if (!reservationData) {
        setError(t('reservationDetailsNotAvailable'));
        setInvoiceDetails(null);
        setIsLoading(false);
        return;
      }

      let hostData: Host | undefined;
      let globalSiteData: GlobalSiteType | undefined;
      let clientUserData: User | null = null;

      if (reservationData.hostId) {
        hostData = await getHostById(reservationData.hostId);
        if (hostData) {
          const sites = await getSiteById(reservationData.locationId ? (await getRoomOrTableById(reservationData.locationId))?.globalSiteId || '' : '');
          if (sites) {
             globalSiteData = sites;
          } else {
            // Fallback: if specific global site for location not found, try host's first global site
            const hostSites = await getSites(reservationData.hostId);
            if (hostSites.length > 0) globalSiteData = hostSites[0];
          }
        }
      }
      
      // Try to fetch client details if reservation.clientId seems to be a User.id
      // This logic assumes reservation.clientId might store a User.id if the client is a registered user
      if (reservationData.clientId && reservationData.clientId.startsWith('user-')) {
        clientUserData = await getUserById(reservationData.clientId);
      }

      const [locationData] = await Promise.all([
        getRoomOrTableById(reservationData.locationId),
      ]);

      setInvoiceDetails({
        reservation: reservationData,
        host: hostData || null,
        globalSite: globalSiteData || null,
        location: locationData || null,
        clientUser: clientUserData,
      });

    } catch (e: any) {
      console.error("Error fetching reservation invoice details:", e);
      setError(t('errorLoadingReservationDetails') + ` (${e.message})`);
    } finally {
      setIsLoading(false);
    }
  }, [reservationId, t]);

  useEffect(() => {
    fetchInvoiceData();
  }, [fetchInvoiceData]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-8 print:p-0">
        <Skeleton className="h-10 w-1/3 mb-8" />
        <Card className="shadow-lg"><CardHeader className="flex flex-row justify-between items-start p-6 border-b"><Skeleton className="h-16 w-1/2" /><Skeleton className="h-10 w-1/4" /></CardHeader><CardContent className="p-6 space-y-6"><div className="grid grid-cols-2 gap-6"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div><Skeleton className="h-32 w-full" /><Skeleton className="h-20 w-full" /></CardContent><CardFooter className="p-6 border-t text-center"><Skeleton className="h-6 w-1/3 mx-auto" /></CardFooter></Card>
      </div>
    );
  }

  if (error || !invoiceDetails) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center">
        <Info className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">{t('errorAccessingReservation')}</h2>
        <p className="text-muted-foreground">{error || t('reservationDetailsNotAvailable')}</p>
        <Button onClick={() => router.back()} className="mt-6"><ArrowLeft className="mr-2 h-4 w-4" /> {t('goBack')}</Button>
      </div>
    );
  }

  const { reservation, host, globalSite, location, clientUser } = invoiceDetails;
  const clientDisplayName = clientUser?.nom || reservation.clientName || "Client Inconnu";
  const establishmentName = globalSite?.nom || host?.nom || "Établissement Inconnu";
  const establishmentLogo = globalSite?.logoUrl || host?.reservationPageSettings?.heroImageUrl;
  const establishmentLogoHint = globalSite?.logoAiHint || host?.reservationPageSettings?.heroImageAiHint || "establishment logo";

  const arrival = reservation.dateArrivee && isValid(parseISO(reservation.dateArrivee)) ? parseISO(reservation.dateArrivee) : null;
  const departure = reservation.dateDepart && isValid(parseISO(reservation.dateDepart)) ? parseISO(reservation.dateDepart) : null;
  const nights = arrival && departure && reservation.type === 'Chambre' ? Math.max(1, differenceInDays(departure, arrival)) : 1;

  const LocationIcon = reservation.type === 'Chambre' ? BedDouble : Utensils;

  return (
    <div className="max-w-4xl mx-auto bg-background text-foreground p-4 sm:p-8 print:p-0 print:shadow-none print:border-none print:bg-white">
      <div className="flex justify-between items-center mb-8 print:hidden">
        <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> {t('goBack')}</Button>
        <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Imprimer la Facture</Button>
      </div>

      <Card className="shadow-lg print:shadow-none print:border-none">
        <CardHeader className="bg-muted/30 p-6 border-b print:bg-transparent">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              {establishmentLogo && (
                <NextImage src={establishmentLogo} alt={establishmentName} width={100} height={100} className="rounded-md object-contain mb-2 h-16 w-auto" data-ai-hint={establishmentLogoHint} />
              )}
              <h1 className="text-2xl font-bold text-primary">{establishmentName}</h1>
              <p className="text-sm text-muted-foreground">Placeholder: Adresse de l'établissement</p>
              <p className="text-sm text-muted-foreground">Placeholder: Téléphone/Email de l'établissement</p>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-3xl font-semibold text-foreground">FACTURE</h2>
              <p className="text-muted-foreground flex items-center sm:justify-end"><Hash className="mr-1 h-4 w-4" /> {reservation.id.slice(-8).toUpperCase()}</p>
              <p className="text-muted-foreground flex items-center sm:justify-end"><CalendarDays className="mr-1 h-4 w-4" /> {arrival ? format(arrival, 'PPP', { locale: fr }) : 'Date non spécifiée'}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Facturé à :</h3>
              <p className="flex items-center"><UserIcon className="mr-2 h-4 w-4 text-muted-foreground" /> {clientDisplayName}</p>
              {clientUser?.email && <p className="text-muted-foreground">Email: {clientUser.email}</p>}
              <p className="text-muted-foreground">Placeholder: Adresse du Client</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Détails du Séjour/Service :</h3>
              <p className="flex items-center"><LocationIcon className="mr-2 h-4 w-4 text-muted-foreground" /> {location?.nom || "Lieu non spécifié"} ({reservation.type || location?.type})</p>
              <p className="flex items-center text-muted-foreground"><Users className="mr-2 h-4 w-4" /> {reservation.nombrePersonnes} personne(s)</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2 border-b pb-1">Description des Prestations</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium text-muted-foreground py-2">Description</th>
                  <th className="text-right font-medium text-muted-foreground py-2">Durée/Qté</th>
                  <th className="text-right font-medium text-muted-foreground py-2">Prix Unit. (est.)</th>
                  <th className="text-right font-medium text-muted-foreground py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 text-foreground">
                    Séjour {reservation.type} - {location?.nom || "Lieu"} <br />
                    <span className="text-xs text-muted-foreground">
                      {arrival ? format(arrival, 'dd/MM/yy', { locale: fr }) : ''}
                      {departure && reservation.type === 'Chambre' ? ` - ${format(departure, 'dd/MM/yy', { locale: fr })}` : ''}
                    </span>
                  </td>
                  <td className="text-right py-2 text-foreground">{reservation.type === 'Chambre' ? `${nights} nuit(s)` : '1 réservation'}</td>
                  <td className="text-right py-2 text-foreground">
                    {(() => {
                      if (reservation.type === 'Chambre' && location?.prixParNuit !== undefined) {
                        return `${(location.currency || '$')}${location.prixParNuit.toFixed(2)}${location.pricingModel === 'perPerson' ? '/pers' : ''}`;
                      } else if (reservation.type === 'Table' && location?.prixFixeReservation !== undefined) {
                        return `${(location.currency || '$')}${location.prixFixeReservation.toFixed(2)}`;
                      }
                      return "N/A";
                    })()}
                  </td>
                  <td className="text-right py-2 text-foreground">
                    {(reservation.prixTotal !== undefined && reservation.currency) ? `${reservation.currency}${reservation.prixTotal.toFixed(2)}` : (reservation.prixTotal !== undefined ? `$${reservation.prixTotal.toFixed(2)}` : "N/A")}
                  </td>
                </tr>
                {/* Future: Add lines for each related order if bundled */}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground space-y-1">
              <h4 className="font-semibold text-foreground mb-1">Notes & Informations :</h4>
              {reservation.notes && <p>Notes du client : {reservation.notes}</p>}
              <p>Merci pour votre séjour !</p>
            </div>
            <div className="space-y-2 text-sm sm:text-right">
              <div className="flex justify-between sm:justify-end sm:gap-4">
                <span className="text-muted-foreground">Sous-total :</span>
                <span className="font-medium text-foreground">{(reservation.prixTotal !== undefined && reservation.currency) ? `${reservation.currency}${reservation.prixTotal.toFixed(2)}` : (reservation.prixTotal !== undefined ? `$${reservation.prixTotal.toFixed(2)}` : "N/A")}</span>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-4">
                <span className="text-muted-foreground">TVA (0%) :</span>
                <span className="font-medium text-foreground">{(reservation.currency || '$')}0.00</span>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-4 text-lg font-bold text-primary border-t pt-2 mt-2">
                <span>Total Général :</span>
                <span>{(reservation.prixTotal !== undefined && reservation.currency) ? `${reservation.currency}${reservation.prixTotal.toFixed(2)}` : (reservation.prixTotal !== undefined ? `$${reservation.prixTotal.toFixed(2)}` : "N/A")}</span>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-4 text-sm">
                <span className="text-muted-foreground">Montant Payé :</span>
                <span className="font-medium text-green-600">{(reservation.currency || '$')}{(reservation.montantPaye || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-4 text-sm font-semibold">
                <span className="text-muted-foreground">Solde Dû :</span>
                <span className="text-red-600">{(reservation.currency || '$')}{(reservation.soldeDu || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 border-t text-center text-xs text-muted-foreground print:hidden">
          Si vous avez des questions concernant cette facture, veuillez contacter {establishmentName}.
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ReservationInvoicePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p>Chargement de la facture de réservation...</p></div>}>
      <ReservationInvoicePageContent />
    </Suspense>
  );
}
