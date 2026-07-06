import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const buildSteps = [
  "Registro y autenticacion de vendedores",
  "Catalogo publico por vendedor",
  "Carrito, checkout y creacion de pedidos",
  "Comisiones y dashboards",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-brand-radial px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center gap-10">
        <div className="max-w-2xl space-y-5">
          <Badge className="bg-gold text-navy hover:bg-gold-light">MVP en construccion</Badge>
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-navy-light">
              Dimarza
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
              Plataforma de distribucion digital para vendedores y catalogos compartibles.
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              La base del proyecto ya esta preparada para continuar con el flujo completo:
              registro, catalogo personalizado, compra y comision automatica.
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {buildSteps.map((step, index) => (
            <Card key={step} className="border-white/60 bg-white/80 shadow-brand backdrop-blur">
              <CardHeader className="space-y-3">
                <Badge variant="secondary" className="w-fit bg-cream text-navy">
                  Paso {index + 1}
                </Badge>
                <CardTitle className="text-xl text-navy">{step}</CardTitle>
                <CardDescription>
                  Estructura preparada para seguir el orden de los specs definidos en `.kiro/`.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-start gap-3 text-sm text-muted-foreground">
                <BadgeCheck className="mt-0.5 h-4 w-4 text-gold" />
                <p>Task 1 de `auth-seller-system` deja listas las bases tecnicas del proyecto.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
