# Auth & Seller System — Design

## Database Schema

### Table: profiles
Extends Supabase `auth.users` via foreign key on `id`.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('seller', 'admin')),
  seller_code TEXT UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_profiles_seller_code ON profiles(seller_code) WHERE seller_code IS NOT NULL;
```

### Prisma model
```prisma
model Profile {
  id         String   @id @default(uuid()) @db.Uuid
  fullName   String   @map("full_name")
  phone      String?
  role       String   @default("seller")
  sellerCode String?  @unique @map("seller_code")
  active     Boolean  @default(true)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  orders      Order[]      @relation("SellerOrders")
  commissions Commission[]

  @@map("profiles")
}
```

## Seller Code Generation

```typescript
// lib/utils.ts
function generateSellerCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I,O,0,1 for readability
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
```

Collision handling: on insert, if code exists, regenerate (max 3 retries). Given 30^6 = 729M combinations, collisions are statistically negligible for MVP scale.

## Authentication Flow

```
┌──────────┐     ┌───────────────┐     ┌──────────┐
│  /registro│────▶│ Supabase Auth │────▶│ profiles │
│  (form)   │     │  signUp()     │     │  INSERT  │
└──────────┘     └───────────────┘     └──────────┘
                        │
                        ▼
               ┌──────────────┐
               │  Set session  │
               │  cookie       │
               └──────────────┘
                        │
                        ▼
               ┌──────────────┐
               │  Redirect to  │
               │  /vendedor    │
               └──────────────┘
```

## Registration Server Action

```typescript
// actions/auth.ts
async function registerSeller(formData: FormData) {
  "use server";
  
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  
  if (!parsed.success) return { error: parsed.error.flatten() };
  
  const supabase = createServerClient();
  
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  
  if (authError) return { error: authError.message };
  
  // 2. Generate unique seller code
  const sellerCode = await generateUniqueSellerCode();
  
  // 3. Create profile
  await prisma.profile.create({
    data: {
      id: authData.user!.id,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      sellerCode,
      role: "seller",
    },
  });
  
  redirect("/vendedor");
}
```

## Seller Attribution (Cookie)

When a customer visits `/c/[sellerCode]`:

1. The page component reads `sellerCode` from params.
2. A client-side hook stores `sellerCode` in a cookie named `dimarza_ref` with 30-day expiry.
3. On checkout, the cookie value is read and attached to the order.

```typescript
// hooks/use-seller-code.ts
function useSellerCode(sellerCode: string) {
  useEffect(() => {
    document.cookie = `dimarza_ref=${sellerCode};path=/;max-age=${30 * 24 * 60 * 60};SameSite=Lax`;
  }, [sellerCode]);
}
```

## Middleware

```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient({ req: request });
  const { data: { session } } = await supabase.auth.getSession();
  
  const path = request.nextUrl.pathname;
  
  // Protected routes
  if (path.startsWith("/vendedor") || path.startsWith("/admin")) {
    if (!session) return redirect("/login");
    
    const profile = await getProfile(session.user.id);
    
    if (path.startsWith("/admin") && profile.role !== "admin") {
      return redirect("/vendedor");
    }
  }
  
  // Already authenticated → redirect away from auth pages
  if ((path === "/login" || path === "/registro") && session) {
    const profile = await getProfile(session.user.id);
    return redirect(profile.role === "admin" ? "/admin" : "/vendedor");
  }
}
```

## Validation Schemas

```typescript
// lib/validations.ts
import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "Teléfono inválido").optional(),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});
```
