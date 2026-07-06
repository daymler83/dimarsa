"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { useCart } from "@/hooks/use-cart";

type FloatingCartButtonProps = {
  sellerCode: string;
};

export function FloatingCartButton({ sellerCode }: FloatingCartButtonProps) {
  const { itemCount } = useCart(sellerCode);

  if (itemCount === 0) {
    return null;
  }

  return (
    <Link
      href={`/c/${sellerCode}/carrito`}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-navy text-white shadow-brand transition-transform hover:scale-105"
    >
      <ShoppingCart className="h-6 w-6" />
      <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-semibold text-navy">
        {itemCount}
      </span>
    </Link>
  );
}
