"use client";

import { PerformanceScore } from "./performance-score";
import { MetricsGrid } from "./metrics-grid";
import { FunnelVisualization } from "./funnel-visualization";
import { RecommendationsSection } from "./recommendations-section";
import type { SellerMetrics, Recommendation } from "@/actions/performance";

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

interface PerformanceDashboardProps {
  metrics: SellerMetrics;
  funnel: FunnelData;
  recommendations: Recommendation[];
}

export function PerformanceDashboard({
  metrics,
  funnel,
  recommendations,
}: PerformanceDashboardProps) {
  return (
    <div className="space-y-6">
      <PerformanceScore score={metrics.performanceScore} level={metrics.performanceLevel} />
      <MetricsGrid metrics={metrics} />
      <FunnelVisualization funnel={funnel} />
      <RecommendationsSection recommendations={recommendations} />
    </div>
  );
}
