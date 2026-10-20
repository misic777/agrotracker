-- Replaces all farm data of the caller's household in one transaction:
-- either everything is replaced, or (on any error) nothing changes.
-- Used for importing a JSON backup and for uploading the data a user
-- already had in their browser.
--
-- SECURITY INVOKER (the default): it runs with the caller's rights, so the
-- usual RLS rules apply to every delete and insert. household_id is not
-- sent; the column default fills in the caller's household.
--
-- payload: { "parcels": [...], "seasons": [...], "activities": [...],
--            "costs": [...], "incomes": [...] } with database column names.

create function public.replace_household_data(payload jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  household uuid := private.my_household_id();
begin
  if household is null then
    raise exception 'not_member';
  end if;

  -- Seasons and activities go with their parcels (on delete cascade).
  delete from public.parcels where household_id = household;
  delete from public.costs where household_id = household;
  delete from public.incomes where household_id = household;

  insert into public.parcels (id, name, number, municipality, area_ha, note)
  select id, name, number, municipality, area_ha, note
  from jsonb_populate_recordset(null::public.parcels, coalesce(payload -> 'parcels', '[]'));

  insert into public.seasons (id, parcel_id, year, crop, hybrid, yield_kg, note)
  select id, parcel_id, year, crop, hybrid, yield_kg, note
  from jsonb_populate_recordset(null::public.seasons, coalesce(payload -> 'seasons', '[]'));

  insert into public.activities (id, season_id, type, date, product, rate_per_ha, rate_unit, note)
  select id, season_id, type, date, product, rate_per_ha, rate_unit, note
  from jsonb_populate_recordset(null::public.activities, coalesce(payload -> 'activities', '[]'));

  insert into public.costs (id, date, type, description, quantity, unit, unit_price,
                            currency, total, exchange_rate, total_rsd)
  select id, date, type, coalesce(description, ''), quantity, unit, unit_price,
         currency, total, exchange_rate, total_rsd
  from jsonb_populate_recordset(null::public.costs, coalesce(payload -> 'costs', '[]'));

  insert into public.incomes (id, date, kind, description, crop, quantity_kg, price_per_kg,
                              buyer, currency, total, exchange_rate, total_rsd)
  select id, date, kind, description, crop, quantity_kg, price_per_kg,
         buyer, currency, total, exchange_rate, total_rsd
  from jsonb_populate_recordset(null::public.incomes, coalesce(payload -> 'incomes', '[]'));
end;
$$;

revoke execute on function public.replace_household_data(jsonb) from public, anon;
grant execute on function public.replace_household_data(jsonb) to authenticated;
