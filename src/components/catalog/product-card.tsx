import Image from "next/image";
import Link from "next/link";

import { formatPrice } from "@/lib/utils";

type ProductCardProps = {
  sellerCode: string;
  catalogSlug: string;
  slug: string;
  name: string;
  price: string;
  compareAtPrice: string | null;
  imageUrl: string | null;
};

export function ProductCard({
  sellerCode,
  catalogSlug,
  slug,
  name,
  price,
  compareAtPrice,
  imageUrl,
}: ProductCardProps) {
  return (
    <Link
      href={`/c/${sellerCode}/${catalogSlug}/${slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-cream-dark bg-white/95 shadow-sm transition-shadow hover:shadow-brand"
    >
      <div className="relative aspect-square w-full bg-cream">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 text-sm font-medium text-navy">{name}</h3>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-base font-semibold text-navy">{formatPrice(price)}</span>
          {compareAtPrice ? (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(compareAtPrice)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
