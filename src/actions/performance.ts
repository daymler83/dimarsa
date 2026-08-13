"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

// ============ Event Emission ============

const SellerEventSchema = z.object({
  eventType: z.enum([
    "visita",
    "view_product",
    "add_to_cart",
    "share",
    "lead_created",
    "follow_up_marked",
    "checkout",
  ]),
  customerId: z.string().uuid().optional(),
  payload: z.record(z.any()).optional(),
});

export async function emitSellerEvent(data: z.infer<typeof SellerEventSchema>) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Not authenticated");

  const validated = SellerEventSchema.parse(data);

  await prisma.sellerEvent.create({
    data: {
      sellerId: session.user.id,
      eventType: validated.eventType,
      customerId: validated.customerId,
      payload: validated.payload || {},
      source: "app",
    },
  });
}

// ============ Lead Management ============

const CreateLeadSchema = z.object({
  phone: z.string().regex(/^9\d{8}$/, "Formato inválido"), // Chile: 9XXXXXXXX
  customerName: z.string().optional(),
  productId: z.string().uuid().optional(),
  catalogSlug: z.string(),
});

export async function createLead(data: z.infer<typeof CreateLeadSchema>) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Not authenticated");

  // Dedupe: si existe lead con mismo phone + catalog en últimos 5 minutos
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const phoneHashValue = hashPhone(data.phone);

  const existing = await prisma.lead.findFirst({
    where: {
      sellerId: session.user.id,
      catalogSlug: data.catalogSlug,
      phoneHash: phoneHashValue,
      createdAt: { gte: fiveMinutesAgo },
    },
  });

  if (existing) {
    return existing;
  }

  const lead = await prisma.lead.create({
    data: {
      sellerId: session.user.id,
      phone: data.phone,
      phoneHash: phoneHashValue,
      phoneValidated: isValidChilePhone(data.phone),
      customerName: data.customerName,
      productId: data.productId,
      catalogSlug: data.catalogSlug,
      status: "pending",
    },
  });

  // Emitir evento
  await emitSellerEvent({
    eventType: "lead_created",
    payload: { leadId: lead.id, phone: data.phone },
  });

  return lead;
}

// ============ Follow-up Management ============

const MarkFollowUpSchema = z.object({
  leadId: z.string().uuid(),
  notes: z.string().optional(),
});

export async function markFollowUp(data: z.infer<typeof MarkFollowUpSchema>) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Not authenticated");

  // Verificar que el lead es del vendedor
  const lead = await prisma.lead.findFirst({
    where: { id: data.leadId, sellerId: session.user.id },
  });

  if (!lead) throw new Error("Lead not found");

  // Crear follow-up
  const followUp = await prisma.followUp.create({
    data: {
      leadId: data.leadId,
      sellerId: session.user.id,
      notes: data.notes,
    },
  });

  // Actualizar estado del lead
  await prisma.lead.update({
    where: { id: data.leadId },
    data: { status: "responded" },
  });

  // Emitir evento
  await emitSellerEvent({
    eventType: "follow_up_marked",
    payload: { leadId: data.leadId, followUpId: followUp.id },
  });

  return followUp;
}

// ============ Metrics Calculation ============

export interface SellerMetrics {
  conversationRate: number;
  medianResponseTime: number;
  followUpRate: number;
  postFollowConversion: number;
  performanceScore: number;
  performanceLevel: "green" | "amber" | "red";
  visitsCount: number;
  leadsCount: number;
  followUpCount: number;
  leadToQuotationRate: number;
  quotationApprovalRate: number;
  salesCycleTime: number;
  avgTicket: number;
  openPipeline: number;
}

export async function getSellerMetrics(
  sellerId: string,
  weekStartDate: Date,
  weekEndDate: Date,
): Promise<SellerMetrics> {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || session.user.id !== sellerId) {
    throw new Error("Unauthorized");
  }

  // Conversión: clientes únicos que compraron / visitaron
  const visitors = await prisma.sellerEvent.findMany({
    where: {
      sellerId,
      eventType: "visita",
      createdAt: { gte: weekStartDate, lte: weekEndDate },
    },
    select: { customerId: true },
    distinct: ["customerId"],
  });

  const buyers = await prisma.sellerEvent.findMany({
    where: {
      sellerId,
      eventType: "checkout",
      createdAt: { gte: weekStartDate, lte: weekEndDate },
    },
    select: { customerId: true },
    distinct: ["customerId"],
  });

  const conversionRate = visitors.length > 0 ? (buyers.length / visitors.length) * 100 : 0;

  // Tiempo de primera respuesta
  const followUps = await prisma.followUp.findMany({
    where: {
      sellerId,
      createdAt: { gte: weekStartDate, lte: weekEndDate },
    },
    include: { lead: true },
  });

  const responseTimes = followUps
    .map((fu) => {
      const duration = fu.markedAt.getTime() - fu.lead.createdAt.getTime();
      return duration / (1000 * 60 * 60); // Horas
    })
    .sort((a, b) => a - b);

  const medianResponseTime =
    responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length / 2)] : 0;

  // Tasa de seguimiento
  const leadsCount = await prisma.lead.count({
    where: {
      sellerId,
      createdAt: { gte: weekStartDate, lte: weekEndDate },
      phoneValidated: true,
    },
  });

  const followUpCount = followUps.length;
  const followUpRate = leadsCount > 0 ? (followUpCount / leadsCount) * 100 : 0;

  // Conversión post-seguimiento
  const postFollowBuyers = await prisma.sellerEvent.findMany({
    where: {
      sellerId,
      eventType: "checkout",
      createdAt: {
        gte: weekStartDate,
        lte: new Date(weekEndDate.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 días
      },
    },
    select: { customerId: true },
  });

  const postFollowConversion = followUpCount > 0 ? (postFollowBuyers.length / followUpCount) * 100 : 0;

  // ============ Pipeline Metrics ============

  // 1. Lead to Quotation Rate
  const totalLeads = await prisma.lead.count({
    where: { sellerId, createdAt: { gte: weekStartDate, lte: weekEndDate } },
  });

  const leadsWithQuotations = await prisma.lead.count({
    where: {
      sellerId,
      createdAt: { gte: weekStartDate, lte: weekEndDate },
      quotations: { some: {} },
    },
  });

  const leadToQuotationRate = totalLeads > 0 ? (leadsWithQuotations / totalLeads) * 100 : 0;

  // 2. Quotation Approval Rate
  const sentQuotations = await prisma.quotation.count({
    where: {
      sellerId,
      createdAt: { gte: weekStartDate, lte: weekEndDate },
      status: "sent",
    },
  });

  const approvedQuotations = await prisma.quotation.count({
    where: {
      sellerId,
      createdAt: { gte: weekStartDate, lte: weekEndDate },
      status: "approved",
    },
  });

  const quotationApprovalRate =
    sentQuotations > 0 ? (approvedQuotations / sentQuotations) * 100 : 0;

  // 3. Sales Cycle Time (median days from lead to quotation approval)
  const leadQuotationPairs = await prisma.quotation.findMany({
    where: {
      sellerId,
      createdAt: { gte: weekStartDate, lte: weekEndDate },
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
      createdAt: { gte: weekStartDate, lte: weekEndDate },
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

  // ============ New Sales Performance Score (0-100) ============
  // Score =
  //   0.20 × tasa_lead_to_quotation (normalizada) +
  //   0.25 × tasa_quotation_approval (normalizada) +
  //   0.15 × tiempo_ciclo (inverso: más rápido = mejor) +
  //   0.15 × ticket_promedio (normalizado vs histórico) +
  //   0.25 × conversión_venta (existente, mejora por pipeline cerrado)

  const normalizedLeadToQuotation = Math.min(100, (leadToQuotationRate / 100) * 100);
  const normalizedQuotationApproval = quotationApprovalRate; // Already 0-100
  const normalizedSalesCycle = salesCycleTime > 0 ? Math.min(100, (100 / (salesCycleTime + 1)) * 10) : 100;
  const normalizedTicket = avgTicket > 0 ? Math.min(100, (avgTicket / 1000) * 100) : 0;
  const normalizedConversion = conversionRate;

  const performanceScore =
    0.2 * (normalizedLeadToQuotation / 100) * 100 +
    0.25 * (normalizedQuotationApproval / 100) * 100 +
    0.15 * (normalizedSalesCycle / 100) * 100 +
    0.15 * (normalizedTicket / 100) * 100 +
    0.25 * (normalizedConversion / 100) * 100;

  // Semáforo
  const performanceLevel: "green" | "amber" | "red" =
    performanceScore >= 70 ? "green" : performanceScore >= 40 ? "amber" : "red";

  return {
    conversationRate: Math.round(conversionRate * 10) / 10,
    medianResponseTime: Math.round(medianResponseTime * 10) / 10,
    followUpRate: Math.round(followUpRate * 10) / 10,
    postFollowConversion: Math.round(postFollowConversion * 10) / 10,
    performanceScore: Math.min(100, Math.round(performanceScore * 10) / 10),
    performanceLevel,
    visitsCount: visitors.length,
    leadsCount,
    followUpCount,
    leadToQuotationRate: Math.round(leadToQuotationRate * 10) / 10,
    quotationApprovalRate: Math.round(quotationApprovalRate * 10) / 10,
    salesCycleTime: Math.round(salesCycleTime * 10) / 10,
    avgTicket: Math.round(avgTicket * 100) / 100,
    openPipeline,
  };
}

export interface Recommendation {
  text: string;
  deepLink: string;
  priority: "high" | "medium" | "low";
}

export async function getRecommendations(metrics: SellerMetrics): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  if (metrics.leadsCount < 3) {
    recommendations.push({
      text: "Comparte tu catálogo más; necesitas más consultas",
      deepLink: "/vendedor/compartir",
      priority: "high",
    });
  }

  if (metrics.followUpRate < 50 && metrics.leadsCount > 0) {
    recommendations.push({
      text: `Tienes ${metrics.leadsCount - metrics.followUpCount} clientes sin responder`,
      deepLink: "/vendedor",
      priority: "high",
    });
  }

  if (metrics.conversationRate < 2 && metrics.visitsCount > 20) {
    recommendations.push({
      text: "Tu catálogo tiene pocas ventas; mejora fotos y descripciones",
      deepLink: "/admin/productos",
      priority: "medium",
    });
  }

  return recommendations.slice(0, 3); // Máximo 3
}

// ============ Helpers ============

function hashPhone(phone: string): string {
  return crypto.createHash("sha256").update(phone).digest("hex");
}

function isValidChilePhone(phone: string): boolean {
  return /^9\d{8}$/.test(phone.replace(/\D/g, ""));
}
