import type { ReactNode } from "react";

import { Navbar } from "@/components/layout/navbar";

const vendorNavItems = [
  { href: "/vendedor", label: "Resumen" },
  { href: "/vendedor/compartir", label: "Compartir" },
];

type VendedorLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function VendedorLayout({ children }: VendedorLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar items={vendorNavItems} />
      {children}
    </div>
  );
}
