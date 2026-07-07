import Link from "next/link";
import { ArrowRight, Share2, TrendingUp, UserPlus } from "lucide-react";

import { HeroMockup } from "@/components/marketing/hero-mockup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: UserPlus,
    title: "Regístrate",
    description: "Crea tu cuenta de vendedor en menos de un minuto, sin costo ni stock propio.",
  },
  {
    icon: Share2,
    title: "Comparte tu catálogo",
    description: "Elegí qué catálogo mostrar y compartilo por WhatsApp, Instagram o tu link directo.",
  },
  {
    icon: TrendingUp,
    title: "Gana comisión",
    description: "Cada venta atribuida a tu link se calcula y suma a tu comisión automáticamente.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-brand-radial px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl space-y-5">
            <Badge className="bg-gold text-navy hover:bg-gold-light">Red comercial digital</Badge>
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-navy-light">
                Dimarsa
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
                Plataforma para distribuidores.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Regístrate, comparte tu catálogo personalizado y gana comisiones automáticas por
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

          <div className="hidden lg:block">
            <HeroMockup />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl pb-16 pt-4 sm:pb-24">
        <p className="mb-8 text-center text-sm font-semibold uppercase tracking-[0.28em] text-navy-light">
          Cómo funciona
        </p>
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative rounded-2xl border border-white/70 bg-white/90 p-6 shadow-brand backdrop-blur"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-white">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="text-2xl font-semibold text-cream-dark">{index + 1}</span>
              </div>
              <h3 className="text-lg font-semibold text-navy">{step.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
