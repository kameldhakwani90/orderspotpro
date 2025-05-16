
"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button"; // Ensure Button is imported if needed by other parts later, or remove if truly minimal
import Link from "next/link";

// Minimal StatCard or remove entirely for first test
const StatCard = ({ title, value, description }: { title: string, value: string | number, description?: string }) => (
  <div className="border p-4 rounded-md shadow">
    <h3 className="text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold">{value}</p>
    {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
  </div>
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
  
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Admin Dashboard (Minimal)</h1>
        <p className="text-lg text-muted-foreground">If you see this, the basic page structure loaded.</p>
      </div>
      <StatCard title="Test Stat" value={1} description="A simple test card" />
       <Link href="/">
          <Button variant="outline" className="mt-4">Back to Home (Test)</Button>
        </Link>
    </div>
  );
}
