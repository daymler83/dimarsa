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

  // Score 0–100
  const performanceScore =
    0.25 * (conversionRate / 10) + // Normalizar a 100
    0.15 * (Math.min(100, medianResponseTime > 0 ? (100 / medianResponseTime) * 2 : 0)) +
    0.2 * followUpRate +
    0.25 * (postFollowConversion / 50) + // Normalizar
    0.15 * (Math.min(100, (leadsCount / 50) * 100)); // Volumen

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
