"use client";

import { useState } from "react";
import { createSalesNote } from "@/actions/sales-notes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SalesNote } from "@prisma/client";

interface SalesNoteFormProps {
  sellerId: string;
  onSuccess: (salesNote: SalesNote) => void;
  onCancel: () => void;
}

export function SalesNoteForm({ sellerId, onSuccess, onCancel }: SalesNoteFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    amount: "",
    description: "",
    notes: "",
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
      const salesNote = await createSalesNote({
        customerName: formData.customerName,
        customerEmail: formData.customerEmail || undefined,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        notes: formData.notes || undefined,
      });

      onSuccess(salesNote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating sales note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-white/70 bg-white/95 shadow-brand">
      <CardHeader>
        <CardTitle className="text-navy">Nueva Nota de Venta</CardTitle>
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

            <div>
              <label className="block text-sm font-medium text-navy">Descripción</label>
              <Input
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Producto o servicio vendido..."
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy">Notas Internas</label>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Observaciones sobre la venta..."
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
              {loading ? "Creando..." : "Crear Nota de Venta"}
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
