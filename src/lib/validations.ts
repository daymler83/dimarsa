import { z } from "zod";

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue === "" ? undefined : trimmedValue;
};

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Nombre requerido"),
  email: z.string().trim().toLowerCase().email("Email invalido"),
  phone: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(8, "Telefono invalido").optional(),
  ),
  password: z.string().min(6, "Minimo 6 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalido"),
  password: z.string().min(1, "Contrasena requerida"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const productSchema = z.object({
  name: z.string().trim().min(2, "Nombre requerido"),
  description: z.preprocess(emptyStringToUndefined, z.string().trim().optional()),
  price: z.coerce.number().positive("Precio debe ser mayor a 0"),
  compareAtPrice: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().positive("Precio debe ser mayor a 0").optional(),
  ),
  categoryId: z.preprocess(emptyStringToUndefined, z.string().uuid().optional()),
  stock: z.coerce.number().int().min(0).default(0),
  imageUrl: z.preprocess(emptyStringToUndefined, z.string().url("URL invalida").optional()),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Nombre requerido"),
});

export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
