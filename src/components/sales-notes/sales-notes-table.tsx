"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SalesNote } from "@prisma/client";

interface SalesNotesTableProps {
  salesNotes: SalesNote[];
  onInvoice: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  registered: { bg: "bg-blue-100", text: "text-blue-700", label: "Registrada" },
  invoiced: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Facturada" },
  paid: { bg: "bg-green-100", text: "text-green-700", label: "Pagada" },
};

export function SalesNotesTable({
  salesNotes,
  onInvoice,
  onMarkAsPaid,
}: SalesNotesTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (salesNotes.length === 0) {
    return (
      <Card className="border-white/70 bg-white/95 shadow-brand">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No hay notas de venta aún.</p>
        </CardContent>
      </Card>
    );
  }

  const handleAction = async (
    id: string,
    action: "invoice" | "paid"
  ) => {
    setLoadingId(id);
    try {
      if (action === "invoice") {
        await onInvoice(id);
      } else {
        await onMarkAsPaid(id);
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card className="border-white/70 bg-white/95 shadow-brand">
      <CardHeader>
        <CardTitle className="text-navy">Historial de Notas de Venta</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-navy">#</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Monto</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Estado</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Registrada</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {salesNotes.map((salesNote, index) => {
                const statusInfo = statusColors[salesNote.status as keyof typeof statusColors];
                const registeredDate = new Date(salesNote.registeredAt).toLocaleDateString("es-ES");

                return (
                  <tr key={salesNote.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-navy">
                          {salesNote.customerName}
                        </p>
                        {salesNote.customerEmail && (
                          <p className="text-xs text-muted-foreground">
                            {salesNote.customerEmail}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-navy">
                      ${Number(salesNote.amount).toLocaleString("es-ES")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {registeredDate}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {salesNote.status === "registered" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(salesNote.id, "invoice")}
                            disabled={loadingId === salesNote.id}
                            className="text-xs text-yellow-600 hover:text-yellow-700"
                          >
                            {loadingId === salesNote.id ? "..." : "Facturar"}
                          </Button>
                        )}

                        {salesNote.status === "invoiced" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(salesNote.id, "paid")}
                            disabled={loadingId === salesNote.id}
                            className="text-xs text-green-600 hover:text-green-700"
                          >
                            {loadingId === salesNote.id ? "..." : "Marcar como pagada"}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
