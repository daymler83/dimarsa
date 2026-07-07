# Catalog Selection — Design

## Database Schema

### Table: catalogs
```sql
CREATE TABLE catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalogs_active ON catalogs(is_active);
```

### Table: catalog_categories (join, categorías completas incluidas en un catálogo)
```sql
CREATE TABLE catalog_categories (
  catalog_id UUID NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (catalog_id, category_id)
);

CREATE INDEX idx_catalog_categories_category ON catalog_categories(category_id);
```

### Table: catalog_products (join, productos sueltos incluidos en un catálogo)
```sql
CREATE TABLE catalog_products (
  catalog_id UUID NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (catalog_id, product_id)
);

CREATE INDEX idx_catalog_products_product ON catalog_products(product_id);
```

### Prisma models
```prisma
model Catalog {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  slug        String   @unique
  description String?
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  categories CatalogCategory[]
  products   CatalogProduct[]

  @@index([isActive], map: "idx_catalogs_active")
  @@map("catalogs")
}

model CatalogCategory {
  catalogId  String @map("catalog_id") @db.Uuid
  categoryId String @map("category_id") @db.Uuid

  catalog  Catalog  @relation(fields: [catalogId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([catalogId, categoryId])
  @@map("catalog_categories")
}

model CatalogProduct {
  catalogId String @map("catalog_id") @db.Uuid
  productId String @map("product_id") @db.Uuid

  catalog Catalog @relation(fields: [catalogId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@id([catalogId, productId])
  @@map("catalog_products")
}
```

`Category` gana `catalogs CatalogCategory[]` y `Product` gana `catalogs
CatalogProduct[]` como relaciones inversas. No se agregan campos a `Category` ni
`Product` — la pertenencia a un catálogo vive enteramente en las tablas de join, así un
mismo producto/categoría puede estar en varios catálogos sin duplicarse.

## Resolución de productos de un catálogo

Unión de dos fuentes, deduplicada por `product.id`:

```typescript
// lib/catalogs.ts
async function resolveCatalogProducts(catalogId: string) {
  const catalog = await prisma.catalog.findUnique({
    where: { id: catalogId },
    include: {
      categories: { select: { categoryId: true } },
      products: { select: { productId: true } },
    },
  });

  if (!catalog) return [];

  const categoryIds = catalog.categories.map((c) => c.categoryId);

  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { categoryId: { in: categoryIds } },
        { id: { in: catalog.products.map((p) => p.productId) } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return products; // ya deduplicado: cada Product aparece una vez en el resultado de Prisma
}
```

`OR` + un solo `findMany` deja que Postgres deduplique de forma natural (cada fila de
`products` aparece una sola vez en el resultset aunque matchee ambas condiciones del
`OR`), sin necesidad de un `Set` manual en JS.

## Rutas

### Cambio de estructura (breaking dentro del árbol `/c`)

Next.js no permite dos segmentos dinámicos con nombre distinto en el mismo nivel de
ruta. Como el catálogo ahora es parte del path, el detalle de producto se anida un
nivel más adentro:

```
/c/[sellerCode]                                    -- lista de catálogos activos del vendedor
/c/[sellerCode]/[catalogSlug]                       -- catálogo resuelto (antes: /c/[sellerCode])
/c/[sellerCode]/[catalogSlug]/[productSlug]         -- detalle de producto (antes: /c/[sellerCode]/[productSlug])
```

`/c/[sellerCode]/[productSlug]` (Task 7 de `product-catalog`) se elimina/mueve a la
nueva ubicación anidada. No queda una ruta huérfana en el nivel viejo.

### `/c/[sellerCode]` (Server Component)
```typescript
async function SellerCatalogsPage({ params }: { params: { sellerCode: string } }) {
  const seller = await prisma.profile.findFirst({
    where: { sellerCode: params.sellerCode, active: true, role: "seller" },
  });

  if (!seller) return <CatalogNotFound />;

  const catalogs = await prisma.catalog.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return <CatalogPicker sellerCode={seller.sellerCode} sellerName={seller.fullName} catalogs={catalogs} />;
}
```

### `/c/[sellerCode]/[catalogSlug]` (Server Component)
```typescript
async function CatalogPage({ params }: { params: { sellerCode: string; catalogSlug: string } }) {
  const seller = await prisma.profile.findFirst({
    where: { sellerCode: params.sellerCode, active: true, role: "seller" },
  });
  if (!seller) return <CatalogNotFound />;

  const catalog = await prisma.catalog.findFirst({
    where: { slug: params.catalogSlug, isActive: true },
  });
  if (!catalog) return <CatalogNotFound />;

  const products = await resolveCatalogProducts(catalog.id);
  const categories = await prisma.category.findMany({
    where: { id: { in: [...new Set(products.map((p) => p.categoryId).filter(Boolean))] } },
    orderBy: { sortOrder: "asc" },
  });

  // Reusa CatalogView / ProductGrid / ProductCard / CategoryFilter tal cual,
  // agregando catalogSlug para construir los links de producto.
  return (
    <CatalogView
      sellerCode={seller.sellerCode}
      catalogSlug={catalog.slug}
      catalogId={catalog.id}
      sellerName={seller.fullName}
      catalogName={catalog.name}
      products={products}
      categories={categories}
    />
  );
}
```

Los filtros de categoría dentro de un catálogo solo muestran las categorías que
efectivamente aportaron productos a ese catálogo (no todas las categorías del sistema).

## Vendedor: selector de catálogo (reemplaza el QR de "todo")

`/vendedor/compartir` pasa de "un link fijo" a "elegí un catálogo, después mostramos su
link". El componente `ShareActions` existente (QR + copiar + WhatsApp/Instagram/
Facebook) se reutiliza sin cambios de lógica interna, solo cambia qué URL recibe:

```
CompartirPage (Server Component)
├── obtiene los catalogos activos (prisma.catalog.findMany({ where: { isActive: true } }))
└── CatalogPicker (Client Component)
    ├── estado: catalogo seleccionado
    ├── lista de catalogos (nombre, descripcion, cantidad de productos) como opciones
    └── si hay seleccion -> <ShareActions sellerCode={sellerCode} catalogSlug={selected.slug} />
```

`ShareActions` cambia su construcción de URL de `/c/${sellerCode}` a
`/c/${sellerCode}/${catalogSlug}`; todo lo demás (QR vía el mismo servicio, botones,
feedback de copiado) queda igual.

## Atribución (captura, no checkout)

`useCart` ya particiona el carrito por `sellerCode` en localStorage. Se le agrega un
campo `catalogId` al estado persistido:

```typescript
type CartState = {
  items: CartItem[];
  sellerCode: string;
  catalogId: string | null; // nuevo
};
```

`CatalogView`, al montar, llama a un setter que graba el `catalogId` actual en el
carrito (además de la cookie `dimarza_ref` ya existente para `sellerCode`, que no
cambia). El futuro `shopping-cart-checkout` decide qué hacer con ese `catalogId` al
crear la `Order` (fuera de esta spec).

## Validation Schema

```typescript
// lib/validations.ts
export const catalogSchema = z.object({
  name: z.string().trim().min(2, "Nombre requerido"),
  description: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  categoryIds: z.array(z.string().uuid()).default([]),
  productIds: z.array(z.string().uuid()).default([]),
});
```

## Admin: gestión de catálogos

```
/admin/catalogos (page.tsx)
├── Tabla: nombre, slug, # productos resueltos, estado, acciones (editar/eliminar)
├── "Nuevo catalogo" -> Dialog con CatalogForm
└── Editar -> misma CatalogForm con initialValues

CatalogForm (client)
├── Nombre, descripcion, activo (switch/checkbox)
├── Selector multiple de categorias (checkboxes)
└── Selector multiple de productos (checkboxes, agrupados por categoria)
```

Server actions en `src/actions/catalogs.ts`: `createCatalog`, `updateCatalog`,
`deleteCatalog`, `getCatalogsWithCounts` — todas verifican rol admin con
`requireAdminProfile()` (ya existe, usado por `actions/products.ts`).

## RLS

`catalogs`, `catalog_categories` y `catalog_products` habilitan RLS con una policy de
SELECT público (rol `anon`/`authenticated`) limitada a catálogos activos, igual que se
hizo para `products`/`categories` en `product-catalog`. Igual que en esa spec: el
catálogo público hoy se resuelve por Prisma (bypassa RLS), así que estas policies son
defense-in-depth, no lo que hace funcionar la ruta. Ver `supabase/rls.sql`.
