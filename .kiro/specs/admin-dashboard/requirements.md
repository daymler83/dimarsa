# Admin Dashboard — Requirements

## User Story 1: Admin overview with KPIs
**As an** admin de Dimarza,
**I want to** ver un resumen general de la plataforma,
**so that** pueda entender el estado del negocio de un vistazo.

### Acceptance Criteria
- WHEN an admin navigates to `/admin` THE SYSTEM SHALL display KPI cards:
  - Total vendedores activos
  - Total pedidos (y pedidos hoy)
  - Revenue total
  - Comisiones pendientes de pago
- THE SYSTEM SHALL display a sales chart (last 30 days) showing daily orders and revenue.
- THE SYSTEM SHALL display a "Top vendedores" ranking (top 5 by revenue).
- THE SYSTEM SHALL display recent orders (last 10) with quick-access links.

## User Story 2: Seller management
**As an** admin,
**I want to** gestionar los vendedores de la plataforma,
**so that** pueda activar, desactivar y monitorear su rendimiento.

### Acceptance Criteria
- WHEN an admin navigates to `/admin/vendedores` THE SYSTEM SHALL display a table of all sellers with: name, seller code, phone, registration date, total sales, total commission, active status.
- THE SYSTEM SHALL allow toggling a seller's active status (active/inactive).
- WHEN a seller is deactivated THE SYSTEM SHALL block their catalog link from loading (show "Catálogo no disponible").
- THE SYSTEM SHALL allow searching sellers by name or code.
- THE SYSTEM SHALL sort by different columns (name, sales, date).

## User Story 3: Order management
**As an** admin,
**I want to** ver y gestionar todos los pedidos,
**so that** pueda operar el fulfillment.

### Acceptance Criteria
- WHEN an admin navigates to `/admin/pedidos` THE SYSTEM SHALL display all orders with: order number, date, customer name, seller name, total, status.
- THE SYSTEM SHALL allow filtering by status, seller, and date range.
- WHEN an admin clicks an order THE SYSTEM SHALL show the detail page (`/admin/pedidos/[id]`) with: customer info, shipping method/address, items list, totals, seller attribution, commission info, and status update controls.
- THE SYSTEM SHALL allow updating order status through the defined flow (pending → confirmed → preparing → shipped → delivered, or cancelled).
- WHEN status changes to "cancelled" THE SYSTEM SHALL also cancel the related commission.

## User Story 4: Admin layout and navigation
**As an** admin,
**I want to** have a clear, professional dashboard interface,
**so that** I can navigate efficiently between sections.

### Acceptance Criteria
- THE SYSTEM SHALL provide a sidebar navigation with sections: Overview, Productos, Vendedores, Pedidos, Comisiones.
- THE SYSTEM SHALL show the current section highlighted in the sidebar.
- THE SYSTEM SHALL be responsive: sidebar collapses to hamburger menu on mobile.
- THE SYSTEM SHALL display the admin's name and a logout button in the header.
