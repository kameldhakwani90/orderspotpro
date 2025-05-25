// src/components/client/CartSheet.tsx
"use client";

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/context/CartContext";
import type { CartItem } from "@/lib/types";
import NextImage from 'next/image';
import { MinusCircle, PlusCircle, Trash2, ShoppingBag, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addOrder } from '@/lib/data';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { toast } = useToast();
  const params = useParams();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const hostId = params.hostId as string;
  const refId = params.refId as string; // Current location ID

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast({ title: t('stockStatusOutOfStock', { itemName: 'Panier vide' }), description: "Veuillez ajouter des articles à votre panier avant de passer commande.", variant: "destructive" });
      return;
    }
    if (!hostId || !refId) {
        toast({ title: "Erreur de contexte", description: "Impossible de déterminer l'établissement ou le lieu pour cette commande. Veuillez réessayer depuis la page du lieu.", variant: "destructive" });
        console.error("Missing hostId or refId for placing order from cart", { hostId, refId, params });
        return;
    }

    setIsSubmittingOrder(true);
    try {
      for (const item of cartItems) {
        // Ensure price is a number
        const priceForOrder = typeof item.finalPrice === 'number' ? item.finalPrice : (typeof item.price === 'number' ? item.price : 0);

        await addOrder({
          serviceId: item.id, // serviceId is the MenuItem's ID
          hostId: hostId,
          chambreTableId: refId, // Assuming order is for the current location context
          clientNom: user?.nom, // Use logged-in user's name if available
          userId: user?.id, // Use logged-in user's ID if available
          donneesFormulaire: JSON.stringify(item.selectedOptions || {}),
          prixTotal: priceForOrder * item.quantity, // Total price for this line item (unit price * quantity)
          // currency is handled by addOrder based on host settings
        });
      }
      toast({ title: "Commande Passée !", description: "Votre commande a été envoyée avec succès." });
      clearCart();
      onOpenChange(false); // Close the sheet
    } catch (error) {
      console.error("Failed to submit order from cart:", error);
      toast({ title: "Échec de la Commande", description: "Une erreur s'est produite lors de la soumission de votre commande.", variant: "destructive" });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <SheetTitle className="text-2xl font-semibold text-foreground flex items-center">
            <ShoppingBag className="mr-2 h-6 w-6 text-primary" />
            Mon Panier
          </SheetTitle>
          <SheetDescription>
            Vérifiez les articles de votre commande.
          </SheetDescription>
        </SheetHeader>
        
        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <ShoppingBag className="h-20 w-20 text-muted-foreground/50 mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">Votre panier est vide.</p>
            <p className="text-sm text-muted-foreground">Ajoutez des articles pour commencer.</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 my-4 px-4 sm:px-6">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.uniqueIdInCart} className="flex items-start gap-4 p-3 border rounded-lg bg-card shadow-sm">
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                    <NextImage
                      src={item.imageUrl || `https://placehold.co/100x100.png?text=${item.name.charAt(0)}`}
                      alt={item.name}
                      fill // Changed from layout="fill"
                      style={{objectFit:"cover"}} // Added style for objectFit
                      data-ai-hint={item.imageAiHint || "product image"}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-base font-medium text-foreground truncate" title={item.name}>{item.name}</h4>
                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                        {Object.entries(item.selectedOptions).map(([groupId, optionValue]) => {
                           const group = 'optionGroups' in item && Array.isArray(item.optionGroups)
                            ? item.optionGroups.find(og => og.id === groupId || og.name === groupId)
                            : undefined;
                          const groupDisplayName = group?.name || groupId;
                          
                          let optionDisplayValue = '';
                          if (Array.isArray(optionValue)) {
                            optionDisplayValue = optionValue.map(val => group?.options.find(opt => opt.id === val)?.name || val).join(', ');
                          } else if (group && group.options) {
                            optionDisplayValue = group.options.find(opt => opt.id === optionValue)?.name || String(optionValue);
                          } else {
                            optionDisplayValue = String(optionValue);
                          }

                          return (
                            <p key={groupId} className="truncate">
                              <span className="font-medium">{groupDisplayName}:</span>{' '}
                              {optionDisplayValue}
                            </p>
                          );
                        })}
                      </div>
                    )}
                     <p className="text-sm font-semibold text-primary mt-1">
                      ${(item.finalPrice || item.price || 0).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => updateQuantity(item.uniqueIdInCart, item.quantity - 1)} disabled={item.quantity <= 1}>
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => updateQuantity(item.uniqueIdInCart, item.quantity + 1)} disabled={item.stock !== undefined && item.quantity >= item.stock}>
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive self-start" onClick={() => removeFromCart(item.uniqueIdInCart)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {cartItems.length > 0 && (
          <SheetFooter className="px-4 pb-4 sm:px-6 sm:pb-6 border-t mt-auto pt-4">
            <div className="w-full space-y-3">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span className="text-primary">${getCartTotal().toFixed(2)}</span>
              </div>
              <Button
                onClick={handlePlaceOrder}
                className="w-full text-base py-3 h-auto"
                disabled={isSubmittingOrder || cartItems.length === 0}
                size="lg"
              >
                {isSubmittingOrder ? "Traitement de la commande..." : "Passer la Commande"}
              </Button>
            </div>
          </SheetFooter>
        )}
         <SheetClose asChild className="sm:hidden absolute top-4 right-4">
            <Button variant="ghost" size="icon"><X className="h-5 w-5"/></Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}

    