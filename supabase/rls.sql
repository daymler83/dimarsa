-- Row Level Security setup (AGENTS.md critical rule: "RLS enabled on all Supabase tables")
-- All app data access goes through Prisma (DATABASE_URL, connected as the `postgres`
-- role, which has BYPASSRLS -- verified via `select rolbypassrls from pg_roles`) or the
-- Supabase service-role client (bypasses RLS by design). The public catalog
-- (src/app/c/[sellerCode]/**) reads products/categories via Prisma too, so these
-- policies are defense-in-depth, not what makes the catalog visible -- if the catalog
-- looks empty, check product/category row counts first, not RLS. The only anon/
-- authenticated-key access today is src/middleware.ts reading the current user's own
-- profile.

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.commissions enable row level security;
alter table public.catalogs enable row level security;
alter table public.catalog_categories enable row level security;
alter table public.catalog_products enable row level security;
alter table public.seller_events enable row level security;
alter table public.leads enable row level security;
alter table public.follow_ups enable row level security;
alter table public.quotations enable row level security;
alter table public.daily_metrics_rollup enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (id = auth.uid());

drop policy if exists "Public can view categories" on public.categories;
create policy "Public can view categories"
  on public.categories for select
  using (true);

drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products"
  on public.products for select
  using (active = true);

-- catalog-selection: active catalogs and their join rows are readable by anyone,
-- same defense-in-depth caveat as above (Prisma bypasses RLS, this is not what
-- makes /c/[sellerCode]/[catalogSlug] work). Writes (create/update/delete catalogs)
-- only happen through admin server actions using Prisma/service role, never anon.
drop policy if exists "Public can view active catalogs" on public.catalogs;
create policy "Public can view active catalogs"
  on public.catalogs for select
  using (is_active = true);

drop policy if exists "Public can view catalog categories" on public.catalog_categories;
create policy "Public can view catalog categories"
  on public.catalog_categories for select
  using (
    exists (
      select 1 from public.catalogs
      where catalogs.id = catalog_categories.catalog_id
        and catalogs.is_active = true
    )
  );

drop policy if exists "Public can view catalog products" on public.catalog_products;
create policy "Public can view catalog products"
  on public.catalog_products for select
  using (
    exists (
      select 1 from public.catalogs
      where catalogs.id = catalog_products.catalog_id
        and catalogs.is_active = true
    )
  );

-- Sales Performance RLS Policies

drop policy if exists "seller_read_own_events" on public.seller_events;
create policy "seller_read_own_events"
  on public.seller_events for select
  using (seller_id = auth.uid());

drop policy if exists "system_insert_events" on public.seller_events;
create policy "system_insert_events"
  on public.seller_events for insert
  with check (true);

drop policy if exists "seller_read_own_leads" on public.leads;
create policy "seller_read_own_leads"
  on public.leads for select
  using (seller_id = auth.uid());

drop policy if exists "seller_update_own_leads" on public.leads;
create policy "seller_update_own_leads"
  on public.leads for update
  using (seller_id = auth.uid());

drop policy if exists "system_insert_leads" on public.leads;
create policy "system_insert_leads"
  on public.leads for insert
  with check (true);

drop policy if exists "seller_read_own_followups" on public.follow_ups;
create policy "seller_read_own_followups"
  on public.follow_ups for select
  using (seller_id = auth.uid());

drop policy if exists "seller_insert_followups" on public.follow_ups;
create policy "seller_insert_followups"
  on public.follow_ups for insert
  with check (seller_id = auth.uid());

drop policy if exists "seller_read_own_rollup" on public.daily_metrics_rollup;
create policy "seller_read_own_rollup"
  on public.daily_metrics_rollup for select
  using (seller_id = auth.uid());

-- Quotations RLS Policies

drop policy if exists "seller_read_own_quotations" on public.quotations;
create policy "seller_read_own_quotations"
  on public.quotations for select
  using (seller_id = auth.uid());

drop policy if exists "seller_insert_quotations" on public.quotations;
create policy "seller_insert_quotations"
  on public.quotations for insert
  with check (seller_id = auth.uid());

drop policy if exists "seller_update_own_quotations" on public.quotations;
create policy "seller_update_own_quotations"
  on public.quotations for update
  using (seller_id = auth.uid());
