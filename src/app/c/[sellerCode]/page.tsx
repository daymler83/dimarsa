import { CatalogLinksList } from "@/components/catalog/catalog-links-list";
import { CatalogNotFound } from "@/components/shared/catalog-not-found";
import { countCatalogProducts } from "@/lib/catalogs";
import { prisma } from "@/lib/prisma";

type SellerCatalogsPageProps = {
  params: { sellerCode: string };
};

export default async function SellerCatalogsPage({ params }: SellerCatalogsPageProps) {
  const seller = await prisma.profile.findFirst({
    where: { sellerCode: params.sellerCode, active: true, role: "seller" },
    select: { fullName: true, sellerCode: true },
  });

  if (!seller?.sellerCode) {
    return <CatalogNotFound />;
  }

  const catalogs = await prisma.catalog.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  // Sequential (not Promise.all): each count fans out into more Prisma
  // queries, and Supabase's session pooler caps concurrent connections.
  const catalogsWithCounts = [];
  for (const catalog of catalogs) {
    catalogsWithCounts.push({
      slug: catalog.slug,
      name: catalog.name,
      description: catalog.description,
      productCount: await countCatalogProducts(catalog.id),
    });
  }

  return (
    <CatalogLinksList
      sellerCode={seller.sellerCode}
      sellerName={seller.fullName}
      catalogs={catalogsWithCounts}
    />
  );
}
