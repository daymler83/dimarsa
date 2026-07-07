import { redirect } from "next/navigation";
import { Link2, Printer, Smartphone, SquarePen } from "lucide-react";

import { getActiveCatalogsForSeller } from "@/actions/catalogs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CatalogPicker } from "@/components/vendedor/catalog-picker";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const tips = [
  {
    icon: Smartphone,
    text: "Publica tu link en tu estado de WhatsApp para que todos tus contactos lo vean.",
  },
  {
    icon: SquarePen,
    text: "Ponlo en la biografía de tu Instagram o Facebook.",
  },
  {
    icon: Printer,
    text: "Imprime el código QR y muéstralo en persona: apuntan la cámara y llegan directo a tu catálogo.",
  },
  {
    icon: Link2,
    text: "Comparte productos puntuales: cada ficha de producto tiene su propio link para reenviar.",
  },
];

export default async function CompartirPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: { sellerCode: true },
  });

  if (!profile?.sellerCode) {
    redirect("/vendedor");
  }

  const catalogs = await getActiveCatalogsForSeller();

  return (
    <main className="min-h-screen bg-brand-radial px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl space-y-5 sm:space-y-6">
        <Card className="border-white/70 bg-white/95 shadow-brand">
          <CardHeader className="space-y-1 pb-3 sm:pb-4">
            <CardTitle className="text-lg text-navy sm:text-xl">Elige qué catálogo compartir</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Cada compra realizada a través de tu link se atribuye automáticamente a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CatalogPicker sellerCode={profile.sellerCode} catalogs={catalogs} />
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/95 shadow-brand">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-lg text-navy sm:text-xl">Tips para vender más</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            {tips.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-start gap-3 rounded-xl border border-cream-dark bg-cream/40 p-3 sm:gap-4 sm:p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="pt-1 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
