-- AgroTracker: initial schema and access rules.
--
-- Every farm table has a household_id. Row Level Security (RLS) lets a
-- signed-in user read and change only the rows of the household they belong
-- to. The publishable key in the frontend is public, so these rules are what
-- actually protects the data.
--
-- Conventions:
--   * Money is bigint in minor units (para / euro cents), as in the app.
--   * Codes ("corn", "fuel"...) are text with a CHECK, so adding a new crop
--     later is one small migration.
--   * ids are uuids. The app may send its own (crypto.randomUUID()), which
--     lets the UI show a new row before the server answers.

-- Helpers live in a schema that the API does not expose.
create schema if not exists private;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Households and members
-- ---------------------------------------------------------------------------

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 100),
  -- 12 random hex characters, shared over Viber to let someone join.
  invite_code text not null unique
    default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  -- unique: a user belongs to at most one household.
  user_id uuid not null unique references auth.users (id) on delete cascade,
  -- Copied from the Google account on join, so members can see who is who
  -- (the auth.users table itself is not readable from the app).
  email text,
  display_name text,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- The household of the signed-in user, or null.
-- SECURITY DEFINER: it reads household_members without RLS, otherwise the
-- policy on household_members would call itself forever.
create function private.my_household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id from public.household_members where user_id = auth.uid()
$$;

revoke execute on function private.my_household_id() from public;
grant execute on function private.my_household_id() to authenticated;

-- Same normalization as normalizeKey() in src/lib/parcels.ts: trimmed,
-- lower case, Serbian diacritics removed (đ -> dj), single spaces.
-- Both cases are listed so the result doesn't depend on the database locale.
create function private.normalize_key(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select regexp_replace(
    lower(translate(
      replace(replace(trim(value), 'Đ', 'dj'), 'đ', 'dj'),
      'ČĆŠŽčćšž',
      'ccszccsz'
    )),
    '\s+', ' ', 'g'
  )
$$;

-- ---------------------------------------------------------------------------
-- Farm data
-- ---------------------------------------------------------------------------
-- household_id defaults to the user's own household, so the app never has
-- to send it. The RLS "with check" still verifies it on every write.

create table public.parcels (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default private.my_household_id()
    references public.households (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  number text not null check (length(trim(number)) between 1 and 50),
  municipality text not null check (length(trim(municipality)) between 1 and 100),
  area_ha numeric(10, 4) not null check (area_ha > 0),
  note text,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  -- Lets seasons point at (parcel, household) together, see below.
  unique (id, household_id)
);

-- A parcel number is unique within a cadastral municipality, per household:
-- "1243 / 2" in "pacir" is the same parcel as "1243/2" in "Pačir".
create unique index parcels_number_municipality_key on public.parcels (
  household_id,
  replace(private.normalize_key(number), ' ', ''),
  private.normalize_key(municipality)
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default private.my_household_id(),
  parcel_id uuid not null,
  year integer not null check (year between 1990 and 2100),
  crop text not null check (crop in (
    'wheat', 'corn', 'sunflower', 'soybean', 'rapeseed', 'barley', 'clover', 'other'
  )),
  hybrid text,
  yield_kg numeric(12, 2) check (yield_kg >= 0),
  note text,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  -- One season per parcel per year.
  unique (parcel_id, year),
  unique (id, household_id),
  -- Composite key: a season can only belong to a parcel of the same
  -- household, so no one can attach data to someone else's parcel.
  foreign key (parcel_id, household_id)
    references public.parcels (id, household_id) on delete cascade
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default private.my_household_id(),
  season_id uuid not null,
  type text not null check (type in (
    'tillage', 'sowing', 'fertilizing', 'spraying', 'harvest', 'other'
  )),
  date date not null,
  product text,
  rate_per_ha numeric(10, 3) check (rate_per_ha > 0),
  rate_unit text check (rate_unit in ('kgPerHa', 'lPerHa')),
  note text,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  foreign key (season_id, household_id)
    references public.seasons (id, household_id) on delete cascade
);

create index activities_season_id_idx on public.activities (season_id);

create table public.costs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default private.my_household_id()
    references public.households (id) on delete cascade,
  date date not null,
  type text not null check (type in (
    'fuel', 'seed', 'fertilizer', 'pesticide', 'machineMaintenance',
    'services', 'rent', 'other'
  )),
  description text not null default '',
  quantity numeric(14, 3) check (quantity >= 0),
  unit text check (unit in ('kg', 'l', 'pcs')),
  unit_price bigint check (unit_price >= 0),
  currency text not null check (currency in ('RSD', 'EUR')),
  total bigint not null check (total >= 0),
  exchange_rate numeric(12, 4) check (exchange_rate > 0),
  total_rsd bigint not null check (total_rsd >= 0),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  -- EUR amounts always carry the exchange rate they were converted with.
  check (currency = 'RSD' or exchange_rate is not null)
);

create index costs_household_date_idx on public.costs (household_id, date);

create table public.incomes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default private.my_household_id()
    references public.households (id) on delete cascade,
  date date not null,
  kind text not null check (kind in ('sale', 'subsidy', 'other')),
  description text,
  crop text check (crop in (
    'wheat', 'corn', 'sunflower', 'soybean', 'rapeseed', 'barley', 'clover', 'other'
  )),
  quantity_kg numeric(14, 2) check (quantity_kg >= 0),
  price_per_kg bigint check (price_per_kg >= 0),
  buyer text,
  currency text not null check (currency in ('RSD', 'EUR')),
  total bigint not null check (total >= 0),
  exchange_rate numeric(12, 4) check (exchange_rate > 0),
  total_rsd bigint not null check (total_rsd >= 0),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  check (currency = 'RSD' or exchange_rate is not null)
);

create index incomes_household_date_idx on public.incomes (household_id, date);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- No policy for "anon": a visitor who is not signed in sees nothing.
-- "(select private.my_household_id())" is wrapped in a select so Postgres
-- runs it once per query instead of once per row.

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.parcels enable row level security;
alter table public.seasons enable row level security;
alter table public.activities enable row level security;
alter table public.costs enable row level security;
alter table public.incomes enable row level security;

create policy "Members can read their household"
  on public.households for select to authenticated
  using (id = (select private.my_household_id()));

create policy "Members can rename their household"
  on public.households for update to authenticated
  using (id = (select private.my_household_id()))
  with check (id = (select private.my_household_id()));

create policy "Members can see each other"
  on public.household_members for select to authenticated
  using (household_id = (select private.my_household_id()));

create policy "Members can leave"
  on public.household_members for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "Household members have full access"
  on public.parcels for all to authenticated
  using (household_id = (select private.my_household_id()))
  with check (household_id = (select private.my_household_id()));

create policy "Household members have full access"
  on public.seasons for all to authenticated
  using (household_id = (select private.my_household_id()))
  with check (household_id = (select private.my_household_id()));

create policy "Household members have full access"
  on public.activities for all to authenticated
  using (household_id = (select private.my_household_id()))
  with check (household_id = (select private.my_household_id()));

create policy "Household members have full access"
  on public.costs for all to authenticated
  using (household_id = (select private.my_household_id()))
  with check (household_id = (select private.my_household_id()));

create policy "Household members have full access"
  on public.incomes for all to authenticated
  using (household_id = (select private.my_household_id()))
  with check (household_id = (select private.my_household_id()));

-- ---------------------------------------------------------------------------
-- Table privileges
-- ---------------------------------------------------------------------------
-- Privileges say WHICH operations a role may try; the policies above say on
-- WHICH rows. Everything is granted explicitly, so this works whether or not
-- the project exposes new tables automatically.

revoke all on public.households, public.household_members, public.parcels,
  public.seasons, public.activities, public.costs, public.incomes
  from anon, authenticated;

-- Visitors who are not signed in get nothing at all.
-- Members: households can only be renamed directly; creating, joining and
-- new invite codes go through the functions below.
grant select on public.households to authenticated;
grant update (name) on public.households to authenticated;
grant select, delete on public.household_members to authenticated;
grant select, insert, update, delete on public.parcels, public.seasons,
  public.activities, public.costs, public.incomes to authenticated;

-- ---------------------------------------------------------------------------
-- Functions the app calls (supabase.rpc(...))
-- ---------------------------------------------------------------------------
-- They run as the database owner (SECURITY DEFINER) because a user who is
-- not a member yet can't see any household. Each one checks auth.uid()
-- itself. Errors use short codes that the app translates.

create function public.create_household(household_name text)
returns public.households
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.households;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  if exists (select 1 from public.household_members where user_id = auth.uid()) then
    raise exception 'already_member';
  end if;

  insert into public.households (name)
  values (trim(household_name))
  returning * into result;

  insert into public.household_members (household_id, user_id, email, display_name)
  values (
    result.id,
    auth.uid(),
    auth.jwt() ->> 'email',
    coalesce(
      auth.jwt() -> 'user_metadata' ->> 'full_name',
      auth.jwt() -> 'user_metadata' ->> 'name'
    )
  );

  return result;
end;
$$;

create function public.join_household(code text)
returns public.households
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.households;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  if exists (select 1 from public.household_members where user_id = auth.uid()) then
    raise exception 'already_member';
  end if;

  -- Accept "a1b2-c3d4-e5f6" as well as "A1B2C3D4E5F6".
  select * into result
  from public.households
  where invite_code = upper(regexp_replace(code, '[^0-9A-Za-z]', '', 'g'));

  if not found then
    raise exception 'invalid_code';
  end if;

  insert into public.household_members (household_id, user_id, email, display_name)
  values (
    result.id,
    auth.uid(),
    auth.jwt() ->> 'email',
    coalesce(
      auth.jwt() -> 'user_metadata' ->> 'full_name',
      auth.jwt() -> 'user_metadata' ->> 'name'
    )
  );

  return result;
end;
$$;

-- Replaces the invite code, e.g. if it was sent to the wrong person.
create function public.regenerate_invite_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  household uuid := private.my_household_id();
  new_code text;
begin
  if household is null then
    raise exception 'not_member';
  end if;

  update public.households
  set invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
  where id = household
  returning invite_code into new_code;

  return new_code;
end;
$$;

revoke execute on function public.create_household(text) from public, anon;
revoke execute on function public.join_household(text) from public, anon;
revoke execute on function public.regenerate_invite_code() from public, anon;
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.join_household(text) to authenticated;
grant execute on function public.regenerate_invite_code() to authenticated;
