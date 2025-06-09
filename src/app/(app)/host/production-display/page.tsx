"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getOrders, getItemById, getRoomOrTableById } from '@/lib/data';
import type { Order, Service, MenuItem, RoomOrTable } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Utensils, ClipboardList, RefreshCw, CheckCircle, Clock, UserCircle, MapPin, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EnrichedDisplayOrder extends Order {
  itemName: string;
  itemType: 'service' | 'food_beverage' | 'unknown';
  locationName?: string;
  parsedFormData?: Record<string, any>;
}

export default function ProductionDisplayPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [productionOrders, setProductionOrders] = useState<EnrichedDisplayOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProductionOrders = useCallback(async (hostId: string) => {
    if (!hostId) return;
    setIsLoading(true);
    try {
      const ordersData = await getOrders(hostId, { status: 'confirmed' }); // Fetching 'confirmed' orders
      // const pendingOrders = await getOrders(hostId, { status: 'pending' });
      // const combinedOrders = [...pendingOrders, ...ordersData]; // Combine if you want pending too

      const enriched = await Promise.all(
        ordersData.map(async (order) => {
          const item = await getItemById(order.serviceId);
          const location = await getRoomOrTableById(order.chambreTableId);
          let itemName = 'Article Inconnu';
          let itemType: EnrichedDisplayOrder['itemType'] = 'unknown';

          if (item) {
            if ('titre' in item) { // Service
              itemName = item.titre;
              itemType = 'service';
            } else if ('name' in item) { // MenuItem
              itemName = item.name;
              itemType = 'food_beverage';
            }
          }
          
          let parsedFormData;
          try {
            parsedFormData = order.donneesFormulaire ? JSON.parse(order.donneesFormulaire) : {};
          } catch (e) {
            console.warn("Failed to parse form data for order:", order.id, e);
            parsedFormData = {};
          }

          return {
            ...order,
            itemName,
            itemType,
            locationName: location ? `${location.type} ${location.nom}` : 'Lieu Inconnu',
            parsedFormData,
          };
        })
      );
      // For production display, usually filter for food/beverage if that's the focus
      setProductionOrders(enriched.filter(o => o.itemType === 'food_beverage').sort((a,b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime()));

    } catch (error) {
      console.error("Failed to load production orders:", error);
      toast({ title: "Erreur", description: "Impossible de charger les commandes pour la production.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== 'host' || !user.hostId) {
        router.replace('/dashboard');
      } else {
        fetchProductionOrders(user.hostId);
      }
    }
  }, [user, authLoading, router, fetchProductionOrders]);
  
  useEffect(() => {
    if (!user?.hostId) return;
    const intervalId = setInterval(() => {
      if (!isRefreshing) {
        setIsRefreshing(true);
        fetchProductionOrders(user.hostId);
      }
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(intervalId);
  }, [user?.hostId, fetchProductionOrders, isRefreshing]);


  if (isLoading && productionOrders.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-1/3" /> <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Écran de Production (Nourriture & Boissons)</h1>
        <Button onClick={() => { setIsRefreshing(true); fetchProductionOrders(user!.hostId!); }} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Rafraîchir
        </Button>
      </div>

      {productionOrders.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader><CardTitle className="text-2xl text-muted-foreground">Aucune commande en attente</CardTitle></CardHeader>
          <CardContent><p>Toutes les commandes de nourriture et boissons confirmées ont été traitées ou il n'y en a pas de nouvelles.</p></CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {productionOrders.map((order) => (
            <Card key={order.id} className="shadow-lg flex flex-col">
              <CardHeader className="pb-3 pt-4 px-4 bg-muted/40">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-primary flex items-center">
                     <Utensils className="mr-2 h-5 w-5" /> {order.itemName}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {format(parseISO(order.dateHeure), 'HH:mm', { locale: fr })}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  <div className="flex items-center"><UserCircle className="mr-1 h-3 w-3 text-muted-foreground" /> {order.clientNom || "Client Anonyme"}</div>
                  <div className="flex items-center"><MapPin className="mr-1 h-3 w-3 text-muted-foreground" /> {order.locationName}</div>
                  <div className="flex items-center text-muted-foreground/80"><Clock className="mr-1 h-3 w-3" /> #{order.id.slice(-5)}</div>
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 py-3 flex-grow">
                {order.parsedFormData && Object.keys(order.parsedFormData).length > 0 && (
                  <div className="mb-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Options :</h4>
                    <ul className="list-disc list-inside pl-1 space-y-0.5 text-sm">
                      {Object.entries(order.parsedFormData).map(([key, value]) => {
                        const optionGroup = (item as MenuItem)?.optionGroups?.find(og => og.id === key || og.name === key);
                        let displayValue = String(value);
                        if (optionGroup && Array.isArray(value)) {
                            displayValue = value.map(v => optionGroup.options.find(opt => opt.id === v)?.name || v).join(', ');
                        } else if (optionGroup && typeof value === 'string') {
                            displayValue = optionGroup.options.find(opt => opt.id === value)?.name || value;
                        }
                        return (
                          <li key={key} className="text-foreground">
                            <span className="font-semibold">{optionGroup?.name || key}:</span> {displayValue}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                 {(order.parsedFormData && Object.keys(order.parsedFormData).length === 0 && order.itemType === 'food_beverage') && (
                  <p className="text-sm text-muted-foreground italic">Aucune option spécifique pour cet article.</p>
                )}
              </CardContent>
              <CardFooter className="px-4 py-3 border-t mt-auto">
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => toast({title: "Action non implémentée", description: "Marquer comme 'Prêt' sera bientôt disponible."})}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Marquer comme Prêt
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

