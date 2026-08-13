import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSellerQuotations, getQuotationMetrics } from "@/actions/quotations";
import { QuotationsPageClient } from "@/components/quotations/quotations-page-client";

export const dynamic = "force-dynamic";

export default async function QuotationsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const now = new Date();
  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEnd = new Date(now);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  monthEnd.setDate(0);
  monthEnd.setHours(23, 59, 59, 999);

  const quotations = await getSellerQuotations(session.user.id, { limit: 100 });
  const metrics = await getQuotationMetrics(session.user.id, monthStart, monthEnd);

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy sm:text-3xl">Mis Cotizaciones</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus cotizaciones y rastrea el pipeline de ventas.
          </p>
        </div>

        <QuotationsPageClient
          initialQuotations={quotations}
          metrics={metrics}
          sellerId={session.user.id}
        />
      </div>
    </main>
  );
}
