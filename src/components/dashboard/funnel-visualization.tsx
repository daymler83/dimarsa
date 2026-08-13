"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FunnelData {
  visits: number;
  carts: number;
  checkouts: number;
  conversionVisitCart: number | string;
  conversionCartCheckout: number | string;
}

interface FunnelVisualizationProps {
  funnel: FunnelData;
}

export function FunnelVisualization({ funnel }: FunnelVisualizationProps) {
  const maxValue = Math.max(funnel.visits, funnel.carts, funnel.checkouts, 1);

  const getWidth = (value: number) => {
    return `${(value / maxValue) * 100}%`;
  };

  return (
    <Card className="border-white/70 bg-white/95 shadow-brand">
      <CardHeader>
        <CardTitle className="text-navy">Embudo de conversión</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {/* Visits */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Visitas</span>
              <span className="text-sm font-semibold text-navy">{funnel.visits}</span>
            </div>
            <div
              className="rounded-lg bg-blue-500"
              style={{ width: "100%", height: "32px" }}
            />
          </div>

          {/* Carts */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Carrito ({funnel.conversionVisitCart}%)
              </span>
              <span className="text-sm font-semibold text-navy">{funnel.carts}</span>
            </div>
            <div
              className="rounded-lg bg-green-500"
              style={{ width: getWidth(funnel.carts), height: "32px" }}
            />
          </div>

          {/* Checkouts */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Compra ({funnel.conversionCartCheckout}%)
              </span>
              <span className="text-sm font-semibold text-navy">{funnel.checkouts}</span>
            </div>
            <div
              className="rounded-lg bg-emerald-600"
              style={{ width: getWidth(funnel.checkouts), height: "32px" }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
