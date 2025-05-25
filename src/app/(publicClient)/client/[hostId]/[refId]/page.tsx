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
  const refId = params.refId as string;

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

  const [mainView, setMainView] = useState<'menu' | 'generalServices'>('menu'); // 'menu', 'generalServices'
  const [subView, setSubView] = useState<'categories' | 'items'>('categories'); // 'categories', 'items' (applies to both menu and general)

  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isLoadingSubContent, setIsLoadingSubContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPageData = useCallback(async () => {
    if (authIsLoading || !hostId || !refId) return;
    setIsLoadingPage(true);
    setError(null);
    try {
      const [hostData, locationData, generalCategoriesData] = await Promise.all([
        getHostById(hostId),
        getRoomOrTableById(refId),
        fetchHostServiceCategories(hostId) // Always fetch general categories
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
            setMainView('menu');
            setSubView('categories');
            if (fetchedMenuCategories.length > 0) {
              // Optionally pre-select first menu category and load its items
              // setActiveMenuCategoryId(fetchedMenuCategories[0].id);
              // setSubView('items');
            }
          } else {
            setActiveMenuCard(null);
            setMainView('generalServices');
            setSubView('categories');
          }
        } else {
          setActiveMenuCard(null);
          setMainView('generalServices');
          setSubView('categories');
        }
      } else {
        setActiveMenuCard(null);
        setMainView('generalServices');
        setSubView('categories');
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

  const fetchSubContent = useCallback(async () => {
    if (!hostId) return;
    setIsLoadingSubContent(true);
    if (mainView === 'menu' && subView === 'items' && activeMenuCategoryId) {
      try {
        const items = await getMenuItems(activeMenuCategoryId, hostId);
        setMenuItems(items.filter(item => item.isAvailable !== false));
      } catch (e) { setError(t('errorLoadingServiceDetails')); setMenuItems([]); }
    } else if (mainView === 'generalServices' && subView === 'items' && selectedGeneralCategoryId) {
      try {
        const servicesData = await getServices(hostId, refId, selectedGeneralCategoryId);
        setGeneralServices(servicesData);
      } catch (e) { setError(t('errorLoadingServiceDetails')); setGeneralServices([]); }
    }
    setIsLoadingSubContent(false);
  }, [hostId, refId, mainView, subView, activeMenuCategoryId, selectedGeneralCategoryId, t]);

  useEffect(() => {
    if ((mainView === 'menu' && subView === 'items' && activeMenuCategoryId) || 
        (mainView === 'generalServices' && subView === 'items' && selectedGeneralCategoryId)) {
      fetchSubContent();
    }
  }, [mainView, subView, activeMenuCategoryId, selectedGeneralCategoryId, fetchSubContent]);

  const handleMenuCategoryClick = (menuCategory: MenuCategoryType) => {
    setActiveMenuCategoryId(menuCategory.id);
    setSubView('items');
  };

  const handleGeneralCategoryClick = (category: ServiceCategory) => {
    setSelectedGeneralCategoryId(category.id);
    setCurrentGeneralCategoryName(category.nom);
    setSubView('items');
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

  const renderMenuCategories = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-foreground flex items-center"><ChefHat className="mr-3 h-7 w-7 text-primary" /> {activeMenuCard?.name || "Menu"}</h2>
        {activeMenuCard && generalServiceCategories.length > 0 && (
          <Button variant="outline" onClick={() => { setMainView('generalServices'); setSubView('categories'); }}>{t('browseOtherServices')}</Button>
        )}
      </div>
      {menuCategories.length === 0 && <p className="text-center text-muted-foreground text-lg py-10">{t('noMenuAvailable')}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {menuCategories.map(cat => (
          <Card key={cat.id} onClick={() => handleMenuCategoryClick(cat)} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer h-full bg-card hover:bg-accent/10">
            <CardHeader className="p-0 relative"><div className="relative w-full h-32 bg-muted flex items-center justify-center rounded-t-lg"><Utensils className="h-12 w-12 text-muted-foreground/50"/></div></CardHeader>
            <CardContent className="p-3 flex-grow flex items-center justify-center"><CardTitle className="text-md text-center font-semibold">{cat.name}</CardTitle></CardContent>
          </Card>
        ))}
      </div>
    </>
  );

  const renderMenuItems = () => (
    <>
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => setSubView('categories')} className="text-base py-2 px-4"> <ArrowLeft className="mr-2 h-5 w-5" /> {t('backToMenuCategories')} </Button>
        <h2 className="text-2xl font-semibold text-foreground text-right"> {menuCategories.find(c=>c.id === activeMenuCategoryId)?.name || t('itemsInCategory')} </h2>
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
  );

  const renderGeneralServiceCategories = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-foreground flex items-center"><ListFilter className="mr-3 h-7 w-7 text-primary" />{t('browseOtherServices')}</h2>
        {activeMenuCard && <Button variant="outline" onClick={() => { setMainView('menu'); setSubView('categories'); }}>{t('backToMainMenu')}</Button>}
      </div>
      {generalServiceCategories.length === 0 && <p className="text-center text-muted-foreground text-lg py-10">{t('noServicesInCategory')}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {generalServiceCategories.map(category => ( <GeneralCategoryCard key={category.id} category={category} onClick={() => { setSelectedGeneralCategoryId(category.id); setCurrentGeneralCategoryName(category.nom); setSubView('items'); }} imageUrl={category.image} imageAiHint={category['data-ai-hint']} /> ))}
      </div>
    </>
  );

  const renderGeneralServices = () => (
     <>
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => setSubView('categories')} className="text-base py-2 px-4"> <ArrowLeft className="mr-2 h-5 w-5" /> {t('backToCategories')} </Button>
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
  );

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
        {mainView === 'menu' && activeMenuCard && subView === 'categories' && renderMenuCategories()}
        {mainView === 'menu' && activeMenuCard && subView === 'items' && renderMenuItems()}
        
        {mainView === 'generalServices' && subView === 'categories' && renderGeneralServiceCategories()}
        {mainView === 'generalServices' && subView === 'items' && renderGeneralServices()}
      </div>
    </div>
  );
}

    