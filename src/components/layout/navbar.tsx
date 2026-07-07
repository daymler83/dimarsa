import Link from "next/link";

import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
};

type NavbarProps = {
  items: NavItem[];
};

export function Navbar({ items }: NavbarProps) {
  return (
    <header className="border-b border-navy-light bg-navy">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 sm:contents">
          <Link href="/" className="text-lg font-semibold text-white">
            Dimarsa
          </Link>

          <form action={logout} className="sm:order-3">
            <Button
              type="submit"
              variant="outline"
              className="h-11 border-white/30 bg-transparent px-4 text-white hover:bg-white/10 hover:text-white"
            >
              Cerrar sesión
            </Button>
          </form>
        </div>

        <nav className="flex items-center gap-2 text-sm font-medium text-white/80 sm:flex-1 sm:gap-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center px-2 transition-colors hover:text-gold"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
