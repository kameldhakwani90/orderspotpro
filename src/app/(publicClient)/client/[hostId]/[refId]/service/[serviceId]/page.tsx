
"use client";

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react'; 
import { useParams, useRouter, usePathname } from 'next/navigation';
// Correction: Remplacer getServiceById par getItemById
import { getItemById, getFormById, getFormFields, addOrder, getHostById, getRoomOrTableById } from '@/lib/data';
import type { Service, CustomForm, FormField as FormFieldType, Host, RoomOrTable, MenuItem, MenuItemOptionGroup, MenuItemOption } from '@/lib/types';
import { DynamicFormRenderer, type DynamicFormRendererRef } from '@/components/shared/DynamicFormRenderer';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, Utensils, BedDouble, LogIn, Lock, ShoppingCart, ArrowLeft, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardDescription, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { HostOrderPlacementDialog } from '@/components/host/HostOrderPlacementDialog';

function PublicClientOrderServicePageContent() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { user, isLoading: authIsLoading } = useAuth();
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const formRef = useRef<DynamicFormRendererRef>(null);

  const hostId = params.hostId as string;
  const refId = params.refId as string; 
  const itemId = params.serviceId as string; 

  const [itemDetail, setItemDetail] = useState<Service | MenuItem | null>(null);
  const [customForm, setCustomForm] = useState<CustomForm | null>(null);
  const [formFields, setFormFields] = useState<FormFieldType[]>([]);
  const [hostInfo, setHostInfo] = useState<Host | null>(null);
  const [locationInfo, setLocationInfo] = useState<RoomOrTable | null>(null);

  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>({});
  const [currentTotalPrice, setCurrentTotalPrice] = useState<number>(0);
  
  const [isHostOrderPlacementDialogOpen, setIsHostOrderPlacementDialogOpen] = useState(false);


  const isMenuItem = (item: Service | MenuItem | null): item is MenuItem => {
    return item !== null && ('menuCategoryId' in item || 'isConfigurable' in item);
  };

  useEffect(() => {
    if (authIsLoading) return;

    if (hostId && refId && itemId) {
      const fetchData = async () => {
        setIsLoadingPage(true);
        setError(null);
        setOrderSuccess(false);
        try {
          // Correction: Utiliser getItemById ici
          const [fetchedItemData, fetchedHostData, fetchedLocationData] = await Promise.all([
            getItemById(itemId), 
            getHostById(hostId),
            getRoomOrTableById(refId),
          ]);
          
          if (!fetchedItemData) { setError(t('serviceNotFound')); setItemDetail(null); setIsLoadingPage(false); return; }
          // @ts-ignore
          if (fetchedItemData.hostId && fetchedItemData.hostId !== hostId) { setError("Item not available for this establishment."); setItemDetail(null); setIsLoadingPage(false); return; }
          if (!fetchedHostData) { setError(t('establishmentNotFound')); setHostInfo(null); setIsLoadingPage(false); return; }
          if (!fetchedLocationData || fetchedLocationData.hostId !== hostId || fetchedLocationData.id !== refId) { setError(t('locationNotFound')); setLocationInfo(null); setIsLoadingPage(false); return; }

          setItemDetail(fetchedItemData);
          setHostInfo(fetchedHostData);
          setLocationInfo(fetchedLocationData);

          if (isMenuItem(fetchedItemData)) {
            if (fetchedItemData.isConfigurable && fetchedItemData.optionGroups) {
              setCurrentTotalPrice(fetchedItemData.price);
              const initialSelections: Record<string, string | string[]> = {};
              fetchedItemData.optionGroups.forEach(group => {
                  if (group.isRequired && group.selectionType === 'single' && group.options.length > 0) {
                      const defaultOpt = group.options.find(opt => (opt as any).isDefault) || group.options[0];
                      if (defaultOpt) initialSelections[group.id] = defaultOpt.id;
                  } else if (group.isRequired && group.selectionType === 'multiple' && group.options.length > 0) {
                       const defaultOpt = group.options.find(opt => (opt as any).isDefault) || group.options[0];
                       if (defaultOpt) initialSelections[group.id] = [defaultOpt.id];
                  }
              });
              setSelectedOptions(initialSelections);
            } else {
              setCurrentTotalPrice(fetchedItemData.price);
            }
            setCustomForm(null); setFormFields([]);
          } else { 
            setCurrentTotalPrice(fetchedItemData.prix || 0);
            if (fetchedItemData.formulaireId) {
              const formDetails = await getFormById(fetchedItemData.formulaireId);
              if (formDetails && formDetails.hostId === hostId) {
                setCustomForm(formDetails);
                const fields = await getFormFields(formDetails.id);
                setFormFields(fields);
              } else {
                setCustomForm(null); setFormFields([]);
              }
            } else {
              setCustomForm(null); setFormFields([]);
            }
          }
        } catch (e: any) {
          setError(t('errorLoadingServiceDetails') + ` (${e.message})`);
        }
        setIsLoadingPage(false);
      };
      fetchData();
    } else {
      setError("Required information (host, location, or item ID) is missing.");
      setIsLoadingPage(false);
    }
  }, [hostId, refId, itemId, authIsLoading, t]);

  useEffect(() => {
    if (itemDetail && isMenuItem(itemDetail) && itemDetail.isConfigurable && itemDetail.optionGroups) {
      let newTotal = itemDetail.price;
      itemDetail.optionGroups.forEach(group => {
        const selection = selectedOptions[group.id];
        if (selection) {
          if (Array.isArray(selection)) {
            selection.forEach(optionId => {
              const option = group.options.find(opt => opt.id === optionId);
              if (option && option.priceAdjustment) newTotal += option.priceAdjustment;
            });
          } else { 
            const option = group.options.find(opt => opt.id === selection);
            if (option && option.priceAdjustment) newTotal += option.priceAdjustment;
          }
        }
      });
      setCurrentTotalPrice(newTotal);
    } else if (itemDetail) {
       setCurrentTotalPrice(isMenuItem(itemDetail) ? itemDetail.price : (itemDetail as Service).prix || 0);
    }
  }, [selectedOptions, itemDetail]);

  const handleOptionChange = (groupId: string, optionId: string, selectionType: 'single' | 'multiple') => {
    setSelectedOptions(prev => {
      const newSelections = { ...prev };
      if (selectionType === 'single') {
        newSelections[groupId] = optionId;
      } else { 
        const currentGroupSelection = (newSelections[groupId] as string[] || []);
        if (currentGroupSelection.includes(optionId)) {
          newSelections[groupId] = currentGroupSelection.filter(id => id !== optionId);
        } else {
          newSelections[groupId] = [...currentGroupSelection, optionId];
        }
      }
      return newSelections;
    });
  };

  const handleDirectServiceOrderSubmit = async (formData: Record<string, any>) => {
    if (!itemDetail || isMenuItem(itemDetail) || !hostId || !refId) return; 
    
    const service = itemDetail as Service; 
    if (service.loginRequired && !user) {
      toast({ title: t('loginRequired') || "Login Required", description: t('loginToOrder', { serviceName: service.titre }) || "Please log in to order.", variant: "destructive"});
      router.push(`/login?redirect_url=${encodeURIComponent(pathname)}`);
      return;
    }
    setIsSubmitting(true);
    try {
      await addOrder({
        serviceId: service.id,
        hostId: hostId,
        chambreTableId: refId,
        clientNom: user?.nom,
        userId: user?.id,
        donneesFormulaire: JSON.stringify(formData),
        prixTotal: service.prix,
        currency: hostInfo?.currency
      });
      setOrderSuccess(true);
      toast({ title: t('orderSuccessTitle') || "Order Submitted!", description: t('orderSuccessDescription', { serviceName: service.titre }) || "Your order has been sent." });
    } catch (e) {
      toast({ title: "Order Submission Failed", description: "There was an error. Please try again.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const handleAddToCartClick = () => {
    if (!itemDetail || !isMenuItem(itemDetail)) return;
    
    const menuItem = itemDetail as MenuItem; 
    if (menuItem.loginRequired && !user) {
      toast({ title: t('loginRequired') || "Login Required", description: t('loginToOrder', { serviceName: menuItem.name }) || "Please log in to add to cart.", variant: "destructive"});
      router.push(`/login?redirect_url=${encodeURIComponent(pathname)}`);
      return;
    }
    if (menuItem.isConfigurable && menuItem.optionGroups) {
      for (const group of menuItem.optionGroups) {
        if (group.isRequired && (!selectedOptions[group.id] || (Array.isArray(selectedOptions[group.id]) && (selectedOptions[group.id] as string[]).length === 0))) {
          toast({ title: "Option requise", description: `Veuillez sélectionner une option pour "${group.name}".`, variant: "destructive" });
          return;
        }
      }
    }
    addToCart(menuItem, selectedOptions, currentTotalPrice); 
    toast({ title: `${menuItem.name} ${t('addToCart') || "added to cart"}!`, description: t('orderSuccessDescription', { serviceName: menuItem.name }) || `Added ${menuItem.name} to your cart.` });
    router.push(`/client/${hostId}/${refId}`);
  };

  const handleHostInitiatedOrder = () => {
    if (!itemDetail || !hostInfo || !locationInfo) {
      toast({ title: "Error", description: "Item or context details missing.", variant: "destructive" });
      return;
    }
    if (isMenuItem(itemDetail) && itemDetail.isConfigurable && itemDetail.optionGroups) {
      for (const group of itemDetail.optionGroups) {
        if (group.isRequired && (!selectedOptions[group.id] || (Array.isArray(selectedOptions[group.id]) && (selectedOptions[group.id] as string[]).length === 0))) {
          toast({ title: "Option requise", description: `Veuillez sélectionner une option pour "${group.name}".`, variant: "destructive" });
          return;
        }
      }
    }
    setIsHostOrderPlacementDialogOpen(true);
  };

  const handleOrderPlacedByHost = () => {
    setOrderSuccess(true); 
  };

  const handleMainAction = () => {
    if (authIsLoading) return;

    if (user && user.role === 'host') {
      handleHostInitiatedOrder();
    } else { 
      if (currentItemIsMenuItem) {
        handleAddToCartClick(); 
      } else if (serviceHasForm && formRef.current) {
        formRef.current.submit(); 
      } else {
        handleDirectServiceOrderSubmit({}); 
      }
    }
  };

  const submitButtonText = () => {
    if (isSubmitting) return t('submitting') || "Submitting...";
    if (user && user.role === 'host') {
        return "Passer Commande pour Client";
    }
    if (currentItemIsMenuItem) return t('addToCart') || "Add to Cart";
    return t('orderFor', { price: `${(itemDetail?.currency || hostInfo?.currency || '$')}${currentTotalPrice.toFixed(2)}` }) || `Order for ${(itemDetail?.currency || hostInfo?.currency || '$')}${currentTotalPrice.toFixed(2)}`;
  };


  if (isLoadingPage || authIsLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-56 w-full mb-4" />
        <Skeleton className="h-6 w-1/2 mb-2" />
        <Skeleton className="h-20 w-full mb-4" />
        <Skeleton className="h-10 w-1/3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 bg-card p-8 rounded-xl shadow-xl max-w-md mx-auto">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-6" />
        <h1 className="text-2xl font-semibold text-destructive mb-3">{t('errorAccessingReservation') || 'Access Error'}</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.back()} className="mt-4 w-full">{t('goBack') || 'Go Back'}</Button>
      </div>
    );
  }
  
  if (orderSuccess) {
    return (
      <div className="text-center py-16 bg-card p-8 rounded-xl shadow-xl max-w-md mx-auto">
        <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-3">{t('orderSuccessTitle') || "Order Submitted!"}</h1>
        <p className="text-lg text-muted-foreground mb-6">
          {t('orderSuccessDescription', { serviceName: itemDetail ? (isMenuItem(itemDetail) ? itemDetail.name : (itemDetail as Service).titre) : 'service' }) || "Your order has been sent."}
        </p>
        <Button onClick={() => router.push(`/client/${hostId}/${refId}`)} size="lg" className="bg-primary hover:bg-primary/90">
          {t('backToServices') || "Back to Services"}
        </Button>
      </div>
    );
  }
  
  if (!itemDetail || !hostInfo || !locationInfo) {
    return (
      <div className="text-center py-10 bg-card p-8 rounded-xl shadow-xl max-w-md mx-auto">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-6" />
        <h1 className="text-2xl font-semibold text-destructive mb-3">{t('serviceNotFound') || "Item Not Found"}</h1>
        <p className="text-muted-foreground mb-6">{t('errorLoadingServiceDetails') || "Details for this item could not be loaded."}</p>
        <Button onClick={() => router.back()} className="mt-4 w-full">{t('goBack') || "Go Back"}</Button>
      </div>
    );
  }

  const currentItemIsMenuItem = isMenuItem(itemDetail);
  const itemName = currentItemIsMenuItem ? itemDetail.name : (itemDetail as Service).titre;
  const itemDescription = itemDetail.description;
  const itemImage = currentItemIsMenuItem ? itemDetail.imageUrl : (itemDetail as Service).image;
  const itemImageAiHint = currentItemIsMenuItem ? itemDetail.imageAiHint : (itemDetail as Service)['data-ai-hint'];
  const itemIsLoginRequired = itemDetail.loginRequired;
  const itemIsConfigurable = currentItemIsMenuItem && itemDetail.isConfigurable;
  const optionGroups = currentItemIsMenuItem && itemDetail.optionGroups ? itemDetail.optionGroups : [];
  const serviceHasForm = !currentItemIsMenuItem && (itemDetail as Service).formulaireId;
  const itemStock = currentItemIsMenuItem ? itemDetail.stock : undefined;
  const isItemOutOfStock = itemStock === 0;

  if (itemIsLoginRequired && !user && (!authUser || authUser.role !== 'host')) { // Allow host to proceed
    return (
      <div className="text-center py-10 bg-card p-8 rounded-xl shadow-xl max-w-md mx-auto">
        <Lock className="mx-auto h-16 w-16 text-primary mb-6" />
        <h1 className="text-2xl font-semibold text-foreground mb-3">{t('loginRequired') || "Login Required"}</h1>
        <p className="text-muted-foreground mb-6">
          {t('loginToOrder', { serviceName: itemName }) || `Please log in to order ${itemName}.`}
        </p>
        <Link href={`/login?redirect_url=${encodeURIComponent(pathname)}`}>
          <Button size="lg" className="w-full bg-primary hover:bg-primary/90">
            <LogIn className="mr-2 h-5 w-5" />
            <span>{t('loginToContinue') || "Login to Continue"}</span>
          </Button>
        </Link>
         <Button variant="outline" onClick={() => router.back()} className="mt-4 w-full">
          {t('goBack') || 'Go Back'}
        </Button>
      </div>
    );
  }

  const LocationIcon = locationInfo.type === 'Chambre' ? BedDouble : Utensils;

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Card className="shadow-xl overflow-hidden bg-card">
        <CardHeader className="p-0">
          {itemImage && (
            <div className="relative w-full h-56 sm:h-72 md:h-80">
              <Image src={itemImage} alt={itemName} fill style={{objectFit:"cover"}} data-ai-hint={itemImageAiHint || "item image"} priority/>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center mb-3 text-sm text-muted-foreground">
              <LocationIcon className="h-5 w-5 mr-2 text-primary"/>
              <span>{hostInfo.nom} - {locationInfo.type} {locationInfo.nom}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{itemName}</h1>
          <p className="text-muted-foreground mb-4 text-base leading-relaxed">{itemDescription}</p>
          
          {itemIsConfigurable && optionGroups && optionGroups.length > 0 && (
            <div className="space-y-6 mb-6">
              {optionGroups.sort((a,b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map(group => (
                <div key={group.id} className="p-4 border rounded-lg bg-muted/30">
                  <h3 className="text-lg font-semibold mb-2">{group.name}{group.isRequired && <span className="text-destructive ml-1">*</span>}</h3>
                  {group.selectionType === 'single' ? (
                    <RadioGroup
                      value={selectedOptions[group.id] as string || ""}
                      onValueChange={(value) => handleOptionChange(group.id, value, 'single')}
                    >
                      {group.options.map(option => (
                        <div key={option.id} className="flex items-center space-x-2 py-1">
                          <RadioGroupItem value={option.id} id={`${group.id}-${option.id}`} />
                          <Label htmlFor={`${group.id}-${option.id}`} className="flex-1 cursor-pointer">
                            {option.name}
                            {option.priceAdjustment && option.priceAdjustment !== 0 ? (
                              <span className="text-xs ml-1 text-muted-foreground">({option.priceAdjustment > 0 ? `+` : ``}{(itemDetail?.currency || hostInfo?.currency || '$')}{option.priceAdjustment.toFixed(2)})</span>
                            ) : ""}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : ( 
                    <div className="space-y-2">
                    {group.options.map(option => (
                        <div key={option.id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`${group.id}-${option.id}`}
                            checked={(selectedOptions[group.id] as string[] || []).includes(option.id)}
                            onCheckedChange={(checked) => handleOptionChange(group.id, option.id, 'multiple')}
                          />
                          <Label htmlFor={`${group.id}-${option.id}`} className="flex-1 cursor-pointer">
                            {option.name}
                            {option.priceAdjustment && option.priceAdjustment !== 0 ? (
                              <span className="text-xs ml-1 text-muted-foreground">({option.priceAdjustment > 0 ? `+` : ``}{(itemDetail?.currency || hostInfo?.currency || '$')}{option.priceAdjustment.toFixed(2)})</span>
                            ) : ""}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-3xl font-semibold text-primary mb-6 flex items-center">
            <Tag className="h-7 w-7 mr-2" />
            <span>{itemIsConfigurable ? t('totalEstimatedPrice') : t('servicePrice')}: {(itemDetail?.currency || hostInfo?.currency || '$')}{currentTotalPrice.toFixed(2)}</span>
          </p>


          {isItemOutOfStock && <Badge variant="destructive" className="text-md mb-4 block w-fit">{t('stockStatusOutOfStock') || "Out of Stock"}</Badge>}

          {!currentItemIsMenuItem && serviceHasForm && formFields.length > 0 && (
            <DynamicFormRenderer
              ref={formRef}
              formName={t('additionalInformation') || "Additional Information"}
              formDescription={customForm?.nom || "Please provide the following details:"}
              fields={formFields}
              onSubmit={handleDirectServiceOrderSubmit}
            />
          )}
          <div className="mt-6">
            <Button 
              onClick={handleMainAction} 
              disabled={isSubmitting || isItemOutOfStock || (itemIsLoginRequired && !user && (!authUser || authUser.role !== 'host'))} 
              size="lg" 
              className="w-full max-w-xs mx-auto block bg-primary hover:bg-primary/90"
            >
              <ShoppingCart className="mr-2 h-5 w-5"/>
              <span>{submitButtonText()}</span>
            </Button>
          </div>

        </CardContent>
      </Card>
      <Button variant="outline" onClick={() => router.back()} className="mt-8 w-full max-w-lg mx-auto block text-base py-3 h-auto">
         <ArrowLeft className="mr-2 h-4 w-4"/> <span>{t('cancelAndBackToServices') || "Cancel & Back to Services"}</span>
      </Button>

      {itemDetail && hostInfo && locationInfo && user && user.role === 'host' && (
        <HostOrderPlacementDialog
          open={isHostOrderPlacementDialogOpen}
          onOpenChange={setIsHostOrderPlacementDialogOpen}
          item={itemDetail}
          hostId={hostId}
          locationId={refId}
          selectedOptions={currentItemIsMenuItem ? selectedOptions : undefined}
          finalPrice={currentTotalPrice}
          onOrderPlaced={handleOrderPlacedByHost}
        />
      )}
    </div>
  );
}


export default function PublicClientOrderServicePage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-56 w-full mb-4" />
        <Skeleton className="h-6 w-1/2 mb-2" />
        <Skeleton className="h-20 w-full mb-4" />
        <Skeleton className="h-10 w-1/3" />
      </div>
    }>
      <PublicClientOrderServicePageContent />
    </Suspense>
  );
}
