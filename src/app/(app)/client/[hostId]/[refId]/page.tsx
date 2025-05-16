
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getServices, getHostById, getRoomOrTableById } from '@/lib/data';
import type { Service, Host, RoomOrTable } from '@/lib/types';
import { ServiceCard } from '@/components/client/ServiceCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Building } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getServiceCategories } from '@/lib/data';
import type { ServiceCategory } from '@/lib/types';


export default function ClientServicePage() {
  const params = useParams();
  const hostId = params.hostId as string;
  const refId = params.refId as string; // This is RoomOrTable ID

  const [services, setServices] = useState<Service[]>([]);
  const [hostInfo, setHostInfo] = useState<Host | null>(null);
  const [locationInfo, setLocationInfo] = useState<RoomOrTable | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hostId && refId) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const [hostData, locationData, servicesData, categoriesData] = await Promise.all([
            getHostById(hostId),
            getRoomOrTableById(refId),
            getServices(hostId, selectedCategory === "all" ? undefined : selectedCategory),
            getServiceCategories(hostId)
          ]);

          if (!hostData) {
            setError(`Host with ID ${hostId} not found.`);
            setServices([]);
            setHostInfo(null);
            setLocationInfo(null);
            setCategories([]);
            setIsLoading(false);
            return;
          }
          if (!locationData || locationData.hostId !== hostId) {
            setError(`Location with ID ${refId} not found or does not belong to host ${hostId}.`);
            setServices([]);
            setHostInfo(hostData);
            setLocationInfo(null);
            setCategories([]);
            setIsLoading(false);
            return;
          }
          
          setHostInfo(hostData);
          setLocationInfo(locationData);
          setServices(servicesData);
          setCategories([{id: 'all', nom: 'All Categories', hostId}, ...categoriesData]);

        } catch (e) {
          console.error("Failed to fetch client data:", e);
          setError("Failed to load services. Please try again later.");
        }
        setIsLoading(false);
      };
      fetchData();
    }
  }, [hostId, refId, selectedCategory]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <Skeleton className="h-10 w-1/3 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive mb-2">Error</h1>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      {hostInfo && locationInfo && (
        <div className="mb-8 p-6 bg-card rounded-lg shadow">
          <div className="flex items-center mb-2">
            <Building className="h-8 w-8 text-primary mr-3"/>
            <h1 className="text-3xl font-bold text-foreground">{hostInfo.nom}</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Services available for: <span className="font-semibold text-primary">{locationInfo.type} - {locationInfo.nom}</span>
          </p>
        </div>
      )}

      <div className="mb-8">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[280px] bg-card">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {services.length === 0 ? (
        <p className="text-center text-muted-foreground text-lg py-10">
          No services available for this category or location.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map(service => (
            <ServiceCard key={service.id} service={service} hostId={hostId} refId={refId} />
          ))}
        </div>
      )}
    </div>
  );
}
