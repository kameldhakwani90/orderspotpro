
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams, usePathname } from 'next/navigation'; // Added usePathname
import Link from 'next/link';
import { getOrders, updateOrderStatus as updateOrderStatusInData, getServices, getServiceCategories, getServiceById, getRoomOrTableById } from '@/lib/data';
import type { Order, Service, RoomOrTable, OrderStatus, ServiceCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, ShoppingCart, Filter, Eye, UserCircle, FileText as InvoiceIcon } from 'lucide-react'; // Added InvoiceIcon
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter, // Added DialogFooter
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const orderStatuses: OrderStatus[] = ["pending", "confirmed", "completed", "cancelled"];

const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
    case 'confirmed': return <CheckCircle className="h-5 w-5 text-blue-500" />;
    case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'cancelled': return <XCircle className="h-5 w-5 text-red-500" />;
    default: return <ShoppingCart className="h-5 w-5 text-muted-foreground" />;
  }
};

const getStatusBadgeVariant = (status: OrderStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'pending': return "default"; 
    case 'confirmed': return "secondary"; 
    case 'completed': return "default"; 
    case 'cancelled': return "destructive";
    default: return "outline";
  }
};


export default function HostOrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order & { serviceName?: string; locationName?: string } | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([]);
  
  // Filters
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>("all");
  const [clientNameFilter, setClientNameFilter] = useState<string>("");


  const fetchData = useCallback(async (hostId: string) => {
    setIsLoading(true);
    try {
      const [categoriesData, servicesData] = await Promise.all([
        getServiceCategories(hostId),
        getServices(hostId) // Fetch all services for the host initially for filter population
      ]);
      setAllCategories(categoriesData);
      setAllServices(servicesData);

      const currentParams = new URLSearchParams(searchParams.toString());
      const status = (currentParams.get('status') as OrderStatus | "all") || "all";
      const categoryId = currentParams.get('categoryId') || "all";
      const serviceId = currentParams.get('serviceId') || "all";
      const clientName = currentParams.get('clientName') || "";
      
      setSelectedStatusFilter(status);
      setSelectedCategoryFilter(categoryId);
      setSelectedServiceFilter(serviceId);
      setClientNameFilter(clientName);

      const ordersData = await getOrders(hostId, { 
        status: status === "all" ? undefined : status,
        categoryId: categoryId === "all" ? undefined : categoryId,
        serviceId: serviceId === "all" ? undefined : serviceId,
        clientName: clientName.trim() === "" ? undefined : clientName.trim(),
       });
      
      const enrichedOrders = await Promise.all(ordersData.map(async (order) => {
        const service = await getServiceById(order.serviceId);
        const location = await getRoomOrTableById(order.chambreTableId);
        return {
          ...order,
          serviceName: service?.titre || 'Unknown Service',
          locationName: location ? `${location.type} ${location.nom}` : 'Unknown Location',
        };
      }));
      setOrders(enrichedOrders);

    } catch (error) {
      console.error("Failed to load orders:", error);
      toast({ title: "Error", description: "Could not load orders. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== 'host' || !user.hostId) {
        router.replace('/dashboard');
      } else {
        fetchData(user.hostId);
      }
    }
  }, [user, authLoading, router, fetchData]);

  const updateFiltersInUrl = () => {
    const currentParams = new URLSearchParams();
    if (selectedStatusFilter !== "all") currentParams.set('status', selectedStatusFilter);
    if (selectedCategoryFilter !== "all") currentParams.set('categoryId', selectedCategoryFilter);
    if (selectedServiceFilter !== "all") currentParams.set('serviceId', selectedServiceFilter);
    if (clientNameFilter.trim() !== "") currentParams.set('clientName', clientNameFilter.trim());
    router.push(`${pathname}?${currentParams.toString()}`);
  };

  // Handlers for filter changes
  const handleStatusFilterChange = (status: OrderStatus | "all") => setSelectedStatusFilter(status);
  const handleCategoryFilterChange = (categoryId: string) => {
    setSelectedCategoryFilter(categoryId);
    setSelectedServiceFilter("all"); // Reset service filter when category changes
  };
  const handleServiceFilterChange = (serviceId: string) => setSelectedServiceFilter(serviceId);
  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => setClientNameFilter(e.target.value);
  
  const handleApplyFilters = () => {
      updateFiltersInUrl();
  };
  
  const handleResetFilters = () => {
    setSelectedStatusFilter("all");
    setSelectedCategoryFilter("all");
    setSelectedServiceFilter("all");
    setClientNameFilter("");
    router.push(pathname); 
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!user?.hostId) return;
    setIsSubmitting(true);
    try {
      await updateOrderStatusInData(orderId, newStatus);
      toast({ title: "Order Status Updated", description: `Order #${orderId.slice(-5)} status changed to ${newStatus}.` });
      fetchData(user.hostId); 
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast({ title: "Error", description: "Could not update order status.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openOrderDetails = (order: Order & { serviceName?: string; locationName?: string }) => {
    setViewingOrder(order);
    setIsDetailsDialogOpen(true);
  };
  
  const filteredServicesForDropdown = selectedCategoryFilter === "all" 
    ? allServices 
    : allServices.filter(s => s.categorieId === selectedCategoryFilter);


  if (isLoading || authLoading) {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <div><Skeleton className="h-10 w-72 mb-2" /><Skeleton className="h-6 w-96" /></div>
            </div>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                {[...Array(4)].map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}
                 <Skeleton className="h-10 w-full lg:col-span-2" />
            </div>
            <Card className="shadow-lg">
                <CardHeader><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-5 w-64" /></CardHeader>
                <CardContent><div className="space-y-4">{[...Array(5)].map((_, i) => (<div key={i} className="grid grid-cols-6 gap-4 items-center"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-8 w-full" /></div>))}</div></CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Client Orders</h1>
          <p className="text-lg text-muted-foreground">View and manage all incoming service requests.</p>
        </div>
      </div>

      <Card className="mb-8 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><Filter className="mr-2 h-5 w-5 text-primary" /> Filter Orders</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select value={selectedStatusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="bg-card"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {orderStatuses.map(status => <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedCategoryFilter} onValueChange={handleCategoryFilterChange}>
            <SelectTrigger className="bg-card"><SelectValue placeholder="Filter by category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {allCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.nom}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedServiceFilter} onValueChange={handleServiceFilterChange} disabled={selectedCategoryFilter === "all" && allServices.length > 10 }>
            <SelectTrigger className="bg-card"><SelectValue placeholder="Filter by service" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {filteredServicesForDropdown.map(srv => <SelectItem key={srv.id} value={srv.id}>{srv.titre}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input 
            type="text" 
            placeholder="Filter by Client Name" 
            value={clientNameFilter} 
            onChange={handleClientNameChange}
            className="bg-card sm:col-span-2 lg:col-span-1"
          />
          <div className="sm:col-span-2 lg:col-span-2 flex flex-col sm:flex-row gap-2 items-center justify-end">
            <Button onClick={handleApplyFilters} className="w-full sm:w-auto">Apply Filters</Button>
            <Button variant="outline" onClick={handleResetFilters} className="w-full sm:w-auto">Reset Filters</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Order List</CardTitle>
          <CardDescription>Total orders ({orders.length}) matching current filters.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
                  <TableCell>
                    {order.clientNom ? (
                      <Link href={`/host/clients/${encodeURIComponent(order.clientNom)}`} className="hover:underline text-primary flex items-center">
                        <UserCircle className="mr-1.5 h-4 w-4" />
                        {order.clientNom}
                      </Link>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>{order.serviceName || order.serviceId}</TableCell>
                  <TableCell>{order.locationName || order.chambreTableId}</TableCell>
                  <TableCell>{new Date(order.dateHeure).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)} className="flex items-center gap-1.5 capitalize text-xs">
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => openOrderDetails(order)} title="View Details" disabled={isSubmitting}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Select 
                        value={order.status} 
                        onValueChange={(newStatus) => handleUpdateStatus(order.id, newStatus as OrderStatus)}
                        disabled={isSubmitting}
                    >
                        <SelectTrigger className="w-[130px] h-9 text-xs bg-card">
                            <SelectValue placeholder="Change Status" />
                        </SelectTrigger>
                        <SelectContent>
                        {orderStatuses.map(status => (
                            <SelectItem key={status} value={status} className="capitalize text-xs">
                                {status}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {orders.length === 0 && <p className="p-4 text-center text-muted-foreground">No orders match the current filter.</p>}
        </CardContent>
      </Card>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details - #{viewingOrder?.id.slice(-6)}</DialogTitle>
            <DialogDescription>
              For {viewingOrder?.serviceName} at {viewingOrder?.locationName}
            </DialogDescription>
          </DialogHeader>
          {viewingOrder && (
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="text-sm"><strong>Client:</strong> {viewingOrder.clientNom || "N/A"}</div>
              <div className="text-sm"><strong>Date:</strong> {new Date(viewingOrder.dateHeure).toLocaleString()}</div>
              <div className="text-sm"><strong>Status:</strong> <span className="capitalize">{viewingOrder.status}</span></div>
              {viewingOrder.prixTotal !== undefined && <div className="text-sm"><strong>Total Price:</strong> ${viewingOrder.prixTotal.toFixed(2)}</div>}
              
              <div className="space-y-2">
                <h4 className="font-semibold">Form Data:</h4>
                {(() => {
                  try {
                    const formData = JSON.parse(viewingOrder.donneesFormulaire);
                    if (typeof formData === 'object' && formData !== null && Object.keys(formData).length > 0) {
                      return (
                        <ul className="list-disc pl-5 space-y-1 text-sm bg-muted p-3 rounded-md">
                          {Object.entries(formData).map(([key, value]) => (
                            <li key={key}>
                              <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {String(value)}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return <p className="text-sm text-muted-foreground">No specific form data submitted or form was not required.</p>;
                  } catch (e) {
                    return <p className="text-sm text-muted-foreground">Could not parse form data.</p>;
                  }
                })()}
              </div>
            </div>
          )}
          <DialogFooter className="mt-4 pt-4 border-t">
            <Link href={`/invoice/order/${viewingOrder?.id}`} target="_blank" passHref>
              <Button variant="outline" disabled={!viewingOrder}>
                  <InvoiceIcon className="mr-2 h-4 w-4" /> View Invoice
              </Button>
            </Link>
            <Button variant="secondary" onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

