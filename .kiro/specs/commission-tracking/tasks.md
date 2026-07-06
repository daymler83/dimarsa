# Commission Tracking — Tasks

## Task 1: Commission model and constants
- [ ] Add Commission model to `prisma/schema.prisma` (if not already included in auth setup)
- [ ] Add `COMMISSION_PERCENTAGE = 0.10` to `src/lib/constants.ts`
- [ ] Add commission status types to `src/types/index.ts`
**Depends on:** auth-seller-system/Task 2
**Relates to:** REQ-1

## Task 2: Commission server actions
- [ ] Create `src/actions/commissions.ts`
- [ ] `approveCommissions(ids: string[])` — bulk approve pending → approved (admin only)
- [ ] `markCommissionsPaid(ids: string[])` — bulk mark approved → paid with paidAt timestamp (admin only)
- [ ] `cancelCommission(orderId: string)` — mark commission as cancelled when order is cancelled
- [ ] All actions verify admin role before executing
**Depends on:** Task 1
**Relates to:** REQ-1, REQ-4

## Task 3: Seller dashboard home
- [ ] Create `src/app/vendedor/page.tsx`
- [ ] Create `src/components/dashboard/StatCard.tsx` — icon, label, value, optional trend
- [ ] Display 4 stat cards: total ventas, monto vendido, comisión ganada, clientes únicos
- [ ] Create `src/components/dashboard/SalesChart.tsx` — Recharts AreaChart for last 30 days
- [ ] Create recent orders table (last 10) with: date, order #, customer, total, commission
- [ ] All data fetched server-side with seller's session
**Depends on:** Task 1, shopping-cart-checkout/Task 4
**Relates to:** REQ-3

## Task 4: Seller commissions page
- [ ] Create `src/app/vendedor/comisiones/page.tsx`
- [ ] Commission summary cards: pendientes, aprobadas, pagadas (amounts)
- [ ] Create `src/components/dashboard/CommissionTable.tsx` — reusable table
- [ ] Columns: fecha, pedido #, total pedido, comisión, status (color-coded badge)
- [ ] Status filter dropdown
- [ ] Mobile-responsive: cards stack, table scrolls horizontally
**Depends on:** Task 3
**Relates to:** REQ-2

## Task 5: Seller sales history page
- [ ] Create `src/app/vendedor/ventas/page.tsx`
- [ ] Full table of all attributed orders
- [ ] Columns: fecha, pedido #, cliente, productos, total, estado, comisión
- [ ] Pagination (10 per page)
- [ ] Status filter
**Depends on:** Task 3
**Relates to:** REQ-3

## Task 6: Seller dashboard layout
- [ ] Create `src/app/vendedor/layout.tsx`
- [ ] Sidebar navigation (desktop) / bottom tabs (mobile): Resumen, Ventas, Comisiones, Compartir
- [ ] Header with seller name, seller code badge, and logout button
- [ ] Navy sidebar, cream content area
- [ ] Create `src/components/layout/SellerSidebar.tsx`
- [ ] Create `src/components/layout/MobileNav.tsx`
**Depends on:** auth-seller-system/Task 7
**Relates to:** REQ-2, REQ-3

## Task 7: Admin commissions management page
- [ ] Create `src/app/admin/comisiones/page.tsx`
- [ ] Overview cards: total pending, total approved, total paid (all sellers)
- [ ] Table grouped by seller: seller name, pending amount, approved amount, paid amount
- [ ] Expandable rows to see individual commissions per seller
- [ ] Checkbox selection for bulk actions
- [ ] "Aprobar seleccionadas" and "Marcar como pagadas" buttons
- [ ] Filters: seller dropdown, status, date range
**Depends on:** Task 2
**Relates to:** REQ-4
