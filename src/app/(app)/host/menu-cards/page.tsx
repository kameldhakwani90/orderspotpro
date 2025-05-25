
// src/app/(app)/host/menu-cards/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  getMenuCards, addMenuCard, updateMenuCard, deleteMenuCard,
  getMenuCategories as fetchMenuCategoriesForCard,
  addMenuCategory, updateMenuCategory, deleteMenuCategory,
  getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem,
  getSites as getGlobalSitesForHost,
  duplicateMenuCard as duplicateMenuCardData
} from '@/lib/data';
import type { MenuCard, MenuCategory, MenuItem, Site as GlobalSiteType, MenuItemOptionGroup, MenuItemOption } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { PlusCircle, Edit2, Trash2, Utensils, ListPlus, Settings, ChevronRight, FolderOpen, ShoppingBasket, Package, CopyPlus, Clock, Box } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import NextImage from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';


export default function HostMenuCardsPage() {
  const { user, isLoading: authLoading, selectedGlobalSite } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [menuCards, setMenuCards] = useState<MenuCard[]>([]);
  const [hostGlobalSites, setHostGlobalSitesState] = useState<GlobalSiteType[]>([]);

  const [activeMenuCard, setActiveMenuCard] = useState<MenuCard | null>(null);
  const [categoriesForCard, setCategoriesForCard] = useState<MenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(null);
  const [itemsForCategory, setItemsForCategory] = useState<MenuItem[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states for MenuCard
  const [isMenuCardDialogOpen, setIsMenuCardDialogOpen] = useState(false);
  const [currentMenuCardData, setCurrentMenuCardData] = useState<Partial<MenuCard>>({ name: '', description: '', isActive: true, visibleFromTime: "00:00", visibleToTime: "23:59" });

  // Dialog states for MenuCategory
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [currentCategoryData, setCurrentCategoryData] = useState<Partial<MenuCategory>>({ name: '', description: '', displayOrder: 1 });

  // Dialog states for MenuItem
  const [isMenuItemDialogOpen, setIsMenuItemDialogOpen] = useState(false);
  const [currentMenuItemData, setCurrentMenuItemData] = useState<Partial<MenuItem>>({ name: '', description: '', price: 0, imageUrl: '', isAvailable: true, isConfigurable: false, optionGroups: [], stock: undefined });

  // States for Option Group Dialog
  const [isOptionGroupDialogOpen, setIsOptionGroupDialogOpen] = useState(false);
  const [editingOptionGroupIndex, setEditingOptionGroupIndex] = useState<number | null>(null); // null for add, index for edit
  const [currentOptionGroupData, setCurrentOptionGroupData] = useState<Partial<MenuItemOptionGroup>>({ name: '', selectionType: 'single', isRequired: false, options: [], displayOrder: 1 });

  // States for Option Dialog
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);
  const [editingOptionParentGroupIndex, setEditingOptionParentGroupIndex] = useState<number | null>(null); // Index of the group this option belongs to
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null); // null for add, index for edit within the group
  const [currentOptionData, setCurrentOptionData] = useState<Partial<MenuItemOption>>({ name: '', priceAdjustment: 0 });


  const fetchMenuCardsData = useCallback(async (hostId: string, globalSiteIdToFilter?: string) => {
    setIsLoadingData(true);
    try {
      const [cards, sites] = await Promise.all([
        getMenuCards(hostId, globalSiteIdToFilter),
        getGlobalSitesForHost(hostId)
      ]);
      setMenuCards(cards);
      setHostGlobalSitesState(sites);

      const defaultGlobalSiteForNewCard = selectedGlobalSite?.siteId || (sites.length > 0 ? sites[0].siteId : '');
      setCurrentMenuCardData(prev => ({ ...prev, globalSiteId: prev.globalSiteId || defaultGlobalSiteForNewCard }));


      if (activeMenuCard && globalSiteIdToFilter && activeMenuCard.globalSiteId !== globalSiteIdToFilter) {
        setActiveMenuCard(cards.length > 0 ? cards[0] : null);
      } else if (activeMenuCard) {
        const updatedActiveCard = cards.find(c => c.id === activeMenuCard.id);
        setActiveMenuCard(updatedActiveCard || (cards.length > 0 ? cards[0] : null));
      } else if (cards.length > 0) {
        setActiveMenuCard(cards[0]);
      } else {
        setActiveMenuCard(null);
      }

    } catch (error) {
      toast({ title: "Error loading menu cards", variant: "destructive", description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsLoadingData(false);
    }
  }, [toast, selectedGlobalSite, activeMenuCard]);

  useEffect(() => {
    if (user?.hostId) {
      fetchMenuCardsData(user.hostId, selectedGlobalSite?.siteId);
    } else if (!authLoading && (!user || !user.hostId)) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router, fetchMenuCardsData, selectedGlobalSite]);

  const fetchCategoriesAndItems = useCallback(async () => {
    if (!activeMenuCard || !user?.hostId) {
      setCategoriesForCard([]);
      setActiveCategory(null);
      setItemsForCategory([]);
      return;
    }
    setIsLoadingData(true);
    try {
      const categories = await fetchMenuCategoriesForCard(activeMenuCard.id, user.hostId);
      setCategoriesForCard(categories);
      if (categories.length > 0) {
        const currentActiveCat = activeCategory ? categories.find(c => c.id === activeCategory.id) : null;
        const catToLoadItemsFor = currentActiveCat || categories[0];
        setActiveCategory(catToLoadItemsFor);
        if (catToLoadItemsFor) {
          const items = await getMenuItems(catToLoadItemsFor.id, user.hostId);
          setItemsForCategory(items);
        } else {
          setItemsForCategory([]);
        }
      } else {
        setActiveCategory(null);
        setItemsForCategory([]);
      }
    } catch (error) {
      toast({ title: "Error loading categories/items", variant: "destructive", description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsLoadingData(false);
    }
  }, [activeMenuCard, user?.hostId, toast, activeCategory]);

  useEffect(() => {
    fetchCategoriesAndItems();
  }, [fetchCategoriesAndItems]);


  // --- Menu Card CRUD ---
  const openAddMenuCardDialog = () => {
    const defaultGlobalSite = selectedGlobalSite?.siteId || hostGlobalSites[0]?.siteId || '';
    if (hostGlobalSites.length === 0) {
      toast({title: "No Global Sites", description: "You must have at least one Global Site assigned to create a Menu Card.", variant: "destructive"});
      return;
    }
    setCurrentMenuCardData({ name: '', description: '', isActive: true, globalSiteId: defaultGlobalSite, visibleFromTime: "00:00", visibleToTime: "23:59" });
    setIsMenuCardDialogOpen(true);
  };
  const openEditMenuCardDialog = (card: MenuCard) => {
    setCurrentMenuCardData({ ...card, visibleFromTime: card.visibleFromTime || "00:00", visibleToTime: card.visibleToTime || "23:59"});
    setIsMenuCardDialogOpen(true);
  };
   const handleMenuCardSubmit = async () => {
    if (!user?.hostId || !currentMenuCardData.name?.trim() || !currentMenuCardData.globalSiteId) {
      toast({ title: "Name and Global Site are required for a menu card.", variant: "destructive" });
      return;
    }
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if ((currentMenuCardData.visibleFromTime && !timeRegex.test(currentMenuCardData.visibleFromTime)) ||
        (currentMenuCardData.visibleToTime && !timeRegex.test(currentMenuCardData.visibleToTime))) {
      toast({ title: "Invalid Time Format", description: "Please use HH:MM format for visibility times (e.g., 08:00, 22:30).", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<MenuCard> = {
        name: currentMenuCardData.name!,
        description: currentMenuCardData.description || undefined,
        isActive: currentMenuCardData.isActive !== undefined ? currentMenuCardData.isActive : true,
        globalSiteId: currentMenuCardData.globalSiteId!,
        hostId: user.hostId,
        visibleFromTime: currentMenuCardData.visibleFromTime || "00:00",
        visibleToTime: currentMenuCardData.visibleToTime || "23:59",
      };
      if (currentMenuCardData.id) {
        await updateMenuCard(currentMenuCardData.id, payload);
        toast({ title: "Menu Card Updated" });
      } else {
        await addMenuCard(payload as Omit<MenuCard, 'id'>);
        toast({ title: "Menu Card Created" });
      }
      fetchMenuCardsData(user.hostId, selectedGlobalSite?.siteId);
      setIsMenuCardDialogOpen(false);
    } catch (error) {
      toast({ title: "Error saving menu card", variant: "destructive", description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleMenuCardDelete = async (cardId: string) => {
    if (!user?.hostId || !window.confirm("Are you sure you want to delete this menu card and all its categories and items?")) return;
    setIsSubmitting(true);
    try {
      await deleteMenuCard(cardId);
      toast({ title: "Menu Card Deleted", variant: "destructive" });
      fetchMenuCardsData(user.hostId, selectedGlobalSite?.siteId);
      if (activeMenuCard?.id === cardId) setActiveMenuCard(null);
    } catch (error) {
      toast({ title: "Error deleting menu card", variant: "destructive", description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDuplicateMenuCard = async (cardId: string) => {
    if (!user?.hostId) return;
    setIsSubmitting(true);
    try {
      const duplicatedCard = await duplicateMenuCardData(cardId);
      if (duplicatedCard) {
        toast({ title: "Menu Card Duplicated", description: `"${duplicatedCard.name}" created.` });
        fetchMenuCardsData(user.hostId, selectedGlobalSite?.siteId);
      } else {
        toast({ title: "Duplication Failed", description: "Could not duplicate the menu card.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error duplicating menu card", variant: "destructive", description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Menu Category CRUD ---
  const openAddCategoryDialog = () => {
    if (!activeMenuCard) return;
    setCurrentCategoryData({ name: '', description: '', displayOrder: (categoriesForCard.length + 1) * 10 });
    setIsCategoryDialogOpen(true);
  };
  const openEditCategoryDialog = (category: MenuCategory) => {
    setCurrentCategoryData({ ...category });
    setIsCategoryDialogOpen(true);
  };
  const handleCategorySubmit = async () => {
    if (!user?.hostId || !activeMenuCard?.id || !currentCategoryData.name?.trim()) {
      toast({ title: "Category name is required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: currentCategoryData.name!,
        description: currentCategoryData.description || undefined,
        displayOrder: Number(currentCategoryData.displayOrder) || undefined,
        menuCardId: activeMenuCard.id,
        hostId: user.hostId,
      };
      if (currentCategoryData.id) {
        await updateMenuCategory(currentCategoryData.id, payload);
        toast({ title: "Category Updated" });
      } else {
        await addMenuCategory(payload as Omit<MenuCategory, 'id'>);
        toast({ title: "Category Created" });
      }
      fetchCategoriesAndItems();
      setIsCategoryDialogOpen(false);
    } catch (error) {
      toast({ title: "Error saving category", variant: "destructive", description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleCategoryDelete = async (categoryId: string) => {
     if (!window.confirm("Are you sure you want to delete this category and all its items?")) return;
    setIsSubmitting(true);
    try {
      await deleteMenuCategory(categoryId);
      toast({ title: "Category Deleted", variant: "destructive" });
      fetchCategoriesAndItems();
      if (activeCategory?.id === categoryId) setActiveCategory(null);
    } catch (error) {
      toast({ title: "Error deleting category", variant: "destructive", description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- MenuItem CRUD ---
  const openAddMenuItemDialog = () => {
    if (!activeCategory) return;
    setCurrentMenuItemData({ name: '', description: '', price: 0, imageUrl: '', isAvailable: true, isConfigurable: false, optionGroups: [], stock: undefined });
    setIsMenuItemDialogOpen(true);
  };
  const openEditMenuItemDialog = (item: MenuItem) => {
    setCurrentMenuItemData({ ...item, optionGroups: item.optionGroups || [], stock: item.stock });
    setIsMenuItemDialogOpen(true);
  };
  const handleMenuItemSubmit = async () => {
     if (!user?.hostId || !activeCategory?.id || !currentMenuItemData.name?.trim() || currentMenuItemData.price === undefined || currentMenuItemData.price < 0) {
      toast({ title: "Item name and a valid non-negative price are required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: Partial<Omit<MenuItem, 'id' | 'imageAiHint'>> = {
        name: currentMenuItemData.name!,
        description: currentMenuItemData.description || undefined,
        price: currentMenuItemData.price!,
        imageUrl: currentMenuItemData.imageUrl || undefined,
        menuCategoryId: activeCategory.id,
        hostId: user.hostId,
        isAvailable: currentMenuItemData.isAvailable !== undefined ? currentMenuItemData.isAvailable : true,
        isConfigurable: currentMenuItemData.isConfigurable !== undefined ? currentMenuItemData.isConfigurable : false,
        optionGroups: currentMenuItemData.isConfigurable ? (currentMenuItemData.optionGroups || []) : [],
        stock: currentMenuItemData.stock !== undefined ? (currentMenuItemData.stock >= 0 ? currentMenuItemData.stock : undefined) : undefined,
      };
      if (currentMenuItemData.id) {
        await updateMenuItem(currentMenuItemData.id, payload);
        toast({ title: "Menu Item Updated" });
      } else {
        await addMenuItem(payload as Omit<MenuItem, 'id' | 'imageAiHint'>);
        toast({ title: "Menu Item Created" });
      }
      fetchCategoriesAndItems();
      setIsMenuItemDialogOpen(false);
    } catch (error) {
      toast({ title: "Error saving menu item", variant: "destructive", description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleMenuItemDelete = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    setIsSubmitting(true);
    try {
      await deleteMenuItem(itemId);
      toast({ title: "Menu Item Deleted", variant: "destructive" });
      fetchCategoriesAndItems();
    } catch (error) {
      toast({ title: "Error deleting menu item", variant: "destructive", description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- MenuItemOptionGroup CRUD ---
  const openAddOptionGroupDialog = () => {
    setCurrentOptionGroupData({ name: '', selectionType: 'single', isRequired: false, options: [], displayOrder: (currentMenuItemData.optionGroups?.length || 0) + 1 });
    setEditingOptionGroupIndex(null);
    setIsOptionGroupDialogOpen(true);
  };

  const openEditOptionGroupDialog = (group: MenuItemOptionGroup, index: number) => {
    setCurrentOptionGroupData({ ...group });
    setEditingOptionGroupIndex(index);
    setIsOptionGroupDialogOpen(true);
  };

  const handleSaveOptionGroup = () => {
    if (!currentOptionGroupData.name?.trim()) {
      toast({ title: "Group name is required", variant: "destructive" });
      return;
    }
    const newGroups = [...(currentMenuItemData.optionGroups || [])];
    const newGroupEntry: MenuItemOptionGroup = {
      id: currentOptionGroupData.id || `og-${Date.now()}`,
      menuItemId: currentMenuItemData.id || "temp-item-id", // Will be set properly if new item
      name: currentOptionGroupData.name,
      selectionType: currentOptionGroupData.selectionType || 'single',
      isRequired: !!currentOptionGroupData.isRequired,
      options: currentOptionGroupData.options || [],
      displayOrder: Number(currentOptionGroupData.displayOrder) || newGroups.length + 1,
    };

    if (editingOptionGroupIndex !== null) {
      newGroups[editingOptionGroupIndex] = newGroupEntry;
    } else {
      newGroups.push(newGroupEntry);
    }
    setCurrentMenuItemData(prev => ({ ...prev, optionGroups: newGroups.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)) }));
    setIsOptionGroupDialogOpen(false);
  };

  const handleDeleteOptionGroup = (index: number) => {
    if (!window.confirm("Delete this option group and all its options?")) return;
    const newGroups = [...(currentMenuItemData.optionGroups || [])];
    newGroups.splice(index, 1);
    setCurrentMenuItemData(prev => ({ ...prev, optionGroups: newGroups }));
  };


  // --- MenuItemOption CRUD ---
  const openAddOptionDialog = (groupIndex: number) => {
    setCurrentOptionData({ name: '', priceAdjustment: 0 });
    setEditingOptionParentGroupIndex(groupIndex);
    setEditingOptionIndex(null);
    setIsOptionDialogOpen(true);
  };

  const openEditOptionDialog = (option: MenuItemOption, groupIndex: number, optionIndex: number) => {
    setCurrentOptionData({ ...option });
    setEditingOptionParentGroupIndex(groupIndex);
    setEditingOptionIndex(optionIndex);
    setIsOptionDialogOpen(true);
  };

  const handleSaveOption = () => {
    if (editingOptionParentGroupIndex === null || !currentOptionData.name?.trim()) {
      toast({ title: "Option name is required", variant: "destructive" });
      return;
    }
    const newGroups = [...(currentMenuItemData.optionGroups || [])];
    const targetGroup = newGroups[editingOptionParentGroupIndex];
    if (!targetGroup) return;

    const newOptions = [...(targetGroup.options || [])];
    const newOptionEntry: MenuItemOption = {
      id: currentOptionData.id || `opt-${Date.now()}`,
      name: currentOptionData.name,
      priceAdjustment: Number(currentOptionData.priceAdjustment) || 0,
    };

    if (editingOptionIndex !== null) {
      newOptions[editingOptionIndex] = newOptionEntry;
    } else {
      newOptions.push(newOptionEntry);
    }
    targetGroup.options = newOptions;
    setCurrentMenuItemData(prev => ({ ...prev, optionGroups: newGroups }));
    setIsOptionDialogOpen(false);
  };

  const handleDeleteOption = (groupIndex: number, optionIndex: number) => {
    if (!window.confirm("Delete this option?")) return;
    const newGroups = [...(currentMenuItemData.optionGroups || [])];
    const targetGroup = newGroups[groupIndex];
    if (!targetGroup || !targetGroup.options) return;

    targetGroup.options.splice(optionIndex, 1);
    setCurrentMenuItemData(prev => ({ ...prev, optionGroups: newGroups }));
  };


  if (authLoading || isLoadingData && menuCards.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-center"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-10 w-36" /></div>
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="md:col-span-1 h-96" />
          <Skeleton className="md:col-span-2 h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Menu Cards Management</h1>
          <p className="text-lg text-muted-foreground">Create and manage your food and beverage menus.</p>
        </div>
        <Button onClick={openAddMenuCardDialog} disabled={isSubmitting || hostGlobalSites.length === 0}>
          <PlusCircle className="mr-2 h-5 w-5" /> Create New Menu Card
        </Button>
      </div>

      {hostGlobalSites.length === 0 && !isLoadingData && (
        <Card className="mb-6 bg-destructive/10 border-destructive/30"><CardHeader><CardTitle className="text-destructive">No Global Sites</CardTitle></CardHeader><CardContent><p className="text-destructive-foreground">You must have at least one Global Site assigned by an admin to create Menu Cards. Please contact an administrator.</p></CardContent></Card>
      )}


      <div className="grid md:grid-cols-12 gap-6 items-start">
        <Card className="md:col-span-4 shadow-lg sticky top-20">
          <CardHeader>
            <CardTitle>My Menu Cards</CardTitle>
            <CardDescription>Select a card to manage its content. ({menuCards.length})</CardDescription>
          </CardHeader>
          <CardContent>
            {menuCards.length === 0 && !isLoadingData && <p className="text-muted-foreground text-center py-4">No menu cards created yet for {selectedGlobalSite ? selectedGlobalSite.nom : 'any site'}.</p>}
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <ul className="space-y-2">
                {menuCards.map(card => (
                  <li key={card.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label={`Select menu card ${card.name}`}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveMenuCard(card);}}
                      className={`w-full justify-between text-left h-auto py-2.5 px-3 rounded-lg transition-colors flex items-center
                        ${activeMenuCard?.id === card.id ? "bg-primary/20 text-primary font-semibold" : "hover:bg-muted/50"}
                        ${isSubmitting ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                      onClick={() => { if(!isSubmitting) setActiveMenuCard(card); }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{card.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{hostGlobalSites.find(gs => gs.siteId === card.globalSiteId)?.nom || 'Unknown Site'}</p>
                         <div className="flex items-center gap-2 mt-1">
                            <Badge variant={card.isActive ? "default" : "outline"} className="text-xs">{card.isActive ? "Active" : "Inactive"}</Badge>
                            {(card.visibleFromTime || card.visibleToTime) &&
                                <Badge variant="outline" className="text-xs flex items-center gap-1"><Clock className="h-3 w-3"/> {card.visibleFromTime || "Any"} - {card.visibleToTime || "Any"}</Badge>
                            }
                         </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDuplicateMenuCard(card.id);}} title="Duplicate Menu Card" disabled={isSubmitting}><CopyPlus className="h-4 w-4 text-blue-500" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEditMenuCardDialog(card);}} title="Edit Menu Card" disabled={isSubmitting}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleMenuCardDelete(card.id);}} title="Delete Menu Card" disabled={isSubmitting}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="md:col-span-8 space-y-6">
          {!activeMenuCard && !isLoadingData && (
            <Card className="shadow-lg h-full flex flex-col items-center justify-center py-10">
              <CardContent className="text-center">
                <Utensils className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">Select a Menu Card from the list to view or add categories and items.</p>
              </CardContent>
            </Card>
          )}
          {activeMenuCard && (
            <>
              <Card className="shadow-lg">
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center"><ListPlus className="mr-2 h-5 w-5 text-primary"/> Categories for: {activeMenuCard.name}</CardTitle>
                    <CardDescription>Manage categories within this menu card.</CardDescription>
                  </div>
                  <Button onClick={openAddCategoryDialog} disabled={isSubmitting}><PlusCircle className="mr-2 h-4 w-4"/> Add Category</Button>
                </CardHeader>
                <CardContent>
                  {categoriesForCard.length === 0 && <p className="text-muted-foreground text-center py-4">No categories yet for this menu card.</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoriesForCard.map(cat => (
                      <div
                        key={cat.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Select category ${cat.name}`}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveCategory(cat);}}
                        className={`w-full justify-between text-left h-auto py-2 px-3 rounded-lg border transition-colors flex items-center group
                          ${activeCategory?.id === cat.id ? "bg-primary text-primary-foreground font-medium shadow-md" : "bg-card hover:bg-muted/60"}
                          ${isSubmitting ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                        onClick={() => { if(!isSubmitting) setActiveCategory(cat);}}
                      >
                        <span className="font-medium text-sm truncate flex-1">{cat.name}</span>
                        <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex gap-0.5">
                          <Button variant="ghost" size="icon" className={`h-6 w-6 ${activeCategory?.id === cat.id ? "text-primary-foreground hover:bg-primary/80" : "text-foreground hover:bg-accent" }`} onClick={(e) => { e.stopPropagation(); openEditCategoryDialog(cat);}} title="Edit Category" disabled={isSubmitting}><Edit2 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className={`h-6 w-6 ${activeCategory?.id === cat.id ? "text-primary-foreground hover:bg-primary/80" : "text-destructive hover:bg-destructive/10" }`} onClick={(e) => { e.stopPropagation(); handleCategoryDelete(cat.id);}} title="Delete Category" disabled={isSubmitting}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {activeCategory && (
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center"><Package className="mr-2 h-5 w-5 text-primary"/> Items in: {activeCategory.name}</CardTitle>
                      <CardDescription>Add or modify items for this category.</CardDescription>
                    </div>
                    <Button onClick={openAddMenuItemDialog} disabled={isSubmitting}><PlusCircle className="mr-2 h-4 w-4"/> Add Item</Button>
                  </CardHeader>
                  <CardContent>
                    {itemsForCategory.length === 0 && <p className="text-muted-foreground text-center py-4">No items yet in this category.</p>}
                    <Table>
                      <TableHeader><TableRow><TableHead className="w-16">Img</TableHead><TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {itemsForCategory.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <NextImage src={item.imageUrl || 'https://placehold.co/50x50.png'} alt={item.name} width={40} height={40} className="rounded object-cover aspect-square" data-ai-hint={item.imageAiHint || 'menu item'}/>
                            </TableCell>
                            <TableCell className="font-medium">{item.name} {item.isConfigurable && <Badge variant="outline" className="ml-1 text-xs">Configurable</Badge>}</TableCell>
                            <TableCell>${item.price.toFixed(2)}</TableCell>
                            <TableCell>
                              {item.stock === 0 ? <Badge variant="destructive" className="text-xs">Rupture</Badge> :
                               !item.isAvailable ? <Badge variant="secondary" className="text-xs">Caché</Badge> :
                               item.stock !== undefined && item.stock > 0 && item.stock < 5 ? <Badge variant="outline" className="text-xs text-amber-600 border-amber-400">Stock Faible ({item.stock})</Badge> :
                               <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">Actif</Badge>
                              }
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditMenuItemDialog(item)} title="Edit Item" disabled={isSubmitting}><Edit2 className="h-4 w-4" /></Button>
                              <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleMenuItemDelete(item.id)} title="Delete Item" disabled={isSubmitting}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
               {!activeCategory && activeMenuCard && categoriesForCard.length > 0 &&(
                 <Card className="shadow-lg"><CardContent className="text-center text-muted-foreground py-6">Select a category above to view or add menu items.</CardContent></Card>
               )}
            </>
          )}
        </div>
      </div>

      {/* Menu Card Dialog */}
      <Dialog open={isMenuCardDialogOpen} onOpenChange={(open) => {if(!isSubmitting) setIsMenuCardDialogOpen(open)}}>
        <DialogContent>
          <DialogHeader><DialogTitle>{currentMenuCardData.id ? 'Edit Menu Card' : 'Create New Menu Card'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="menuCardName">Name*</Label>
              <Input id="menuCardName" value={currentMenuCardData.name || ''} onChange={(e) => setCurrentMenuCardData(p => ({...p, name: e.target.value}))} disabled={isSubmitting}/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="menuCardDescription">Description</Label>
              <Textarea id="menuCardDescription" value={currentMenuCardData.description || ''} onChange={(e) => setCurrentMenuCardData(p => ({...p, description: e.target.value}))} disabled={isSubmitting}/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="menuCardGlobalSite">For Global Site*</Label>
              <Select
                value={currentMenuCardData.globalSiteId || ''}
                onValueChange={(val) => setCurrentMenuCardData(p => ({...p, globalSiteId: val}))}
                disabled={isSubmitting || hostGlobalSites.length === 0 || !!currentMenuCardData.id}
              >
                <SelectTrigger id="menuCardGlobalSite"><SelectValue placeholder="Select a Global Site" /></SelectTrigger>
                <SelectContent>
                  {hostGlobalSites.map(site => <SelectItem key={site.siteId} value={site.siteId}>{site.nom}</SelectItem>)}
                  {hostGlobalSites.length === 0 && <SelectItem value="" disabled>No Global Sites available</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="visibleFromTime">Visible From (HH:MM)</Label>
                <Input id="visibleFromTime" type="time" value={currentMenuCardData.visibleFromTime || "00:00"} onChange={(e) => setCurrentMenuCardData(p => ({...p, visibleFromTime: e.target.value}))} disabled={isSubmitting}/>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="visibleToTime">Visible To (HH:MM)</Label>
                <Input id="visibleToTime" type="time" value={currentMenuCardData.visibleToTime || "23:59"} onChange={(e) => setCurrentMenuCardData(p => ({...p, visibleToTime: e.target.value}))} disabled={isSubmitting}/>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="menuCardIsActive" checked={!!currentMenuCardData.isActive} onCheckedChange={(val) => setCurrentMenuCardData(p => ({...p, isActive: val}))} disabled={isSubmitting}/>
              <Label htmlFor="menuCardIsActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMenuCardDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleMenuCardSubmit} disabled={isSubmitting || !currentMenuCardData.name?.trim() || !currentMenuCardData.globalSiteId}>Save Menu Card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Menu Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {if(!isSubmitting) setIsCategoryDialogOpen(open)}}>
        <DialogContent>
          <DialogHeader><DialogTitle>{currentCategoryData.id ? 'Edit Category' : 'Add New Category'}</DialogTitle><DialogDescription>For menu card: {activeMenuCard?.name}</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5"><Label htmlFor="catName">Name*</Label><Input id="catName" value={currentCategoryData.name || ''} onChange={(e) => setCurrentCategoryData(p => ({...p, name: e.target.value}))} disabled={isSubmitting}/></div>
            <div className="space-y-1.5"><Label htmlFor="catDesc">Description</Label><Textarea id="catDesc" value={currentCategoryData.description || ''} onChange={(e) => setCurrentCategoryData(p => ({...p, description: e.target.value}))} disabled={isSubmitting}/></div>
            <div className="space-y-1.5"><Label htmlFor="catOrder">Display Order</Label><Input id="catOrder" type="number" value={currentCategoryData.displayOrder || ''} onChange={(e) => setCurrentCategoryData(p => ({...p, displayOrder: Number(e.target.value)}))} disabled={isSubmitting}/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleCategorySubmit} disabled={isSubmitting || !currentCategoryData.name?.trim()}>Save Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MenuItem Dialog */}
      <Dialog open={isMenuItemDialogOpen} onOpenChange={(open) => {if(!isSubmitting) setIsMenuItemDialogOpen(open)}}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{currentMenuItemData.id ? 'Edit Menu Item' : 'Add New Item'}</DialogTitle><DialogDescription>To category: {activeCategory?.name} (in {activeMenuCard?.name})</DialogDescription></DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-2">
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5"><Label htmlFor="itemName">Name*</Label><Input id="itemName" value={currentMenuItemData.name || ''} onChange={(e) => setCurrentMenuItemData(p => ({...p, name: e.target.value}))} disabled={isSubmitting}/></div>
              <div className="space-y-1.5"><Label htmlFor="itemDesc">Description</Label><Textarea id="itemDesc" value={currentMenuItemData.description || ''} onChange={(e) => setCurrentMenuItemData(p => ({...p, description: e.target.value}))} disabled={isSubmitting}/></div>
              <div className="space-y-1.5"><Label htmlFor="itemPrice">{currentMenuItemData.isConfigurable ? 'Base Price*' : 'Price*'}</Label><Input id="itemPrice" type="number" value={currentMenuItemData.price === undefined ? '' : currentMenuItemData.price} onChange={(e) => setCurrentMenuItemData(p => ({...p, price: parseFloat(e.target.value) || 0}))} step="0.01" min="0" disabled={isSubmitting}/></div>
              <div className="space-y-1.5"><Label htmlFor="itemImg">Image URL</Label><Input id="itemImg" value={currentMenuItemData.imageUrl || ''} onChange={(e) => setCurrentMenuItemData(p => ({...p, imageUrl: e.target.value}))} placeholder="https://placehold.co/300x200.png" disabled={isSubmitting}/></div>
              <div className="space-y-1.5"><Label htmlFor="itemStock"><Box className="inline mr-1 h-4 w-4"/>Stock (Leave empty for unlimited)</Label><Input id="itemStock" type="number" value={currentMenuItemData.stock === undefined ? '' : currentMenuItemData.stock} onChange={(e) => setCurrentMenuItemData(p => ({...p, stock: e.target.value === '' ? undefined : parseInt(e.target.value, 10)}))} placeholder="e.g., 50" min="0" disabled={isSubmitting}/></div>
              <div className="flex items-center space-x-2">
                  <Checkbox id="itemIsAvailable" checked={!!currentMenuItemData.isAvailable} onCheckedChange={(checked) => setCurrentMenuItemData(p => ({...p, isAvailable: !!checked}))} disabled={isSubmitting}/>
                  <Label htmlFor="itemIsAvailable">Available for Sale</Label>
              </div>
              <div className="flex items-center space-x-2">
                  <Checkbox id="itemIsConfigurable" checked={!!currentMenuItemData.isConfigurable} onCheckedChange={(checked) => setCurrentMenuItemData(p => ({...p, isConfigurable: !!checked}))} disabled={isSubmitting}/>
                  <Label htmlFor="itemIsConfigurable">Product is Configurable</Label>
              </div>

              {currentMenuItemData.isConfigurable && (
                <div className="mt-4 p-4 border rounded-md bg-muted/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-semibold">Option Groups</h4>
                    <Button size="sm" variant="outline" onClick={openAddOptionGroupDialog} disabled={isSubmitting}><PlusCircle className="mr-2 h-4 w-4"/>Add Group</Button>
                  </div>
                  {(currentMenuItemData.optionGroups || []).length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No option groups defined yet.</p>}
                  <div className="space-y-3">
                    {(currentMenuItemData.optionGroups || []).map((group, groupIndex) => (
                      <Card key={group.id || groupIndex} className="bg-card">
                        <CardHeader className="p-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-sm">{group.name}</CardTitle>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditOptionGroupDialog(group, groupIndex)} disabled={isSubmitting}><Edit2 className="h-3.5 w-3.5"/></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteOptionGroup(groupIndex)} disabled={isSubmitting}><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button>
                            </div>
                          </div>
                           <CardDescription className="text-xs">Type: {group.selectionType} - Required: {group.isRequired ? 'Yes' : 'No'} - Order: {group.displayOrder}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <h5 className="text-xs font-medium mb-1 text-muted-foreground">Options:</h5>
                          {(group.options || []).length === 0 && <p className="text-xs text-muted-foreground text-center py-1">No options in this group.</p>}
                          <ul className="space-y-1">
                            {(group.options || []).map((option, optionIndex) => (
                              <li key={option.id || optionIndex} className="flex justify-between items-center text-xs p-1.5 bg-background rounded">
                                <span>{option.name} (Adj: ${option.priceAdjustment?.toFixed(2) || '0.00'})</span>
                                <div className="flex gap-0.5">
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditOptionDialog(option, groupIndex, optionIndex)} disabled={isSubmitting}><Edit2 className="h-3 w-3"/></Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteOption(groupIndex, optionIndex)} disabled={isSubmitting}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                                </div>
                              </li>
                            ))}
                          </ul>
                          <Button size="xs" variant="outline" className="mt-2 w-full" onClick={() => openAddOptionDialog(groupIndex)} disabled={isSubmitting}><PlusCircle className="mr-1.5 h-3.5 w-3.5"/>Add Option to this Group</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
            <Button onClick={handleMenuItemSubmit} disabled={isSubmitting || !currentMenuItemData.name?.trim() || currentMenuItemData.price === undefined || currentMenuItemData.price < 0}>Save Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Option Group Dialog */}
      <Dialog open={isOptionGroupDialogOpen} onOpenChange={setIsOptionGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOptionGroupIndex !== null ? 'Edit Option Group' : 'Add New Option Group'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5"><Label htmlFor="groupName">Group Name*</Label><Input id="groupName" value={currentOptionGroupData.name || ''} onChange={e => setCurrentOptionGroupData(p => ({...p, name: e.target.value}))} /></div>
            <div className="space-y-1.5">
              <Label htmlFor="groupSelectionType">Selection Type*</Label>
              <Select value={currentOptionGroupData.selectionType || 'single'} onValueChange={val => setCurrentOptionGroupData(p => ({...p, selectionType: val as 'single' | 'multiple'}))}>
                <SelectTrigger id="groupSelectionType"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="single">Single Choice (Radio)</SelectItem><SelectItem value="multiple">Multiple Choice (Checkbox)</SelectItem></SelectContent>
              </Select>
            </div>
             <div className="space-y-1.5"><Label htmlFor="groupDisplayOrder">Display Order</Label><Input id="groupDisplayOrder" type="number" value={currentOptionGroupData.displayOrder || ''} onChange={e => setCurrentOptionGroupData(p => ({...p, displayOrder: Number(e.target.value)}))} /></div>
            <div className="flex items-center space-x-2"><Checkbox id="groupIsRequired" checked={!!currentOptionGroupData.isRequired} onCheckedChange={val => setCurrentOptionGroupData(p => ({...p, isRequired: !!val}))} /><Label htmlFor="groupIsRequired">Required selection from this group</Label></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSaveOptionGroup}>Save Option Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Option Dialog */}
      <Dialog open={isOptionDialogOpen} onOpenChange={setIsOptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOptionIndex !== null ? 'Edit Option' : 'Add New Option'}</DialogTitle>
            <DialogDescription>To group: {currentMenuItemData.optionGroups && editingOptionParentGroupIndex !== null ? currentMenuItemData.optionGroups[editingOptionParentGroupIndex]?.name : ''}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5"><Label htmlFor="optionName">Option Name*</Label><Input id="optionName" value={currentOptionData.name || ''} onChange={e => setCurrentOptionData(p => ({...p, name: e.target.value}))} /></div>
            <div className="space-y-1.5"><Label htmlFor="optionPriceAdj">Price Adjustment (e.g., 1.50 or -0.50)</Label><Input id="optionPriceAdj" type="number" value={currentOptionData.priceAdjustment === undefined ? '' : currentOptionData.priceAdjustment} onChange={e => setCurrentOptionData(p => ({...p, priceAdjustment: parseFloat(e.target.value) || 0}))} step="0.01" /></div>
          </div>
          <DialogFooter>
             <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSaveOption}>Save Option</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

    
