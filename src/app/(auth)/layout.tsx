import type { ReactNode } from "react";

type AuthLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-brand-radial px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-6 text-center lg:text-left">
            <div className="inline-flex rounded-full border border-gold/30 bg-white/80 px-4 py-2 text-sm font-medium text-navy shadow-sm">
              Dimarsa
            </div>
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-gold">Red comercial digital</p>
              <h1 className="text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
                Convierte cada contacto en una venta trazable.
              </h1>
              <p className="mx-auto max-w-xl text-base leading-7 text-muted-foreground lg:mx-0">
                Registra vendedores, comparte catalogos personalizados y sigue cada comision desde un solo lugar.
              </p>
            </div>
          </section>

          <section className="mx-auto w-full max-w-lg">{children}</section>
        </div>
      </div>
    </main>
  );
}
