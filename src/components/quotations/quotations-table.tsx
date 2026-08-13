"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Quotation } from "@prisma/client";

interface QuotationsTableProps {
  quotations: (Quotation & { lead: any })[];
  onSend: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-700", label: "Borrador" },
  sent: { bg: "bg-blue-100", text: "text-blue-700", label: "Enviada" },
  approved: { bg: "bg-green-100", text: "text-green-700", label: "Aprobada" },
  rejected: { bg: "bg-red-100", text: "text-red-700", label: "Rechazada" },
  expired: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Expirada" },
};

export function QuotationsTable({
  quotations,
  onSend,
  onApprove,
  onReject,
}: QuotationsTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (quotations.length === 0) {
    return (
      <Card className="border-white/70 bg-white/95 shadow-brand">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No hay cotizaciones aún.</p>
        </CardContent>
      </Card>
    );
  }

  const handleAction = async (
    id: string,
    action: "send" | "approve" | "reject"
  ) => {
    setLoadingId(id);
    try {
      if (action === "send") {
        await onSend(id);
      } else if (action === "approve") {
        await onApprove(id);
      } else {
        await onReject(id);
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card className="border-white/70 bg-white/95 shadow-brand">
      <CardHeader>
        <CardTitle className="text-navy">Historial de Cotizaciones</CardTitle>
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
                <th className="px-4 py-3 text-left font-semibold text-navy">Enviada</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quotations.map((quotation, index) => {
                const statusInfo = statusColors[quotation.status as keyof typeof statusColors];
                const createdDate = new Date(quotation.createdAt).toLocaleDateString("es-ES");
                const sentDate = quotation.sentAt
                  ? new Date(quotation.sentAt).toLocaleDateString("es-ES")
                  : "-";

                return (
                  <tr key={quotation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-navy">
                          {quotation.customerName}
                        </p>
                        {quotation.customerEmail && (
                          <p className="text-xs text-muted-foreground">
                            {quotation.customerEmail}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-navy">
                      ${Number(quotation.amount).toLocaleString("es-ES")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {sentDate}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {quotation.status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(quotation.id, "send")}
                            disabled={loadingId === quotation.id}
                            className="text-xs"
                          >
                            {loadingId === quotation.id ? "..." : "Enviar"}
                          </Button>
                        )}

                        {quotation.status === "sent" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(quotation.id, "approve")}
                              disabled={loadingId === quotation.id}
                              className="text-xs text-green-600 hover:text-green-700"
                            >
                              {loadingId === quotation.id ? "..." : "Aprobar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(quotation.id, "reject")}
                              disabled={loadingId === quotation.id}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              {loadingId === quotation.id ? "..." : "Rechazar"}
                            </Button>
                          </>
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
