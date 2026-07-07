import { notFound } from "next/navigation";

import { CatalogForm } from "@/components/admin/catalog-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

type EditCatalogPageProps = {
  params: { id: string };
};

export default async function EditCatalogPage({ params }: EditCatalogPageProps) {
  const [catalog, categories, products] = await Promise.all([
    prisma.catalog.findUnique({
      where: { id: params.id },
      include: {
        categories: { select: { categoryId: true } },
        products: { select: { productId: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true, categoryId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!catalog) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Card className="border-white/70 bg-white/95 shadow-brand">
          <CardHeader>
            <CardTitle className="text-navy">Editar catálogo</CardTitle>
          </CardHeader>
          <CardContent>
            <CatalogForm
              categories={categories}
              products={products}
              catalogId={catalog.id}
              initialValues={{
                name: catalog.name,
                description: catalog.description ?? "",
                isActive: catalog.isActive,
                categoryIds: catalog.categories.map((entry) => entry.categoryId),
                productIds: catalog.products.map((entry) => entry.productId),
              }}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
