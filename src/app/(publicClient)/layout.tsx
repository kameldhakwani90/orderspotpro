// src/app/(publicClient)/layout.tsx
"use client";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LogIn, ShoppingCart, X } from "lucide-react"; // Removed UserCircle, MessageCircle
import { usePathname, useRouter } from "next/navigation"; // Added useRouter
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext"; // LanguageProvider removed from here
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useCart } from "@/context/CartContext"; // CartProvider removed from here
import { CartSheet } from "@/components/client/CartSheet";
import { Badge } from "@/components/ui/badge";
import React, { useState, useEffect } from 'react';

function HeaderContent() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter(); // Added router for programmatic navigation
  const { t } = useLanguage();
  const { getTotalItems } = useCart();
  const totalCartItems = getTotalItems();
  const [isMounted, setIsMounted] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const userInitial = user?.nom ? user.nom.charAt(0).toUpperCase() : '?';
  const loginRedirectUrl = typeof window !== 'undefined' ? `${pathname}${window.location.search}` : pathname;


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
                  <Button variant="outline" className="bg-primary/10 hover:bg-primary/20 border-primary/50 text-primary" onClick={() => router.push(`/login?redirect_url=${encodeURIComponent(loginRedirectUrl)}`)}>
                    <LogIn className="mr-2 h-4 w-4" />
                    {t('login')}
                  </Button>
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

function PageLayoutContent({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const { toast } = useToast(); // toast is used here

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-secondary/30">
      <HeaderContent />
      <main className="flex-grow container mx-auto py-8 px-4 md:px-6 lg:px-8">
        {children}
      </main>
      
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-40 bg-primary hover:bg-primary/90 print:hidden"
        title={t('chatComingSoon') || "Chat with us (Coming Soon)"}
        onClick={() => toast({ title: t('chatFeatureTitle') || "Chat Feature", description: t('chatComingSoon') || "Live chat with the establishment is coming soon!"})}
      >
        {/* Using MessageSquare as a more common chat icon than MessageCircle for filled look */}
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square-text text-primary-foreground"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7"/><path d="M17 12H7"/></svg>
      </Button>

      <footer className="p-6 text-center text-sm text-muted-foreground border-t bg-card/80 print:hidden">
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
  return (
    // LanguageProvider and CartProvider are now in RootLayout
    <PageLayoutContent>{children}</PageLayoutContent>
  );
}
