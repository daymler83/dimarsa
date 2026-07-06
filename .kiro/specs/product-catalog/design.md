# Product Catalog — Design

## Database Schema

### Table: categories
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Table: products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  image_url TEXT,
  category_id UUID REFERENCES categories(id),
  stock INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);
```

### Prisma models
```prisma
model Category {
  id        String    @id @default(uuid()) @db.Uuid
  name      String
  slug      String    @unique
  sortOrder Int       @default(0) @map("sort_order")
  createdAt DateTime  @default(now()) @map("created_at")
  products  Product[]

  @@map("categories")
}

model Product {
  id             String      @id @default(uuid()) @db.Uuid
  name           String
  slug           String      @unique
  description    String?
  price          Decimal     @db.Decimal(10, 2)
  compareAtPrice Decimal?    @map("compare_at_price") @db.Decimal(10, 2)
  imageUrl       String?     @map("image_url")
  categoryId     String?     @map("category_id") @db.Uuid
  stock          Int         @default(0)
  active         Boolean     @default(true)
  createdAt      DateTime    @default(now()) @map("created_at")
  updatedAt      DateTime    @updatedAt @map("updated_at")

  category   Category?   @relation(fields: [categoryId], references: [id])
  orderItems OrderItem[]

  @@map("products")
}
```

## Public Catalog Page (`/c/[sellerCode]`)

### Data fetching (Server Component)
```typescript
async function CatalogPage({ params }: { params: { sellerCode: string } }) {
  // 1. Validate seller exists and is active
  const seller = await prisma.profile.findFirst({
    where: { sellerCode: params.sellerCode, active: true, role: "seller" },
  });
  
  if (!seller) return <CatalogNotFound />;
  
  // 2. Fetch active products with categories
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
  
  return <CatalogView seller={seller} products={products} categories={categories} />;
}
```

### Client Component structure
```
CatalogView (client — needs useState for category filter)
├── CatalogHeader (seller name, brand)
├── CategoryFilter (horizontal scrollable pills)
├── ProductGrid
│   └── ProductCard (image, name, price, link to detail)
└── FloatingCartButton (if cart has items, shows count)
```

## Product Detail Page (`/c/[sellerCode]/[productSlug]`)

Server component that fetches product by slug. Renders image, name, price, description, and "Agregar al carrito" button. The button is a client component that interacts with the cart hook.

## Admin Product Management (`/admin/productos`)

### Server actions
```typescript
// actions/products.ts
async function createProduct(formData: FormData) { ... }
async function updateProduct(id: string, formData: FormData) { ... }
async function toggleProductActive(id: string) { ... }
```

### Slug generation
```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
```

### Image handling (MVP)
For MVP, products use a single `imageUrl` field. Admin can either:
- Paste an external URL, or
- Upload to Supabase Storage (bucket: `product-images`, public)

The upload returns a public URL stored in `imageUrl`.

## Validation Schemas

```typescript
export const productSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  price: z.coerce.number().positive("Precio debe ser mayor a 0"),
  compareAtPrice: z.coerce.number().positive().optional().nullable(),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
  imageUrl: z.string().url().optional().nullable(),
});
```
