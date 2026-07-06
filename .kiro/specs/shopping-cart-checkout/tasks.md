# Shopping Cart & Checkout — Tasks

## Task 1: Cart hook
- [ ] Create `src/hooks/use-cart.ts` with full CartState management
- [ ] Functions: addItem, removeItem, updateQuantity, clearCart
- [ ] Computed: subtotal, itemCount
- [ ] Persist to localStorage keyed by seller code (`cart_{sellerCode}`)
- [ ] Handle SSR (typeof window check)
**Depends on:** auth-seller-system/Task 1
**Relates to:** REQ-1

## Task 2: Cart page
- [ ] Create `src/app/c/[sellerCode]/carrito/page.tsx`
- [ ] Create `src/components/cart/CartItem.tsx` — image, name, price, quantity +/- buttons, remove, line total
- [ ] Create `src/components/cart/CartSummary.tsx` — subtotal, total, "Continuar compra" button
- [ ] Empty state with "Volver al catálogo" link
- [ ] Mobile-optimized layout
**Depends on:** Task 1, product-catalog/Task 6
**Relates to:** REQ-1

## Task 3: Checkout form
- [ ] Create `src/components/cart/CheckoutForm.tsx` (client component)
- [ ] Fields: nombre, email, teléfono
- [ ] Radio toggle: "Despacho a domicilio" / "Retiro en tienda"
- [ ] Conditional address fields (street, number, comuna, city, región) for delivery
- [ ] Pickup: show static pickup instructions text
- [ ] Add checkout validation schema to `src/lib/validations.ts`
- [ ] Client-side Zod validation before submit
- [ ] Display inline errors
**Depends on:** Task 2
**Relates to:** REQ-2

## Task 4: Create order server action
- [ ] Create `src/actions/orders.ts` with `createOrder` server action
- [ ] Validate customer data with checkoutSchema
- [ ] Lookup seller by code from cookie
- [ ] Re-verify product prices from DB (prevent client-side price tampering)
- [ ] Create Order + OrderItems + Commission in a Prisma transaction
- [ ] Commission amount = order total × COMMISSION_PERCENTAGE (from constants)
- [ ] Redirect to confirmation page on success
- [ ] Return error on failure
**Depends on:** Task 3, auth-seller-system/Task 9
**Relates to:** REQ-2

## Task 5: Order confirmation page
- [ ] Create `src/app/c/[sellerCode]/confirmacion/[orderId]/page.tsx`
- [ ] Display: order number, items summary, total, shipping method, thank-you message
- [ ] Display contact information for order questions
- [ ] "Volver al catálogo" link
- [ ] Clear cart on mount (client-side effect)
- [ ] Dimarza branding (navy/gold/cream)
**Depends on:** Task 4
**Relates to:** REQ-3

## Task 6: Update order status server action
- [ ] Add `updateOrderStatus` to `src/actions/orders.ts`
- [ ] Status flow: pending → confirmed → preparing → shipped → delivered (or cancelled)
- [ ] Only admin can update status
- [ ] When order is cancelled, mark commission as cancelled too
**Depends on:** Task 4
**Relates to:** admin-dashboard REQ
