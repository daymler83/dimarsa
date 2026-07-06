# Shopping Cart & Checkout — Requirements

## User Story 1: Shopping cart
**As a** cliente,
**I want to** agregar productos a un carrito,
**so that** pueda revisar mi pedido antes de comprar.

### Acceptance Criteria
- WHEN a customer clicks "Agregar al carrito" on a product THE SYSTEM SHALL add the item to a client-side cart (localStorage).
- WHEN an item is already in the cart and added again THE SYSTEM SHALL increment its quantity by 1.
- WHEN a customer navigates to `/c/[sellerCode]/carrito` THE SYSTEM SHALL display all cart items with: image, name, unit price, quantity selector, line total.
- THE SYSTEM SHALL display a cart summary with subtotal and total.
- THE SYSTEM SHALL allow removing items from the cart.
- THE SYSTEM SHALL allow changing item quantity (min 1).
- WHEN the cart is empty THE SYSTEM SHALL display an empty state with a link back to the catalog.
- THE SYSTEM SHALL persist cart contents across page navigations (localStorage).
- THE SYSTEM SHALL associate the cart with the seller code from the URL.

## User Story 2: Checkout / Order form
**As a** cliente con productos en el carrito,
**I want to** completar mis datos y confirmar el pedido,
**so that** Dimarza pueda procesarlo.

### Acceptance Criteria
- WHEN a customer proceeds to checkout THE SYSTEM SHALL display a form with: nombre completo, email, teléfono, dirección (if delivery).
- THE SYSTEM SHALL allow choosing between "Despacho a domicilio" and "Retiro en tienda".
- WHEN "Despacho a domicilio" is selected THE SYSTEM SHALL require address fields: calle, número, comuna, ciudad, región.
- WHEN "Retiro en tienda" is selected THE SYSTEM SHALL hide address fields and display pickup instructions.
- WHEN the customer submits the order THE SYSTEM SHALL create an Order record with all items, customer data, seller attribution (from cookie), and status "pending".
- WHEN the order is created THE SYSTEM SHALL create a Commission record for the attributed seller.
- WHEN the order is successfully created THE SYSTEM SHALL display a confirmation page with order number and summary.
- WHEN the order is successfully created THE SYSTEM SHALL clear the cart.
- THE SYSTEM SHALL validate all required fields before submission.

## User Story 3: Order confirmation
**As a** cliente que acaba de hacer un pedido,
**I want to** ver una confirmación,
**so that** sepa que mi pedido fue recibido.

### Acceptance Criteria
- WHEN an order is successfully created THE SYSTEM SHALL redirect to a confirmation page showing: order number, items ordered, total, shipping method, and a thank-you message.
- THE SYSTEM SHALL display contact info for questions about the order.
