# Auth & Seller System — Requirements

## User Story 1: Registro de vendedor
**As a** persona interesada en vender productos de Dimarza,
**I want to** registrarme con mis datos básicos,
**so that** pueda obtener mi código único y empezar a compartir mi catálogo.

### Acceptance Criteria
- WHEN a user navigates to `/registro` THE SYSTEM SHALL display a registration form with fields: nombre completo, email, teléfono, contraseña.
- WHEN a user submits valid registration data THE SYSTEM SHALL create an auth account in Supabase Auth AND a profile record with role `seller`.
- WHEN a seller profile is created THE SYSTEM SHALL generate a unique seller code (format: 6 characters alphanumeric, uppercase, e.g. `A3K9M2`).
- WHEN registration is successful THE SYSTEM SHALL redirect the seller to `/vendedor` dashboard.
- WHEN a user submits an email that already exists THE SYSTEM SHALL display an error message without revealing if the email exists (security).
- WHEN any required field is empty or invalid THE SYSTEM SHALL display inline validation errors.

## User Story 2: Login
**As a** vendedor o administrador registrado,
**I want to** iniciar sesión con mi email y contraseña,
**so that** pueda acceder a mi dashboard.

### Acceptance Criteria
- WHEN a user navigates to `/login` THE SYSTEM SHALL display a login form with email and password fields.
- WHEN a user submits valid credentials THE SYSTEM SHALL authenticate via Supabase Auth and redirect based on role: `seller` → `/vendedor`, `admin` → `/admin`.
- WHEN credentials are invalid THE SYSTEM SHALL display a generic error "Credenciales incorrectas".
- WHEN a user is already authenticated THE SYSTEM SHALL redirect away from `/login` to their dashboard.

## User Story 3: Seller code and personalized link
**As a** vendedor registrado,
**I want to** tener un link personalizado con mi código,
**so that** pueda compartirlo y que las ventas se me atribuyan.

### Acceptance Criteria
- WHEN a seller accesses `/vendedor/compartir` THE SYSTEM SHALL display their unique catalog URL: `{domain}/c/{sellerCode}`.
- THE SYSTEM SHALL provide a "Copiar link" button that copies the URL to clipboard.
- THE SYSTEM SHALL provide a "Compartir por WhatsApp" button that opens WhatsApp with a pre-filled message containing the catalog link.
- THE SYSTEM SHALL provide share buttons for Instagram and Facebook.
- WHEN the seller code URL is visited by a customer THE SYSTEM SHALL store the seller code in a cookie (30 days TTL) for attribution.

## User Story 4: Session and route protection
**As a** platform operator,
**I want** routes to be protected by role,
**so that** only authorized users access their respective dashboards.

### Acceptance Criteria
- WHEN an unauthenticated user tries to access `/vendedor/*` or `/admin/*` THE SYSTEM SHALL redirect to `/login`.
- WHEN an authenticated user with role `seller` tries to access `/admin/*` THE SYSTEM SHALL redirect to `/vendedor`.
- WHEN an authenticated user with role `admin` accesses `/admin/*` THE SYSTEM SHALL allow access.
- WHEN a session token expires THE SYSTEM SHALL redirect to `/login` on next navigation.

## User Story 5: Logout
**As an** authenticated user,
**I want to** cerrar sesión,
**so that** my session is terminated securely.

### Acceptance Criteria
- WHEN a user clicks "Cerrar sesión" THE SYSTEM SHALL sign out via Supabase Auth, clear session cookies, and redirect to `/login`.
