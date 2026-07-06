# Tech Stack

## Framework
- **Next.js 14+** con App Router (full-stack: frontend + API routes)
- **TypeScript** en modo estricto
- **React 18+** con Server Components donde aplique

## Base de datos y backend
- **Supabase** como BaaS:
  - PostgreSQL como base de datos principal
  - Supabase Auth para autenticación (email + password)
  - Supabase Storage para imágenes de productos
  - Row Level Security (RLS) para control de acceso a nivel de fila
- **Prisma ORM** para tipado de queries y migraciones (sobre Supabase PostgreSQL)

## UI y estilos
- **Tailwind CSS v3+** para estilos utilitarios
- **shadcn/ui** como sistema de componentes base
- **Lucide React** para iconografía
- Enfoque **mobile-first** en todo el diseño

## Paleta de colores (CSS custom properties)
```css
--color-navy: #1B2A4A;
--color-navy-light: #2A3F6A;
--color-gold: #D4A843;
--color-gold-light: #E5C36E;
--color-cream: #F5F0E8;
--color-cream-dark: #E8E0D0;
--color-white: #FFFFFF;
--color-text: #1A1A1A;
--color-text-muted: #6B7280;
--color-success: #22C55E;
--color-error: #EF4444;
--color-warning: #F59E0B;
```

## Deploy
- **Vercel** para hosting y CI/CD automático
- Variables de entorno via Vercel dashboard
- Preview deployments por PR

## Dependencias clave
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "@supabase/supabase-js": "^2.0.0",
  "@supabase/ssr": "^0.5.0",
  "prisma": "^5.0.0",
  "@prisma/client": "^5.0.0",
  "tailwindcss": "^3.4.0",
  "zod": "^3.22.0",
  "lucide-react": "^0.383.0",
  "date-fns": "^3.0.0",
  "recharts": "^2.0.0"
}
```

## Convenciones de código

### Nomenclatura
- Archivos y carpetas: `kebab-case`
- Componentes React: `PascalCase`
- Funciones y variables: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`
- Tipos e interfaces TypeScript: `PascalCase` con prefijo descriptivo (no `I` prefix)
- Database columns: `snake_case`

### Patrones
- Server Actions para mutaciones (no API routes salvo webhooks)
- Zod para validación de inputs en server y client
- Componentes server por defecto; `"use client"` solo cuando necesita estado/eventos
- Carpeta `lib/` para utilidades compartidas
- Carpeta `components/ui/` para shadcn, `components/` para componentes del proyecto
- Manejo de errores con try/catch y tipos de error tipados
- No usar `any` nunca; usar `unknown` si es necesario

### Testing (post-MVP)
- Vitest para unit tests
- Playwright para E2E (no incluido en MVP)
