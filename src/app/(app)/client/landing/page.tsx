
"use client";

import { QrCode, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link"; // Import Link
import { useAuth } from "@/context/AuthContext"; // For potential logout
import { useRouter } from "next/navigation"; // For redirecting

export default function ClientLandingPage() {
  const { user, logout } = useAuth(); // Get user and logout function
  const router = useRouter();

  const handleLogout = () => {
    logout(); // Call logout from useAuth
    router.push('/login'); // Redirect to login page
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-6">
      <Card className="w-full max-w-md text-center shadow-2xl">
        <CardHeader>
          <div className="mx-auto p-4 bg-primary rounded-full w-fit mb-4">
            <QrCode className="h-10 w-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to ConnectHost</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            To access services, please scan a QR code provided by your host.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            If you are a host or admin, please log out and sign in with your respective account.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" passHref>
              <Button variant="outline" className="w-full sm:w-auto">
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Button>
            </Link>
            {user && ( // Only show logout if user is logged in
              <Button onClick={handleLogout} variant="destructive" className="w-full sm:w-auto">
                Log Out
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <p className="mt-8 text-sm text-muted-foreground">
        ConnectHost - Seamlessly connecting you to services.
      </p>
    </div>
  );
}
