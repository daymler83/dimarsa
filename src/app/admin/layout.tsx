import type { ReactNode } from "react";

import { Navbar } from "@/components/layout/navbar";

const adminNavItems = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/catalogos", label: "Catálogos" },
];

type AdminLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar items={adminNavItems} />
      {children}
    </div>
  );
}
