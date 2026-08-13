import { BarChart3, TrendingUp, PhoneCall, ShoppingCart, Eye, Users } from "lucide-react";
import { StatCard } from "./stat-card";
import type { SellerMetrics } from "@/actions/performance";

interface MetricsGridProps {
  metrics: SellerMetrics;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="Tasa de conversión"
        value={`${metrics.conversationRate.toFixed(1)}%`}
        icon={TrendingUp}
        accent="success"
      />
      <StatCard
        label="Tiempo 1ª respuesta"
        value={`${metrics.medianResponseTime.toFixed(1)}h`}
        icon={PhoneCall}
        accent="gold"
      />
      <StatCard
        label="Tasa de seguimiento"
        value={`${metrics.followUpRate.toFixed(1)}%`}
        icon={BarChart3}
        accent="navy"
      />
      <StatCard
        label="Conversión post-seguimiento"
        value={`${metrics.postFollowConversion.toFixed(1)}%`}
        icon={ShoppingCart}
        accent="sky"
      />
      <StatCard
        label="Visitas"
        value={metrics.visitsCount.toString()}
        icon={Eye}
        accent="gold"
      />
      <StatCard
        label="Leads"
        value={metrics.leadsCount.toString()}
        icon={Users}
        accent="success"
      />
    </div>
  );
}
