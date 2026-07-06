# Project Structure

```
dimarza-platform/
├── .kiro/
│   ├── steering/           # Kiro steering files (product, tech, structure)
│   └── specs/              # Feature specifications (requirements, design, tasks)
├── prisma/
│   └── schema.prisma       # Database schema definition
├── public/
│   ├── logo.svg
│   └── images/
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── layout.tsx      # Root layout (fonts, providers, metadata)
│   │   ├── page.tsx        # Landing / redirect logic
│   │   ├── globals.css     # Tailwind + custom properties
│   │   ├── (auth)/         # Route group: auth pages (no layout chrome)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── registro/
│   │   │       └── page.tsx
│   │   ├── c/              # Catálogo público (seller storefront)
│   │   │   └── [sellerCode]/
│   │   │       ├── page.tsx          # Catálogo del vendedor
│   │   │       ├── [productSlug]/
│   │   │       │   └── page.tsx      # Detalle de producto
│   │   │       └── carrito/
│   │   │           └── page.tsx      # Carrito y checkout
│   │   ├── vendedor/       # Dashboard del vendedor (protegido)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Resumen (ventas, comisiones)
│   │   │   ├── ventas/
│   │   │   │   └── page.tsx          # Historial de ventas
│   │   │   ├── comisiones/
│   │   │   │   └── page.tsx          # Detalle de comisiones
│   │   │   └── compartir/
│   │   │       └── page.tsx          # Link + botones compartir
│   │   └── admin/          # Dashboard admin (protegido)
│   │       ├── layout.tsx
│   │       ├── page.tsx              # Overview / KPIs
│   │       ├── productos/
│   │       │   ├── page.tsx          # Listado de productos
│   │       │   └── [id]/
│   │       │       └── page.tsx      # Editar producto
│   │       ├── vendedores/
│   │       │   └── page.tsx          # Gestión de vendedores
│   │       ├── pedidos/
│   │       │   ├── page.tsx          # Listado de pedidos
│   │       │   └── [id]/
│   │       │       └── page.tsx      # Detalle de pedido
│   │       └── comisiones/
│   │           └── page.tsx          # Gestión de comisiones
│   ├── components/
│   │   ├── ui/             # shadcn/ui components (button, input, card, etc.)
│   │   ├── layout/         # Navbar, Sidebar, Footer, MobileNav
│   │   ├── catalog/        # ProductCard, ProductGrid, CategoryFilter
│   │   ├── cart/            # CartItem, CartSummary, CheckoutForm
│   │   ├── dashboard/      # StatCard, SalesChart, CommissionTable
│   │   └── shared/         # Logo, ShareButton, StatusBadge, EmptyState
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts   # Supabase browser client
│   │   │   ├── server.ts   # Supabase server client (cookies)
│   │   │   └── admin.ts    # Supabase admin client (service role)
│   │   ├── prisma.ts       # Prisma client singleton
│   │   ├── utils.ts        # Utility functions (cn, formatPrice, etc.)
│   │   ├── constants.ts    # App-wide constants (commission %, statuses)
│   │   └── validations.ts  # Zod schemas compartidos
│   ├── actions/            # Server Actions
│   │   ├── auth.ts         # Register, login, logout
│   │   ├── products.ts     # CRUD productos (admin)
│   │   ├── orders.ts       # Crear pedido, actualizar estado
│   │   ├── sellers.ts      # Gestión de vendedores
│   │   └── commissions.ts  # Cálculo y gestión de comisiones
│   ├── hooks/              # Custom React hooks
│   │   ├── use-cart.ts     # Cart state (localStorage)
│   │   └── use-seller-code.ts  # Seller attribution from URL
│   └── types/              # TypeScript type definitions
│       ├── database.ts     # Types generated from Prisma
│       └── index.ts        # App-level types and enums
├── .env.local              # Environment variables (not committed)
├── .env.example            # Example env file (committed)
├── AGENTS.md               # Codex/AI agent instructions
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## Routing architecture

### Rutas públicas (sin auth)
- `/` — Landing o redirect
- `/login` — Login
- `/registro` — Registro de vendedor
- `/c/[sellerCode]` — Catálogo personalizado del vendedor
- `/c/[sellerCode]/[productSlug]` — Detalle de producto
- `/c/[sellerCode]/carrito` — Carrito y checkout

### Rutas protegidas: Vendedor
- `/vendedor` — Dashboard resumen
- `/vendedor/ventas` — Historial de ventas atribuidas
- `/vendedor/comisiones` — Comisiones detalladas
- `/vendedor/compartir` — Link personalizado + share buttons

### Rutas protegidas: Admin
- `/admin` — Overview con KPIs
- `/admin/productos` — CRUD de productos
- `/admin/vendedores` — Gestión vendedores (activar/desactivar)
- `/admin/pedidos` — Listado y detalle de pedidos
- `/admin/comisiones` — Gestión de pagos de comisiones

## Middleware

El middleware de Next.js (`middleware.ts` en raíz de `src/`) maneja:
1. Verificación de sesión Supabase
2. Redirect de usuarios no autenticados en rutas `/vendedor/*` y `/admin/*`
3. Redirect de usuarios sin rol `admin` en rutas `/admin/*`
4. Refresh de tokens de sesión

## Convenciones de importación

```typescript
// 1. Externos
import { useState } from "react";
import { redirect } from "next/navigation";

// 2. Internos con alias @/
import { Button } from "@/components/ui/button";
import { createOrder } from "@/actions/orders";
import { prisma } from "@/lib/prisma";

// 3. Tipos
import type { Order, Seller } from "@/types";
```
