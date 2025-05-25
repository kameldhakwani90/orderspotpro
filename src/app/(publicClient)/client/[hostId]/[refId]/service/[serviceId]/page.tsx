
"use client";

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react'; 
import { useParams, useRouter, usePathname } from 'next/navigation';
import { getServiceById, getFormById, getFormFields, addOrder, getHostById, getRoomOrTableById } from '@/lib/data';
import type { Service, CustomForm, FormField as FormFieldType, Host, RoomOrTable, MenuItem, MenuItemOptionGroup, MenuItemOption } from '@/lib/types';
import { DynamicFormRenderer, type DynamicFormRendererRef } from '@/components/shared/DynamicFormRenderer';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, Utensils, BedDouble, LogIn, Lock, ShoppingCart, PlusCircle, MinusCircle } from 'lucide-react';
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

  useEffect(() => {
    if (authIsLoading) return;

    if (hostId && refId && itemId) {
      const fetchData = async () => {
        setIsLoadingPage(true);
        setError(null);
        setOrderSuccess(false);
        try {
          const [itemData, hostData, locationData] = await Promise.all([
            getServiceById(itemId),
            getHostById(hostId),
            getRoomOrTableById(refId),
          ]);

          if (!itemData) { setError(t('serviceNotFound')); setIsLoadingPage(false); return; }
          // @ts-ignore // hostId might not exist on MenuItem directly, but services have it.
          if (itemData.hostId && itemData.hostId !== hostId) { setError("Item not available for this establishment."); setIsLoadingPage(false); return; }
          if (!hostData) { setError(t('establishmentNotFound')); setIsLoadingPage(false); return; }
          if (!locationData || locationData.hostId !== hostId || locationData.id !== refId) { setError(t('locationNotFound')); setIsLoadingPage(false); return; }

          setItemDetail(itemData);
          setHostInfo(hostData);
          setLocationInfo(locationData);

          if ('formulaireId' in itemData && itemData.formulaireId) {
            const formDetails = await getFormById(itemData.formulaireId);
            if (formDetails && formDetails.hostId === hostId) {
              setCustomForm(formDetails);
              const fields = await getFormFields(formDetails.id);
              setFormFields(fields);
            } else {
              setCustomForm(null); setFormFields([]);
            }
          } else if ('isConfigurable' in itemData && itemData.isConfigurable && itemData.optionGroups) {
            setCustomForm(null); setFormFields([]);
            setCurrentTotalPrice(itemData.price);
            const initialSelections: Record<string, string | string[]> = {};
            itemData.optionGroups.forEach(group => {
                if (group.isRequired && group.selectionType === 'single' && group.options.length > 0) {
                    const defaultOpt = group.options.find(opt => (opt as any).isDefault) || group.options[0];
                    initialSelections[group.id] = defaultOpt.id;
                } else if (group.isRequired && group.selectionType === 'multiple' && group.options.length > 0) {
                     const defaultOpt = group.options.find(opt => (opt as any).isDefault) || group.options[0];
                     initialSelections[group.id] = [defaultOpt.id];
                }
            });
            setSelectedOptions(initialSelections);
          } else {
            setCustomForm(null); setFormFields([]);
            setCurrentTotalPrice('price' in itemData ? itemData.price : (itemData as Service)?.prix || 0);
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
    if (itemDetail && 'isConfigurable' in itemDetail && itemDetail.isConfigurable && itemDetail.optionGroups) {
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
       setCurrentTotalPrice('price' in itemDetail ? itemDetail.price : (itemDetail as Service)?.prix || 0);
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

  const handleServiceOrderWithFormSubmit = async (formData: Record<string, any>) => {
    if (!itemDetail || !hostId || !refId || !('formulaireId' in itemDetail) ) return;
    // @ts-ignore
    if (itemDetail.loginRequired && !user) {
      toast({ title: t('loginRequired'), description: t('loginToOrder'), variant: "destructive"});
      return;
    }
    setIsSubmitting(true);
    try {
      await addOrder({
        serviceId: itemDetail.id,
        hostId: hostId,
        chambreTableId: refId,
        clientNom: user?.nom,
        userId: user?.id,
        donneesFormulaire: JSON.stringify(formData),
        prixTotal: (itemDetail as Service).prix
      });
      setOrderSuccess(true);
      toast({ title: t('orderSuccessTitle'), description: t('orderSuccessDescription', { serviceName: (itemDetail as Service).titre }) });
    } catch (e) {
      toast({ title: "Order Submission Failed", description: "There was an error. Please try again.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const handleConfigurableItemAddToCart = () => {
    if (!itemDetail || !('isConfigurable' in itemDetail) || !itemDetail.isConfigurable) return;
    // @ts-ignore
    if (itemDetail.loginRequired && !user) {
      toast({ title: t('loginRequired'), description: t('loginToOrder'), variant: "destructive"});
      return;
    }
    if (itemDetail.optionGroups) {
      for (const group of itemDetail.optionGroups) {
        if (group.isRequired && (!selectedOptions[group.id] || (Array.isArray(selectedOptions[group.id]) && (selectedOptions[group.id] as string[]).length === 0))) {
          toast({ title: "Option requise", description: `Veuillez sélectionner une option pour "${group.name}".`, variant: "destructive" });
          return;
        }
      }
    }

    addToCart(itemDetail as MenuItem, selectedOptions, currentTotalPrice); 
    toast({ title: `${itemDetail.name} ${t('addToCart')} !`, description: t('orderSuccessDescription', { serviceName: itemDetail.name }) });
    router.push(`/client/${hostId}/${refId}`);
  };
  
  const handleSimpleItemAddToCart = () => {
    if (!itemDetail || ('isConfigurable' in itemDetail && itemDetail.isConfigurable) || ('formulaireId' in itemDetail && itemDetail.formulaireId) ) return;
    // @ts-ignore
     if (itemDetail.loginRequired && !user) {
      toast({ title: t('loginRequired'), description: t('loginToOrder'), variant: "destructive"});
      return;
    }
    addToCart(itemDetail as MenuItem | Service, undefined, currentTotalPrice); 
    toast({ title: `${'name' in itemDetail ? itemDetail.name : (itemDetail as Service).titre} ${t('addToCart')} !`, description: t('orderSuccessDescription', { serviceName: ('name' in itemDetail ? itemDetail.name : (itemDetail as Service).titre) }) });
    router.push(`/client/${hostId}/${refId}`);
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
        <h1 className="text-2xl font-semibold text-destructive mb-3">{t('errorAccessingReservation')}</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.back()} className="mt-4 w-full">{t('goBack')}</Button>
      </div>
    );
  }
  
  if (orderSuccess) {
    return (
      <div className="text-center py-16 bg-card p-8 rounded-xl shadow-xl max-w-md mx-auto">
        <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-3">{t('orderSuccessTitle')}</h1>
        <p className="text-lg text-muted-foreground mb-6">
          {t('orderSuccessDescription', { serviceName: itemDetail ? ('titre' in itemDetail ? itemDetail.titre : itemDetail.name) : 'service' })}
        </p>
        <Button onClick={() => router.push(`/client/${hostId}/${refId}`)} size="lg" className="bg-primary hover:bg-primary/90">
          {t('backToServices')}
        </Button>
      </div>
    );
  }

  if (!itemDetail || !hostInfo || !locationInfo) {
    return (
      <div className="text-center py-10 bg-card p-8 rounded-xl shadow-xl max-w-md mx-auto">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-6" />
        <h1 className="text-2xl font-semibold text-destructive mb-3">{t('serviceNotFound')}</h1>
        <p className="text-muted-foreground mb-6">{t('errorLoadingServiceDetails')}</p>
        <Button onClick={() => router.back()} className="mt-4 w-full">{t('goBack')}</Button>
      </div>
    );
  }

  const itemName = 'titre' in itemDetail ? itemDetail.titre : itemDetail.name;
  const itemDescription = itemDetail.description;
  const itemImage = 'image' in itemDetail ? itemDetail.image : itemDetail.imageUrl;
  const itemImageAiHint = 'data-ai-hint' in itemDetail ? itemDetail['data-ai-hint'] : ('imageAiHint' in itemDetail ? itemDetail.imageAiHint : undefined);
  const itemIsConfigurable = 'isConfigurable' in itemDetail ? itemDetail.isConfigurable : false;
  const optionGroups = 'optionGroups' in itemDetail ? itemDetail.optionGroups : [];
  // @ts-ignore
  const itemIsLoginRequired = itemDetail.loginRequired;
  const itemStock = 'stock' in itemDetail ? itemDetail.stock : undefined;
  const isItemOutOfStock = itemStock === 0;


  if (itemIsLoginRequired && !user) {
    return (
      <div className="text-center py-10 bg-card p-8 rounded-xl shadow-xl max-w-md mx-auto">
        <Lock className="mx-auto h-16 w-16 text-primary mb-6" />
        <h1 className="text-2xl font-semibold text-foreground mb-3">{t('loginRequired')}</h1>
        <p className="text-muted-foreground mb-6">
          {t('loginToOrder', { serviceName: itemName })}
        </p>
        <Link href={`/login?redirect_url=${encodeURIComponent(pathname)}`}>
          <Button size="lg" className="w-full bg-primary hover:bg-primary/90">
            <LogIn className="mr-2 h-5 w-5" />
            {t('loginToContinue')}
          </Button>
        </Link>
         <Button variant="outline" onClick={() => router.back()} className="mt-4 w-full">
          {t('goBack')}
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
              <Image src={itemImage} alt={itemName} layout="fill" objectFit="cover" data-ai-hint={itemImageAiHint || "item image"} priority/>
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

          <p className="text-3xl font-semibold text-primary mb-6">
            {itemIsConfigurable ? t('totalEstimatedPrice') : t('servicePrice')}: {(itemDetail?.currency || hostInfo?.currency || '$')}{currentTotalPrice.toFixed(2)}
          </p>

          {isItemOutOfStock && <Badge variant="destructive" className="text-md mb-4">{t('stockStatusOutOfStock')}</Badge>}

          {customForm && formFields.length > 0 && !itemIsConfigurable && (
            <>
              <DynamicFormRenderer
                ref={formRef}
                formName={t('additionalInformation')}
                formDescription={customForm.nom || "Please provide the following details:"}
                fields={formFields}
                onSubmit={handleServiceOrderWithFormSubmit}
              />
              <Button onClick={() => formRef.current?.submit()} disabled={isSubmitting || isItemOutOfStock} size="lg" className="mt-6 w-full max-w-xs mx-auto block bg-primary hover:bg-primary/90">
                {isSubmitting ? t('submitting') : t('orderFor', { price: `${(itemDetail?.currency || hostInfo?.currency || '$')}${currentTotalPrice.toFixed(2)}`})}
              </Button>
            </>
          )}

          {itemIsConfigurable && (
            <Button onClick={handleConfigurableItemAddToCart} disabled={isSubmitting || isItemOutOfStock} size="lg" className="w-full max-w-xs mx-auto block bg-primary hover:bg-primary/90">
              <ShoppingCart className="mr-2 h-5 w-5"/> {isSubmitting ? t('submitting') : t('addToCart')}
            </Button>
          )}
          
          {!customForm && !itemIsConfigurable && (
             <div className="text-center p-4 bg-secondary/50 rounded-lg mt-6">
              <p className="text-muted-foreground mb-4">Cet article sera ajouté directement au panier.</p>
              <Button onClick={handleSimpleItemAddToCart} disabled={isSubmitting || isItemOutOfStock} size="lg" className="w-full max-w-xs mx-auto bg-primary hover:bg-primary/90">
                <ShoppingCart className="mr-2 h-5 w-5"/> {isSubmitting ? t('submitting') : t('addToCart')}
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
      <Button variant="outline" onClick={() => router.back()} className="mt-8 w-full max-w-lg mx-auto block text-base py-3 h-auto">
        {t('cancelAndBackToServices')}
      </Button>
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

    