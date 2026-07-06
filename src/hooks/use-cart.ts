"use client";

import { useEffect, useState } from "react";

export type CartItem = {
  productId: string;
  productName: string;
  productSlug: string;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  sellerCode: string;
};

function loadCart(sellerCode: string): CartState {
  if (typeof window === "undefined") {
    return { items: [], sellerCode };
  }

  const stored = window.localStorage.getItem(`cart_${sellerCode}`);

  if (!stored) {
    return { items: [], sellerCode };
  }

  try {
    return JSON.parse(stored) as CartState;
  } catch {
    return { items: [], sellerCode };
  }
}

export function useCart(sellerCode: string) {
  const [cart, setCart] = useState<CartState>(() => loadCart(sellerCode));

  useEffect(() => {
    setCart(loadCart(sellerCode));
  }, [sellerCode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(`cart_${sellerCode}`, JSON.stringify(cart));
  }, [cart, sellerCode]);

  function addItem(product: CartItem) {
    setCart((current) => {
      const existing = current.items.find((item) => item.productId === product.productId);

      if (existing) {
        return {
          ...current,
          items: current.items.map((item) =>
            item.productId === product.productId
              ? { ...item, quantity: item.quantity + product.quantity }
              : item,
          ),
        };
      }

      return { ...current, items: [...current.items, product] };
    });
  }

  function removeItem(productId: string) {
    setCart((current) => ({
      ...current,
      items: current.items.filter((item) => item.productId !== productId),
    }));
  }

  function updateQuantity(productId: string, quantity: number) {
    setCart((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    }));
  }

  function clearCart() {
    setCart({ items: [], sellerCode });
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return { cart, addItem, removeItem, updateQuantity, clearCart, subtotal, itemCount };
}
