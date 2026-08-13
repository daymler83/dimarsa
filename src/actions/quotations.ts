"use server";

import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

// ============ Schemas ============

const CreateQuotationSchema = z.object({
  leadId: z.string().uuid().optional(),
  customerName: z.string().min(1, "El nombre es requerido"),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  description: z.string().optional(),
  expiresAt: z.date().optional(),
});

const SendQuotationSchema = z.object({
  quotationId: z.string().uuid(),
});

const ApproveQuotationSchema = z.object({
  quotationId: z.string().uuid(),
});

const RejectQuotationSchema = z.object({
  quotationId: z.string().uuid(),
});

const GetSellerQuotationsSchema = z.object({
  status: z.string().optional(),
  limit: z.number().positive().default(50),
});

// ============ Quotation Management ============

export async function createQuotation(data: z.infer<typeof CreateQuotationSchema>) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Not authenticated");

  const validated = CreateQuotationSchema.parse(data);

  // Verify lead belongs to seller if provided
  if (validated.leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: validated.leadId, sellerId: session.user.id },
    });

    if (!lead) throw new Error("Lead not found or unauthorized");
  }

  const quotation = await prisma.quotation.create({
    data: {
      sellerId: session.user.id,
      leadId: validated.leadId,
      customerName: validated.customerName,
      customerEmail: validated.customerEmail,
      customerPhone: validated.customerPhone,
      amount: new Decimal(validated.amount),
      description: validated.description,
      expiresAt: validated.expiresAt,
      status: "draft",
    },
    include: { lead: true },
  });

  return quotation;
}

export async function sendQuotation(quotationId: string) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Not authenticated");

  const validated = SendQuotationSchema.parse({ quotationId });

  // Verify quotation belongs to seller
  const quotation = await prisma.quotation.findFirst({
    where: { id: validated.quotationId, sellerId: session.user.id },
  });

  if (!quotation) throw new Error("Quotation not found or unauthorized");

  const updated = await prisma.quotation.update({
    where: { id: validated.quotationId },
    data: {
      status: "sent",
      sentAt: new Date(),
    },
    include: { lead: true },
  });

  return updated;
}

export async function approveQuotation(quotationId: string) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Not authenticated");

  const validated = ApproveQuotationSchema.parse({ quotationId });

  // Verify quotation belongs to seller
  const quotation = await prisma.quotation.findFirst({
    where: { id: validated.quotationId, sellerId: session.user.id },
  });

  if (!quotation) throw new Error("Quotation not found or unauthorized");

  const updated = await prisma.quotation.update({
    where: { id: validated.quotationId },
    data: {
      status: "approved",
      approvedAt: new Date(),
    },
    include: { lead: true },
  });

  return updated;
}

export async function rejectQuotation(quotationId: string) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Not authenticated");

  const validated = RejectQuotationSchema.parse({ quotationId });

  // Verify quotation belongs to seller
  const quotation = await prisma.quotation.findFirst({
    where: { id: validated.quotationId, sellerId: session.user.id },
  });

  if (!quotation) throw new Error("Quotation not found or unauthorized");

  const updated = await prisma.quotation.update({
    where: { id: validated.quotationId },
    data: {
      status: "rejected",
    },
    include: { lead: true },
  });

  return updated;
}

export async function getSellerQuotations(
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

  const validated = GetSellerQuotationsSchema.parse(filters || {});

  const where = {
    sellerId,
    ...(validated.status ? { status: validated.status } : {}),
  };

  const quotations = await prisma.quotation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: validated.limit,
    include: {
      lead: true,
    },
  });

  return quotations;
}

// ============ Quotation Metrics ============

export interface QuotationMetrics {
  totalQuotations: number;
  sentQuotations: number;
  approvedQuotations: number;
  rejectedQuotations: number;
  draftQuotations: number;
  approvalRate: number;
  avgAmount: number;
  totalAmount: number;
  pendingAmount: number;
}

export async function getQuotationMetrics(
  sellerId: string,
  startDate: Date,
  endDate: Date
): Promise<QuotationMetrics> {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || session.user.id !== sellerId) {
    throw new Error("Unauthorized");
  }

  const allQuotations = await prisma.quotation.findMany({
    where: {
      sellerId,
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  const sentQuotations = allQuotations.filter((q) => q.status === "sent").length;
  const approvedQuotations = allQuotations.filter((q) => q.status === "approved").length;
  const rejectedQuotations = allQuotations.filter((q) => q.status === "rejected").length;
  const draftQuotations = allQuotations.filter((q) => q.status === "draft").length;

  const approvalRate =
    sentQuotations > 0 ? (approvedQuotations / sentQuotations) * 100 : 0;

  const totalAmount = allQuotations.reduce((sum, q) => sum + q.amount.toNumber(), 0);
  const avgAmount = allQuotations.length > 0 ? totalAmount / allQuotations.length : 0;

  const pendingQuotations = allQuotations.filter((q) =>
    ["draft", "sent"].includes(q.status)
  );
  const pendingAmount = pendingQuotations.reduce((sum, q) => sum + q.amount.toNumber(), 0);

  return {
    totalQuotations: allQuotations.length,
    sentQuotations,
    approvedQuotations,
    rejectedQuotations,
    draftQuotations,
    approvalRate: Math.round(approvalRate * 10) / 10,
    avgAmount: Math.round(avgAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    pendingAmount: Math.round(pendingAmount * 100) / 100,
  };
}

// ============ Pipeline Metrics ============

export interface PipelineMetrics {
  leadToQuotationRate: number; // % of leads with quotations
  quotationApprovalRate: number; // % of sent quotations approved
  salesCycleTime: number; // Median days from lead to sale
  avgTicket: number; // Average approved quotation amount
  openPipeline: number; // Pending quotations count
}

export async function getPipelineMetrics(
  sellerId: string,
  startDate: Date,
  endDate: Date
): Promise<PipelineMetrics> {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || session.user.id !== sellerId) {
    throw new Error("Unauthorized");
  }

  // 1. Lead to Quotation Rate
  const totalLeads = await prisma.lead.count({
    where: { sellerId, createdAt: { gte: startDate, lte: endDate } },
  });

  const leadsWithQuotations = await prisma.lead.count({
    where: {
      sellerId,
      createdAt: { gte: startDate, lte: endDate },
      quotations: { some: {} },
    },
  });

  const leadToQuotationRate = totalLeads > 0 ? (leadsWithQuotations / totalLeads) * 100 : 0;

  // 2. Quotation Approval Rate
  const sentQuotations = await prisma.quotation.count({
    where: {
      sellerId,
      createdAt: { gte: startDate, lte: endDate },
      status: "sent",
    },
  });

  const approvedQuotations = await prisma.quotation.count({
    where: {
      sellerId,
      createdAt: { gte: startDate, lte: endDate },
      status: "approved",
    },
  });

  const quotationApprovalRate =
    sentQuotations > 0 ? (approvedQuotations / sentQuotations) * 100 : 0;

  // 3. Sales Cycle Time (median days from lead to quotation approval)
  const leadQuotationPairs = await prisma.quotation.findMany({
    where: {
      sellerId,
      createdAt: { gte: startDate, lte: endDate },
      status: "approved",
      leadId: { not: null },
    },
    include: { lead: true },
  });

  const cycleTimes = leadQuotationPairs
    .map((q) => {
      if (!q.lead) return null;
      const days = (q.approvedAt!.getTime() - q.lead.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return days;
    })
    .filter((d) => d !== null) as number[];

  const salesCycleTime =
    cycleTimes.length > 0
      ? cycleTimes.sort((a, b) => a - b)[Math.floor(cycleTimes.length / 2)]
      : 0;

  // 4. Average Ticket (avg amount of approved quotations)
  const approvedQuotationAmounts = await prisma.quotation.findMany({
    where: {
      sellerId,
      createdAt: { gte: startDate, lte: endDate },
      status: "approved",
    },
    select: { amount: true },
  });

  const avgTicket =
    approvedQuotationAmounts.length > 0
      ? approvedQuotationAmounts.reduce((sum, q) => sum + q.amount.toNumber(), 0) /
        approvedQuotationAmounts.length
      : 0;

  // 5. Open Pipeline (pending quotations)
  const openPipeline = await prisma.quotation.count({
    where: {
      sellerId,
      status: { in: ["draft", "sent"] },
    },
  });

  return {
    leadToQuotationRate: Math.round(leadToQuotationRate * 10) / 10,
    quotationApprovalRate: Math.round(quotationApprovalRate * 10) / 10,
    salesCycleTime: Math.round(salesCycleTime * 10) / 10,
    avgTicket: Math.round(avgTicket * 100) / 100,
    openPipeline,
  };
}
