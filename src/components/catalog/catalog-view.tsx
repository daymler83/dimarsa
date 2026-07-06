"use client";

import { useMemo, useState } from "react";

import { CategoryFilter } from "@/components/catalog/category-filter";
import { ProductGrid } from "@/components/catalog/product-grid";
import { FloatingCartButton } from "@/components/shared/floating-cart-button";
import { useSellerCode } from "@/hooks/use-seller-code";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: string;
  compareAtPrice: string | null;
  imageUrl: string | null;
  categoryId: string | null;
};

type Category = {
  id: string;
  name: string;
};

type CatalogViewProps = {
  sellerCode: string;
  sellerName: string;
  products: Product[];
  categories: Category[];
};

export function CatalogView({ sellerCode, sellerName, products, categories }: CatalogViewProps) {
  useSellerCode(sellerCode);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) {
      return products;
    }

    return products.filter((product) => product.categoryId === selectedCategoryId);
  }, [products, selectedCategoryId]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Dimarsa</p>
        <h1 className="text-2xl font-semibold text-navy sm:text-3xl">Catálogo de {sellerName}</h1>
      </header>

      <CategoryFilter
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
      />

      <ProductGrid sellerCode={sellerCode} products={filteredProducts} />

      <FloatingCartButton sellerCode={sellerCode} />
    </div>
  );
}
