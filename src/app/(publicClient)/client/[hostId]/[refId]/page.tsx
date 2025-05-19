
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getServices, getHostById, getRoomOrTableById, getServiceCategories } from '@/lib/data';
import type { Service, Host, RoomOrTable, ServiceCategory } from '@/lib/types';
import { ServiceCard } from '@/components/client/ServiceCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Building, MapPin, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/context/AuthContext'; // To check if user is logged in for ServiceCard
import Image from 'next/image';

export default function PublicClientServicePage() {
  const params = useParams();
  const { user, isLoading: authIsLoading } = useAuth(); // Get user status

  const hostId = params.hostId as string;
  const refId = params.refId as string; // This is RoomOrTable ID

  const [services, setServices] = useState<Service[]>([]);
  const [hostInfo, setHostInfo] = useState<Host | null>(null);
  const [locationInfo, setLocationInfo] = useState<RoomOrTable | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hostId && refId) {
      const fetchData = async () => {
        setIsLoadingPage(true);
        setError(null);
        try {
          // Fetch host and location details first for header display
          const [hostData, locationData] = await Promise.all([
            getHostById(hostId),
            getRoomOrTableById(refId),
          ]);

          if (!hostData) {
            setError(`Establishment with ID ${hostId} not found.`);
            setHostInfo(null); setLocationInfo(null); setCategories([]);
            setIsLoadingPage(false); return;
          }
          if (!locationData || locationData.hostId !== hostId) {
            setError(`Location with ID ${refId} not found or does not belong to ${hostData.nom}.`);
            setHostInfo(hostData); setLocationInfo(null); setCategories([]);
            setIsLoadingPage(false); return;
          }
          
          setHostInfo(hostData);
          setLocationInfo(locationData);

          // Then fetch categories and services
          const categoriesData = await getServiceCategories(hostId);
          setCategories([{id: 'all', nom: 'All Categories', hostId}, ...categoriesData]);
          
          const servicesData = await getServices(hostId, refId, selectedCategory === "all" ? undefined : selectedCategory);
          setServices(servicesData);

        } catch (e) {
          console.error("Failed to fetch client data:", e);
          setError("Failed to load services. Please try again later.");
        }
        setIsLoadingPage(false);
      };
      fetchData();
    }
  }, [hostId, refId, selectedCategory]);

  if (isLoadingPage || authIsLoading) { // Also consider auth loading state
    return (
      <div className="space-y-8">
        <div className="p-6 md:p-10 rounded-xl shadow-xl bg-card/70 backdrop-blur-lg">
          <Skeleton className="h-10 w-3/4 mb-3" />
          <Skeleton className="h-6 w-1/2 mb-6" />
        </div>
        <Skeleton className="h-12 w-full sm:w-[320px] mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2 bg-card/50 p-4 rounded-lg">
              <Skeleton className="h-48 w-full rounded-md" />
              <Skeleton className="h-6 w-3/4 mt-3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive mb-2">Access Error</h1>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }
  
  const hostBackgroundUrl = 'https://placehold.co/1920x400.png'; // Generic placeholder
  const hostBackgroundAiHint = hostInfo?.nom.toLowerCase().split(" ").slice(0,2).join(" ") || "hotel restaurant";


  return (
    <div className="space-y-8">
      <div className="relative p-6 md:p-12 rounded-xl shadow-2xl overflow-hidden text-center min-h-[250px] flex flex-col justify-center items-center text-card-foreground bg-card">
         <Image 
            src={hostBackgroundUrl} 
            alt={`${hostInfo?.nom || 'Establishment'} background`} 
            layout="fill" 
            objectFit="cover" 
            className="opacity-20"
            data-ai-hint={hostBackgroundAiHint}
            priority
          />
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
            Welcome to {hostInfo?.nom || 'Our Establishment'}
          </h1>
          {locationInfo && (
            <p className="text-xl md:text-2xl text-muted-foreground font-medium flex items-center justify-center">
              <MapPin className="h-6 w-6 mr-2 text-primary" />
              Services for: <span className="font-semibold text-primary ml-1.5">{locationInfo.type} - {locationInfo.nom}</span>
            </p>
          )}
        </div>
      </div>

      <div className="mb-8 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-5 w-5 text-primary"/>
          <h2 className="text-xl font-semibold text-foreground">Browse Our Services</h2>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[320px] bg-card shadow-sm text-base py-3 h-auto">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id} className="text-base py-2">
                {category.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {services.length === 0 ? (
        <p className="text-center text-muted-foreground text-lg py-10">
          No services currently available for this category or location. Please check back soon!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
          {services.map(service => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              hostId={hostId} 
              refId={refId}
              isUserLoggedIn={!!user} // Pass login status
            />
          ))}
        </div>
      )}
    </div>
  );
}
