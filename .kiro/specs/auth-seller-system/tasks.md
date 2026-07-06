# Auth & Seller System — Tasks

## Task 1: Project scaffolding and Supabase setup
- [ ] Initialize Next.js 14 project with TypeScript, Tailwind, App Router
- [ ] Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `prisma`, `@prisma/client`, `zod`, `lucide-react`
- [ ] Install and configure shadcn/ui (Button, Input, Card, Label, Badge, Table, Dialog, DropdownMenu, Select, Tabs, Separator, Avatar, Sheet)
- [ ] Create `.env.example` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
- [ ] Configure Tailwind with custom colors from steering/tech.md
- [ ] Create `globals.css` with CSS custom properties for the color palette
- [ ] Set up `src/lib/supabase/client.ts` (browser client)
- [ ] Set up `src/lib/supabase/server.ts` (server client with cookies)
- [ ] Set up `src/lib/supabase/admin.ts` (service role client)
- [ ] Set up `src/lib/prisma.ts` (singleton)
- [ ] Set up path alias `@/` in `tsconfig.json`
**Depends on:** nothing
**Relates to:** REQ-1, REQ-2

## Task 2: Database schema (Prisma)
- [ ] Create `prisma/schema.prisma` with all models: Profile, Product, Category, Order, OrderItem, Commission
- [ ] Configure Prisma datasource for Supabase PostgreSQL
- [ ] Define all relations, indexes, and constraints as specified in design docs
- [ ] Create seed file `prisma/seed.ts` with: 1 admin user, 3 sample sellers, 5 sample products in 2 categories
**Depends on:** Task 1
**Relates to:** REQ-1

## Task 3: Validation schemas
- [ ] Create `src/lib/validations.ts` with Zod schemas: `registerSchema`, `loginSchema`
- [ ] Create `src/lib/utils.ts` with helpers: `cn()`, `formatPrice()`, `generateSellerCode()`
- [ ] Create `src/lib/constants.ts` with: `COMMISSION_PERCENTAGE = 0.10`, order statuses, commission statuses
**Depends on:** Task 1
**Relates to:** REQ-1, REQ-2, REQ-3

## Task 4: Registration page and server action
- [ ] Create `src/actions/auth.ts` with `registerSeller` server action
- [ ] Implement seller code generation with collision check (3 retries)
- [ ] Create `src/app/(auth)/registro/page.tsx` — registration form
- [ ] Form fields: nombre completo, email, teléfono, contraseña
- [ ] Client-side validation with Zod before submit
- [ ] Display server errors inline
- [ ] Style with Dimarza branding (navy/gold/cream)
- [ ] Mobile-first responsive layout
**Depends on:** Task 2, Task 3
**Relates to:** REQ-1

## Task 5: Login page and server action
- [ ] Add `loginUser` server action to `src/actions/auth.ts`
- [ ] Create `src/app/(auth)/login/page.tsx` — login form
- [ ] Redirect based on role after login (seller → /vendedor, admin → /admin)
- [ ] Display generic error on failed auth
- [ ] Link to `/registro` from login page
- [ ] Style consistent with registration page
**Depends on:** Task 2, Task 3
**Relates to:** REQ-2

## Task 6: Auth layout
- [ ] Create `src/app/(auth)/layout.tsx` — minimal layout for auth pages (logo, centered card, cream background)
- [ ] No navbar or sidebar, just brand identity
**Depends on:** Task 4
**Relates to:** REQ-1, REQ-2

## Task 7: Middleware for route protection
- [ ] Create `src/middleware.ts` with Supabase session verification
- [ ] Protect `/vendedor/*` routes — require auth with seller role
- [ ] Protect `/admin/*` routes — require auth with admin role
- [ ] Redirect authenticated users away from auth pages
- [ ] Configure `matcher` to exclude public routes and static assets
**Depends on:** Task 2
**Relates to:** REQ-4

## Task 8: Seller share page
- [ ] Create `src/app/vendedor/compartir/page.tsx`
- [ ] Display seller's unique catalog URL prominently
- [ ] "Copiar link" button with clipboard API and toast confirmation
- [ ] "Compartir por WhatsApp" button with `https://wa.me/?text=` URL
- [ ] Share buttons for Instagram (copy) and Facebook
- [ ] Show QR code of the catalog link (optional, nice-to-have)
- [ ] Mobile-optimized layout
**Depends on:** Task 4, Task 7
**Relates to:** REQ-3

## Task 9: Seller attribution hook
- [ ] Create `src/hooks/use-seller-code.ts` — sets `dimarza_ref` cookie on catalog visit
- [ ] Cookie: 30-day TTL, path `/`, SameSite Lax
- [ ] Create utility to read `dimarza_ref` from cookies on server side
**Depends on:** Task 3
**Relates to:** REQ-3

## Task 10: Logout action
- [ ] Add `logout` server action to `src/actions/auth.ts`
- [ ] Clear Supabase session and cookies
- [ ] Redirect to `/login`
**Depends on:** Task 5
**Relates to:** REQ-5
