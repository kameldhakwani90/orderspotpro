
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getServices, getHostById, getRoomOrTableById, getServiceCategories } from '@/lib/data';
import type { Service, Host, RoomOrTable, ServiceCategory } from '@/lib/types';
import { ServiceCard } from '@/components/client/ServiceCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Building, MapPin, Filter, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NextImage from 'next/image'; // Renamed to avoid conflict with lucide-react Image icon
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Added Card components
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: ServiceCategory;
  onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick }) => {
  const imageUrl = category.image || `https://placehold.co/300x200.png`;
  const imageAiHint = category['data-ai-hint'] || category.nom.toLowerCase().split(' ').slice(0,2).join(' ') || 'category item';

  return (
    <Card
      onClick={onClick}
      className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full bg-card hover:bg-accent/10"
    >
      <CardHeader className="p-0 relative">
        <div className="relative w-full h-40">
          {imageUrl.startsWith('https://placehold.co/') || imageUrl.startsWith('/placeholder-images/') ? (
            <NextImage
              src={imageUrl}
              alt={category.nom}
              layout="fill"
              objectFit="cover"
              data-ai-hint={imageAiHint}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex items-center justify-center">
        <CardTitle className="text-lg text-center font-semibold">{category.nom}</CardTitle>
      </CardContent>
    </Card>
  );
};


export default function PublicClientServicePage() {
  const params = useParams();
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

  const hostId = params.hostId as string;
  const refId = params.refId as string; 

  const [services, setServices] = useState<Service[]>([]);
  const [hostInfo, setHostInfo] = useState<Host | null>(null);
  const [locationInfo, setLocationInfo] = useState<RoomOrTable | null>(null);
  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([]);
  
  const [viewMode, setViewMode] = useState<'categories' | 'services'>('categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [currentCategoryName, setCurrentCategoryName] = useState<string | null>(null);

  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    if (authIsLoading || !hostId || !refId) {
      console.log("PublicClientServicePage: Auth loading or missing IDs, deferring initial data fetch.", { hostId, refId, authIsLoading });
      if (!authIsLoading && (!hostId || !refId)) {
          setError("Required information (host or location ID) is missing.");
          setIsLoadingPage(false);
      }
      return;
    }
    setIsLoadingPage(true);
    setError(null);
    console.log("PublicClientServicePage: Starting initial data fetch (host, location, categories)...");
    try {
      const [hostData, locationData, categoriesData] = await Promise.all([
        getHostById(hostId),
        getRoomOrTableById(refId),
        getServiceCategories(hostId)
      ]);

      if (!hostData) {
        setError(`Establishment with ID ${hostId} not found.`);
        setHostInfo(null); setLocationInfo(null); setAllCategories([]); setIsLoadingPage(false); return;
      }
      setHostInfo(hostData);

      if (!locationData || locationData.hostId !== hostId) {
        setError(`Location with ID ${refId} not found or does not belong to ${hostData.nom}.`);
        setLocationInfo(null); setAllCategories([]); setIsLoadingPage(false); return;
      }
      setLocationInfo(locationData);
      setAllCategories(categoriesData);
      console.log("PublicClientServicePage: Initial data fetched successfully.");
    } catch (e: any) {
      console.error("PublicClientServicePage: Failed to fetch initial data:", e);
      setError(`Failed to load establishment information. (Details: ${e.message})`);
    } finally {
      setIsLoadingPage(false);
    }
  }, [hostId, refId, authIsLoading]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const fetchServicesForCategory = useCallback(async (categoryId: string) => {
    if (!hostId || !refId || categoryId === "all" || !categoryId) { // 'all' might be used internally, or null
      setServices([]); // Clear services if no specific category or invalid
      return;
    }
    setIsLoadingServices(true);
    setError(null); // Clear previous errors
    console.log(`PublicClientServicePage: Fetching services for category ID: ${categoryId}`);
    try {
      // Ensure getServices can handle categoryId being passed
      const servicesData = await getServices(hostId, refId, categoryId);
      setServices(servicesData);
      console.log("PublicClientServicePage: Services fetched for category.", { servicesData });
    } catch (e: any) {
      console.error(`PublicClientServicePage: Failed to fetch services for category ${categoryId}:`, e);
      setError(`Failed to load services. (Details: ${e.message})`);
      setServices([]); // Clear services on error
    } finally {
      setIsLoadingServices(false);
    }
  }, [hostId, refId]);

  useEffect(() => {
    if (viewMode === 'services' && selectedCategoryId && selectedCategoryId !== 'all') {
      fetchServicesForCategory(selectedCategoryId);
    } else {
      setServices([]); // Clear services when not in service view or no category selected
    }
  }, [viewMode, selectedCategoryId, fetchServicesForCategory]);


  const handleCategoryClick = (category: ServiceCategory) => {
    setSelectedCategoryId(category.id);
    setCurrentCategoryName(category.nom);
    setViewMode('services');
  };

  const handleBackToCategories = () => {
    setViewMode('categories');
    setSelectedCategoryId(null);
    setCurrentCategoryName(null);
    setServices([]);
  };

  if (isLoadingPage || authIsLoading) {
    return (
      <div className="space-y-8">
        <div className="p-6 md:p-10 rounded-xl shadow-xl bg-card/70 backdrop-blur-lg">
          <Skeleton className="h-10 w-3/4 mb-3" />
          <Skeleton className="h-6 w-1/2 mb-6" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2 bg-card/50 p-4 rounded-lg">
              <Skeleton className="h-32 w-full rounded-md" />
              <Skeleton className="h-6 w-3/4 mt-3 mx-auto" />
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
        <p className="text-muted-foreground px-4">{error}</p>
        <Button onClick={() => router.back()} className="mt-6">Go Back</Button>
      </div>
    );
  }
  
  const hostBackgroundUrl = 'https://placehold.co/1920x400.png'; 
  const hostBackgroundAiHint = hostInfo?.nom.toLowerCase().split(" ").slice(0,2).join(" ") || "establishment background";

  return (
    <div className="space-y-8">
      <div className="relative p-6 md:p-12 rounded-xl shadow-2xl overflow-hidden text-center min-h-[250px] flex flex-col justify-center items-center text-card-foreground bg-card">
         <NextImage 
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

      {viewMode === 'categories' && (
        <>
          <div className="mb-8 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-6 w-6 text-primary"/>
              <h2 className="text-2xl font-semibold text-foreground">Browse Our Categories</h2>
            </div>
             {allCategories.length === 0 && !isLoadingPage && (
                <p className="text-center text-muted-foreground text-lg py-10">
                    No service categories found for this establishment.
                </p>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {allCategories.map(category => (
              <CategoryCard key={category.id} category={category} onClick={() => handleCategoryClick(category)} />
            ))}
          </div>
        </>
      )}

      {viewMode === 'services' && (
        <>
          <div className="flex items-center justify-between mb-6 pt-4">
            <Button variant="outline" onClick={handleBackToCategories} className="text-base py-2 px-4">
              <ArrowLeft className="mr-2 h-5 w-5" /> Back to Categories
            </Button>
            <h2 className="text-2xl font-semibold text-foreground text-right">
              {currentCategoryName || 'Services'}
            </h2>
          </div>
          {isLoadingServices ? (
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
          ) : services.length === 0 ? (
             <p className="text-center text-muted-foreground text-lg py-10">
              No services currently available in the &quot;{currentCategoryName}&quot; category.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
              {services.map(service => (
                <ServiceCard 
                  key={service.id} 
                  service={service} 
                  hostId={hostId} 
                  refId={refId}
                  isUserLoggedIn={!!user}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

    