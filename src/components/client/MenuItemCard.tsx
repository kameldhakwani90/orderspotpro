
// src/components/client/MenuItemCard.tsx
"use client";

import type { MenuItem } from "@/lib/types";
import NextImage from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, Lock, ShoppingCart, Box, Settings } from "lucide-react"; // Added Settings
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge"; 

interface MenuItemCardProps {
  item: MenuItem;
  hostId: string;
  refId: string; 
  isUserLoggedIn: boolean;
}

export function MenuItemCard({ item, hostId, refId, isUserLoggedIn }: MenuItemCardProps) {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const imageUrl = item.imageUrl || 'https://placehold.co/300x200.png?text=Food+Item';
  const imageAiHint = item.imageAiHint || item.name.toLowerCase().split(' ').slice(0,2).join(' ') || 'menu item';
  
  const requiresLoginAndNotLoggedIn = item.loginRequired && !isUserLoggedIn;
  const isOutOfStock = item.stock === 0;
  const isLimitedStock = item.stock !== undefined && item.stock > 0 && item.stock < 5;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    if (requiresLoginAndNotLoggedIn) {
      toast({ title: t('loginRequired') || "Login Required", description: t('loginToOrder') || "Please log in to order this item.", variant: "destructive" });
      // Ideally, redirect to login with return URL. For now, just a toast.
      return;
    }
    if (isOutOfStock) {
      toast({ title: t('stockStatusOutOfStock') || "Out of Stock", description: "This item is currently unavailable.", variant: "destructive" });
      return;
    }
    if (item.isConfigurable) {
      // Should not happen if button text is "Configure", this is a fallback.
      toast({ title: "Configuration requise", description: "Veuillez configurer cet article sur sa page de détail." });
    } else {
        addToCart(item); 
        toast({ title: `${item.name} ${t('addToCart') || "added to cart"} !`, description: "Continue shopping or view your cart."});
    }
  };

  const cardActionLink = `/client/${hostId}/${refId}/service/${item.id}`; 

  return (
    <Card className={cn(
      "flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full group",
      (requiresLoginAndNotLoggedIn || isOutOfStock || !item.isAvailable) && "opacity-70 bg-muted/20",
      !item.isAvailable && "pointer-events-none"
    )}>
      <Link href={cardActionLink} legacyBehavior passHref>
        <a className="flex flex-col h-full">
          <CardHeader className="p-0 relative">
            <div className="relative w-full h-48 group-hover:opacity-90 transition-opacity">
              <NextImage
                src={imageUrl}
                alt={item.name}
                fill
                style={{objectFit:"cover"}}
                data-ai-hint={imageAiHint}
              />
            </div>
            {requiresLoginAndNotLoggedIn && (
              <div className="absolute top-2 right-2 bg-card text-foreground p-1.5 rounded-full shadow-md border">
                <Lock className="h-4 w-4" title={t('loginRequired') || "Login required"}/>
              </div>
            )}
            {isOutOfStock && (
               <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge variant="destructive" className="text-lg">{t('stockStatusOutOfStock') || "Out of Stock"}</Badge>
              </div>
            )}
             {!isOutOfStock && isLimitedStock && (
              <Badge variant="outline" className="absolute top-2 left-2 bg-amber-500/20 text-amber-700 border-amber-400 text-xs">
                <Box className="h-3 w-3 mr-1"/> {t('stockStatusLimited') || "Limited Stock"}
              </Badge>
            )}
            {!item.isAvailable && !isOutOfStock && (
               <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">Indisponible</span>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-3 flex-grow">
            <CardTitle className="text-md sm:text-lg mb-1 line-clamp-2">{item.name}</CardTitle>
            {item.description && (
              <CardDescription className="text-xs text-muted-foreground mb-2 line-clamp-2 h-8">
                {item.description}
              </CardDescription>
            )}
            {item.price !== undefined && (
              <div className="flex items-center text-md font-semibold text-primary mt-1">
                <Tag className="h-4 w-4 mr-1.5" />
                {item.isConfigurable ? (t('priceFrom') || "From") : (t('servicePrice') || "Price")}: {(item.currency || '$')}{item.price.toFixed(2)}
              </div>
            )}
          </CardContent>
          <CardFooter className="p-3 border-t mt-auto">
            {item.isConfigurable ? (
                // Link wrapper handles navigation, button is for styling & disabled state
                <Button className="w-full" variant="outline" disabled={isOutOfStock || !item.isAvailable || requiresLoginAndNotLoggedIn}>
                  <Settings className="mr-2 h-4 w-4"/>
                  <span>{requiresLoginAndNotLoggedIn ? t('loginToOrder') : t('configure')}</span>
                </Button>
            ) : (
              <Button 
                className="w-full" 
                onClick={handleAddToCart} // This button triggers action
                disabled={requiresLoginAndNotLoggedIn || isOutOfStock || !item.isAvailable}
              >
                <ShoppingCart className="mr-2 h-4 w-4"/> 
                <span>{requiresLoginAndNotLoggedIn ? t('loginToOrder') : t('addToCart')}</span>
              </Button>
            )}
          </CardFooter>
        </a>
      </Link>
    </Card>
  );
}
