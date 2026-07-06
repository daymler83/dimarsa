import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

type EditProductPageProps = {
  params: { id: string };
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id: params.id } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Card className="border-white/70 bg-white/95 shadow-brand">
          <CardHeader>
            <CardTitle className="text-navy">Editar producto</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              categories={categories}
              productId={product.id}
              initialValues={{
                name: product.name,
                description: product.description ?? "",
                price: product.price.toString(),
                compareAtPrice: product.compareAtPrice?.toString() ?? "",
                categoryId: product.categoryId ?? "",
                stock: product.stock.toString(),
                imageUrl: product.imageUrl ?? "",
              }}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
