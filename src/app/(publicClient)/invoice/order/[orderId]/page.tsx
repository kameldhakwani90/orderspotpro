
"use client";

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOrderById, getHostById, getServiceById, getRoomOrTableById, getUserById, getSiteById, getSites } from '@/lib/data'; // Added getSites
import type { Order, Host, Service, RoomOrTable, User, Site as GlobalSiteType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Printer, ArrowLeft, Building, User as UserIcon, ShoppingBag, MapPin, CalendarDays, Hash, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InvoiceDetails {
  order: Order;
  host: Host | null;
  globalSite: GlobalSiteType | null;
  service: Service | null;
  location: RoomOrTable | null;
  clientUser: User | null;
}

function InvoicePageContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = params.orderId as string;

  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoiceData = useCallback(async () => {
    if (!orderId) {
      setError("ID de commande manquant.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const orderData = await getOrderById(orderId);
      if (!orderData) {
        setError("Commande non trouvée.");
        setInvoiceDetails(null);
        setIsLoading(false);
        return;
      }

      let hostData: Host | undefined;
      let globalSiteData: GlobalSiteType | undefined;

      if (orderData.hostId) {
        hostData = await getHostById(orderData.hostId);
        if (hostData) {
            const sites = await getSites(orderData.hostId); // Use getSites to fetch sites for the host
            if (sites.length > 0) {
                // Attempt to find the specific global site if location has one,
                // otherwise fallback to host's first global site.
                const locationForOrder = orderData.chambreTableId ? await getRoomOrTableById(orderData.chambreTableId) : null;
                if (locationForOrder?.globalSiteId) {
                    const specificSite = sites.find(s => s.siteId === locationForOrder.globalSiteId);
                    if (specificSite) {
                        globalSiteData = specificSite;
                    } else {
                        globalSiteData = sites[0]; // Fallback if specific not found but others exist
                    }
                } else {
                     globalSiteData = sites[0]; // Fallback to host's first global site
                }
            }
        }
      }


      const [serviceData, locationData, clientUserData] = await Promise.all([
        getServiceById(orderData.serviceId),
        getRoomOrTableById(orderData.chambreTableId),
        orderData.userId ? getUserById(orderData.userId) : Promise.resolve(null)
      ]);

      setInvoiceDetails({
        order: orderData,
        host: hostData || null,
        globalSite: globalSiteData || null,
        service: serviceData || null,
        location: locationData || null,
        clientUser: clientUserData || null,
      });

    } catch (e: any) {
      console.error("Error fetching invoice details:", e);
      setError("Impossible de charger les détails de la facture. " + e.message);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

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
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row justify-between items-start p-6 border-b">
            <Skeleton className="h-16 w-1/2" />
            <Skeleton className="h-10 w-1/4" />
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
          <CardFooter className="p-6 border-t text-center">
            <Skeleton className="h-6 w-1/3 mx-auto" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error || !invoiceDetails) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center">
        <Info className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Erreur de Facture</h2>
        <p className="text-muted-foreground">{error || "Détails de la facture non disponibles."}</p>
        <Button onClick={() => router.back()} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
      </div>
    );
  }

  const { order, host, globalSite, service, location, clientUser } = invoiceDetails;
  const clientDisplayName = clientUser?.nom || order.clientNom || "Client Inconnu";
  const establishmentName = globalSite?.nom || host?.nom || "Établissement Inconnu";
  const establishmentLogo = globalSite?.logoUrl || host?.reservationPageSettings?.heroImageUrl; 
  const establishmentLogoHint = globalSite?.logoAiHint || host?.reservationPageSettings?.heroImageAiHint || "establishment logo";
  const currencySymbol = order.currency || host?.currency || '$';

  return (
    <div className="max-w-4xl mx-auto bg-background text-foreground p-4 sm:p-8 print:p-0 print:shadow-none print:border-none print:bg-white">
      <div className="flex justify-between items-center mb-8 print:hidden">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Imprimer la Facture
        </Button>
      </div>

      <Card className="shadow-lg print:shadow-none print:border-none">
        <CardHeader className="bg-muted/30 p-6 border-b print:bg-transparent">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              {establishmentLogo && (
                <NextImage
                  src={establishmentLogo}
                  alt={establishmentName}
                  width={100}
                  height={100}
                  className="rounded-md object-contain mb-2 h-16 w-auto"
                  data-ai-hint={establishmentLogoHint}
                />
              )}
              <h1 className="text-2xl font-bold text-primary">{establishmentName}</h1>
              <p className="text-sm text-muted-foreground">Placeholder: Adresse de l'établissement</p>
              <p className="text-sm text-muted-foreground">Placeholder: Téléphone/Email de l'établissement</p>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-3xl font-semibold text-foreground">FACTURE</h2>
              <p className="text-muted-foreground flex items-center sm:justify-end">
                <Hash className="mr-1 h-4 w-4" /> {order.id.slice(-8).toUpperCase()}
              </p>
              <p className="text-muted-foreground flex items-center sm:justify-end">
                <CalendarDays className="mr-1 h-4 w-4" /> {format(parseISO(order.dateHeure), 'PPP p', { locale: fr })}
              </p>
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
              <h3 className="font-semibold text-foreground mb-1">Lieu du Service :</h3>
              <p className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" /> {location?.nom || "Lieu non spécifié"} ({location?.type})</p>
              <p className="text-muted-foreground">Dans : {establishmentName}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2 border-b pb-1">Détails de la Commande</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium text-muted-foreground py-2">Description</th>
                  <th className="text-right font-medium text-muted-foreground py-2">Qté</th>
                  <th className="text-right font-medium text-muted-foreground py-2">Prix Unit.</th>
                  <th className="text-right font-medium text-muted-foreground py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 text-foreground">{service?.titre || "Service non trouvé"}</td>
                  <td className="text-right py-2 text-foreground">1</td>
                  <td className="text-right py-2 text-foreground">
                    {order.prixTotal !== undefined ? `${currencySymbol}${order.prixTotal.toFixed(2)}` : "N/A"}
                  </td>
                  <td className="text-right py-2 text-foreground">
                    {order.prixTotal !== undefined ? `${currencySymbol}${order.prixTotal.toFixed(2)}` : "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground space-y-1">
              <h4 className="font-semibold text-foreground mb-1">Notes & Informations :</h4>
              {order.donneesFormulaire && order.donneesFormulaire !== '{}' && (
                <pre className="whitespace-pre-wrap bg-muted/50 p-2 rounded-md text-xs">
                  Données du formulaire : {JSON.stringify(JSON.parse(order.donneesFormulaire), null, 2)}
                </pre>
              )}
              <p>Merci pour votre confiance !</p>
            </div>
            <div className="space-y-2 text-sm sm:text-right">
              <div className="flex justify-between sm:justify-end sm:gap-4">
                <span className="text-muted-foreground">Sous-total :</span>
                <span className="font-medium text-foreground">
                  {order.prixTotal !== undefined ? `${currencySymbol}${order.prixTotal.toFixed(2)}` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-4">
                <span className="text-muted-foreground">TVA (0%) :</span>
                <span className="font-medium text-foreground">{currencySymbol}0.00</span>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-4 text-lg font-bold text-primary border-t pt-2 mt-2">
                <span>Total Général :</span>
                <span>{order.prixTotal !== undefined ? `${currencySymbol}${order.prixTotal.toFixed(2)}` : "N/A"}</span>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-4 text-sm">
                <span className="text-muted-foreground">Montant Payé :</span>
                <span className="font-medium text-green-600">{currencySymbol}{(order.montantPaye || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-4 text-sm font-semibold">
                <span className="text-muted-foreground">Solde Dû :</span>
                <span className={ (order.soldeDu || 0) > 0 ? "text-red-600" : "text-foreground" }>{currencySymbol}{(order.soldeDu || 0).toFixed(2)}</span>
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


export default function InvoicePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p>Chargement de la facture...</p></div>}>
      <InvoicePageContent />
    </Suspense>
  );
}

