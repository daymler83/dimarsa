# Sales Performance — Tasks

## Implementation Checklist

### Phase 1 (MVP): Foundation & Core Metrics

#### Block 1: Database Schema & Migrations

- [ ] **Task 1.1** — Create Prisma migration: Add `SellerEvent` model (append-only event table)
  - `id`, `eventType`, `sellerId`, `visitorSessionId`, `customerId`, `payload` (JSON)
  - `source` (app/bot/admin), `ipHash`, `userAgent`, `timestamp`, `createdAt`
  - Indices: `(sellerId, eventType, timestamp)`, `(visitorSessionId)`, `(timestamp)`
  - No relation to other models yet (flexible schema for future events)
  - *Depends on*: None
  - *Effort*: 2h

- [ ] **Task 1.2** — Create Prisma migration: Add `Lead` and `FollowUp` models
  - `Lead`: `id`, `sellerId`, `visitorSessionId`, `phone`, `phoneValidated`, `phoneHash`, `message`, `catalogSlug`, `source`, `createdAt`
  - `FollowUp`: `id`, `leadId` (UNIQUE), `sellerId`, `markedAt`, `markedAtDate`, `notes`, `createdAt`
  - RLS policies: Seller sees only own data; admin sees all
  - *Depends on*: Task 1.1 (need to add Profile relation to SellerEvent)
  - *Effort*: 3h

- [ ] **Task 1.3** — Create Prisma migration: Add `DailyMetricsRollup` model (post-MVP, but define schema now)
  - `id`, `sellerId`, `metricsDate`, `visitCount`, `uniqueVisitors`, `viewProductCount`, `addToCartCount`, `leadCount`, `followUpCount`, `checkoutCount`, `checkoutTotal`
  - UNIQUE constraint: `(sellerId, metricsDate)`
  - Index: `(metricsDate)`
  - *Depends on*: None (schema only, no job yet)
  - *Effort*: 1.5h

- [ ] **Task 1.4** — Update Prisma schema: Add relations
  - `Profile`: add `events SellerEvent[]`, `leads Lead[]`, `followUps FollowUp[]`
  - `Order`: add relation to `SellerEvent` (optional, for checkout events)
  - Run `npx prisma generate` and validate no type conflicts
  - *Depends on*: Task 1.2
  - *Effort*: 1h

---

#### Block 2: Event Capture Infrastructure

- [ ] **Task 2.1** — Create `lib/events.ts`: Event emission helper
  - Function `emitEvent(eventType: string, sellerId: string, payload: unknown, source?: string)`
  - Validates `eventType` against whitelist (visita, view_product, add_to_cart, share, lead_created, follow_up_marked, checkout)
  - Validates schema with Zod based on `eventType`
  - Returns event ID; throws on validation failure
  - *Depends on*: Task 1.4
  - *Effort*: 2h

- [ ] **Task 2.2** — Create middleware for bot detection
  - `lib/bot-detection.ts`: Function `isBotUserAgent(userAgent: string): boolean`
  - Detects: facebookexternalhit, Twitterbot, WhatsApp, Telegram, LinkedInBot, Viber, Skype, Signal
  - Returns boolean; marks source as "bot" if detected
  - Used by event emission
  - *Depends on*: None
  - *Effort*: 1h

- [ ] **Task 2.3** — Instrument `/c/[sellerCode]` page: Emit `visita` event
  - On mount, emit event with `catalogSlug` and `visitorSessionId` (from cookie or new)
  - Detect bot via middleware; mark source accordingly
  - Wrap in try-catch; do not block page render on event failure
  - *Depends on*: Task 2.1, 2.2
  - *Effort*: 2h

- [ ] **Task 2.4** — Instrument product detail `/c/[sellerCode]/[productSlug]`: Emit `view_product` event
  - On mount, emit with `productId`, `productName`, `catalogSlug`
  - *Depends on*: Task 2.1
  - *Effort*: 1h

- [ ] **Task 2.5** — Instrument add-to-cart button: Emit `add_to_cart` event
  - Hook into `use-cart.ts` or create new action for cart update
  - Emit with `productId`, `quantity`, `price`
  - *Depends on*: Task 2.1
  - *Effort*: 1.5h

- [ ] **Task 2.6** — Instrument checkout: Emit `checkout` event
  - When Order is created (in `actions/orders.ts`), emit `checkout` with `orderId`, `orderNumber`, `total`
  - Dedupe: check if event already exists for this `orderId` in last 1h
  - *Depends on*: Task 2.1, and shopping-cart-checkout spec
  - *Effort*: 1.5h

---

#### Block 3: Lead Management & Follow-up Capture

- [ ] **Task 3.1** — Create lead creation action: `actions/leads.ts::createLead()`
  - Input: Zod schema `{ sellerId, phone, catalogSlug, message? }`
  - Validate phone (Chile format)
  - Check for duplicates in last 5 minutes (same seller, phone, catalog)
  - Create Lead record; emit `lead_created` event
  - Return lead ID
  - *Depends on*: Task 1.2, 2.1
  - *Effort*: 2h

- [ ] **Task 3.2** — Create CTA "Consultar por WhatsApp" component
  - New component `components/catalog/consult-button.tsx`
  - Button on catalog page and product detail page
  - Modal: asks for phone number (pre-fill if logged in)
  - On submit: calls `createLead()`, then opens `wa.me` with pre-filled message
  - Deep link includes `ref=` parameter to track lead source
  - *Depends on*: Task 3.1
  - *Effort*: 2.5h

- [ ] **Task 3.3** — Create follow-up marking action: `actions/follow-ups.ts::markFollowUp()`
  - Input: Zod schema `{ leadId, notes? }`
  - Verify seller owns the lead (RLS layer + server-side check)
  - Create FollowUp record with current timestamp; emit `follow_up_marked` event
  - Handle UNIQUE constraint on `leadId` (already responded); return 409 if so
  - *Depends on*: Task 1.2, 2.1
  - *Effort*: 1.5h

- [ ] **Task 3.4** — Create `/vendedor/leads` page (list of leads for a seller)
  - Server-side: fetch leads with optional filters (responded/pending, date range)
  - Mobile-first card layout; each lead shows:
    - Phone (last 4 digits visible, masked for privacy)
    - Message (if any)
    - Date consulted
    - Status badge (pending / responded)
    - Button to mark as responded (if pending)
  - Deep link from recommendations should pre-filter
  - *Depends on*: Task 3.3
  - *Effort*: 2.5h

---

#### Block 4: Metrics Calculation

- [ ] **Task 4.1** — Create `lib/metrics.ts::getWeeklyMetrics()`
  - Input: `sellerId`, optional `week` date
  - Queries `SellerEvent`, `Lead`, `FollowUp`, `Order` (all in parallel)
  - Calculate 5 metrics:
    1. Conversion: unique_checkout / unique_visita
    2. Avg response time: MEDIAN(follow_up.markedAt - lead.createdAt)
    3. Follow-up rate: follow_ups / leads
    4. Conversion post-follow: conversions_with_follow / follows
    5. Score: weighted formula (see design.md section 2, metric 5)
  - Return object with all metrics, denominators (for confidence), trends
  - Handle zero denominators gracefully
  - *Depends on*: Task 1.2, 1.4, and shopping-cart-checkout spec (must be implemented first)
  - *Effort*: 4h

- [ ] **Task 4.2** — Create `lib/metrics.ts::getFunnelData()`
  - Input: `sellerId`, period filter
  - Calculate transitions: visita → view_product → add_to_cart → lead → follow_up → checkout
  - For each stage: count unique customers, calculate % conversion to next stage
  - Return array of funnel stages with counts, rates, and top alert (biggest drop)
  - *Depends on*: Task 4.1
  - *Effort*: 2h

- [ ] **Task 4.3** — Create `lib/recommendations.ts::getRecommendations()`
  - Input: `sellerId`, current metrics
  - Implement 5–6 rules (see design.md section 6)
  - Each rule evaluates condition against metrics; if true, yields action(s)
  - Sort actions by priority score (probability × value × urgency)
  - Return top 3 actions with text, deepLink, icon
  - Handle "no actions available" state gracefully
  - *Depends on*: Task 4.1
  - *Effort*: 3h

- [ ] **Task 4.4** — Create `lib/time-utils.ts`: Week/month boundary helpers
  - `getWeekBoundaries(date?: Date)` → { monday, sunday } in Santiago time
  - `getMonthBoundaries(date?: Date)` → { firstDay, lastDay }
  - Validate timezone using `date-fns` with locale
  - *Depends on*: None
  - *Effort*: 1h

---

#### Block 5: Dashboard UI

- [ ] **Task 5.1** — Create `/vendedor/desempeno` page (server component)
  - Fetch metrics, funnel, recommendations server-side
  - Pass to `PerformanceDashboard` client component
  - Handle loading state (if fetch fails, show error card)
  - Mobile-first layout
  - *Depends on*: Task 4.1, 4.2, 4.3
  - *Effort*: 2h

- [ ] **Task 5.2** — Create `components/dashboard/performance-dashboard.tsx` (client)
  - Main container; no state logic, just passes props to child components
  - Sections in order: Score, Metrics Grid, Funnel, Recommendations, Historical Chart
  - Handle empty/insufficient data states
  - *Depends on*: Task 5.1
  - *Effort*: 1.5h

- [ ] **Task 5.3** — Create `components/dashboard/performance-score.tsx`
  - Display circular gauge with current score, color-coded status
  - Show trend (↑/↓/→) and change vs. previous week
  - Props: `score: number`, `trend: number`, `status: "malo" | "aceptable" | "bueno" | "excelente"`
  - *Depends on*: Task 5.2
  - *Effort*: 2h

- [ ] **Task 5.4** — Create `components/dashboard/metrics-grid.tsx`
  - 4 cards (Conversión, 1ª Respuesta, Seguimiento, Conv. Post-Follow) in grid
  - Mobile: 1 per row; tablet+: 2 per row
  - Each card: value, trend badge, comparison vs. week ago, detail text
  - *Depends on*: Task 5.2
  - *Effort*: 2.5h

- [ ] **Task 5.5** — Create `components/dashboard/funnel-chart.tsx`
  - Recharts ComposedChart: bars (count) + line (% conversion) per stage
  - 6 stages: visita, view_product, add_to_cart, lead, follow_up, checkout
  - Alert badge on stage with biggest drop
  - Expandable (on click): show 3–5 sample customers for that stage
  - *Depends on*: Task 5.2
  - *Effort*: 3h

- [ ] **Task 5.6** — Create `components/dashboard/recommendations-section.tsx`
  - Render top 3 recommendations as cards
  - Each: icon, action text, affected count, button with deepLink
  - Handle "no recommendations" with positive message
  - Handle "data insufficient" with explanation
  - Handle "vendor onboarding" (< 3 days) with encouragement
  - *Depends on*: Task 5.2
  - *Effort*: 2h

- [ ] **Task 5.7** — Create `components/dashboard/performance-chart.tsx`
  - Recharts LineChart: score per day, last 30 days
  - Also overlay: bar chart of leads per day
  - Mobile: responsive, stacked legend
  - Tooltip on hover
  - *Depends on*: Task 5.2
  - *Effort*: 2h

---

#### Block 6: Admin Dashboard

- [ ] **Task 6.1** — Create `/admin/desempeno` page: table of all sellers
  - Columns: Seller name, Conversion (this week), Score, Trend, Last order
  - Sortable by all columns; filterable by active/inactive
  - On click row: navigate to `/admin/desempeno/[sellerId]` (detailed view)
  - Export CSV button (top right)
  - *Depends on*: Task 4.1
  - *Effort*: 2.5h

- [ ] **Task 6.2** — Create `/admin/desempeno/[sellerId]` page: view seller's dashboard
  - Same layout as `/vendedor/desempeno`, but admin can see all data
  - Add "impersonate" button (log as that seller for testing)
  - *Depends on*: Task 5.1
  - *Effort*: 1h

---

#### Block 7: Testing & Validation

- [ ] **Task 7.1** — Create seed data for metrics testing
  - Script `scripts/seed-events.ts`: creates 20+ events for demo sellers
  - Mix of visita, add_to_cart, lead, follow_up, checkout
  - Spread across 2+ weeks to test trends
  - Run: `npx prisma db seed`
  - *Depends on*: All event capture tasks
  - *Effort*: 2h

- [ ] **Task 7.2** — Manual testing checklist
  - [ ] Dashboard loads <2s with 1000+ events
  - [ ] Metrics calculate correctly against known data
  - [ ] Trends show accurately (week vs. week)
  - [ ] Bot detection filters events correctly
  - [ ] RLS: seller sees only own data; admin sees all
  - [ ] Empty/insufficient data states render correctly
  - [ ] Recommendations trigger correctly for edge cases
  - [ ] Lead creation dedupes correctly
  - [ ] Follow-up marking prevents duplicates
  - [ ] Mobile layout is responsive and readable
  - [ ] All links work (deepLinks to leads, products, etc.)
  - *Depends on*: All UI tasks
  - *Effort*: 3h

- [ ] **Task 7.3** — Performance testing
  - Load test `/vendedor/desempeno` with 10,000 events
  - Check query execution times (should be <500ms)
  - Identify slow queries and add indices if needed
  - *Depends on*: All metric tasks
  - *Effort*: 2h

---

### Phase 2 (Post-MVP): Optimization & Advanced Features

#### Block 8: Daily Rollup Job (optional for MVP, required for scale)

- [ ] **Task 8.1** — Create `scripts/rollup-daily-metrics.ts` cron job
  - Runs every day at 01:00 AM Santiago time
  - For each active seller: calculate daily aggregates
  - Upsert into `DailyMetricsRollup`
  - Log execution and any errors
  - Deployable on Vercel (via Edge Functions or external cron service)
  - *Depends on*: Task 1.3, 4.1
  - *Effort*: 2h

- [ ] **Task 8.2** — Update metric queries to use rollup if available
  - If querying week/month that's >1 day old, use `DailyMetricsRollup`
  - Fall back to real-time event query for current day
  - Significant speed-up for historical data
  - *Depends on*: Task 8.1
  - *Effort*: 1.5h

---

#### Block 9: PII Management & Compliance

- [ ] **Task 9.1** — Create `scripts/anonymize-pii.ts` cron job
  - Runs daily at 02:00 AM Santiago
  - Find leads older than 90 days with PII
  - Set `phone`, `phoneHash`, `message` to NULL
  - Log anonymization count
  - *Depends on*: Task 1.2
  - *Effort*: 1h

- [ ] **Task 9.2** — Add compliance doc: `docs/data-retention.md`
  - Document PII retention policy
  - Explain LGPD compliance measures
  - Describe anonymization process
  - *Depends on*: Task 9.1
  - *Effort*: 0.5h

---

#### Block 10: Advanced Metrics & Benchmarks (Phase 3+)

- [ ] **Task 10.1** — Create benchmarks by category/cohorte (not MVP)
  - Calculate percentiles: p25, p50, p75, p90
  - Segment by: product category, seller tenure, region
  - Minimum: 50 sellers per segment
  - Display as "You're in top 20% for your category" (future)
  - *Depends on*: 6+ months of data
  - *Effort*: 3h (post-MVP)

---

## Dependency Graph

```
Phase 1 MVP:
┌──────────────────────────────────────────┐
│ 1.1 Schema: SellerEvent                  │
│ 1.2 Schema: Lead + FollowUp              │
│ 1.3 Schema: DailyMetricsRollup           │
│ 1.4 Relations                            │
└───────┬────────────────────────────────┬─┘
        │                                │
        ▼                                ▼
┌────────────────────────┐    ┌──────────────────────────┐
│ 2.1 Event Emission     │    │ 3.1 Lead Creation Action │
│ 2.2 Bot Detection      │    │ 3.2 Consult CTA          │
│ 2.3–2.6 Instrumentation│    │ 3.3 Follow-up Action     │
└────────────┬───────────┘    │ 3.4 Leads Page           │
             │                 └────────────┬─────────────┘
             │                              │
             └──────────────┬───────────────┘
                            ▼
                    ┌─────────────────────────────┐
                    │ 4.1 Metrics Calculation     │
                    │ 4.2 Funnel Data             │
                    │ 4.3 Recommendations         │
                    │ 4.4 Time Utils              │
                    └──────────┬──────────────────┘
                               ▼
                    ┌─────────────────────────────┐
                    │ 5.1–5.7 Dashboard UI        │
                    │ 6.1–6.2 Admin Dashboard     │
                    └──────────┬──────────────────┘
                               ▼
                    ┌─────────────────────────────┐
                    │ 7.1–7.3 Testing             │
                    └─────────────────────────────┘

Phase 2 (Optimization):
                    ┌─────────────────────────────┐
                    │ 8.1–8.2 Daily Rollup        │
                    │ 9.1–9.2 PII Management      │
                    └─────────────────────────────┘
```

## Definition of Done (DoD)

Each task is complete when:

1. **Code**: All changes committed and in PR
2. **Tests**: Unit tests for utility functions; manual testing for UI/features
3. **Docs**: Comments on complex logic; Zod validation messages are clear
4. **Review**: Code reviewed by at least one other dev; no open questions
5. **Deployment**: Mergeable without breaking existing features (backward compatible)
6. **Database**: Migrations are reversible (`down` step exists)
7. **Performance**: Queries <500ms for expected data volumes
8. **Security**: RLS policies in place; no PII logged; Zod validates all inputs
9. **Accessibility**: Mobile responsive; semantic HTML; color contrast WCAG AA

## Effort Estimation Summary

| Block | Tasks | Hours | Notes |
|-------|-------|-------|-------|
| 1. Schema | 1.1–1.4 | 7.5 | DB foundation |
| 2. Event Capture | 2.1–2.6 | 8 | Instrumentation |
| 3. Leads | 3.1–3.4 | 8 | Lead mgmt + UI |
| 4. Metrics | 4.1–4.4 | 10 | Core logic |
| 5. Dashboard UI | 5.1–5.7 | 15.5 | Main dashboard |
| 6. Admin | 6.1–6.2 | 3.5 | Admin view |
| 7. Testing | 7.1–7.3 | 7 | QA |
| **Phase 1 Total** | **26 tasks** | **~59h** | **~2 weeks (1 dev)** |
| 8. Rollup | 8.1–8.2 | 3.5 | Performance |
| 9. PII | 9.1–9.2 | 1.5 | Compliance |
| **Phase 2 Total** | **4 tasks** | **5h** | **3–4 days** |

## MVP vs. Post-MVP Features

**MVP (Fase 1)**: Everything in blocks 1–7 except Task 8 (use on-demand queries instead)

**Post-MVP (Fase 2)**:
- Task 8: Daily rollup for query optimization
- Task 9: PII anonymization cron job
- Task 10 (Phase 3): Benchmarking and percentile rankings

**Disabled in Fase 1**:
- None; all 5 metrics are live but data-dependent
- Recommendations only show after 3 days of data
- Score is marked "unstable" if <5 leads/week

## Integration with Other Specs

**Dependencies**:
- `shopping-cart-checkout`: Must be implemented first (checkout event is critical for conversions)
- `commission-tracking`: No blocking dependency; runs in parallel
- `catalog-selection`: Already implemented; sales-performance integrates seamlessly

**Blocks ordering** (recommended):
1. shopping-cart-checkout (if not done)
2. sales-performance Phase 1 (this spec)
3. Other features in parallel
