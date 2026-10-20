// @vitest-environment node
/**
 * Tests the database schema and its access rules (RLS) against a real
 * Postgres engine. PGlite runs Postgres inside Node, so this needs no Docker
 * and no Supabase project.
 *
 * Supabase normally provides the `anon` and `authenticated` roles and the
 * auth schema; a minimal stand-in for them is created below. A "user" is
 * simulated the way Supabase does it: the request runs as the
 * `authenticated` role with the user's JWT claims in a setting that
 * auth.uid() reads.
 */
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const MIGRATIONS = join(import.meta.dirname, "..", "migrations");

const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema public to anon, authenticated;
  create schema auth;
  grant usage on schema auth to anon, authenticated;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid
  $$;
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
  $$;
`;

const ANDRIJA = "aaaaaaaa-0000-4000-8000-000000000001";
const DAD = "bbbbbbbb-0000-4000-8000-000000000002";
const STRANGER = "cccccccc-0000-4000-8000-000000000003";

let db: PGlite;

type Result =
  | { rows: Record<string, unknown>[]; error?: undefined }
  | { rows?: undefined; error: string };

/** Runs one query as a signed-in user, or as a visitor ("anon"). */
async function as(
  user: string,
  sql: string,
  params: unknown[] = [],
): Promise<Result> {
  const claims =
    user === "anon"
      ? ""
      : JSON.stringify({
          sub: user,
          email: `${user.slice(0, 4)}@example.com`,
          user_metadata: { full_name: `User ${user.slice(0, 4)}` },
        });
  await db.query("select set_config('request.jwt.claims', $1, false)", [
    claims,
  ]);
  await db.exec(`set role ${user === "anon" ? "anon" : "authenticated"}`);
  try {
    const { rows } = await db.query<Record<string, unknown>>(sql, params);
    return { rows };
  } catch (error) {
    return { error: (error as Error).message };
  } finally {
    await db.exec("reset role");
  }
}

/** Counts rows as the database owner, ignoring RLS. */
async function countAll(table: string, where = "true", params: unknown[] = []) {
  const { rows } = await db.query<{ n: number }>(
    `select count(*)::int as n from public.${table} where ${where}`,
    params,
  );
  return rows[0].n;
}

const insertParcel = (number: string, municipality: string, name = "Parcela") =>
  `insert into public.parcels (name, number, municipality, area_ha)
   values ('${name}', '${number}', '${municipality}', 1) returning id`;

beforeAll(async () => {
  db = await PGlite.create();
  await db.exec(SUPABASE_STUB);
  for (const file of readdirSync(MIGRATIONS).sort()) {
    await db.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
  }
  await db.query("insert into auth.users values ($1), ($2), ($3)", [
    ANDRIJA,
    DAD,
    STRANGER,
  ]);
}, 30_000);

describe("households", () => {
  let inviteCode: string;

  it("a user creates a household and becomes its member", async () => {
    const r = await as(
      ANDRIJA,
      "select * from public.create_household('Gazdinstvo Mišić')",
    );
    expect(r.error).toBeUndefined();
    inviteCode = r.rows![0].invite_code as string;
    expect(inviteCode).toMatch(/^[0-9A-F]{12}$/);
  });

  it("a user can't be in two households", async () => {
    const r = await as(
      ANDRIJA,
      "select * from public.create_household('Druga')",
    );
    expect(r.error).toBe("already_member");
  });

  it("a wrong invite code is rejected", async () => {
    const r = await as(DAD, "select * from public.join_household('nope')");
    expect(r.error).toBe("invalid_code");
  });

  it("joining accepts the code in any case and with dashes", async () => {
    const typed = inviteCode
      .toLowerCase()
      .replace(/(.{4})(.{4})(.{4})/, "$1-$2-$3");
    const r = await as(DAD, "select * from public.join_household($1)", [typed]);
    expect(r.error).toBeUndefined();
  });

  it("members see each other's names", async () => {
    const r = await as(
      DAD,
      "select display_name from public.household_members",
    );
    expect(r.rows).toHaveLength(2);
  });

  it("members can rename the household but not set the invite code", async () => {
    expect(
      (await as(DAD, "update public.households set name = 'Mišići'")).error,
    ).toBeUndefined();
    expect(
      (
        await as(
          DAD,
          "update public.households set invite_code = 'AAAAAAAAAAAA'",
        )
      ).error,
    ).toMatch(/permission denied/);
  });

  it("a new invite code makes the old one useless", async () => {
    const r = await as(DAD, "select public.regenerate_invite_code() as code");
    expect(r.rows![0].code).not.toBe(inviteCode);
    const join = await as(STRANGER, "select * from public.join_household($1)", [
      inviteCode,
    ]);
    expect(join.error).toBe("invalid_code");
  });
});

describe("shared data", () => {
  let parcelId: string;
  let seasonId: string;

  it("members add data without sending household_id", async () => {
    const parcel = await as(
      ANDRIJA,
      insertParcel("1243/2", "Pačir", "Kod bunara"),
    );
    parcelId = parcel.rows![0].id as string;
    const season = await as(
      ANDRIJA,
      "insert into public.seasons (parcel_id, year, crop) values ($1, 2026, 'corn') returning id",
      [parcelId],
    );
    seasonId = season.rows![0].id as string;
    const activity = await as(
      ANDRIJA,
      `insert into public.activities (season_id, type, date, product, rate_per_ha, rate_unit)
       values ($1, 'spraying', '2026-06-16', 'Nikosulfuron', 1.25, 'lPerHa')`,
      [seasonId],
    );
    const cost = await as(
      ANDRIJA,
      `insert into public.costs (date, type, currency, total, exchange_rate, total_rsd)
       values ('2026-01-15', 'rent', 'EUR', 120000, 117.2, 14064000)`,
    );
    expect([parcel.error, season.error, activity.error, cost.error]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("other members of the household see and edit it", async () => {
    expect((await as(DAD, "select name from public.parcels")).rows).toEqual([
      { name: "Kod bunara" },
    ]);
    const r = await as(
      DAD,
      "update public.costs set description = 'Zakup' returning id",
    );
    expect(r.rows).toHaveLength(1);
  });

  it("deleting a parcel deletes its seasons and activities", async () => {
    const extra = await as(ANDRIJA, insertParcel("77", "Pačir"));
    const extraId = extra.rows![0].id as string;
    const s = await as(
      ANDRIJA,
      "insert into public.seasons (parcel_id, year, crop) values ($1, 2026, 'wheat') returning id",
      [extraId],
    );
    await as(
      ANDRIJA,
      "insert into public.activities (season_id, type, date) values ($1, 'tillage', '2026-03-01')",
      [s.rows![0].id],
    );
    await as(ANDRIJA, "delete from public.parcels where id = $1", [extraId]);
    expect(await countAll("seasons", "parcel_id = $1", [extraId])).toBe(0);
    expect(
      await countAll("activities", "season_id = $1", [s.rows![0].id]),
    ).toBe(0);
  });
});

describe("isolation between households", () => {
  it("a signed-in user without a household sees nothing", async () => {
    for (const table of [
      "households",
      "household_members",
      "parcels",
      "seasons",
      "activities",
      "costs",
      "incomes",
    ]) {
      const r = await as(
        STRANGER,
        `select count(*)::int as n from public.${table}`,
      );
      expect(r.rows![0].n, table).toBe(0);
    }
  });

  it("a visitor who is not signed in is denied outright", async () => {
    expect((await as("anon", "select * from public.parcels")).error).toMatch(
      /permission denied/,
    );
    expect(
      (await as("anon", "select public.create_household('x')")).error,
    ).toMatch(/permission denied/);
  });

  it("another household can't read, change or delete the data", async () => {
    await as(STRANGER, "select * from public.create_household('Komšije')");
    expect(
      (await as(STRANGER, "select * from public.parcels")).rows,
    ).toHaveLength(0);
    await as(STRANGER, "update public.parcels set name = 'hacked'");
    await as(STRANGER, "delete from public.costs");
    expect(await countAll("parcels", "name = 'hacked'")).toBe(0);
    expect(await countAll("costs")).toBe(1);
  });

  it("another household can't write into it, even by sending its id", async () => {
    const { rows } = await db.query<{ household_id: string }>(
      "select household_id from public.household_members where user_id = $1",
      [ANDRIJA],
    );
    const theirs = rows[0].household_id;
    const r = await as(
      STRANGER,
      `insert into public.costs (household_id, date, type, currency, total, total_rsd)
       values ($1, '2026-01-01', 'fuel', 'RSD', 1, 1)`,
      [theirs],
    );
    expect(r.error).toMatch(/row-level security/);
  });

  it("a season can't be attached to another household's parcel", async () => {
    const parcelId = (
      await db.query<{ id: string }>("select id from public.parcels limit 1")
    ).rows[0].id;
    const r = await as(
      STRANGER,
      "insert into public.seasons (parcel_id, year, crop) values ($1, 2027, 'corn')",
      [parcelId],
    );
    expect(r.error).toMatch(/foreign key/);
  });

  it("a member who leaves loses access, and can't remove others", async () => {
    const kick = await as(
      ANDRIJA,
      "delete from public.household_members where user_id <> auth.uid() returning user_id",
    );
    expect(kick.rows).toHaveLength(0);
    await as(
      DAD,
      "delete from public.household_members where user_id = auth.uid()",
    );
    expect((await as(DAD, "select * from public.parcels")).rows).toHaveLength(
      0,
    );
  });
});

describe("data rules", () => {
  it.each([
    ["1243/2", "Pačir", "the exact same parcel"],
    ["1243 / 2", "PACIR", "spacing, case and diacritics"],
  ])(
    "rejects a duplicate parcel number: %s in %s (%s)",
    async (number, municipality) => {
      const r = await as(ANDRIJA, insertParcel(number, municipality));
      expect(r.error).toMatch(/parcels_number_municipality_key/);
    },
  );

  it("treats đ and dj as the same letter", async () => {
    await as(ANDRIJA, insertParcel("5", "Đurđevo"));
    expect((await as(ANDRIJA, insertParcel("5", "djurdjevo"))).error).toMatch(
      /duplicate key/,
    );
  });

  it("allows the same number in another municipality", async () => {
    expect(
      (await as(ANDRIJA, insertParcel("1243/2", "Njegoševo"))).error,
    ).toBeUndefined();
  });

  it("allows only one season per parcel per year", async () => {
    const parcelId = (
      await as(
        ANDRIJA,
        "select id from public.parcels where name = 'Kod bunara'",
      )
    ).rows![0].id;
    const r = await as(
      ANDRIJA,
      "insert into public.seasons (parcel_id, year, crop) values ($1, 2026, 'wheat')",
      [parcelId],
    );
    expect(r.error).toMatch(/seasons_parcel_id_year_key/);
  });

  it("rejects unknown codes", async () => {
    const r = await as(
      ANDRIJA,
      "insert into public.costs (date, type, currency, total, total_rsd) values ('2026-01-01', 'banana', 'RSD', 1, 1)",
    );
    expect(r.error).toMatch(/check constraint/);
  });

  it("requires an exchange rate for EUR amounts", async () => {
    const r = await as(
      ANDRIJA,
      "insert into public.costs (date, type, currency, total, total_rsd) values ('2026-01-01', 'rent', 'EUR', 100, 11720)",
    );
    expect(r.error).toMatch(/check constraint/);
  });
});

describe("replace_household_data", () => {
  const payload = (crop: string) =>
    JSON.stringify({
      parcels: [
        {
          id: "11111111-0000-4000-8000-000000000001",
          name: "Uvezena",
          number: "900",
          municipality: "Pačir",
          area_ha: 3.5,
        },
      ],
      seasons: [
        {
          id: "22222222-0000-4000-8000-000000000001",
          parcel_id: "11111111-0000-4000-8000-000000000001",
          year: 2026,
          crop,
        },
      ],
      activities: [],
      costs: [
        {
          id: "33333333-0000-4000-8000-000000000001",
          date: "2026-05-01",
          type: "fuel",
          currency: "RSD",
          total: 500,
          total_rsd: 500,
        },
      ],
      incomes: [],
    });

  it("replaces all of the household's data", async () => {
    const r = await as(
      ANDRIJA,
      "select public.replace_household_data($1::jsonb)",
      [payload("corn")],
    );
    expect(r.error).toBeUndefined();
    const parcels = await as(ANDRIJA, "select name from public.parcels");
    expect(parcels.rows).toEqual([{ name: "Uvezena" }]);
    const costs = await as(ANDRIJA, "select total from public.costs");
    expect(costs.rows).toHaveLength(1);
  });

  it("changes nothing when any part is invalid", async () => {
    const r = await as(
      ANDRIJA,
      "select public.replace_household_data($1::jsonb)",
      [payload("banana")],
    );
    expect(r.error).toMatch(/check constraint/);
    const parcels = await as(ANDRIJA, "select name from public.parcels");
    expect(parcels.rows).toEqual([{ name: "Uvezena" }]);
  });

  it("only touches the caller's own household", async () => {
    await as(STRANGER, insertParcel("1", "Komšijska"));
    expect(await countAll("parcels", "municipality = 'Komšijska'")).toBe(1);
    await as(STRANGER, "select public.replace_household_data('{}'::jsonb)");
    expect(await countAll("parcels", "municipality = 'Komšijska'")).toBe(0);
    expect((await as(ANDRIJA, "select name from public.parcels")).rows).toEqual(
      [{ name: "Uvezena" }],
    );
  });

  it("refuses users without a household and visitors", async () => {
    expect(
      (await as(DAD, "select public.replace_household_data('{}'::jsonb)"))
        .error,
    ).toBe("not_member");
    expect(
      (await as("anon", "select public.replace_household_data('{}'::jsonb)"))
        .error,
    ).toMatch(/permission denied/);
  });
});
