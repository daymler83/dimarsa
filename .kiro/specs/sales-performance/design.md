# Sales Performance — Design

## 1. Resumen ejecutivo

**Problema**: Hoy Dimarza mide ventas y comisiones (hechos). Pero no mide el desempeño **comercial**: tiempo de respuesta, seguimiento de clientes, tasas de conversión. El vendedor no sabe por qué no vende más: ¿pocos clientes llegan a su catálogo? ¿Llegan pero no compran? ¿Consultan pero no responde?

**Solución**: Módulo `/vendedor/desempeno` que muestra 5 métricas fundamentales: tasa de conversión, tiempo de primera respuesta, tasa de seguimiento, conversión post-seguimiento y un Sales Performance Score 0–100. Instrumenta eventos clave (visita, carrito, compra, consulta, seguimiento) y ofrece acciones recomendadas diarias basadas en reglas determinísticas.

**Cambios para el vendedor**:
- Ve un dashboard con su desempeño semanal y tendencias
- Entiende dónde pierde clientes (embudo comercial)
- Recibe 1–3 sugerencias accionables cada día ("responde a 5 clientes que consultaron")
- Marca cuándo responde a un cliente en WhatsApp (observable en la plataforma)

**Qué se puede medir hoy**: Visitas (proxy: cookie + sesión), compartir links (observable), carrito (localStorage → observable si queremos), compra (observable: Order).

**Qué requiere instrumentación nueva**:
- **Leads/contactos**: cliente que consultó por WhatsApp (evento + tabla)
- **Follow-ups**: vendedor marca que respondió (evento + tabla)
- **Tabla de eventos**: append-only, con catálogo de event_types
- **Rollups diarios**: agregados para queries rápidas del dashboard

---

## 2. Las 5 métricas definitivas

### Métrica 1: Tasa de Conversión (Visita → Compra)

**Nombre en la app**: "Tasa de conversión"

**Comportamiento que incentiva**: Mejorar el catálogo y la experiencia, atraer clientes con intención de compra.

**Fórmula exacta**:
```
Conversión % = (Clientes únicos que compraron / Clientes únicos que visitaron) × 100
```

- **Numerador**: Clientes únicos en ventana de tiempo que emitieron evento `checkout` (Order creado)
- **Denominador**: Clientes únicos que emitieron evento `visita` en la misma ventana
- **Ventana temporal**: Última semana completa (lunes-domingo, zona Santiago)
- **Filtros**: Excluir bots (source="bot"), excluir clientes con múltiples vendedores (se cuentan solo una vez por la más reciente)
- **Unidad**: Porcentaje (0–100%)
- **Periodicidad**: Se actualiza diariamente, se muestra para semana completa

**Eventos necesarios**: `visita`, `checkout`

**Escalas malo/aceptable/bueno/excelente**:
- Malo: <1%
- Aceptable: 1–3%
- Bueno: 3–7%
- Excelente: >7%

**Visualización en la app**: Card con número grande, tendencia semanal (↑/↓), comparación contra semana anterior

**Recomendación cuando está baja**:
- "Tu tasa es muy baja. Mejora la descripción de tus 3 productos más visitados."
- "Tu catálogo tiene 20 productos pero solo 5 reciben compras. Destaca esos 5."

**¿Cumple las 4 condiciones?**
- ✓ **Medible**: Visitas y compras son observables
- ✓ **Controlable**: El vendedor puede mejorar foto, descripción, precio
- ✓ **Accionable**: "Edita descripción de producto X" es una acción específica
- ✓ **Ligada a ventas**: Directa — más conversión = más ventas

**Hipótesis causal**: Clientes que ven un catálogo claro + fotos de calidad + descripción detallada → compran más.

---

### Métrica 2: Tiempo de Primera Respuesta

**Nombre en la app**: "Tiempo promedio de 1ª respuesta"

**Comportamiento que incentiva**: Rapidez en atender; disponibilidad.

**Fórmula exacta**:
```
Tiempo promedio = MEDIAN(timestamp_follow_up - timestamp_lead_created)
  para leads con follow_up_marked = true en semana
```

- **Numerador**: Duración en horas desde que cliente consulta (evento `lead_created`) hasta vendedor marca "respondido" (evento `follow_up_marked`)
- **Denominador**: Cantidad de leads que recibieron follow-up (conversión entre lead y follow-up)
- **Ventana temporal**: Última semana completa
- **Filtros**: Solo leads con teléfono válido, no leads duplicados
- **Unidad**: Horas (ej. "2,3h")
- **Periodicidad**: Se actualiza diariamente

**Eventos necesarios**: `lead_created`, `follow_up_marked`

**Escalas malo/aceptable/bueno/excelente**:
- Excelente: <2h (respuesta rápida)
- Bueno: 2–12h (mismo día o próxima mañana)
- Aceptable: 12–48h (al día siguiente)
- Malo: >48h (2+ días)

**Visualización en la app**: Card con número y unidad (horas), barra de progreso visual, tendencia contra semana anterior

**Recomendación cuando está alto**:
- "Respondes lentamente. El promedio es 8h; intenta responder en <2h."
- "Activa notificaciones para WhatsApp para responder más rápido."

**¿Cumple las 4 condiciones?**
- ✓ **Medible**: `lead_created` (observable) y `follow_up_marked` (auto-reportado pero con mitigación de diseño)
- ✓ **Controlable**: El vendedor elige cuándo responder; puede mejorar dedicando más tiempo
- ✓ **Accionable**: "Revisa WhatsApp cada 2h" es específico
- ✓ **Ligada a ventas**: Hipótesis: clientes que reciben respuesta rápida compran más

**Hipótesis causal**: Respuesta rápida → cliente mantiene interés → compra. Respuesta lenta → cliente compra con competidor.

**Grado de confianza por componente**:
- `lead_created` → "observado" (servidor detecta clic en CTA)
- `follow_up_marked` → "auto-reportado" (vendedor marca; ver mitigation en sección 6)

---

### Métrica 3: Tasa de Seguimiento

**Nombre en la app**: "% de clientes que respondiste"

**Comportamiento que incentiva**: Disciplina; no abandonar leads.

**Fórmula exacta**:
```
Follow-up % = (Leads que recibieron follow-up / Total de leads) × 100
```

- **Numerador**: Leads con `follow_up_marked = true` en semana
- **Denominador**: Total de leads (evento `lead_created`) en semana
- **Ventana temporal**: Última semana completa
- **Filtros**: Teléfono válido, no duplicados
- **Unidad**: Porcentaje (0–100%)

**Eventos necesarios**: `lead_created`, `follow_up_marked`

**Escalas malo/aceptable/bueno/excelente**:
- Malo: <30%
- Aceptable: 30–60%
- Bueno: 60–85%
- Excelente: >85%

**Visualización en la app**: Card con % y número absoluto ("Respondiste 12 de 20 clientes")

**Recomendación cuando está baja**:
- "10 clientes te consultaron pero solo respondiste a 4. Dedica 30 min hoy a responder a los otros 6."
- Link directo a `/vendedor/leads?filter=no_response`

**¿Cumple las 4 condiciones?**
- ✓ **Medible**: Leads + follow-ups son eventos
- ✓ **Controlable**: El vendedor decide responder o no
- ✓ **Accionable**: "Responde a 6 clientes hoy"
- ✓ **Ligada a ventas**: Clientes sin respuesta no compran

---

### Métrica 4: Conversión Post-Seguimiento

**Nombre en la app**: "% de clientes que compraron después de responder"

**Comportamiento que incentiva**: Calidad de respuesta; cierre de venta.

**Fórmula exacta**:
```
Conversión post-follow-up % = (Leads con follow-up que compraron / Leads con follow-up) × 100
```

- **Numerador**: Leads que recibieron follow-up Y luego el cliente compró (evento `checkout`)
- **Denominador**: Total de leads que recibieron follow-up
- **Ventana temporal**: Última semana (pero con ventana de compra de +7 días; ej. lead del lunes puede comprar hasta el próximo lunes)
- **Filtros**: Teléfono válido
- **Unidad**: Porcentaje (0–100%)

**Eventos necesarios**: `lead_created`, `follow_up_marked`, `checkout`

**Escalas malo/aceptable/bueno/excelente**:
- Malo: <15%
- Aceptable: 15–35%
- Bueno: 35–60%
- Excelente: >60%

**Visualización en la app**: Card, con nota de "Ventana de 7 días"

**Recomendación cuando está baja**:
- "Respondes rápido pero pocos compran. Revisa el contenido de tus respuestas: ¿Mencionas precio? ¿Haces oferta?"
- "Tus respuestas pueden ser muy genéricas. Intenta personalizar."

**¿Cumple las 4 condiciones?**
- ✓ **Medible**: Eventos observables
- ✓ **Controlable**: Vendedor mejora contenido de respuesta
- ✓ **Accionable**: "Personaliza respuesta" es vago, pero sistema sugiere cambios específicos
- ✓ **Ligada a ventas**: Directa

---

### Métrica 5: Sales Performance Score (0–100)

**Nombre en la app**: "Tu puntuación"

**Comportamiento que incentiva**: Balance entre volumen, velocidad y calidad.

**Fórmula exacta**:
```
Score = w1 × conv_score + w2 × response_score + w3 × followup_score + w4 × conversion_post_score + w5 × volume_score

Donde:

conv_score = MIN(conversión_actual / 5%, 1.0) × 100
  → Si tu conversión es 5%, score es 100. Si es 2.5%, score es 50.

response_score = 100 - CLAMP(horas_promedio * 12.5, 0, 100)
  → 0h = 100, 8h = 0, lineal. Penaliza lentitud.

followup_score = seguimiento_% × 100 (0–100)
  → Directamente proporcional.

conversion_post_score = MIN(conversión_post_% / 40%, 1.0) × 100
  → Si es 40%, score es 100.

volume_score = CLAMP(leads_semana / 10, 0, 1.0) × 100
  → Si tienes <1 lead, penaliza (data insuficiente). Si tienes 10+, score es 100.

Pesos:
  w1 = 0.25 (conversión bruta es importante)
  w2 = 0.15 (rapidez, pero no es lo más importante)
  w3 = 0.20 (disciplina de seguimiento)
  w4 = 0.25 (calidad de cierre)
  w5 = 0.15 (volumen, pero penaliza data insuficiente)

Score final = ROUND(Score × (data_quality_factor))

data_quality_factor = MIN(leads_semana / 5, 1.0)
  → Si tienes <5 leads, el score se descuenta hasta 0.
  → Si tienes 5+ leads, no hay descuento.
```

**Normalización a 0–100**: Todos los componentes se normalizan a 0–100 antes de sumar.

**Volatilidad con pocos datos**: Con <5 leads la semana, el score se descuenta progresivamente (ej. con 2 leads, el score se multiplica por 2/5 = 0.4). Además, se muestra un disclaimer: "Muy pocos datos; el score puede variar significativamente."

**Escalas**:
- Malo: <30
- Aceptable: 30–50
- Bueno: 50–75
- Excelente: 75+

**Visualización en la app**: Gran círculo radial (como un speedometer) con número grande en centro, color según rango, flecha indicando posición.

**¿Cumple las 4 condiciones?**
- ✓ **Medible**: Combinación de eventos
- ✓ **Controlable**: Cada componente es mejorable independientemente
- ✓ **Accionable**: Se desglosa qué pesa: "Tu score es bajo porque conversión es 0.5%" vs. "por lentitud en responder"
- ✓ **Ligada a ventas**: Hipótesis: vendedor con score alto vende más

---

## 3. Tabla resumen de métricas

| Métrica | Fórmula | Eventos | Objetivo | Interpretación | Confianza |
|---------|---------|---------|----------|----------------|---------  |
| **Conversión** | Clientes que compran / Clientes que visitan | `visita`, `checkout` | >5% | % de visitantes que compran | ALTA (observado) |
| **1ª Respuesta** | MEDIAN(follow_up_ts - lead_ts) | `lead_created`, `follow_up_marked` | <4h | Tiempo promedio en horas | MEDIA (auto-reportado con mitigación) |
| **Seguimiento** | Follow-ups / Leads | `lead_created`, `follow_up_marked` | >70% | % de leads atendidos | MEDIA (auto-reportado) |
| **Conv. Post-Follow** | Leads que compraron / Leads con follow-up | `lead_created`, `follow_up_marked`, `checkout` | >40% | % de clientes respondidos que compran | MEDIA-BAJA (cadena de eventos) |
| **Performance Score** | Combinación ponderada 0–100 | Todas | >60 | Índice holístico | MEDIA (deriva de otras) |

---

## 4. Funnel comercial

Definición de etapas para este producto específico (distribución digital sin stock, venta via link + WhatsApp):

```
┌─────────────────────────┐
│  1. VISITA              │
│  Cliente abre catálogo  │
│  Evento: visita         │
│  Datos: 345 clientes    │
└────────────┬────────────┘
             │
        conv_1_2 = 32%
             ↓
┌─────────────────────────┐
│  2. VE PRODUCTO         │
│  Abre detalle de        │
│  al menos 1 producto    │
│  Evento: view_product   │
│  Datos: 110 clientes    │
└────────────┬────────────┘
             │
        conv_2_3 = 25%
             ↓
┌─────────────────────────┐
│  3. AGREGA A CARRITO    │
│  Add-to-cart            │
│  Evento: add_to_cart    │
│  Datos: 28 clientes     │
└────────────┬────────────┘
             │
        conv_3_4 = 32%
             ↓
┌─────────────────────────┐
│  4. CONSULTA            │
│  Envía WhatsApp o CTA   │
│  Evento: lead_created   │
│  Datos: 9 clientes      │
└────────────┬────────────┘
             │
        conv_4_5 = 89%
             ↓
┌─────────────────────────┐
│  5. VENDEDOR RESPONDE   │
│  Marca como respondido  │
│  Evento: follow_up...   │
│  Datos: 8 clientes      │
└────────────┬────────────┘
             │
        conv_5_6 = 62%
             ↓
┌─────────────────────────┐
│  6. COMPRA              │
│  Checkout realizado     │
│  Evento: checkout       │
│  Datos: 5 clientes      │
│  Conversión total: 1.4% │
└─────────────────────────┘
```

**Detalles de cada transición**:
- **Visita → Ve Producto** (32%): Muchos clientes exploran pero no entran en detalle. Oportunidad: mejorar categorización.
- **Ve Producto → Carrito** (25%): Aún baja. Oportunidad: precio, stock visible, oferta.
- **Carrito → Consulta** (32%): Alrededor de 1/3 de quienes agregan carrito consultan. Aquí la fricción es intención: algunos solo exploran.
- **Consulta → Respuesta** (89%): **BAJA FRICCIÓN**. Si el cliente consulta, probablemente espera respuesta. Esta es la métrica crítica de seguimiento.
- **Respuesta → Compra** (62%): Bastante bueno. Si respondiste, hay ~6 de 10 chances de que compre.

**Atribución**: Cada cliente obtiene un `visitor_session_id` único en la sesión (cookie). Las visitas se deduplican por (visitor_session_id, seller_code). Si un cliente compra, se atribuye al vendedor de la cookie más reciente (ventana 7 días).

**Deduplicación**:
- Mismo navegador, mismo catálogo, <1h = 1 visita
- Misma sesión = 1 acceso a "ver producto" por producto
- Mismo carrito = items no se duplican

**Filtrado de bots**:
- Se detectan por user-agent (WhatsApp, Facebook, Telegram, etc.)
- Se registran en evento pero se marcan `source: "bot"`
- No se cuentan en métricas de conversión ni funnel

---

## 5. Sales Performance Score 0–100 con Semáforo Visual

Ver sección 2, Métrica 5 para fórmula completa.

### Mapeo a semáforo visual

El Score se acompaña de un color visual que resume el desempeño actual:

- 🔴 **Rojo**: 0–39/100 (urgente mejorar, acción inmediata necesaria)
- 🟡 **Ámbar**: 40–69/100 (aceptable, hay margen para crecer, hay oportunidades claras)
- 🟢 **Verde**: 70–100/100 (excelente, mantener el ritmo, optimizar detalles)

**Visualización**: Card principal del dashboard con el número grande, el color de fondo (rojo/ámbar/verde), y un icono representativo (❌ / ⚠️ / ✓).

### Metas configurables (post-MVP)

El admin puede asignar a cada vendedor metas semanales/mensuales (opcional):
- Meta de conversión: ej. 5% semanal
- Meta de tiempo de respuesta: ej. <3h promedio
- Meta de monto vendido: ej. $50k/mes
- Meta de tasa de seguimiento: ej. >80%

El dashboard del vendedor mostraría progreso hacia meta (barra de progreso % completado). Esto se agrega **post-MVP** y no afecta el Score inicial.

### Incentivos perversos y contramedidas

| Incentivo perverso | Cómo inflarlo | Contramedida de diseño |
|-------------------|---------------|------------------------|
| **Spam de compartidos** | Compartir el link 100 veces al mismo grupo, infla visitas sin clientes reales | Deduplica por IP + user-agent; sesión nueva cada 30 min. Si <5 leads, data quality factor penaliza score. |
| **Seguimientos falsos** | Marcar "respondido" sin responder realmente, infla tasa de seguimiento | 1) El cliente debe haber consultado primero (existe evento `lead_created` con teléfono). 2) Se marca server-side, con timestamp. 3) Si el cliente no compra en 7 días, se audita la calidad. |
| **Marcar respondido sin responder** | Presionar botón sin escribir a WhatsApp, infla % pero no generan ventas. | 1) No hay medida directa; se detecta en post-análisis (follow-up sin conversión posterior). 2) Métrica 4 (conversión post-follow) penaliza esto naturalmente. 3) Se sugiere revisar calidad de respuesta. |
| **Crear leads falsos** | Agregar teléfono ficticio para inflar conteo de leads. | 1) Validar número con regex (formato chileno: 9XXXXXXXX). 2) Se marca con `phone_validated: false` si no pasa. 3) Métricas usan solo `phone_validated: true`. |
| **Cherry-picking de clientes "fáciles"** | Responder solo a clientes que claramente van a comprar, inflar conversion_post_follow. | 1) Se penaliza la tasa de seguimiento baja (Métrica 3). 2) Si sigues <50% de leads pero tu conversion post es 80%, es obvio; se sugiere "responde a todos". 3) Score desglosa componentes; admin ve discrepancias. |
| **Data insuficiente** | Con 1-2 leads/semana, el score es inestable y manipulable. | `data_quality_factor` descuenta score si <5 leads. Además, se muestra disclaimer. |
| **Refetch manual del dashboard** | Rellenar caché para obtener datos "frescos" que suben el score. | 1) Base de datos es fuente de verdad. 2) Eventos se persisten inmediatamente. 3) Se calcula cada hora (cron job). |

---

## 6. Sistema de recomendaciones accionables

Motor de reglas determinístico (sin LLM en MVP). Se ejecuta cada 4h a partir de 08:00 AM Santiago.

### Catálogo de reglas

```typescript
type RecommendationRule = {
  id: string;
  name: string;
  condition: (metrics: SellerMetrics) => boolean;
  actions: RecommendationAction[];
  priority: "high" | "medium" | "low";
};

type RecommendationAction = {
  text: string; // Español, máx 60 caracteres
  deepLink: string; // Ruta a donde actuar
  icon: string;
};
```

### Ejemplos de reglas

**Regla 1: Seguimiento urgente**
```
Condición: leads_no_respondidos > 3 Y tiempo_desde_last_follow_up > 24h
Acciones:
  - "Responde a 5 clientes que esperan" → /vendedor/leads?filter=pending_response
  - Prioridad: HIGH
Texto exacto: "Tienes 5 consultas sin responder. Responde ahora en WhatsApp."
```

**Regla 2: Mejorar catálogo**
```
Condición: conversion_% < 1 Y clientes_visitantes > 50
Acciones:
  - "Mejora descripción de tus 3 productos más vistos" → /admin/productos?sort=visits
  - Prioridad: HIGH
Texto: "Solo 1 de cada 100 visitas termina en compra. Revisa descripciones e imágenes."
```

**Regla 3: Aumentar visibilidad**
```
Condición: weekly_leads < 3 Y days_since_share > 7
Acciones:
  - "Comparte tu catálogo de nuevo" → /vendedor/compartir
  - Prioridad: MEDIUM
Texto: "Hace una semana sin compartir. Reavivar tu link en WhatsApp."
```

**Regla 4: Mejorar cierre**
```
Condición: conversion_post_follow_% < 30 Y follow_up_% > 50
Acciones:
  - "Revisa tus respuestas; pocos clientes compran" → /vendedor/desempeno#conversion
  - Prioridad: MEDIUM
Texto: "Respondes rápido ✓ pero pocos compran. ¿Mencionas precio y opciones?"
```

**Regla 5: Bajo volumen**
```
Condición: total_leads < 5 Y days_active > 7
Acciones:
  - "Tu catálogo necesita más visitas" → /vendedor/compartir
  - "Edita el título de tu catálogo" → /admin/catalogs/edit
  - Prioridad: MEDIUM
Texto: "Muy pocas consultas. Intenta compartir en nuevos grupos o mejorar el nombre del catálogo."
```

### Función de priorización

```typescript
priority_score = (
  probability_sale × 0.4 +     // Estimado: clientes no respondidos tienen ~30% de cerrar
  expected_value × 0.3 +       // Ticket promedio × conversion_rate
  urgency_decay × 0.3          // Exponencial: acción de hoy vale más que mañana
) × (1 / number_active_recommendations)
  // Si hay 5 acciones disponibles, cada una "cuesta" menos

// Orden final: top 3 por priority_score
```

### UI de recomendaciones

```
┌─────────────────────────────────────────┐
│ 📊 Sugerencias para hoy                 │
│                                          │
│ 1️⃣ [HIGH] Responde a 5 clientes        │
│   Tienes 5 consultas sin responder      │
│   → Ir a Mis Leads                      │
│                                          │
│ 2️⃣ [MED] Mejora descripciones          │
│   Solo 1% de visitas → compra           │
│   → Ver Top 3 Productos                 │
│                                          │
│ 3️⃣ [LOW] Reavivar catálogo             │
│   Hace 7 días sin compartir             │
│   → Compartir Link                      │
│                                          │
│ ✓ Viste "Responde a X clientes"?       │
│   Marca como hecho →                    │
└─────────────────────────────────────────┘
```

### Comportamiento edge case

- **Sin datos**: "Comparte tu catálogo para ver sugerencias"
- **Datos insuficientes (<5 leads/semana)**: Se muestran reglas pero con disclaimer "resultados pueden variar"
- **Vendedor nuevo (<3 días)**: Se ocultan recomendaciones; en su lugar: "Espera 3 días para ver tu primer análisis"
- **No hay acciones disponibles**: "¡Vas muy bien! Sigue así." + tips motivacionales

---

## 7. Ejemplo completo: vendedor ficticio durante una semana

**Contexto**: Cristina, vendedora de Chile, región Metropolitana. Vende productos de belleza. Semana del 4–10 de agosto de 2026.

### Eventos día a día

```
Lunes 4 ago:
  08:15 - visita: 3 clientes (Javier, María, Pedro)
  10:30 - view_product: 2 clientes (Javier, María)
  14:20 - add_to_cart: 1 cliente (Javier)
  16:45 - share: Cristina comparte en grupo WhatsApp "Amigas"
  18:00 - lead_created: 1 cliente (Pedro, 9XXXXXXXX, consulta por serum)

Martes 5 ago:
  07:30 - visita: 5 clientes (nuevos)
  09:00 - follow_up_marked: 1 cliente (Pedro)
    └── tiempo_respuesta = 9h 15m (lunes 18:00 + martes 09:00)
  11:15 - lead_created: 2 clientes (Sofía, Franco)
  15:00 - checkout: 1 cliente (Javier) → Orden #1050 | $32.990

Miércoles 6 ago:
  (sin actividad)

Jueves 7 ago:
  09:30 - visita: 8 clientes
  10:45 - view_product: 4 clientes
  14:20 - lead_created: 3 clientes (Ana, Gonzalo, Isabel)
  19:00 - follow_up_marked: 1 cliente (Sofía)
    └── tiempo_respuesta = 32h (martes 11:15 + miércoles 19:00)

Viernes 8 ago:
  08:00 - visita: 12 clientes (reavivar después de share)
  10:30 - add_to_cart: 3 clientes
  11:00 - lead_created: 2 clientes (Roberto, Josefina)
  12:30 - follow_up_marked: 1 cliente (Franco)
    └── tiempo_respuesta = 21h 15m (martes 11:15 + viernes 12:30)
  18:00 - checkout: 2 clientes (María, Sofía) → Órdenes #1051, #1052 | $24.990 + $47.500

Sábado 9 ago:
  10:00 - visita: 6 clientes
  14:00 - checkout: 1 cliente (Gonzalo) → Orden #1053 | $18.990

Domingo 10 ago:
  (sin actividad significativa)
```

### Agregados de la semana

**Visitas únicas**: 34 clientes  
**Vista de producto**: 6 clientes (18%)  
**Add-to-cart**: 4 clientes (12%)  
**Leads**: 8 clientes (24% de visitas)  
**Follow-ups respondidos**: 3 clientes (38% de leads)  
**Compras**: 4 clientes (12% de visitas) → Conversión = 1.17%  
**Compras post-follow-up**: 2 clientes (de 3 respondidos) → Conv. post-follow = 67%  

**Tiempo de respuesta promedio**: (9.25h + 32h + 21.25h) / 3 = **20.8 horas**

### Cálculo de métricas

**Métrica 1: Tasa de conversión**
```
Conversión = 4 clientes que compraron / 34 visitantes = 11.8%
Benchmark semanal anterior: 2 compras / 28 visitas = 7.1%
Tendencia: ↑ MEJORÓ (+66%)
```

**Métrica 2: Tiempo de 1ª respuesta**
```
Promedio = 20.8h
Escalado a semana: 5 clientes consultaron, 3 respondidos
Status: Bueno (dentro de 12–48h)
Benchmark semanal anterior: 14h (esta semana es más lenta por -6.8h)
Tendencia: ↓ EMPEORÓ
```

**Métrica 3: Tasa de seguimiento**
```
Follow-up % = 3 clientes respondidos / 8 consultados = 37.5%
Benchmark anterior: 4 / 9 = 44%
Tendencia: ↓ EMPEORÓ (-7.5%)
Status: Bajo (aceptable es 30–60%)
```

**Métrica 4: Conversión post-seguimiento**
```
Conv. post-follow = 2 compras (Sofía, María) / 3 respuestas = 66.7%
Benchmark anterior: 1 / 4 = 25%
Tendencia: ↑ MEJORÓ (+160%)
Status: Excelente (>60%)
```

**Métrica 5: Sales Performance Score**

```
conv_score = MIN(11.8% / 5%, 1.0) × 100 = 100

response_score = 100 - CLAMP(20.8 × 12.5, 0, 100)
               = 100 - CLAMP(260, 0, 100)
               = 100 - 100 = 0
               (¡Ouch! > 8h penaliza fuertemente)

followup_score = 37.5% × 100 = 37.5

conversion_post_score = MIN(66.7% / 40%, 1.0) × 100
                      = MIN(1.67, 1.0) × 100 = 100

volume_score = CLAMP(8 leads / 10, 0, 1.0) × 100 = 80

Score_raw = 0.25(100) + 0.15(0) + 0.20(37.5) + 0.25(100) + 0.15(80)
          = 25 + 0 + 7.5 + 25 + 12
          = 69.5

data_quality_factor = MIN(8 / 5, 1.0) = 1.0 (no descuento, >5 leads)

Score_final = 69.5 × 1.0 = 69.5 ≈ 70/100 → "BUENO"
```

### Dashboard mostrado a Cristina el lunes 11 ago

```
┌────────────────────────────────────────────────┐
│              MI DESEMPEÑO                      │
│                                                 │
│   Semana 4–10 ago | Comparar vs. semana ant. │
│                                                 │
├────────────────────────────────────────────────┤
│                                                 │
│  📊 TASA DE CONVERSIÓN                        │
│  11.8%  ↑ MEJORÓ (vs. 7.1%)                   │
│  [████████░░░░] 4 de 34 clientes compraron    │
│                                                 │
│  ⏱  TIEMPO 1ª RESPUESTA                        │
│  20.8h  ↓ EMPEORÓ (vs. 14h)                   │
│  Responde más rápido: <4h es excelente        │
│                                                 │
│  👥 TASA DE SEGUIMIENTO                       │
│  37.5%  ↓ EMPEORÓ (vs. 44%)                   │
│  Respondiste a 3 de 8 clientes                │
│                                                 │
│  🎯 CONVERSIÓN POST-SEGUIMIENTO               │
│  66.7%  ↑ MEJORÓ (vs. 25%)                    │
│  Cuando respondes, ¡2 de 3 compran!          │
│                                                 │
│  🏆 TU PUNTUACIÓN                             │
│     70/100  BUENO                             │
│  [═════════════════░░░░]                      │
│  ↑ Subió 5 puntos vs. semana pasada           │
│                                                 │
├────────────────────────────────────────────────┤
│                                                 │
│  📈 EMBUDO DE VENTAS                          │
│                                                 │
│  Visitas       ████████████  34 (100%)        │
│  Ver producto  ██░░░░░░░░░░   6 (18%)         │
│  Carrito       █░░░░░░░░░░░   4 (12%)         │
│  Consulta      ██░░░░░░░░░░   8 (24%)         │
│  Respuesta     █░░░░░░░░░░░   3 (38% de consul)
│  Compra        ████░░░░░░░░   4 (12%)         │
│                                                 │
│  ⚠️  Mayor caída: entre "Ver producto" y      │
│      "Carrito" (12%). Revisa descripciones.   │
│                                                 │
├────────────────────────────────────────────────┤
│                                                 │
│  💡 SUGERENCIAS PARA HOY                      │
│                                                 │
│  [HIGH] Responde a 5 clientes sin respuesta   │
│  Tienes 5 consultas pendientes desde hace     │
│  hasta 72h. Responde ahora en WhatsApp.       │
│  → Ir a Mis Leads                             │
│                                                 │
│  [MED] Tu tiempo de respuesta es lento        │
│  Respondiste en 20.8h; intenta <4h.           │
│  Los clientes rápidos compran 3x más.         │
│                                                 │
│  [MED] Tus respuestas funcionan bien (66% conv)
│  Pero respondes a muy pocos (38%). Dedica     │
│  30 min a responder a los otros 5.            │
│  → Ver mis leads                              │
│                                                 │
└────────────────────────────────────────────────┘
```

### Acción recomendada específica de un día

**Martes 5 ago, 08:30 AM**:
```
ACCIÓN RECOMENDADA:
"Responde a Pedro en WhatsApp"
→ Él consultó ayer a las 18:00 por serum anti-envejecimiento.
→ Está esperando tu respuesta (>12h sin reply).
→ Clientes que esperan 24h+ compran 2x menos.
→ [Botón] Abrir WhatsApp

Probabilidad estimada de venta: 35%
Valor esperado: $32.990 × 35% = $11.546
Urgencia: ALTA (ya pasaron >12h)
```

---

## 8. Comparación histórica y estadística

**Niveles de confianza según denominador**:
- <5 muestras: **muy incierto** — no mostrar número; decir "poco datos"
- 5–20 muestras: **incierto** — número ± intervalo de confianza al 95%
- 20–100 muestras: **moderado** — número ± 10% como rango
- 100+ muestras: **confiable** — número exacto

**Comparación semana vs. semana**:
```typescript
comparison = {
  metric: "Conversión",
  this_week: 5.2,
  last_week: 3.1,
  change_pct: ((5.2 - 3.1) / 3.1) * 100,  // +67.7%
  confidence: "moderado" // 34 muestras
  trend: ↑ MEJORÓ
  recommendation: "Sigue por este camino"
}
```

Si la semana anterior tenía <5 leads, se muestra: "No hay datos históricos suficientes. Vuelve a revisar el próximo lunes."

**Umbral mínimo para mostrar una métrica**:
- Conversión: ≥5 visitas
- Tiempo 1ª respuesta: ≥3 leads respondidos
- Tasa seguimiento: ≥5 leads
- Conversión post-follow: ≥3 leads respondidos
- Score: ≥5 leads

Si no se cumplen estos umbrales, la métrica aparece en gris con nota: "Necesitas más datos (mínimo X)".

**Suavizado bayesiano hacia baseline**:
Si vendedor tiene <20 muestras, su métrica se calcula como:
```
métrica_suavizada = (métrica_vendedor × muestras + baseline_plataforma × 20) / (muestras + 20)
```
Esto evita que varianzas pequeñas produzcan cambios dramáticos.

**Comunicación de incertidumbre en UI**:
```
Conversión: 5.2% ± 3% (intervalo de confianza 95%)
┌─────────────────────────┐
│ 2%          5.2%       8%  │
│ ├──────●─────────────────┤  │
│ └─────────────────────────┘
│  Muy incierto | Moderado → Confiable
```

**Benchmarks de plataforma** (no inventados):
- Se construyen después de MVP con datos reales de 50+ vendedores
- Se segmentan por: categoría de producto, antigüedad del vendedor, región
- No se mostrarán en Fase 1; se documenta cómo calcularlos para Fase 2

---

## 9. Eventos y arquitectura de datos

### Tabla: seller_events (append-only)

```prisma
model SellerEvent {
  id           String   @id @default(uuid()) @db.Uuid
  eventType    String   @map("event_type")
  sellerId     String   @map("seller_id") @db.Uuid
  visitorSessionId String? @map("visitor_session_id")
  customerId   String?  @map("customer_id")
  payload      Json     @default("{}")
  source       String   @default("app") // "app", "bot", "admin"
  ipHash       String?  @map("ip_hash")
  userAgent    String?  @map("user_agent")
  timestamp    DateTime @default(now()) @db.Timestamptz
  createdAt    DateTime @default(now()) @map("created_at")
  seller       Profile  @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  @@index([sellerId, eventType, timestamp], map: "idx_seller_events_main")
  @@index([visitorSessionId], map: "idx_seller_events_session")
  @@index([customerId], map: "idx_seller_events_customer")
  @@index([timestamp], map: "idx_seller_events_timestamp")
  @@map("seller_events")
}
```

**Campos adicionales en `payload` por event_type**:

```typescript
// visita
{ catalogSlug: string, catalogId: string }

// view_product
{ productId: string, productName: string, catalogSlug: string }

// add_to_cart
{ productId: string, quantity: number, price: Decimal }

// share
{ channel: "whatsapp" | "instagram" | "facebook" | "link_copy", catalogSlug: string }

// lead_created
{ phone: string, phoneValidated: boolean, message?: string, catalogSlug: string }

// follow_up_marked
{ leadId: string, respondedAt: DateTime }

// checkout
{ orderId: string, orderNumber: number, total: Decimal }
```

### Tabla: leads

```prisma
model Lead {
  id                String    @id @default(uuid()) @db.Uuid
  sellerId          String    @map("seller_id") @db.Uuid
  visitorSessionId  String?   @map("visitor_session_id")
  phone             String
  phoneValidated    Boolean   @default(false) @map("phone_validated")
  phoneHash         String?   @map("phone_hash") // Hash para dedupe sin guardar número
  message           String?
  catalogSlug       String?   @map("catalog_slug")
  source            String    @default("catalog_cta") // "catalog_cta", "product_cta"
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  followUps         FollowUp[]
  seller            Profile   @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  @@index([sellerId, createdAt], map: "idx_leads_seller_date")
  @@index([phoneHash], map: "idx_leads_phone_hash")
  @@map("leads")
}
```

### Tabla: follow_ups

```prisma
model FollowUp {
  id           String    @id @default(uuid()) @db.Uuid
  leadId       String    @map("lead_id") @db.Uuid
  sellerId     String    @map("seller_id") @db.Uuid
  markedAt     DateTime  @map("marked_at")
  markedAtDate DateTime  @map("marked_at_date") // Para queries GROUP BY date
  notes        String?
  createdAt    DateTime  @default(now()) @map("created_at")
  lead         Lead      @relation(fields: [leadId], references: [id], onDelete: Cascade)
  seller       Profile   @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  @@unique([leadId]) // Un lead solo puede tener un follow-up
  @@index([sellerId, markedAtDate], map: "idx_followups_seller_date")
  @@map("follow_ups")
}
```

### Tabla: daily_metrics_rollup (agregados pre-calculados para velocidad)

```prisma
model DailyMetricsRollup {
  id                String  @id @default(uuid()) @db.Uuid
  sellerId          String  @map("seller_id") @db.Uuid
  metricsDate       DateTime @map("metrics_date") // YYYY-MM-DD
  visitCount        Int     @map("visit_count")
  uniqueVisitors    Int     @map("unique_visitors")
  viewProductCount  Int     @map("view_product_count")
  addToCartCount    Int     @map("add_to_cart_count")
  leadCount         Int     @map("lead_count")
  followUpCount     Int     @map("follow_up_count")
  checkoutCount     Int     @map("checkout_count")
  checkoutTotal     Decimal @map("checkout_total") @db.Decimal(10, 2)
  seller            Profile @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  @@unique([sellerId, metricsDate], map: "idx_rollup_seller_date")
  @@index([metricsDate], map: "idx_rollup_date")
  @@map("daily_metrics_rollup")
}
```

### Política de RLS

```sql
-- seller_events: Cada vendedor ve solo sus eventos
CREATE POLICY "seller_events_sel_own" ON seller_events
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "seller_events_insert" ON seller_events
  FOR INSERT WITH CHECK (true); -- Cuidado: se valida en app que seller_id = current user

CREATE POLICY "admin_events_select" ON seller_events
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- leads: El vendedor ve solo sus leads
CREATE POLICY "leads_sel_own" ON leads
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "leads_insert" ON leads
  FOR INSERT WITH CHECK (seller_id = auth.uid());

-- follow_ups: El vendedor marca sus propios follow-ups
CREATE POLICY "follow_ups_sel_own" ON follow_ups
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "follow_ups_insert" ON follow_ups
  FOR INSERT WITH CHECK (seller_id = auth.uid());

-- daily_metrics_rollup: acceso similar
```

### Tratamiento de PII

**Teléfono**:
- Se guarda en tabla `leads` como `phone` (completo, pero encriptado en BD)
- Se calcula `phone_hash = SHA256(phone)` para dedupe sin revelar número
- **Política de retención**: 90 días tras crear; luego se anonimiza (phone → NULL, phoneHash permanece)
- **Acceso**: Solo vendedor propietario y admin

**IP/User-Agent**:
- Se guarda `ipHash = SHA256(IP)` (no IP completa)
- Se guarda `userAgent` completo (útil para detectar bots)
- Retención: 30 días

### Idempotencia y Dedupe

**Visita**:
- `(visitor_session_id, seller_code)` en la misma hora = 1 event, no 2
- Si cliente reenvía request, se inserta solo si `timestamp` es diferente en >5 min

**Lead**:
- `(seller_id, phone_hash, catalog_slug)` en la misma hora = 1 lead, no 2
- Si cliente consulta 2 veces en 5 min, se cuenta como 1

**Follow-up**:
- `lead_id` UNIQUE; un lead solo se puede marcar respondido una vez
- Si intenta marcar 2 veces, BD rechaza con error UNIQUE

### Estrategia de cálculo

**MVP (Fase 1)**: Query on-demand
```typescript
// src/lib/metrics.ts
async function getWeeklyMetrics(sellerId: string, week: Date) {
  const since = startOfWeek(week); // lunes
  const until = endOfWeek(week);   // domingo
  
  // 4 queries paralelas
  const [visits, leads, followups, orders] = await Promise.all([
    prisma.sellerEvent.findMany({
      where: { sellerId, eventType: "visita", timestamp: { gte: since, lt: until }, source: { not: "bot" } }
    }),
    prisma.lead.findMany({ where: { sellerId, createdAt: { gte: since, lt: until } } }),
    prisma.followUp.findMany({ where: { sellerId, markedAtDate: { gte: since, lte: until } } }),
    prisma.order.findMany({ where: { sellerId, createdAt: { gte: since, lt: until }, status: { not: "cancelled" } } }),
  ]);
  
  // Cálculos en JS
  const uniqueVisitors = new Set(visits.map(v => v.visitorSessionId)).size;
  const conversion = orders.length / uniqueVisitors;
  // ... resto de métricas
}
```

**Impacto de rendimiento**: Con <1000 eventos/semana, las queries toman <100ms. Aceptable.

**Post-MVP (Fase 2)**: Rollup diario
```typescript
// scripts/rollup-daily-metrics.ts (cron job cada 01:00 AM Santiago)
async function rollupMetrics(date: Date) {
  const sellersActive = await prisma.profile.findMany({
    where: { role: "seller", active: true },
  });
  
  for (const seller of sellersActive) {
    const metrics = await getMetricsForDay(seller.id, date);
    await prisma.dailyMetricsRollup.upsert({
      where: { sellerId_metricsDate: { sellerId: seller.id, metricsDate: date } },
      update: metrics,
      create: { sellerId: seller.id, metricsDate: date, ...metrics },
    });
  }
}
```

**Recomendación para volumen actual**: On-demand es suficiente. En MVP, no inicializar rollup; solo queries cacheadas a nivel de app (revalidate cada 60s).

---

## 10. Diseño conceptual del dashboard `/vendedor/desempeno`

### Jerarquía de información (mobile-first)

```
┌──────────────────────────────────────┐
│       HEADER                         │
│  "Mi Desempeño" + período selector   │
│  (Semana actual | Mes | Últimos 7d)  │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  SECTION 1: STATUS PRINCIPAL         │
│  🏆 Tu Puntuación: 70/100 | BUENO   │
│  [════════════════░░░░] flecha ↑    │
│  vs. semana anterior: +5pts         │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  SECTION 2: 4 TARJETAS MÉTRICAS     │
│  (Stacked en mobile, 2×2 en tablet)  │
│                                      │
│  📊 Conversión                      │
│     11.8% ↑ vs. 7.1%               │
│     4 de 34 clientes                │
│                                      │
│  ⏱ 1ª Respuesta                     │
│     20.8h ↓ vs. 14h                │
│     Lento; mejora <4h              │
│                                      │
│  👥 Seguimiento                     │
│     37.5% ↓ vs. 44%                │
│     Respondiste a 3 de 8            │
│                                      │
│  🎯 Conv. Post-Follow               │
│     66.7% ↑ vs. 25%                │
│     2 de 3 respuestas → compra     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  SECTION 3: EMBUDO                  │
│                                      │
│  Clientes que llegaron / compraron  │
│  [Gráfico de barras o funnel]       │
│                                      │
│  Visitas     ████ 34                │
│  Producto    ██  6 (18%)            │
│  Carrito     █   4 (12%)            │
│  Consulta    ██  8 (24%)            │
│  Respuesta   █   3 (38%)            │
│  Compra      ██  4 (12%)            │
│                                      │
│  ⚠️ Mayor caída: Producto→Carrito   │
│     Revisa precios y descripciones  │
│                                      │
│  [Tap para expandir etapa]          │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  SECTION 4: SUGERENCIAS DIARIAS    │
│                                      │
│  💡 Top 3 acciones para hoy         │
│                                      │
│  [HIGH] Responde a 5 clientes      │
│  Tienes 5 consultas sin responder   │
│  → [Botón] Ir a Mis Leads           │
│                                      │
│  [MED] Mejora descripciones         │
│  Tu conversión es baja              │
│  → [Botón] Ver Top 3 Productos      │
│                                      │
│  [MED] Reavivar catálogo            │
│  Hace 7 días sin compartir          │
│  → [Botón] Compartir Link           │
│                                      │
│  [✓] Completaste "Responder a X"    │
│      Marca como hecho →             │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  SECTION 5: GRÁFICO TEMPORAL        │
│  (Semanal de últimos 30d)           │
│                                      │
│  Línea: Puntuación diaria           │
│  Barras: Leads por día              │
│  [Recharts LineChart + ComposedChart]
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  SECTION 6: AYUDA Y CONTEXTO        │
│                                      │
│  "¿Qué significan estas métricas?"  │
│  [Accordion expandible]             │
│                                      │
│  ▶ Conversión                       │
│  ▶ Tiempo de respuesta              │
│  ▶ Tasa de seguimiento              │
│  ▶ Conv. post-follow                │
└──────────────────────────────────────┘
```

### Componentes React concretos

```typescript
// src/app/vendedor/desempeno/page.tsx

import { PerformanceDashboard } from "@/components/dashboard/performance-dashboard";

export default async function DesempenoPage() {
  // Fetch metrics server-side
  const metrics = await getWeeklyMetrics(sellerId);
  const funnel = await getFunnelData(sellerId);
  const recommendations = await getRecommendations(sellerId);
  
  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <PerformanceDashboard 
          metrics={metrics}
          funnel={funnel}
          recommendations={recommendations}
        />
      </div>
    </main>
  );
}
```

```typescript
// src/components/dashboard/performance-dashboard.tsx
"use client";

import { PerformanceScore } from "@/components/dashboard/performance-score";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { RecommendationsSection } from "@/components/dashboard/recommendations-section";
import { PerformanceChart } from "@/components/dashboard/performance-chart";

export function PerformanceDashboard({ metrics, funnel, recommendations }) {
  return (
    <div className="space-y-6">
      {/* 1. Score principal */}
      <PerformanceScore score={metrics.score} trend={metrics.scoreTrend} />
      
      {/* 2. Tarjetas de métricas */}
      <MetricsGrid metrics={metrics} />
      
      {/* 3. Embudo */}
      <Card>
        <CardHeader>
          <CardTitle>Embudo de ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelChart data={funnel} />
        </CardContent>
      </Card>
      
      {/* 4. Sugerencias */}
      <RecommendationsSection recommendations={recommendations} />
      
      {/* 5. Gráfico temporal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución (últimos 30 días)</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceChart data={metrics.historicalData} />
        </CardContent>
      </Card>
    </div>
  );
}
```

```typescript
// src/components/dashboard/metrics-grid.tsx
export function MetricsGrid({ metrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <MetricCard
        label="Tasa de conversión"
        value={`${metrics.conversion.toFixed(1)}%`}
        trend={metrics.conversionTrend}
        change={metrics.conversionChange}
        detail={`${metrics.conversions} de ${metrics.uniqueVisitors} clientes`}
        status={getStatus(metrics.conversion, [1, 3, 7])}
      />
      
      <MetricCard
        label="Tiempo 1ª respuesta"
        value={`${metrics.avgResponse.toFixed(1)}h`}
        trend={metrics.responseTrend}
        change={metrics.responseChange}
        detail={`${metrics.respondedLeads} de ${metrics.totalLeads} respondidos`}
        status={getStatus(metrics.avgResponse, [2, 12, 48], "inverse")} // Inversa: bajo es mejor
      />
      
      {/* Similar para follow-up y conversion_post */}
    </div>
  );
}
```

```typescript
// src/components/dashboard/performance-score.tsx
export function PerformanceScore({ score, trend }) {
  const getColor = (s: number) => {
    if (s < 30) return "text-red-500";
    if (s < 50) return "text-yellow-500";
    if (s < 75) return "text-blue-500";
    return "text-green-500";
  };
  
  return (
    <Card className="border-gold/40 bg-gradient-to-br from-gold/10 to-white">
      <CardContent className="flex items-center justify-between pt-6">
        <div>
          <p className="text-sm text-muted-foreground">Tu puntuación</p>
          <div className={`text-4xl font-bold ${getColor(score)}`}>
            {Math.round(score)}/100
          </div>
          <p className="mt-1 text-sm">
            {trend > 0 ? "↑ Subió" : trend < 0 ? "↓ Bajó" : "→ Igual"} {Math.abs(trend)} pts
          </p>
        </div>
        
        {/* Radial/Circular gauge */}
        <div className="relative h-32 w-32">
          <svg viewBox="0 0 120 120" className="h-full w-full">
            {/* Background circle */}
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={getColor(score)}
              strokeWidth="8"
              strokeDasharray={`${(score / 100) * 314} 314`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
            {/* Center text */}
            <text x="60" y="65" textAnchor="middle" className="text-lg font-bold">
              {Math.round(score)}%
            </text>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Componente FunnelChart (Recharts)

```typescript
// src/components/dashboard/funnel-chart.tsx
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function FunnelChart({ data }) {
  // data = [
  //   { stage: "Visitas", count: 34, rate: 100 },
  //   { stage: "Producto", count: 6, rate: 18 },
  //   { stage: "Carrito", count: 4, rate: 12 },
  //   { stage: "Consulta", count: 8, rate: 24 },
  //   { stage: "Respuesta", count: 3, rate: 38 },
  //   { stage: "Compra", count: 4, rate: 12 },
  // ]
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="stage" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        
        <Bar yAxisId="left" dataKey="count" fill="#1B2A4A" name="Clientes" />
        <Bar yAxisId="right" dataKey="rate" fill="#D4A843" name="% conversión" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

### Estados vacío y onboarding

```typescript
// src/components/dashboard/performance-dashboard.tsx

export function PerformanceDashboard({ metrics, funnel, recommendations }) {
  if (!metrics) {
    return (
      <Card className="border-cream-dark">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-navy">Sin datos todavía</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            Comparte tu catálogo para que clientes empiecen a consultarte. Dentro de 3 días verás tu primer análisis.
          </p>
          <Button asChild className="mt-4">
            <Link href="/vendedor/compartir">Compartir catálogo</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (metrics.daysActive < 3) {
    return (
      <Card className="border-cream-dark">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-10 w-10 mx-auto text-warning mb-3" />
          <h3 className="text-lg font-semibold text-navy">Datos insuficientes</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Necesitamos 3 días de datos para calcular métricas significativas.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Faltan {3 - metrics.daysActive} días. Vuelve el {formatDate(addDays(new Date(), 3 - metrics.daysActive))}.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Normal rendering
  return (
    <div className="space-y-6">
      {/* ... secciones normales */}
    </div>
  );
}
```

### Orden vertical exacto en mobile

1. Header (período selector)
2. Performance Score (grande, circular gauge)
3. Tarjetas de métricas (stacked 1 por línea)
4. Card "Mayor caída" (alertas del funnel)
5. Embudo (gráfico completo)
6. Sugerencias (hasta 3)
7. Gráfico temporal (30 días)
8. Preguntas frecuentes (accordion)

---

## 11. Reglas de negocio y casos límite

### Zona horaria y cortes

**Zona horaria**: America/Santiago (UTC-4 en invierno, UTC-3 en verano)
**Corte de semana**: Lunes 00:00 – Domingo 23:59 Santiago
**Corte de mes**: 1º a último día del mes (calendario gregoriano)

```typescript
// lib/time-utils.ts
export const TIMEZONE = "America/Santiago";

export function getWeekBoundaries(date: Date = new Date()) {
  const tz = new Date(date.toLocaleString("en", { timeZone: TIMEZONE }));
  const day = tz.getDay(); // 0=Sun, 1=Mon, ...
  const diff = tz.getDate() - day + (day === 0 ? -6 : 1);
  
  const monday = new Date(tz.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { monday, sunday };
}
```

### Pedidos cancelados o devueltos

**Efecto retroactivo**:
- Si un pedido pasa de "delivered" a "cancelled":
  - Comisión se revierte a "cancelled"
  - Orden no se cuenta en métricas de conversión
  - Gráficos se recalculan

```typescript
async function cancelOrder(orderId: string) {
  // 1. Marcar orden como cancelled
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "cancelled", updatedAt: new Date() },
  });
  
  // 2. Revertir comisión
  await prisma.commission.updateMany({
    where: { orderId },
    data: { status: "cancelled" },
  });
  
  // 3. Emitir evento para auditoría
  await prisma.sellerEvent.create({
    data: {
      eventType: "order_cancelled",
      sellerId: order.sellerId,
      payload: { orderId, previousStatus: "delivered" },
    },
  });
  
  // 4. Invalidar caché de métricas
  revalidateMetricsCache(order.sellerId);
}
```

### Vendedor inactivo o de vacaciones

**Definición de inactivo**: Sin eventos en 30 días.

**Comportamiento**:
- Dashboard muestra: "No has tenido actividad en 30 días. ¿Volviste?"
- Métricas no se calculan; se muestra histórico
- Si vuelve activo, cálculos se normalizan automáticamente

```typescript
async function checkVendorStatus(sellerId: string) {
  const lastEvent = await prisma.sellerEvent.findFirst({
    where: { sellerId },
    orderBy: { timestamp: "desc" },
  });
  
  const daysSinceLastEvent = differenceInDays(new Date(), lastEvent.timestamp);
  
  return {
    isActive: daysSinceLastEvent < 30,
    daysSinceLastEvent,
    lastActivity: lastEvent.timestamp,
  };
}
```

### Cliente compra sin haber consultado

**Caso**: Cliente llega al catálogo, agrega carrito, y checkout sin hacer clic en "Consultar".

**Cálculo**:
- Sí se cuenta en Conversión (visita → compra)
- No se cuenta en Tasa de Seguimiento (no hay lead)
- No se cuenta en Conv. Post-Seguimiento (no hay follow-up)

**Implicación**: El vendedor puede tener Conversión >0 pero Seguimiento=0. Es válido: algunos clientes compran sin consultar.

### Mismo cliente atendido por dos vendedores

**Caso**: Cliente A visita catálogo de V1, luego de V2, luego compra en V2.

**Atribución**: Solo V2 recibe comisión (última cookie wins).

**Métricas**:
- V1: cuenta como "visita" (contribuye a su denominador de conversión) pero no como compra
- V2: cuenta como "visita" y "compra"
- Conversión de V1: 0 de 1 (contribuye al denominador)
- Conversión de V2: 1 de 1

**Ventana de atribución**: 7 días (si cliente compra >7 días después de primer clic, comisión va a V2 pero no se descuenta de V1)

### Lead duplicado

**Caso**: Cliente consulta 2 veces en 5 minutos.

**Validación**:
```typescript
async function createLead(sellerId: string, phone: string, catalogSlug: string) {
  const existing = await prisma.lead.findFirst({
    where: {
      sellerId,
      phoneHash: hashPhone(phone),
      catalogSlug,
      createdAt: { gte: subMinutes(new Date(), 5) },
    },
  });
  
  if (existing) {
    return { lead: existing, isNew: false };
  }
  
  // Crear nuevo lead
  return { lead: newLead, isNew: true };
}
```

### Leads sin teléfono válido

**Validación**:
```typescript
function isValidChilePhone(phone: string): boolean {
  // Chile: 9XXXXXXXX (9 dígitos, sin +56, sin 0)
  return /^9\d{8}$/.test(phone.replace(/\D/g, ""));
}
```

Si teléfono no es válido:
- Lead se crea igual (con `phoneValidated: false`)
- No se cuenta en métricas de Seguimiento
- Se muestra warning al vendedor: "Número inválido; pide el número correcto en WhatsApp"

### Borrado/anonimización de datos de cliente

**Regla LGPD**: Después de 90 días, PII se anonimiza.

```typescript
// scripts/anonymize-pii.ts (cron job cada medianoche)
async function anonymizeOldLeads() {
  const cutoff = subDays(new Date(), 90);
  
  await prisma.lead.updateMany({
    where: {
      createdAt: { lt: cutoff },
      phone: { not: null }, // Solo si aún tiene teléfono
    },
    data: {
      phone: null,
      phoneHash: null, // Mantener NULL para dedupe
      message: null,
    },
  });
}
```

Después de anonimización:
- El lead sigue contando para métricas históricas
- El vendedor no puede ver el número
- Las métricas futuras no son afectadas

### Qué pasa cuando el denominador es 0

**Ejemplos**:
- `Conversión = compras / visitas`, pero `visitas = 0` → mostrar "—"
- `Seguimiento = follow-ups / leads`, pero `leads = 0` → mostrar "—"

**UI**:
```typescript
function formatMetric(numerator: number, denominator: number): string {
  if (denominator === 0) return "—";
  return `${(numerator / denominator * 100).toFixed(1)}%`;
}
```

### Retención/rotación de eventos

**Política**: Eventos se guardan indefinidamente en `seller_events` (base de verdad).

**Agregados (`daily_metrics_rollup`)**: Se guardan durante 2 años; más allá se archivan en Google Cloud Storage (post-MVP).

**Leads**: Indefinidamente, pero anonimizados tras 90 días.

### Privacidad: Ranking y comparación entre vendedores

**Principio**: El ranking/benchmarking es **privado para admin**, nunca visible para vendedores entre pares.

**Por qué**: Un vendedor que se ve clasificado como "#15 de 20" se desmoraliza; un vendedor que ve su propio progreso ("Score subió de 65 a 78") se motiva.

**Implementación**:
- **Para el vendedor**: Solo ve su Score + comparación vs. su propia histórica (tendencia semanal, 30 días)
- **Para admin**: Tabla completa con ranking, percentiles, top 3 del mes; puede exportar CSV
- **Reportería futura**: Se puede mostrar "percentil general" de forma anónima ("estás en el percentil 65 entre todos los vendedores") sin exponer nombres

**Excepción post-MVP**: Gamificación voluntaria ("Leaderboard de top 3 del mes") si se desea, con opt-in explícito del vendedor.

---

## Resumen técnico de implementación

**Dependencias nuevas**: Ninguna. Se usa Recharts (ya instalado), Prisma (ya instalado), Zod (ya instalado).

**Migraciones Prisma**: 3 migraciones
1. Crear tablas `seller_events`, `leads`, `follow_ups`
2. Crear tabla `daily_metrics_rollup`
3. Crear índices y políticas RLS

**Server Actions nuevas**:
- `markFollowUp(leadId: string)` → crear FollowUp
- `getMetrics(sellerId: string, period: "week" | "month")` → calcular métricas
- `getRecommendations(sellerId: string)` → listar acciones

**Rutas nuevas**:
- `GET /vendedor/desempeno` → dashboard
- `GET /api/metrics/weekly` → API para refresh
- `GET /admin/desempeno` → tabla de vendedores

**Tiempo de implementación**: ~200 horas (Fase 1 MVP), ~80 horas (Fase 2 optimización).
