"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { deleteCatalog } from "@/actions/catalogs";
import { Button } from "@/components/ui/button";

type DeleteCatalogButtonProps = {
  catalogId: string;
  catalogName: string;
};

export function DeleteCatalogButton({ catalogId, catalogName }: DeleteCatalogButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!window.confirm(`¿Eliminar el catálogo "${catalogName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteCatalog(catalogId);

      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={handleClick}
        className="border-error/30 text-error hover:bg-error/5"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}
