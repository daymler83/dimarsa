import { redirect } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPerformancePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  // Verificar que es admin
  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (profile?.role !== "admin") {
    redirect("/vendedor");
  }

  const sellers = await prisma.profile.findMany({
    where: { role: "seller" },
    select: {
      id: true,
      fullName: true,
    },
    orderBy: { fullName: "asc" },
  });

  const metrics = await Promise.all(
    sellers.map(async (seller) => {
      const latest = await prisma.dailyMetricsRollup.findFirst({
        where: { sellerId: seller.id },
        orderBy: { date: "desc" },
        select: {
          conversationRate: true,
          performanceScore: true,
          date: true,
        },
      });

      const lastOrder = await prisma.order.findFirst({
        where: { sellerId: seller.id },
        orderBy: { createdAt: "desc" },
        select: { total: true, createdAt: true },
      });

      const leadsCount = await prisma.lead.count({
        where: { sellerId: seller.id },
      });

      const followUpsCount = await prisma.followUp.count({
        where: { sellerId: seller.id },
      });

      return {
        ...seller,
        conversionRate: latest?.conversationRate || 0,
        performanceScore: latest?.performanceScore || 0,
        lastOrder,
        leadsCount,
        followUpsCount,
      };
    })
  );

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy sm:text-3xl">
            Desempeño de vendedores
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoreo de métricas y actividad de todos los vendedores en la plataforma.
          </p>
        </div>

        <Card className="border-white/70 bg-white/95 shadow-brand">
          <CardHeader>
            <CardTitle className="text-navy">Resumen de vendedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Tasa conversión</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Seguimientos</TableHead>
                    <TableHead className="text-right">Último pedido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-navy">{m.fullName}</TableCell>
                      <TableCell className="text-right text-sm">
                        {m.conversionRate.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-navy">
                        {m.performanceScore.toFixed(0)}/100
                      </TableCell>
                      <TableCell className="text-right text-sm">{m.leadsCount}</TableCell>
                      <TableCell className="text-right text-sm">{m.followUpsCount}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {m.lastOrder
                          ? `${formatPrice(Number(m.lastOrder.total))}`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
