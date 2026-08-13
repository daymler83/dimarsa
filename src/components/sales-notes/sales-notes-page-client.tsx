"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SalesNote } from "@prisma/client";
import type { SalesNoteMetrics } from "@/actions/sales-notes";
import { invoiceSalesNote, markAsPaid } from "@/actions/sales-notes";
import { SalesNoteForm } from "./sales-note-form";
import { SalesNotesTable } from "./sales-notes-table";

interface SalesNotesPageClientProps {
  initialSalesNotes: SalesNote[];
  metrics: SalesNoteMetrics;
  sellerId: string;
}

export function SalesNotesPageClient({
  initialSalesNotes,
  metrics,
  sellerId,
}: SalesNotesPageClientProps) {
  const [salesNotes, setSalesNotes] = useState(initialSalesNotes);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered =
    statusFilter && statusFilter !== "all"
      ? salesNotes.filter((n) => n.status === statusFilter)
      : salesNotes;

  const handleInvoice = async (id: string) => {
    try {
      const updated = await invoiceSalesNote(id);
      setSalesNotes(salesNotes.map((n) => (n.id === id ? updated : n)));
    } catch (error) {
      console.error("Error invoicing sales note:", error);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      const updated = await markAsPaid(id);
      setSalesNotes(salesNotes.map((n) => (n.id === id ? updated : n)));
    } catch (error) {
      console.error("Error marking as paid:", error);
    }
  };

  const handleSalesNoteCreated = (newSalesNote: SalesNote) => {
    setSalesNotes([newSalesNote, ...salesNotes]);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Total Notas"
          value={metrics.totalNotes}
          subtext={`Monto: $${metrics.registeredAmount + metrics.invoicedAmount + metrics.paidAmount}`}
        />
        <MetricCard
          label="Registradas"
          value={metrics.registeredNotes}
          subtext={`Monto: $${metrics.registeredAmount}`}
        />
        <MetricCard
          label="Facturadas"
          value={metrics.invoicedNotes}
          subtext={`${Math.round(metrics.invoiceRate)}% del total`}
        />
        <MetricCard
          label="Pagadas"
          value={metrics.paidNotes}
          subtext={`${Math.round(metrics.paymentRate)}% facturadas`}
        />
        <MetricCard
          label="Ticket Promedio"
          value={`$${metrics.avgAmount}`}
          subtext={`De ${metrics.totalNotes} notas`}
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
              <SelectItem value="registered">Registradas</SelectItem>
              <SelectItem value="invoiced">Facturadas</SelectItem>
              <SelectItem value="paid">Pagadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-navy hover:bg-navy/90"
        >
          {showForm ? "Cancelar" : "+ Nueva Nota"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <SalesNoteForm
          sellerId={sellerId}
          onSuccess={handleSalesNoteCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Sales Notes Table */}
      <SalesNotesTable
        salesNotes={filtered}
        onInvoice={handleInvoice}
        onMarkAsPaid={handleMarkAsPaid}
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
