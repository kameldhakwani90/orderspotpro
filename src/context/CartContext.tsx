
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { MenuItem, Service, CartItem, CartContextType } from '@/lib/types'; // Service is kept for type union if needed, but addToCart will focus on MenuItem

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'connectHostCart';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      try {
        return storedCart ? JSON.parse(storedCart) : [];
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems]);
  
  const calculateFinalPrice = (item: MenuItem, options?: Record<string, string | string[]>): number => {
      let finalPrice = item.price; // MenuItem always has price
      if (item.isConfigurable && item.optionGroups && options) {
          item.optionGroups.forEach(group => {
              const selection = options[group.id];
              if (selection) {
                  if (Array.isArray(selection)) {
                      selection.forEach(optionId => {
                          const optionDetails = group.options.find(opt => opt.id === optionId);
                          if (optionDetails && optionDetails.priceAdjustment) {
                              finalPrice += optionDetails.priceAdjustment;
                          }
                      });
                  } else { 
                      const optionDetails = group.options.find(opt => opt.id === selection);
                      if (optionDetails && optionDetails.priceAdjustment) {
                          finalPrice += optionDetails.priceAdjustment;
                      }
                  }
              }
          });
      }
      return Math.max(0, finalPrice); 
  };

  const addToCart = useCallback((item: MenuItem, options?: Record<string, string | string[]>, preCalculatedFinalPrice?: number) => {
    setCartItems(prevItems => {
      const finalPrice = preCalculatedFinalPrice !== undefined 
        ? preCalculatedFinalPrice
        : calculateFinalPrice(item, options);

      const newItem: CartItem = {
        ...item, 
        id: item.id, 
        name: item.name, 
        price: item.price, 
        quantity: 1,
        uniqueIdInCart: `${item.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        selectedOptions: options,
        finalPrice: finalPrice,
        // Ensure all other MenuItem properties are spread
        imageUrl: item.imageUrl,
        imageAiHint: item.imageAiHint,
        menuCategoryId: item.menuCategoryId,
        hostId: item.hostId,
        isConfigurable: item.isConfigurable,
        optionGroups: item.optionGroups,
        isAvailable: item.isAvailable,
        loginRequired: item.loginRequired,
        pointsRequis: item.pointsRequis,
        stock: item.stock,
        currency: item.currency // Assuming MenuItem might have currency
      };
      return [...prevItems, newItem];
    });
  }, []);


  const removeFromCart = useCallback((uniqueIdInCart: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.uniqueIdInCart !== uniqueIdInCart));
  }, []);

  const updateQuantity = useCallback((uniqueIdInCart: string, newQuantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.uniqueIdInCart === uniqueIdInCart) {
          const quantity = Math.max(1, newQuantity);
          // Optional: Check against stock if item is a MenuItem and has stock
          if ('stock' in item && item.stock !== undefined && quantity > item.stock) {
            // Potentially show a toast here or prevent update
            console.warn(`Cannot update quantity for ${item.name} beyond stock: ${item.stock}`);
            return { ...item, quantity: item.stock }; // Set to max stock
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartTotal = useCallback((): number => {
    return cartItems.reduce((total, item) => total + (item.finalPrice || item.price || 0) * item.quantity, 0);
  }, [cartItems]);

  const getTotalItems = useCallback((): number => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getTotalItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
