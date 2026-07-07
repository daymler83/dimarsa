"use server";

import { revalidatePath } from "next/cache";

import { countCatalogProducts } from "@/lib/catalogs";
import { requireAdminProfile } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { catalogSchema, type CatalogInput } from "@/lib/validations";

type CatalogActionResult = { error?: string; catalogId?: string };

async function generateUniqueCatalogSlug(name: string, excludeId?: string) {
  const baseSlug = generateSlug(name);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const existing = await prisma.catalog.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function getCatalogsWithCounts() {
  const catalogs = await prisma.catalog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      categories: { select: { categoryId: true } },
      products: { select: { productId: true } },
    },
  });

  // Sequential, not Promise.all: each catalog's count fans out into 1-2 more
  // Prisma queries, and Supabase's session pooler caps concurrent connections
  // at 15 -- bursting N catalogs x M queries at once can exhaust that pool.
  const results = [];
  for (const catalog of catalogs) {
    results.push({
      id: catalog.id,
      name: catalog.name,
      slug: catalog.slug,
      description: catalog.description,
      isActive: catalog.isActive,
      categoryIds: catalog.categories.map((entry) => entry.categoryId),
      productIds: catalog.products.map((entry) => entry.productId),
      productCount: await countCatalogProducts(catalog.id),
    });
  }

  return results;
}

export async function getActiveCatalogsForSeller() {
  const catalogs = await prisma.catalog.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  // Sequential for the same connection-pool reason as getCatalogsWithCounts.
  const results = [];
  for (const catalog of catalogs) {
    results.push({
      id: catalog.id,
      name: catalog.name,
      slug: catalog.slug,
      description: catalog.description,
      productCount: await countCatalogProducts(catalog.id),
    });
  }

  return results;
}

export async function createCatalog(input: CatalogInput): Promise<CatalogActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return { error: "No autorizado" };
  }

  const parsed = catalogSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const slug = await generateUniqueCatalogSlug(parsed.data.name);

  const catalog = await prisma.catalog.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description ?? null,
      isActive: parsed.data.isActive,
      categories: {
        create: parsed.data.categoryIds.map((categoryId) => ({ categoryId })),
      },
      products: {
        create: parsed.data.productIds.map((productId) => ({ productId })),
      },
    },
  });

  revalidatePath("/admin/catalogos");

  return { catalogId: catalog.id };
}

export async function updateCatalog(
  id: string,
  input: CatalogInput,
): Promise<CatalogActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return { error: "No autorizado" };
  }

  const parsed = catalogSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const existing = await prisma.catalog.findUnique({ where: { id }, select: { name: true, slug: true } });

  if (!existing) {
    return { error: "Catálogo no encontrado" };
  }

  const slug =
    existing.name === parsed.data.name
      ? existing.slug
      : await generateUniqueCatalogSlug(parsed.data.name, id);

  await prisma.$transaction([
    prisma.catalogCategory.deleteMany({ where: { catalogId: id } }),
    prisma.catalogProduct.deleteMany({ where: { catalogId: id } }),
    prisma.catalog.update({
      where: { id },
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description ?? null,
        isActive: parsed.data.isActive,
        categories: {
          create: parsed.data.categoryIds.map((categoryId) => ({ categoryId })),
        },
        products: {
          create: parsed.data.productIds.map((productId) => ({ productId })),
        },
      },
    }),
  ]);

  revalidatePath("/admin/catalogos");

  return { catalogId: id };
}

export async function deleteCatalog(id: string): Promise<CatalogActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return { error: "No autorizado" };
  }

  const existing = await prisma.catalog.findUnique({ where: { id }, select: { id: true } });

  if (!existing) {
    return { error: "Catálogo no encontrado" };
  }

  await prisma.catalog.delete({ where: { id } });

  revalidatePath("/admin/catalogos");

  return { catalogId: id };
}
