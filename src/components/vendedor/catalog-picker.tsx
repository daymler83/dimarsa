"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { ShareActions } from "@/components/shared/share-actions";
import { cn } from "@/lib/utils";

type CatalogOption = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  productCount: number;
};

type CatalogPickerProps = {
  sellerCode: string;
  catalogs: CatalogOption[];
};

export function CatalogPicker({ sellerCode, catalogs }: CatalogPickerProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(catalogs[0]?.slug ?? null);

  if (catalogs.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-cream-dark bg-white/60 p-6 text-center text-sm text-muted-foreground">
        Todavía no hay catálogos disponibles para compartir. Avísale al administrador de
        Dimarsa para que arme uno.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-2">
        {catalogs.map((catalog) => {
          const isSelected = catalog.slug === selectedSlug;

          return (
            <button
              key={catalog.id}
              type="button"
              onClick={() => setSelectedSlug(catalog.slug)}
              className={cn(
                "flex flex-col gap-1 rounded-2xl border p-4 text-left transition-colors",
                isSelected ? "border-navy bg-cream/60" : "border-cream-dark bg-white hover:bg-cream/30",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-navy">{catalog.name}</span>
                {isSelected ? <Check className="h-4 w-4 shrink-0 text-navy" /> : null}
              </div>
              {catalog.description ? (
                <p className="text-sm text-muted-foreground">{catalog.description}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">{catalog.productCount} productos</p>
            </button>
          );
        })}
      </div>

      {selectedSlug ? <ShareActions sellerCode={sellerCode} catalogSlug={selectedSlug} /> : null}
    </div>
  );
}
