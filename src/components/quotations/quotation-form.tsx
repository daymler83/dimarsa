"use client";

import { useState } from "react";
import { createQuotation } from "@/actions/quotations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Quotation } from "@prisma/client";

interface QuotationFormProps {
  sellerId: string;
  onSuccess: (quotation: Quotation & { lead: any }) => void;
  onCancel: () => void;
}

export function QuotationForm({ sellerId, onSuccess, onCancel }: QuotationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    amount: "",
    description: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const quotation = await createQuotation({
        customerName: formData.customerName,
        customerEmail: formData.customerEmail || undefined,
        customerPhone: formData.customerPhone || undefined,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
      });

      onSuccess(quotation as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating quotation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-white/70 bg-white/95 shadow-brand">
      <CardHeader>
        <CardTitle className="text-navy">Nueva Cotización</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-navy">Nombre del Cliente</label>
              <Input
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="Ej: Juan García"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy">Email</label>
              <Input
                name="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={handleChange}
                placeholder="cliente@ejemplo.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy">Teléfono</label>
              <Input
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                placeholder="+56912345678"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy">Monto (CLP)</label>
              <Input
                name="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                placeholder="50000"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy">Descripción</label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detalles del producto o servicio..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !formData.customerName || !formData.amount}
              className="bg-navy hover:bg-navy/90"
            >
              {loading ? "Creando..." : "Crear Cotización"}
            </Button>
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
