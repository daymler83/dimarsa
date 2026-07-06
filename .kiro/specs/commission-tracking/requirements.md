# Commission Tracking — Requirements

## User Story 1: Automatic commission calculation
**As a** platform operator,
**I want** commissions to be calculated automatically on each order,
**so that** no manual intervention is needed for attribution.

### Acceptance Criteria
- WHEN an order is created with a seller attribution THE SYSTEM SHALL create a Commission record with amount = order total × commission percentage (default 10%).
- THE SYSTEM SHALL store the commission percentage used at the time of calculation (for audit).
- WHEN an order is cancelled THE SYSTEM SHALL mark the related commission as "cancelled".
- WHEN an order has no seller attribution (direct purchase) THE SYSTEM SHALL NOT create a commission record.

## User Story 2: Seller commission dashboard
**As a** vendedor,
**I want to** ver mis comisiones en tiempo real,
**so that** sepa cuánto he ganado y qué me falta por cobrar.

### Acceptance Criteria
- WHEN a seller navigates to `/vendedor/comisiones` THE SYSTEM SHALL display:
  - Total comisiones acumuladas (all time)
  - Comisiones pendientes (pending)
  - Comisiones pagadas (paid)
- THE SYSTEM SHALL display a table of commissions with: date, order number, order total, commission amount, status (pending/approved/paid/cancelled).
- THE SYSTEM SHALL allow filtering by status and date range.
- THE SYSTEM SHALL show a summary card at the top with key totals.

## User Story 3: Seller sales overview
**As a** vendedor,
**I want to** ver un resumen de mis ventas,
**so that** pueda entender mi rendimiento.

### Acceptance Criteria
- WHEN a seller navigates to `/vendedor` (dashboard home) THE SYSTEM SHALL display:
  - Total ventas atribuidas (count)
  - Monto total vendido
  - Comisión total ganada
  - Número de clientes únicos
- THE SYSTEM SHALL display a recent orders list (last 10) with: date, order number, customer name, total, commission earned.
- THE SYSTEM SHALL show a simple chart of sales over time (last 30 days).

## User Story 4: Admin commission management
**As an** admin,
**I want to** gestionar el pago de comisiones,
**so that** pueda marcar comisiones como pagadas.

### Acceptance Criteria
- WHEN an admin navigates to `/admin/comisiones` THE SYSTEM SHALL display all commissions grouped by seller.
- THE SYSTEM SHALL show totals per seller: pending, approved, paid.
- THE SYSTEM SHALL allow marking individual commissions or bulk commissions as "paid".
- WHEN a commission is marked as paid THE SYSTEM SHALL record the payment date.
- THE SYSTEM SHALL allow filtering by seller, status, and date range.
