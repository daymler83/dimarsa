# Shopping Cart & Checkout — Design

## Database Schema

### Table: orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_method TEXT NOT NULL CHECK (shipping_method IN ('delivery', 'pickup')),
  shipping_address JSONB,
  seller_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

### Table: order_items
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_image_url TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
```

### Prisma models
```prisma
model Order {
  id              String      @id @default(uuid()) @db.Uuid
  orderNumber     Int         @default(autoincrement()) @map("order_number")
  customerName    String      @map("customer_name")
  customerEmail   String      @map("customer_email")
  customerPhone   String      @map("customer_phone")
  shippingMethod  String      @map("shipping_method")
  shippingAddress Json?       @map("shipping_address")
  sellerId        String?     @map("seller_id") @db.Uuid
  status          String      @default("pending")
  subtotal        Decimal     @db.Decimal(10, 2)
  shippingCost    Decimal     @default(0) @map("shipping_cost") @db.Decimal(10, 2)
  total           Decimal     @db.Decimal(10, 2)
  notes           String?
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  seller      Profile?     @relation("SellerOrders", fields: [sellerId], references: [id])
  items       OrderItem[]
  commissions Commission[]

  @@map("orders")
}

model OrderItem {
  id              String   @id @default(uuid()) @db.Uuid
  orderId         String   @map("order_id") @db.Uuid
  productId       String?  @map("product_id") @db.Uuid
  productName     String   @map("product_name")
  productImageUrl String?  @map("product_image_url")
  quantity        Int
  unitPrice       Decimal  @map("unit_price") @db.Decimal(10, 2)
  total           Decimal  @db.Decimal(10, 2)
  createdAt       DateTime @default(now()) @map("created_at")

  order   Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product? @relation(fields: [productId], references: [id])

  @@map("order_items")
}
```

## Cart State Management

The cart lives in localStorage as a JSON array. No server-side cart for MVP (simplicity).

```typescript
// hooks/use-cart.ts
interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  sellerCode: string;
}

function useCart(sellerCode: string) {
  const [cart, setCart] = useState<CartState>(() => {
    if (typeof window === "undefined") return { items: [], sellerCode };
    const stored = localStorage.getItem(`cart_${sellerCode}`);
    return stored ? JSON.parse(stored) : { items: [], sellerCode };
  });

  // Sync to localStorage on every change
  useEffect(() => {
    localStorage.setItem(`cart_${sellerCode}`, JSON.stringify(cart));
  }, [cart, sellerCode]);

  const addItem = (product: CartItem) => { ... };
  const removeItem = (productId: string) => { ... };
  const updateQuantity = (productId: string, quantity: number) => { ... };
  const clearCart = () => { ... };
  const subtotal = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return { cart, addItem, removeItem, updateQuantity, clearCart, subtotal, itemCount };
}
```

## Checkout Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Cart Page  │────▶│ Checkout Form│────▶│ Server Action │────▶│ Confirmation │
│  /carrito    │     │ (same page)  │     │ createOrder() │     │   Page       │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                │
                                                ├── Create Order
                                                ├── Create OrderItems
                                                ├── Create Commission
                                                └── Return order number
```

## Create Order Server Action

```typescript
// actions/orders.ts
async function createOrder(formData: FormData) {
  "use server";
  
  const cartData = JSON.parse(formData.get("cartData") as string);
  const sellerCode = formData.get("sellerCode") as string;
  
  // 1. Validate customer data
  const customer = checkoutSchema.parse({ ... });
  
  // 2. Find seller by code
  const seller = sellerCode 
    ? await prisma.profile.findFirst({ where: { sellerCode, active: true } })
    : null;
  
  // 3. Verify products and prices still valid
  const products = await prisma.product.findMany({
    where: { id: { in: cartData.map(i => i.productId) }, active: true },
  });
  
  // 4. Calculate totals with current DB prices (prevent tampering)
  const items = cartData.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) throw new Error(`Producto no disponible: ${item.productName}`);
    return {
      productId: product.id,
      productName: product.name,
      productImageUrl: product.imageUrl,
      quantity: item.quantity,
      unitPrice: product.price,
      total: product.price * item.quantity,
    };
  });
  
  const subtotal = items.reduce((sum, i) => sum + Number(i.total), 0);
  const total = subtotal; // No shipping cost in MVP
  
  // 5. Create order + items + commission in transaction
  const order = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingMethod: customer.shippingMethod,
        shippingAddress: customer.shippingMethod === "delivery" ? customer.address : null,
        sellerId: seller?.id,
        subtotal,
        total,
        items: { create: items },
      },
      include: { items: true },
    });
    
    // Create commission if seller attributed
    if (seller) {
      await tx.commission.create({
        data: {
          orderId: order.id,
          sellerId: seller.id,
          amount: total * COMMISSION_PERCENTAGE,
          percentage: COMMISSION_PERCENTAGE * 100,
          status: "pending",
        },
      });
    }
    
    return order;
  });
  
  redirect(`/c/${sellerCode}/confirmacion/${order.id}`);
}
```

## Validation Schemas

```typescript
export const checkoutSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "Teléfono inválido"),
  shippingMethod: z.enum(["delivery", "pickup"]),
  address: z.object({
    street: z.string().min(2),
    number: z.string().min(1),
    comuna: z.string().min(2),
    city: z.string().min(2),
    region: z.string().min(2),
  }).optional(),
});
```
