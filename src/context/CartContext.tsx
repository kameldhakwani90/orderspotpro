
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { MenuItem, Service, CartItem, CartContextType } from '@/lib/types';

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'connectHostCart';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      return storedCart ? JSON.parse(storedCart) : [];
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const addToCart = useCallback((item: MenuItem | Service, options?: Record<string, string | string[]>) => {
    setCartItems(prevItems => {
      // For simplicity now, always add as a new item. Quantity management can be an enhancement.
      // Or, check if item with same ID and options exists, then increment quantity.
      const newItem: CartItem = {
        ...(item as any), // Cast to any to avoid type conflict if MenuItem/Service have slightly different props not in CartItem base
        id: item.id, // Ensure id is correctly passed
        name: 'titre' in item ? item.titre : item.name, // Handle 'titre' for Service and 'name' for MenuItem
        price: item.price || 0, // Ensure price is a number
        quantity: 1,
        uniqueIdInCart: `${item.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`, // Simple unique ID
        selectedOptions: options,
        // finalPrice would be calculated here if options affect price
        finalPrice: options ? calculateFinalPrice(item, options) : item.price,
      };
      return [...prevItems, newItem];
    });
  }, []);
  
  const calculateFinalPrice = (item: MenuItem | Service, options: Record<string, string | string[]>): number => {
      let finalPrice = item.price || 0;
      if ('optionGroups' in item && item.optionGroups && item.isConfigurable) {
          const menuItem = item as MenuItem; // Type assertion
          Object.keys(options).forEach(groupId => {
              const group = menuItem.optionGroups?.find(og => og.id === groupId);
              if (group) {
                  const selectedOptionIds = Array.isArray(options[groupId]) ? options[groupId] as string[] : [options[groupId] as string];
                  selectedOptionIds.forEach(optionId => {
                      const optionDetails = group.options.find(opt => opt.id === optionId);
                      if (optionDetails && optionDetails.priceAdjustment) {
                          finalPrice += optionDetails.priceAdjustment;
                      }
                  });
              }
          });
      }
      return Math.max(0, finalPrice); // Ensure price is not negative
  };


  const removeFromCart = useCallback((uniqueIdInCart: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.uniqueIdInCart !== uniqueIdInCart));
  }, []);

  const updateQuantity = useCallback((uniqueIdInCart: string, newQuantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.uniqueIdInCart === uniqueIdInCart
          ? { ...item, quantity: Math.max(1, newQuantity) } // Ensure quantity is at least 1
          : item
      )
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

    