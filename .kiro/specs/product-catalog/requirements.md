# Product Catalog — Requirements

## User Story 1: Catalog browsing
**As a** cliente que llega al link de un vendedor,
**I want to** ver los productos de Dimarza en un catálogo visual,
**so that** pueda elegir qué comprar.

### Acceptance Criteria
- WHEN a customer visits `/c/[sellerCode]` THE SYSTEM SHALL display a product grid with image, name, price for each active product.
- WHEN the seller code is invalid or the seller is inactive THE SYSTEM SHALL display a friendly "Catálogo no disponible" page.
- THE SYSTEM SHALL display the seller's name at the top: "Catálogo de [Seller Name]".
- THE SYSTEM SHALL show category filters to narrow products.
- WHEN a category filter is selected THE SYSTEM SHALL show only products in that category.
- THE SYSTEM SHALL store the seller code in a cookie for attribution (see auth-seller-system spec).
- THE SYSTEM SHALL be mobile-first responsive (1 column mobile, 2-3 columns desktop).

## User Story 2: Product detail
**As a** cliente,
**I want to** ver el detalle de un producto,
**so that** pueda decidir si lo compro.

### Acceptance Criteria
- WHEN a customer clicks a product card THE SYSTEM SHALL navigate to `/c/[sellerCode]/[productSlug]`.
- THE SYSTEM SHALL display: product image(s), name, price, description, and an "Agregar al carrito" button.
- IF the product has a `compareAtPrice` (original price) THE SYSTEM SHALL show it crossed out next to the current price.
- WHEN "Agregar al carrito" is clicked THE SYSTEM SHALL add the product to the cart (localStorage) with quantity 1 and show a confirmation toast.
- THE SYSTEM SHALL provide a "Volver al catálogo" link.

## User Story 3: Product management (Admin)
**As an** admin de Dimarza,
**I want to** crear, editar y desactivar productos,
**so that** el catálogo esté siempre actualizado.

### Acceptance Criteria
- WHEN an admin navigates to `/admin/productos` THE SYSTEM SHALL display a table of all products with: image thumbnail, name, category, price, stock, active status.
- THE SYSTEM SHALL provide a "Nuevo producto" button that opens a create form.
- THE SYSTEM SHALL provide edit and toggle active/inactive actions per product.
- WHEN creating/editing a product THE SYSTEM SHALL require: name, price, category. Optional: description, compare_at_price, image upload, stock quantity.
- THE SYSTEM SHALL auto-generate a URL slug from the product name.
- WHEN a product is deactivated THE SYSTEM SHALL hide it from the public catalog without deleting it.

## User Story 4: Category management (Admin)
**As an** admin,
**I want to** gestionar categorías de productos,
**so that** el catálogo esté organizado.

### Acceptance Criteria
- WHEN an admin creates or edits products THE SYSTEM SHALL allow selecting from existing categories or creating a new one inline.
- Categories SHALL have a name and auto-generated slug.
- THE SYSTEM SHALL display categories in a defined sort order.
