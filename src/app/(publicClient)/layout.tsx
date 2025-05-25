// src/app/(publicClient)/layout.tsx
"use client";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LogIn, UserCircle, MessageCircle, ShoppingCart } from "lucide-react";
import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { CartProvider, useCart } from "@/context/CartContext";
import { Badge } from "@/components/ui/badge";
import React, { useState, useEffect } from 'react'; // Added useState and useEffect

function HeaderContent() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const { t } = useLanguage();
  const { getTotalItems } = useCart();
  const totalCartItems = getTotalItems();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const userInitial = user?.nom ? user.nom.charAt(0).toUpperCase() : '?';

  return (
    <header className="p-4 bg-card/90 backdrop-blur-md shadow-md sticky top-0 z-50 border-b">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
          ConnectHost
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" className="relative" onClick={() => { /* Logic to open cart summary (e.g., a Popover or Sheet) will be here later */ console.log("Cart icon clicked") }}>
            <ShoppingCart className="h-5 w-5" />
            {isMounted && totalCartItems > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                {totalCartItems}
              </Badge>
            )}
          </Button>
          {!isLoading && (
            <>
              {user ? (
                <Link href="/settings">
                  <Button variant="ghost" className="flex items-center gap-2 px-2 sm:px-3">
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
                    {t('login')}
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
  );
}


export default function PublicClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toast } = useToast();

  return (
    <LanguageProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-secondary/30">
          <HeaderContent />
          <main className="flex-grow container mx-auto py-8 px-4 md:px-6 lg:px-8">
            {children}
          </main>
          
          <Button
            variant="default"
            size="icon"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-40 bg-primary hover:bg-primary/90"
            title="Chat with us (Coming Soon)"
            onClick={() => toast({ title: "Chat Feature", description: "Live chat with the establishment is coming soon!"})}
          >
            <MessageCircle className="h-7 w-7 text-primary-foreground" />
          </Button>

          <footer className="p-6 text-center text-sm text-muted-foreground border-t bg-card/80">
            ConnectHost &copy; {new Date().getFullYear()} - Seamlessly connecting you to services.
          </footer>
        </div>
      </CartProvider>
    </LanguageProvider>
  );
}
