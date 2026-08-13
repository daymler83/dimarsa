"use server";

import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

// ============ Schemas ============

const CreateSalesNoteSchema = z.object({
  quotationId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  customerName: z.string().min(1, "El nombre es requerido"),
  customerEmail: z.string().email().optional(),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  description: z.string().optional(),
  notes: z.string().optional(),
});

const InvoiceSalesNoteSchema = z.object({
  salesNoteId: z.string().uuid(),
});

const MarkAsPaidSchema = z.object({
  salesNoteId: z.string().uuid(),
});

const GetSellerSalesNotesSchema = z.object({
  status: z.string().optional(),
  limit: z.number().positive().default(100),
});

// ============ Sales Note Management ============

export async function createSalesNote(data: z.infer<typeof CreateSalesNoteSchema>) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Not authenticated");

  const validated = CreateSalesNoteSchema.parse(data);

  // Verify quotation belongs to seller if provided
  if (validated.quotationId) {
    const quotation = await prisma.quotation.findFirst({
      where: { id: validated.quotationId, sellerId: session.user.id },
    });

    if (!quotation) throw new Error("Quotation not found or unauthorized");
  }

  // Verify order belongs to seller if provided
  if (validated.orderId) {
    const order = await prisma.order.findFirst({
      where: { id: validated.orderId, sellerId: session.user.id },
    });

    if (!order) throw new Error("Order not found or unauthorized");
  }

  const salesNote = await prisma.salesNote.create({
    data: {
      sellerId: session.user.id,
      quotationId: validated.quotationId,
      orderId: validated.orderId,
      customerName: validated.customerName,
      customerEmail: validated.customerEmail,
      amount: new Decimal(validated.amount),
      description: validated.description,
      notes: validated.notes,
      status: "registered",
    },
  });

  return salesNote;
}

export async function invoiceSalesNote(salesNoteId: string) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Not authenticated");

  const validated = InvoiceSalesNoteSchema.parse({ salesNoteId });

  // Verify sales note belongs to seller
  const salesNote = await prisma.salesNote.findFirst({
    where: { id: validated.salesNoteId, sellerId: session.user.id },
  });

  if (!salesNote) throw new Error("Sales note not found or unauthorized");

  const updated = await prisma.salesNote.update({
    where: { id: validated.salesNoteId },
    data: {
      status: "invoiced",
      invoicedAt: new Date(),
    },
  });

  return updated;
}

export async function markAsPaid(salesNoteId: string) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Not authenticated");

  const validated = MarkAsPaidSchema.parse({ salesNoteId });

  // Verify sales note belongs to seller
  const salesNote = await prisma.salesNote.findFirst({
    where: { id: validated.salesNoteId, sellerId: session.user.id },
  });

  if (!salesNote) throw new Error("Sales note not found or unauthorized");

  const updated = await prisma.salesNote.update({
    where: { id: validated.salesNoteId },
    data: {
      status: "paid",
      paidAt: new Date(),
    },
  });

  return updated;
}

export async function getSellerSalesNotes(
  sellerId: string,
  filters?: { status?: string; limit?: number }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || session.user.id !== sellerId) {
    throw new Error("Unauthorized");
  }

  const validated = GetSellerSalesNotesSchema.parse(filters || {});

  const where = {
    sellerId,
    ...(validated.status ? { status: validated.status } : {}),
  };

  const salesNotes = await prisma.salesNote.findMany({
    where,
    orderBy: { registeredAt: "desc" },
    take: validated.limit,
  });

  return salesNotes;
}

// ============ Sales Note Metrics ============

export interface SalesNoteMetrics {
  totalNotes: number;
  registeredNotes: number;
  invoicedNotes: number;
  paidNotes: number;
  registeredAmount: number;
  invoicedAmount: number;
  paidAmount: number;
  avgAmount: number;
  invoiceRate: number;
  paymentRate: number;
}

export async function getSalesNoteMetrics(
  sellerId: string,
  startDate: Date,
  endDate: Date
): Promise<SalesNoteMetrics> {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || session.user.id !== sellerId) {
    throw new Error("Unauthorized");
  }

  const allNotes = await prisma.salesNote.findMany({
    where: {
      sellerId,
      registeredAt: { gte: startDate, lte: endDate },
    },
  });

  const registeredNotes = allNotes.filter((n) => n.status === "registered").length;
  const invoicedNotes = allNotes.filter((n) => n.status === "invoiced").length;
  const paidNotes = allNotes.filter((n) => n.status === "paid").length;

  const registeredAmount = allNotes
    .filter((n) => n.status === "registered")
    .reduce((sum, n) => sum + n.amount.toNumber(), 0);
  const invoicedAmount = allNotes
    .filter((n) => n.status === "invoiced")
    .reduce((sum, n) => sum + n.amount.toNumber(), 0);
  const paidAmount = allNotes
    .filter((n) => n.status === "paid")
    .reduce((sum, n) => sum + n.amount.toNumber(), 0);

  const totalAmount = allNotes.reduce((sum, n) => sum + n.amount.toNumber(), 0);
  const avgAmount = allNotes.length > 0 ? totalAmount / allNotes.length : 0;

  const invoiceRate = registeredNotes > 0 ? (invoicedNotes / registeredNotes) * 100 : 0;
  const paymentRate = invoicedNotes > 0 ? (paidNotes / invoicedNotes) * 100 : 0;

  return {
    totalNotes: allNotes.length,
    registeredNotes,
    invoicedNotes,
    paidNotes,
    registeredAmount: Math.round(registeredAmount * 100) / 100,
    invoicedAmount: Math.round(invoicedAmount * 100) / 100,
    paidAmount: Math.round(paidAmount * 100) / 100,
    avgAmount: Math.round(avgAmount * 100) / 100,
    invoiceRate: Math.round(invoiceRate * 10) / 10,
    paymentRate: Math.round(paymentRate * 10) / 10,
  };
}
