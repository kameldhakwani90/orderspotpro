
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { getOrders, updateOrderStatus as updateOrderStatusInData, getServices, getRoomsOrTables, getServiceById, getRoomOrTableById } from '@/lib/data';
import type { Order, Service, RoomOrTable, OrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, Truck, ShoppingCart, Filter, Eye } from 'lucide-react';
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
  DialogTrigger,
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
    case 'pending': return "default"; // Often yellow, but primary might be blue
    case 'confirmed': return "secondary"; // Often blue/purple
    case 'completed': return "default"; // Often green, but Shadcn 'default' can be themed. Or specific green class.
    case 'cancelled': return "destructive";
    default: return "outline";
  }
};


export default function HostOrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<OrderStatus | "all">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order & { serviceName?: string; locationName?: string } | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const fetchData = useCallback(async (hostId: string, statusFilter: OrderStatus | "all") => {
    setIsLoading(true);
    try {
      const status = statusFilter === "all" ? undefined : statusFilter;
      const ordersData = await getOrders(hostId, status);
      
      // Fetch service and location names for each order for richer display
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
  }, [toast]);

  useEffect(() => {
    const statusFromParams = searchParams.get('status') as OrderStatus | null;
    if (statusFromParams && orderStatuses.includes(statusFromParams)) {
        setSelectedStatusFilter(statusFromParams);
    } else {
        setSelectedStatusFilter("all");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== 'host' || !user.hostId) {
        router.replace('/dashboard');
      } else {
        fetchData(user.hostId, selectedStatusFilter);
      }
    }
  }, [user, authLoading, router, fetchData, selectedStatusFilter]);

  const handleStatusFilterChange = (status: OrderStatus | "all") => {
    setSelectedStatusFilter(status);
    router.push(`/host/orders${status === "all" ? '' : `?status=${status}`}`);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!user?.hostId) return;
    setIsSubmitting(true);
    try {
      await updateOrderStatusInData(orderId, newStatus);
      toast({ title: "Order Status Updated", description: `Order #${orderId.slice(-5)} status changed to ${newStatus}.` });
      fetchData(user.hostId, selectedStatusFilter); // Refresh data
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

  if (isLoading || authLoading) {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <div><Skeleton className="h-10 w-72 mb-2" /><Skeleton className="h-6 w-96" /></div>
                <Skeleton className="h-10 w-48" />
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
        <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedStatusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-[180px] bg-card">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {orderStatuses.map(status => (
                    <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Order List</CardTitle>
          <CardDescription>Total orders ({selectedStatusFilter === "all" ? "All" : selectedStatusFilter}): {orders.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
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
                        <SelectTrigger className="w-[130px] h-9 text-xs">
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

      {/* Order Details Dialog */}
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
           <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)} className="mt-4">Close</Button>
        </DialogContent>
      </Dialog>

    </div>
  );
}

