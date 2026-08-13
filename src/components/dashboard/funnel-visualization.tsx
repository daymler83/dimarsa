"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FunnelData {
  visits: number;
  leads: number;
  quotations: number;
  approvedQuotations: number;
  checkouts: number;
  conversionVisitLead: number | string;
  conversionLeadQuotation: number | string;
  conversionQuotationApproved: number | string;
  conversionApprovedCheckout: number | string;
}

interface FunnelVisualizationProps {
  funnel: FunnelData;
}

export function FunnelVisualization({ funnel }: FunnelVisualizationProps) {
  const maxValue = Math.max(
    funnel.visits,
    funnel.leads,
    funnel.quotations,
    funnel.approvedQuotations,
    funnel.checkouts,
    1
  );

  const getWidth = (value: number) => {
    return `${(value / maxValue) * 100}%`;
  };

  return (
    <Card className="border-white/70 bg-white/95 shadow-brand">
      <CardHeader>
        <CardTitle className="text-navy">Embudo de conversión (6 etapas)</CardTitle>
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

          {/* Leads */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Leads ({funnel.conversionVisitLead}%)
              </span>
              <span className="text-sm font-semibold text-navy">{funnel.leads}</span>
            </div>
            <div
              className="rounded-lg bg-cyan-500"
              style={{ width: getWidth(funnel.leads), height: "32px" }}
            />
          </div>

          {/* Quotations */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Cotizaciones ({funnel.conversionLeadQuotation}%)
              </span>
              <span className="text-sm font-semibold text-navy">{funnel.quotations}</span>
            </div>
            <div
              className="rounded-lg bg-purple-500"
              style={{ width: getWidth(funnel.quotations), height: "32px" }}
            />
          </div>

          {/* Approved Quotations */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Aprobadas ({funnel.conversionQuotationApproved}%)
              </span>
              <span className="text-sm font-semibold text-navy">{funnel.approvedQuotations}</span>
            </div>
            <div
              className="rounded-lg bg-green-500"
              style={{ width: getWidth(funnel.approvedQuotations), height: "32px" }}
            />
          </div>

          {/* Checkouts */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Compra ({funnel.conversionApprovedCheckout}%)
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
