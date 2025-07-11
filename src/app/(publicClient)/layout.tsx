// src/app/(publicClient)/layout.tsx
"use client";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LogIn, Settings, Home } from "lucide-react";
import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/toaster"; // Ensure Toaster is here if not in root layout

export default function PublicClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  const userInitial = user?.nom ? user.nom.charAt(0).toUpperCase() : '?';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-secondary/30">
      <header className="p-4 bg-card/90 backdrop-blur-md shadow-md sticky top-0 z-50 border-b">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
            ConnectHost
          </Link>
          <div className="flex items-center gap-2">
            {!isLoading && (
              <>
                {user ? (
                  <Link href="/settings">
                    <Button variant="ghost" className="flex items-center gap-2 px-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://placehold.co/100x100.png?text=${userInitial}`} alt={user.nom || 'User'} data-ai-hint="user initial"/>
                        <AvatarFallback>{userInitial}</AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline font-medium">{user.nom}</span>
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/login?redirect_url=${encodeURIComponent(pathname)}`}>
                    <Button variant="outline" className="bg-primary/10 hover:bg-primary/20 border-primary/50 text-primary">
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Button>
                  </Link>
                )}
              </>
            )}
             {isLoading && (
                <div className="h-9 w-24 bg-muted rounded-md animate-pulse"></div>
             )}
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto py-8 px-4 md:px-6 lg:px-8">
        {children}
      </main>
      <footer className="p-6 text-center text-sm text-muted-foreground border-t bg-card/80">
        ConnectHost &copy; {new Date().getFullYear()} - Seamlessly connecting you to services.
      </footer>
      {/* Toaster might be in RootLayout, if not, uncomment or add it here */}
      {/* <Toaster /> */}
    </div>
  );
}
