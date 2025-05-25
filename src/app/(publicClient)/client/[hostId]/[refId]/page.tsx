
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import {
  getServices,
  getHostById,
  getRoomOrTableById,
  getServiceCategories as fetchHostServiceCategories, // Renamed for clarity
  getMenuCardById,
  getMenuCategories as fetchMenuCategoriesForCard,
  getMenuItems
} from '@/lib/data';
import type { Service, Host, RoomOrTable, ServiceCategory, MenuCard, MenuCategory as MenuCategoryType, MenuItem } from '@/lib/types';
import { ServiceCard } from '@/components/client/ServiceCard'; // For general services
import { MenuItemCard } from '@/components/client/MenuItemCard'; // New component for menu items
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Building, MapPin, Filter, ArrowLeft, Image as ImageIcon, Utensils, ListFilter, ChefHat, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from '@/context/LanguageContext'; // Import useLanguage
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext'; // Import useCart


interface CategoryCardProps {
  category: ServiceCategory; // General Service Category
  onClick: () => void;
  imageUrl?: string;
  imageAiHint?: string;
}

const GeneralCategoryCard: React.FC<CategoryCardProps> = ({ category, onClick, imageUrl, imageAiHint }) => {
  const { t } = useLanguage();
  const effectiveImageUrl = imageUrl || `https://placehold.co/300x200.png`;
  const effectiveImageAiHint = imageAiHint || category.nom.toLowerCase().split(' ').slice(0,2).join(' ') || 'category item';

  return (
    <Card
      onClick={onClick}
      className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full bg-card hover:bg-accent/10"
    >
      <CardHeader className="p-0 relative">
        <div className="relative w-full h-40">
          <NextImage
            src={effectiveImageUrl}
            alt={category.nom}
            layout="fill"
            objectFit="cover"
            data-ai-hint={effectiveImageAiHint}
          />
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
  const pathname = usePathname();
  const { t } = useLanguage(); // Use language hook
  const { cartItems, getTotalItems } = useCart(); // Get cart context

  const hostId = params.hostId as string;
  const refId = params.refId as string;

  const [services, setServices] = useState<Service[]>([]);
  const [hostInfo, setHostInfo] = useState<Host | null>(null);
  const [locationInfo, setLocationInfo] = useState<RoomOrTable | null>(null);
  
  const [generalServiceCategories, setGeneralServiceCategories] = useState<ServiceCategory[]>([]);
  const [activeMenuCard, setActiveMenuCard] = useState<MenuCard | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategoryType[]>([]);
  const [activeMenuCategoryId, setActiveMenuCategoryId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [viewMode, setViewMode] = useState<'menuCategories' | 'menuItems' | 'generalCategories' | 'generalServices'>('menuCategories');
  const [selectedGeneralCategoryId, setSelectedGeneralCategoryId] = useState<string | null>(null);
  const [currentGeneralCategoryName, setCurrentGeneralCategoryName] = useState<string | null>(null);

  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isLoadingSubContent, setIsLoadingSubContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPageData = useCallback(async () => {
    if (authIsLoading || !hostId || !refId) return;
    setIsLoadingPage(true);
    setError(null);
    try {
      const [hostData, locationData] = await Promise.all([
        getHostById(hostId),
        getRoomOrTableById(refId),
      ]);

      if (!hostData) { setError(t('establishmentNotFound')); setHostInfo(null); setIsLoadingPage(false); return; }
      setHostInfo(hostData);

      if (!locationData || locationData.hostId !== hostId) { setError(t('locationNotFound')); setLocationInfo(null); setIsLoadingPage(false); return; }
      setLocationInfo(locationData);

      if (locationData.menuCardId) {
        const menuCardData = await getMenuCardById(locationData.menuCardId);
        if (menuCardData && menuCardData.isActive) {
          // Check time visibility (simplified: assumes current time is within range if times are set)
          const now = new Date();
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          let isTimeVisible = true;
          if (menuCardData.visibleFromTime && menuCardData.visibleToTime) {
            isTimeVisible = currentTime >= menuCardData.visibleFromTime && currentTime <= menuCardData.visibleToTime;
          } else if (menuCardData.visibleFromTime) {
            isTimeVisible = currentTime >= menuCardData.visibleFromTime;
          } else if (menuCardData.visibleToTime) {
            isTimeVisible = currentTime <= menuCardData.visibleToTime;
          }

          if (isTimeVisible) {
            setActiveMenuCard(menuCardData);
            const fetchedMenuCategories = await fetchMenuCategoriesForCard(menuCardData.id, hostId);
            setMenuCategories(fetchedMenuCategories);
            if (fetchedMenuCategories.length > 0) {
              setActiveMenuCategoryId(fetchedMenuCategories[0].id); // Select first menu category by default
              setViewMode('menuItems'); // Go directly to items of the first category
            } else {
              setViewMode('generalCategories'); // No menu categories, fall back to general
            }
          } else {
             setActiveMenuCard(null); // Menu card exists but not visible now
             setViewMode('generalCategories'); // Fallback if menu card not time-visible
          }
        } else {
          setActiveMenuCard(null); // Menu card exists but not active
          setViewMode('generalCategories'); // Fallback if menu card not active
        }
      } else {
        setViewMode('generalCategories'); // No menu card associated
      }
      
      // Always fetch general service categories for fallback or if no menu card
      const generalCategoriesData = await fetchHostServiceCategories(hostId);
      setGeneralServiceCategories(generalCategoriesData);


    } catch (e: any) {
      setError(t('errorLoadingServiceDetails') + ` (${e.message})`);
    } finally {
      setIsLoadingPage(false);
    }
  }, [hostId, refId, authIsLoading, t]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);


  const fetchMenuItemsForCategory = useCallback(async (menuCategoryId: string) => {
    if (!hostId || !menuCategoryId) return;
    setIsLoadingSubContent(true);
    try {
      const items = await getMenuItems(menuCategoryId, hostId);
      setMenuItems(items.filter(item => item.isAvailable !== false)); // Filter out unavailable items
    } catch (e: any) {
      setError(t('errorLoadingServiceDetails'));
      setMenuItems([]);
    } finally {
      setIsLoadingSubContent(false);
    }
  }, [hostId, t]);
  
  const fetchGeneralServicesForCategory = useCallback(async (generalCategoryId: string) => {
    if (!hostId || !refId || !generalCategoryId) return;
    setIsLoadingSubContent(true);
    try {
      const servicesData = await getServices(hostId, refId, generalCategoryId);
      setServices(servicesData);
    } catch (e: any) {
      setError(t('errorLoadingServiceDetails'));
      setServices([]);
    } finally {
      setIsLoadingSubContent(false);
    }
  }, [hostId, refId, t]);

  useEffect(() => {
    if (viewMode === 'menuItems' && activeMenuCategoryId) {
      fetchMenuItemsForCategory(activeMenuCategoryId);
    } else if (viewMode === 'generalServices' && selectedGeneralCategoryId) {
      fetchGeneralServicesForCategory(selectedGeneralCategoryId);
    }
  }, [viewMode, activeMenuCategoryId, selectedGeneralCategoryId, fetchMenuItemsForCategory, fetchGeneralServicesForCategory]);

  const handleMenuCategoryClick = (menuCategory: MenuCategoryType) => {
    setActiveMenuCategoryId(menuCategory.id);
    setViewMode('menuItems');
  };

  const handleGeneralCategoryClick = (category: ServiceCategory) => {
    setSelectedGeneralCategoryId(category.id);
    setCurrentGeneralCategoryName(category.nom);
    setViewMode('generalServices');
  };
  
  const handleBackToMenuCategories = () => {
    setViewMode('menuCategories');
    setActiveMenuCategoryId(null);
    setMenuItems([]);
  };
  
  const handleBackToGeneralCategories = () => {
    setViewMode('generalCategories');
    setSelectedGeneralCategoryId(null);
    setCurrentGeneralCategoryName(null);
    setServices([]);
  };


  if (isLoadingPage || authIsLoading) {
    return (
      <div className="space-y-8">
        <div className="p-6 md:p-10 rounded-xl shadow-xl bg-card/70 backdrop-blur-lg">
          <Skeleton className="h-10 w-3/4 mb-3" /> <Skeleton className="h-6 w-1/2 mb-6" />
        </div>
        <Skeleton className="h-10 w-1/3 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => ( <div key={i} className="space-y-2 bg-card/50 p-4 rounded-lg"> <Skeleton className="h-32 w-full rounded-md" /> <Skeleton className="h-6 w-3/4 mt-3 mx-auto" /> </div> ))}
        </div>
      </div>
    );
  }

  if (error) {
    return ( <div className="text-center py-10"> <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" /> <h1 className="text-2xl font-semibold text-destructive mb-2">{t('errorLoadingServiceDetails')}</h1> <p className="text-muted-foreground px-4">{error}</p> <Button onClick={() => router.back()} className="mt-6">{t('goBack')}</Button> </div> );
  }
  
  const hostBackgroundUrl = hostInfo?.reservationPageSettings?.heroImageUrl || 'https://placehold.co/1920x400.png';
  const hostBackgroundAiHint = hostInfo?.reservationPageSettings?.heroImageAiHint || hostInfo?.nom.toLowerCase().split(" ").slice(0,2).join(" ") || "establishment background";

  const currentMenuCategoryName = menuCategories.find(cat => cat.id === activeMenuCategoryId)?.name;

  return (
    <div className="space-y-8">
      <div className="relative p-6 md:p-12 rounded-xl shadow-2xl overflow-hidden text-center min-h-[200px] sm:min-h-[250px] flex flex-col justify-center items-center text-card-foreground bg-card">
         <NextImage src={hostBackgroundUrl} alt={`${hostInfo?.nom || 'Establishment'} background`} layout="fill" objectFit="cover" className="opacity-20" data-ai-hint={hostBackgroundAiHint} priority />
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-2"> {t('welcomeTo')} {hostInfo?.nom || t('establishmentNotFound')} </h1>
          {locationInfo && ( <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium flex items-center justify-center"> <MapPin className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-primary" /> {t('servicesFor')} <span className="font-semibold text-primary ml-1.5">{locationInfo.type === "Chambre" ? t('room') : t('table')} - {locationInfo.nom}</span> </p> )}
        </div>
      </div>

      {activeMenuCard && menuCategories.length > 0 && (
        <>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold flex items-center">
                <ChefHat className="mr-3 h-7 w-7 text-primary" />
                {activeMenuCard.name || "Menu"}
              </CardTitle>
              {activeMenuCard.description && <CardDescription>{activeMenuCard.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <Tabs value={activeMenuCategoryId || menuCategories[0]?.id} onValueChange={setActiveMenuCategoryId} className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 bg-transparent p-0">
                  {menuCategories.map((cat) => (
                    <TabsTrigger key={cat.id} value={cat.id} className="text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                      {cat.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {menuCategories.map((cat) => (
                  <TabsContent key={`content-${cat.id}`} value={cat.id} className="mt-6">
                    {isLoadingSubContent ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => ( <div key={`skel-item-${i}`} className="space-y-2 bg-card/50 p-4 rounded-lg"> <Skeleton className="h-48 w-full rounded-md" /> <Skeleton className="h-6 w-3/4 mt-3" /> <Skeleton className="h-4 w-1/2" /> <Skeleton className="h-10 w-full mt-2" /> </div> ))}
                      </div>
                    ) : menuItems.length === 0 ? (
                      <p className="text-center text-muted-foreground text-lg py-10">{t('noItemsInCategory')}</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
                        {menuItems.map(item => ( <MenuItemCard key={item.id} item={item} hostId={hostId} refId={refId} isUserLoggedIn={!!user} /> ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
          <div className="text-center mt-6">
             <Button variant="outline" onClick={() => setViewMode('generalCategories')}>{t('browseServices')}</Button>
          </div>
        </>
      )}
      
      {(!activeMenuCard || menuCategories.length === 0 || viewMode === 'generalCategories' || viewMode === 'generalServices') && (
        <>
          {viewMode === 'generalCategories' && (
            <>
              <div className="mb-6 pt-4">
                <div className="flex items-center gap-2 mb-3"> <ListFilter className="h-6 w-6 text-primary"/> <h2 className="text-2xl font-semibold text-foreground">{t('ourMenuCategories')}</h2> </div>
                {generalServiceCategories.length === 0 && !isLoadingPage && ( <p className="text-center text-muted-foreground text-lg py-10">{t('noServicesInCategory')}</p> )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {generalServiceCategories.map(category => ( <GeneralCategoryCard key={category.id} category={category} onClick={() => handleGeneralCategoryClick(category)} imageUrl={category.image} imageAiHint={category['data-ai-hint']} /> ))}
              </div>
            </>
          )}

          {viewMode === 'generalServices' && (
            <>
              <div className="flex items-center justify-between mb-6 pt-4">
                <Button variant="outline" onClick={handleBackToGeneralCategories} className="text-base py-2 px-4"> <ArrowLeft className="mr-2 h-5 w-5" /> {t('backToCategories')} </Button>
                <h2 className="text-2xl font-semibold text-foreground text-right"> {currentGeneralCategoryName || t('servicesFor')} </h2>
              </div>
              {isLoadingSubContent ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => ( <div key={`skel-serv-${i}`} className="space-y-2 bg-card/50 p-4 rounded-lg"> <Skeleton className="h-48 w-full rounded-md" /> <Skeleton className="h-6 w-3/4 mt-3" /> <Skeleton className="h-4 w-1/2" /> <Skeleton className="h-10 w-full mt-2" /> </div> ))}
                </div>
              ) : services.length === 0 ? (
                <p className="text-center text-muted-foreground text-lg py-10">{t('noServicesInCategory')}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
                  {services.map(service => ( <ServiceCard key={service.id} service={service} hostId={hostId} refId={refId} isUserLoggedIn={!!user} /> ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

    