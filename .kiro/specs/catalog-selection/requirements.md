# Catalog Selection — Requirements

## Contexto

`auth-seller-system` le da a cada vendedor un link/QR de su catálogo completo
(`/c/[sellerCode]`). En la práctica un vendedor no siempre quiere compartir *todo* el
catálogo Dimarsa: quiere armar un recorte (ej. "Tecnología y Hogar") y compartir ese
link puntual. Esta spec introduce `Catalog` como una agrupación de productos definida
por el admin, que el vendedor elige antes de compartir. **Reemplaza** el flujo anterior
de "compartir todo el catálogo" — a partir de acá, compartir siempre implica elegir un
catálogo primero.

## User Story 1: Admin define catálogos

**As an** admin de Dimarsa,
**I want to** agrupar categorías completas y/o productos sueltos bajo un "catálogo" con
nombre propio,
**so that** los vendedores puedan compartir recortes temáticos del catálogo general.

### Acceptance Criteria
- WHEN un admin navega a `/admin/catalogos` THE SYSTEM SHALL mostrar una tabla con todos
  los catálogos: nombre, slug, cantidad de productos resueltos, estado (activo/inactivo).
- THE SYSTEM SHALL permitir crear un catálogo con: nombre (requerido), descripción
  (opcional), selección múltiple de categorías, selección múltiple de productos sueltos,
  estado activo/inactivo.
- THE SYSTEM SHALL auto-generar un slug único a partir del nombre.
- THE SYSTEM SHALL permitir editar y eliminar catálogos existentes.
- WHEN un catálogo se marca inactivo THE SYSTEM SHALL dejar de mostrarlo en la lista que
  ve el vendedor y SHALL devolver "no disponible" en su ruta pública.
- IF un catálogo no tiene categorías ni productos asociados THE SYSTEM SHALL permitir
  guardarlo igual (queda vacío hasta que se le asignen), sin error.

## User Story 2: Resolución de productos de un catálogo

**As a** sistema,
**I want to** resolver el conjunto de productos de un catálogo como la unión de (todos
los productos activos de sus categorías) y (sus productos sueltos), sin duplicados,
**so that** un producto en dos categorías del mismo catálogo, o agregado tanto por
categoría como suelto, aparezca una sola vez.

### Acceptance Criteria
- WHEN se resuelve un catálogo THE SYSTEM SHALL incluir todo producto activo cuya
  `categoryId` esté en las categorías del catálogo, más todo producto activo agregado
  directamente como producto suelto.
- THE SYSTEM SHALL deduplicar por `productId` antes de renderizar o contar.
- Productos inactivos (`active = false`) SHALL quedar excluidos aunque su categoría o
  ellos mismos estén asociados al catálogo.

## User Story 3: Vendedor elige catálogo para compartir

**As a** vendedor,
**I want to** ver la lista de catálogos activos y elegir cuál compartir,
**so that** el link/QR que genero corresponda a ese recorte, no a todo el catálogo.

### Acceptance Criteria
- WHEN un vendedor entra a `/vendedor/compartir` THE SYSTEM SHALL listar los catálogos
  con `isActive = true`, mostrando nombre, descripción y cantidad de productos.
- WHEN el vendedor selecciona un catálogo THE SYSTEM SHALL mostrar el link
  `{origin}/c/[sellerCode]/[catalogSlug]` y su código QR, reutilizando el mismo
  generador de QR y las mismas acciones de compartir (copiar, WhatsApp, Instagram,
  Facebook) que ya existían para "todo el catálogo".
- THE SYSTEM SHALL eliminar la opción anterior de compartir "el catálogo completo" — no
  deben coexistir dos flujos de compartir en conflicto.
- IF no hay catálogos activos THE SYSTEM SHALL mostrarlo claramente en vez de una lista
  vacía sin contexto.

## User Story 4: Cliente navega un catálogo específico

**As a** cliente que llega por el link de un vendedor,
**I want to** ver solo los productos del catálogo elegido por el vendedor,
**so that** la experiencia sea la que el vendedor decidió mostrar.

### Acceptance Criteria
- WHEN un cliente visita `/c/[sellerCode]/[catalogSlug]` THE SYSTEM SHALL validar que el
  vendedor exista y esté activo, y que el catálogo exista y esté activo; si cualquiera
  de las dos condiciones falla, THE SYSTEM SHALL mostrar "no disponible" (reusa
  `CatalogNotFound`).
- THE SYSTEM SHALL renderizar los productos resueltos del catálogo (User Story 2) con
  los mismos componentes (`ProductGrid`, `ProductCard`, `CategoryFilter`) que ya
  existían para el catálogo completo.
- WHEN un cliente visita `/c/[sellerCode]` (sin catálogo) THE SYSTEM SHALL mostrar la
  lista de catálogos activos de ese vendedor como puntos de entrada, en vez del listado
  de todos los productos.
- THE SYSTEM SHALL capturar `sellerCode` y `catalogId` al aterrizar en la ruta y
  persistirlos junto al estado del carrito (`useCart`), para que un futuro checkout
  pueda atribuir la orden. Esta spec NO implementa el checkout, solo la captura.

## Fuera de alcance

- Checkout, carrito completo, creación de `Order` — quedan para
  `shopping-cart-checkout`.
- Reglas de atribución "último toque vs. primer toque" — se definen cuando se construya
  el checkout; acá solo se persiste el dato.
- Analítica/reportes sobre qué catálogo generó qué venta — depende de que exista
  `Order` con `catalogId`, fuera de esta spec.
