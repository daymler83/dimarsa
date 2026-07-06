"use client";

import { useState, useTransition } from "react";

import { toggleProductActive } from "@/actions/products";
import { Button } from "@/components/ui/button";

type ToggleActiveButtonProps = {
  productId: string;
  active: boolean;
};

export function ToggleActiveButton({ productId, active }: ToggleActiveButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await toggleProductActive(productId);

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
        className="border-navy/20 text-navy hover:bg-cream"
      >
        {active ? "Desactivar" : "Activar"}
      </Button>
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}
