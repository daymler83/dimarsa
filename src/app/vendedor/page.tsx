import { redirect } from "next/navigation";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { DollarSign, Percent, ShoppingBag, Users } from "lucide-react";

import { SalesChart, type SalesChartPoint } from "@/components/dashboard/sales-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrderStatus } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Datos de ejemplo: los pedidos y comisiones reales llegan con los specs
// shopping-cart-checkout y commission-tracking. Se reemplaza esto por
// consultas a Prisma (Order/Commission) cuando esos specs esten listos.
const MOCK_STATS = {
  totalOrders: 34,
  totalRevenue: 812400,
  commissionEarned: 81240,
  uniqueCustomers: 27,
};

const MOCK_SALES_CHART: SalesChartPoint[] = Array.from({ length: 90 }, (_, index) => {
  const date = subDays(new Date(), 89 - index);
  const base = 18000 + Math.sin(index / 3) * 9000;
  const weekendBoost = date.getDay() === 5 || date.getDay() === 6 ? 6000 : 0;

  return {
    date: format(date, "d MMM", { locale: es }),
    fullDate: format(date, "EEEE d 'de' MMMM", { locale: es }),
    revenue: Math.max(0, Math.round(base + weekendBoost)),
  };
});

const MOCK_RECENT_ORDERS: Array<{
  id: string;
  customerName: string;
  total: number;
  commission: number;
  status: OrderStatus;
  createdAt: Date;
}> = [
  { id: "1042", customerName: "Camila Fuentes", total: 32990, commission: 3299, status: "delivered", createdAt: subDays(new Date(), 1) },
  { id: "1041", customerName: "Ignacio Torres", total: 18990, commission: 1899, status: "shipped", createdAt: subDays(new Date(), 2) },
  { id: "1039", customerName: "Francisca Vera", total: 47980, commission: 4798, status: "preparing", createdAt: subDays(new Date(), 3) },
  { id: "1035", customerName: "Matias Rojas", total: 12990, commission: 1299, status: "confirmed", createdAt: subDays(new Date(), 5) },
  { id: "1030", customerName: "Antonia Silva", total: 24990, commission: 2499, status: "pending", createdAt: subDays(new Date(), 6) },
];

export default async function SellerDashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: { fullName: true },
  });

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy sm:text-3xl">
            Hola, {profile?.fullName?.split(" ")[0] ?? "vendedor"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Este es un resumen de ejemplo — se conecta a tus ventas reales apenas empieces a
            recibir pedidos.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pedidos totales"
            value={MOCK_STATS.totalOrders.toString()}
            icon={ShoppingBag}
            accent="gold"
          />
          <StatCard
            label="Ingresos totales"
            value={formatPrice(MOCK_STATS.totalRevenue)}
            icon={DollarSign}
            accent="success"
          />
          <StatCard
            label="Comisión ganada"
            value={formatPrice(MOCK_STATS.commissionEarned)}
            icon={Percent}
            hint="10% por pedido"
            accent="navy"
          />
          <StatCard
            label="Clientes únicos"
            value={MOCK_STATS.uniqueCustomers.toString()}
            icon={Users}
            accent="sky"
          />
        </div>

        <Card className="border-white/70 bg-white/95 shadow-brand">
          <CardHeader>
            <CardTitle className="text-navy">Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={MOCK_SALES_CHART} />
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/95 shadow-brand">
          <CardHeader>
            <CardTitle className="text-navy">Pedidos recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mobile: stacked cards instead of a horizontally-scrolling table */}
            <div className="space-y-3 sm:hidden">
              {MOCK_RECENT_ORDERS.map((order) => (
                <div key={order.id} className="rounded-2xl border border-cream-dark p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-navy">#{order.id}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(order.createdAt, "d MMM", { locale: es })}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-navy">{formatPrice(order.total)}</span>
                    <span className="text-muted-foreground">
                      Comisión: <span className="font-medium text-navy">{formatPrice(order.commission)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop/tablet: table */}
            <Table className="hidden sm:table">
              <TableHeader>
                <TableRow>
                  <TableHead># Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Comisión</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_RECENT_ORDERS.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-navy">#{order.id}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{format(order.createdAt, "d MMM", { locale: es })}</TableCell>
                    <TableCell>{formatPrice(order.total)}</TableCell>
                    <TableCell>{formatPrice(order.commission)}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
