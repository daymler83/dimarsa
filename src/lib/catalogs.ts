import { prisma } from "@/lib/prisma";

export async function resolveCatalogProducts(catalogId: string) {
  const catalog = await prisma.catalog.findUnique({
    where: { id: catalogId },
    include: {
      categories: { select: { categoryId: true } },
      products: { select: { productId: true } },
    },
  });

  if (!catalog) {
    return [];
  }

  const categoryIds = catalog.categories.map((entry) => entry.categoryId);
  const productIds = catalog.products.map((entry) => entry.productId);

  if (categoryIds.length === 0 && productIds.length === 0) {
    return [];
  }

  return prisma.product.findMany({
    where: {
      active: true,
      OR: [
        ...(categoryIds.length > 0 ? [{ categoryId: { in: categoryIds } }] : []),
        ...(productIds.length > 0 ? [{ id: { in: productIds } }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function countCatalogProducts(catalogId: string) {
  const products = await resolveCatalogProducts(catalogId);
  return products.length;
}
