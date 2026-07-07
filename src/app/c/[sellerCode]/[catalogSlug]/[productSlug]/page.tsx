import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AddToCartButton } from "@/components/catalog/add-to-cart-button";
import { CatalogNotFound } from "@/components/shared/catalog-not-found";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

type ProductDetailPageProps = {
  params: { sellerCode: string; catalogSlug: string; productSlug: string };
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const seller = await prisma.profile.findFirst({
    where: { sellerCode: params.sellerCode, active: true, role: "seller" },
    select: { sellerCode: true },
  });

  if (!seller?.sellerCode) {
    return <CatalogNotFound />;
  }

  const catalog = await prisma.catalog.findFirst({
    where: { slug: params.catalogSlug, isActive: true },
    select: { slug: true },
  });

  if (!catalog) {
    return <CatalogNotFound />;
  }

  const product = await prisma.product.findFirst({
    where: { slug: params.productSlug, active: true },
  });

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href={`/c/${seller.sellerCode}/${catalog.slug}`}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-navy hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-cream">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : null}
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-navy">{product.name}</h1>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-navy">{formatPrice(product.price.toString())}</span>
            {product.compareAtPrice ? (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice.toString())}
              </span>
            ) : null}
          </div>

          {product.description ? (
            <p className="text-base leading-7 text-muted-foreground">{product.description}</p>
          ) : null}

          <AddToCartButton
            sellerCode={seller.sellerCode}
            productId={product.id}
            productName={product.name}
            productSlug={product.slug}
            productImageUrl={product.imageUrl}
            unitPrice={Number(product.price)}
          />
        </div>
      </div>
    </main>
  );
}
