import type { Metadata } from "next";
import type { ReactNode } from "react";

import { prisma } from "@/lib/prisma";

type CatalogLayoutProps = {
  children: ReactNode;
  params: { sellerCode: string };
};

export async function generateMetadata({ params }: { params: { sellerCode: string } }): Promise<Metadata> {
  const seller = await prisma.profile.findFirst({
    where: { sellerCode: params.sellerCode, active: true, role: "seller" },
    select: { fullName: true },
  });

  const title = seller ? `Catálogo de ${seller.fullName} | Dimarsa` : "Catálogo Dimarsa";
  const description = "Compra directo desde este catálogo Dimarsa y recibe tu pedido a domicilio o retira en tienda.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default function CatalogLayout({ children }: CatalogLayoutProps) {
  return <div className="min-h-screen bg-cream">{children}</div>;
}
