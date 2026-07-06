# Admin Dashboard — Tasks

## Task 1: Admin layout
- [ ] Create `src/app/admin/layout.tsx`
- [ ] Create `src/components/layout/AdminSidebar.tsx` — navy sidebar with navigation links
- [ ] Nav items: Overview, Productos, Vendedores, Pedidos, Comisiones (with Lucide icons)
- [ ] Active state: gold left border + lighter background on current route
- [ ] Create `src/components/layout/AdminHeader.tsx` — hamburger (mobile), admin name, logout
- [ ] Mobile: sidebar as Sheet (shadcn) that slides from left
- [ ] Desktop: fixed sidebar 256px wide
**Depends on:** auth-seller-system/Task 7
**Relates to:** REQ-4

## Task 2: Admin overview page
- [ ] Create `src/app/admin/page.tsx`
- [ ] Fetch dashboard data server-side (active sellers, order stats, today orders, pending commissions)
- [ ] Display 4 KPI stat cards in responsive grid
- [ ] Create sales chart (Recharts BarChart) — daily orders/revenue last 30 days
- [ ] Create top sellers ranking card (top 5 by revenue, with name, code, total, orders count)
- [ ] Create recent orders card (last 10, compact table with order #, customer, total, status)
- [ ] Two-column layout on desktop, single column mobile
**Depends on:** Task 1, commission-tracking/Task 1
**Relates to:** REQ-1

## Task 3: Seller management page
- [ ] Create `src/app/admin/vendedores/page.tsx`
- [ ] Create `src/actions/sellers.ts` with `toggleSellerActive`
- [ ] Fetch all sellers with their aggregated sales and commission data
- [ ] Search input (filter by name or seller code, client-side for MVP)
- [ ] Data table columns: Nombre, Código, Teléfono, Registrado, Ventas (#), Comisión ($), Estado
- [ ] Active/Inactive toggle switch per row using server action
- [ ] Sortable column headers (name, sales count, commission amount, date)
- [ ] Mobile: table as card list
**Depends on:** Task 1
**Relates to:** REQ-2

## Task 4: Orders list page
- [ ] Create `src/app/admin/pedidos/page.tsx`
- [ ] Fetch orders with pagination (20 per page)
- [ ] Filters: status dropdown, seller dropdown, date range
- [ ] Data table columns: # Pedido, Fecha, Cliente, Vendedor, Total, Estado (badge)
- [ ] Click row navigates to detail
- [ ] Pagination controls
**Depends on:** Task 1, shopping-cart-checkout/Task 4
**Relates to:** REQ-3

## Task 5: Order detail page
- [ ] Create `src/app/admin/pedidos/[id]/page.tsx`
- [ ] Header: order number, date, current status badge
- [ ] Customer info card: name, email, phone, shipping method, address
- [ ] Seller attribution card: seller name, code, commission amount and status
- [ ] Order items table: product (image + name), quantity, unit price, line total
- [ ] Order totals: subtotal, shipping, total
- [ ] Status update form: dropdown with valid next statuses + "Actualizar" button
- [ ] Status update uses `updateOrderStatus` server action
- [ ] Show status change confirmation dialog before executing
**Depends on:** Task 4, shopping-cart-checkout/Task 6
**Relates to:** REQ-3

## Task 6: Seed data for demo
- [ ] Expand `prisma/seed.ts` to create a comprehensive demo dataset:
  - 1 admin user (admin@dimarza.cl / admin123)
  - 5 seller profiles with unique codes
  - 3 categories (e.g., Herramientas, Materiales de Construcción, Seguridad)
  - 15-20 products across categories with realistic names, prices, and placeholder images
  - 20-30 orders distributed across sellers with varied statuses
  - Corresponding commissions for each order
- [ ] Add seed script to `package.json`: `"seed": "npx prisma db seed"`
- [ ] Use realistic Chilean data (names, addresses, phone formats)
**Depends on:** All other tasks (run last)
**Relates to:** All requirements (demo data)
