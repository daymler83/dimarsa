import { ShoppingBag, TrendingUp } from "lucide-react";

const previewProducts = [
  { name: "Smart TV 55\"", price: "$399.990" },
  { name: "Taladro Bauker", price: "$39.990" },
  { name: "Bicicleta MTB", price: "$179.990" },
];

export function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md pb-8 pr-6 pt-8">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gold/20 blur-2xl" aria-hidden="true" />

      <div className="absolute -top-2 right-0 z-10 flex -rotate-3 items-center gap-2 rounded-2xl border border-cream-dark bg-white px-4 py-3 shadow-brand">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
          <TrendingUp className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">Comisión ganada</p>
          <p className="text-sm font-semibold text-navy">+$81.240</p>
        </div>
      </div>

      <div className="rotate-2 rounded-2xl border border-cream-dark bg-white shadow-brand transition-transform hover:rotate-0">
        <div className="flex items-center gap-1.5 rounded-t-2xl border-b border-cream-dark bg-cream/60 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-error/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/40" />
          <span className="ml-3 truncate rounded-full bg-white px-3 py-1 text-xs text-muted-foreground">
            dimarsa.cl/c/C4M8L2
          </span>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between rounded-xl bg-navy px-4 py-3 text-white">
            <div>
              <p className="text-xs text-white/70">Catálogo de Camila</p>
              <p className="text-sm font-semibold">Tecnología y Hogar</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-navy">
              <ShoppingBag className="h-4 w-4" />
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {previewProducts.map((product) => (
              <div key={product.name} className="rounded-xl border border-cream-dark bg-cream/40 p-2">
                <div className="mb-2 aspect-square rounded-lg bg-cream" />
                <p className="truncate text-[11px] font-medium text-navy">{product.name}</p>
                <p className="text-[11px] font-semibold text-navy">{product.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
