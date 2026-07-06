-- Row Level Security setup (AGENTS.md critical rule: "RLS enabled on all Supabase tables")
-- All app data access goes through Prisma (DATABASE_URL, bypasses RLS) or the Supabase
-- service-role client (bypasses RLS by design). The only anon/authenticated-key access
-- today is src/middleware.ts reading the current user's own profile, so that is the only
-- policy required for the app to keep working. Add further policies here as future specs
-- introduce direct Supabase client reads (e.g. public catalog, storage).

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.commissions enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (id = auth.uid());
