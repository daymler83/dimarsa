import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getRequiredEnv } from "@/lib/env";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const path = request.nextUrl.pathname;
  const isProtectedRoute = path.startsWith("/vendedor") || path.startsWith("/admin");
  const isAuthRoute = path === "/login" || path === "/registro";

  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if ((isProtectedRoute && session) || (isAuthRoute && session)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active")
      .eq("id", session.user.id)
      .maybeSingle();

    if (isProtectedRoute) {
      if (!profile?.active) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/login", request.url));
      }

      if (path.startsWith("/admin") && profile.role !== "admin") {
        return NextResponse.redirect(new URL("/vendedor", request.url));
      }
    }

    if (isAuthRoute) {
      const destination = profile?.role === "admin" ? "/admin" : "/vendedor";
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|images|c/|api/).*)",
  ],
};
