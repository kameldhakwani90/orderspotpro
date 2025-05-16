
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building2, UserCog, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const StatCard = ({ title, value, icon: Icon, link, description }: { title: string, value: string | number, icon: React.ElementType, link?: string, description?: string }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
      {link && (
        <Link href={link} className="text-sm text-primary hover:underline mt-2 block">
          View Details
        </Link>
      )}
    </CardContent>
  </Card>
);

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') {
      router.replace('/dashboard'); // Redirect if not admin
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'admin') {
    return <div className="p-6">Loading admin data or unauthorized...</div>;
  }
  
  // Mock data for stats - replace with actual data fetching
  const stats = {
    totalUsers: 150,
    totalHosts: 25,
    totalSites: 40,
    activeServices: 300,
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-lg text-muted-foreground">Oversee and manage ConnectHost operations.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} description="All registered users" />
        <StatCard title="Active Hosts" value={stats.totalHosts} icon={UserCog} description="Verified host accounts" />
        <StatCard title="Managed Sites" value={stats.totalSites} icon={Building2} description="Hotels, restaurants, etc." />
        <StatCard title="Services Offered" value={stats.activeServices} icon={BarChart3} description="Across all hosts" />
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Quick Management</CardTitle>
            <CardDescription>Access key administrative functions.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/admin/users" className="block p-4 bg-secondary hover:bg-accent rounded-lg transition-colors">
              <div className="flex items-center">
                <Users className="h-6 w-6 mr-3 text-primary" />
                <span className="font-semibold text-foreground">Manage Users</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">View, edit, and create user accounts.</p>
            </Link>
            <Link href="/admin/hosts" className="block p-4 bg-secondary hover:bg-accent rounded-lg transition-colors">
              <div className="flex items-center">
                <UserCog className="h-6 w-6 mr-3 text-primary" />
                <span className="font-semibold text-foreground">Manage Hosts</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Approve, monitor, and manage host profiles.</p>
            </Link>
            <Link href="/admin/sites" className="block p-4 bg-secondary hover:bg-accent rounded-lg transition-colors">
              <div className="flex items-center">
                <Building2 className="h-6 w-6 mr-3 text-primary" />
                <span className="font-semibold text-foreground">Manage Global Sites</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Oversee all registered sites and establishments.</p>
            </Link>
             <Link href="/admin/system-health" className="block p-4 bg-secondary hover:bg-accent rounded-lg transition-colors">
              <div className="flex items-center">
                <BarChart3 className="h-6 w-6 mr-3 text-primary" />
                <span className="font-semibold text-foreground">System Analytics</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">View platform usage and performance metrics.</p>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Overview of recent platform events.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for recent activity feed */}
            <ul className="space-y-3">
              <li className="text-sm"><span className="font-semibold">New Host Registration:</span> "Sunny Hotel" pending approval.</li>
              <li className="text-sm"><span className="font-semibold">User Reported Issue:</span> Client unable to submit order for "Restaurant X".</li>
              <li className="text-sm"><span className="font-semibold">System Update:</span> Scheduled maintenance at 2 AM.</li>
            </ul>
            <Button variant="outline" className="mt-4 w-full">View All Activity</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
