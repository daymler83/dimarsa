import { CatalogView } from "@/components/catalog/catalog-view";
import { CatalogNotFound } from "@/components/shared/catalog-not-found";
import { prisma } from "@/lib/prisma";

type CatalogPageProps = {
  params: { sellerCode: string };
};

export default async function CatalogPage({ params }: CatalogPageProps) {
  const seller = await prisma.profile.findFirst({
    where: { sellerCode: params.sellerCode, active: true, role: "seller" },
    select: { fullName: true, sellerCode: true },
  });

  if (!seller?.sellerCode) {
    return <CatalogNotFound />;
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const serializedProducts = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price.toString(),
    compareAtPrice: product.compareAtPrice?.toString() ?? null,
    imageUrl: product.imageUrl,
    categoryId: product.categoryId,
  }));

  return (
    <CatalogView
      sellerCode={seller.sellerCode}
      sellerName={seller.fullName}
      products={serializedProducts}
      categories={categories}
    />
  );
}
