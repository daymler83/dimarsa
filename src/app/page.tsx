import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-brand-radial px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center gap-10">
        <div className="max-w-2xl space-y-5">
          <Badge className="bg-gold text-navy hover:bg-gold-light">Red comercial digital</Badge>
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-navy-light">
              Dimarsa
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
              Plataforma de distribucion digital para vendedores y catalogos compartibles.
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Registrate, comparte tu catalogo personalizado y gana comisiones automaticas por
              cada venta atribuida a tu link.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-navy text-white hover:bg-navy-light">
              <Link href="/registro">
                Crear cuenta de vendedor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-navy/20 bg-white/70 text-navy hover:bg-white"
            >
              <Link href="/login">Ingresar</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
