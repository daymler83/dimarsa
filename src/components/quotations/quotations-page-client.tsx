"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Quotation } from "@prisma/client";
import type { QuotationMetrics } from "@/actions/quotations";
import {
  sendQuotation,
  approveQuotation,
  rejectQuotation,
} from "@/actions/quotations";
import { QuotationForm } from "./quotation-form";
import { QuotationsTable } from "./quotations-table";

interface QuotationsPageClientProps {
  initialQuotations: (Quotation & { lead: any })[];
  metrics: QuotationMetrics;
  sellerId: string;
}

export function QuotationsPageClient({
  initialQuotations,
  metrics,
  sellerId,
}: QuotationsPageClientProps) {
  const [quotations, setQuotations] = useState(initialQuotations);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered =
    statusFilter && statusFilter !== "all"
      ? quotations.filter((q) => q.status === statusFilter)
      : quotations;

  const handleSendQuotation = async (id: string) => {
    try {
      const updated = await sendQuotation(id);
      setQuotations(quotations.map((q) => (q.id === id ? updated : q)));
    } catch (error) {
      console.error("Error sending quotation:", error);
    }
  };

  const handleApproveQuotation = async (id: string) => {
    try {
      const updated = await approveQuotation(id);
      setQuotations(quotations.map((q) => (q.id === id ? updated : q)));
    } catch (error) {
      console.error("Error approving quotation:", error);
    }
  };

  const handleRejectQuotation = async (id: string) => {
    try {
      const updated = await rejectQuotation(id);
      setQuotations(quotations.map((q) => (q.id === id ? updated : q)));
    } catch (error) {
      console.error("Error rejecting quotation:", error);
    }
  };

  const handleQuotationCreated = (newQuotation: Quotation & { lead: any }) => {
    setQuotations([newQuotation, ...quotations]);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Total Cotizaciones"
          value={metrics.totalQuotations}
          subtext={`${metrics.draftQuotations} borradores`}
        />
        <MetricCard
          label="Enviadas"
          value={metrics.sentQuotations}
          subtext={`${Math.round(metrics.approvalRate)}% aprobadas`}
        />
        <MetricCard
          label="Aprobadas"
          value={metrics.approvedQuotations}
          subtext={`Monto: $${metrics.totalAmount}`}
        />
        <MetricCard
          label="En Pipeline"
          value={metrics.pendingAmount}
          subtext={`${metrics.draftQuotations + metrics.sentQuotations} cotizaciones`}
        />
        <MetricCard
          label="Ticket Promedio"
          value={`$${metrics.avgAmount}`}
          subtext={`De ${metrics.approvedQuotations} aprobadas`}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-sm font-medium text-muted-foreground">Filtrar por estado:</label>
          <Select value={statusFilter || "all"} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="draft">Borradores</SelectItem>
              <SelectItem value="sent">Enviadas</SelectItem>
              <SelectItem value="approved">Aprobadas</SelectItem>
              <SelectItem value="rejected">Rechazadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-navy hover:bg-navy/90"
        >
          {showForm ? "Cancelar" : "+ Nueva Cotización"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <QuotationForm
          sellerId={sellerId}
          onSuccess={handleQuotationCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Quotations Table */}
      <QuotationsTable
        quotations={filtered}
        onSend={handleSendQuotation}
        onApprove={handleApproveQuotation}
        onReject={handleRejectQuotation}
      />
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext: string;
}

function MetricCard({ label, value, subtext }: MetricCardProps) {
  return (
    <Card className="border-white/70 bg-white/95 shadow-brand">
      <CardContent className="pt-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-navy">{value}</p>
          <p className="text-xs text-muted-foreground">{subtext}</p>
        </div>
      </CardContent>
    </Card>
  );
}
