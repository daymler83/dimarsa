# Sales Performance — Requirements

## User Stories (EARS format)

### US-1: Vendedor ve su desempeño semanal en un vistazo
**GIVEN** que soy un vendedor registrado en Dimarsa  
**WHEN** accedo a `/vendedor/desempeno`  
**THEN** veo un dashboard con 5 métricas principales (tasa de conversión, tiempo de primera respuesta, tasa de seguimiento, conversión post-seguimiento, Sales Performance Score)  
**AND** cada métrica muestra el valor actual, la tendencia semanal (✓ mejor / ✗ peor / — igual) y un benchmark contra mi propia semana anterior  
**AND** el dashboard carga en <2s incluso con 1000+ eventos en el mes  

**Acceptance Criteria:**
- El dashboard es mobile-first y legible en pantalla de 375px
- Las métricas son en tiempo real (máximo 1 minuto de retraso)
- No hay valores undefined o NaN; se muestran "—" cuando no hay datos suficientes
- Zona horaria Santiago; corte de semana es lunes-domingo, corte de mes es el calendario

---

### US-2: Vendedor entiende dónde pierde ventas
**GIVEN** que abro el dashboard de desempeño  
**WHEN** desplazo hacia abajo  
**THEN** veo un embudo (funnel) que muestra:  
  - Visitas a mi catálogo esta semana  
  - Clientes que agregaron producto al carrito  
  - Clientes que completaron compra  
  - Tasa de conversión por transición  
**AND** cada étapa está acompañada de un número absoluto y una tasa %  
**AND** hay un ícono de "alerta" en la etapa con mayor caída  

**Acceptance Criteria:**
- El funnel refleja datos reales (sin mock)
- Filtrado por: semana actual / mes actual / últimos 7/30 días
- Si alguna etapa tiene <5 observaciones, se muestra una nota "Muy pocos datos, resultados pueden ser imprecisos"
- Al hacer clic en una etapa, se expande con 3-5 clientes ejemplo de esa etapa

---

### US-3: Vendedor recibe acciones recomendadas diarias
**GIVEN** que abro el dashboard  
**WHEN** scroll hasta la sección "Sugerencias para hoy"  
**THEN** veo una lista priorizada (máximo 3 acciones) con:  
  - Acción concreta en español ("Haz seguimiento a 5 clientes que consultaron")  
  - Número de afectados (ej. "5 clientes")  
  - Botón de acceso directo (deep link a `/vendedor/leads` o `/vendedor/clientes`)  
**AND** las acciones se calculan a las 08:00 AM hora Santiago y se refrescan cada 4h  
**AND** si no hay acciones disponibles, veo un mensaje positivo ("¡Vas bien!")  

**Acceptance Criteria:**
- Las acciones cambian si el vendedor completó alguna recomendación del día anterior
- Las 3 acciones se priorizan por: probabilidad estimada de venta × valor × urgencia temporal
- No se muestran recomendaciones basadas en data de <1 semana (estado "onboarding")
- Máximo 1 acción por tipo (no repetir "haz seguimiento" 3 veces)

---

### US-4: Vendedor marca que respondió a un cliente
**GIVEN** que tengo la lista de clientes que consultaron por WhatsApp  
**WHEN** hago clic en "Marcar como respondido"  
**THEN** el sistema registra el timestamp de mi respuesta  
**AND** esa respuesta se suma a mi métrica "Tasa de seguimiento"  
**AND** veo una confirmación visual (✓)  

**Acceptance Criteria:**
- La marca de "respondido" es server-side (no puedo cambiarla desde el cliente)
- Un cliente solo se puede marcar "respondido" una vez
- El sistema detecta si la respuesta fue en la misma sesión (mismo día) o en otra sesión (al día siguiente) para calcular tiempo de respuesta
- Si no respondo a un cliente dentro de 72h, se marca como "no respondido" automáticamente

---

### US-5: Admin ve agregados de desempeño de todos los vendedores
**GIVEN** que soy admin en `/admin`  
**WHEN** accedo a una sección "Desempeño de vendedores"  
**THEN** veo una tabla con todos los vendedores y sus:  
  - Tasa de conversión esta semana  
  - Sales Performance Score actual  
  - Tendencia (flecha ↑/↓)  
  - Último pedido (fecha y monto)  
**AND** puedo hacer clic en un vendedor para ver su dashboard detallado  
**AND** puedo exportar un CSV con los datos  

**Acceptance Criteria:**
- La tabla es sorteable por cualquier columna
- Hay un filtro por estado activo/inactivo
- Los números se actualizan cada 1 hora (rollup programado)
- Se ocultan vendedores sin datos en las últimas 4 semanas

---

### US-6: Sistema de eventos captura acciones clave
**GIVEN** que un cliente visita mi catálogo o compra  
**WHEN** ocurre una acción (visita, compartir, agregar carrito, compra, consulta, seguimiento)  
**THEN** el sistema emite un evento estructurado con:  
  - `event_type` (visita, share, add_to_cart, checkout, lead_created, follow_up_marked)  
  - `timestamp` (momento exacto, UTC)  
  - `seller_id` (UUID del vendedor)  
  - `payload` (JSON con detalles adicionales: customer_phone, product_id, etc.)  
**AND** los eventos se persisten en tabla `seller_events` (append-only)  
**AND** no se pierden eventos aunque el servidor se reinicie  

**Acceptance Criteria:**
- Cada evento tiene una row en la BD (no se pierden entre requests)
- Los eventos incluyen contexto suficiente para recalcular métricas sin datos originales
- PII (teléfono del cliente) se trata según LGPD: se anonimiza después de 90 días
- Hay un índice en `(seller_id, event_type, timestamp)` para queries rápidas

---

### US-7: Atribución multi-vendedor se resuelve correctamente
**GIVEN** que un cliente visita el catálogo de vendedor A, luego de vendedor B  
**WHEN** el cliente compra a través del link de vendedor B  
**THEN** la venta se atribuye solo a vendedor B  
**AND** ambas visitas se registran, pero solo B recibe comisión  
**AND** si el cliente compra dentro de 7 días del primer clic, se contabiliza en ambas métricas de "visita" pero la compra solo en B  

**Acceptance Criteria:**
- La ventana de atribución es 7 días (configurable)
- Cada visitor session tiene un ID único (`session_id` en cookie)
- Se deduplican visitas del mismo navegador al mismo catálogo en la misma sesión
- Si un cliente abre 2 pestañas del mismo catálogo, se cuenta como 1 visita
- Se filtra prefetch de bots (user-agent contiene "facebookexternalhit" o "Twitterbot")

---

### US-8: Filtrado de bots y prefetch social
**GIVEN** que WhatsApp y Facebook hacen prefetch del link antes de mostrar preview  
**WHEN** eso ocurre  
**THEN** esos accesos no se cuentan como "visita" genuina  
**AND** los eventos de prefetch se marcan con `source: "bot"` para auditoria  

**Acceptance Criteria:**
- User-agents detectados: "facebookexternalhit", "Twitterbot", "WhatsApp", "Telegram", "LinkedInBot", "Viber", "Skype", "Signal"
- Los prefetch no afectan métricas de conversión ni recomendaciones
- Se registran en tabla separada o con flag para análisis posterior

---

## Acceptance Criteria de toda la feature

1. **Desempeño**: Dashboard `/vendedor/desempeno` carga en <2s con 1000+ eventos
2. **Exactitud**: Todas las métricas están basadas en datos reales; si hay ambigüedad, se asume el valor más conservador
3. **Escalabilidad**: El sistema soporta 10,000 vendedores × 100 eventos/mes cada uno sin degradación
4. **Confiabilidad**: Cero pérdida de eventos (insert en BD antes de respuesta HTTP)
5. **Usabilidad**: El vendedor entiende qué significa cada métrica y qué hacer para mejorarla en <30s
6. **Seguridad**: RLS en todas las tablas; un vendedor ve solo sus datos; admin ve solo si autenticado
