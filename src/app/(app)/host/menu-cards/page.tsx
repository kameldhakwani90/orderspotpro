// src/app/(app)/host/menu-cards/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  getMenuCards, addMenuCard, updateMenuCard, deleteMenuCard,
  getMenuCategories, addMenuCategory, updateMenuCategory, deleteMenuCategory,
  getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, getSites
} from '@/lib/data';
import type { MenuCard, MenuCategory, MenuItem, Site as GlobalSiteType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { PlusCircle, Edit2, Trash2, Utensils, ListPlus, Settings, ChevronRight, FolderOpen, ShoppingBasket, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import NextImage from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function HostMenuCardsPage() {
  const { user, isLoading: authLoading, selectedGlobalSite } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [menuCards, setMenuCards] = useState<MenuCard[]>([]);
  const [hostGlobalSites, setHostGlobalSites] = useState<GlobalSiteType[]>([]);
  
  const [activeMenuCard, setActiveMenuCard] = useState<MenuCard | null>(null);
  const [categoriesForCard, setCategoriesForCard] = useState<MenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(null);
  const [itemsForCategory, setItemsForCategory] = useState<MenuItem[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states
  const [isMenuCardDialogOpen, setIsMenuCardDialogOpen] = useState(false);
  const [currentMenuCardData, setCurrentMenuCardData] = useState<Partial<MenuCard>>({ name: '', description: '', isActive: true });
  
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [currentCategoryData, setCurrentCategoryData] = useState<Partial<MenuCategory>>({ name: '', description: '', displayOrder: 1 });

  const [isMenuItemDialogOpen, setIsMenuItemDialogOpen] = useState(false);
  const [currentMenuItemData, setCurrentMenuItemData] = useState<Partial<MenuItem>>({ name: '', description: '', price: 0, imageUrl: '' });

  const fetchMenuCardsData = useCallback(async (hostId: string, globalSiteId?: string) => {
    setIsLoadingData(true);
    try {
      const [cards, sites] = await Promise.all([
        getMenuCards(hostId, globalSiteId),
        getSites(hostId) // Fetch all global sites managed by host
      ]);
      setMenuCards(cards);
      setHostGlobalSites(sites);

      if (sites.length > 0 && !currentMenuCardData.globalSiteId && !selectedGlobalSite) {
         setCurrentMenuCardData(prev => ({ ...prev, globalSiteId: sites[0].siteId }));
      } else if (selectedGlobalSite && !currentMenuCardData.globalSiteId) {
         setCurrentMenuCardData(prev => ({ ...prev, globalSiteId: selectedGlobalSite.siteId }));
      }

      // If a card was active, try to keep it or its equivalent active
      if (activeMenuCard) {
        const updatedActiveCard = cards.find(c => c.id === activeMenuCard.id);
        if (updatedActiveCard) {
          setActiveMenuCard(updatedActiveCard);
        } else {
          setActiveMenuCard(cards.length > 0 ? cards[0] : null);
        }
      } else if (cards.length > 0) {
        setActiveMenuCard(cards[0]);
      } else {
        setActiveMenuCard(null);
      }

    } catch (error) {
      toast({ title: "Error loading menu cards", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [toast, activeMenuCard, currentMenuCardData.globalSiteId, selectedGlobalSite]);

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
    setIsLoadingData(true); // Or a more specific loading state
    try {
      const categories = await getMenuCategories(activeMenuCard.id, user.hostId);
      setCategoriesForCard(categories);
      if (categories.length > 0) {
        // Try to keep active category or default to first
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
      toast({ title: "Error loading categories/items", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [activeMenuCard, user?.hostId, toast, activeCategory]);

  useEffect(() => {
    fetchCategoriesAndItems();
  }, [fetchCategoriesAndItems]);


  // --- Menu Card CRUD ---
  const openAddMenuCardDialog = () => {
    setCurrentMenuCardData({ name: '', description: '', isActive: true, globalSiteId: selectedGlobalSite?.siteId || hostGlobalSites[0]?.siteId || '' });
    setIsMenuCardDialogOpen(true);
  };
  const openEditMenuCardDialog = (card: MenuCard) => {
    setCurrentMenuCardData({ ...card });
    setIsMenuCardDialogOpen(true);
  };
  const handleMenuCardSubmit = async () => {
    if (!user?.hostId || !currentMenuCardData.name?.trim() || !currentMenuCardData.globalSiteId) {
      toast({ title: "Name and Global Site are required for a menu card.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: currentMenuCardData.name!,
        description: currentMenuCardData.description || undefined,
        isActive: currentMenuCardData.isActive !== undefined ? currentMenuCardData.isActive : true,
        globalSiteId: currentMenuCardData.globalSiteId!,
        hostId: user.hostId,
      };
      if (currentMenuCardData.id) { // Editing
        await updateMenuCard(currentMenuCardData.id, payload);
        toast({ title: "Menu Card Updated" });
      } else { // Adding
        await addMenuCard(payload as Omit<MenuCard, 'id'>);
        toast({ title: "Menu Card Created" });
      }
      fetchMenuCardsData(user.hostId, selectedGlobalSite?.siteId);
      setIsMenuCardDialogOpen(false);
    } catch (error) {
      toast({ title: "Error saving menu card", variant: "destructive" });
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
      toast({ title: "Error deleting menu card", variant: "destructive" });
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
      if (currentCategoryData.id) { // Editing
        await updateMenuCategory(currentCategoryData.id, payload);
        toast({ title: "Category Updated" });
      } else { // Adding
        await addMenuCategory(payload as Omit<MenuCategory, 'id'>);
        toast({ title: "Category Created" });
      }
      fetchCategoriesAndItems();
      setIsCategoryDialogOpen(false);
    } catch (error) {
      toast({ title: "Error saving category", variant: "destructive" });
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
      toast({ title: "Error deleting category", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Menu Item CRUD ---
  const openAddMenuItemDialog = () => {
    if (!activeCategory) return;
    setCurrentMenuItemData({ name: '', description: '', price: 0, imageUrl: '' });
    setIsMenuItemDialogOpen(true);
  };
  const openEditMenuItemDialog = (item: MenuItem) => {
    setCurrentMenuItemData({ ...item });
    setIsMenuItemDialogOpen(true);
  };
  const handleMenuItemSubmit = async () => {
     if (!user?.hostId || !activeCategory?.id || !currentMenuItemData.name?.trim() || currentMenuItemData.price === undefined || currentMenuItemData.price < 0) {
      toast({ title: "Item name and a valid non-negative price are required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: currentMenuItemData.name!,
        description: currentMenuItemData.description || undefined,
        price: currentMenuItemData.price!,
        imageUrl: currentMenuItemData.imageUrl || undefined,
        menuCategoryId: activeCategory.id,
        hostId: user.hostId,
      };
      if (currentMenuItemData.id) { // Editing
        await updateMenuItem(currentMenuItemData.id, payload);
        toast({ title: "Menu Item Updated" });
      } else { // Adding
        await addMenuItem(payload as Omit<MenuItem, 'id' | 'imageAiHint'>);
        toast({ title: "Menu Item Created" });
      }
      fetchCategoriesAndItems(); // This should re-fetch items for the active category
      setIsMenuItemDialogOpen(false);
    } catch (error) {
      toast({ title: "Error saving menu item", variant: "destructive" });
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
      toast({ title: "Error deleting menu item", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (authLoading || isLoadingData && menuCards.length === 0) { // Show skeleton if initial data is loading heavily
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-center"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-10 w-36" /></div>
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="md:col-span-1 h-96" /> {/* For Menu Cards List */}
          <Skeleton className="md:col-span-2 h-96" /> {/* For Categories/Items View */}
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
        {/* Column 1: Menu Cards List */}
        <Card className="md:col-span-4 shadow-lg sticky top-20">
          <CardHeader>
            <CardTitle>My Menu Cards</CardTitle>
            <CardDescription>Select a card to manage its content.</CardDescription>
          </CardHeader>
          <CardContent>
            {menuCards.length === 0 && !isLoadingData && <p className="text-muted-foreground text-center py-4">No menu cards created yet for {selectedGlobalSite ? selectedGlobalSite.nom : 'any site'}.</p>}
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <ul className="space-y-2">
                {menuCards.map(card => (
                  <li key={card.id}>
                    <Button
                      variant={activeMenuCard?.id === card.id ? "secondary" : "ghost"}
                      className="w-full justify-between text-left h-auto py-2.5 px-3"
                      onClick={() => setActiveMenuCard(card)}
                      disabled={isSubmitting}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{card.name}</p>
                        <p className="text-xs text-muted-foreground">{hostGlobalSites.find(gs => gs.siteId === card.globalSiteId)?.nom || 'Unknown Site'}</p>
                         <Badge variant={card.isActive ? "default" : "outline"} className="mt-1 text-xs">{card.isActive ? "Active" : "Inactive"}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEditMenuCardDialog(card);}} title="Edit Menu Card"><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleMenuCardDelete(card.id);}} title="Delete Menu Card"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Column 2: Categories and Items for selected Menu Card */}
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
              {/* Categories Section */}
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
                      <Button
                        key={cat.id}
                        variant={activeCategory?.id === cat.id ? "default" : "outline"}
                        className="w-full justify-between text-left h-auto py-2 px-3 items-center group"
                        onClick={() => setActiveCategory(cat)}
                        disabled={isSubmitting}
                      >
                        <span className="font-medium text-sm truncate flex-1">{cat.name}</span>
                        <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openEditCategoryDialog(cat);}} title="Edit Category"><Edit2 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleCategoryDelete(cat.id);}} title="Delete Category"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Menu Items Section */}
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
                      <TableHeader><TableRow><TableHead className="w-16">Img</TableHead><TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {itemsForCategory.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <NextImage src={item.imageUrl || 'https://placehold.co/50x50.png'} alt={item.name} width={40} height={40} className="rounded object-cover aspect-square" data-ai-hint={item.imageAiHint || 'menu item'}/>
                            </TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>${item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditMenuItemDialog(item)} title="Edit Item"><Edit2 className="h-4 w-4" /></Button>
                              <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleMenuItemDelete(item.id)} title="Delete Item"><Trash2 className="h-4 w-4" /></Button>
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

      {/* Dialog for Menu Card */}
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
                disabled={isSubmitting || hostGlobalSites.length === 0 || !!currentMenuCardData.id /* Cannot change site if editing */}
              >
                <SelectTrigger id="menuCardGlobalSite"><SelectValue placeholder="Select a Global Site" /></SelectTrigger>
                <SelectContent>
                  {hostGlobalSites.map(site => <SelectItem key={site.siteId} value={site.siteId}>{site.nom}</SelectItem>)}
                  {hostGlobalSites.length === 0 && <SelectItem value="" disabled>No Global Sites available</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="menuCardIsActive" checked={currentMenuCardData.isActive} onCheckedChange={(val) => setCurrentMenuCardData(p => ({...p, isActive: val}))} disabled={isSubmitting}/>
              <Label htmlFor="menuCardIsActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMenuCardDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleMenuCardSubmit} disabled={isSubmitting || !currentMenuCardData.name?.trim() || !currentMenuCardData.globalSiteId}>Save Menu Card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Menu Category */}
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

      {/* Dialog for Menu Item */}
      <Dialog open={isMenuItemDialogOpen} onOpenChange={(open) => {if(!isSubmitting) setIsMenuItemDialogOpen(open)}}>
        <DialogContent>
          <DialogHeader><DialogTitle>{currentMenuItemData.id ? 'Edit Menu Item' : 'Add New Item'}</DialogTitle><DialogDescription>To category: {activeCategory?.name} (in {activeMenuCard?.name})</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-1.5"><Label htmlFor="itemName">Name*</Label><Input id="itemName" value={currentMenuItemData.name || ''} onChange={(e) => setCurrentMenuItemData(p => ({...p, name: e.target.value}))} disabled={isSubmitting}/></div>
            <div className="space-y-1.5"><Label htmlFor="itemDesc">Description</Label><Textarea id="itemDesc" value={currentMenuItemData.description || ''} onChange={(e) => setCurrentMenuItemData(p => ({...p, description: e.target.value}))} disabled={isSubmitting}/></div>
            <div className="space-y-1.5"><Label htmlFor="itemPrice">Price*</Label><Input id="itemPrice" type="number" value={currentMenuItemData.price === undefined ? '' : currentMenuItemData.price} onChange={(e) => setCurrentMenuItemData(p => ({...p, price: parseFloat(e.target.value) || 0}))} step="0.01" min="0" disabled={isSubmitting}/></div>
            <div className="space-y-1.5"><Label htmlFor="itemImg">Image URL</Label><Input id="itemImg" value={currentMenuItemData.imageUrl || ''} onChange={(e) => setCurrentMenuItemData(p => ({...p, imageUrl: e.target.value}))} placeholder="https://placehold.co/300x200.png" disabled={isSubmitting}/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMenuItemDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleMenuItemSubmit} disabled={isSubmitting || !currentMenuItemData.name?.trim() || currentMenuItemData.price === undefined || currentMenuItemData.price < 0}>Save Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
