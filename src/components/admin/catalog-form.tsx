"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { createCatalog, updateCatalog } from "@/actions/catalogs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { catalogSchema } from "@/lib/validations";

type Category = { id: string; name: string };
type Product = { id: string; name: string; categoryId: string | null };

type CatalogFormValues = {
  name: string;
  description: string;
  isActive: boolean;
  categoryIds: string[];
  productIds: string[];
};

type CatalogFormProps = {
  categories: Category[];
  products: Product[];
  catalogId?: string;
  initialValues?: CatalogFormValues;
  onSuccess?: () => void;
};

const emptyValues: CatalogFormValues = {
  name: "",
  description: "",
  isActive: true,
  categoryIds: [],
  productIds: [],
};

export function CatalogForm({ categories, products, catalogId, initialValues, onSuccess }: CatalogFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<CatalogFormValues>(initialValues ?? emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const productsByCategory = useMemo(() => {
    const groups = new Map<string, Product[]>();

    for (const product of products) {
      const key = product.categoryId ?? "sin-categoria";
      const current = groups.get(key) ?? [];
      current.push(product);
      groups.set(key, current);
    }

    return groups;
  }, [products]);

  function toggleCategory(categoryId: string) {
    setValues((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId],
    }));
  }

  function toggleProduct(productId: string) {
    setValues((current) => ({
      ...current,
      productIds: current.productIds.includes(productId)
        ? current.productIds.filter((id) => id !== productId)
        : [...current.productIds, productId],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = catalogSchema.safeParse(values);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }

    setIsSubmitting(true);

    const result = catalogId
      ? await updateCatalog(catalogId, parsed.data)
      : await createCatalog(parsed.data);

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
    onSuccess?.();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          placeholder="Tecnología y Hogar"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Input
          id="description"
          value={values.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
          placeholder="Electrónica y artículos para el hogar"
        />
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-cream-dark p-3">
        <Label htmlFor="isActive" className="cursor-pointer">
          Catálogo activo
        </Label>
        <Switch
          id="isActive"
          checked={values.isActive}
          onCheckedChange={(checked) => setValues((current) => ({ ...current, isActive: checked }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Categorías completas</Label>
        <div className="max-h-40 space-y-2 overflow-y-auto rounded-2xl border border-cream-dark p-3">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 text-sm text-navy">
              <Checkbox
                checked={values.categoryIds.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              {category.name}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Productos sueltos</Label>
        <div className="max-h-64 space-y-3 overflow-y-auto rounded-2xl border border-cream-dark p-3">
          {categories.map((category) => {
            const categoryProducts = productsByCategory.get(category.id) ?? [];

            if (categoryProducts.length === 0) {
              return null;
            }

            return (
              <div key={category.id} className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {category.name}
                </p>
                {categoryProducts.map((product) => (
                  <label key={product.id} className="flex items-center gap-2 text-sm text-navy">
                    <Checkbox
                      checked={values.productIds.includes(product.id)}
                      onCheckedChange={() => toggleProduct(product.id)}
                    />
                    {product.name}
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full bg-navy text-white hover:bg-navy-light">
        {isSubmitting ? "Guardando..." : catalogId ? "Guardar cambios" : "Crear catálogo"}
      </Button>
    </form>
  );
}
