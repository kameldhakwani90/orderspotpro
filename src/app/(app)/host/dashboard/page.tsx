
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Added Tabs
import { MapPin, ListChecks, FileText, ClipboardList, ShoppingCart, BarChart3, PlusCircle, User, Building, Utensils, GlassWater, ChefHat } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import type { Order, Service, RoomOrTable, Client, ServiceCategory, CustomForm, FormField as FormFieldType, MenuCard, MenuCategory, MenuItem } from "@/lib/types";
import { getOrders, getServices, getRoomsOrTables, getClients, getServiceCategories, getCustomForms, getFormFields, addOrder, getMenuCards, getMenuCategories as fetchMenuCategoriesForCard, getMenuItems, getMenuCardById } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { DynamicFormRenderer, type DynamicFormRendererRef } from "@/components/shared/DynamicFormRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

const NO_CLIENT_SELECTED_VALUE = "__NO_CLIENT_SELECTED_PLACEHOLDER__";
const NO_LOCATIONS_PLACEHOLDER_VALUE = "__NO_LOCATIONS_PLACEHOLDER__";
const NO_CATEGORIES_PLACEHOLDER_VALUE = "__NO_CATEGORIES_PLACEHOLDER__";
const NO_SERVICES_PLACEHOLDER_VALUE = "__NO_SERVICES_PLACEHOLDER__";
const NO_MENU_CARDS_PLACEHOLDER_VALUE = "__NO_MENU_CARDS_PLACEHOLDER__";
const NO_MENU_CATEGORIES_PLACEHOLDER_VALUE = "__NO_MENU_CATEGORIES_PLACEHOLDER__";
const NO_MENU_ITEMS_PLACEHOLDER_VALUE = "__NO_MENU_ITEMS_PLACEHOLDER__";


const StatCard = ({ title, value, icon: Icon, link, buttonText }: { title: string, value: string | number, icon: React.ElementType, link?: string, buttonText?: string }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {link && buttonText && (
        <Link href={link}>
          <Button variant="outline" size="sm" className="mt-2">
            {buttonText}
          </Button>
        </Link>
      )}
    </CardContent>
  </Card>
);

type OrderType = 'service' | 'food_beverage';

export default function HostDashboardPage() {
  const { user, isLoading: authLoading, selectedGlobalSite } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const dynamicFormRef = useRef<DynamicFormRendererRef>(null);

  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, totalServices: 0, locationsCount: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [isAddOrderDialogOpen, setIsAddOrderDialogOpen] = useState(false);
  const [isDialogDataLoading, setIsDialogDataLoading] = useState(false);
  
  // Common Dialog State
  const [dialogLocations, setDialogLocations] = useState<RoomOrTable[]>([]);
  const [dialogClients, setDialogClients] = useState<Client[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<string>(NO_CLIENT_SELECTED_VALUE);
  const [manualClientName, setManualClientName] = useState<string>("");

  // Order Type State
  const [currentOrderType, setCurrentOrderType] = useState<OrderType>('service');

  // Service Specific Dialog State
  const [dialogServiceCategories, setDialogServiceCategories] = useState<ServiceCategory[]>([]);
  const [dialogServices, setDialogServices] = useState<Service[]>([]);
  const [dialogFormFields, setDialogFormFields] = useState<FormFieldType[]>([]);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedServiceDetails, setSelectedServiceDetails] = useState<Service | null>(null);

  // Food & Beverage Specific Dialog State
  const [dialogMenuCards, setDialogMenuCards] = useState<MenuCard[]>([]);
  const [dialogMenuCategories, setDialogMenuCategories] = useState<MenuCategory[]>([]);
  const [dialogMenuItems, setDialogMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenuCardId, setSelectedMenuCardId] = useState<string>("");
  const [selectedMenuCategoryId, setSelectedMenuCategoryId] = useState<string>("");
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>("");
  const [selectedMenuItemDetails, setSelectedMenuItemDetails] = useState<MenuItem | null>(null);
  
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const fetchDashboardData = useCallback(async (hostId: string) => {
    setIsDataLoading(true);
    try {
      const [ordersData, servicesData, locationsData] = await Promise.all([
        getOrders(hostId),
        getServices(hostId),
        getRoomsOrTables(hostId)
      ]);
      setStats({
        totalOrders: ordersData.length,
        pendingOrders: ordersData.filter(o => o.status === 'pending').length,
        totalServices: servicesData.length,
        locationsCount: locationsData.length,
      });
      setRecentOrders(ordersData.slice(0, 3));
    } catch (error) { console.error("Failed to fetch dashboard data:", error); toast({ title: "Error", description: "Could not load dashboard statistics.", variant: "destructive" }); }
    finally { setIsDataLoading(false); }
  }, [toast]); 

  useEffect(() => {
    if (!authLoading && user?.role !== 'host') { router.replace('/dashboard'); }
    if (!authLoading && user?.hostId) { fetchDashboardData(user.hostId); }
  }, [user, authLoading, router, fetchDashboardData]);

  const fetchDialogData = useCallback(async () => {
    if (!user?.hostId || !isAddOrderDialogOpen) return;
    setIsDialogDataLoading(true);
    try {
      const [locations, clients, serviceCategories, services, menuCards] = await Promise.all([
        getRoomsOrTables(user.hostId),
        getClients(user.hostId),
        getServiceCategories(user.hostId),
        getServices(user.hostId),
        getMenuCards(user.hostId, selectedGlobalSite?.siteId) // Fetch menu cards, optionally filtered by global site
      ]);
      setDialogLocations(locations);
      setDialogClients(clients);
      setDialogServiceCategories(serviceCategories);
      setDialogServices(services);
      setDialogMenuCards(menuCards);

      if (locations.length > 0 && !selectedLocation) setSelectedLocation(locations[0].id);
      if (serviceCategories.length > 0 && !selectedServiceCategory) setSelectedServiceCategory(serviceCategories[0].id);
      
      // Determine default menu card if ordering food/bev for a specific location
      const currentLoc = locations.find(l => l.id === (selectedLocation || locations[0]?.id));
      if (currentLoc?.menuCardId) {
          const specificMenuCard = menuCards.find(mc => mc.id === currentLoc.menuCardId);
          if (specificMenuCard) {
            setSelectedMenuCardId(specificMenuCard.id);
          } else if (menuCards.length > 0) {
            setSelectedMenuCardId(menuCards[0].id); // Fallback to first available if assigned one not found
          }
      } else if (menuCards.length > 0 && !selectedMenuCardId) {
        setSelectedMenuCardId(menuCards[0].id);
      }

    } catch (error) {
      toast({ title: "Error", description: "Could not load data for new order form.", variant: "destructive" });
      // Reset all dialog related states
      setDialogLocations([]); setDialogClients([]); setSelectedLocation("");
      setDialogServiceCategories([]); setDialogServices([]); setSelectedServiceCategory(""); setSelectedService("");
      setDialogMenuCards([]); setDialogMenuCategories([]); setDialogMenuItems([]); setSelectedMenuCardId(""); setSelectedMenuCategoryId(""); setSelectedMenuItemId("");
    } finally {
      setIsDialogDataLoading(false);
    }
  }, [user?.hostId, isAddOrderDialogOpen, selectedLocation, selectedServiceCategory, selectedMenuCardId, selectedGlobalSite, toast]); 

  useEffect(() => {
    if (isAddOrderDialogOpen) { fetchDialogData(); }
  }, [isAddOrderDialogOpen, fetchDialogData]);

  // Effect for Service details and form fields
  useEffect(() => {
    if (selectedService && currentOrderType === 'service') {
      const serviceDetails = dialogServices.find(s => s.id === selectedService);
      setSelectedServiceDetails(serviceDetails || null);
      if (serviceDetails?.formulaireId) {
        const fetchFields = async () => {
          setIsDialogDataLoading(true);
          try { const fields = await getFormFields(serviceDetails.formulaireId!); setDialogFormFields(fields); }
          catch (error) { toast({ title: "Error", description: "Could not load form fields.", variant: "destructive"}); setDialogFormFields([]); }
          finally { setIsDialogDataLoading(false); }
        };
        fetchFields();
      } else { setDialogFormFields([]); }
    } else { setSelectedServiceDetails(null); setDialogFormFields([]); }
  }, [selectedService, dialogServices, currentOrderType, toast]); 

  // Effect for Menu Card Categories
  useEffect(() => {
    if (selectedMenuCardId && user?.hostId && currentOrderType === 'food_beverage') {
      const fetchMenuCategories = async () => {
        setIsDialogDataLoading(true);
        try {
          const categories = await fetchMenuCategoriesForCard(selectedMenuCardId, user.hostId!);
          setDialogMenuCategories(categories);
          if (categories.length > 0) { setSelectedMenuCategoryId(categories[0].id); } 
          else { setSelectedMenuCategoryId(""); setDialogMenuItems([]); setSelectedMenuItemId("");}
        } catch (error) { toast({ title: "Error", description: "Could not load menu categories.", variant: "destructive"}); setDialogMenuCategories([]); }
        finally { setIsDialogDataLoading(false); }
      };
      fetchMenuCategories();
    } else if (currentOrderType === 'food_beverage') {
      setDialogMenuCategories([]);
      setSelectedMenuCategoryId("");
    }
  }, [selectedMenuCardId, user?.hostId, currentOrderType, toast]);

  // Effect for Menu Category Items
  useEffect(() => {
    if (selectedMenuCategoryId && user?.hostId && currentOrderType === 'food_beverage') {
      const fetchCatItems = async () => {
        setIsDialogDataLoading(true);
        try {
          const items = await getMenuItems(selectedMenuCategoryId, user.hostId!);
          setDialogMenuItems(items);
          if (items.length > 0) { setSelectedMenuItemId(items[0].id); setSelectedMenuItemDetails(items[0]);} 
          else { setSelectedMenuItemId(""); setSelectedMenuItemDetails(null); }
        } catch (error) { toast({ title: "Error", description: "Could not load menu items.", variant: "destructive"}); setDialogMenuItems([]); }
        finally { setIsDialogDataLoading(false); }
      };
      fetchCatItems();
    } else if (currentOrderType === 'food_beverage') {
      setDialogMenuItems([]);
      setSelectedMenuItemId("");
      setSelectedMenuItemDetails(null);
    }
  }, [selectedMenuCategoryId, user?.hostId, currentOrderType, toast]);

  useEffect(() => {
    if (selectedMenuItemId && currentOrderType === 'food_beverage') {
        const itemDetails = dialogMenuItems.find(item => item.id === selectedMenuItemId);
        setSelectedMenuItemDetails(itemDetails || null);
    } else {
        setSelectedMenuItemDetails(null);
    }
  }, [selectedMenuItemId, dialogMenuItems, currentOrderType]);


  const resetDialogForm = () => {
    setCurrentOrderType('service');
    setSelectedLocation(dialogLocations.length > 0 ? dialogLocations[0].id : "");
    setSelectedClient(NO_CLIENT_SELECTED_VALUE);
    setManualClientName("");
    setSelectedServiceCategory(dialogServiceCategories.length > 0 ? dialogServiceCategories[0].id : "");
    setSelectedService(""); setSelectedServiceDetails(null); setDialogFormFields([]);
    setSelectedMenuCardId(dialogMenuCards.length > 0 ? dialogMenuCards[0].id : "");
    setSelectedMenuCategoryId(""); setSelectedMenuItemId(""); setSelectedMenuItemDetails(null);
    setDialogMenuCategories([]); setDialogMenuItems([]);
  }

  const handleAddOrderDialogChange = (open: boolean) => { setIsAddOrderDialogOpen(open); if (!open) { resetDialogForm(); } }
  const handleClientSelectionChange = (value: string) => { setSelectedClient(value); if (value !== NO_CLIENT_SELECTED_VALUE) { setManualClientName(""); } };

  const handleActualOrderSubmit = async (formData: Record<string, any>) => {
    if (!user?.hostId || !selectedLocation) {
      toast({ title: "Missing Information", description: "Please select a location.", variant: "destructive" }); return;
    }
    let clientNameToSubmit = manualClientName.trim();
    if (selectedClient !== NO_CLIENT_SELECTED_VALUE) {
        const clientObj = dialogClients.find(c => c.id === selectedClient);
        clientNameToSubmit = clientObj?.nom || "Unknown Client";
    }
    if (!clientNameToSubmit) {
        toast({ title: "Missing Client Information", description: "Please select or enter a client name.", variant: "destructive" }); return;
    }

    let itemIdToOrder: string | undefined;
    let itemPrice: number | undefined;

    if (currentOrderType === 'service') {
        if (!selectedService) { toast({ title: "Missing Information", description: "Please select a service.", variant: "destructive" }); return; }
        itemIdToOrder = selectedService;
        itemPrice = selectedServiceDetails?.prix;
    } else { // food_beverage
        if (!selectedMenuItemId) { toast({ title: "Missing Information", description: "Please select a menu item.", variant: "destructive" }); return; }
        itemIdToOrder = selectedMenuItemId;
        itemPrice = selectedMenuItemDetails?.price;
    }
    if (!itemIdToOrder) { toast({title: "Item not selected", description: "Please select an item to order.", variant: "destructive"}); return; }

    setIsSubmittingOrder(true);
    try {
      await addOrder({
        hostId: user.hostId,
        chambreTableId: selectedLocation,
        serviceId: itemIdToOrder, 
        clientNom: clientNameToSubmit,
        donneesFormulaire: currentOrderType === 'service' ? JSON.stringify(formData) : "{}", // TODO: MenuItem configuration data
        prixTotal: itemPrice, 
        userId: selectedClient !== NO_CLIENT_SELECTED_VALUE ? selectedClient : undefined
      });
      toast({ title: "Order Created", description: `New order for ${clientNameToSubmit} has been submitted.` });
      fetchDashboardData(user.hostId); 
      setIsAddOrderDialogOpen(false);
      resetDialogForm();
    } catch (error) {
      console.error("Failed to submit order:", error);
      toast({ title: "Order Submission Failed", description: "There was an error submitting the order.", variant: "destructive"});
    } finally { setIsSubmittingOrder(false); }
  };
  
  const triggerOrderSubmission = () => {
    if (currentOrderType === 'service' && selectedServiceDetails?.formulaireId && dialogFormFields.length > 0 && dynamicFormRef.current) {
      dynamicFormRef.current.submit(); 
    } else if (currentOrderType === 'service' && selectedServiceDetails) {
      handleActualOrderSubmit({}); 
    } else if (currentOrderType === 'food_beverage' && selectedMenuItemDetails) {
        // For now, MenuItem configuration is not handled in this dialog.
        // If it were, we'd get data from its own form/options component.
        handleActualOrderSubmit({}); 
    } else {
      toast({ title: "Cannot Submit", description: "Please select an item or service first.", variant: "destructive"});
    }
  };

  const filteredDialogServices = selectedServiceCategory ? dialogServices.filter(s => s.categorieId === selectedServiceCategory) : dialogServices;
  const filteredDialogMenuItems = selectedMenuCategoryId ? dialogMenuItems.filter(item => item.menuCategoryId === selectedMenuCategoryId) : dialogMenuItems;

  const submitButtonDisabled = isSubmittingOrder || !selectedLocation ||
    (selectedClient === NO_CLIENT_SELECTED_VALUE && !manualClientName.trim()) ||
    (currentOrderType === 'service' && !selectedService) ||
    (currentOrderType === 'food_beverage' && !selectedMenuItemId);


  if (authLoading || !user || user.role !== 'host') { return <div className="p-6">Loading host data or unauthorized...</div>; }
  if (isDataLoading && !isAddOrderDialogOpen) { 
      return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div><Skeleton className="h-10 w-72"/><Skeleton className="h-6 w-96 mt-2"/></div>
            <Skeleton className="h-12 w-48"/>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32"/>)}
          </div>
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Skeleton className="h-64"/> <Skeleton className="h-64"/>
          </div>
        </div>
      );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Host Dashboard</h1>
          <p className="text-lg text-muted-foreground">Manage your services and customer interactions.</p>
        </div>
        <Dialog open={isAddOrderDialogOpen} onOpenChange={handleAddOrderDialogChange}>
          <DialogTrigger asChild>
            <Button size="lg">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle className="text-xl">Add New Order</DialogTitle>
              <DialogDescription>Manually create a new order for a client.</DialogDescription>
            </DialogHeader>
            
            <Tabs value={currentOrderType} onValueChange={(value) => setCurrentOrderType(value as OrderType)} className="w-full px-6 pt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="service" className="text-sm py-2.5"><ClipboardList className="mr-2 h-4 w-4"/>Service</TabsTrigger>
                <TabsTrigger value="food_beverage" className="text-sm py-2.5"><ChefHat className="mr-2 h-4 w-4"/>Food & Beverage</TabsTrigger>
              </TabsList>
            </Tabs>

            {isDialogDataLoading && currentOrderType === 'food_beverage' ? ( // More specific loading for F&B data
              <div className="space-y-4 py-4 px-6"> <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" /> </div>
            ) : (
            <ScrollArea className="flex-grow px-6 py-4">
                <div className="space-y-4">
                  <div> <Label htmlFor="dialogLocation">Location (Room/Table)</Label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={dialogLocations.length === 0}>
                      <SelectTrigger id="dialogLocation"><SelectValue placeholder="Select a location" /></SelectTrigger>
                      <SelectContent> {dialogLocations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.type} - {loc.nom}</SelectItem>)} {dialogLocations.length === 0 && <SelectItem value={NO_LOCATIONS_PLACEHOLDER_VALUE} disabled>No locations available</SelectItem>} </SelectContent>
                    </Select>
                  </div>
                  <div> <Label htmlFor="dialogClient">Registered Client (Optional)</Label>
                    <Select value={selectedClient} onValueChange={handleClientSelectionChange} disabled={dialogClients.length === 0}>
                      <SelectTrigger id="dialogClient"><SelectValue placeholder="Select a registered client" /></SelectTrigger>
                      <SelectContent> <SelectItem value={NO_CLIENT_SELECTED_VALUE}>None (Enter name below)</SelectItem> {dialogClients.map(client => <SelectItem key={client.id} value={client.id}>{client.nom}</SelectItem>)} {dialogClients.length === 0 && <SelectItem value="__NO_REGISTERED_CLIENTS__" disabled>No registered clients</SelectItem>} </SelectContent>
                    </Select>
                  </div>
                  <div> <Label htmlFor="manualClientName">Or Enter Client Name *</Label> <Input id="manualClientName" value={manualClientName} onChange={(e) => setManualClientName(e.target.value)} placeholder="e.g., John Doe, Table 5 Guest" disabled={selectedClient !== NO_CLIENT_SELECTED_VALUE} /> </div>

                  {currentOrderType === 'service' && (
                    <>
                      <div> <Label htmlFor="dialogServiceCategory">Service Category *</Label>
                        <Select value={selectedServiceCategory} onValueChange={setSelectedServiceCategory} disabled={dialogServiceCategories.length === 0}>
                          <SelectTrigger id="dialogServiceCategory"><SelectValue placeholder="Select a category" /></SelectTrigger>
                          <SelectContent> {dialogServiceCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.nom}</SelectItem>)} {dialogServiceCategories.length === 0 && <SelectItem value={NO_CATEGORIES_PLACEHOLDER_VALUE} disabled>No categories available</SelectItem>} </SelectContent>
                        </Select>
                      </div>
                      <div> <Label htmlFor="dialogService">Service *</Label>
                        <Select value={selectedService} onValueChange={setSelectedService} disabled={filteredDialogServices.length === 0 || !selectedServiceCategory}>
                          <SelectTrigger id="dialogService"><SelectValue placeholder="Select a service" /></SelectTrigger>
                          <SelectContent> {filteredDialogServices.map(srv => <SelectItem key={srv.id} value={srv.id}>{srv.titre} {srv.prix !== undefined ? `($${srv.prix.toFixed(2)})` : ''}</SelectItem>)} {filteredDialogServices.length === 0 && <SelectItem value={NO_SERVICES_PLACEHOLDER_VALUE} disabled>No services in category</SelectItem>} </SelectContent>
                        </Select>
                      </div>
                      {selectedServiceDetails?.prix !== undefined && (<p className="text-lg font-semibold text-primary">Price: ${selectedServiceDetails.prix.toFixed(2)}</p>)}
                      {selectedServiceDetails?.formulaireId && dialogFormFields.length > 0 && (
                        <DynamicFormRenderer ref={dynamicFormRef} formName={`Order: ${selectedServiceDetails.titre}`} formDescription={"Additional Information"} fields={dialogFormFields} onSubmit={handleActualOrderSubmit} />
                      )}
                    </>
                  )}

                  {currentOrderType === 'food_beverage' && (
                    <>
                       <div><Label htmlFor="dialogMenuCard">Menu Card *</Label>
                          <Select value={selectedMenuCardId} onValueChange={setSelectedMenuCardId} disabled={dialogMenuCards.length === 0}>
                              <SelectTrigger id="dialogMenuCard"><SelectValue placeholder="Select a menu card" /></SelectTrigger>
                              <SelectContent>{dialogMenuCards.map(mc => <SelectItem key={mc.id} value={mc.id}>{mc.name}</SelectItem>)} {dialogMenuCards.length === 0 && <SelectItem value={NO_MENU_CARDS_PLACEHOLDER_VALUE} disabled>No menu cards available</SelectItem>}</SelectContent>
                          </Select>
                       </div>
                       <div> <Label htmlFor="dialogMenuCategory">Menu Category *</Label>
                          <Select value={selectedMenuCategoryId} onValueChange={setSelectedMenuCategoryId} disabled={dialogMenuCategories.length === 0 || !selectedMenuCardId}>
                              <SelectTrigger id="dialogMenuCategory"><SelectValue placeholder="Select a menu category" /></SelectTrigger>
                              <SelectContent>{dialogMenuCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)} {dialogMenuCategories.length === 0 && <SelectItem value={NO_MENU_CATEGORIES_PLACEHOLDER_VALUE} disabled>No categories in menu card</SelectItem>}</SelectContent>
                          </Select>
                       </div>
                       <div> <Label htmlFor="dialogMenuItem">Menu Item *</Label>
                          <Select value={selectedMenuItemId} onValueChange={setSelectedMenuItemId} disabled={filteredDialogMenuItems.length === 0 || !selectedMenuCategoryId}>
                              <SelectTrigger id="dialogMenuItem"><SelectValue placeholder="Select an item" /></SelectTrigger>
                              <SelectContent>{filteredDialogMenuItems.map(item => <SelectItem key={item.id} value={item.id}>{item.name} {item.price !== undefined ? `($${item.price.toFixed(2)})` : ''}</SelectItem>)} {filteredDialogMenuItems.length === 0 && <SelectItem value={NO_MENU_ITEMS_PLACEHOLDER_VALUE} disabled>No items in category</SelectItem>}</SelectContent>
                          </Select>
                       </div>
                       {selectedMenuItemDetails?.price !== undefined && (<p className="text-lg font-semibold text-primary">Price: ${selectedMenuItemDetails.price.toFixed(2)}</p>)}
                       {/* Placeholder for MenuItem configuration options if item.isConfigurable */}
                       {selectedMenuItemDetails?.isConfigurable && (
                           <p className="text-sm text-muted-foreground italic">Item configuration options will appear here in a future update. Current order will use base price.</p>
                       )}
                    </>
                  )}
                </div>
            </ScrollArea>
            )}
            <DialogFooter className="mt-auto pt-4 px-6 pb-6 border-t">
                <DialogClose asChild><Button variant="outline" disabled={isSubmittingOrder}>Cancel</Button></DialogClose>
                <Button onClick={triggerOrderSubmission} disabled={submitButtonDisabled}>
                    {isSubmittingOrder ? 'Submitting...' : "Submit Order"}
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} link="/host/orders" buttonText="View Orders"/>
        <StatCard title="Pending Orders" value={stats.pendingOrders} icon={ShoppingCart} link="/host/orders?status=pending" buttonText="View Pending"/>
        <StatCard title="Active Services" value={stats.totalServices} icon={ClipboardList} link="/host/services" buttonText="Manage Services" />
        <StatCard title="My Locations" value={stats.locationsCount} icon={MapPin} link="/host/locations" buttonText="Manage Locations"/>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader> <CardTitle>Quick Management Links</CardTitle> <CardDescription>Access your key management areas.</CardDescription> </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { href: '/host/locations', icon: MapPin, label: 'My Locations', desc: 'Rooms, tables, QR codes' },
              { href: '/host/menu-cards', icon: ChefHat, label: 'Menu Cards', desc: 'Manage food & beverage menus' },
              { href: '/host/service-categories', icon: ListChecks, label: 'Service Categories', desc: 'Organize your offerings' },
              { href: '/host/forms', icon: FileText, label: 'Custom Forms', desc: 'Tailor data collection' },
              { href: '/host/services', icon: ClipboardList, label: 'My Services', desc: 'Manage all services' },
              { href: '/host/clients', icon: User, label: 'Gestion Clients', desc: 'Manage client records'},
            ].map(item => (
              <Link key={item.href} href={item.href} className="block p-4 bg-secondary hover:bg-accent rounded-lg transition-colors">
                <div className="flex items-center"> <item.icon className="h-6 w-6 mr-3 text-primary" /> <span className="font-semibold text-foreground">{item.label}</span> </div>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader> <CardTitle>Recent Orders</CardTitle> <CardDescription>Latest customer requests.</CardDescription> </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <ul className="space-y-3">
                {recentOrders.map(order => (
                  <li key={order.id} className="text-sm p-2 border-b last:border-b-0">
                    <div className="flex justify-between">
                      <span>Order #{order.id.slice(-5)} for Room/Table: {order.chambreTableId}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${ order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300' :  order.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300' : order.status === 'confirmed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300' : 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300'  }`}>{order.status}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(order.dateHeure).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            ) : ( <p className="text-sm text-muted-foreground">No recent orders.</p> )}
            <Link href="/host/orders"> <Button variant="outline" className="mt-4 w-full">View All Orders</Button> </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
    

