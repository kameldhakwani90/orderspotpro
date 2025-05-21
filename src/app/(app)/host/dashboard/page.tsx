
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, ListChecks, FileText, ClipboardList, ShoppingCart, BarChart3, PlusCircle, User, Building } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import type { Order, Service, RoomOrTable, Client, ServiceCategory, CustomForm, FormField } from "@/lib/types";
import { getOrders, getServices, getRoomsOrTables, getClients, getServiceCategories, getCustomForms, getFormFields, addOrder } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { DynamicFormRenderer } from "@/components/shared/DynamicFormRenderer";
import { Skeleton } from "@/components/ui/skeleton";

const NO_CLIENT_SELECTED_VALUE = "__NO_CLIENT_SELECTED_PLACEHOLDER__";
const NO_LOCATIONS_PLACEHOLDER_VALUE = "__NO_LOCATIONS_PLACEHOLDER__";
const NO_CATEGORIES_PLACEHOLDER_VALUE = "__NO_CATEGORIES_PLACEHOLDER__";
const NO_SERVICES_PLACEHOLDER_VALUE = "__NO_SERVICES_PLACEHOLDER__";


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

export default function HostDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalServices: 0,
    locationsCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // State for Add Order Dialog
  const [isAddOrderDialogOpen, setIsAddOrderDialogOpen] = useState(false);
  const [isDialogDataLoading, setIsDialogDataLoading] = useState(false);
  const [dialogLocations, setDialogLocations] = useState<RoomOrTable[]>([]);
  const [dialogClients, setDialogClients] = useState<Client[]>([]);
  const [dialogCategories, setDialogCategories] = useState<ServiceCategory[]>([]);
  const [dialogServices, setDialogServices] = useState<Service[]>([]);
  const [dialogCustomForms, setDialogCustomForms] = useState<CustomForm[]>([]);
  const [dialogFormFields, setDialogFormFields] = useState<FormField[]>([]);

  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<string>(""); // Stores client.id or ""
  const [manualClientName, setManualClientName] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedServiceDetails, setSelectedServiceDetails] = useState<Service | null>(null);
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
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({ title: "Error", description: "Could not load dashboard statistics.", variant: "destructive" });
    } finally {
        setIsDataLoading(false);
    }
  }, [toast]); 

  useEffect(() => {
    if (!authLoading && user?.role !== 'host') {
      router.replace('/dashboard'); 
    }
    if (!authLoading && user?.hostId) {
      fetchDashboardData(user.hostId);
    }
  }, [user, authLoading, router, fetchDashboardData]);

  const fetchDialogData = useCallback(async () => {
    if (!user?.hostId || !isAddOrderDialogOpen) return;
    setIsDialogDataLoading(true);
    try {
      const [locations, clients, categories, services, forms] = await Promise.all([
        getRoomsOrTables(user.hostId),
        getClients(user.hostId),
        getServiceCategories(user.hostId),
        getServices(user.hostId),
        getCustomForms(user.hostId)
      ]);
      setDialogLocations(locations);
      setDialogClients(clients);
      setDialogCategories(categories);
      setDialogServices(services);
      setDialogCustomForms(forms);

      if (locations.length > 0 && !selectedLocation) setSelectedLocation(locations[0].id);
      if (categories.length > 0 && !selectedCategory) setSelectedCategory(categories[0].id);

    } catch (error) {
      toast({ title: "Error", description: "Could not load data for new order form.", variant: "destructive" });
      setDialogLocations([]);
      setDialogClients([]);
      setDialogCategories([]);
      setDialogServices([]);
      setDialogCustomForms([]);
      setSelectedLocation("");
      setSelectedCategory("");
      setSelectedService("");
    } finally {
      setIsDialogDataLoading(false);
    }
  }, [user?.hostId, isAddOrderDialogOpen, selectedLocation, selectedCategory, toast]); 

  useEffect(() => {
    if (isAddOrderDialogOpen) {
      fetchDialogData();
    }
  }, [isAddOrderDialogOpen, fetchDialogData]);

  useEffect(() => {
    if (selectedService) {
      const serviceDetails = dialogServices.find(s => s.id === selectedService);
      setSelectedServiceDetails(serviceDetails || null);
      if (serviceDetails?.formulaireId) {
        const fetchFields = async () => {
          setIsDialogDataLoading(true);
          try {
            const fields = await getFormFields(serviceDetails.formulaireId!);
            setDialogFormFields(fields);
          } catch (error) {
            toast({ title: "Error", description: "Could not load form fields.", variant: "destructive"});
            setDialogFormFields([]);
          } finally {
            setIsDialogDataLoading(false);
          }
        };
        fetchFields();
      } else {
        setDialogFormFields([]);
      }
    } else {
      setSelectedServiceDetails(null);
      setDialogFormFields([]);
    }
  }, [selectedService, dialogServices, toast]); 

  const resetDialogForm = () => {
    setSelectedLocation(dialogLocations.length > 0 ? dialogLocations[0].id : "");
    setSelectedClient("");
    setManualClientName("");
    setSelectedCategory(dialogCategories.length > 0 ? dialogCategories[0].id : "");
    setSelectedService("");
    setSelectedServiceDetails(null);
    setDialogFormFields([]);
  }

  const handleAddOrderDialogChange = (open: boolean) => {
    setIsAddOrderDialogOpen(open);
    if (!open) {
      resetDialogForm();
    }
  }

  const handleClientSelectionChange = (value: string) => {
    if (value === NO_CLIENT_SELECTED_VALUE) {
        setSelectedClient(""); // Enable manual input
    } else {
        setSelectedClient(value); // Set to actual client ID
        setManualClientName(""); // Clear manual input if registered client is chosen
    }
  };

  const handleOrderSubmit = async (formData: Record<string, any>) => {
    if (!user?.hostId || !selectedLocation || !selectedService) {
      toast({ title: "Missing Information", description: "Please select location and service.", variant: "destructive" });
      return;
    }

    let clientNameToSubmit = manualClientName.trim();
    if (!clientNameToSubmit && selectedClient) {
        const clientObj = dialogClients.find(c => c.id === selectedClient);
        clientNameToSubmit = clientObj?.nom || "Unknown Client";
    }
    if (!clientNameToSubmit) {
        toast({ title: "Missing Client Information", description: "Please select or enter a client name.", variant: "destructive" });
        return;
    }

    setIsSubmittingOrder(true);
    try {
      const serviceForOrder = dialogServices.find(s => s.id === selectedService);
      await addOrder({
        hostId: user.hostId,
        chambreTableId: selectedLocation,
        serviceId: selectedService,
        clientNom: clientNameToSubmit,
        donneesFormulaire: JSON.stringify(formData),
        prix: serviceForOrder?.prix, 
      });
      toast({ title: "Order Created", description: `New order for ${clientNameToSubmit} has been submitted.` });
      fetchDashboardData(user.hostId); 
      setIsAddOrderDialogOpen(false);
      resetDialogForm();
    } catch (error) {
      console.error("Failed to submit order:", error);
      toast({ title: "Order Submission Failed", description: "There was an error submitting the order.", variant: "destructive"});
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const filteredServices = selectedCategory ? dialogServices.filter(s => s.categorieId === selectedCategory) : dialogServices;

  if (authLoading || !user || user.role !== 'host') {
    return <div className="p-6">Loading host data or unauthorized...</div>;
  }

  if (isDataLoading) {
      return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div><Skeleton className="h-10 w-72" /><Skeleton className="h-6 w-96 mt-2" /></div>
                <Skeleton className="h-12 w-40" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
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
          <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Add New Order</DialogTitle>
              <DialogDescription>Manually create a new service order for a client.</DialogDescription>
            </DialogHeader>
            {isDialogDataLoading ? (
              <div className="space-y-4 py-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
            <div className="py-4 space-y-4 overflow-y-auto flex-grow pr-2">
              <div>
                <Label htmlFor="dialogLocation">Location (Room/Table)</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={dialogLocations.length === 0}>
                  <SelectTrigger id="dialogLocation"><SelectValue placeholder="Select a location" /></SelectTrigger>
                  <SelectContent>
                    {dialogLocations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.type} - {loc.nom}</SelectItem>)}
                    {dialogLocations.length === 0 && <SelectItem value={NO_LOCATIONS_PLACEHOLDER_VALUE} disabled>No locations available</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dialogClient">Registered Client (Optional)</Label>
                <Select value={selectedClient} onValueChange={handleClientSelectionChange} disabled={dialogClients.length === 0}>
                  <SelectTrigger id="dialogClient"><SelectValue placeholder="Select a registered client" /></SelectTrigger>
                  <SelectContent>
                     <SelectItem value={NO_CLIENT_SELECTED_VALUE}>None (Enter name below)</SelectItem>
                    {dialogClients.map(client => <SelectItem key={client.id} value={client.id}>{client.nom}</SelectItem>)}
                    {dialogClients.length === 0 && <SelectItem value="__NO_REGISTERED_CLIENTS__" disabled>No registered clients</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
               <div>
                <Label htmlFor="manualClientName">Or Enter Client Name</Label>
                <Input id="manualClientName" value={manualClientName} onChange={(e) => setManualClientName(e.target.value)} placeholder="e.g., John Doe, Table 5 Guest" disabled={!!selectedClient}/>
              </div>

              <div>
                <Label htmlFor="dialogCategory">Service Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={dialogCategories.length === 0}>
                  <SelectTrigger id="dialogCategory"><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {dialogCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.nom}</SelectItem>)}
                     {dialogCategories.length === 0 && <SelectItem value={NO_CATEGORIES_PLACEHOLDER_VALUE} disabled>No categories available</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dialogService">Service</Label>
                <Select value={selectedService} onValueChange={setSelectedService} disabled={filteredServices.length === 0 || !selectedCategory}>
                  <SelectTrigger id="dialogService"><SelectValue placeholder="Select a service" /></SelectTrigger>
                  <SelectContent>
                    {filteredServices.map(srv => <SelectItem key={srv.id} value={srv.id}>{srv.titre} {srv.prix !== undefined ? `($${srv.prix.toFixed(2)})` : ''}</SelectItem>)}
                    {filteredServices.length === 0 && <SelectItem value={NO_SERVICES_PLACEHOLDER_VALUE} disabled>No services in category</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              {selectedServiceDetails?.prix !== undefined && ( 
                <p className="text-lg font-semibold text-primary">Price: ${selectedServiceDetails.prix.toFixed(2)}</p>
              )}

              {selectedServiceDetails?.formulaireId && dialogFormFields.length > 0 && (
                <DynamicFormRenderer
                  formName={`Order: ${selectedServiceDetails.titre}`}
                  formDescription={dialogCustomForms.find(f => f.id === selectedServiceDetails.formulaireId)?.nom || "Additional Information"}
                  fields={dialogFormFields}
                  onSubmit={handleOrderSubmit}
                  isLoading={isSubmittingOrder}
                  submitButtonText={selectedServiceDetails.prix !== undefined ? `Submit Order ($${selectedServiceDetails.prix.toFixed(2)})` : "Submit Order"}
                />
              )}
              
              {selectedServiceDetails && !selectedServiceDetails.formulaireId && (
                 <Button onClick={() => handleOrderSubmit({})} className="w-full mt-4" disabled={isSubmittingOrder || !selectedLocation || (!selectedClient && !manualClientName.trim())}>
                    {isSubmittingOrder ? 'Submitting...' : (selectedServiceDetails.prix !== undefined ? `Submit Order ($${selectedServiceDetails.prix.toFixed(2)})` : "Submit Order")}
                 </Button>
              )}

            </div>
            )}
            {!selectedServiceDetails?.formulaireId && (
              <DialogFooter className="mt-auto pt-4 border-t">
                <Button variant="outline" onClick={() => handleAddOrderDialogChange(false)} disabled={isSubmittingOrder}>Cancel</Button>
              </DialogFooter>
            )}
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
          <CardHeader>
            <CardTitle>Quick Management Links</CardTitle>
            <CardDescription>Access your key management areas.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { href: '/host/locations', icon: MapPin, label: 'My Locations', desc: 'Rooms, tables, QR codes' },
              { href: '/host/service-categories', icon: ListChecks, label: 'Service Categories', desc: 'Organize your offerings' },
              { href: '/host/forms', icon: FileText, label: 'Custom Forms', desc: 'Tailor data collection' },
              { href: '/host/services', icon: ClipboardList, label: 'My Services', desc: 'Manage all services' },
              { href: '/host/clients', icon: User, label: 'Gestion Clients', desc: 'Manage client records'},
            ].map(item => (
              <Link key={item.href} href={item.href} className="block p-4 bg-secondary hover:bg-accent rounded-lg transition-colors">
                <div className="flex items-center">
                  <item.icon className="h-6 w-6 mr-3 text-primary" />
                  <span className="font-semibold text-foreground">{item.label}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest customer requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <ul className="space-y-3">
                {recentOrders.map(order => (
                  <li key={order.id} className="text-sm p-2 border-b last:border-b-0">
                    <div className="flex justify-between">
                      <span>Order #{order.id.slice(-5)} for Room/Table: {order.chambreTableId}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        order.status === 'pending' ? 'bg-yellow-400/20 text-yellow-600 dark:text-yellow-400' : 
                        order.status === 'completed' ? 'bg-green-400/20 text-green-600 dark:text-green-400' :
                        order.status === 'confirmed' ? 'bg-blue-400/20 text-blue-600 dark:text-blue-400' :
                        'bg-red-400/20 text-red-600 dark:text-red-400' 
                      }`}>{order.status}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(order.dateHeure).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No recent orders.</p>
            )}
            <Link href="/host/orders">
              <Button variant="outline" className="mt-4 w-full">View All Orders</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    