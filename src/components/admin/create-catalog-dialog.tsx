"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { CatalogForm } from "@/components/admin/catalog-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Category = { id: string; name: string };
type Product = { id: string; name: string; categoryId: string | null };

type CreateCatalogDialogProps = {
  categories: Category[];
  products: Product[];
};

export function CreateCatalogDialog({ categories, products }: CreateCatalogDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" className="bg-navy text-white hover:bg-navy-light" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Nuevo catálogo
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo catálogo</DialogTitle>
        </DialogHeader>
        <CatalogForm categories={categories} products={products} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
