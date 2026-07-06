import { redirect } from "next/navigation";
import { Link2, Printer, Smartphone, SquarePen } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareActions } from "@/components/shared/share-actions";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const tips = [
  {
    icon: Smartphone,
    text: "Publica tu link en tu estado de WhatsApp para que todos tus contactos lo vean.",
  },
  {
    icon: SquarePen,
    text: "Ponlo en la biografia de tu Instagram o Facebook.",
  },
  {
    icon: Printer,
    text: "Imprime el codigo QR y muestralo en persona: apuntan la camara y llegan directo a tu catalogo.",
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

  return (
    <main className="min-h-screen bg-brand-radial px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl space-y-5 sm:space-y-6">
        <Card className="border-white/70 bg-white/95 shadow-brand">
          <CardHeader className="space-y-1 pb-3 sm:pb-4">
            <CardTitle className="text-lg text-navy sm:text-xl">Comparte tu catalogo</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Cada compra realizada a traves de tu link se atribuye automaticamente a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ShareActions sellerCode={profile.sellerCode} />
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/95 shadow-brand">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-lg text-navy sm:text-xl">Tips para vender mas</CardTitle>
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
