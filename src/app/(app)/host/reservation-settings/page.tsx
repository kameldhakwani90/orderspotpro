
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getHostById, updateHost } from '@/lib/data';
import type { Host, ReservationPageSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Image as ImageIcon, BedDouble, Utensils } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async (hostId: string) => {
    setIsLoading(true);
    try {
      const hostData = await getHostById(hostId);
      if (hostData) {
        setHostSettings(hostData.reservationPageSettings || defaultSettings);
      } else {
        toast({ title: "Error", description: "Host information not found.", variant: "destructive" });
        router.replace('/host/dashboard'); // Or some other appropriate redirect
      }
    } catch (error) {
      console.error("Failed to load host settings:", error);
      toast({ title: "Error", description: "Could not load reservation page settings.", variant: "destructive" });
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
      // Enforce that at least one reservation type is enabled
      if (name === 'enableRoomReservations' && !checked && !newSettings.enableTableReservations) {
        toast({ title: "Validation Error", description: "You cannot disable both room and table reservations.", variant: "destructive" });
        return prev; // Revert change
      }
      if (name === 'enableTableReservations' && !checked && !newSettings.enableRoomReservations) {
        toast({ title: "Validation Error", description: "You cannot disable both room and table reservations.", variant: "destructive" });
        return prev; // Revert change
      }
      return newSettings;
    });
  };

  const handleSubmitSettings = async () => {
    if (!user?.hostId) return;

    // Validate that at least one reservation type is enabled
    if (!hostSettings.enableRoomReservations && !hostSettings.enableTableReservations) {
      toast({
        title: "Invalid Configuration",
        description: "At least one reservation type (rooms or tables) must be enabled.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const hostData = await getHostById(user.hostId);
      if (!hostData) throw new Error("Host data not found for update.");

      const updatedHostData: Partial<Host> = {
        ...hostData, // Keep existing host data
        reservationPageSettings: {
          ...hostSettings,
          heroImageAiHint: hostSettings.heroImageUrl && hostData.nom 
            ? hostData.nom.toLowerCase().split(' ').slice(0,2).join(' ') + ' banner' 
            : 'establishment banner',
        }
      };
      await updateHost(user.hostId, updatedHostData);
      toast({ title: "Settings Saved", description: "Your reservation page settings have been updated." });
      fetchData(user.hostId); // Refresh data
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({ title: "Error Saving Settings", description: `Could not save settings. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Card className="shadow-lg">
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
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Reservation Page Settings</h1>
        <p className="text-lg text-muted-foreground">Customize the public reservation page for your establishment.</p>
      </div>

      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Display & Functionality</CardTitle>
          <CardDescription>Control what clients see and can reserve on your public page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="heroImageUrl" className="flex items-center">
              <ImageIcon className="mr-2 h-5 w-5 text-primary" /> Hero Image URL
            </Label>
            <Input
              id="heroImageUrl"
              name="heroImageUrl"
              value={hostSettings.heroImageUrl || ''}
              onChange={handleInputChange}
              placeholder="https://placehold.co/1200x400.png"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">This image will be displayed at the top of your public reservation page.</p>
          </div>
          
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-md font-semibold">Reservation Types</h3>
             {!hostSettings.enableRoomReservations && !hostSettings.enableTableReservations && (
                 <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5"/>
                    Warning: At least one reservation type must be enabled.
                 </div>
             )}
            <div className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors">
              <Label htmlFor="enableRoomReservations" className="flex items-center text-base cursor-pointer">
                <BedDouble className="mr-3 h-6 w-6 text-primary" /> Enable Room Reservations
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
                <Utensils className="mr-3 h-6 w-6 text-green-600" /> Enable Table Reservations
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
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
