// src/app/(publicClient)/layout.tsx
"use client";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LogIn, UserCircle, MessageCircle, ShoppingCart, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/toaster"; // Keep Toaster if it's used by children of this layout
import { useToast } from "@/hooks/use-toast";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { CartProvider, useCart } from "@/context/CartContext";
import { CartSheet } from "@/components/client/CartSheet";
import { Badge } from "@/components/ui/badge";
import React, { useState, useEffect } from 'react';

// HeaderContent remains a separate component as it uses useLanguage and useCart
function HeaderContent() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const { t } = useLanguage();
  const { getTotalItems } = useCart();
  const totalCartItems = getTotalItems();
  const [isMounted, setIsMounted] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const userInitial = user?.nom ? user.nom.charAt(0).toUpperCase() : '?';

  return (
    <>
      <header className="p-4 bg-card/90 backdrop-blur-md shadow-md sticky top-0 z-50 border-b">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
            ConnectHost
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative" 
              onClick={() => setIsCartOpen(true)}
              title={t('viewCart') || "View Cart"}
            >
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
      <CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
}

// New component to render the actual page structure, ensuring it's a child of providers
function PageLayoutContent({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage(); // Safe to call here
  const { toast } = useToast(); // toast is also safe here if needed, or can be in HeaderContent

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-secondary/30">
      <HeaderContent /> {/* HeaderContent will correctly use useLanguage from its parent provider */}
      <main className="flex-grow container mx-auto py-8 px-4 md:px-6 lg:px-8">
        {children}
      </main>
      
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-40 bg-primary hover:bg-primary/90"
        title={t('chatComingSoon') || "Chat with us (Coming Soon)"}
        onClick={() => toast({ title: t('chatFeatureTitle') || "Chat Feature", description: t('chatComingSoon') || "Live chat with the establishment is coming soon!"})}
      >
        <MessageCircle className="h-7 w-7 text-primary-foreground" />
      </Button>

      <footer className="p-6 text-center text-sm text-muted-foreground border-t bg-card/80">
        {t('footerText', { year: new Date().getFullYear().toString() }) || `ConnectHost © ${new Date().getFullYear()} - Seamlessly connecting you to services.`}
      </footer>
    </div>
  );
}

export default function PublicClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // PublicClientLayout now only sets up the providers
  return (
    <LanguageProvider>
      <CartProvider>
        <PageLayoutContent>{children}</PageLayoutContent>
      </CartProvider>
    </LanguageProvider>
  );
}
