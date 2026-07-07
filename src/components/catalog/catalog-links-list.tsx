import Link from "next/link";
import { ArrowRight } from "lucide-react";

type CatalogLink = {
  slug: string;
  name: string;
  description: string | null;
  productCount: number;
};

type CatalogLinksListProps = {
  sellerCode: string;
  sellerName: string;
  catalogs: CatalogLink[];
};

export function CatalogLinksList({ sellerCode, sellerName, catalogs }: CatalogLinksListProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Dimarsa</p>
        <h1 className="text-2xl font-semibold text-navy sm:text-3xl">Catálogos de {sellerName}</h1>
      </header>

      {catalogs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-cream-dark bg-white/60 p-8 text-center text-sm text-muted-foreground">
          Este vendedor todavía no tiene catálogos disponibles.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {catalogs.map((catalog) => (
            <Link
              key={catalog.slug}
              href={`/c/${sellerCode}/${catalog.slug}`}
              className="group flex flex-col gap-2 rounded-2xl border border-cream-dark bg-white/95 p-5 shadow-sm transition-shadow hover:shadow-brand"
            >
              <h2 className="text-lg font-semibold text-navy">{catalog.name}</h2>
              {catalog.description ? (
                <p className="text-sm text-muted-foreground">{catalog.description}</p>
              ) : null}
              <div className="mt-auto flex items-center justify-between pt-2 text-sm font-medium text-navy">
                <span>{catalog.productCount} productos</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
