import { ProductCard } from "@/components/catalog/product-card";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: string;
  compareAtPrice: string | null;
  imageUrl: string | null;
};

type ProductGridProps = {
  sellerCode: string;
  products: Product[];
};

export function ProductGrid({ sellerCode, products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-cream-dark p-8 text-center text-sm text-muted-foreground">
        No hay productos disponibles en esta categoria por ahora.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          sellerCode={sellerCode}
          slug={product.slug}
          name={product.name}
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          imageUrl={product.imageUrl}
        />
      ))}
    </div>
  );
}
