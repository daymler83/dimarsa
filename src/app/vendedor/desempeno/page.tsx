import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSellerMetrics, getRecommendations } from "@/actions/performance";
import { PerformanceDashboard } from "@/components/dashboard/performance-dashboard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function calculateFunnel(sellerId: string, start: Date, end: Date) {
  const visits = await prisma.sellerEvent.count({
    where: { sellerId, eventType: "visita", createdAt: { gte: start, lte: end } },
  });

  const leads = await prisma.lead.count({
    where: { sellerId, createdAt: { gte: start, lte: end } },
  });

  const quotations = await prisma.quotation.count({
    where: { sellerId, createdAt: { gte: start, lte: end } },
  });

  const approvedQuotations = await prisma.quotation.count({
    where: { sellerId, createdAt: { gte: start, lte: end }, status: "approved" },
  });

  const checkouts = await prisma.sellerEvent.count({
    where: { sellerId, eventType: "checkout", createdAt: { gte: start, lte: end } },
  });

  return {
    visits,
    leads,
    quotations,
    approvedQuotations,
    checkouts,
    conversionVisitLead: visits > 0 ? ((leads / visits) * 100).toFixed(1) : 0,
    conversionLeadQuotation: leads > 0 ? ((quotations / leads) * 100).toFixed(1) : 0,
    conversionQuotationApproved: quotations > 0 ? ((approvedQuotations / quotations) * 100).toFixed(1) : 0,
    conversionApprovedCheckout: approvedQuotations > 0 ? ((checkouts / approvedQuotations) * 100).toFixed(1) : 0,
  };
}

export default async function PerformancePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Lunes
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const metrics = await getSellerMetrics(session.user.id, weekStart, weekEnd);
  const recommendations = await getRecommendations(metrics);
  const funnel = await calculateFunnel(session.user.id, weekStart, weekEnd);

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy sm:text-3xl">Mi desempeño</h1>
          <p className="text-sm text-muted-foreground">
            Seguimiento semanal de tus métricas de venta y recomendaciones personalizadas.
          </p>
        </div>
        <PerformanceDashboard metrics={metrics} funnel={funnel} recommendations={recommendations} />
      </div>
    </main>
  );
}
