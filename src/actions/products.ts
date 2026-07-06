"use server";

import { revalidatePath } from "next/cache";

import { requireAdminProfile } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { generateSlug } from "@/lib/utils";
import { productSchema, type ProductInput } from "@/lib/validations";

const PRODUCT_IMAGES_BUCKET = "product-images";

type ProductActionResult = { error?: string; productId?: string };

async function generateUniqueProductSlug(name: string, excludeId?: string) {
  const baseSlug = generateSlug(name);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function createProduct(input: ProductInput): Promise<ProductActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return { error: "No autorizado" };
  }

  const parsed = productSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const slug = await generateUniqueProductSlug(parsed.data.name);

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      compareAtPrice: parsed.data.compareAtPrice ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      categoryId: parsed.data.categoryId ?? null,
      stock: parsed.data.stock,
    },
  });

  revalidatePath("/admin/productos");

  return { productId: product.id };
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<ProductActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return { error: "No autorizado" };
  }

  const parsed = productSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const existing = await prisma.product.findUnique({ where: { id }, select: { name: true, slug: true } });

  if (!existing) {
    return { error: "Producto no encontrado" };
  }

  const slug =
    existing.name === parsed.data.name
      ? existing.slug
      : await generateUniqueProductSlug(parsed.data.name, id);

  await prisma.product.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      compareAtPrice: parsed.data.compareAtPrice ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      categoryId: parsed.data.categoryId ?? null,
      stock: parsed.data.stock,
    },
  });

  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${id}`);

  return { productId: id };
}

export async function toggleProductActive(id: string): Promise<ProductActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return { error: "No autorizado" };
  }

  const product = await prisma.product.findUnique({ where: { id }, select: { active: true } });

  if (!product) {
    return { error: "Producto no encontrado" };
  }

  await prisma.product.update({
    where: { id },
    data: { active: !product.active },
  });

  revalidatePath("/admin/productos");

  return { productId: id };
}

export async function uploadProductImage(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  try {
    await requireAdminProfile();
  } catch {
    return { error: "No autorizado" };
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona una imagen" };
  }

  const adminClient = createAdminSupabaseClient();
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await adminClient.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: "No pudimos subir la imagen" };
  }

  const { data } = adminClient.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);

  return { url: data.publicUrl };
}
