import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSellerSalesNotes, getSalesNoteMetrics } from "@/actions/sales-notes";
import { SalesNotesPageClient } from "@/components/sales-notes/sales-notes-page-client";

export const dynamic = "force-dynamic";

export default async function SalesNotesPage() {
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

  const salesNotes = await getSellerSalesNotes(session.user.id, { limit: 100 });
  const metrics = await getSalesNoteMetrics(session.user.id, monthStart, monthEnd);

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy sm:text-3xl">Mis Notas de Venta</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus notas de venta y rastrea el estado de facturación y pago.
          </p>
        </div>

        <SalesNotesPageClient
          initialSalesNotes={salesNotes}
          metrics={metrics}
          sellerId={session.user.id}
        />
      </div>
    </main>
  );
}
