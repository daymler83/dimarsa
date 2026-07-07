# AGENTS.md — Dimarza: Plataforma de Distribución Digital

## Project overview

Dimarza is a digital distribution platform that transforms a product catalog into a scalable, traceable sales network. Sellers register, receive a unique link, share it on WhatsApp/social media, and earn automatic commissions on every attributed sale. Customers buy directly from the seller's personalized catalog. Dimarza admins manage products, sellers, orders, and commission payments.

This is an **MVP** meant to demonstrate the full flow working end-to-end for investor/stakeholder validation. It must look polished, be deployable to a real URL, and complete the core loop: register → share → buy → commission appears.

## How to read this project

This project uses the Kiro spec-driven development schema:

### Steering (project-wide context)
- `.kiro/steering/product.md` — Business context, users, MVP scope, KPIs, visual identity
- `.kiro/steering/tech.md` — Stack, dependencies, coding conventions, color palette
- `.kiro/steering/structure.md` — File/folder structure, routing, middleware, import conventions

### Specs (feature modules)
Each spec has `requirements.md` (user stories + acceptance criteria in EARS), `design.md` (schema, architecture, pseudocode), and `tasks.md` (implementation checklist).

1. `.kiro/specs/auth-seller-system/` — Registration, login, seller codes, links, route protection
2. `.kiro/specs/product-catalog/` — Product CRUD, categories, public catalog, product detail
3. `.kiro/specs/catalog-selection/` — Admin-defined catalogs (category/product groupings), seller picks one to share, replaces the "share full catalog" flow
4. `.kiro/specs/shopping-cart-checkout/` — Cart (localStorage), checkout form, order creation
5. `.kiro/specs/commission-tracking/` — Commission calculation, seller dashboard, admin payments
6. `.kiro/specs/admin-dashboard/` — KPI overview, seller management, order management, layout

## Build order

Execute specs in this order — each builds on the previous:

1. **auth-seller-system** (Tasks 1-10) — Project setup, DB schema, auth, middleware
2. **product-catalog** (Tasks 1-8) — Products, categories, public catalog
3. **catalog-selection** (Tasks 1-8) — Catalog model, admin management, seller picks a catalog to share, nested public routes
4. **shopping-cart-checkout** (Tasks 1-6) — Cart, checkout, order creation with commission
5. **commission-tracking** (Tasks 1-7) — Dashboards, commission management
6. **admin-dashboard** (Tasks 1-6) — Admin layout, overview, seller/order management, seed data

## Critical rules

### Tech stack (non-negotiable for this project)
- Next.js 14+ with App Router, TypeScript strict
- Supabase (Auth + PostgreSQL + Storage)
- Prisma ORM for all database access
- Tailwind CSS + shadcn/ui for UI
- Zod for all input validation
- Server Actions for mutations (no API routes except webhooks)
- Deploy-ready on Vercel

### Code conventions
- Files/folders: `kebab-case`
- Components: `PascalCase`
- DB columns: `snake_case`, Prisma fields: `camelCase` with `@map`
- Server Components by default; `"use client"` only when needed
- No `any` — use `unknown` if truly needed
- All imports use `@/` alias
- Spanish for user-facing text, English for code/comments

### Visual identity
- Navy (#1B2A4A), Gold (#D4A843), Cream (#F5F0E8)
- Mobile-first responsive design
- Status badges: pending=yellow, confirmed=blue, preparing=purple, shipped=indigo, delivered=green, cancelled=red

### Security (even for MVP)
- Row Level Security enabled on all Supabase tables
- Server-side role verification on all admin/seller actions
- Re-verify product prices from DB on order creation (prevent client tampering)
- Generic auth error messages (don't reveal if email exists)
- Middleware protects all `/vendedor/*` and `/admin/*` routes

### Demo readiness
- Seed script creates realistic demo data (Chilean context)
- Admin login: admin@dimarza.cl / admin123
- 5 sample sellers, 15-20 products, 20-30 orders with varied statuses
- Functional end-to-end: registration → catalog sharing → purchase → commission tracking

## Environment variables required

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```
