import { CatalogView } from "@/components/catalog/catalog-view";
import { CatalogNotFound } from "@/components/shared/catalog-not-found";
import { resolveCatalogProducts } from "@/lib/catalogs";
import { prisma } from "@/lib/prisma";

type CatalogPageProps = {
  params: { sellerCode: string; catalogSlug: string };
};

export default async function CatalogPage({ params }: CatalogPageProps) {
  const seller = await prisma.profile.findFirst({
    where: { sellerCode: params.sellerCode, active: true, role: "seller" },
    select: { fullName: true, sellerCode: true },
  });

  if (!seller?.sellerCode) {
    return <CatalogNotFound />;
  }

  const catalog = await prisma.catalog.findFirst({
    where: { slug: params.catalogSlug, isActive: true },
  });

  if (!catalog) {
    return <CatalogNotFound />;
  }

  const products = await resolveCatalogProducts(catalog.id);

  const categoryIds = [
    ...new Set(products.map((product) => product.categoryId).filter((id): id is string => Boolean(id))),
  ];

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    orderBy: { sortOrder: "asc" },
  });

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
      catalogSlug={catalog.slug}
      catalogId={catalog.id}
      sellerName={seller.fullName}
      catalogName={catalog.name}
      products={serializedProducts}
      categories={categories}
    />
  );
}
