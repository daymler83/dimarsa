"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";

type AddToCartButtonProps = {
  sellerCode: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImageUrl: string | null;
  unitPrice: number;
};

export function AddToCartButton({
  sellerCode,
  productId,
  productName,
  productSlug,
  productImageUrl,
  unitPrice,
}: AddToCartButtonProps) {
  const { addItem } = useCart(sellerCode);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    addItem({
      productId,
      productName,
      productSlug,
      productImageUrl,
      unitPrice,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <Button
      type="button"
      onClick={handleAddToCart}
      className="w-full bg-navy text-white hover:bg-navy-light"
    >
      {added ? <Check className="mr-2 h-4 w-4" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
      {added ? "Agregado al carrito" : "Agregar al carrito"}
    </Button>
  );
}
