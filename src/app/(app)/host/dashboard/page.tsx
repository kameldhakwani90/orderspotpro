
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ListChecks, FileText, ClipboardList, ShoppingCart, BarChart3, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Order, Service } from "@/lib/types";
import { getOrders, getServices } from "@/lib/data"; // Mock data functions

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
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalServices: 0,
    locations: 0, // Example: number of rooms/tables
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!isLoading && user?.role !== 'host') {
      router.replace('/dashboard'); // Redirect if not host
    }
    if (user?.hostId) {
      const fetchData = async () => {
        const ordersData = await getOrders(user.hostId!);
        const servicesData = await getServices(user.hostId!);
        // const locationsData = await getRoomsOrTables(user.hostId!); // Assuming this function exists

        setStats({
          totalOrders: ordersData.length,
          pendingOrders: ordersData.filter(o => o.status === 'pending').length,
          totalServices: servicesData.length,
          locations: 5, // Mocked: locationsData.length,
        });
        setRecentOrders(ordersData.slice(0, 3));
      };
      fetchData();
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'host') {
    return <div className="p-6">Loading host data or unauthorized...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Host Dashboard</h1>
          <p className="text-lg text-muted-foreground">Manage your services and customer interactions.</p>
        </div>
        <Link href="/host/services/new">
          <Button size="lg">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Service
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} link="/host/orders" buttonText="View Orders"/>
        <StatCard title="Pending Orders" value={stats.pendingOrders} icon={ShoppingCart} link="/host/orders?status=pending" buttonText="View Pending"/>
        <StatCard title="Active Services" value={stats.totalServices} icon={ClipboardList} link="/host/services" buttonText="Manage Services" />
        <StatCard title="My Locations" value={stats.locations} icon={MapPin} link="/host/locations" buttonText="Manage Locations"/>
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
                      <span className={`px-2 py-0.5 rounded-full text-xs ${order.status === 'pending' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>{order.status}</span>
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
