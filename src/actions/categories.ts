"use server";

import { revalidatePath } from "next/cache";

import { requireAdminProfile } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { categorySchema } from "@/lib/validations";

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function createCategory(input: { name: string }) {
  await requireAdminProfile();

  const parsed = categorySchema.parse(input);
  const slug = generateSlug(parsed.name);

  const lastCategory = await prisma.category.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const category = await prisma.category.create({
    data: {
      name: parsed.name,
      slug,
      sortOrder: (lastCategory?.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/admin/productos");

  return category;
}
