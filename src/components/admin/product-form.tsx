"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { createCategory } from "@/actions/categories";
import { createProduct, updateProduct, uploadProductImage } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import { productSchema } from "@/lib/validations";

const NEW_CATEGORY_VALUE = "__new__";

type Category = { id: string; name: string };

type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  compareAtPrice: string;
  categoryId: string;
  stock: string;
  imageUrl: string;
};

type ProductFormProps = {
  categories: Category[];
  productId?: string;
  initialValues?: ProductFormValues;
  onSuccess?: () => void;
};

const emptyValues: ProductFormValues = {
  name: "",
  description: "",
  price: "",
  compareAtPrice: "",
  categoryId: "",
  stock: "0",
  imageUrl: "",
};

export function ProductForm({ categories, productId, initialValues, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<ProductFormValues>(initialValues ?? emptyValues);
  const [categoryOptions, setCategoryOptions] = useState(categories);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleCategoryChange(value: string) {
    if (value === NEW_CATEGORY_VALUE) {
      setCreatingCategory(true);
      return;
    }

    setCreatingCategory(false);
    updateField("categoryId", value);
  }

  async function handleCreateCategory() {
    if (newCategoryName.trim().length < 2) {
      setError("Nombre de categoria requerido");
      return;
    }

    const category = await createCategory({ name: newCategoryName.trim() });
    setCategoryOptions((current) => [...current, { id: category.id, name: category.name }]);
    updateField("categoryId", category.id);
    setCreatingCategory(false);
    setNewCategoryName("");
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = productSchema.safeParse({
      name: values.name,
      description: values.description,
      price: values.price,
      compareAtPrice: values.compareAtPrice,
      categoryId: values.categoryId,
      stock: values.stock,
      imageUrl: values.imageUrl,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos invalidos");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = parsed.data.imageUrl;
      const file = fileInputRef.current?.files?.[0];

      if (file) {
        const fileFormData = new FormData();
        fileFormData.set("file", file);
        const uploadResult = await uploadProductImage(fileFormData);

        if (uploadResult.error) {
          setError(uploadResult.error);
          setIsSubmitting(false);
          return;
        }

        imageUrl = uploadResult.url;
      }

      const payload = { ...parsed.data, imageUrl };

      const result = productId
        ? await updateProduct(productId, payload)
        : await createProduct(payload);

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      router.refresh();
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Aceite 5W-30 Sintetico 1L"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripcion</Label>
        <Input
          id="description"
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
          placeholder="Descripcion breve del producto"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Precio</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="1"
            value={values.price}
            onChange={(event) => updateField("price", event.target.value)}
            placeholder="18990"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="compareAtPrice">Precio anterior (opcional)</Label>
          <Input
            id="compareAtPrice"
            type="number"
            min="0"
            step="1"
            value={values.compareAtPrice}
            onChange={(event) => updateField("compareAtPrice", event.target.value)}
            placeholder="21990"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            step="1"
            value={values.stock}
            onChange={(event) => updateField("stock", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={values.categoryId} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una categoria" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
              <SelectItem value={NEW_CATEGORY_VALUE}>+ Crear nueva categoria</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {creatingCategory ? (
        <div className="flex items-end gap-2 rounded-2xl border border-cream-dark p-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor="newCategory">Nueva categoria</Label>
            <Input
              id="newCategory"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="Nombre de la categoria"
            />
          </div>
          <Button type="button" onClick={handleCreateCategory} className="bg-navy text-white hover:bg-navy-light">
            Crear
          </Button>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="imageUrl">URL de imagen</Label>
        <Input
          id="imageUrl"
          value={values.imageUrl}
          onChange={(event) => updateField("imageUrl", event.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageFile">O sube una imagen</Label>
        <Input id="imageFile" type="file" accept="image/*" ref={fileInputRef} />
      </div>

      {values.price ? (
        <p className="text-sm text-muted-foreground">
          Vista previa de precio: {formatPrice(Number(values.price) || 0)}
        </p>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full bg-navy text-white hover:bg-navy-light">
        {isSubmitting ? "Guardando..." : productId ? "Guardar cambios" : "Crear producto"}
      </Button>
    </form>
  );
}
