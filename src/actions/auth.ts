"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateSellerCode } from "@/lib/utils";
import { loginSchema, registerSchema } from "@/lib/validations";
import type { AuthActionState } from "@/types/auth";

const REGISTER_GENERIC_ERROR =
  "No pudimos crear tu cuenta. Revisa tus datos e intenta nuevamente.";
const LOGIN_GENERIC_ERROR = "Credenciales incorrectas";
const CONFIGURATION_ERROR =
  "La configuracion local aun no esta lista. Falta conectar Supabase y la base de datos.";

async function generateUniqueSellerCode() {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const sellerCode = generateSellerCode();
    const existing = await prisma.profile.findUnique({
      where: { sellerCode },
      select: { id: true },
    });

    if (!existing) {
      return sellerCode;
    }
  }

  throw new Error("Could not generate a unique seller code");
}

function flattenValidationErrors(fieldErrors: Record<string, string[] | undefined>): AuthActionState {
  return { fieldErrors };
}

function getDashboardPath(role: string) {
  return role === "admin" ? "/admin" : "/vendedor";
}

async function createSellerProfile(input: {
  id: string;
  fullName: string;
  phone?: string;
  sellerCode: string;
}) {
  await prisma.profile.create({
    data: {
      id: input.id,
      fullName: input.fullName,
      phone: input.phone ?? null,
      role: "seller",
      sellerCode: input.sellerCode,
      active: true,
    },
  });
}

async function getProfileForUser(userId: string) {
  return prisma.profile.findUnique({
    where: { id: userId },
    select: { active: true, role: true },
  });
}

export async function registerSeller(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return flattenValidationErrors(parsed.error.flatten().fieldErrors);
  }

  try {
    const adminClient = createAdminSupabaseClient();
    const { data, error } = await adminClient.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone ?? "",
      },
    });

    if (error || !data.user) {
      console.error("registerSeller auth failed", error);
      return { message: REGISTER_GENERIC_ERROR };
    }

    try {
      const sellerCode = await generateUniqueSellerCode();
      await createSellerProfile({
        id: data.user.id,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        sellerCode,
      });
    } catch (profileError: unknown) {
      try {
        const adminClient = createAdminSupabaseClient();
        await adminClient.auth.admin.deleteUser(data.user.id);
      } catch {
        // Ignore cleanup errors and keep the user-facing message generic.
      }

      console.error("registerSeller profile creation failed", profileError);

      return { message: REGISTER_GENERIC_ERROR };
    }

    const supabase = createServerSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (signInError) {
      console.error("registerSeller auto login failed", signInError);
      return { message: CONFIGURATION_ERROR };
    }
  } catch (error: unknown) {
    console.error("registerSeller setup failed", error);
    return { message: CONFIGURATION_ERROR };
  }

  redirect("/vendedor");
}

export async function loginUser(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return flattenValidationErrors(parsed.error.flatten().fieldErrors);
  }

  let destination: string;

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.user) {
      console.error("loginUser auth failed", error);
      return { message: LOGIN_GENERIC_ERROR };
    }

    const profile = await getProfileForUser(data.user.id);

    if (!profile?.active || !profile.role) {
      await supabase.auth.signOut();
      return { message: LOGIN_GENERIC_ERROR };
    }

    destination = getDashboardPath(profile.role);
  } catch (error: unknown) {
    console.error("loginUser setup failed", error);
    return { message: CONFIGURATION_ERROR };
  }

  redirect(destination);
}

export async function logout(): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
