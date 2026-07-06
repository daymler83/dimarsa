# Admin Dashboard — Design

## Admin Overview Page (`/admin`)

### Data queries
```typescript
async function getAdminDashboard() {
  const [sellerCount, orderStats, todayOrders, pendingCommissions, topSellers, recentOrders] = 
    await Promise.all([
      // Active sellers count
      prisma.profile.count({ where: { role: "seller", active: true } }),
      
      // Order aggregate
      prisma.order.aggregate({
        where: { status: { not: "cancelled" } },
        _count: true,
        _sum: { total: true },
      }),
      
      // Today's orders
      prisma.order.count({
        where: {
          createdAt: { gte: startOfDay(new Date()) },
          status: { not: "cancelled" },
        },
      }),
      
      // Pending commissions total
      prisma.commission.aggregate({
        where: { status: { in: ["pending", "approved"] } },
        _sum: { amount: true },
      }),
      
      // Top 5 sellers by revenue
      prisma.order.groupBy({
        by: ["sellerId"],
        where: { status: { not: "cancelled" }, sellerId: { not: null } },
        _sum: { total: true },
        _count: true,
        orderBy: { _sum: { total: "desc" } },
        take: 5,
      }),
      
      // Last 10 orders
      prisma.order.findMany({
        include: { seller: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  // Hydrate top sellers with profile info
  const sellerIds = topSellers.map(s => s.sellerId).filter(Boolean);
  const sellerProfiles = await prisma.profile.findMany({
    where: { id: { in: sellerIds as string[] } },
  });

  return { sellerCount, orderStats, todayOrders, pendingCommissions, topSellers, sellerProfiles, recentOrders };
}
```

## Component Architecture

### Admin Layout
```
/admin/layout.tsx
├── AdminSidebar (desktop: fixed left, mobile: Sheet/drawer)
│   ├── Logo
│   ├── NavItem: Overview (/admin)
│   ├── NavItem: Productos (/admin/productos)
│   ├── NavItem: Vendedores (/admin/vendedores)
│   ├── NavItem: Pedidos (/admin/pedidos)
│   └── NavItem: Comisiones (/admin/comisiones)
├── AdminHeader (mobile: hamburger + title, desktop: breadcrumb + user info)
└── Main content area (children)
```

### Overview Page
```
/admin/page.tsx
├── KPI Cards Row (4 cards)
│   ├── StatCard: Vendedores activos
│   ├── StatCard: Total pedidos (+ hoy badge)
│   ├── StatCard: Revenue total
│   └── StatCard: Comisiones pendientes
├── SalesChart (Recharts BarChart — last 30 days)
├── Two-column layout:
│   ├── TopSellersCard (ranking list)
│   └── RecentOrdersCard (compact table)
```

## Seller Management Page (`/admin/vendedores`)

### Server actions
```typescript
// actions/sellers.ts
async function toggleSellerActive(sellerId: string) {
  "use server";
  const seller = await prisma.profile.findUnique({ where: { id: sellerId } });
  await prisma.profile.update({
    where: { id: sellerId },
    data: { active: !seller!.active },
  });
  revalidatePath("/admin/vendedores");
}
```

### Component
```
/admin/vendedores/page.tsx
├── SearchInput (search by name or code)
├── SellersTable
│   ├── Columns: Nombre, Código, Teléfono, Fecha registro, Ventas, Comisión, Estado
│   ├── Active toggle (Switch component per row)
│   └── Sort by column headers
```

## Order Management Pages

### Orders List (`/admin/pedidos`)
```
├── OrderFilters (status dropdown, seller dropdown, date range picker)
├── OrdersTable
│   ├── Columns: # Pedido, Fecha, Cliente, Vendedor, Total, Estado
│   └── Click row → navigate to detail
├── Pagination
```

### Order Detail (`/admin/pedidos/[id]`)
```
├── OrderHeader (order #, date, status badge, status update dropdown)
├── Two-column layout:
│   ├── CustomerInfo card (name, email, phone, shipping address)
│   └── SellerAttribution card (seller name, code, commission amount)
├── OrderItemsTable (product, qty, unit price, total)
├── OrderTotals (subtotal, shipping, total)
├── StatusUpdateForm (dropdown + "Actualizar" button)
```

### Status update action
```typescript
// actions/orders.ts
async function updateOrderStatus(orderId: string, newStatus: string) {
  "use server";
  
  const order = await prisma.order.findUnique({ 
    where: { id: orderId },
    include: { commissions: true },
  });
  
  // Validate status transition
  const validTransitions: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["preparing", "cancelled"],
    preparing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
  };
  
  if (!validTransitions[order!.status]?.includes(newStatus)) {
    throw new Error("Transición de estado inválida");
  }
  
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });
    
    // If cancelled, cancel commission
    if (newStatus === "cancelled" && order!.commissions.length > 0) {
      await tx.commission.updateMany({
        where: { orderId },
        data: { status: "cancelled" },
      });
    }
    
    // If delivered, approve commission
    if (newStatus === "delivered" && order!.commissions.length > 0) {
      await tx.commission.updateMany({
        where: { orderId, status: "pending" },
        data: { status: "approved" },
      });
    }
  });
  
  revalidatePath(`/admin/pedidos/${orderId}`);
}
```

## Visual Design Notes

- Admin sidebar: navy background (#1B2A4A), white text, gold active indicator
- Content area: cream background (#F5F0E8) or white
- Cards: white with subtle border, rounded corners
- Tables: clean, alternating row backgrounds, hover states
- Status badges: color-coded (pending=yellow, confirmed=blue, shipped=purple, delivered=green, cancelled=red)
- Charts: gold (#D4A843) as primary bar/area color, navy for secondary
- Mobile: sidebar becomes slide-out sheet, tables become card lists
