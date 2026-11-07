/**
 * Stackra file contract:
 * Purpose: integration tests of `assertRowSecurity` on a real Postgres: a table under forced row-level security with
 *          its one owner policy and a restrictive policy named after its column passes, with no row seeded by the
 *          test (the audit seeds both owners itself, past a check constraint and a NOT NULL column); a table without
 *          the owner column is a warning naming its group (ancestor scope_path, scope_id on the setting, no RLS,
 *          unclassified) and a failure in strict mode, a listed one passes, and a listing with no reason or of an owned
 *          table fails; a table without row-level security, a second permissive policy, a misnamed restrictive
 *          policy, a leaking policy, an unseedable key and a role that bypasses row-level security are each reported,
 *          whatever the mode.
 * Boundary: test only; integration tier (Docker through `usePostgres`). Every test drops the tables it adds.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (integration tier); ADR 0239 (decision 1); ADR 0347
 *                     (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { assertRowSecurity } from "#testing/functions/assert-row-security.function";
import { usePostgres } from "#testing/use-postgres";

/** The owner equality on `table`. */
const ownerPolicy = (table: string, check = `"owner_id" = current_setting('app.owner_id', true)`) =>
  `create policy "pol_${table}_owner_id" on "notes"."${table}" using (${check})`;

/** An owned table: key without a default, a checked NOT NULL column, forced row-level security. */
const ownedTable = (table: string) => [
  `create table "notes"."${table}" ("id" varchar(33) primary key, "owner_id" text not null, "kind" text not null check ("kind" in ('memo', 'todo')))`,
  `alter table "notes"."${table}" enable row level security`,
  `alter table "notes"."${table}" force row level security`,
];

const postgres = usePostgres({
  migrations: [
    {
      after: [],
      steps: [
        {
          transactional: true,
          inverse: false,
          sql: [
            'create schema "notes"',
            ...ownedTable("notes"),
            ownerPolicy("notes"),
            // The ADR 0347 shape: an unset setting sees the whole owner, so a seeded row with no kind stays visible.
            `create policy "pol_notes_kind" on "notes"."notes" as restrictive using (current_setting('app.kind', true) is null or "kind" = current_setting('app.kind', true))`,
          ],
        },
      ],
    },
  ],
});

const OPTIONS = {
  column: "owner_id",
  setting: "app.owner_id",
  role: "probe_app",
  probe: ["own_a", "own_b"],
  strict: false,
} as const;

/** One table without the owner column per group: ancestor scope_path, scope_id on the setting, no RLS, other. */
const UNOWNED_TABLES = ["ancestors", "oddities", "scoped", "tags"];
const UNOWNED = [
  'create table "notes"."ancestors" ("id" int primary key, "scope_path" text not null)',
  'alter table "notes"."ancestors" enable row level security',
  `create policy "pol_ancestors_scope_path" on "notes"."ancestors" using ("scope_path" like current_setting('app.scope_paths', true) || '%')`,
  'create table "notes"."scoped" ("id" int primary key, "scope_id" text)',
  'alter table "notes"."scoped" enable row level security',
  `create policy "pol_scoped_scope_id" on "notes"."scoped" using ("scope_id" is not distinct from current_setting('app.owner_id', true))`,
  'create table "notes"."tags" ("id" int primary key)',
  'create table "notes"."oddities" ("id" int primary key)',
  'alter table "notes"."oddities" enable row level security',
];

/** Runs `check` with extra tables made by `sql`, then drops them. */
async function withTables(
  tables: readonly string[],
  sql: readonly string[],
  check: () => Promise<void>,
): Promise<void> {
  const em = postgres.database.em();
  for (const statement of sql) await em.execute(statement);
  try {
    await check();
  } finally {
    for (const table of tables) await em.execute(`drop table "notes"."${table}"`);
  }
}

describe("assertRowSecurity", () => {
  it("passes an owned table, seeding a row of each owner itself", async () => {
    await expect(assertRowSecurity(postgres.database, OPTIONS)).resolves.toEqual([]);
    const [left] = (await postgres.database
      .em()
      .execute('select count(*)::int as count from "notes"."notes"')) as { count: number }[];
    expect(left?.count).toBe(0);
  });

  it("warns, with its group, about each unlisted table without the owner column", async () => {
    await withTables(UNOWNED_TABLES, UNOWNED, async () => {
      const warnings = await assertRowSecurity(postgres.database, OPTIONS);
      expect(warnings).toHaveLength(4);
      expect(warnings).toEqual([
        expect.stringMatching(
          /^notes\.ancestors has no owner_id column and is not a platform table \(an ancestor scope_path table awaiting the contract step\)/,
        ),
        expect.stringMatching(
          /^notes\.oddities has no owner_id column and is not a platform table \(unclassified\)/,
        ),
        expect.stringMatching(
          /^notes\.scoped has no owner_id column and is not a platform table \(a scope_id table whose policy reads app\.owner_id\)/,
        ),
        expect.stringMatching(
          /^notes\.tags has no owner_id column and is not a platform table \(a system table with no row-level security, awaiting its ADR decision\)/,
        ),
      ]);
    });
  });

  it("fails each unlisted table without the owner column in strict mode", async () => {
    await withTables(UNOWNED_TABLES, UNOWNED, async () => {
      const audit = assertRowSecurity(postgres.database, { ...OPTIONS, strict: true });
      for (const table of UNOWNED_TABLES)
        await expect(audit).rejects.toThrow(
          new RegExp(`notes\\.${table} has no owner_id column and is not a platform table`),
        );
    });
  });

  it("accepts a listed table, and fails a listing with no reason or of an owned table", async () => {
    await withTables(["tags"], ['create table "notes"."tags" ("id" int primary key)'], async () => {
      const platform = new Map([["notes.tags", "shared labels, not owner data"]]);
      await expect(assertRowSecurity(postgres.database, { ...OPTIONS, platform })).resolves.toEqual(
        [],
      );
      await expect(
        assertRowSecurity(postgres.database, {
          ...OPTIONS,
          platform: new Map([["notes.tags", " "]]),
        }),
      ).rejects.toThrow(/notes\.tags is listed as a platform table with no reason/);
    });
    await expect(
      assertRowSecurity(postgres.database, {
        ...OPTIONS,
        platform: new Map([["notes.notes", "wrongly listed"]]),
      }),
    ).rejects.toThrow(/notes\.notes is listed as a platform table but holds owner_id/);
  });

  it("reports a table without row-level security or its policy", async () => {
    await withTables(
      ["open_notes"],
      ['create table "notes"."open_notes" ("id" int primary key, "owner_id" text)'],
      async () => {
        const audit = assertRowSecurity(postgres.database, OPTIONS);
        await expect(audit).rejects.toThrow(/notes\.open_notes does not enable row-level security/);
        await expect(audit).rejects.toThrow(
          /notes\.open_notes has no policy pol_open_notes_owner_id/,
        );
      },
    );
  });

  it("reports a second permissive policy and a misnamed restrictive one", async () => {
    await withTables(
      ["wide_notes"],
      [
        ...ownedTable("wide_notes"),
        ownerPolicy("wide_notes"),
        `create policy "pol_wide_notes_kind" on "notes"."wide_notes" for select using ("kind" = 'memo')`,
        `create policy "narrow" on "notes"."wide_notes" as restrictive using (true)`,
      ],
      async () => {
        const audit = assertRowSecurity(postgres.database, OPTIONS);
        await expect(audit).rejects.toThrow(
          /notes\.wide_notes: pol_wide_notes_kind is a second permissive policy/,
        );
        await expect(audit).rejects.toThrow(
          /notes\.wide_notes: restrictive policy narrow is not named pol_wide_notes_<column>/,
        );
      },
    );
  });

  it("reports a policy that is not the owner equality, and the other owner's seeded row it lets through", async () => {
    await withTables(
      ["leaky_notes"],
      [...ownedTable("leaky_notes"), ownerPolicy("leaky_notes", "true")],
      async () => {
        const audit = assertRowSecurity(postgres.database, OPTIONS);
        await expect(audit).rejects.toThrow(
          /notes\.leaky_notes: pol_leaky_notes_owner_id is not the owner equality/,
        );
        await expect(audit).rejects.toThrow(
          /notes\.leaky_notes: a probe as own_a saw 1 rows of other owners/,
        );
        await expect(audit).rejects.toThrow(
          /notes\.leaky_notes: a probe with app\.owner_id unset saw 2 rows/,
        );
      },
    );
  });

  it("reports an owned table it cannot seed", async () => {
    await withTables(
      ["host_notes"],
      [
        'create table "notes"."host_notes" ("id" inet primary key, "owner_id" text not null)',
        'alter table "notes"."host_notes" enable row level security',
        'alter table "notes"."host_notes" force row level security',
        ownerPolicy("host_notes"),
      ],
      async () => {
        await expect(assertRowSecurity(postgres.database, OPTIONS)).rejects.toThrow(
          /notes\.host_notes: could not seed a row of each probe owner.*no seed value for key id \(inet\)/,
        );
      },
    );
  });

  it("reports a role that bypasses row-level security", async () => {
    await postgres.database.em().execute('create role "bypass_app" nologin bypassrls');
    await expect(
      assertRowSecurity(postgres.database, { ...OPTIONS, role: "bypass_app" }),
    ).rejects.toThrow(/role bypass_app has BYPASSRLS/);
  });
});
