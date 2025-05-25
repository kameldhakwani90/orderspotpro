
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getHostById, updateHost, getSites } from '@/lib/data'; // Added getSites
import type { Host, ReservationPageSettings, Site as GlobalSiteType } from '@/lib/types'; // Added GlobalSiteType
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Image as ImageIcon, BedDouble, Utensils, Link as LinkIcon, Copy } from 'lucide-react'; // Added LinkIcon, Copy

const defaultSettings: ReservationPageSettings = {
  enableRoomReservations: true,
  enableTableReservations: true,
  heroImageUrl: '',
  heroImageAiHint: '',
};

export default function HostReservationSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [hostSettings, setHostSettings] = useState<ReservationPageSettings>(defaultSettings);
  const [hostName, setHostName] = useState<string>(''); // To generate heroImageAiHint
  const [managedGlobalSites, setManagedGlobalSites] = useState<GlobalSiteType[]>([]); // New state for host's global sites
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async (hostId: string) => {
    setIsLoading(true);
    try {
      const [hostData, sitesData] = await Promise.all([
        getHostById(hostId),
        getSites(hostId) // Fetch sites managed by this host
      ]);

      if (hostData) {
        setHostSettings(hostData.reservationPageSettings || defaultSettings);
        setHostName(hostData.nom);
      } else {
        toast({ title: "Erreur", description: "Informations de l'hôte non trouvées.", variant: "destructive" });
        router.replace('/host/dashboard');
      }
      setManagedGlobalSites(sitesData);
    } catch (error) {
      console.error("Failed to load host settings or sites:", error);
      toast({ title: "Erreur", description: "Impossible de charger les paramètres ou les sites.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, router]);

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== 'host' || !user.hostId) {
        router.replace('/dashboard');
      } else {
        fetchData(user.hostId);
      }
    }
  }, [user, authLoading, router, fetchData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHostSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: keyof ReservationPageSettings, checked: boolean) => {
    setHostSettings(prev => {
      const newSettings = { ...prev, [name]: checked };
      if (name === 'enableRoomReservations' && !checked && !newSettings.enableTableReservations) {
        toast({ title: "Erreur de validation", description: "Vous ne pouvez pas désactiver à la fois les réservations de chambres et de tables.", variant: "destructive" });
        return prev;
      }
      if (name === 'enableTableReservations' && !checked && !newSettings.enableRoomReservations) {
        toast({ title: "Erreur de validation", description: "Vous ne pouvez pas désactiver à la fois les réservations de chambres et de tables.", variant: "destructive" });
        return prev;
      }
      return newSettings;
    });
  };

  const handleSubmitSettings = async () => {
    if (!user?.hostId) return;

    if (!hostSettings.enableRoomReservations && !hostSettings.enableTableReservations) {
      toast({
        title: "Configuration Invalide",
        description: "Au moins un type de réservation (chambres ou tables) doit être activé.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const currentHostData = await getHostById(user.hostId);
      if (!currentHostData) throw new Error("Données de l'hôte non trouvées pour la mise à jour.");

      const updatedHostData: Partial<Host> = {
        ...currentHostData,
        reservationPageSettings: {
          ...hostSettings,
          heroImageAiHint: hostSettings.heroImageUrl && hostName
            ? hostName.toLowerCase().split(' ').slice(0,2).join(' ') + ' banner' 
            : 'establishment banner',
        }
      };
      await updateHost(user.hostId, updatedHostData);
      toast({ title: "Paramètres Enregistrés", description: "Vos paramètres de page de réservation ont été mis à jour." });
      fetchData(user.hostId); 
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({ title: "Erreur d'Enregistrement", description: `Impossible d'enregistrer les paramètres. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: "Copié dans le presse-papiers !", description: text }))
      .catch(err => toast({ title: "Échec de la copie", description: err.message, variant: "destructive" }));
  };

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-5 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/2 mb-2" /></CardHeader>
          <CardContent><Skeleton className="h-20 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Paramètres de la Page de Réservation</h1>
        <p className="text-lg text-muted-foreground">Personnalisez la page de réservation publique de votre établissement.</p>
      </div>

      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Affichage & Fonctionnalités</CardTitle>
          <CardDescription>Contrôlez ce que les clients voient et peuvent réserver sur votre page publique.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="heroImageUrl" className="flex items-center">
              <ImageIcon className="mr-2 h-5 w-5 text-primary" /> URL de l'Image d'En-tête
            </Label>
            <Input
              id="heroImageUrl"
              name="heroImageUrl"
              value={hostSettings.heroImageUrl || ''}
              onChange={handleInputChange}
              placeholder="https://placehold.co/1200x400.png"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">Cette image sera affichée en haut de votre page de réservation publique.</p>
          </div>
          
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-md font-semibold">Types de Réservation</h3>
             {!hostSettings.enableRoomReservations && !hostSettings.enableTableReservations && (
                 <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5"/>
                    Attention : Au moins un type de réservation doit être activé.
                 </div>
             )}
            <div className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors">
              <Label htmlFor="enableRoomReservations" className="flex items-center text-base cursor-pointer">
                <BedDouble className="mr-3 h-6 w-6 text-primary" /> Activer les Réservations de Chambres
              </Label>
              <Switch
                id="enableRoomReservations"
                checked={hostSettings.enableRoomReservations}
                onCheckedChange={(checked) => handleSwitchChange('enableRoomReservations', checked)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors">
              <Label htmlFor="enableTableReservations" className="flex items-center text-base cursor-pointer">
                <Utensils className="mr-3 h-6 w-6 text-green-600" /> Activer les Réservations de Tables
              </Label>
              <Switch
                id="enableTableReservations"
                checked={hostSettings.enableTableReservations}
                onCheckedChange={(checked) => handleSwitchChange('enableTableReservations', checked)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmitSettings} disabled={isSubmitting || (!hostSettings.enableRoomReservations && !hostSettings.enableTableReservations) }>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer les Paramètres'}
          </Button>
        </CardFooter>
      </Card>

      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center"><LinkIcon className="mr-2 h-5 w-5 text-primary" /> Vos Pages de Réservation Publiques</CardTitle>
          <CardDescription>Partagez ces liens avec vos clients ou sur vos réseaux sociaux.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {managedGlobalSites.length === 0 ? (
            <p className="text-muted-foreground text-center">Aucun site global ne vous est actuellement assigné par un administrateur.</p>
          ) : (
            managedGlobalSites.map(site => {
              const reservationUrl = `/reserve/${site.siteId}`;
              const fullReservationUrl = typeof window !== 'undefined' ? `${window.location.origin}${reservationUrl}` : reservationUrl;
              return (
                <div key={site.siteId} className="p-3 border rounded-md bg-secondary/30">
                  <h4 className="font-semibold text-foreground">{site.nom}</h4>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <Input
                        type="text"
                        value={fullReservationUrl}
                        readOnly
                        className="text-sm text-muted-foreground bg-card flex-grow h-9"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyToClipboard(fullReservationUrl)}
                        className="h-9"
                        title="Copier le lien"
                    >
                        <Copy className="h-4 w-4 mr-0 sm:mr-2" />
                        <span className="hidden sm:inline">Copier</span>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    