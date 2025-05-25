
"use client";

import type { MenuItem } from "@/lib/types";
import NextImage from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, Lock, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext"; // Import useCart
import { useToast } from "@/hooks/use-toast"; // Import useToast for notifications

interface MenuItemCardProps {
  item: MenuItem;
  hostId: string;
  refId: string; // RoomOrTable ID
  isUserLoggedIn: boolean;
}

export function MenuItemCard({ item, hostId, refId, isUserLoggedIn }: MenuItemCardProps) {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const imageUrl = item.imageUrl || 'https://placehold.co/600x400.png?text=Food+Item';
  const imageAiHint = item.imageAiHint || item.name.toLowerCase().split(' ').slice(0,2).join(' ') || 'menu item';
  
  const requiresLoginAndNotLoggedIn = item.loginRequired && !isUserLoggedIn;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent link navigation if card is wrapped in Link
    e.stopPropagation();
    
    if (requiresLoginAndNotLoggedIn) {
      toast({ title: t('loginRequired'), description: t('loginToOrder'), variant: "destructive" });
      // Optionally, redirect to login: router.push(`/login?redirect_url=${pathname}`);
      return;
    }
    if (item.isConfigurable) {
        // For configurable items, we still navigate to the detail page for configuration
        // The actual "add to cart" for configurable items happens on that detail page after configuration
        // So, this button for configurable items should primarily act as a link.
        // We'll rely on the Link component wrapping the card or a separate "Configure" button.
        // This specific button could be "Configure & Add"
         toast({ title: "Configuration requise", description: "Veuillez configurer cet article sur sa page de détail." });
    } else {
        addToCart(item); // Assuming item is a simple MenuItem for direct add
        toast({ title: `${item.name} ajouté au panier !`, description: "Continuez vos achats ou validez votre panier."});
    }
  };

  const cardActionLink = `/client/${hostId}/${refId}/service/${item.id}`; // Note: using 'service' route for items too

  return (
    <Card className={cn(
      "flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full group",
      requiresLoginAndNotLoggedIn && "opacity-80 bg-muted/20",
      !item.isAvailable && "opacity-60 bg-secondary/30 pointer-events-none"
    )}>
      <Link href={cardActionLink} legacyBehavior passHref>
        <a className="flex flex-col h-full">
          <CardHeader className="p-0 relative">
            <div className="relative w-full h-48 group-hover:opacity-90 transition-opacity">
              <NextImage
                src={imageUrl}
                alt={item.name}
                layout="fill"
                objectFit="cover"
                data-ai-hint={imageAiHint}
              />
            </div>
            {requiresLoginAndNotLoggedIn && (
              <div className="absolute top-2 right-2 bg-card text-foreground p-1.5 rounded-full shadow-md border">
                <Lock className="h-4 w-4" title={t('loginRequired')}/>
              </div>
            )}
            {!item.isAvailable && (
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
                {t('servicePrice')}: ${item.price.toFixed(2)}
              </div>
            )}
          </CardContent>
          <CardFooter className="p-3 border-t mt-auto">
            {item.isConfigurable ? (
                <Button className="w-full" variant="outline">
                  Configurer
                </Button>
            ) : (
              <Button 
                className="w-full" 
                onClick={handleAddToCart}
                disabled={requiresLoginAndNotLoggedIn || !item.isAvailable}
              >
                <ShoppingCart className="mr-2 h-4 w-4"/> {requiresLoginAndNotLoggedIn ? t('loginToOrder') : "Ajouter au Panier"}
              </Button>
            )}
          </CardFooter>
        </a>
      </Link>
    </Card>
  );
}


    