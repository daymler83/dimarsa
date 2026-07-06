# Commission Tracking — Design

## Database Schema

### Table: commissions
```sql
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_commissions_seller ON commissions(seller_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_commissions_order ON commissions(order_id);
```

### Prisma model
```prisma
model Commission {
  id         String    @id @default(uuid()) @db.Uuid
  orderId    String    @map("order_id") @db.Uuid
  sellerId   String    @map("seller_id") @db.Uuid
  amount     Decimal   @db.Decimal(10, 2)
  percentage Decimal   @db.Decimal(5, 2)
  status     String    @default("pending")
  paidAt     DateTime? @map("paid_at")
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  order  Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  seller Profile @relation(fields: [sellerId], references: [id])

  @@map("commissions")
}
```

## Commission Status Flow

```
pending ──▶ approved ──▶ paid
   │
   └──────▶ cancelled (if order cancelled)
```

- **pending**: Created automatically when order is placed. Means order not yet confirmed.
- **approved**: Admin confirms the order was delivered/fulfilled. Commission is approved for payment.
- **paid**: Admin marks the commission as paid to the seller.
- **cancelled**: Order was cancelled, commission voided.

## Seller Dashboard Data Queries

### Summary stats (`/vendedor`)
```typescript
async function getSellerDashboard(sellerId: string) {
  const [orderStats, commissionStats, recentOrders] = await Promise.all([
    // Total orders and revenue
    prisma.order.aggregate({
      where: { sellerId, status: { not: "cancelled" } },
      _count: true,
      _sum: { total: true },
    }),
    
    // Commission breakdown by status
    prisma.commission.groupBy({
      by: ["status"],
      where: { sellerId },
      _sum: { amount: true },
      _count: true,
    }),
    
    // Recent orders
    prisma.order.findMany({
      where: { sellerId },
      include: { commissions: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  
  return { orderStats, commissionStats, recentOrders };
}
```

### Sales chart data
```typescript
async function getSellerSalesChart(sellerId: string, days: number = 30) {
  const since = subDays(new Date(), days);
  
  const dailySales = await prisma.$queryRaw`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as orders,
      SUM(total) as revenue
    FROM orders 
    WHERE seller_id = ${sellerId}
      AND created_at >= ${since}
      AND status != 'cancelled'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;
  
  return dailySales;
}
```

## Admin Commission Management

### Bulk payment action
```typescript
// actions/commissions.ts
async function markCommissionsPaid(commissionIds: string[]) {
  "use server";
  // Verify admin role
  await prisma.commission.updateMany({
    where: { id: { in: commissionIds }, status: "approved" },
    data: { status: "paid", paidAt: new Date() },
  });
}

async function approveCommissions(commissionIds: string[]) {
  "use server";
  await prisma.commission.updateMany({
    where: { id: { in: commissionIds }, status: "pending" },
    data: { status: "approved" },
  });
}
```

## Component Architecture

### Seller Dashboard
```
/vendedor (page.tsx)
├── StatCard × 4 (total sales, revenue, commission earned, unique customers)
├── SalesChart (Recharts AreaChart — last 30 days)
└── RecentOrdersTable (last 10 orders with commission)

/vendedor/comisiones (page.tsx)
├── CommissionSummary (3 cards: pending, approved, paid)
├── CommissionFilters (status dropdown, date range)
└── CommissionTable (date, order #, total, commission, status badge)
```

### Admin Commissions
```
/admin/comisiones (page.tsx)
├── CommissionOverview (total pending, total approved, total paid across all sellers)
├── SellerCommissionSummary (expandable rows per seller)
│   └── CommissionTable per seller
├── BulkActions (approve selected, mark as paid)
└── Filters (seller, status, date range)
```
