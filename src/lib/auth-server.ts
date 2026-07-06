import "server-only";

import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireAdminProfile() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("No autorizado");
  }

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: { role: true, active: true },
  });

  if (!profile?.active || profile.role !== "admin") {
    throw new Error("No autorizado");
  }

  return profile;
}
