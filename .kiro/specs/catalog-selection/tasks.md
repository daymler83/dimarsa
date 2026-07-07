# Catalog Selection — Tasks

## Task 1: Modelo de datos
- [ ] Agregar `Catalog`, `CatalogCategory`, `CatalogProduct` a `prisma/schema.prisma`
- [ ] Relaciones inversas `catalogs` en `Category` y `Product`
- [ ] Aplicar el cambio contra la base (mismo flujo `db push` que el resto del schema)
- [ ] `catalogSchema` en `src/lib/validations.ts`
**Depends on:** product-catalog/Task 1
**Relates to:** REQ-1, REQ-2

## Task 2: Resolución de catálogo + server actions de admin
- [ ] `resolveCatalogProducts(catalogId)` — unión categorías ∪ productos sueltos, dedup, solo activos
- [ ] `src/actions/catalogs.ts`: `createCatalog`, `updateCatalog`, `deleteCatalog`, `getCatalogsWithCounts`
- [ ] Todas las acciones de escritura verifican rol admin (`requireAdminProfile`)
- [ ] Slug auto-generado con `generateSlug()` (ya existe), único con retry si colisiona
**Depends on:** Task 1
**Relates to:** REQ-1, REQ-2

## Task 3: Admin — gestión de catálogos
- [ ] `src/app/admin/catalogos/page.tsx` — tabla (nombre, slug, # productos, estado, acciones)
- [ ] `CatalogForm` (client): nombre, descripción, activo, selección múltiple de categorías y productos
- [ ] Dialog de creación + reuso del form para edición
- [ ] Confirmación antes de eliminar
- [ ] Protegido por el middleware/rol admin existente — no tocar el resto de `/admin`
**Depends on:** Task 2
**Relates to:** REQ-1

## Task 4: Rutas públicas anidadas
- [ ] Mover `src/app/c/[sellerCode]/[productSlug]/` → `src/app/c/[sellerCode]/[catalogSlug]/[productSlug]/`
- [ ] Reescribir `src/app/c/[sellerCode]/page.tsx` para listar catálogos activos (`CatalogPicker` público)
- [ ] Nuevo `src/app/c/[sellerCode]/[catalogSlug]/page.tsx` — resuelve y renderiza el catálogo
- [ ] `CatalogView`, `ProductGrid`, `ProductCard` reciben `catalogSlug` para construir los links de producto
- [ ] `CategoryFilter` dentro de un catálogo solo lista categorías con productos en ese catálogo
**Depends on:** Task 2
**Relates to:** REQ-4

## Task 5: Vendedor — selector de catálogo
- [ ] `/vendedor/compartir` lista catálogos activos (nombre, descripción, # productos)
- [ ] Selección de catálogo → `ShareActions` recibe `catalogSlug` y arma
      `/c/[sellerCode]/[catalogSlug]`
- [ ] Elimina la generación de link/QR de "catálogo completo" — un solo flujo de compartir
- [ ] Estado vacío claro si no hay catálogos activos
**Depends on:** Task 2, Task 4
**Relates to:** REQ-3

## Task 6: Atribución (captura únicamente)
- [ ] `useCart`: agrega `catalogId: string | null` al `CartState` persistido
- [ ] `CatalogView` graba el `catalogId` actual en el carrito al montar
- [ ] Cookie `dimarza_ref` (sellerCode) sin cambios
- [ ] Sin checkout, sin `Order.catalogId` — eso es de `shopping-cart-checkout`
**Depends on:** Task 4
**Relates to:** REQ-4

## Task 7: RLS
- [ ] Habilitar RLS en `catalogs`, `catalog_categories`, `catalog_products`
- [ ] Policy de SELECT público limitada a `catalogs.is_active = true` (y sus joins)
- [ ] Sin policies de INSERT/UPDATE/DELETE para anon/authenticated (solo admin vía Prisma/service role)
**Depends on:** Task 1
**Relates to:** REQ-1, REQ-4

## Task 8: Seed
- [ ] 2 catálogos demo idempotentes (upsert por slug) usando las categorías/productos ya sembrados
- [ ] "Tecnología y Hogar": categorías Tecnología + Electrohogar completas
- [ ] "Ferretería y Aire Libre": categoría Herramientas y Maquinarias + 2 productos sueltos de otra categoría
- [ ] Ambos `isActive: true`
**Depends on:** Task 1, product-catalog seed data
**Relates to:** REQ-1, REQ-2
