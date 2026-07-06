# Product Catalog — Tasks

## Task 1: Product and Category models
- [ ] Add Category and Product models to `prisma/schema.prisma` (if not done in auth setup)
- [ ] Add product validation schema to `src/lib/validations.ts`
- [ ] Add `generateSlug()` and `formatPrice()` helpers to `src/lib/utils.ts`
**Depends on:** auth-seller-system/Task 2
**Relates to:** REQ-3, REQ-4

## Task 2: Admin product CRUD server actions
- [ ] Create `src/actions/products.ts` with: `createProduct`, `updateProduct`, `toggleProductActive`
- [ ] Implement slug auto-generation from product name with uniqueness check
- [ ] Implement Supabase Storage upload for product images (bucket: `product-images`)
- [ ] All actions validate input with Zod and check admin role
**Depends on:** Task 1
**Relates to:** REQ-3

## Task 3: Admin products list page
- [ ] Create `src/app/admin/productos/page.tsx`
- [ ] Display data table with columns: thumbnail, name, category, price, stock, status (active badge)
- [ ] "Nuevo producto" button opens a dialog/modal with create form
- [ ] Each row has actions: Edit, Toggle Active
- [ ] Use shadcn Table, Badge, Dialog, Button components
**Depends on:** Task 2
**Relates to:** REQ-3

## Task 4: Admin product edit page
- [ ] Create `src/app/admin/productos/[id]/page.tsx`
- [ ] Pre-populate form with existing product data
- [ ] Image upload or URL input
- [ ] Category selector (dropdown with existing categories + "crear nueva" option)
- [ ] Save changes via `updateProduct` server action
**Depends on:** Task 2, Task 3
**Relates to:** REQ-3, REQ-4

## Task 5: Category management
- [ ] Create `src/actions/categories.ts` with: `createCategory`, `getCategories`
- [ ] Category creation inline from product form (no separate admin page in MVP)
- [ ] Auto-generate category slug from name
**Depends on:** Task 1
**Relates to:** REQ-4

## Task 6: Public catalog page
- [ ] Create `src/app/c/[sellerCode]/page.tsx` (Server Component)
- [ ] Validate seller code and active status; show "Catálogo no disponible" if invalid
- [ ] Fetch and display active products grouped by category
- [ ] Create `src/components/catalog/ProductCard.tsx` — image, name, price, link
- [ ] Create `src/components/catalog/ProductGrid.tsx` — responsive grid (1col mobile, 2-3col desktop)
- [ ] Create `src/components/catalog/CategoryFilter.tsx` — horizontal scrollable pills
- [ ] Display "Catálogo de [Seller Name]" header
- [ ] Integrate `useSellerCode` hook for attribution cookie
- [ ] Create `src/components/shared/FloatingCartButton.tsx` — fixed bottom-right, shows item count
**Depends on:** Task 1, auth-seller-system/Task 9
**Relates to:** REQ-1

## Task 7: Product detail page
- [ ] Create `src/app/c/[sellerCode]/[productSlug]/page.tsx`
- [ ] Display product image, name, price (with compare_at_price if present), description
- [ ] "Agregar al carrito" button (client component, uses cart hook)
- [ ] Toast confirmation on add
- [ ] "Volver al catálogo" link preserving seller code
- [ ] Mobile-optimized layout
**Depends on:** Task 6
**Relates to:** REQ-2

## Task 8: Catalog layout and branding
- [ ] Create `src/app/c/[sellerCode]/layout.tsx` — minimal layout with Dimarza branding
- [ ] Cream background, navy header, gold accents
- [ ] WhatsApp-friendly: og:image and meta tags for link previews
**Depends on:** Task 6
**Relates to:** REQ-1
