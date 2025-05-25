// src/app/(publicClient)/client/[hostId]/[refId]/page.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getServices,
  getHostById,
  getRoomOrTableById,
  getServiceCategories as fetchHostServiceCategories,
  getMenuCardById,
  getMenuCategories as fetchMenuCategoriesForCard,
  getMenuItems
} from '@/lib/data';
import type { Service, Host, RoomOrTable, ServiceCategory, MenuCard, MenuCategory as MenuCategoryType, MenuItem } from '@/lib/types';
import { ServiceCard } from '@/components/client/ServiceCard';
import { MenuItemCard } from '@/components/client/MenuItemCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Building, MapPin, ArrowLeft, ImageIcon, Utensils, ListFilter, ChefHat, ShoppingCart, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: ServiceCategory;
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
  const { t } = useLanguage();
  const { cartItems, getTotalItems } = useCart();

  const hostId = params.hostId as string;
  const refId = params.refId as string; // Location ID (RoomOrTable)

  const [hostInfo, setHostInfo] = useState<Host | null>(null);
  const [locationInfo, setLocationInfo] = useState<RoomOrTable | null>(null);
  
  const [activeMenuCard, setActiveMenuCard] = useState<MenuCard | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategoryType[]>([]);
  const [activeMenuCategoryId, setActiveMenuCategoryId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  const [generalServiceCategories, setGeneralServiceCategories] = useState<ServiceCategory[]>([]);
  const [generalServices, setGeneralServices] = useState<Service[]>([]);
  const [selectedGeneralCategoryId, setSelectedGeneralCategoryId] = useState<string | null>(null);
  const [currentGeneralCategoryName, setCurrentGeneralCategoryName] = useState<string | null>(null);

  const [viewState, setViewState] = useState<'menuCategories' | 'menuItems' | 'generalCategories' | 'generalServices'>('menuCategories');

  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isLoadingSubContent, setIsLoadingSubContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMenuTimeVisible, setIsMenuTimeVisible] = useState(false);

  const fetchPageData = useCallback(async () => {
    if (authIsLoading || !hostId || !refId) return;
    setIsLoadingPage(true);
    setError(null);
    setActiveMenuCard(null);
    setMenuCategories([]);
    setActiveMenuCategoryId(null);
    setMenuItems([]);
    setGeneralServiceCategories([]);
    setGeneralServices([]);
    
    try {
      const [hostData, locationData, generalCategoriesData] = await Promise.all([
        getHostById(hostId),
        getRoomOrTableById(refId),
        fetchHostServiceCategories(hostId)
      ]);

      if (!hostData) { setError(t('establishmentNotFound')); setHostInfo(null); setIsLoadingPage(false); return; }
      setHostInfo(hostData);

      if (!locationData || locationData.hostId !== hostId) { setError(t('locationNotFound')); setLocationInfo(null); setIsLoadingPage(false); return; }
      setLocationInfo(locationData);
      setGeneralServiceCategories(generalCategoriesData);

      if (locationData.menuCardId) {
        const menuCardData = await getMenuCardById(locationData.menuCardId);
        if (menuCardData && menuCardData.isActive) {
          const now = new Date();
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          let timeVisible = true;
          if (menuCardData.visibleFromTime && menuCardData.visibleToTime) {
            timeVisible = currentTime >= menuCardData.visibleFromTime && currentTime <= menuCardData.visibleToTime;
          } else if (menuCardData.visibleFromTime) {
            timeVisible = currentTime >= menuCardData.visibleFromTime;
          } else if (menuCardData.visibleToTime) {
            timeVisible = currentTime <= menuCardData.visibleToTime;
          }
          setIsMenuTimeVisible(timeVisible);

          if (timeVisible) {
            setActiveMenuCard(menuCardData);
            const fetchedMenuCategories = await fetchMenuCategoriesForCard(menuCardData.id, hostId);
            setMenuCategories(fetchedMenuCategories);
            setViewState('menuCategories'); // Default to menu categories if menu is active
            if (fetchedMenuCategories.length === 1) { // Auto-select if only one category
              setActiveMenuCategoryId(fetchedMenuCategories[0].id);
              setCurrentGeneralCategoryName(fetchedMenuCategories[0].name); // For title consistency
              setViewState('menuItems');
            }
          } else {
            setActiveMenuCard(null); // Menu not visible at this time
            setViewState('generalCategories'); // Default to general categories
          }
        } else {
          setActiveMenuCard(null); // Menu not active or not found
          setViewState('generalCategories'); // Default to general categories
        }
      } else {
        setActiveMenuCard(null); // No menu card associated
        setViewState('generalCategories'); // Default to general categories
      }
    } catch (e: any) {
      setError(t('errorLoadingServiceDetails') + ` (${e.message})`);
    } finally {
      setIsLoadingPage(false);
    }
  }, [hostId, refId, authIsLoading, t]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const fetchMenuItemsForCategory = useCallback(async (menuCatId: string) => {
    if (!hostId || !menuCatId) return;
    setIsLoadingSubContent(true);
    try {
      const items = await getMenuItems(menuCatId, hostId);
      setMenuItems(items.filter(item => item.isAvailable !== false));
    } catch (e) { setError(t('errorLoadingServiceDetails')); setMenuItems([]); }
    finally { setIsLoadingSubContent(false); }
  }, [hostId, t]);

  const fetchGeneralServicesForCategory = useCallback(async (generalCatId: string) => {
    if (!hostId || !refId || !generalCatId) return;
    setIsLoadingSubContent(true);
    try {
      const servicesData = await getServices(hostId, refId, generalCatId);
      setGeneralServices(servicesData);
    } catch (e) { setError(t('errorLoadingServiceDetails')); setGeneralServices([]); }
    finally { setIsLoadingSubContent(false); }
  }, [hostId, refId, t]);

  useEffect(() => {
    if (viewState === 'menuItems' && activeMenuCategoryId) {
      fetchMenuItemsForCategory(activeMenuCategoryId);
    } else if (viewState === 'generalServices' && selectedGeneralCategoryId) {
      fetchGeneralServicesForCategory(selectedGeneralCategoryId);
    }
  }, [viewState, activeMenuCategoryId, selectedGeneralCategoryId, fetchMenuItemsForCategory, fetchGeneralServicesForCategory]);


  const handleMenuCategoryClick = (menuCategory: MenuCategoryType) => {
    setActiveMenuCategoryId(menuCategory.id);
    setCurrentGeneralCategoryName(menuCategory.name);
    setViewState('menuItems');
  };

  const handleGeneralCategoryClick = (category: ServiceCategory) => {
    setSelectedGeneralCategoryId(category.id);
    setCurrentGeneralCategoryName(category.nom);
    setViewState('generalServices');
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
  const showMenu = activeMenuCard && isMenuTimeVisible;
  const showGeneralServices = generalServiceCategories.length > 0;

  return (
    <div className="space-y-8">
      <div className="relative p-6 md:p-12 rounded-xl shadow-2xl overflow-hidden text-center min-h-[200px] sm:min-h-[250px] flex flex-col justify-center items-center text-card-foreground bg-card">
         <NextImage src={hostBackgroundUrl} alt={`${hostInfo?.nom || 'Establishment'} background`} layout="fill" objectFit="cover" className="opacity-20" data-ai-hint={hostBackgroundAiHint} priority />
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-2"> {t('welcomeTo')} {hostInfo?.nom || t('establishmentNotFound')} </h1>
          {locationInfo && ( <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium flex items-center justify-center"> <MapPin className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-primary" /> {t('servicesFor')} <span className="font-semibold text-primary ml-1.5">{locationInfo.type === "Chambre" ? t('room') : t('table')} - {locationInfo.nom}</span> </p> )}
        </div>
      </div>
      
      <div className="pt-4">
        {showMenu && (
          <Tabs defaultValue={viewState === 'menuCategories' || viewState === 'menuItems' ? 'menu' : 'general'} 
                onValueChange={(value) => {
                    if (value === 'menu') setViewState('menuCategories');
                    else if (value === 'general') setViewState('generalCategories');
                }}
                className="w-full"
          >
            <TabsList className={cn("grid w-full", showGeneralServices ? "grid-cols-2" : "grid-cols-1")}>
              <TabsTrigger value="menu">{activeMenuCard?.name || t('ourMenuCategories')}</TabsTrigger>
              {showGeneralServices && <TabsTrigger value="general">{t('browseOtherServices')}</TabsTrigger>}
            </TabsList>
            <TabsContent value="menu" className="mt-6">
              {viewState === 'menuCategories' && (
                <>
                  <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center"><ChefHat className="mr-3 h-7 w-7 text-primary" /> {activeMenuCard?.name || "Menu"}</h2>
                  {menuCategories.length === 0 && !isLoadingSubContent && <p className="text-center text-muted-foreground text-lg py-10">{t('noMenuAvailable')}</p>}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {menuCategories.map(cat => (
                      <Card key={cat.id} onClick={() => handleMenuCategoryClick(cat)} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer h-full bg-card hover:bg-accent/10">
                        <CardHeader className="p-0 relative"><div className="relative w-full h-32 bg-muted flex items-center justify-center rounded-t-lg"><Utensils className="h-12 w-12 text-muted-foreground/50"/></div></CardHeader>
                        <CardContent className="p-3 flex-grow flex items-center justify-center"><CardTitle className="text-md text-center font-semibold">{cat.name}</CardTitle></CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
              {viewState === 'menuItems' && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <Button variant="outline" onClick={() => setViewState('menuCategories')} className="text-base py-2 px-4"> <ArrowLeft className="mr-2 h-5 w-5" /> {t('backToMenuCategories')} </Button>
                    <h2 className="text-2xl font-semibold text-foreground text-right"> {currentGeneralCategoryName || t('itemsInCategory', {categoryName: ''})} </h2>
                  </div>
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
                </>
              )}
            </TabsContent>
            {showGeneralServices && (
              <TabsContent value="general" className="mt-6">
                {viewState === 'generalCategories' && (
                  <>
                    <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center"><ListFilter className="mr-3 h-7 w-7 text-primary" />{t('browseOtherServices')}</h2>
                    {generalServiceCategories.length === 0 && !isLoadingSubContent && <p className="text-center text-muted-foreground text-lg py-10">{t('noServicesInCategory')}</p>}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                      {generalServiceCategories.map(category => ( <GeneralCategoryCard key={category.id} category={category} onClick={() => handleGeneralCategoryClick(category)} imageUrl={category.image} imageAiHint={category['data-ai-hint']} /> ))}
                    </div>
                  </>
                )}
                {viewState === 'generalServices' && (
                   <>
                    <div className="flex items-center justify-between mb-6">
                      <Button variant="outline" onClick={() => setViewState('generalCategories')} className="text-base py-2 px-4"> <ArrowLeft className="mr-2 h-5 w-5" /> {t('backToCategories')} </Button>
                      <h2 className="text-2xl font-semibold text-foreground text-right"> {currentGeneralCategoryName || t('servicesFor')} </h2>
                    </div>
                    {isLoadingSubContent ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {[...Array(4)].map((_, i) => ( <div key={`skel-serv-${i}`} className="space-y-2 bg-card/50 p-4 rounded-lg"> <Skeleton className="h-48 w-full rounded-md" /> <Skeleton className="h-6 w-3/4 mt-3" /> <Skeleton className="h-4 w-1/2" /> <Skeleton className="h-10 w-full mt-2" /> </div> ))}
                        </div>
                    ) : generalServices.length === 0 ? (
                      <p className="text-center text-muted-foreground text-lg py-10">{t('noServicesInCategory')}</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
                        {generalServices.map(service => ( <ServiceCard key={service.id} service={service} hostId={hostId} refId={refId} isUserLoggedIn={!!user} /> ))}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            )}
          </Tabs>
        )}
        {/* Fallback if no menu is active/visible but general services are */}
        {!showMenu && showGeneralServices && (
           <>
            {viewState === 'generalCategories' && (
                <>
                  <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center"><ListFilter className="mr-3 h-7 w-7 text-primary" />{t('browseOtherServices')}</h2>
                  {generalServiceCategories.length === 0 && !isLoadingSubContent && <p className="text-center text-muted-foreground text-lg py-10">{t('noServicesInCategory')}</p>}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {generalServiceCategories.map(category => ( <GeneralCategoryCard key={category.id} category={category} onClick={() => handleGeneralCategoryClick(category)} imageUrl={category.image} imageAiHint={category['data-ai-hint']} /> ))}
                  </div>
                </>
              )}
              {viewState === 'generalServices' && (
                 <>
                  <div className="flex items-center justify-between mb-6">
                    <Button variant="outline" onClick={() => setViewState('generalCategories')} className="text-base py-2 px-4"> <ArrowLeft className="mr-2 h-5 w-5" /> {t('backToCategories')} </Button>
                    <h2 className="text-2xl font-semibold text-foreground text-right"> {currentGeneralCategoryName || t('servicesFor')} </h2>
                  </div>
                  {isLoadingSubContent ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => ( <div key={`skel-serv-fallback-${i}`} className="space-y-2 bg-card/50 p-4 rounded-lg"> <Skeleton className="h-48 w-full rounded-md" /> <Skeleton className="h-6 w-3/4 mt-3" /> <Skeleton className="h-4 w-1/2" /> <Skeleton className="h-10 w-full mt-2" /> </div> ))}
                      </div>
                  ) : generalServices.length === 0 ? (
                    <p className="text-center text-muted-foreground text-lg py-10">{t('noServicesInCategory')}</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
                      {generalServices.map(service => ( <ServiceCard key={service.id} service={service} hostId={hostId} refId={refId} isUserLoggedIn={!!user} /> ))}
                    </div>
                  )}
                </>
              )}
           </>
        )}
        {!showMenu && !showGeneralServices && !isLoadingPage && (
             <p className="text-center text-muted-foreground text-lg py-10">{t('noMenuAvailable')}</p>
        )}
      </div>
    </div>
  );
}

    
